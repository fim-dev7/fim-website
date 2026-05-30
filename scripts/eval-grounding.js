/**
 * eval-grounding.js — programmatic grounding check.
 *
 * Given a transcript and a piece of generated content (content Doc text and/or
 * Q&A pack text), verify that every QUOTE, NUMBER, and NAMED ENTITY in the
 * generated content is supported by the transcript.
 *
 * This is layer 1. A second LLM-judge layer runs separately (see
 * EVAL-VERIFIER-PROMPT.md) to catch paraphrased claims this script can't.
 *
 * Usage:
 *   node scripts/eval-grounding.js <transcript-path> <content-path> [...more paths]
 *   cat content.md | node scripts/eval-grounding.js <transcript-path>
 *
 * Exit codes:
 *   0  every checkable claim grounded — content is safe to push
 *   1  one or more claims could not be grounded — DO NOT PUSH
 *   2  bad arguments
 *
 * Output: JSON report on stdout (machine-readable).
 *
 * Heuristics — calibrated to be strict by default:
 *   - QUOTE: any text inside double quotes ≥ 25 chars, or any <q>…</q>, or any
 *     blockquote line ("> ..."). Must appear in transcript as substring after
 *     case-insensitive whitespace/punctuation normalisation. Fuzzy fallback
 *     requires ≥ 80% word overlap.
 *   - NUMBER: any standalone number, currency value, or percentage. Must appear
 *     as the same token in the transcript (e.g. "$10M" matches "10M" / "10
 *     million" / "ten million"; we normalise both).
 *   - PROPER NOUN: capitalised word sequences ≥ 2 words, treated as named
 *     entities. Must appear in the transcript verbatim or with a known
 *     normalisation (whitespace, "&"/"and").
 */

import fs from 'fs';
import path from 'path';

// --------------------------------------------------------------------------
// Normalisation
// --------------------------------------------------------------------------

function stripSrt(t) {
  return t.replace(/\r\n/g, '\n')
    // SRT cue numbers (lines that are JUST a number)
    .replace(/^\d+\s*$/gm, '')
    // SRT timestamp ranges
    .replace(/^\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}.*$/gm, '');
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\p{L}\p{N}\s$%.,'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeNumeric(s) {
  // Convert words → digits for canonicalisation, e.g. "ten million" → "10000000",
  // "$10M" → "10000000", "800" → "800", "8 hundred" → "800".
  const small = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90 };
  const scales = { hundred:100, thousand:1000, million:1_000_000, billion:1_000_000_000 };
  const t = s.toLowerCase().replace(/,/g, '').replace(/[^\w. ]/g, ' ');
  // Direct numeric value (e.g. "10m", "10 million", "$10m", "10000")
  const num = t.match(/(\d+(?:\.\d+)?)\s*([kmb]|thousand|million|billion)?/);
  if (num) {
    let n = parseFloat(num[1]);
    const suf = (num[2] || '').toLowerCase();
    if (suf === 'k' || suf === 'thousand') n *= 1_000;
    if (suf === 'm' || suf === 'million') n *= 1_000_000;
    if (suf === 'b' || suf === 'billion') n *= 1_000_000_000;
    return String(Math.round(n));
  }
  // English words ("eight hundred", "ten million")
  const words = t.split(/\s+/).filter(Boolean);
  let total = 0, current = 0;
  for (const w of words) {
    if (w in small) current += small[w];
    else if (w in scales) {
      current = (current || 1) * scales[w];
      if (scales[w] >= 1000) { total += current; current = 0; }
    } else return null;
  }
  total += current;
  return total > 0 ? String(total) : null;
}

// --------------------------------------------------------------------------
// Extraction
// --------------------------------------------------------------------------

