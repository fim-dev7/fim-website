/**
 * Parse a Q&A Pack Google Doc HTML export into a list of Q&A entries.
 *
 * Doc contract (per QA_PACK_TEMPLATE.md):
 *
 *   # Question text here?
 *   slug: how-to-raise-pre-seed-without-product
 *   answer: Short 1-2 sentence summary.
 *
 *   Optional longer paragraphs of context.
 *
 *   # Another question?
 *   slug: how-to-do-customer-discovery
 *   answer: Short answer.
 *
 *   Longer details.
 *
 * Each H1 (or `<p># …</p>` in plain-text-uploaded Docs) starts a new entry.
 * Metadata key:value lines follow. The first paragraph that isn't metadata
 * becomes the start of the long-form answer.
 *
 * Returns: [{ question, slug, answer, longForm }, ...]
 *   - question: the heading text (with trailing `?` preserved if present)
 *   - slug:     canonical question slug for /questions/<slug>/
 *   - answer:   the short summary (from `answer:` line)
 *   - longForm: array of paragraph strings (optional, may be empty)
 */

import { toInlineHTML, toText, extractBody } from './parse-doc.js';

const META_KEYS = ['slug', 'answer', 'tags', 'notes'];

function isMetaLine(text) {
  const m = text.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.+)$/i);
  if (!m) return null;
  const key = m[1].toLowerCase();
  if (!META_KEYS.includes(key)) return null;
  return { key, value: m[2].trim() };
}

/**
 * Walk every <h1> tag AND every <p># …</p> markdown-style heading.
 * Yields { heading, start, end } where the slice between consecutive
 * `end` and the next `start` is the body of a Q&A entry.
 */
function findQuestionMarkers(bodyHtml) {
  const markers = [];

  // Real <h1> tags
  const h1Re = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
  let m;
  while ((m = h1Re.exec(bodyHtml)) !== null) {
    markers.push({
      heading: toText(m[1]),
      start: m.index,
      end: h1Re.lastIndex,
    });
  }

  // Fallback: <p># Heading?</p> markdown-style markers
  if (markers.length === 0) {
    const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
    let pm;
    while ((pm = pRe.exec(bodyHtml)) !== null) {
      const text = toText(pm[1]);
      const md = text.match(/^#\s+(.+)$/);
      if (md) {
        markers.push({
          heading: md[1].trim(),
          start: pm.index,
          end: pRe.lastIndex,
        });
      }
    }
  }

  return markers.sort((a, b) => a.start - b.start);
}

/**
 * Pull the visible text content of every <p> in a chunk of HTML.
 * Preserves inline tags (b, em, a) via toInlineHTML.
 */
function paragraphsIn(html) {
  const out = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const cleaned = toInlineHTML(m[1]).trim();
    if (cleaned) out.push(cleaned);
  }
  return out;
}

/**
 * Main entry: parse a Q&A pack HTML export.
 */
export function parseQaPack(html) {
  if (!html) return [];
  const body = extractBody(html);
  const markers = findQuestionMarkers(body);
  if (markers.length === 0) return [];

  const out = [];
  for (let i = 0; i < markers.length; i++) {
    const startBody = markers[i].end;
    const endBody = i + 1 < markers.length ? markers[i + 1].start : body.length;
    const chunk = body.slice(startBody, endBody);
    const paras = paragraphsIn(chunk);

    let slug = null;
    let answer = null;
    const longForm = [];

    for (const p of paras) {
      const plain = toText(p);
      const meta = isMetaLine(plain);
      if (meta) {
        if (meta.key === 'slug') slug = meta.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        else if (meta.key === 'answer') answer = meta.value;
        // (other keys reserved for future use)
        continue;
      }
      longForm.push(p);
    }

    const question = markers[i].heading.trim();
    if (!question || !slug) continue; // require both

    out.push({
      question,
      slug,
      answer: answer || '',
      longForm,
    });
  }
  return out;
}
