/**
 * FiM site sync — runs every 6h via .github/workflows/sync.yml.
 *
 * Inputs (Google = source of truth):
 *   1. Episodes sheet     — episode_number, title, guest_name, guest_company,
 *                           youtube_url, spotify_url, apple_url, published_date,
 *                           tags (pipe-sep), featured (TRUE/FALSE), short_desc
 *   2. Settings sheet     — site-wide config + folder IDs
 *   3. Transcript folder  — Google Docs named "Ep XX - GuestName" with the
 *                           speaker-tagged transcript
 *   4. Content folder     — Google Docs named "Ep XX - GuestName" with H1
 *                           sections (Hook, Story, Chapters, Quotes, etc.)
 *                           See scripts/lib/parse-doc.js for the contract.
 *
 * Outputs (committed back to the repo by the GH Action):
 *   - settings.json
 *   - data.jsx                        (homepage React content — generated)
 *   - episodes/index.html                 (archive page — generated)
 *   - episodes/<n>-<slug>/index.html      (one per episode with a content doc)
 *   - Algolia: chunked transcript records for search
 *
 * Hand-built episode pages (those without a content doc but with an existing
 * episodes/<slug>/index.html) are preserved.
 */

import { google } from 'googleapis';
import algoliasearch from 'algoliasearch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseEpisodeDoc } from './lib/parse-doc.js';
import { renderEpisodePage } from './lib/render-episode.js';
import { renderDataCMS, renderArchivePage } from './lib/render-data.js';
import { renderSitemap, renderRobots, renderLlmsTxt, renderLlmsFullTxt } from './lib/render-meta.js';
import { extractFaqFromDataStatic, renderFaqPageJsonLd, injectFaqIntoIndexHtml } from './lib/render-homepage-faq.js';
import { TOPICS } from './lib/topics-config.js';
import { renderTopicHub, renderTopicsIndex } from './lib/render-topic-hub.js';
import { parseQaPack } from './lib/parse-qa-pack.js';
import { aggregateQuestions } from './lib/aggregate-questions.js';
import { renderQuestionPage, renderQuestionsIndex } from './lib/render-question-hub.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');

const SPREADSHEET_ID = '1E8poisRe7yIdH_7i5fFGXcX0pRHni2s22Cr5Hppn3GA';
const ALGOLIA_INDEX_NAME = 'fim_episodes';
const CHUNK_SIZE = 7000;
const CHUNK_OVERLAP = 200;

// --- Auth -----------------------------------------------------------------

function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim())
    : JSON.parse(fs.readFileSync(path.join(__dirname, '../.secrets/google-service-account.json'), 'utf8'));
  return new google.auth.GoogleAuth({
    credentials: keyJson,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });
}

// --- Sheet readers --------------------------------------------------------

async function getEpisodes(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Episodes!A2:K200',
  });
  const rows = res.data.values || [];
  return rows.filter(row => row[0]).map(row => ({
    episode_number: parseInt(row[0]),
    title: row[1] || '',
    guest_name: row[2] || '',
    guest_company: row[3] || '',
    youtube_url: row[4] || '',
    spotify_url: row[5] || '',
    apple_url: row[6] || '',
    published_date: row[7] || '',
    tags: (row[8] || '').split('|').map(s => s.trim()).filter(Boolean),
    featured: /^true$/i.test(String(row[9] || '').trim()),
    short_desc: row[10] || '',
  }));
}

async function getSettings(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Settings!A2:B50',
  });
  const rows = res.data.values || [];
  const settings = {};
  // Sanitize: strip zero-width/word-joiner/BOM chars that sneak in from sheet
  // copy-paste (they silently break URLs like the Instagram link) and trim.
  rows.forEach(([key, value]) => {
    if (key) settings[key] = String(value == null ? '' : value).replace(/[​-‍⁠﻿]/g, '').trim();
  });
  return settings;
}

// --- Drive helpers --------------------------------------------------------

