/**
 * Render a single episode page from parsed CMS content + sheet metadata + transcript.
 *
 * Output mirrors the structure of episodes/28-shakeel-lala/index.html so styles
 * already in episodes/episode.css continue to apply.
 */

import { toText } from './parse-doc.js';
import { renderBreadcrumbList } from './render-meta.js';
import fs from 'fs';

/**
 * Sheet titles often follow the YouTube/Spotify pattern
 * `<Headline> | <Guest>, <Company>`. For on-page rendering we want only the
 * headline — the guest + company are already shown separately in the header.
 * Returns the title with everything after the first ` | ` stripped.
 */
function cleanTitle(title) {
  if (!title) return '';
  const idx = title.indexOf(' | ');
  return idx === -1 ? title : title.slice(0, idx).trim();
}

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC_MAP[c]); }
function escAttr(s) { return esc(s); }

/** Custom episode thumbnail (assets/thumbs/<slug>.jpg) absolute URL if present, else null. */
function customThumb(slug) {
  return slug && fs.existsSync(`assets/thumbs/${slug}.jpg`) ? `https://foundersinmotion.tech/assets/thumbs/${slug}.jpg` : null;
}

function initials(name) {
  if (!name) return '??';
  const parts = name.replace(/[&]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '';
  // Accept "2026-05-14" or "May 14, 2026"
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Convert a published_date into an ISO8601 date (YYYY-MM-DD) for
 * article:published_time. Source dates are stored DD/MM/YYYY. Already-ISO
 * values (YYYY-MM-DD) pass through. Returns null if unparseable.
 */
function articleDate(text) {
  if (!text) return null;
  const s = String(text).trim();
  // Already ISO8601 (YYYY-MM-DD, optionally with time)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // DD/MM/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const d = dd.padStart(2, '0');
    const mo = mm.padStart(2, '0');
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
    return `${yyyy}-${mo}-${d}`;
  }
  return null;
}

function durationISO(text) {
  if (!text) return null;
  // Accept "35 min", "1h 8m", "1:08:42", "PT35M", "68 min"
  if (/^PT/i.test(text)) return text.toUpperCase();
  const hms = text.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (hms) {
    const [_, a, b, c] = hms;
    if (c) return `PT${parseInt(a, 10)}H${parseInt(b, 10)}M${parseInt(c, 10)}S`;
    return `PT${parseInt(a, 10)}M${parseInt(b, 10)}S`;
  }
  const h = text.match(/(\d+)\s*h(?:r|our)?s?/i);
  const m = text.match(/(\d+)\s*m(?:in)?/i);
  if (h || m) return `PT${h ? h[1] + 'H' : ''}${m ? m[1] + 'M' : ''}`;
  return null;
}

function durationDisplay(text) {
  if (!text) return '';
  const hms = text.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (hms) {
    const [_, a, b, c] = hms;
    if (c) return `${parseInt(a,10)}h ${b}m`;
    return `${parseInt(a,10)}:${b}`;
  }
  return text;
}

/**
 * Render the JSON-LD PodcastEpisode block.
 */
function renderJsonLd({ ep, content, slug, transcriptSummary }) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    url: `https://foundersinmotion.tech/episodes/${slug}/`,
    name: ep.title,
    datePublished: ep.published_date || undefined,
    duration: durationISO(content.meta.duration_iso || content.meta.duration) || undefined,
    episodeNumber: ep.episode_number,
    description: content.hook || ep.title,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'Founders In Motion',
      url: 'https://foundersinmotion.tech/',
    },
    associatedMedia: ep.spotify_url ? {
      '@type': 'MediaObject',
      contentUrl: ep.spotify_url,
    } : undefined,
    actor: ep.guest_name ? {
      '@type': 'Person',
      name: ep.guest_name,
      jobTitle: content.meta.guest_role || 'Founder',
      affiliation: ep.guest_company ? { '@type': 'Organization', name: ep.guest_company } : undefined,
    } : undefined,
    host: { '@type': 'Person', name: 'Thea Ngo' },
    transcript: transcriptSummary || undefined,
  };
  // Strip undefineds for cleaner output
  const clean = JSON.parse(JSON.stringify(obj));
  return JSON.stringify(clean, null, 2);
}

