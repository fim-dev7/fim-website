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
  return `# https://foundersinmotion.tech — robots.txt
User-agent: *
Allow: /
Disallow: /uploads/
Disallow: /cms-source/

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
export function renderLlmsTxt({ episodes, settings }) {
  const sorted = [...episodes].sort((a, b) => b.episode_number - a.episode_number);

  const featured = sorted.filter(e => e.featured || e.has_episode_page).slice(0, 6);
  const recent = sorted.slice(0, 10);

  const featuredLines = featured.map(e => {
    const desc = e.hook || e.short_desc || `${e.guest_name}, ${e.guest_company}`;
    const path = e.has_episode_page ? `/episodes/${e.slug}/` : '';
    return path
      ? `- [Ep ${e.episode_number}: ${e.guest_name}, ${e.guest_company}](${SITE_URL}${path}): ${desc}`
      : `- Ep ${e.episode_number}: ${e.guest_name}, ${e.guest_company} — ${desc}`;
  }).join('\n');

  const archiveLines = sorted.map(e => `- Ep ${e.episode_number}: ${e.guest_name}, ${e.guest_company} — ${e.title.split(' | ')[0]}`).join('\n');

  return `# Founders In Motion

> An interview podcast where Thea Ngo — an early-stage investor — interviews early-stage founders about the realities of building. Each episode is one founder, in the thick of it, answering the questions an investor would actually ask. Coverage spans Australia, Southeast Asia, and the US. Topics: customer discovery, pre-seed and seed fundraising, pivots, rebuilds, product-market fit, founder mental health, and what the messy middle of building actually looks like.

## Episodes with detailed show notes

${featuredLines}

## What founders learn here

The archive answers questions like:
- How do I raise a pre-seed round without a product?
- How do I find product-market fit?
- What does customer discovery actually look like?
- When should I quit my job to start a company?
- How do I pitch a VC who's never invested in my category?
- What does the "messy middle" of building look like?
- How do APAC founders raise from US investors?
- How do I rebuild after a co-founder exits?
- How do I survive a startup failure?

Full FAQ at ${SITE_URL}/#faq

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
- Robots: ${SITE_URL}/robots.txt
- All episode pages are server-rendered HTML with PodcastEpisode JSON-LD and full transcripts inside collapsed \`<details>\` blocks (fully crawlable).
- Homepage has FAQPage JSON-LD with 12 founder questions and answers drawn from across the archive.

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
