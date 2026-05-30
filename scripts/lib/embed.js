/**
 * Voyage AI embeddings wrapper.
 * https://docs.voyageai.com/docs/embeddings
 *
 * Why Voyage:
 *   - Anthropic-recommended
 *   - Generous free tier (200M tokens — covers years of sync runs + millions of queries)
 *   - voyage-3-lite: 512 dim, fast, $0.02/M tokens (free under quota)
 *
 * Two input types:
 *   - "document": for the Q&As stored at sync time
 *   - "query": for the user's query at runtime
 * Using the right type tunes the embedding for retrieval quality.
 */

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
export const EMBEDDING_MODEL = 'voyage-3-lite';
export const EMBEDDING_DIM = 512;

/**
 * Embed an array of strings. Voyage accepts up to 128 inputs per request.
 * Returns array of float vectors (length === inputs.length).
 */
export async function embedBatch(inputs, { apiKey, inputType = 'document' } = {}) {
  if (!apiKey) throw new Error('VOYAGE_API_KEY missing');
  if (!Array.isArray(inputs) || inputs.length === 0) return [];

  const BATCH_SIZE = 128;
  const out = new Array(inputs.length);

  for (let start = 0; start < inputs.length; start += BATCH_SIZE) {
    const batch = inputs.slice(start, start + BATCH_SIZE);
    const res = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: batch,
        model: EMBEDDING_MODEL,
        input_type: inputType,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Voyage ${res.status}: ${errText}`);
    }
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Voyage response missing data array');
    }
    for (let i = 0; i < batch.length; i++) {
      out[start + i] = data.data[i].embedding;
    }
  }

  return out;
}

/**
 * Embed a single string. Convenience.
 */
export async function embedOne(input, opts) {
  const [vec] = await embedBatch([input], opts);
  return vec;
}

/**
 * Cosine similarity between two vectors. Both must be same length.
 */
export function cosineSimilarity(a, b) {
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

/**
 * Cheap hash of a string (for change detection — embed only when text changes).
 * Stable across runs. Output is a hex string.
 */
export function textHash(s) {
  // FNV-1a 32-bit. Good enough for cache keys.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}