/**
 * Article JSON-LD — gives AI search engines a second canonical schema for
 * this content beyond PodcastEpisode. Article ranks better for "how-to" and
 * "what-is" queries than PodcastEpisode does.
 */
function renderArticleJsonLd({ ep, content, slug }) {
  const titleShort = (ep.title || '').split(' | ')[0];
  const ytId = (function() {
    if (!ep.youtube_url) return null;
    const m = ep.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  })();
  const img = customThumb(slug) || (ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : `https://foundersinmotion.tech/assets/youtube-banner.png`);
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: titleShort,
    description: content.hook || `${ep.guest_name}, ${ep.guest_company} on Founders In Motion.`,
    url: `https://foundersinmotion.tech/episodes/${slug}/`,
    image: [img],
    datePublished: ep.published_date || undefined,
    dateModified: ep.published_date || undefined,
    author: { '@type': 'Person', name: 'Thea Ngo', url: 'https://foundersinmotion.tech/about/' },
    publisher: {
      '@type': 'Organization',
      name: 'Founders In Motion',
      logo: {
        '@type': 'ImageObject',
        url: 'https://foundersinmotion.tech/assets/logo-white.png',
      },
    },
    about: ep.guest_name ? {
      '@type': 'Person',
      name: ep.guest_name,
      affiliation: ep.guest_company ? { '@type': 'Organization', name: ep.guest_company } : undefined,
    } : undefined,
    // Speakable — voice assistants can read the TL;DR and key claims aloud.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.ep-tldr-a', '.lead', '.claim .txt'],
    },
  };
  const clean = JSON.parse(JSON.stringify(obj));
  return JSON.stringify(clean, null, 2);
}

/**
 * Generate FAQPage JSON-LD from the structured content. Pulls Q&As from:
 *   - The hook (overview question)
 *   - Guest identity (who they are)
 *   - Each key claim (statistic Q&As)
 *   - Each theme (topic Q&As)
 * Skips anything without good structured data so we don't emit empty Q&As.
 */
function renderFaqJsonLd({ ep, content }) {
  const qas = [];
  const titleShort = (ep.title || '').split(' | ')[0];

  if (content.hook) {
    qas.push({
      q: `What is Founders In Motion Ep ${ep.episode_number} about?`,
      a: `Ep ${ep.episode_number} is titled "${titleShort}" and features ${ep.guest_name}${ep.guest_company ? `, ${ep.guest_company}` : ''}. ${content.hook}`,
    });
  }

  if (ep.guest_name && content.meta.guest_bio) {
    qas.push({
      q: `Who is ${ep.guest_name}?`,
      a: `${ep.guest_name} is the ${content.meta.guest_role || 'founder'} of ${ep.guest_company || ''}. ${content.meta.guest_bio}`,
    });
  }

  if (Array.isArray(content.keyClaims)) {
    for (const { label, text } of content.keyClaims) {
      if (!label || !text) continue;
      qas.push({
        q: `What does "${label}" mean in ${ep.guest_name}'s story?`,
        a: text,
      });
    }
  }

  if (Array.isArray(content.themes)) {
    for (const { label, text } of content.themes) {
      if (!label || !text) continue;
      qas.push({
        q: `What does ${ep.guest_name} mean by "${label}"?`,
        a: text,
      });
    }
  }

  if (qas.length === 0) return null;

  const obj = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  return JSON.stringify(obj, null, 2);
}

/**
 * Render Person + Organization JSON-LD for the guest and their company.
 * Helps AI search build entity graphs (Shakeel Lala → Marloo → Financial Advice AI).
 */
