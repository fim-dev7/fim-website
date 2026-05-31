/**
 * Smoke test for the Drive-as-CMS pipeline. Runs WITHOUT touching Google
 * or Algolia — uses an in-memory fixture mimicking a Drive HTML export.
 *
 * Run: node scripts/lib/smoke-test.js
 */

import { parseEpisodeDoc } from './parse-doc.js';
import { renderEpisodePage } from './render-episode.js';
import { renderDataCMS, renderArchivePage } from './render-data.js';

const fixtureDocHtml = `<html>
<head><title>Ep 28 - Shakeel Lala</title></head>
<body>
<h1 class="c1" id="h.abc">Hook</h1>
<p class="c2"><span class="c0">Shakeel raised venture capital before he had a business idea. Nine months and 800 advisor conversations later, Marlu is the AI doing the work inside 650+ financial advice firms.</span></p>

<h1 class="c1" id="h.def">Story</h1>
<p class="c2"><span class="c0">Shakeel Lala and his co-founder Hardy had all the ingredients to start a business. Except the idea.</span></p>
<p class="c2"><span class="c0">They came out of consulting and corporate strategy roles and convinced Australia's largest VC to back them on a single trust exercise.</span></p>
<p class="c2"><span class="c0">A year later, Marlu is the AI doing the work inside 650+ advice firms across six countries.</span></p>

<h1 class="c1" id="h.ghi">What you'll hear</h1>
<ul>
<li><span style="font-weight:700">The pre-idea raise</span> — why one of Australia's largest VCs backed them before they had an application</li>
<li><span style="font-weight:700">The three lessons of "the void"</span> — frameworks don't find markets, network is your moat, sit inside firms before you sell</li>
<li><span style="font-weight:700">The conference moment</span> — a vibe-coded demo and the half-sentence pitch that made advisors want to buy</li>
</ul>

<h1 class="c1" id="h.jkl">Key claims</h1>
<ul>
<li><span style="font-weight:700">650+</span> — Financial advice firms using Marlu across six countries</li>
<li><span style="font-weight:700">800</span> — Discovery conversations before product-market fit</li>
<li><span style="font-weight:700">$10M</span> — Latest round, to make financial advice affordable</li>
<li><span style="font-weight:700">6-7 months</span> — Time spent in "the void" before committing to an idea</li>
</ul>

<h1 class="c1" id="h.mno">Chapters</h1>
<ul>
<li>00:00 — Cold open — "You can vibe code ideas, but not customers"</li>
<li>02:45 — Six months without an idea — Both founders had quit their jobs</li>
<li>10:00 — What Marlu actually is — An AI partner, not just a note-taker</li>
<li>12:35 — The Brisbane conference — FAAA 2024, vibe-coded demo</li>
</ul>

<h1 class="c1" id="h.pqr">Quotes</h1>
<blockquote>
<p><span class="c0">You can vibe code ideas. You can vibe code products. But you can't vibe code customers.</span></p>
<p><span class="c0">— Shakeel Lala, on the limits of AI in early-stage building (15:30)</span></p>
</blockquote>
<blockquote>
<p><span class="c0">Frameworks don't find markets.</span></p>
<p><span class="c0">— Shakeel Lala, on six months of trying to force-fit frameworks (06:00)</span></p>
</blockquote>

<h1 class="c1" id="h.stu">Themes</h1>
<ul>
<li><span style="font-weight:700">Frameworks don't find markets</span> — the consulting reflex of building decision trees</li>
<li><span style="font-weight:700">Network is your moat</span> — how Shakeel and Hardy used their networks for the first 800 conversations</li>
</ul>

<h1 class="c1" id="h.vwx">Mentioned</h1>
<ul>
<li><span style="font-weight:700">Marlu</span> — An AI partner for financial advisors</li>
<li><span style="font-weight:700">Hardy</span> — Co-founder of Marlu, based in London</li>
</ul>

<h1 class="c1" id="h.yz1">Meta</h1>
<p>duration: 35 min</p>
<p>guest_role: Co-founder, Marlu</p>
<p>guest_bio: Left corporate strategy and raised venture capital with co-founder Hardy on the promise they'd find an idea within twelve months.</p>
<p>mini_stats: $10M raised | 650+ firms | 800 calls | 6 countries</p>
<p>tags: Fintech AI · Customer Discovery · Pre-Seed</p>
</body></html>`;

const ep = {
  episode_number: 28,
  title: 'He Raised Venture Capital Before He Had a Business Idea',
  guest_name: 'Shakeel Lala',
  guest_company: 'Marlu',
  youtube_url: 'https://www.youtube.com/watch?v=abc12345678',
  spotify_url: 'https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl',
  apple_url: 'https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671',
  published_date: '2026-05-14',
  tags: ['Fintech AI', 'Customer Discovery', 'Pre-Seed'],
  short_desc: '800 conversations. Six months in the void. A vibe-coded demo. Marlu is now the AI doing the work inside 650+ financial advice firms.',
};