function extractQuotes(text) {
  const out = [];
  // Double-quoted strings (curly or straight)
  for (const m of text.matchAll(/["“]([^"”\n]{25,400})["”]/g)) out.push(m[1]);
  // <q>…</q>
  for (const m of text.matchAll(/<q>([\s\S]{15,500}?)<\/q>/g)) out.push(m[1]);
  // Markdown blockquotes
  for (const m of text.matchAll(/(?:^|\n)>\s+([^\n]{15,400})/g)) {
    // Skip attribution lines that start with — or -
    if (/^[—\-]/.test(m[1].trim())) continue;
    out.push(m[1]);
  }
  return Array.from(new Set(out.map(q => q.trim())));
}

function extractNumbers(text) {
  const out = [];
  // 1. Currencies + scaled numbers + percentages + multi-digit numbers
  const re1 = /\$\s*\d[\d,.]*\s*[KMBkmb]?|\d[\d,.]*\s*(?:%|percent|k|m|b|thousand|million|billion)|\b\d{1,3}(?:,\d{3})+\b|\b\d{3,}\b/g;
  for (const m of text.matchAll(re1)) {
    const v = m[0].trim();
    if (v && /\d/.test(v)) out.push(v);
  }
  // 2. Small numbers (1-99) followed by a unit-like word — common in
  //    fabricated content like "47 countries" or "12 advisors".
  const UNITS = 'countries|advisors|customers|firms|episodes|conversations|investors|founders|hours|days|weeks|months|years|users|term sheets|cents|dollars|stores|cans|investors|directors|hires|engineers';
  const re2 = new RegExp(`\\b(\\d{1,2})\\s+(?:${UNITS})\\b`, 'gi');
  for (const m of text.matchAll(re2)) out.push(m[1]);
  return Array.from(new Set(out));
}

function extractProperNouns(text) {
  // Multi-word capitalised sequences (real names, companies, places).
  // Single-word capitals catch too many false positives ("The", "What").
  // Note: only space between words. Crossing sentence boundaries
  // ("France.\n\nHe used …") doesn't count as one entity.
  const out = [];
  const re = /\b([A-Z][a-zA-Z'\-&]+(?:[ ]+[A-Z][a-zA-Z'\-&]+){1,4})\b/g;
  const SKIP_LEADERS = /^(The|A|An|How|What|When|Why|Where|This|That|These|Those|Key|Full|My|Our|Their|In|On|For|With|From|At|It|He|She|They)\s/i;
  // Words that mark a sentence boundary; if any token contains terminal punctuation,
  // we reject (regex above already handles this via [a-zA-Z'\-&] class — no period —
  // but content may include "Dr." or "U.S." which we *do* want to keep).
  for (const m of text.matchAll(re)) {
    const name = m[1].trim();
    if (SKIP_LEADERS.test(name)) continue;
    if (name.split(/\s+/).every(w => w.length < 3)) continue;
    out.push(name);
  }
  return Array.from(new Set(out));
}

// --------------------------------------------------------------------------
// Verification
// --------------------------------------------------------------------------

function quoteGrounded(quote, transcriptNorm) {
  const q = norm(quote);
  // 1. exact substring (most reliable)
  if (transcriptNorm.includes(q)) return { method: 'exact', score: 1 };
  // 2. word-overlap fallback for paraphrases / minor edits
  const qWords = new Set(q.split(' ').filter(w => w.length > 2));
  if (qWords.size === 0) return { method: 'too-short', score: 0 };
  let matches = 0;
  for (const w of qWords) if (transcriptNorm.includes(w)) matches++;
  const score = matches / qWords.size;
  return { method: 'word-overlap', score };
}

function numberGrounded(num, transcript) {
  const canonical = normalizeNumeric(num);
  if (!canonical) return { method: 'unparseable', score: 0 };
  // Try every numeric mention in the transcript
  for (const m of transcript.matchAll(/\$?\s*[\d.,]+\s*(?:[kmb]|thousand|million|billion)?|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)(?:\s+(?:hundred|thousand|million|billion|and))*/gi)) {
    const tCanonical = normalizeNumeric(m[0]);
    if (tCanonical === canonical) return { method: 'canonical', score: 1, found: m[0] };
  }
  // String fallback: bare number "800" appears literally
  const bare = num.replace(/[^0-9.]/g, '');
  if (bare && new RegExp(`\\b${bare}\\b`).test(transcript)) {
    return { method: 'bare', score: 1, found: bare };
  }
  return { method: 'none', score: 0 };
}

