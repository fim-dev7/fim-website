#!/usr/bin/env node
/**
 * indexnow-submit.js — push every site URL to IndexNow (Bing, Yandex, Naver, and
 * other participating engines) for near-instant (re)crawl. No email, no account:
 * the engines verify ownership by fetching the public key file at keyLocation.
 *
 * Run manually:  node scripts/indexnow-submit.js
 * In CI: the sync workflow runs this after a successful regeneration.
 *
 * The key is NOT a secret — it is published at https://<HOST>/<KEY>.txt by design.
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'foundersinmotion.tech';
const KEY = 'ee903c75f43d491aa73dc18068dd4bdc';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (!urlList.length) {
  console.error('indexnow: no URLs found in sitemap.xml — aborting');
  process.exit(1);
}

const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList });

const req = https.request(
  {
    hostname: 'api.indexnow.org',
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
    },
  },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      // 200 OK / 202 Accepted = success (202 = key validation pending)
      const ok = res.statusCode === 200 || res.statusCode === 202;
      console.log(`IndexNow: HTTP ${res.statusCode} — ${ok ? 'submitted' : 'FAILED for'} ${urlList.length} URLs${data ? ` — ${data}` : ''}`);
      process.exit(ok ? 0 : 1);
    });
  }
);
req.on('error', (e) => {
  console.error('IndexNow request error:', e.message);
  process.exit(1);
});
req.write(body);
req.end();