console.log('1. Parsing fixture doc...');
const content = parseEpisodeDoc(fixtureDocHtml);
console.log('   Hook:', content.hook?.slice(0, 80) + '...');
console.log('   Story paras:', content.story.length);
console.log('   What you\'ll hear:', content.whatYoullHear.length);
console.log('   Key claims:', content.keyClaims.length);
console.log('   Chapters:', content.chapters.length, '— first:', JSON.stringify(content.chapters[0]));
console.log('   Quotes:', content.quotes.length, '— first:', JSON.stringify(content.quotes[0]));
console.log('   Themes:', content.themes.length);
console.log('   Mentioned:', content.mentioned.length);
console.log('   Meta keys:', Object.keys(content.meta));

console.log('\n2. Rendering episode page...');
const allEpisodes = [
  { episode_number: 28, slug: '28-shakeel-lala', title: ep.title, has_episode_page: true, tags: ep.tags, short_desc: ep.short_desc },
  { episode_number: 26, slug: '26-celeste-amadon', title: "Today's Dating Apps Are Designed to Keep You Single", has_episode_page: true, tags: ['Consumer Tech'], short_desc: '21, pre-seed in 8 days, 12+ term sheets.' },
  { episode_number: 25, slug: '25-nam-nguyen', title: 'They Applied to YC 4 Times. Then Raised $4M in 48 Hours.', has_episode_page: true, tags: ['AI'], short_desc: '19-year-old co-founder. 5th YC app finally turned.' },
];
const html = renderEpisodePage({
  ep,
  content,
  slug: '28-shakeel-lala',
  transcriptText: 'TN Welcome back to Founders In Motion.\n\nSL My name is Shakeel Lala, co-founder of Marlu.\n\nTN You spent years in highly structured environments — consulting, corporate development. Then you walked away from all of it.',
  allEpisodes,
});
console.log('   Page length:', html.length, 'chars');
console.log('   Has JSON-LD:', html.includes('"@type": "PodcastEpisode"'));
console.log('   Has story:', html.includes('<h2>The story</h2>'));
console.log('   Has chapters:', html.includes('class="timestamps"'));
console.log('   Has quotes:', html.includes('class="pq"'));
console.log('   Has related:', html.includes('class="related"'));

console.log('\n3. Rendering data-cms.jsx...');
const settings = {
  spotify_show: 'https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl',
  apple_show: 'https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671',
  youtube_channel: 'https://www.youtube.com/@FoundersInMotion',
  instagram: 'https://www.instagram.com/thea.yaps',
  my_linkedin: 'https://www.linkedin.com/in/theango/',
};
const data = renderDataCMS({
  episodes: [
    { ...ep, slug: '28-shakeel-lala', has_episode_page: true, hook: content.hook, duration: '35 min', featured: true },
    { episode_number: 26, title: "Today's Dating Apps Are Designed to Keep You Single", guest_name: 'Celeste Amadon', guest_company: 'Known', tags: ['Consumer Tech'], slug: '26-celeste-amadon', has_episode_page: true, short_desc: '21, pre-seed in 8 days, 12+ term sheets.', published_date: '2026-04-30', duration: '1:02:14' },
    { episode_number: 25, title: 'They Applied to YC 4 Times. Then Raised $4M in 48 Hours.', guest_name: 'Nam Nguyen', guest_company: 'TruthSystems', tags: ['AI'], slug: '25-nam-nguyen', has_episode_page: true, short_desc: '19-year-old co-founder.', published_date: '2026-04-16', duration: '58:21' },
  ],
  settings,
});
console.log('   data-cms.jsx length:', data.length, 'chars');
console.log('   Contains EPISODES:', data.includes('const EPISODES'));
console.log('   Contains ARCHIVE:', data.includes('const ARCHIVE'));
console.log('   First episode title in data:', /title:\s*"([^"]+)"/.exec(data)?.[1]);

console.log('\n4. Rendering archive page...');
const archive = renderArchivePage({
  episodes: [
    { ...ep, slug: '28-shakeel-lala', has_episode_page: true, hook: content.hook, duration: '35 min', featured: true },
    { episode_number: 26, title: "Today's Dating Apps Are Designed to Keep You Single", guest_name: 'Celeste Amadon', guest_company: 'Known', tags: ['Consumer Tech'], slug: '26-celeste-amadon', has_episode_page: true, short_desc: '21, pre-seed in 8 days, 12+ term sheets.', published_date: '2026-04-30' },
    { episode_number: 6, title: 'Building for Vietnamese Retail Investors', guest_name: 'Nhi Nguyen', guest_company: 'MaiMoney', tags: [], slug: '6-nhi-nguyen', has_episode_page: false, short_desc: '', published_date: '2025-09-01' },
  ],
  settings,
});
console.log('   archive page length:', archive.length, 'chars');
console.log('   Has featured-grid:', archive.includes('featured-grid'));
console.log('   Has ep-list:', archive.includes('ep-list'));
console.log('   Has linked archive row for ep 6:', archive.includes('href="6-nhi-nguyen/"') || archive.includes('href="https://open.spotify'));

console.log('\n✅ Smoke test passed.');
