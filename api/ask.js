/**
 * /api/ask — NotebookLM-style synthesis endpoint.
 *
 * Pipeline:
 *   1. User submits a founder question (POST body { query }).
 *   2. Retrieve top-N relevant transcript chunks from Algolia.
 *   3. Send chunks + question to Claude API with a synthesis prompt.
 *   4. Stream the synthesized markdown answer back, with inline [N] citations
 *      that map to the sources list.
 *
 * Environment variables (set in Vercel project settings):
 *   - ANTHROPIC_API_KEY       — Anthropic API key (sk-ant-…)
 *   - ALGOLIA_SEARCH_KEY      — Algolia search-only key (browser-safe; we keep
 *                                a copy here so the function doesn't depend on
 *                                client-side state)
 *
 * Runtime: Edge — low latency, streamed responses, no Node-only deps.
 */

export const config = {
  runtime: 'edge',
  regions: ['syd1', 'iad1'], // close to Thea (Sydney) + closer to Anthropic (Iowa)
};

const ALGOLIA_APP_ID = 'G2C3CUY2G8';
const ALGOLIA_INDEX  = 'fim_episodes';
const HITS_PER_PAGE  = 8;
const MAX_QUERY_LEN  = 500;

// Use the smaller, faster, cheaper model. Quality is plenty for "summarize 8
// transcript chunks into a 250-word cited answer." Upgrade to claude-sonnet-4-5
// if you want richer synthesis.
const CLAUDE_MODEL   = 'claude-haiku-4-5';

const SYSTEM_PROMPT = `You are answering a founder's question by synthesizing insights from the Founders In Motion podcast — interviews with early-stage founders by Thea Ngo (an early-stage investor).

The user will see your answer rendered as markdown, followed by a list of sources. Your job is to give them a clear, direct, useful answer drawn from the transcript excerpts provided.

Rules:
- Cite sources inline using [N] notation matching the numbered excerpts. Place citations immediately after the claim they support: "Shakeel raised before having an idea [1]."
- Be specific. Use real founder names, numbers, and outcomes from the excerpts.
- Don't hedge or use phrases like "based on the transcripts." Just answer.
- If the excerpts don't actually answer the question, say so honestly in one sentence, then briefly describe what the archive DOES cover that's adjacent.
- Use the founder's exact words in quotes when especially powerful.
- Format with markdown: **bold** for key claims, lists where appropriate, no headings (the answer is short enough).
- Length: 150–350 words. Tight.
- Do NOT add a "Sources:" section — the UI shows it separately.
- Do NOT use phrases like "as discussed in episode X" — just cite with [N].`;

async function searchAlgolia(query, searchKey) {
  const url = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
  const params = new URLSearchParams({
    query,
    hitsPerPage: String(HITS_PER_PAGE),
    attributesToSnippet: 'chunk_text:60',
    snippetEllipsisText: '…',
    removeWordsIfNoResults: 'lastWords',
  }).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'X-Algolia-API-Key': searchKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify({ params }),
  });
  if (!res.ok) throw new Error(`Algolia ${res.status}: ${await res.text()}`);
  return res.json();
}

function buildSources(hits) {
  return hits.map((h, i) => ({
    n: i + 1,
    episode_number: h.episode_number,
    guest_name: h.guest_name,
    guest_company: h.guest_company,
    slug: h.slug,
    has_episode_page: !!h.has_episode_page,
    spotify_url: h.spotify_url || null,
    title: (h.title || '').split(' | ')[0].trim(),
  }));
}

function buildContextBlock(hits) {
  return hits.map((h, i) => {
    // Cap chunk length to avoid blowing past token budget — most chunks are
    // ~1500 chars; trim to ~1200 chars of natural text.
    const text = (h.chunk_text || '').slice(0, 1200).replace(/\s+/g, ' ').trim();
    return `[${i + 1}] EP${h.episode_number} ${h.guest_name} (${h.guest_company}) on "${(h.title || '').split(' | ')[0]}":
"${text}"`;
  }).join('\n\n');
}

async function streamFromClaude({ apiKey, query, contextBlock }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      stream: true,
      system: [
        // Prompt caching on the static system prompt — same prompt every call,
        // cached after first hit. Cuts the input cost by ~75% on repeat calls.
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{
        role: 'user',
        content: `Question: ${query}

Numbered transcript excerpts (use [N] inline citations):

${contextBlock}

Synthesize a clear answer to the question, citing the excerpts inline.`,
      }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude ${res.status}: ${errText}`);
  }
  return res.body;
}

/**
 * Parse Anthropic SSE stream and emit just the text deltas as a fresh SSE
 * stream the browser EventSource can consume.
 *
 * Anthropic stream events we care about:
 *   - content_block_delta { delta: { type: "text_delta", text: "..." } }
 *   - message_stop
 */
function pipeClaudeToSse(claudeStream) {
  const reader = claudeStream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      // SSE events are separated by \n\n
      const events = buffer.split(/\n\n/);
      buffer = events.pop() || '';
      for (const evt of events) {
        const dataLine = evt.split('\n').find(l => l.startsWith('data: '));
        if (!dataLine) continue;
        const json = dataLine.slice(6).trim();
        if (!json || json === '[DONE]') continue;
        try {
          const obj = JSON.parse(json);
          if (obj.type === 'content_block_delta' && obj.delta?.type === 'text_delta') {
            const chunk = obj.delta.text || '';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: chunk })}\n\n`));
          } else if (obj.type === 'message_stop') {
            // we'll send "done" on the upstream end
          } else if (obj.type === 'error') {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: obj.error?.message || 'Claude error' })}\n\n`));
          }
        } catch {
          // Ignore JSON-parse failures from partial events
        }
      }
    },
  });
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const algoliaKey   = process.env.ALGOLIA_SEARCH_KEY;
  if (!anthropicKey || !algoliaKey) {
    return new Response(JSON.stringify({
      error: 'Server not configured. Set ANTHROPIC_API_KEY and ALGOLIA_SEARCH_KEY in Vercel env vars.',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const query = (body?.query || '').toString().trim().slice(0, MAX_QUERY_LEN);
  if (!query) {
    return new Response(JSON.stringify({ error: 'Empty query' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Step 1: retrieve
  let algoliaData;
  try {
    algoliaData = await searchAlgolia(query, algoliaKey);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
  const hits = algoliaData.hits || [];
  const sources = buildSources(hits);

  // If nothing matched, return a graceful empty response (no Claude call).
  if (hits.length === 0) {
    return new Response(JSON.stringify({
      answer: "I couldn't find any episodes covering that question. The archive's strongest coverage is customer discovery, pre-seed and seed fundraising, pivots and rebuilds, product-market fit, and founder mental health. Try rephrasing in those terms?",
      sources: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const contextBlock = buildContextBlock(hits);

  // Step 2: synthesize via Claude (streamed)
  let claudeStream;
  try {
    claudeStream = await streamFromClaude({ apiKey: anthropicKey, query, contextBlock });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message || err), sources }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Step 3: stream back to client as SSE
  // First send the sources block in the initial event so client can render the
  // skeleton, then stream text deltas.
  const encoder = new TextEncoder();
  const upstream = pipeClaudeToSse(claudeStream);
  const reader = upstream.getReader();
  const sseStream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: sources\ndata: ${JSON.stringify({ sources })}\n\n`));
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
  });

  return new Response(sseStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
