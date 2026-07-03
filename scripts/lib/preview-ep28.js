/**
 * Render the Ep 28 page using the cms-source HTML doc as input.
 * Writes the result to cms-source/_preview-ep-28.html so Thea can open
 * it locally and compare against the live page.
 *
 * Run: node scripts/lib/preview-ep28.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseEpisodeDoc } from './parse-doc.js';
import { renderEpisodePage } from './render-episode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '../..');

const sourceHtml = fs.readFileSync(path.join(REPO_ROOT, 'cms-source/ep-27-shakeel-lala.html'), 'utf8');
const content = parseEpisodeDoc(sourceHtml);

const ep = {
  episode_number: 28,
  title: 'He Raised Venture Capital Before He Had a Business Idea',
  guest_name: 'Shakeel Lala',
  guest_company: 'Marloo',
  youtube_url: 'https://www.youtube.com/@foundersinmotion',
  spotify_url: 'https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl',
  apple_url: 'https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671',
  published_date: '2026-05-14',
  tags: ['Fintech AI', 'Customer Discovery', 'Pre-Seed'],
};

const allEpisodes = [
  { episode_number: 26, slug: '26-celeste-amadon', title: "Today's Dating Apps Are Designed to Keep You Single", has_episode_page: true, tags: ['Consumer Tech'], short_desc: '21, pre-seed in 8 days, 12+ term sheets.' },
  { episode_number: 25, slug: '25-nam-nguyen', title: 'They Applied to YC 4 Times. Then Raised $4M in 48 Hours.', has_episode_page: true, tags: ['Legal Tech'], short_desc: '19-year-old co-founder. 5th YC app finally turned.' },
];

const transcriptText = `TN Welcome back to Founders In Motion. Shakeel — you spent years in highly structured environments. Consulting, corporate development, product lead. Then you walked away from all of it to start something from scratch. What was the moment you knew you were taking the leap?

SL We had a bit of an interesting start. We decided to start a business and I felt like we had all the ingredients to start a business — except for the exact application or idea. Hardy and I spent almost a year investigating and validating different spaces before we committed.

TN Wow.

SL It very much felt like we were in this void for about six or seven months where we'd both left our jobs and we were constantly pitching and propositioning different ideas to each other.`;

const rendered = renderEpisodePage({
  ep,
  content,
  slug: '28-shakeel-lala',
  transcriptText,
  allEpisodes,
});

// Patch the asset paths so the local preview can find styles.css + assets without
// the ../../ resolving above the repo. We swap ../../ → ../../ — they already work
// when served from /episodes/<slug>/. For a one-off file in cms-source/_preview-ep-28.html
// we want ../styles.css → relative to cms-source/, so it points one level up.
const localised = rendered
  .replace(/href="\.\.\/\.\.\/styles\.css"/g, 'href="../styles.css"')
  .replace(/href="\.\.\/episode\.css"/g, 'href="../episodes/episode.css"')
  .replace(/href="\.\.\/\.\.\/index\.html"/g, 'href="../index.html"')
  .replace(/href="\.\.\/index\.html#episodes"/g, 'href="../index.html#episodes"')
  .replace(/href="\.\.\/index\.html#faq"/g, 'href="../index.html#faq"')
  .replace(/href="\.\.\/index\.html#about"/g, 'href="../index.html#about"')
  .replace(/src="\.\.\/\.\.\/assets\/logo-white\.png"/g, 'src="../assets/logo-white.png"')
  .replace(/href="\.\.\/28-shakeel-lala\//g, 'href="../episodes/28-shakeel-lala/')
  .replace(/href="\.\.\/26-celeste-amadon\//g, 'href="../episodes/26-celeste-amadon/')
  .replace(/href="\.\.\/25-nam-nguyen\//g, 'href="../episodes/25-nam-nguyen/');

fs.writeFileSync(path.join(REPO_ROOT, 'cms-source/_preview-ep-28.html'), localised);
console.log('✓ Wrote cms-source/_preview-ep-28.html');
console.log('  Open it in a browser to see exactly what the regenerated Ep 28 page will look like.');
