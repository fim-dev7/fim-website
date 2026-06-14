/**
 * Render a topic hub page — a question-shaped page that answers a founder
 * query by drawing from multiple episodes.
 *
 * Each hub gets:
 *   - WebPage JSON-LD with mainEntity = FAQPage
 *   - ItemList JSON-LD (the featured episodes)
 *   - BreadcrumbList JSON-LD
 *   - Speakable spec on the question + summary (voice search)
 *   - Server-rendered episode citations with links + key claim per episode
 */

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC_MAP[c]); }

const SITE_URL = 'https://foundersinmotion.tech';

function initials(name) {
  if (!name) return '??';
  const parts = name.replace(/[&]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pickKeyQuote(content) {
  if (content?.quotes?.length) return content.quotes[0];
  return null;
}

function pickKeyClaim(content) {
  if (content?.keyClaims?.length) return content.keyClaims[0];
  return null;
}

export function renderTopicHub({ topic, episodesById, allTopics }) {
  const url = `${SITE_URL}/topics/${topic.slug}/`;
  const seeAlsoTopics = (topic.seeAlso || []).map(s => allTopics.find(t => t.slug === s)).filter(Boolean);

  // Look up featured episodes by number
  const featured = (topic.featuredEpisodeNumbers || [])
    .map(n => episodesById.get(n))
    .filter(Boolean);

  // ----- JSON-LD blocks -----------------------------------------------------

  const breadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Founders In Motion', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Topics', item: `${SITE_URL}/topics/` },
      { '@type': 'ListItem', position: 3, name: topic.question, item: url },
    ],
  }, null, 2);

  const webpage = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: topic.question,
    url,
    description: topic.summary,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.topic-question', '.topic-summary'],
    },
    mainEntity: {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: topic.question, acceptedAnswer: { '@type': 'Answer', text: topic.summary } },
        ...(topic.keyAnswers || []).map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      ],
    },
  }, null, 2);

  const itemList = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: featured.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/episodes/${e.slug}/`,
      name: e.title.split(' | ')[0],
    })),
  }, null, 2);

  // ----- Rendered HTML body -------------------------------------------------

  const episodeCards = featured.map(e => {
    const title = (e.title || '').split(' | ')[0];
    const claim = pickKeyClaim(e.content);
    const quote = pickKeyQuote(e.content);
    const href = e.has_episode_page ? `/episodes/${e.slug}/` : (e.spotify_url || '#');
    const hook = e.content?.hook || e.short_desc || '';
    return `<article class="topic-ep">
        <a href="${esc(href)}" class="topic-ep-link">
          <div class="topic-ep-num">EP ${e.episode_number}</div>
          <div class="topic-ep-body">
            <div class="topic-ep-meta"><b>${esc(e.guest_name)}</b> · <i>${esc(e.guest_company)}</i></div>
            <h3 class="topic-ep-title">${esc(title)}</h3>
            ${hook ? `<p class="topic-ep-hook">${esc(hook)}</p>` : ''}
            ${claim && claim.label ? `<div class="topic-ep-stat"><span class="topic-ep-stat-num">${esc(claim.label)}</span><span class="topic-ep-stat-txt">${esc(claim.text)}</span></div>` : ''}
            ${quote ? `<blockquote class="topic-ep-quote">"${esc(quote.text)}"<cite>— ${esc(quote.attr)}</cite></blockquote>` : ''}
          </div>
          <div class="topic-ep-arrow">↗</div>
        </a>
      </article>`;
  }).join('\n\n      ');

  const seeAlsoLinks = seeAlsoTopics.map(t => `<li><a href="/topics/${t.slug}/">${esc(t.question)}</a></li>`).join('\n          ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(topic.question)} | Founders In Motion</title>
<meta name="description" content="${esc(topic.summary)}" />
<link rel="canonical" href="${url}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="Founders In Motion" />
<meta property="og:image" content="${SITE_URL}/assets/youtube-banner.png" />
<meta name="twitter:card" content="summary_large_image" />

<meta property="og:title" content="${esc(topic.question)}" />
<meta property="og:description" content="${esc(topic.summary)}" />
<meta property="og:type" content="article" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../../styles.css" />

<!-- JSON-LD: BreadcrumbList -->
<script type="application/ld+json">
${breadcrumb}
</script>

<!-- JSON-LD: WebPage with mainEntity FAQPage + Speakable -->
<script type="application/ld+json">
${webpage}
</script>

<!-- JSON-LD: ItemList of featured episodes -->
<script type="application/ld+json">
${itemList}
</script>

<style>
.topic-page { padding: 110px 0 80px; }
.topic-head { max-width: 760px; margin: 0 auto 64px; }
.topic-head .kicker { color: var(--cream); font-family: var(--body); font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
.topic-question {
  font-family: var(--sans);
  font-weight: 900;
  font-size: clamp(36px, 5vw, 56px);
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0 0 28px;
  color: var(--off-white);
  text-wrap: balance;
}
.topic-summary {
  font-family: var(--body);
  font-size: 19px;
  line-height: 1.6;
  color: var(--off-white);
  max-width: 60ch;
  margin: 0 0 12px;
}
.topic-intro {
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--muted);
  max-width: 62ch;
}

.topic-key-answers { max-width: 720px; margin: 0 auto 64px; }
.topic-key-answers h2 {
  font-family: var(--sans);
  font-weight: 800;
  font-size: clamp(24px, 3vw, 32px);
  letter-spacing: -0.02em;
  margin: 0 0 32px;
  color: var(--off-white);
}
.topic-key-answers details {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0 22px;
  margin-bottom: 12px;
  background: rgba(255,255,255,0.02);
}
.topic-key-answers details summary {
  font-family: var(--sans);
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.015em;
  color: var(--off-white);
  padding: 18px 0;
  cursor: pointer;
  list-style: none;
  display: flex; align-items: center; justify-content: space-between;
}
.topic-key-answers details summary::after {
  content: "+";
  color: var(--cream);
  font-size: 24px;
  font-weight: 400;
}
.topic-key-answers details[open] summary::after { content: "−"; }
.topic-key-answers details p {
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.7;
  color: var(--off-white);
  margin: 0 0 18px;
}

.topic-episodes { max-width: 880px; margin: 0 auto 72px; }
.topic-episodes h2 {
  font-family: var(--sans);
  font-weight: 800;
  font-size: clamp(24px, 3vw, 32px);
  letter-spacing: -0.02em;
  margin: 0 0 32px;
  color: var(--off-white);
}
.topic-ep {
  border: 1px solid var(--border);
  border-radius: 16px;
  margin-bottom: 16px;
  background: rgba(255,255,255,0.02);
  transition: border-color 0.15s, transform 0.15s;
}
.topic-ep:hover { border-color: var(--cream); transform: translateY(-1px); }
.topic-ep-link {
  display: grid;
  grid-template-columns: 70px 1fr 32px;
  gap: 24px;
  align-items: start;
  padding: 28px 30px;
  text-decoration: none;
  color: inherit;
}
.topic-ep-num {
  font-family: var(--sans);
  font-weight: 800;
  font-size: 18px;
  color: var(--cream);
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  padding-top: 2px;
}
.topic-ep-meta { font-size: 13px; color: var(--muted); margin-bottom: 6px; }
.topic-ep-meta b { color: var(--off-white); font-weight: 600; }
.topic-ep-meta i { font-style: italic; color: var(--muted); }
.topic-ep-title {
  font-family: var(--sans);
  font-weight: 800;
  font-size: clamp(20px, 2.2vw, 24px);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0 0 12px;
  color: var(--off-white);
  text-wrap: balance;
}
.topic-ep-hook {
  font-family: var(--body);
  font-size: 15px;
  line-height: 1.6;
  color: var(--off-white);
  margin: 0 0 14px;
}
.topic-ep-stat {
  display: flex; align-items: baseline; gap: 14px;
  padding: 12px 16px;
  background: rgba(212,168,125,0.06);
  border-radius: 10px;
  margin-bottom: 12px;
}
.topic-ep-stat-num {
  font-family: var(--sans);
  font-weight: 900;
  font-size: 22px;
  color: var(--cream);
  letter-spacing: -0.02em;
}
.topic-ep-stat-txt {
  font-family: var(--body);
  font-size: 13px;
  line-height: 1.5;
  color: var(--off-white);
  flex: 1;
}
.topic-ep-quote {
  font-family: var(--serif, "Playfair Display", serif);
  font-style: italic;
  font-size: 15px;
  line-height: 1.55;
  color: var(--off-white);
  padding-left: 16px;
  border-left: 2px solid var(--cream);
  margin: 12px 0 0;
}
.topic-ep-quote cite {
  display: block;
  margin-top: 6px;
  font-style: normal;
  font-family: var(--body);
  font-size: 12px;
  color: var(--muted);
}
.topic-ep-arrow { color: var(--cream); font-size: 20px; padding-top: 4px; }

.topic-see-also { max-width: 720px; margin: 0 auto 0; padding: 32px; border: 1px solid var(--border); border-radius: 16px; background: rgba(255,255,255,0.02); }
.topic-see-also h3 {
  font-family: var(--sans);
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.01em;
  margin: 0 0 18px;
  color: var(--off-white);
}
.topic-see-also ul { list-style: none; padding: 0; margin: 0; }
.topic-see-also li { margin-bottom: 10px; }
.topic-see-also a {
  font-family: var(--body);
  font-size: 16px;
  color: var(--cream);
  text-decoration: none;
}
.topic-see-also a:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .topic-ep-link { grid-template-columns: 52px 1fr 22px; gap: 14px; padding: 22px; }
}
</style>
</head>
<body>

<nav class="nav">
  <div class="container nav-inner">
    <a href="../../index.html" class="brand">
      <img class="brand-logo" src="../../assets/logo-white.png" alt="Founders In Motion" />
      <span class="brand-text">Founders <em>In Motion</em></span>
    </a>
    <div class="nav-links">
      <a href="../../episodes/">Episodes</a>
      <a href="../../index.html#faq">Founder Questions</a>
      <a href="../../about/">About</a>
    </div>
    <a class="btn btn-primary" href="https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl">
      Listen Free <span aria-hidden="true">→</span>
    </a>
  </div>
</nav>

<main class="topic-page">
  <div class="container">

    <header class="topic-head">
      <div class="kicker">Founder Topic</div>
      <h1 class="topic-question">${esc(topic.question)}</h1>
      <p class="topic-summary">${esc(topic.summary)}</p>
      <p class="topic-intro">${esc(topic.intro)}</p>
    </header>

    ${topic.keyAnswers && topic.keyAnswers.length > 0 ? `<section class="topic-key-answers">
      <h2>Quick answers</h2>
      ${topic.keyAnswers.map(({ q, a }) => `<details>
        <summary>${esc(q)}</summary>
        <p>${esc(a)}</p>
      </details>`).join('\n      ')}
    </section>` : ''}

    <section class="topic-episodes">
      <h2>What founders in the archive say</h2>
      ${episodeCards}
    </section>

    ${seeAlsoLinks ? `<section class="topic-see-also">
      <h3>Related topics</h3>
      <ul>
          ${seeAlsoLinks}
      </ul>
    </section>` : ''}

  </div>
</main>

<footer>
  <div class="container">
    <div class="footer-row">
      <a href="../../index.html" class="brand">
        <img class="brand-logo" src="../../assets/logo-white.png" alt="Founders In Motion" style="height: 24px;" />
        <span class="brand-text">Founders <em>In Motion</em></span>
      </a>
      <nav class="footer-nav">
        <a href="https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl">Spotify</a>
        <a href="https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671">Apple</a>
        <a href="https://www.instagram.com/thea.yaps">Instagram</a>
        <a href="https://www.tiktok.com/@foundersinmotion">TikTok</a>
        <a href="https://www.linkedin.com/in/theango/">LinkedIn</a>
      </nav>
      <div class="copyright">© 2026 Founders In Motion · Hosted by Thea Ngo</div>
    </div>
    <div class="footer-mark">Founders <em>In Motion</em></div>
  </div>
</footer>

</body>
</html>
`;
}