function renderPersonOrgJsonLd({ ep, content, slug }) {
  const guestUrl = `https://foundersinmotion.tech/episodes/${slug}/`;
  const out = [];

  // Stable @id anchors — question pages reference these same identifiers so
  // crawlers reconcile the guest/company as ONE entity across the whole site.
  const personId = `${guestUrl}#guest`;
  const companyId = `${guestUrl}#company`;
  const tags = (content.meta.tags || '').split(/\s*[·|]\s*/).map(s => s.trim()).filter(Boolean);

  if (ep.guest_name) {
    const person = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': personId,
      name: ep.guest_name,
      jobTitle: content.meta.guest_role || 'Founder',
      url: guestUrl,
      mainEntityOfPage: guestUrl,
    };
    if (ep.guest_company) {
      person.affiliation = { '@id': companyId };
      person.worksFor = { '@id': companyId };
    }
    if (content.meta.guest_bio) {
      person.description = content.meta.guest_bio;
    }
    if (tags.length) person.knowsAbout = tags;
    out.push(JSON.stringify(person, null, 2));
  }

  if (ep.guest_company && content.meta.guest_bio) {
    const org = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': companyId,
      name: ep.guest_company,
      founder: { '@id': personId },
      url: guestUrl,
    };
    out.push(JSON.stringify(org, null, 2));
  }

  return out;
}

/**
 * VideoObject + Clip JSON-LD from the episode's YouTube video and chapters —
 * makes the episode eligible for "key moments" jump links in video results.
 */
function renderVideoJsonLd({ ep, content, slug }) {
  const ytId = (() => {
    if (!ep.youtube_url) return null;
    const m = ep.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  })();
  if (!ytId) return null;

  const pageUrl = `https://foundersinmotion.tech/episodes/${slug}/`;
  const watchUrl = `https://www.youtube.com/watch?v=${ytId}`;

  const toSeconds = (t) => {
    const parts = String(t).split(':').map(Number);
    if (parts.some(isNaN)) return null;
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  };
  const isoToSeconds = (iso) => {
    const m = String(iso || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!m) return null;
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  };

  const chapters = (content.chapters || [])
    .map(c => ({ ...c, start: toSeconds(c.time) }))
    .filter(c => c.start !== null);
  const totalSeconds = isoToSeconds(content.meta.duration_iso);

  const clips = chapters.map((c, i) => {
    const clip = {
      '@type': 'Clip',
      name: c.label + (c.sub ? ` — ${c.sub}` : ''),
      startOffset: c.start,
      url: `${watchUrl}&t=${c.start}s`,
    };
    const end = i + 1 < chapters.length ? chapters[i + 1].start : totalSeconds;
    if (end && end > c.start) clip.endOffset = end;
    return clip;
  });

  const video = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: ep.title,
    description: content.hook || ep.short_desc || ep.title,
    thumbnailUrl: [`https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`],
    uploadDate: (() => {
      const m = String(ep.published_date || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : (ep.published_date || undefined);
    })(),
    duration: content.meta.duration_iso || undefined,
    contentUrl: watchUrl,
    embedUrl: `https://www.youtube.com/embed/${ytId}`,
    mainEntityOfPage: pageUrl,
    publisher: { '@type': 'Organization', name: 'Founders In Motion', url: 'https://foundersinmotion.tech/' },
  };
  if (clips.length >= 3) video.hasPart = clips;

  return JSON.stringify(video, null, 2);
}

