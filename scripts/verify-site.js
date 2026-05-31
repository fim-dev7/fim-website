#!/usr/bin/env node
/**
 * verify-site.js — pre-commit sanity checks on the GENERATED output.
 *
 * Catches "the code was fixed but the HTML is stale" regressions and the
 * specific bugs we've hit before. Pure read-only; no network. Exit 1 on any
 * failure so it can gate a commit:  node scripts/verify-site.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abs = (p) => path.join(root, p);
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const exists = (p) => fs.existsSync(abs(p));
// subdir pages: questions/<slug>/index.html, episodes/<slug>/index.html, etc.
const subPages = (dir) =>
  exists(dir)
    ? fs.readdirSync(abs(dir))
        .filter((d) => exists(path.join(dir, d, 'index.html')))
        .map((d) => path.join(dir, d, 'index.html'))
    : [];

let checks = 0;
const failures = [];
function check(name, ok, detail) {
  checks++;
  if (!ok) failures.push(name + (detail ? `: ${detail}` : ''));
}

const qPages = subPages('questions');
const epPages = subPages('episodes');
const topicPages = subPages('topics');

// 1. DEDUP INVARIANT — a question page must never render BOTH the multi-perspective
//    section AND the legacy "The full answer" stack (the bug the user reported).
{
  const bad = qPages.filter((p) => {
    const h = read(p);
    return h.includes('q-perspectives-title') && h.includes('>The full answer<');
  });
  check('questions: no page renders perspectives + "The full answer" twice', bad.length === 0,
    bad.length ? `${bad.length}/${qPages.length} pages, e.g. ${bad.slice(0, 3).join(', ')}` : '');
}

// 2. CLICKABLE internal links must be root-relative (absolute foundersinmotion.com breaks
//    on vercel.app). Only <a> anchors count — canonical/og:url tags are SUPPOSED to be absolute.
{
  const bad = [...qPages, ...epPages, ...topicPages].filter((p) =>
    /<a\b[^>]*href="https:\/\/foundersinmotion\.com\/(episodes|questions|topics)\//.test(read(p)));
  check('clickable internal links are root-relative', bad.length === 0,
    bad.length ? `${bad.length} pages have absolute <a> hrefs` : '');
}

// 3. INSTAGRAM must point to thea.yaps, never the old foundersinmotion handle.
{
  const pool = [...qPages, ...epPages, 'index.html', 'about/index.html'].filter(exists);
  const bad = pool.filter((p) => /instagram\.com\/foundersinmotion/i.test(read(p)));
  check('instagram links use @thea.yaps (not foundersinmotion)', bad.length === 0,
    bad.length ? `${bad.length} pages` : '');
}

// 4. HOMEPAGE host photo present; the "TN" placeholder is gone.
{
  const s = read('sections.jsx');
  check('hero shows Thea photo', s.includes('assets/thea-ngo.jpg') && /className="hero-photo"/.test(s));
  check('host avatar is the photo, not the "TN" placeholder',
    /<img className="thea-avatar"/.test(s) && !/className="thea-avatar">TN</.test(s));
  check('hero photo asset exists on disk', exists('assets/thea-ngo.jpg'));
}

// 5. CANONICAL present on every public page type.
{
  const pool = [...qPages, ...epPages, 'index.html', 'about/index.html'].filter(exists);
  const bad = pool.filter((p) => !/rel="canonical"/.test(read(p)));
  check('all pages declare rel="canonical"', bad.length === 0,
    bad.length ? `${bad.length} pages missing canonical` : '');
}

// ── report ──────────────────────────────────────────────
console.log(`\nverify-site: ${checks} checks · ${qPages.length} question pages · ${epPages.length} episode pages\n`);
if (failures.length) {
  for (const f of failures) console.log('  ✗ ' + f);
  console.log(`\n${failures.length} check(s) FAILED\n`);
  process.exit(1);
}
console.log('  ✓ all checks passed\n');