/**
 * Render the /topics/ index page that lists all hubs.
 */
export function renderTopicsIndex({ topics }) {
  const cards = topics.map(t => `<a class="topic-index-card" href="${t.slug}/">
        <h3>${esc(t.question)}</h3>
        <p>${esc(t.summary)}</p>
        <span class="topic-index-arrow">→</span>
      </a>`).join('\n      ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Founder Topics — Founders In Motion</title>
<meta name="description" content="Question-shaped guides for founders, drawing from interviews across the Founders In Motion archive: customer discovery, pre-seed fundraising, product-market fit, pivots, and the messy middle." />
<link rel="canonical" href="${SITE_URL}/topics/" />
<meta property="og:title" content="Founder Topics — Founders In Motion" />
<meta property="og:description" content="Question-shaped guides for founders, drawing from interviews across the Founders In Motion archive." />
<meta property="og:type" content="website" />
<meta property="og:url" content="${SITE_URL}/topics/" />
<meta property="og:site_name" content="Founders In Motion" />
<meta property="og:image" content="${SITE_URL}/assets/youtube-banner.png" />
<meta name="twitter:card" content="summary_large_image" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../styles.css" />

<!-- JSON-LD: BreadcrumbList -->
<script type="application/ld+json">
${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Founders In Motion', item: 'https://foundersinmotion.tech/' },
      { '@type': 'ListItem', position: 2, name: 'Topics', item: 'https://foundersinmotion.tech/topics/' },
    ],
  }, null, 2)}