function renderHeader({ ep, content }) {
  const tags = (content.meta.tags || '').split(/\s*[·|]\s*/).filter(Boolean);
  const tagsLine = ['Episode ' + ep.episode_number, ...tags].join(' · ');
  const guestRole = content.meta.guest_role || `Co-founder, ${ep.guest_company || ''}`.replace(/, $/, '');
  const guestBio = content.meta.guest_bio || '';
  const miniStats = (content.meta.mini_stats || '').split('|').map(s => s.trim()).filter(Boolean);
  const statsHtml = miniStats.length === 4 ? miniStats.map(s => {
    const m = s.match(/^(\S+)\s+(.+)$/);
    if (!m) return `<div><div class="v">${esc(s)}</div><div class="l"></div></div>`;
    return `<div><div class="v">${esc(m[1])}</div><div class="l">${esc(m[2])}</div></div>`;
  }).join('') : '';

  const released = formatDate(ep.published_date);
  const durDisp = durationDisplay(content.meta.duration);

  return `    <header class="ep-head">
      <div>
        <div class="ep-num">${esc(tagsLine)}</div>
        <h1 class="ep-title">${esc(cleanTitle(ep.title))}</h1>
        <div class="ep-meta-row">
          ${released ? `<span><b>Released:</b> ${esc(released)}</span>` : ''}
          ${durDisp ? `<span><b>Duration:</b> ${esc(durDisp)}</span>` : ''}
          ${ep.guest_name ? `<span><b>Guest:</b> ${esc(ep.guest_name)}${ep.guest_company ? `, ${esc(guestRole)}` : ''}</span>` : ''}
        </div>
      </div>
      <aside class="ep-guest-card">
        <div class="avatar">${esc(initials(ep.guest_name))}</div>
        <h4>${esc(ep.guest_name)}</h4>
        <div class="role">${esc(guestRole)}</div>
        ${guestBio ? `<p style="font-size:13px;color:var(--muted);line-height:1.55;margin:0 0 8px;">${esc(guestBio)}</p>` : ''}
        ${statsHtml ? `<div class="stats-mini">${statsHtml}</div>` : ''}
      </aside>
    </header>`;
}

/**
 * Embed the YouTube player at the very top of the page. AEO win — the
 * crawler sees the video URL + duration + transcript on the same page.
 * For users, it's the "watch right here" pattern that podcast landing pages
 * use.
 */
function renderYouTubeEmbed({ ep }) {
  const ytId = (function() {
    if (!ep.youtube_url) return null;
    const m = ep.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  })();
  if (!ytId) return '';
  // youtube-nocookie + lazy load = best UX + privacy.
  return `    <div class="ep-video">
      <iframe
        src="https://www.youtube-nocookie.com/embed/${esc(ytId)}?rel=0"
        title="${esc(ep.title || 'Founders In Motion episode')}"
        frameborder="0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen></iframe>
    </div>`;
}

/**
 * TL;DR — the Hook framed as a question + answer. Sits above the fold so
 * AI search engines and human skimmers both extract the value in one read.
 */
function renderTldr({ ep, content }) {
  if (!content?.hook) return '';
  const guestFirst = (ep.guest_name || '').split(/\s+/)[0];
  return `    <section class="ep-tldr" aria-label="Episode summary">
      <div class="ep-tldr-q">In one paragraph: what's this episode about?</div>
      <p class="ep-tldr-a">${esc(content.hook)}</p>
      ${ep.guest_name ? `<div class="ep-tldr-meta">Answered by <b>${esc(ep.guest_name)}</b>${ep.guest_company ? `, ${esc(ep.guest_company)}` : ''} — interviewed by Thea Ngo.</div>` : ''}
    </section>`;
}