/**
 * Find a Doc in a Drive folder matching this episode.
 *
 * Robust to sheet renumbering: matches by the full guest name in the Doc title.
 * Docs should be named like "Ep 27 - Shakeel Lala", "Shakeel Lala — Marloo",
 * or anything that contains the full guest name string.
 *
 * If `guestName` is empty, falls back to searching by "Ep XX" prefix (legacy /
 * transcript-folder behaviour).
 */
async function findDocInFolder(auth, folderId, episodeNumber, guestName = '') {
  const drive = google.drive({ version: 'v3', auth });
  const needles = [];
  if (guestName && guestName.trim()) {
    needles.push(guestName.trim());
  }
  // Number fallback only when there's no guest name to anchor on (e.g. transcript folder).
  if (needles.length === 0) {
    const paddedNum = String(episodeNumber).padStart(2, '0');
    needles.push(`Ep ${paddedNum}`);
  }

  for (const needle of needles) {
    const escaped = needle.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const query = `'${folderId}' in parents and name contains '${escaped}' and trashed = false`;
    let files;
    try {
      const res = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, modifiedTime)',
        // Prefer the most recently modified match, so re-uploading a corrected
        // Doc (a newer copy) automatically wins over a stale same-named one —
        // no need to delete the old Doc first (create-only Drive access).
        orderBy: 'modifiedTime desc',
        pageSize: 5,
      });
      files = res.data.files || [];
    } catch (err) {
      continue;
    }
    if (files.length === 0) continue;
    const doc = files.find(f => f.mimeType === 'application/vnd.google-apps.document') || files[0];
    return doc;
  }
  return null;
}

/**
 * Transcript-folder lookup — uses the "Ep XX" prefix, since transcript files
 * are named that way and don't need to track sheet renumbering (the sync
 * doesn't render transcripts at specific URLs, it just chunks them for Algolia).
 */
async function findTranscriptDoc(auth, folderId, episodeNumber) {
  return findDocInFolder(auth, folderId, episodeNumber, '');
}

async function getDocText(auth, fileId, mimeType) {
  const drive = google.drive({ version: 'v3', auth });
  if (mimeType === 'application/vnd.google-apps.document') {
    const res = await drive.files.export({ fileId, mimeType: 'text/plain' }, { responseType: 'text' });
    return res.data;
  } else {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
    return res.data;
  }
}

async function getDocHTML(auth, fileId) {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.export({ fileId, mimeType: 'text/html' }, { responseType: 'text' });
  return res.data;
}

// --- Slug + chunk helpers -------------------------------------------------

function buildSlug(episodeNumber, guestName) {
  const slug = (guestName || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `${episodeNumber}-${slug}`;
}

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Strip SRT subtitle formatting (cue numbers, timestamp ranges, blank lines)
 * leaving just the prose, so transcript chunks read cleanly in search results.
 * Plain-text transcripts pass through unchanged.
 *
 * SRT shape:
 *   42
 *   00:01:23,456 --> 00:01:27,890
 *   Hello, this is the line of dialogue.
 *   <blank>
 */
function stripSrtFormatting(text) {
  if (!text) return '';
  let t = text.replace(/\r\n/g, '\n');
  // Remove SRT timestamp lines
  t = t.replace(/^\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}.*$/gm, '');
  // Remove lone cue numbers (a digit on its own line, immediately followed by a timestamp line was removed above)
  t = t.replace(/^\d+\s*$/gm, '');
  // Collapse runs of blank lines
  t = t.replace(/\n{3,}/g, '\n\n').trim();
  return t;
}

