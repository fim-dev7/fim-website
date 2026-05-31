/**
 * Render a /questions/<slug>/ page from one canonical question group.
 *
 * The page is the answer page Thea wants people to land on when they Google
 * (or ChatGPT) the question. It MUST be richly structured + crawlable:
 *   - WebPage JSON-LD with mainEntity = FAQPage (the canonical Q&A)
 *   - QAPage JSON-LD as primary entity (Google supports this for Q&A pages)
 *   - SpeakableSpecification on the question + lead answer (voice search)
 *   - BreadcrumbList
 *   - On-page: question as H1, top contributor's answer prominently, then
 *     stacked contributor cards (one per episode that contributed), each
 *     linking to the episode detail page
 */

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC_MAP[c]); }

const SITE_URL = 'https://foundersinmotion.com';

function initials(name) {
  if (!name) return '??';
  const parts = name.replace(/[&]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function paragraphsHtml(arr) {
  if (!arr || arr.length === 0) return '';
  return arr.map(p => `<p>${p}</p>`).join('\n          ');
}

// Trim an answer down to ~2 sentences for a compact perspective preview.
function previewSentences(text, max = 2) {
  const s = String(text == null ? '' : text).trim();
  if (!s) return '';
  const sentences = s.match(/[^.!?]+[.!?]+(?:["')\]]+)?|\S[^.!?]*$/g);
  if (!sentences) return s;
  const out = sentences.slice(0, max).join(' ').trim();
  // If we truncated and the result doesn't end cleanly, add an ellipsis.
  if (sentences.length > max && !/[.!?]$/.test(out)) return out + '…';
  return out;
}

export function renderQuestionPage({ group, allGrouped }) {
  const { slug, question, contributors } = group;
  const url = `${SITE_URL}/questions/${slug}/`;

  // Combined "answer" for meta + structured data — use the top contributor's short
  // `answer` field as the canonical short answer. If multiple contributors, hint
  // at the breadth.
  const topAnswer = contributors[0]?.entry?.answer || '';
  const metaAnswer = contributors.length > 1
    ? `${topAnswer} (Answered by ${contributors.length} founders in the Founders In Motion archive.)`
    : topAnswer;
  const metaDescription = metaAnswer.slice(0, 250);

  // Related questions: any other canonical slug that shares at least one contributor episode
  const contributorEpNumbers = new Set(contributors.map(c => c.ep.episode_number));
  const related = [];
  if (allGrouped) {
    for (const other of allGrouped.values()) {
      if (other.slug === slug) continue;
      const overlaps = other.contributors.some(c => contributorEpNumbers.has(c.ep.episode_number));
      if (overlaps) related.push(other);
      if (related.length >= 6) break;
    }
  }

  // ----- JSON-LD --------------------------------------------------------------

  const breadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Founders In Motion', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Questions', item: `${SITE_URL}/questions/` },
      { '@type': 'ListItem', position: 3, name: question, item: url },
    ],
  }, null, 2);

  // QAPage — Google's canonical schema for community Q&A. Each contributor is
  // a separate suggestedAnswer. The first contributor's answer is the acceptedAnswer.
  const qaPage = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    url,
    mainEntity: {
      '@type': 'Question',
      name: question,
      url,
      author: { '@type': 'Organization', name: 'Founders In Motion' },
      acceptedAnswer: contributors[0]?.entry?.answer ? {
        '@type': 'Answer',
        text: contributors[0].entry.answer,
        url: contributors[0].ep.has_episode_page ? `${SITE_URL}/episodes/${contributors[0].ep.slug}/` : (contributors[0].ep.spotify_url || url),
        author: {
          '@type': 'Person',
          name: contributors[0].ep.guest_name,
          affiliation: { '@type': 'Organization', name: contributors[0].ep.guest_company },
        },
      } : undefined,
      suggestedAnswer: contributors.slice(1).map(c => ({
        '@type': 'Answer',
        text: c.entry.answer,
        url: c.ep.has_episode_page ? `${SITE_URL}/episodes/${c.ep.slug}/` : (c.ep.spotify_url || url),
        author: {
          '@type': 'Person',
          name: c.ep.guest_name,
          affiliation: { '@type': 'Organization', name: c.ep.guest_company },
        },
      })),
    },
  });

  const speakable = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SpeakableSpecification',
    cssSelector: ['.q-question', '.q-lead-answer'],
  });

  // ----- HTML body ------------------------------------------------------------

  const contributorCards = contributors.map(({ ep, entry }) => {
    const epHref = ep.has_episode_page ? `${SITE_URL}/episodes/${ep.slug}/` : (ep.spotify_url || '#');
    const longBlocks = paragraphsHtml(entry.longForm || []);
    const guestRole = ep.content?.meta?.guest_role || (ep.guest_company ? `Founder, ${ep.guest_company}` : 'Founder');
    return `<article class="q-contributor">
        <header class="q-contributor-head">
          <div class="q-contributor-avatar" aria-hidden>${esc(initials(ep.guest_name))}</div>
          <div class="q-contributor-meta">
            <div class="q-contributor-name"><b>${esc(ep.guest_name)}</b> · <i>${esc(ep.guest_company)}</i></div>
            <div class="q-contributor-ep">EP ${ep.episode_number} · ${esc(guestRole)}</div>
          </div>
          <a href="${esc(epHref)}" class="q-contributor-listen" aria-label="Listen to episode">${ep.has_episode_page ? 'Show notes ↗' : 'Spotify ↗'}</a>
        </header>
        <p class="q-contributor-answer">${esc(entry.answer)}</p>
        ${longBlocks ? `<details class="q-contributor-long">
          <summary>More from this episode</summary>
          ${longBlocks}
        </details>` : ''}
      </article>`;
  }).join('\n\n      ');

  const relatedLinks = related.map(r =>
    `<li><a href="../${esc(r.slug)}/">${esc(r.question)}</a></li>`
  ).join('\n          ');

  // Multiple-perspectives preview — only when more than one founder answered.
  // Each card shows guest + company + a ~2-sentence preview of THEIR answer,
  // a link to their episode, and a <details> revealing their full long-form.
  const multiplePerspectives = contributors.length > 1;
  const perspectiveCards = contributors.map(({ ep, entry }) => {
    const epHref = ep.has_episode_page ? `${SITE_URL}/episodes/${ep.slug}/` : (ep.spotify_url || '#');
    const longBlocks = paragraphsHtml(entry.longForm || []);
    const preview = previewSentences(entry.answer, 2);
    return `<article class="q-perspective">
          <header class="q-perspective-head">
            <div class="q-perspective-avatar" aria-hidden>${esc(initials(ep.guest_name))}</div>
            <div class="q-perspective-who">
              <div class="q-perspective-name">${esc(ep.guest_name)}</div>
              <div class="q-perspective-co">${esc(ep.guest_company)} · EP ${ep.episode_number}</div>
            </div>
          </header>
          <p class="q-perspective-preview">${esc(preview)}</p>
          <div class="q-perspective-actions">
            <a class="q-perspective-link" href="${esc(epHref)}">${ep.has_episode_page ? 'Episode ↗' : 'Listen ↗'}</a>
          </div>
          ${longBlocks ? `<details class="q-perspective-full">
            <summary>See ${esc(ep.guest_name)}'s full take</summary>
            ${longBlocks}
          </details>` : ''}
        </article>`;
  }).join('\n        ');

  const perspectivesSection = multiplePerspectives ? `<section class="q-perspectives" aria-label="Multiple perspectives">
      <h2 class="q-perspectives-title">${contributors.length} founders on this question</h2>
      <p class="q-perspectives-sub">Different founders, different playbooks. Here's how each answered — preview first, full take one click away.</p>
      <div class="q-perspectives-grid">
        ${perspectiveCards}
      </div>
    </section>` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(question)} | Founders In Motion</title>