function renderListen({ ep }) {
  const yt = ep.youtube_url || 'https://www.youtube.com/@foundersinmotion';
  const sp = ep.spotify_url || 'https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl';
  const ap = ep.apple_url || 'https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671';
  return `    <div class="listen-row">
      <a href="${escAttr(yt)}" class="listen-btn primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>
        Watch on YouTube
      </a>
      <a href="${escAttr(sp)}" class="listen-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 100 24 12 12 0 000-24zm5.5 17.3a.75.75 0 01-1 .25c-2.7-1.6-6.1-2-10.1-1.1a.75.75 0 11-.3-1.5c4.4-1 8.2-.5 11.2 1.3.4.3.5.7.2 1zm1.5-3.4a.94.94 0 01-1.3.3c-3.1-1.9-7.9-2.5-11.6-1.4a.94.94 0 11-.5-1.8c4.3-1.3 9.6-.6 13.1 1.6.5.3.6.9.3 1.3zm.1-3.5C15.3 8.2 8.6 7.9 5.1 9a1.1 1.1 0 11-.7-2.1c4.1-1.3 11.4-1 15.7 1.6a1.1 1.1 0 11-1.1 1.9z"/></svg>
        Spotify
      </a>
      <a href="${escAttr(ap)}" class="listen-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.1 6.2c.9 0 2-.6 2.7-1.4.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-1 2.8zM15 12.8c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9s-1.9-.9-3.1-.9c-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.6-.8 3.1-.8s1.9.8 3.1.8c1.3 0 2.1-1.2 2.9-2.3 1-1.4 1.3-2.7 1.4-2.7 0 0-2.7-1-2.7-3.8z"/></svg>
        Apple Podcasts
      </a>
    </div>`;
}

function renderStory({ ep, content }) {
  const story = content.story;
  if (!story || story.length === 0) return '';
  const [lead, ...rest] = story;
  const leadHtml = `<p class="lead">${lead}</p>`;
  const restHtml = rest.map(p => `<p>${p}</p>`).join('\n          ');
  // Question-shaped H2 — AI search engines parse these as answer anchors.
  // E.g. "How did Shakeel Lala raise venture capital before having a business idea?"
  const guestRef = ep.guest_name || 'this founder';
  const titleShort = (ep.title || '').split(' | ')[0].replace(/^[^:]+:\s*/, '');
  const h2 = titleShort
    ? `How ${esc(guestRef)} did it: ${esc(titleShort)}`
    : `The full story`;
  return `        <h2>${h2}</h2>
          ${leadHtml}
          ${restHtml}`;
}

function renderWhatYoullHear(items) {
  if (!items || items.length === 0) return '';
  const lis = items.map(({ label, text }) =>
    label ? `<li><b>${esc(label)}</b> — ${text}</li>` : `<li>${text}</li>`
  ).join('\n            ');
  return `        <h2>What you'll hear</h2>
        <ul>
            ${lis}
        </ul>`;
}

function renderKeyClaims(items) {
  if (!items || items.length === 0) return '';
  const cards = items.map(({ label, text }) =>
    `<div class="claim">
            <div class="num">${esc(label || '')}</div>
            <div class="txt">${text}</div>
          </div>`
  ).join('\n          ');
  return `        <h2>Key claims from this episode</h2>
        <div class="claims">
          ${cards}
        </div>`;
}

function renderChapters(chapters) {
  if (!chapters || chapters.length === 0) return '';
  const rows = chapters.map(({ time, label, sub }) =>
    `<div class="ts-row"><div class="ts-time">${esc(time)}</div><div class="ts-label">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`
  ).join('\n          ');
  return `        <h2>Chapters</h2>
        <div class="timestamps">
          ${rows}
        </div>`;
}

function renderQuotes(quotes) {
  if (!quotes || quotes.length === 0) return '';
  const blocks = quotes.map(({ text, attr }) =>
    `<div class="pq">
          <q>${text}</q>
          ${attr ? `<span class="attr">— ${esc(attr)}</span>` : ''}
        </div>`
  ).join('\n\n        ');
  return `        <h2>Quotes from this episode</h2>

        ${blocks}`;
}

function renderThemes(themes, guestFirstName) {
  if (!themes || themes.length === 0) return '';
  const lis = themes.map(({ label, text }) =>
    label ? `<li><b>${esc(label)}</b> — ${text}</li>` : `<li>${text}</li>`
  ).join('\n          ');
  return `        <h2>Themes ${esc(guestFirstName || 'they')} returns to</h2>
        <ul>
          ${lis}
        </ul>`;
}