</script>

<!-- JSON-LD: CollectionPage -->
<script type="application/ld+json">
${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Founder Topics',
    url: 'https://foundersinmotion.tech/topics/',
    description: 'Question-shaped guides for founders, drawing from interviews across the Founders In Motion archive.',
  }, null, 2)}
</script>

<style>
.topics-index-page { padding: 120px 0 96px; }
.topics-index-head { max-width: 760px; margin: 0 auto 64px; text-align: center; }
.topics-index-head .kicker { color: var(--cream); font-family: var(--body); font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
.topics-index-head h1 {
  font-family: var(--sans);
  font-weight: 900;
  font-size: clamp(40px, 6vw, 64px);
  letter-spacing: -0.03em;
  line-height: 1.04;
  margin: 0 0 20px;
  color: var(--off-white);
  text-wrap: balance;
}
.topics-index-head p {
  font-family: var(--body);
  font-size: 18px;
  line-height: 1.55;
  color: var(--muted);
  margin: 0;
}
.topic-index-grid { max-width: 880px; margin: 0 auto; display: grid; gap: 18px; }
.topic-index-card {
  display: block;
  padding: 32px 36px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255,255,255,0.02);
  text-decoration: none;
  transition: border-color 0.15s, transform 0.15s;
  position: relative;
}
.topic-index-card:hover { border-color: var(--cream); transform: translateY(-2px); }
.topic-index-card h3 {
  font-family: var(--sans);
  font-weight: 800;
  font-size: clamp(22px, 2.5vw, 28px);
  letter-spacing: -0.02em;
  line-height: 1.18;
  margin: 0 0 14px;
  color: var(--off-white);
  text-wrap: balance;
}
.topic-index-card p {
  font-family: var(--body);
  font-size: 15px;
  line-height: 1.55;
  color: var(--muted);
  margin: 0;
  max-width: 60ch;
}
.topic-index-arrow { position: absolute; top: 32px; right: 36px; color: var(--cream); font-size: 20px; }
</style>
</head>
<body>