function chunkTranscript(text) {
  if (!text || text.length === 0) return [];
  if (text.length <= CHUNK_SIZE) return [text];
  const chunks = [];
  let start = 0;
  // Minimum advance per iteration — without this, a transcript with few ". " markers
  // can produce hundreds of tiny near-duplicate chunks because lastIndexOf returns a
  // position near the start, breakPoint is small, and `breakPoint - overlap` goes
  // backwards. Always move forward by at least CHUNK_SIZE - CHUNK_OVERLAP.
  const MIN_ADVANCE = CHUNK_SIZE - CHUNK_OVERLAP;
  while (start < text.length) {
    const end = start + CHUNK_SIZE;
    if (end >= text.length) { chunks.push(text.slice(start)); break; }
    const window = text.slice(start, end);
    const lastSentenceEnd = window.lastIndexOf('. ');
    const breakPoint = lastSentenceEnd !== -1 ? start + lastSentenceEnd + 1 : end;
    chunks.push(text.slice(start, breakPoint).trim());
    // Either jump to breakPoint - overlap, OR force-advance by MIN_ADVANCE — whichever is greater.
    const nextStart = Math.max(start + MIN_ADVANCE, breakPoint - CHUNK_OVERLAP);
    if (nextStart <= start) break; // safety net — should never trigger after the above
    start = nextStart;
  }
  return chunks.filter(c => c.length > 0);
}

// --- File-write helpers ---------------------------------------------------

function writeIfChanged(filePath, content) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(REPO_ROOT, filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs)) {
    const existing = fs.readFileSync(abs, 'utf8');
    if (existing === content) return { changed: false, path: abs };
  }
  fs.writeFileSync(abs, content);
  return { changed: true, path: abs };
}

function isGeneratedPage(absPath) {
  if (!fs.existsSync(absPath)) return false;
  const head = fs.readFileSync(absPath, 'utf8').slice(0, 500);
  return head.includes('GENERATED by scripts/sync.js') || head.includes('Generated:');
}

// --- Algolia push ---------------------------------------------------------

async function pushToAlgolia(records) {
  if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_KEY) {
    console.log('⚠️  ALGOLIA_APP_ID/ADMIN_KEY not set — skipping Algolia push.');
    return;
  }
  const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
  const index = client.initIndex(ALGOLIA_INDEX_NAME);
  await index.setSettings({
    // Search aliases first (build-time-generated natural-language phrasings that
    // map user intent to canonical slugs), then question, then answer body.
    searchableAttributes: ['unordered(aliases)', 'unordered(question)', 'unordered(answer)', 'guest_name', 'guest_company', 'title', 'long_form'],
    attributesToSnippet: ['answer:40', 'long_form:30'],
    attributesToHighlight: ['question', 'answer', 'guest_name', 'title'],
    // Rank by recency of source episode (newer wins ties)
    customRanking: ['desc(episode_number)'],
    // Forgiving queries
    removeWordsIfNoResults: 'lastWords',
    typoTolerance: true,
    minWordSizefor1Typo: 4,
    minWordSizefor2Typos: 8,
    queryType: 'prefixLast',
    ignorePlurals: true,
    advancedSyntax: true,
    // One result per question_slug (canonical Q dedupe)
    distinct: 1,
    attributeForDistinct: 'slug_q',
    snippetEllipsisText: '…',
    // Filter-only attributes (not facetable display, but `filters: "type:question"` works)
    attributesForFaceting: ['filterOnly(type)', 'filterOnly(episode_number)'],
  });
  // Atomic full replace: `records` is always the complete corpus, so this
  // also purges records for questions/episodes that have been removed
  // (saveObjects would merge and leave stale entries searchable forever).
  const { objectIDs } = await index.replaceAllObjects(records, { safe: true });
  console.log(`\n✅ Replaced Algolia index with ${objectIDs.length} records`);
}

// --- Main -----------------------------------------------------------------

