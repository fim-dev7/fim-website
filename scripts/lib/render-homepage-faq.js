/**
 * Reads data-static.jsx to extract the hand-curated FAQ array, then
 * regenerates the FAQPage JSON-LD block inside index.html — so the FAQ
 * is maintained in ONE place (data-static.jsx) and both the React UI
 * and the JSON-LD stay in sync.
 *
 * Trade-off: parses data-static.jsx by evaluating it in a sandboxed VM.
 * Safer than regex; only this repo's own file is evaluated, no external input.
 */

import fs from 'fs';
import path from 'path';
import vm from 'vm';

const FAQ_START_MARKER = '<!-- FAQPAGE_JSONLD_START -->';
const FAQ_END_MARKER   = '<!-- FAQPAGE_JSONLD_END -->';

/**
 * Run data-static.jsx in a sandbox to extract its constants.
 * Stubs `window` so the `Object.assign(window, {...})` at the bottom doesn't crash.
 */
export function extractFaqFromDataStatic(repoRoot) {
  const filePath = path.join(repoRoot, 'data-static.jsx');
  if (!fs.existsSync(filePath)) return null;
  const source = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {}, React: {} };
  vm.createContext(sandbox);
  try {
    vm.runInContext(source, sandbox, { filename: 'data-static.jsx', timeout: 1000 });
  } catch (err) {
    console.warn('  ⚠️  Failed to eval data-static.jsx:', err.message);
    return null;
  }
  const FAQ = sandbox.window.FAQ;
  if (!Array.isArray(FAQ)) return null;
  return FAQ;
}

/**
 * Generate the FAQPage JSON-LD string from the parsed FAQ array.
 * Single-line entries to match the existing style in index.html.
 */
export function renderFaqPageJsonLd(faqs) {
  const entries = faqs.map(({ q, a }) =>
    `    ${JSON.stringify({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })}`
  ).join(',\n');

  return `${FAQ_START_MARKER}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
${entries}
  ]
}
</script>
${FAQ_END_MARKER}`;
}

/**
 * Replace the FAQ block in index.html between the markers.
 * If markers don't exist yet, insert the block in place of the legacy
 * "<!-- JSON-LD: FAQPage -->" comment + script block.
 *
 * Returns { content, changed } so the caller can use writeIfChanged.
 */
export function injectFaqIntoIndexHtml(indexHtml, jsonLdBlock) {
  // Case A: markers present — replace between
  const startIdx = indexHtml.indexOf(FAQ_START_MARKER);
  const endIdx   = indexHtml.indexOf(FAQ_END_MARKER);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const after = indexHtml.slice(endIdx + FAQ_END_MARKER.length);
    return indexHtml.slice(0, startIdx) + jsonLdBlock + after;
  }
  // Case B: legacy block (no markers yet) — replace the old comment + script
  const legacyRe = /<!--\s*JSON-LD:\s*FAQPage\s*-->[\s\S]*?<\/script>/;
  if (legacyRe.test(indexHtml)) {
    return indexHtml.replace(legacyRe, jsonLdBlock);
  }
  // Case C: no marker, no legacy block — append before </head>
  return indexHtml.replace('</head>', `${jsonLdBlock}\n</head>`);
}