<nav class="nav">
  <div class="container nav-inner">
    <a href="../index.html" class="brand">
      <img class="brand-logo" src="../assets/logo-white.png" alt="Founders In Motion" />
      <span class="brand-text">Founders <em>In Motion</em></span>
    </a>
    <div class="nav-links">
      <a href="../episodes/">Episodes</a>
      <a href="../index.html#faq">Founder Questions</a>
      <a href="../about/">About</a>
    </div>
    <a class="btn btn-primary" href="https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl">
      Listen Free <span aria-hidden="true">→</span>
    </a>
  </div>
</nav>

<main class="topics-index-page">
  <div class="container">
    <header class="topics-index-head">
      <div class="kicker">Topics</div>
      <h1>Founder topics, answered by the archive.</h1>
      <p>Each topic is a question-shaped guide drawing from real founder conversations. Citations link to the exact episode.</p>
    </header>
    <div class="topic-index-grid">
      ${cards}
    </div>
  </div>
</main>

<footer>
  <div class="container">
    <div class="footer-row">
      <a href="../index.html" class="brand">
        <img class="brand-logo" src="../assets/logo-white.png" alt="Founders In Motion" style="height: 24px;" />
        <span class="brand-text">Founders <em>In Motion</em></span>
      </a>
      <nav class="footer-nav">
        <a href="https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl">Spotify</a>
        <a href="https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671">Apple</a>
        <a href="https://www.instagram.com/thea.yaps">Instagram</a>
        <a href="https://www.tiktok.com/@foundersinmotion">TikTok</a>
        <a href="https://www.linkedin.com/in/theango/">LinkedIn</a>
      </nav>
      <div class="copyright">© 2026 Founders In Motion · Hosted by Thea Ngo</div>
    </div>
    <div class="footer-mark">Founders <em>In Motion</em></div>
  </div>
</footer>

</body>
</html>
`;
}