<meta name="description" content="${esc(metaDescription)}" />
<link rel="canonical" href="${url}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="Founders In Motion" />
<meta property="og:image" content="https://foundersinmotion.com/assets/youtube-banner.png" />
<meta name="twitter:card" content="summary_large_image" />

<meta property="og:title" content="${esc(question)}" />
<meta property="og:description" content="${esc(metaDescription)}" />
<meta property="og:type" content="article" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../../styles.css" />

<!-- JSON-LD: BreadcrumbList -->
<script type="application/ld+json">
${breadcrumb}
</script>

<!-- JSON-LD: QAPage (Google's canonical Q&A markup) -->
<script type="application/ld+json">
${qaPage}
</script>

<!-- JSON-LD: SpeakableSpecification -->
<script type="application/ld+json">
${speakable}
</script>

<style>
.q-page { padding: 110px 0 80px; }
.q-head { max-width: 760px; margin: 0 auto 56px; }
.q-head .kicker { color: var(--cream); font-family: var(--body); font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
.q-question {
  font-family: var(--sans);
  font-weight: 900;
  font-size: clamp(32px, 5vw, 50px);
  letter-spacing: -0.025em;
  line-height: 1.08;
  margin: 0 0 24px;
  color: var(--off-white);
  text-wrap: balance;
}
.q-lead-answer {
  font-family: var(--body);
  font-size: 20px;
  line-height: 1.5;
  color: var(--off-white);
  margin: 0;
  padding: 24px 28px;
  border-left: 3px solid var(--cream);
  background: rgba(212,168,125,0.05);
  border-radius: 0 12px 12px 0;
}
.q-lead-attribution {
  font-family: var(--body);
  font-size: 13px;
  color: var(--muted);
  margin: 10px 0 0 31px;
}
.q-lead-attribution a { color: var(--cream); text-decoration: none; }
.q-lead-attribution a:hover { text-decoration: underline; }

.q-contributors {
  max-width: 760px;
  margin: 0 auto 56px;
}
.q-contributors > h2 {
  font-family: var(--sans);
  font-weight: 800;
  font-size: clamp(22px, 2.8vw, 28px);
  letter-spacing: -0.02em;
  margin: 0 0 28px;
  color: var(--off-white);
}
.q-contributor {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 30px;
  margin-bottom: 16px;
  background: rgba(255,255,255,0.02);
  transition: border-color 0.15s;
}
.q-contributor:hover { border-color: var(--cream); }
.q-contributor-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.q-contributor-avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--cream);
  color: var(--forest, #172223);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--sans); font-weight: 800; font-size: 14px;
  flex: 0 0 auto;
}
.q-contributor-meta { flex: 1; min-width: 0; }
.q-contributor-name { font-family: var(--body); font-size: 14px; color: var(--muted); }
.q-contributor-name b { color: var(--off-white); font-weight: 600; }
.q-contributor-name i { font-style: italic; color: var(--muted); }
.q-contributor-ep { font-family: var(--sans); font-weight: 700; font-size: 11px; color: var(--cream); letter-spacing: 0.05em; margin-top: 2px; }
.q-contributor-listen { font-family: var(--sans); font-weight: 600; font-size: 12px; color: var(--cream); text-decoration: none; padding: 6px 12px; border: 1px solid var(--cream); border-radius: 6px; flex: 0 0 auto; transition: background 0.15s; }
.q-contributor-listen:hover { background: var(--cream); color: var(--forest, #172223); }
.q-contributor-answer { font-family: var(--body); font-size: 17px; line-height: 1.6; color: var(--off-white); margin: 0; }
.q-contributor-long { margin-top: 12px; }
.q-contributor-long summary { font-family: var(--sans); font-weight: 700; font-size: 13px; color: var(--cream); cursor: pointer; padding: 6px 0; list-style: none; }
.q-contributor-long summary::before { content: "+ "; }
.q-contributor-long[open] summary::before { content: "− "; }
.q-contributor-long p { font-family: var(--body); font-size: 16px; line-height: 1.65; color: var(--off-white); margin: 12px 0; }

/* Multiple-perspectives preview */
.q-perspectives { max-width: 760px; margin: 0 auto 56px; }
.q-perspectives-title {
  font-family: var(--sans);
  font-weight: 800;
  font-size: clamp(22px, 2.8vw, 28px);
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  color: var(--off-white);
}
.q-perspectives-sub { font-family: var(--body); font-size: 15px; line-height: 1.55; color: var(--muted); margin: 0 0 24px; max-width: 60ch; }
.q-perspectives-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.q-perspective {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px 24px;
  background: rgba(255,255,255,0.02);
  transition: border-color 0.15s;
}
.q-perspective:hover { border-color: var(--cream); }
.q-perspective-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.q-perspective-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: var(--cream);
  color: var(--forest, #172223);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--sans); font-weight: 800; font-size: 13px;
  flex: 0 0 auto;
}
.q-perspective-who { min-width: 0; }
.q-perspective-name { font-family: var(--body); font-size: 15px; font-weight: 600; color: var(--off-white); line-height: 1.2; }
.q-perspective-co { font-family: var(--sans); font-weight: 700; font-size: 11px; color: var(--cream); letter-spacing: 0.05em; margin-top: 3px; }
.q-perspective-preview { font-family: var(--body); font-size: 15px; line-height: 1.55; color: var(--off-white); margin: 0 0 14px; }
.q-perspective-actions { margin-bottom: 4px; }
.q-perspective-link { font-family: var(--sans); font-weight: 600; font-size: 12px; color: var(--cream); text-decoration: none; }
.q-perspective-link:hover { text-decoration: underline; }
.q-perspective-full { margin-top: 10px; border-top: 1px solid var(--border); padding-top: 10px; }
.q-perspective-full summary { font-family: var(--sans); font-weight: 700; font-size: 12px; color: var(--cream); cursor: pointer; padding: 4px 0; list-style: none; }
.q-perspective-full summary::before { content: "+ "; }
.q-perspective-full[open] summary::before { content: "− "; }
.q-perspective-full p { font-family: var(--body); font-size: 15px; line-height: 1.6; color: var(--off-white); margin: 10px 0; }
@media (max-width: 640px) { .q-perspectives-grid { grid-template-columns: 1fr; } }

.q-related { max-width: 760px; margin: 0 auto; padding: 32px; border: 1px solid var(--border); border-radius: 16px; background: rgba(255,255,255,0.02); }
.q-related h3 { font-family: var(--sans); font-weight: 800; font-size: 18px; margin: 0 0 16px; color: var(--off-white); }
.q-related ul { list-style: none; padding: 0; margin: 0; }
.q-related li { margin-bottom: 10px; }
.q-related a { font-family: var(--body); font-size: 16px; color: var(--cream); text-decoration: none; }
.q-related a:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .q-contributor { padding: 22px; }
  .q-contributor-head { flex-wrap: wrap; }
  .q-contributor-listen { width: 100%; text-align: center; }
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
      <a href="../../topics/">Topics</a>
      <a href="../../about/">About</a>
    </div>
    <a class="btn btn-primary" href="https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl">
      Listen Free <span aria-hidden="true">→</span>
    </a>
  </div>
</nav>

<main class="q-page">
  <div class="container">

    <header class="q-head">
      <div class="kicker">${contributors.length === 1 ? 'A founder answers' : `${contributors.length} founders answer`}</div>
      <h1 class="q-question">${esc(question)}</h1>
      ${topAnswer ? `<blockquote class="q-lead-answer">${esc(topAnswer)}</blockquote>
      <div class="q-lead-attribution">— <a href="${esc(contributors[0].ep.has_episode_page ? `${SITE_URL}/episodes/${contributors[0].ep.slug}/` : (contributors[0].ep.spotify_url || '#'))}">${esc(contributors[0].ep.guest_name)}, ${esc(contributors[0].ep.guest_company)} (Ep ${contributors[0].ep.episode_number})</a></div>` : ''}
    </header>

    ${perspectivesSection}

    <section class="q-contributors">
      <h2>${contributors.length === 1 ? 'The full answer' : 'What founders in the archive say'}</h2>
      ${contributorCards}
    </section>

    ${related.length > 0 ? `<section class="q-related">
      <h3>Related questions</h3>
      <ul>
          ${relatedLinks}
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
      <div class="copyright">© ${new Date().getFullYear()} Founders In Motion · Hosted by Thea Ngo</div>
    </div>
    <div class="footer-mark">Founders <em>In Motion</em></div>
  </div>
</footer>

</body>
</html>
`;
}

/**
 * Render /questions/index.html — the question index, listing all canonical
 * questions grouped by number of contributors.
 */
export function renderQuestionsIndex({ grouped }) {
  const all = Array.from(grouped.values());
  // Sort: questions with more contributors first, then alphabetical
  all.sort((a, b) => b.contributors.length - a.contributors.length || a.question.localeCompare(b.question));

  const cards = all.map(g => `<a class="q-index-card" href="${esc(g.slug)}/">
        ${g.contributors.length > 1 ? `<span class="q-index-badge">▲ ${g.contributors.length} perspectives</span>` : ''}
        <h3>${esc(g.question)}</h3>
        <p>${esc((g.contributors[0]?.entry?.answer || '').slice(0, 200))}</p>
        <div class="q-index-card-meta">${g.contributors.length === 1
          ? `Answered by ${esc(g.contributors[0].ep.guest_name)}`
          : `Answered by ${g.contributors.length} founders`}</div>
        <span class="q-index-arrow">→</span>
      </a>`).join('\n      ');

  const itemListSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: all.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/questions/${g.slug}/`,
      name: g.question,
    })),
  }, null, 2);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Founder Questions, Answered | Founders In Motion</title>
<meta name="description" content="Every founder question answered by interviews with real early-stage founders. ${all.length} questions, with citations to the exact episode and moment." />
<link rel="canonical" href="${SITE_URL}/questions/" />
<meta property="og:title" content="Founder Questions, Answered | Founders In Motion" />
<meta property="og:description" content="Every founder question answered by interviews with real early-stage founders." />
<meta property="og:type" content="website" />
<meta property="og:url" content="${SITE_URL}/questions/" />
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
      { '@type': 'ListItem', position: 1, name: 'Founders In Motion', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Questions', item: `${SITE_URL}/questions/` },
    ],
  }, null, 2)}
</script>

<!-- JSON-LD: CollectionPage with ItemList -->
<script type="application/ld+json">
${itemListSchema}
</script>

<style>
.q-index-page { padding: 120px 0 96px; }
.q-index-head { max-width: 760px; margin: 0 auto 56px; text-align: center; }
.q-index-head .kicker { color: var(--cream); font-family: var(--body); font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
.q-index-head h1 { font-family: var(--sans); font-weight: 900; font-size: clamp(40px, 6vw, 64px); letter-spacing: -0.03em; line-height: 1.04; margin: 0 0 20px; color: var(--off-white); text-wrap: balance; }
.q-index-head p { font-family: var(--body); font-size: 18px; line-height: 1.55; color: var(--muted); margin: 0; }
.q-index-grid { max-width: 880px; margin: 0 auto; display: grid; gap: 14px; }
.q-index-card {
  display: block;
  padding: 26px 32px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255,255,255,0.02);
  text-decoration: none;
  transition: border-color 0.15s, transform 0.15s;
  position: relative;
}
.q-index-card:hover { border-color: var(--cream); transform: translateY(-1px); }
.q-index-card h3 { font-family: var(--sans); font-weight: 700; font-size: clamp(18px, 2vw, 22px); letter-spacing: -0.015em; line-height: 1.25; margin: 0 0 10px; color: var(--off-white); padding-right: 28px; }
.q-index-card p { font-family: var(--body); font-size: 14px; line-height: 1.55; color: var(--muted); margin: 0 0 10px; max-width: 64ch; }
.q-index-card-meta { font-family: var(--sans); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--cream); }
.q-index-badge { display: inline-block; font-family: var(--sans); font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--cream); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; margin-bottom: 12px; background: rgba(212,168,125,0.06); }
.q-index-arrow { position: absolute; top: 28px; right: 32px; color: var(--cream); font-size: 18px; }
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
      <a href="../topics/">Topics</a>
      <a href="../about/">About</a>
    </div>
    <a class="btn btn-primary" href="https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl">
      Listen Free <span aria-hidden="true">→</span>
    </a>
  </div>
</nav>

<main class="q-index-page">
  <div class="container">
    <header class="q-index-head">
      <div class="kicker">Questions</div>
      <h1>${all.length} founder questions, answered by founders.</h1>
      <p>Every question on this page has a direct, cited answer from a real founder in the archive. Click any question for the full answer + the episode it came from.</p>
    </header>
    <div class="q-index-grid">
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
      <div class="copyright">© ${new Date().getFullYear()} Founders In Motion · Hosted by Thea Ngo</div>
    </div>
    <div class="footer-mark">Founders <em>In Motion</em></div>
  </div>
</footer>

</body>
</html>
`;
}
