/**
 * push-new-qa.mjs
 * Pushes the 18 new Q&A entries (Lauren ep30, Rakhesh ep31, Josh ep32)
 * to the Algolia fim_episodes index.
 *
 * Usage:
 *   ALGOLIA_APP_ID=G2C3CUY2G8 ALGOLIA_ADMIN_KEY=<your-admin-key> node scripts/push-new-qa.mjs
 */

import algoliasearch from 'algoliasearch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dir, '..');

const APP_ID = process.env.ALGOLIA_APP_ID || 'G2C3CUY2G8';
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const INDEX_NAME = 'fim_episodes';
const NEW_EP_NUMBERS = [30, 31, 32];

if (!ADMIN_KEY) {
  console.error('❌  ALGOLIA_ADMIN_KEY env var required.');
  console.error('    Run: ALGOLIA_ADMIN_KEY=<key> node scripts/push-new-qa.mjs');
  process.exit(1);
}

const qaIndex = JSON.parse(readFileSync(join(rootDir, 'qa-index.json'), 'utf8'));
const newEntries = qaIndex.filter(e => NEW_EP_NUMBERS.includes(e.episode_number));

const records = newEntries.map(e => ({
  objectID: `q-${e.slug}`,
  type: 'question',
  slug: e.slug,
  question: e.question,
  answer: e.answer,
  episode_number: e.episode_number,
  guest_name: e.guest_name,
  guest_company: e.guest_company,
  ep_slug: e.ep_slug,
  has_episode_page: e.has_episode_page ?? false,
  spotify_url: e.spotify_url ?? null,
}));

console.log(`Pushing ${records.length} Q&A records to Algolia index "${INDEX_NAME}"...`);

const client = algoliasearch(APP_ID, ADMIN_KEY);
const index = client.initIndex(INDEX_NAME);

const result = await index.saveObjects(records);
console.log(`✅  Done. objectIDs saved: ${result.objectIDs.length}`);
console.log('Episodes:', [...new Set(records.map(r => r.episode_number))].sort((a, b) => a - b));
