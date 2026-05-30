/**
 * Test that the parser handles plain-text Doc exports (everything wrapped in
 * <p> tags, no <h1>/<li>/<blockquote>).
 */
import { parseEpisodeDoc } from './parse-doc.js';

// Mimic what Google Docs exports when you upload plain-text content with
// markdown-style markers (no manual formatting applied).
const mdStyleExport = `<html><body>
<p># Hook</p>
<p></p>
<p>Test hook paragraph.</p>
<p></p>
<p># Story</p>
<p></p>
<p>First story paragraph.</p>
<p></p>
<p>Second story paragraph.</p>
<p></p>
<p># What you'll hear</p>
<p></p>
<p>- **The pre-idea raise** — why VCs backed them</p>
<p>- **The void** — six months without an idea</p>
<p>- **The conference moment** — a demo people tried to buy</p>
<p></p>
<p># Quotes</p>
<p></p>
<p>> You can't vibe code customers.</p>
<p>— Shakeel Lala, on AI limits (15:30)</p>
<p></p>
<p>> Frameworks don't find markets.</p>
<p>— Shakeel Lala (06:00)</p>
<p></p>
<p># Chapters</p>
<p></p>
<p>- 00:00 — Cold open — "You can't vibe code customers"</p>
<p>- 02:45 — The void — Both founders had quit their jobs</p>
<p>- 10:00 — What Marloo actually is — An AI partner for advisors</p>
<p></p>
<p># Meta</p>
<p></p>
<p>duration: 35 min</p>
<p>guest_role: Co-founder, Marloo</p>
<p>tags: Fintech AI · Customer Discovery</p>
</body></html>`;

const content = parseEpisodeDoc(mdStyleExport);
console.log('Parsed plain-text Doc:');
console.log('  hook:', content.hook?.slice(0, 60));
console.log('  story paras:', content.story.length, '— first:', content.story[0]?.slice(0, 50));
console.log('  whatYoullHear:', content.whatYoullHear.length, '— first label:', content.whatYoullHear[0]?.label);
console.log('  chapters:', content.chapters.length, '— first:', JSON.stringify(content.chapters[0]));
console.log('  quotes:', content.quotes.length, '— first:', JSON.stringify(content.quotes[0]));
console.log('  meta:', content.meta);

const ok =
  content.hook &&
  content.story.length === 2 &&
  content.whatYoullHear.length === 3 &&
  content.whatYoullHear[0].label === 'The pre-idea raise' &&
  content.chapters.length === 3 &&
  content.chapters[0].time === '00:00' &&
  content.quotes.length === 2 &&
  content.quotes[0].text.startsWith("You can't vibe code") &&
  content.meta.duration === '35 min';

console.log(ok ? '\n✅ Plain-text Doc parsing works.' : '\n❌ Plain-text Doc parsing has gaps.');
process.exit(ok ? 0 : 1);
