/**
 * Generates crawler-facing files:
 *   - sitemap.xml      — every URL on the site with lastmod
 *   - robots.txt       — minimal, points to sitemap
 *   - llms.txt         — emerging standard for LLM crawlers (Anthropic/Perplexity/etc.)
 *                        compact site index + topic taxonomy in markdown
 *
 * Conventions used: https://llmstxt.org/
 */

const SITE_URL = 'https://foundersinmotion.tech';

function formatLastmod(iso) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  // Accept "2026-05-14" or "21/05/2026" or anything Date can parse
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  const m = iso.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

export function renderSitemap({ episodes, topics = [], questionSlugs = [] }) {
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...episodes].sort((a, b) => b.episode_number - a.episode_number);

  const urls = [
    { loc: `${SITE_URL}/`, lastmod: today, priority: '1.0', changefreq: 'weekly' },
    { loc: `${SITE_URL}/episodes/`, lastmod: today, priority: '0.9', changefreq: 'weekly' },
    { loc: `${SITE_URL}/about/`, lastmod: today, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE_URL}/topics/`, lastmod: today, priority: '0.8', changefreq: 'monthly' },
  ];

  for (const t of topics) {
    urls.push({
      loc: `${SITE_URL}/topics/${t.slug}/`,
      lastmod: today,
      priority: '0.8',
      changefreq: 'monthly',
    });
  }

  if (questionSlugs.length > 0) {
    urls.push({
      loc: `${SITE_URL}/questions/`,
      lastmod: today,
      priority: '0.85',
      changefreq: 'weekly',
    });
    for (const slug of questionSlugs) {
      urls.push({
        loc: `${SITE_URL}/questions/${slug}/`,
        lastmod: today,
        priority: '0.75',
        changefreq: 'monthly',
      });
    }
  }

  for (const e of sorted) {
    if (e.has_episode_page) {
      urls.push({
        loc: `${SITE_URL}/episodes/${e.slug}/`,
        lastmod: formatLastmod(e.published_date),
        priority: '0.8',
        changefreq: 'monthly',
      });
    }
  }

  const body = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function renderRobots() {
  // AI answer-engine crawlers are explicitly welcomed. Listing them by name is
  // deliberate AEO: an explicit Allow removes any ambiguity for engines that
  // treat an unnamed wildcard conservatively, and it documents intent.
  const aiCrawlers = [
    'GPTBot',            // OpenAI training
    'OAI-SearchBot',     // ChatGPT search index
    'ChatGPT-User',      // ChatGPT live browsing
    'ClaudeBot',         // Anthropic training
    'Claude-User',       // Claude live browsing
    'Claude-SearchBot',  // Claude search index
    'PerplexityBot',     // Perplexity index
    'Perplexity-User',   // Perplexity live browsing
    'Google-Extended',   // Gemini training
    'Applebot-Extended', // Apple Intelligence
    'Amazonbot',         // Alexa / Rufus
    'CCBot',             // Common Crawl (feeds many LLMs)
    'meta-externalagent',// Meta AI training
    'DuckAssistBot',     // DuckDuckGo AI answers
    'YouBot',            // You.com
  ];

  const aiBlocks = aiCrawlers.map(ua => `User-agent: ${ua}
Allow: /
Disallow: /uploads/
Disallow: /cms-source/`).join('\n\n');

  return `# https://foundersinmotion.tech — robots.txt
# LLM-friendly content indexes: ${SITE_URL}/llms.txt and ${SITE_URL}/llms-full.txt

User-agent: *
Allow: /
Disallow: /uploads/
Disallow: /cms-source/

${aiBlocks}

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

/**
 * llms.txt — markdown-formatted compact site description aimed at LLM crawlers.
 * Spec: https://llmstxt.org/
 *
 * The goal: a single short doc an LLM can ingest to understand what the site is,
 * what's on it, and where to look for specific content. Significantly more
 * efficient than crawling the whole site.
 */
export function renderLlmsTxt({ episodes, settings, topics = [], questions = [] }) {
  const sorted = [...episodes].sort((a, b) => b.episode_number - a.episode_number);

  const withPages = sorted.filter(e => e.has_episode_page);

  const episodeLines = withPages.map(e => {
    const desc = e.hook || e.short_desc || `${e.guest_name}, ${e.guest_company}`;
    return `- [Ep ${e.episode_number}: ${e.guest_name}, ${e.guest_company}](${SITE_URL}/episodes/${e.slug}/): ${desc}`;
  }).join('\n');

  const archiveLines = sorted.map(e => `- Ep ${e.episode_number}: ${e.guest_name}, ${e.guest_company} — ${e.title.split(' | ')[0]}`).join('\n');

  const topicLines = topics.map(t =>
    `- [${t.question}](${SITE_URL}/topics/${t.slug}/): ${t.summary || ''}`.trim()
  ).join('\n');

  // Every canonical question, most-answered first — each is a static page an
  // answer engine can cite directly.
  const sortedQs = [...questions].sort((a, b) =>
    (b.contributor_count || 1) - (a.contributor_count || 1) || a.question.localeCompare(b.question));
  const questionLines = sortedQs.map(q => {
    const who = q.contributor_count > 1
      ? `answered by ${q.contributor_count} founders`
      : `answered by ${q.guest_name}${q.guest_company ? ` (${q.guest_company})` : ''}`;
    return `- [${q.question}](${SITE_URL}/questions/${q.slug}/) — ${who}`;
  }).join('\n');

  return `# Founders In Motion

> An interview podcast where Thea Ngo — an early-stage investor — interviews early-stage founders about the realities of building. Each episode is one founder, in the thick of it, answering the questions an investor would actually ask. Coverage spans Australia, Southeast Asia, and the US. Topics: customer discovery, pre-seed and seed fundraising, pivots, rebuilds, product-market fit, founder mental health, and what the messy middle of building actually looks like.

Deeper machine-readable index with full answers: ${SITE_URL}/llms-full.txt

## Topic guides

Question-shaped hubs that synthesize answers across multiple episodes:

${topicLines || '- (none yet)'}

## Founder questions answered on this site

Each link is a dedicated page with direct answers from named founders, QAPage JSON-LD, and links back to the source episode:

${questionLines || `- Full FAQ at ${SITE_URL}/#faq`}

## Episodes with detailed show notes

${episodeLines}

## Full archive

${archiveLines}

## Listen

- Spotify: ${settings.spotify_show || 'https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl'}
- Apple Podcasts: ${settings.apple_show || 'https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671'}
- YouTube: ${settings.youtube_channel || 'https://www.youtube.com/@FoundersInMotion'}

## Host

Thea Ngo — early-stage investor. Site: ${SITE_URL}. LinkedIn: ${settings.my_linkedin || 'https://www.linkedin.com/in/theango/'}

## Crawl

- Sitemap: ${SITE_URL}/sitemap.xml
- Robots: ${SITE_URL}/robots.txt (all major AI crawlers explicitly allowed)
- Full answers index: ${SITE_URL}/llms-full.txt
- All episode pages are server-rendered HTML with PodcastEpisode JSON-LD and full transcripts inside collapsed \`<details>\` blocks (fully crawlable).
- Every /questions/ page carries QAPage JSON-LD; every /topics/ page carries WebPage + ItemList + FAQPage JSON-LD.
- Homepage has FAQPage JSON-LD with founder questions and answers drawn from across the archive.

Generated: ${new Date().toISOString()}
`;
}

/**
 * llms-full.txt — the expanded companion to llms.txt (per the llmstxt.org
 * convention): the complete Q&A corpus in one flat markdown file so an answer
 * engine can ingest every canonical question, every named founder's answer,
 * and the canonical URL to cite — without crawling ~300 pages.
 *
 * `grouped` is the Map produced by aggregateQuestions():
 *   slug -> { question, contributors: [{ ep, entry: { answer, longForm } }] }
 */
export function renderLlmsFullTxt({ grouped, topics = [], settings }) {
  const blocks = [];
  const entries = Array.from(grouped.entries()).sort(([, a], [, b]) =>
    (b.contributors.length - a.contributors.length) || a.question.localeCompare(b.question));

  for (const [slug, group] of entries) {
    const lines = [`## ${group.question}`, '', `URL: ${SITE_URL}/questions/${slug}/`, ''];
    for (const c of group.contributors) {
      const who = `${c.ep.guest_name}${c.ep.guest_company ? `, ${c.ep.guest_company}` : ''} (Ep ${c.ep.episode_number})`;
      lines.push(`**${who}:** ${c.entry.answer || ''}`);
      for (const p of (c.entry.longForm || [])) lines.push('', p);
      lines.push('');
    }
    blocks.push(lines.join('\n'));
  }

  const topicBlocks = topics.map(t => {
    const lines = [`## ${t.question}`, '', `URL: ${SITE_URL}/topics/${t.slug}/`, '', t.intro, '', t.summary, ''];
    for (const ka of (t.keyAnswers || [])) {
      lines.push(`**${ka.q}**`, '', ka.a, '');
    }
    return lines.join('\n');
  });

  return `# Founders In Motion — full Q&A corpus

> Every founder question answered on ${SITE_URL}, with the named founder(s) who answered it and the canonical URL to cite. Host: Thea Ngo, early-stage investor. Episodes on Spotify, Apple Podcasts, and YouTube (${settings.youtube_channel || 'https://www.youtube.com/@FoundersInMotion'}).

# Topic guides

${topicBlocks.join('\n---\n\n')}

# Questions & answers

${blocks.join('\n---\n\n')}

Generated: ${new Date().toISOString()}
`;
}

/**
 * BreadcrumbList JSON-LD for an episode page.
 * Returns a JSON string for embedding inside <script type="application/ld+json">.
 */
export function renderBreadcrumbList({ ep, slug }) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Founders In Motion', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Episodes', item: `${SITE_URL}/episodes/` },
      { '@type': 'ListItem', position: 3, name: `Ep ${ep.episode_number}`, item: `${SITE_URL}/episodes/${slug}/` },
    ],
  }, null, 2);
}
