/**
 * /api/search — semantic search over Q&A entries.
 *
 * Pipeline:
 *   1. User sends a query.
 *   2. Embed the query via Voyage AI (one tiny API call).
 *   3. Cosine-similarity match against the pre-embedded Q&A index
 *      (embeddings.json, read once when the function cold-starts).
 *   4. Return top N hits.
 *
 * The Q&A pages themselves are still static — this endpoint just routes
 * the user to the best one. No LLM synthesis at runtime.
 *
 * Environment variables:
 *   - VOYAGE_API_KEY — set in Vercel project settings (Production + Preview)
 */

export const config = {
  runtime: 'edge',
  regions: ['syd1', 'iad1'],
};

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const EMBEDDING_MODEL = 'voyage-3-lite';
const MAX_QUERY_LEN = 500;
const TOP_K = 6;

// Embeddings loaded at cold-start via fetch to the same Vercel origin.
// We can't `import ../embeddings.json` reliably in the Edge build, so we fetch
// it from the deployed static file at first call and cache in module scope.
let _cachedEmbeddings = null;
let _cacheLoadPromise = null;

async function loadEmbeddings(requestUrl) {
  if (_cachedEmbeddings) return _cachedEmbeddings;
  if (_cacheLoadPromise) return _cacheLoadPromise;
  const origin = new URL(requestUrl).origin;
  _cacheLoadPromise = (async () => {
    const res = await fetch(`${origin}/embeddings.json`, { cf: { cacheTtl: 3600 } });
    if (!res.ok) throw new Error(`embeddings.json ${res.status}`);
    const arr = await res.json();
    _cachedEmbeddings = Array.isArray(arr) ? arr : [];
    return _cachedEmbeddings;
  })();
  return _cacheLoadPromise;
}

async function embedQuery(query, apiKey) {
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: query,
      model: EMBEDDING_MODEL,
      input_type: 'query',
    }),
  });
  if (!res.ok) throw new Error(`Voyage ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Server not configured. Set VOYAGE_API_KEY in Vercel env vars.',
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

  // Parallel: load embeddings + embed query
  let qVec, allEmbeds;
  try {
    [qVec, allEmbeds] = await Promise.all([
      embedQuery(query, apiKey),
      loadEmbeddings(req.url),
    ]);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!allEmbeds || allEmbeds.length === 0) {
    return new Response(JSON.stringify({ hits: [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Score every entry, dedupe by slug (one hit per canonical question),
  // keep the highest-scoring contributor per slug, sort by score desc.
  const bySlug = new Map();
  for (const entry of allEmbeds) {
    const score = cosineSim(qVec, entry.embedding);
    const existing = bySlug.get(entry.slug);
    if (!existing || score > existing.score) {
      bySlug.set(entry.slug, { ...entry, score, embedding: undefined });
    }
  }
  const ranked = Array.from(bySlug.values()).sort((a, b) => b.score - a.score).slice(0, TOP_K);

  // Strip the embedding from the response (heavy + not needed client-side)
  const hits = ranked.map(({ embedding, hash, ...rest }) => rest);

  return new Response(JSON.stringify({ hits, query }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=0, s-maxage=60',
    },
  });
}
