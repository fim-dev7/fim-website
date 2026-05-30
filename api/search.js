/**
 * /api/search — semantic search via Claude reranking.
 *
 * Pipeline:
 *   1. Load qa-index.json (one entry per canonical /questions/<slug>/ page).
 *   2. Send the full index + user's query to Claude Haiku 4.5 with a tight
 *      prompt: "rank these by which best matches the user's intent. Return
 *      JSON with one `best` slug and 2-3 `related` slugs."
 *   3. Look up the chosen slugs in the index and return their full entries.
 *   4. Client renders top match as hero card + related cards. Click → static
 *      /questions/<slug>/ page.
 *
 * Why this works: the Q&A index for the whole archive is small (~50-200
 * entries, ~10-40K tokens). Claude reads it all once per query and ranks
 * by intent, not keywords. Prompt caching makes the static index nearly
 * free after the first call.
 *
 * Environment variable:
 *   - ANTHROPIC_API_KEY — set in Vercel project settings (Production + Preview)
 */

export const config = {
  runtime: 'edge',
  regions: ['syd1', 'iad1'],
};

const MAX_QUERY_LEN = 500;
const TOP_RELATED   = 3;
const CLAUDE_MODEL  = 'claude-haiku-4-5';

let _cachedIndex = null;
let _cacheLoadPromise = null;

async function loadIndex(requestUrl) {
  if (_cachedIndex) return _cachedIndex;
  if (_cacheLoadPromise) return _cacheLoadPromise;
  const origin = new URL(requestUrl).origin;
  _cacheLoadPromise = (async () => {
    const res = await fetch(`${origin}/qa-index.json`, { cf: { cacheTtl: 3600 } });
    if (!res.ok) throw new Error(`qa-index.json ${res.status}`);
    const arr = await res.json();
    _cachedIndex = Array.isArray(arr) ? arr : [];
    return _cachedIndex;
  })();
  return _cacheLoadPromise;
}

function buildIndexBlock(index) {
  return index.map((e, i) =>
    `${i + 1}. slug=${e.slug}
   Q: ${e.question}
   A: ${e.answer}`
  ).join('\n\n');
}

const SYSTEM_PROMPT = `You're the librarian for Founders In Motion — a podcast where Thea Ngo interviews early-stage founders.

Your job: given a user's question and an index of canonical Q&A pages, pick:
  - the SINGLE best match for what the user actually means (not just keywords)
  - up to 3 related Q&As they'd also find useful

Return strict JSON only, no commentary:
{"best": "<slug>", "related": ["<slug>", "<slug>", "<slug>"]}

Rules:
- "best" is the slug of the single most-relevant Q&A
- If NO Q&A meaningfully matches the user's intent, return {"best": null, "related": []}
- "related" should be Q&As that share the founder's actual concern (different angles on the same problem), not just topical neighbours
- Never return slugs that aren't in the index
- Be ruthless about cutting weak matches — better to return 1 great match than 4 mediocre ones`;

async function rerank(query, index, apiKey) {
  const indexBlock = buildIndexBlock(index);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        // The Q&A index is the same every call until sync regenerates it —
        // cache aggressively so we only pay full price ~once per sync cycle.
        { type: 'text', text: `Q&A index:\n\n${indexBlock}`, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: `User's question: ${query}\n\nReturn JSON.` }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  // Be tolerant of any prose around the JSON
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in Claude response');
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    throw new Error(`Bad JSON: ${err.message}`);
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Server not configured. Set ANTHROPIC_API_KEY in Vercel env vars.',
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
    return new Response(JSON.stringify({ hits: [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  let index;
  try { index = await loadIndex(req.url); }
  catch (err) {
    return new Response(JSON.stringify({ error: `Index load: ${err.message}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!index.length) {
    return new Response(JSON.stringify({ hits: [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  let ranked;
  try { ranked = await rerank(query, index, apiKey); }
  catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const bySlug = new Map(index.map(e => [e.slug, e]));
  const hits = [];
  if (ranked.best && bySlug.has(ranked.best)) hits.push(bySlug.get(ranked.best));
  for (const slug of (ranked.related || []).slice(0, TOP_RELATED)) {
    if (slug !== ranked.best && bySlug.has(slug)) hits.push(bySlug.get(slug));
  }

  return new Response(JSON.stringify({ hits, query }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=0, s-maxage=60',
    },
  });
}