function renderSidebar({ content, ep, slug, episodes }) {
  const blocks = [];

  if (content.mentioned && content.mentioned.length > 0) {
    const lis = content.mentioned.map(({ label, text }) =>
      label ? `<li><b>${esc(label)}</b>${text ? `<br /><i>${text}</i>` : ''}</li>` : `<li>${text}</li>`
    ).join('\n            ');
    blocks.push(`<div class="side-block">
          <h5>Mentioned in episode</h5>
          <ul>
            ${lis}
          </ul>
        </div>`);
  }

  if (content.background && content.background.length > 0) {
    const lis = content.background.map(({ label, text }) =>
      label ? `<li><b>${esc(label)}</b> — ${text}</li>` : `<li>${text}</li>`
    ).join('\n            ');
    blocks.push(`<div class="side-block">
          <h5>${esc(content.meta.background_title || 'Background')}</h5>
          <ul>
            ${lis}
          </ul>
        </div>`);
  }

  const tweet = content.meta.twitter_share || `${ep.guest_name} on Founders In Motion. ${content.hook || ep.title}`;
  const shareUrl = `https://foundersinmotion.tech/episodes/${slug}/`;
  blocks.push(`<div class="side-block">
          <h5>Share this episode</h5>
          <ul>
            <li><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}" target="_blank" rel="noreferrer">Share on X ↗</a></li>
            <li><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noreferrer">Share on LinkedIn ↗</a></li>
          </ul>
        </div>`);

  return `      <aside class="ep-side">

        ${blocks.join('\n\n        ')}

      </aside>`;
}

function renderTranscript({ ep, content, transcriptText, durationDisp }) {
  const wordCount = transcriptText ? transcriptText.split(/\s+/).filter(Boolean).length : 0;
  const wordLabel = wordCount > 1000 ? `~${(Math.round(wordCount / 100) * 100).toLocaleString()} words` : `${wordCount} words`;
  const durLabel = durationDisp ? ` · ${esc(durationDisp)}` : '';

  // Render the transcript as paragraphs, keeping speaker tags if present.
  // The existing manual pages alternate speaker tags. For auto, we just split by paragraph.
  let body = '';
  if (transcriptText) {
    const paras = transcriptText
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);
    body = paras.map(p => {
      // If line starts with "TN " or "SL " etc, format as speaker turn
      const sm = p.match(/^([A-Z]{2,3})\s+(.+)$/s);
      if (sm) return `<p><b>${esc(sm[1])}</b> ${esc(sm[2].replace(/\s+/g, ' '))}</p>`;
      return `<p>${esc(p.replace(/\s+/g, ' '))}</p>`;
    }).join('\n\n        ');
  } else {
    body = `<p style="color:var(--muted);font-style:italic;text-align:center;padding:32px 0;">Full transcript will appear here once available.</p>`;
  }

  return `    <details class="transcript" id="transcript">
      <summary>Full transcript <small>${wordLabel}${durLabel}</small></summary>
      <div class="transcript-body">

        <div class="transcript-note">
          This is an auto-generated transcript, lightly edited for readability. Timestamps reference the audio version. If you spot an error, <a href="mailto:hi@foundersinmotion.tech" style="color:var(--cream);">let us know</a>.
        </div>

        ${body}

      </div>
    </details>`;
}

/**
 * Linked list of the questions this episode answers — each points at its
 * canonical /questions/<slug>/ page (internal-link mesh: episode ↔ questions).
 */
function renderEpisodeQuestions({ ep }) {
  const entries = (ep.qaEntries || []).filter(e => e.slug && e.question);
  if (entries.length === 0) return '';
  const items = entries.map(e =>
    `<li><a href="../../questions/${esc(e.slug)}/">${esc(e.question)}</a></li>`
  ).join('\n        ');
  return `    <section class="ep-questions" aria-label="Questions answered in this episode">
      <h2>Questions ${esc(ep.guest_name)} answers in this episode</h2>
      <ul>
        ${items}
      </ul>
    </section>`;
}