function nameGrounded(name, transcriptNorm) {
  const n = norm(name);
  if (transcriptNorm.includes(n)) return { method: 'exact', score: 1 };
  // "And" / "&" variant
  const altA = n.replace(/\band\b/g, '&');
  const altB = n.replace(/&/g, 'and');
  if (transcriptNorm.includes(altA) || transcriptNorm.includes(altB)) return { method: 'alt-conjunction', score: 1 };
  // Token-level: if ANY meaningful token of the name (≥ 4 chars, not common word)
  // appears in the transcript, accept. Transcripts often refer to the guest by
  // first name only ("Shakeel" not "Shakeel Lala") even though the full name
  // is what appears in the generated content.
  const COMMON = new Set(['that','this','these','those','from','into','with','have','been','were','said','says','they','their','there','some','what','when','where','which','will','would']);
  const tokens = n.split(/\s+/).filter(t => t.length >= 4 && !COMMON.has(t));
  for (const t of tokens) {
    if (transcriptNorm.includes(t)) return { method: 'token-match', score: 0.85, found: t };
  }
  return { method: 'none', score: 0 };
}

// --------------------------------------------------------------------------
// Report builder
// --------------------------------------------------------------------------

const QUOTE_PASS = 0.8;   // accepts very close paraphrase only
const NAME_PASS  = 0.7;   // accepts surname-only
const NUMBER_PASS = 1.0;  // numbers must match canonically — no fuzzy

function checkContent(transcriptRaw, contentRaw) {
  const transcript = stripSrt(transcriptRaw);
  const transcriptNorm = norm(transcript);

  const quotes = extractQuotes(contentRaw);
  const numbers = extractNumbers(contentRaw);
  const names = extractProperNouns(contentRaw);

  const report = {
    quotes: quotes.map(q => {
      const r = quoteGrounded(q, transcriptNorm);
      return {
        quote: q.length > 120 ? q.slice(0, 117) + '…' : q,
        ...r,
        grounded: r.score >= QUOTE_PASS,
      };
    }),
    numbers: numbers.map(n => {
      const r = numberGrounded(n, transcript);
      return { number: n, ...r, grounded: r.score >= NUMBER_PASS };
    }),
    names: names.map(name => {
      const r = nameGrounded(name, transcriptNorm);
      return { name, ...r, grounded: r.score >= NAME_PASS };
    }),
  };

  const fail = [
    ...report.quotes.filter(q => !q.grounded),
    ...report.numbers.filter(n => !n.grounded),
    ...report.names.filter(n => !n.grounded),
  ];

  report.summary = {
    total_quotes:  report.quotes.length,
    grounded_quotes: report.quotes.filter(q => q.grounded).length,
    total_numbers: report.numbers.length,
    grounded_numbers: report.numbers.filter(n => n.grounded).length,
    total_names: report.names.length,
    grounded_names: report.names.filter(n => n.grounded).length,
    ungrounded_count: fail.length,
    pass: fail.length === 0,
  };
  return report;
}

// --------------------------------------------------------------------------
// CLI
// --------------------------------------------------------------------------

async function readMaybeStdin() {
  if (process.stdin.isTTY) return '';
  return await new Promise(resolve => {
    let s = ''; process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { s += chunk; });
    process.stdin.on('end', () => resolve(s));
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/eval-grounding.js <transcript> [<content> ...]   (or pipe content to stdin)');
    process.exit(2);
  }

  const transcriptPath = args[0];
  if (!fs.existsSync(transcriptPath)) {
    console.error(`Transcript not found: ${transcriptPath}`);
    process.exit(2);
  }
  const transcript = fs.readFileSync(transcriptPath, 'utf8');

  let content;
  if (args.length >= 2) {
    content = args.slice(1).map(p => fs.readFileSync(p, 'utf8')).join('\n\n');
  } else {
    content = await readMaybeStdin();
    if (!content) {
      console.error('No content provided — pass content paths or pipe to stdin.');
      process.exit(2);
    }
  }

  const report = checkContent(transcript, content);
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');

  // Human-readable summary on stderr so it doesn't pollute the JSON pipe
  const s = report.summary;
  console.error(`\n${s.pass ? '✅ PASS' : '❌ FAIL'} — ` +
    `quotes ${s.grounded_quotes}/${s.total_quotes}, ` +
    `numbers ${s.grounded_numbers}/${s.total_numbers}, ` +
    `names ${s.grounded_names}/${s.total_names}, ` +
    `ungrounded ${s.ungrounded_count}`);

  process.exit(s.pass ? 0 : 1);
}

main().catch(err => { console.error('eval-grounding error:', err); process.exit(2); });
