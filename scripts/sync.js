import { google } from 'googleapis';
import algoliasearch from 'algoliasearch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SPREADSHEET_ID = '1E8poisRe7yIdH_7i5fFGXcX0pRHni2s22Cr5Hppn3GA';
const TRANSCRIPT_FOLDER_ID = '1gu8J2FRG35Z37evtSWC0HAtRZPXDh2QT';
const ALGOLIA_INDEX_NAME = 'fim_episodes';

const CHUNK_SIZE = 7000;   // max characters per chunk
const CHUNK_OVERLAP = 200; // overlap between consecutive chunks

function getGoogleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    : JSON.parse(fs.readFileSync(path.join(__dirname, '../.secrets/google-service-account.json'), 'utf8'));
  return new google.auth.GoogleAuth({
    credentials: keyJson,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });
}

async function getEpisodes(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Episodes!A2:H100',
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
  rows.forEach(([key, value]) => { if (key) settings[key] = value; });
  return settings;
}

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

async function findTranscriptDoc(auth, episodeNumber) {
  const drive = google.drive({ version: 'v3', auth });
  const paddedNum = String(episodeNumber).padStart(2, '0');
  const query = `'${TRANSCRIPT_FOLDER_ID}' in parents and name contains 'Ep ${paddedNum}' and trashed = false`;
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType)',
    pageSize: 5,
  });
  const files = res.data.files || [];
  if (files.length === 0) {
    console.log(`  ⚠️  No transcript found for EP${paddedNum}`);
    return null;
  }
  const doc = files.find(f => f.mimeType === 'application/vnd.google-apps.document') || files[0];
  console.log(`  📄 Found: ${doc.name}`);
  return doc;
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

function buildSlug(episodeNumber, guestName) {
  const slug = guestName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  return `${episodeNumber}-${slug}`;
}

/**
 * Splits a transcript into overlapping chunks of max CHUNK_SIZE characters,
 * breaking only at sentence boundaries (". " sequences) so chunks are coherent.
 * Each chunk except the first starts with the last ~CHUNK_OVERLAP chars of the
 * previous chunk for context continuity.
 *
 * @param {string} text - Full transcript text
 * @returns {string[]} Array of chunk strings
 */
function chunkTranscript(text) {
  if (!text || text.length === 0) return [];
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + CHUNK_SIZE;

    // If we're at or past the end of the text, take the rest
    if (end >= text.length) {
      chunks.push(text.slice(start));
      break;
    }

    // Find the last ". " within the window so we break at a sentence boundary
    const window = text.slice(start, end);
    const lastSentenceEnd = window.lastIndexOf('. ');

    let breakPoint;
    if (lastSentenceEnd !== -1) {
      // Break after the period (include the period, exclude the trailing space)
      breakPoint = start + lastSentenceEnd + 1;
    } else {
      // No sentence boundary found — hard break at CHUNK_SIZE
      breakPoint = end;
    }

    chunks.push(text.slice(start, breakPoint).trim());

    // Next chunk starts CHUNK_OVERLAP characters before breakPoint for context overlap
    start = Math.max(start + 1, breakPoint - CHUNK_OVERLAP);
  }

  return chunks.filter(c => c.length > 0);
}

async function pushToAlgolia(records) {
  const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
  const index = client.initIndex(ALGOLIA_INDEX_NAME);
  await index.setSettings({
    searchableAttributes: ['guest_name', 'guest_company', 'title', 'chunk_text'],
    attributesToSnippet: ['chunk_text:30'],
    attributesToHighlight: ['title', 'guest_name', 'chunk_text'],
    customRanking: ['desc(episode_number)'],
  });
  const { objectIDs } = await index.saveObjects(records);
  console.log(`\n✅ Pushed ${objectIDs.length} records to Algolia`);
}

async function main() {
  console.log('🚀 FiM Sync starting...\n');
  const auth = getGoogleAuth();

  console.log('📊 Reading Episodes sheet...');
  const episodes = await getEpisodes(auth);
  console.log(`   Found ${episodes.length} episodes\n`);

  console.log('⚙️  Reading Settings sheet...');
  const settings = await getSettings(auth);
  console.log(`   Found ${Object.keys(settings).length} settings\n`);

  const records = [];

  for (const ep of episodes) {
    console.log(`EP${String(ep.episode_number).padStart(2, '0')} — ${ep.guest_name} (${ep.guest_company})`);

    let transcriptText = '';
    const transcriptDoc = await findTranscriptDoc(auth, ep.episode_number);
    if (transcriptDoc) {
      transcriptText = await getDocText(auth, transcriptDoc.id, transcriptDoc.mimeType);
      transcriptText = transcriptText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      console.log(`  ✓ Transcript: ${transcriptText.length.toLocaleString()} chars`);
    }

    const youtubeId = getYouTubeId(ep.youtube_url);
    const slug = buildSlug(ep.episode_number, ep.guest_name);
    const has_episode_page = true; // update this logic if some episodes don't have pages

    // Shared metadata used across the header record and all chunk records
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
      has_episode_page,
    };

    // 1. Lightweight header record — no transcript text, for title/guest name matches
    records.push({
      objectID: `ep-${ep.episode_number}`,
      ...episodeMeta,
    });

    // 2. One chunk record per chunk of the transcript
    const chunks = chunkTranscript(transcriptText);
    const total_chunks = chunks.length;

    chunks.forEach((chunk, index) => {
      records.push({
        objectID: `ep-${ep.episode_number}-chunk-${index}`,
        ...episodeMeta,
        chunk_text: chunk,
        chunk_index: index,
        total_chunks,
      });
    });

    console.log(`  ✓ Built 1 header + ${total_chunks} chunk record(s)\n`);
  }

  console.log('📡 Pushing to Algolia...');
  await pushToAlgolia(records);

  const settingsOutput = { ...settings, synced_at: new Date().toISOString(), total_episodes: episodes.length };
  fs.writeFileSync(path.join(__dirname, '../settings.json'), JSON.stringify(settingsOutput, null, 2));
  console.log('💾 settings.json written\n');
  console.log('🎉 Sync complete!');
}

main().catch(err => { console.error('❌ Sync failed:', err); process.exit(1); });