function renderRelated({ ep, allEpisodes }) {
  // Pick two other episodes with rich pages, prioritizing nearest episode_number.
  const candidates = allEpisodes
    .filter(e => e.has_episode_page && e.episode_number !== ep.episode_number)
    .sort((a, b) => Math.abs(a.episode_number - ep.episode_number) - Math.abs(b.episode_number - ep.episode_number));
  const picks = candidates.slice(0, 2);
  if (picks.length === 0) return '';
  const cards = picks.map(e => {
    const tag = (e.tags && e.tags[0]) || 'Episode';
    return `<a href="../${esc(e.slug)}/" class="rel-card">
          <div class="tag">Episode ${e.episode_number} · ${esc(tag)}</div>
          <h3>${esc(e.title)}</h3>
          <p>${esc(e.short_desc || '')}</p>
        </a>`;
  }).join('\n        ');
  return `    <section class="related">
      <h2>If you liked this episode</h2>
      <div class="related-grid">
        ${cards}
      </div>
    </section>`;
}

/**
 * Render a complete episode page.
 *
 * @param {object} args
 * @param {object} args.ep       — sheet row: episode_number, title, guest_name, guest_company, ...
 * @param {object} args.content  — parsed CMS content from parseEpisodeDoc()
 * @param {string} args.slug     — folder slug (e.g. "28-shakeel-lala")
 * @param {string} [args.transcriptText]    — full transcript text (chunk later by Algolia)
 * @param {string} [args.transcriptSummary] — short summary for JSON-LD transcript field
 * @param {object[]} [args.allEpisodes]     — for related-episodes selection
 * @returns {string} HTML document
 */
export function renderEpisodePage({ ep, content, slug, transcriptText, transcriptSummary, allEpisodes = [] }) {
  const guestFirst = (ep.guest_name || '').split(/\s+/)[0];
  const metaDesc = content.meta.meta_description || content.hook ||
    `${ep.guest_name}${ep.guest_company ? `, ${ep.guest_company}` : ''}, on Founders In Motion.`;
  const headlineOnly = cleanTitle(ep.title);
  const pageTitle = `Ep ${ep.episode_number}: ${headlineOnly} — ${ep.guest_name}${ep.guest_company ? `, ${ep.guest_company}` : ''} | Founders In Motion`;

  const transcriptForJsonLd = transcriptSummary || (transcriptText ? transcriptText.slice(0, 800).replace(/\s+/g, ' ').trim() + '…' : `Conversation with ${ep.guest_name} on Founders In Motion.`);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
<meta name="author" content="Thea Ngo" />
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(metaDesc)}" />
<link rel="canonical" href="https://foundersinmotion.tech/episodes/${slug}/" />
<meta property="og:url" content="https://foundersinmotion.tech/episodes/${slug}/" />
<meta property="og:site_name" content="Founders In Motion" />

<meta property="og:title" content="${esc(`Ep ${ep.episode_number}: ${headlineOnly} — ${ep.guest_name}, ${ep.guest_company || ''}`).replace(/, $/, '')}" />
<meta property="og:description" content="${esc(metaDesc)}" />
<meta property="twitter:title" content="${esc(`Ep ${ep.episode_number}: ${headlineOnly} — ${ep.guest_name}, ${ep.guest_company || ''}`).replace(/, $/, '')}" />
<meta property="twitter:description" content="${esc(metaDesc)}" />
<meta property="og:type" content="article" />
${(() => {
  const ad = articleDate(ep.published_date);
  return ad ? `<meta property="article:published_time" content="${ad}" />
<meta property="article:author" content="Thea Ngo" />` : '';
})()}
${(() => {
  // Use YouTube thumbnail as OG image — automatic, episode-specific, free.
  // maxresdefault.jpg is the high-quality (1280x720) version when available.
  const ytId = (function() {
    if (!ep.youtube_url) return null;
    const m = ep.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  })();
  const ct = customThumb(slug);
  if (ct) return `<meta property="og:image" content="${ct}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${ct}" />`;
  if (!ytId) return `<meta property="og:image" content="https://foundersinmotion.tech/assets/youtube-banner.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://foundersinmotion.tech/assets/youtube-banner.png" />`;
  const og = `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`;
  return `<meta property="og:image" content="${og}" />
<meta property="og:image:width" content="1280" />
<meta property="og:image:height" content="720" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${og}" />`;
})()}

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../../styles.css" />
<link rel="stylesheet" href="../episode.css" />