async function main() {
  console.log('🚀 FiM Sync starting...\n');
  const auth = getGoogleAuth();

  console.log('📊 Reading Episodes sheet...');
  const episodes = await getEpisodes(auth);
  console.log(`   Found ${episodes.length} episodes\n`);

  console.log('⚙️  Reading Settings sheet...');
  const settings = await getSettings(auth);
  console.log(`   Found ${Object.keys(settings).length} settings\n`);

  const transcriptFolder = settings.transcript_folder_id || '1gu8J2FRG35Z37evtSWC0HAtRZPXDh2QT';
  const contentFolder    = settings.episode_content_folder_id || null;
  const qaBankFolder     = settings.qa_bank_folder_id || null;
  if (qaBankFolder) console.log(`💬 Q&A bank folder: ${qaBankFolder}`);
  else console.log('ℹ️  No qa_bank_folder_id in Settings sheet — /questions/ pages will not be generated.');

  if (!contentFolder) {
    console.log('ℹ️  No episode_content_folder_id in Settings sheet.');
    console.log('   Episode pages will not be auto-generated. To enable: add a row to Settings —');
    console.log('   key: episode_content_folder_id   value: <Drive folder ID>\n');
  } else {
    console.log(`📁 Content folder: ${contentFolder}\n`);
  }

  // Load build-time-generated aliases — natural-language phrasings per canonical
  // slug. These are why search "feels smart" without runtime API calls. Generated
  // by Claude at content time (see aliases.json + AGENT-PLAYBOOK.md).
  const aliasesPath = path.join(REPO_ROOT, 'aliases.json');
  const aliasesBySlug = (() => {
    if (!fs.existsSync(aliasesPath)) return {};
    try {
      const raw = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));
      const out = {};
      for (const [k, v] of Object.entries(raw)) {
        if (k.startsWith('_')) continue;
        if (Array.isArray(v)) out[k] = v;
      }
      return out;
    } catch (err) {
      console.log(`⚠️  aliases.json parse failed: ${err.message}`);
      return {};
    }
  })();
  if (Object.keys(aliasesBySlug).length > 0) {
    const total = Object.values(aliasesBySlug).reduce((a, v) => a + v.length, 0);
    console.log(`🪶 aliases.json: ${Object.keys(aliasesBySlug).length} slugs, ${total} total phrasings`);
  }

  // ----- PASS 1: fetch all transcripts + content docs ---------------------

  const enriched = [];
  const algoliaRecords = [];

  for (const ep of episodes) {
    console.log(`EP${String(ep.episode_number).padStart(2, '0')} — ${ep.guest_name} (${ep.guest_company})`);
    const slug = buildSlug(ep.episode_number, ep.guest_name);

    // Transcript
    let transcriptText = '';
    const transcriptDoc = await findTranscriptDoc(auth, transcriptFolder, ep.episode_number);
    if (transcriptDoc) {
      console.log(`  📄 Transcript: ${transcriptDoc.name}`);
      try {
        transcriptText = await getDocText(auth, transcriptDoc.id, transcriptDoc.mimeType);
        transcriptText = stripSrtFormatting(transcriptText);
        console.log(`  ✓ Transcript: ${transcriptText.length.toLocaleString()} chars`);
      } catch (err) {
        console.log(`  ❌ Transcript fetch failed: ${err.message}`);
      }
    } else {
      console.log(`  ⚠️  No transcript found`);
    }

    // Content doc
    let content = null;
    if (contentFolder) {
      const contentDoc = await findDocInFolder(auth, contentFolder, ep.episode_number, ep.guest_name);
      if (contentDoc) {
        console.log(`  📝 Content doc: ${contentDoc.name}`);
        try {
          const html = await getDocHTML(auth, contentDoc.id);
          content = parseEpisodeDoc(html);
          const populatedSections = Object.entries(content)
            .filter(([_, v]) => Array.isArray(v) ? v.length : v)
            .map(([k]) => k);
          console.log(`  ✓ Parsed: ${populatedSections.join(', ') || '(empty)'}`);
        } catch (err) {
          console.log(`  ❌ Content parse failed: ${err.message}`);
        }
      } else {
        console.log(`  ℹ️  No content doc — will fall back to existing page or short-desc archive row`);
      }
    }

    // Q&A pack doc (one per episode in the FiM - Q&A Bank folder)
    let qaEntries = [];
    if (qaBankFolder) {
      const qaDoc = await findDocInFolder(auth, qaBankFolder, ep.episode_number, ep.guest_name);
      if (qaDoc) {
        console.log(`  💬 Q&A pack: ${qaDoc.name}`);
        try {
          const html = await getDocHTML(auth, qaDoc.id);
          qaEntries = parseQaPack(html);
          console.log(`  ✓ Parsed: ${qaEntries.length} Q&A${qaEntries.length === 1 ? '' : 's'} (slugs: ${qaEntries.map(e => e.slug).join(', ')})`);
        } catch (err) {
          console.log(`  ❌ Q&A parse failed: ${err.message}`);
        }
      }
    }

    // Existing hand-built page?
    const handBuiltPath = path.join(REPO_ROOT, 'episodes', slug, 'index.html');
    const handBuiltExists = !content && fs.existsSync(handBuiltPath) && !isGeneratedPage(handBuiltPath);
    if (handBuiltExists) {
      console.log(`  ↪︎  Hand-built page preserved at episodes/${slug}/`);
    }

    enriched.push({
      ...ep,
      slug,
      transcript: transcriptText,
      content,
      qaEntries,
      has_episode_page: Boolean(content) || handBuiltExists,
    });

    // Algolia records — header + transcript chunks
    const youtubeId = getYouTubeId(ep.youtube_url);
    const episodeMeta = {
      episode_number: ep.episode_number,
      title: ep.title,
      guest_name: ep.guest_name,
      guest_company: ep.guest_company,
      youtube_url: ep.youtube_url,
      youtube_embed: youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null,
      spotify_url: ep.spotify_url,
      apple_url: ep.apple_url,
      published_date: ep.published_date,
      slug,
      has_episode_page: Boolean(content) || handBuiltExists,
    };
    // Episode header record — used for guest/title matches in search
    algoliaRecords.push({ objectID: `ep-${ep.episode_number}`, ...episodeMeta });

    // Q&A entries — these are the PRIMARY search target now. Each becomes a record
    // pointing at /questions/<slug>/ (or to the episode page if you'd rather).
    // Replaces transcript chunks as the search corpus — much higher signal,
    // smaller index, faster ranking, and clicks land on a static answer page.
    for (const entry of (qaEntries || [])) {
      const aliases = aliasesBySlug[entry.slug] || [];
      algoliaRecords.push({
        objectID: `ep-${ep.episode_number}-q-${entry.slug}`,
        type: 'question',
        question: entry.question,
        slug_q: entry.slug,
        answer: entry.answer,
        long_form: (entry.longForm || []).join(' ').slice(0, 2000),
        question_url: `/questions/${entry.slug}/`,
        aliases,
        ...episodeMeta,
      });
    }
    console.log(`  ✓ Built 1 header + ${qaEntries?.length || 0} Q&A record(s)\n`);
  }

  // ----- PASS 2: render pages with full episode list available ------------

  const written = [];

  // Episode pages — only for those with a content doc
  // Provide enriched (with hook, short_desc, tags) as the "related" candidates
  const relatedPool = enriched.map(e => ({
    episode_number: e.episode_number,
    slug: e.slug,
    title: e.title,
    has_episode_page: e.has_episode_page,
    tags: e.tags || [],
    short_desc: e.short_desc || e.content?.hook || '',
  }));

  for (const e of enriched) {
    if (!e.content) continue;
    const html = renderEpisodePage({
      ep: e,
      content: e.content,
      slug: e.slug,
      transcriptText: e.transcript,
      transcriptSummary: e.content.meta.transcript_summary || null,
      allEpisodes: relatedPool,
    });
    const out = writeIfChanged(path.join('episodes', e.slug, 'index.html'), html);
    if (out.changed) written.push(out.path);
    console.log(`📄 episodes/${e.slug}/index.html ${out.changed ? '(written)' : '(unchanged)'}`);
  }

  // Build the merged list for data + archive rendering: prefer content-doc data
  const epsForData = enriched.map(e => ({
    episode_number: e.episode_number,
    title: e.title,
    guest_name: e.guest_name,
    guest_company: e.guest_company,
    youtube_url: e.youtube_url,
    spotify_url: e.spotify_url,
    apple_url: e.apple_url,
    published_date: e.published_date,
    tags: e.tags || [],
    featured: e.featured || false,
    slug: e.slug,
    has_episode_page: e.has_episode_page,
    hook: e.content?.hook || '',
    // Single source of truth: when an episode has a content doc, its Hook drives the
    // homepage card + archive description too (so you only write the description once,
    // in the content doc — not also in the sheet). The sheet's short_desc is only a
    // fallback for episodes that have NO content doc yet.
    short_desc: e.content?.hook || e.short_desc || '',
    duration: e.content?.meta?.duration || '',
    role: e.content?.meta?.guest_role || '',
  }));

  // Homepage data
  const dataJsx = renderDataCMS({ episodes: epsForData, settings });
  const dataOut = writeIfChanged('data.jsx', dataJsx);
  if (dataOut.changed) written.push(dataOut.path);
  console.log(`📝 data.jsx ${dataOut.changed ? '(written)' : '(unchanged)'}`);

  // Archive page
  const archiveHtml = renderArchivePage({ episodes: epsForData, settings });
  const archiveOut = writeIfChanged('episodes/index.html', archiveHtml);
  if (archiveOut.changed) written.push(archiveOut.path);
  console.log(`📝 episodes/index.html ${archiveOut.changed ? '(written)' : '(unchanged)'}`);

  // Topic hub pages — question-shaped guides referencing multiple episodes
  if (TOPICS.length > 0) {
    const epsById = new Map(enriched.map(e => [e.episode_number, e]));
    for (const topic of TOPICS) {
      const html = renderTopicHub({ topic, episodesById: epsById, allTopics: TOPICS });
      const out = writeIfChanged(path.join('topics', topic.slug, 'index.html'), html);
      if (out.changed) written.push(out.path);
      console.log(`📚 topics/${topic.slug}/index.html ${out.changed ? '(written)' : '(unchanged)'}`);
    }
    const indexOut = writeIfChanged('topics/index.html', renderTopicsIndex({ topics: TOPICS }));
    if (indexOut.changed) written.push(indexOut.path);
    console.log(`📚 topics/index.html ${indexOut.changed ? '(written)' : '(unchanged)'}`);
  }

  // Question pages — aggregate Q&A entries across episodes by canonical_slug
  const grouped = aggregateQuestions(
    enriched.map(e => ({ episode: e, entries: e.qaEntries || [] }))
  );
  if (grouped.size > 0) {
    for (const [slug, group] of grouped) {
      const html = renderQuestionPage({ group, allGrouped: grouped });
      const out = writeIfChanged(path.join('questions', slug, 'index.html'), html);
      if (out.changed) written.push(out.path);
      console.log(`❓ questions/${slug}/index.html ${out.changed ? '(written)' : '(unchanged)'} — ${group.contributors.length} contributor${group.contributors.length === 1 ? '' : 's'}`);
    }
    const qIdxOut = writeIfChanged('questions/index.html', renderQuestionsIndex({ grouped }));
    if (qIdxOut.changed) written.push(qIdxOut.path);
    console.log(`❓ questions/index.html ${qIdxOut.changed ? '(written)' : '(unchanged)'} — ${grouped.size} canonical question${grouped.size === 1 ? '' : 's'}`);
  } else {
    console.log('ℹ️  No Q&A packs found yet — /questions/ pages skipped.');
  }

  // Semantic search index — slim JSON shipped to /api/search/ Edge function.
  // One entry per canonical question slug, with the top contributor's metadata.
  // Claude (reranker) reads this entire index + the user's query and picks the
  // best match. No embeddings — just question/answer text + slug.
  const qaIndex = Array.from(grouped.entries()).map(([slug, group]) => {
    const top = group.contributors[0];
    return {
      slug,
      question: group.question,
      answer: top.entry.answer || '',
      episode_number: top.ep.episode_number,
      guest_name: top.ep.guest_name,
      guest_company: top.ep.guest_company,
      ep_slug: top.ep.slug,
      has_episode_page: !!top.ep.has_episode_page,
      spotify_url: top.ep.spotify_url || null,
      contributor_count: group.contributors.length,
    };
  });
  const qaIndexOut = writeIfChanged('qa-index.json', JSON.stringify(qaIndex) + '\n');
  if (qaIndexOut.changed) written.push(qaIndexOut.path);
  console.log(`🧠 qa-index.json ${qaIndexOut.changed ? '(written)' : '(unchanged)'} — ${qaIndex.length} canonical Q&As`);

  // Crawler files — written AFTER question aggregation so sitemap includes them
  const sitemapOut = writeIfChanged('sitemap.xml', renderSitemap({
    episodes: epsForData,
    topics: TOPICS,
    questionSlugs: Array.from(grouped.keys()),
  }));
  if (sitemapOut.changed) written.push(sitemapOut.path);
  console.log(`🗺️  sitemap.xml ${sitemapOut.changed ? '(written)' : '(unchanged)'}`);

  const robotsOut = writeIfChanged('robots.txt', renderRobots());
  if (robotsOut.changed) written.push(robotsOut.path);
  console.log(`🤖 robots.txt ${robotsOut.changed ? '(written)' : '(unchanged)'}`);

  const llmsOut = writeIfChanged('llms.txt', renderLlmsTxt({
    episodes: epsForData,
    settings,
    topics: TOPICS,
    questions: qaIndex,
  }));
  if (llmsOut.changed) written.push(llmsOut.path);
  console.log(`📚 llms.txt ${llmsOut.changed ? '(written)' : '(unchanged)'}`);

  const llmsFullOut = writeIfChanged('llms-full.txt', renderLlmsFullTxt({
    grouped,
    topics: TOPICS,
    settings,
  }));
  if (llmsFullOut.changed) written.push(llmsFullOut.path);
  console.log(`📚 llms-full.txt ${llmsFullOut.changed ? '(written)' : '(unchanged)'}`);

  // Sync homepage FAQ JSON-LD with the hand-curated FAQ in data-static.jsx
  const faqs = extractFaqFromDataStatic(REPO_ROOT);
  if (faqs && faqs.length > 0) {
    const jsonLdBlock = renderFaqPageJsonLd(faqs);
    const indexPath = path.join(REPO_ROOT, 'index.html');
    if (fs.existsSync(indexPath)) {
      const indexHtml = fs.readFileSync(indexPath, 'utf8');
      const updated = injectFaqIntoIndexHtml(indexHtml, jsonLdBlock);
      const idxOut = writeIfChanged('index.html', updated);
      if (idxOut.changed) written.push(idxOut.path);
      console.log(`❓ index.html FAQPage JSON-LD ${idxOut.changed ? '(updated)' : '(unchanged)'} — ${faqs.length} Qs`);
    }
  }

  // Settings
  const settingsOutput = { ...settings, synced_at: new Date().toISOString(), total_episodes: episodes.length };
  const settingsOut = writeIfChanged('settings.json', JSON.stringify(settingsOutput, null, 2) + '\n');
  if (settingsOut.changed) written.push(settingsOut.path);
  console.log(`💾 settings.json ${settingsOut.changed ? '(written)' : '(unchanged)'}\n`);

  // Algolia
  console.log('📡 Pushing to Algolia...');
  await pushToAlgolia(algoliaRecords);

  console.log(`\n📦 Files changed: ${written.length}`);
  written.forEach(p => console.log(`   ${path.relative(REPO_ROOT, p)}`));
  console.log('\n🎉 Sync complete!');
}

main().catch(err => { console.error('❌ Sync failed:', err); process.exit(1); });