<!-- JSON-LD: PodcastEpisode with transcript -->
<script type="application/ld+json">
${renderJsonLd({ ep, content, slug, transcriptSummary: transcriptForJsonLd })}
</script>

<!-- JSON-LD: BreadcrumbList (AEO crawl signal) -->
<script type="application/ld+json">
${renderBreadcrumbList({ ep, slug })}
</script>
${(() => {
  const faq = renderFaqJsonLd({ ep, content });
  return faq ? `\n<!-- JSON-LD: FAQPage (per-episode, AEO long-tail) -->\n<script type="application/ld+json">\n${faq}\n</script>` : '';
})()}
${renderPersonOrgJsonLd({ ep, content, slug }).map(json => `\n<!-- JSON-LD: Person/Organization (entity graph) -->\n<script type="application/ld+json">\n${json}\n</script>`).join('')}

<!-- JSON-LD: Article + Speakable (AEO + voice search) -->
<script type="application/ld+json">
${renderArticleJsonLd({ ep, content, slug })}
</script>
${(() => {
  const video = renderVideoJsonLd({ ep, content, slug });
  return video ? `\n<!-- JSON-LD: VideoObject + Clip key moments -->\n<script type="application/ld+json">\n${video}\n</script>` : '';
})()}

</head>
<body>

<!-- Nav (matching homepage) -->
<nav class="nav">
  <div class="container nav-inner">
    <a href="../../index.html" class="brand">
      <img class="brand-logo" src="../../assets/logo-white.png" alt="Founders In Motion" />
      <span class="brand-text">Founders <em>In Motion</em></span>
    </a>
    <div class="nav-links">
      <a href="../">Episodes</a>
      <a href="../../questions/">Founder Questions</a>
      <a href="../../about/">About</a>
    </div>
    <a class="btn btn-primary" href="${escAttr(ep.spotify_url || 'https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl')}">
      Listen Free <span aria-hidden="true">→</span>
    </a>
  </div>
</nav>

<main class="ep-page">
  <div class="container">

    <!-- Breadcrumb -->
    <div class="ep-breadcrumb">
      <a href="../../index.html">Founders In Motion</a> &nbsp;/&nbsp;
      <a href="../">Episodes</a> &nbsp;/&nbsp;
      Ep ${ep.episode_number}
    </div>

${renderHeader({ ep, content })}

${renderYouTubeEmbed({ ep })}

${renderTldr({ ep, content })}

${renderListen({ ep })}

    <!-- Body grid -->
    <div class="ep-body">

      <!-- MAIN COLUMN -->
      <article class="ep-main">

${renderStory({ ep, content })}

${renderWhatYoullHear(content.whatYoullHear)}

${renderKeyClaims(content.keyClaims)}

${renderChapters(content.chapters)}

${renderQuotes(content.quotes)}

${renderThemes(content.themes, guestFirst)}

      </article>

      <!-- SIDEBAR -->
${renderSidebar({ content, ep, slug, episodes: allEpisodes })}
    </div>

${renderTranscript({ ep, content, transcriptText, durationDisp: durationDisplay(content.meta.duration) })}

${renderEpisodeQuestions({ ep })}

${renderRelated({ ep, allEpisodes })}

  </div>
</main>

<!-- Footer (matching homepage) -->
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
        <a href="https://www.youtube.com/@foundersinmotion">YouTube</a>
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

export { initials, formatDate, durationDisplay, durationISO };
