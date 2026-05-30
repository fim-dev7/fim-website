/**
 * Parse a Google Doc HTML export into structured episode page sections.
 *
 * The CMS contract: each episode lives in one Google Doc inside the
 * EPISODE_CONTENT_FOLDER. Authors structure the doc using H1 headings:
 *
 *   # Hook              → one paragraph, used as page lead + meta
 *   # Story             → multi-paragraph narrative (first para = .lead)
 *   # What you'll hear  → bulleted list, each `**Label** — text`
 *   # Key claims        → bulleted list, each `**NUMBER** — text`
 *   # Chapters          → bulleted list, each `MM:SS — label — sub`
 *   # Quotes            → repeated `> "Quote" — Attribution (timestamp)`
 *                         (each blockquote = one pull quote)
 *   # Themes            → bulleted list, each `**Theme** — explanation`
 *   # Mentioned         → bulleted list, each `**Name** — description`
 *   # Background        → optional sidebar bullets
 *   # Meta              → optional key:value lines (duration, released, etc.)
 *
 * All sections are optional. Missing sections render nothing in the page.
 */

/**
 * Strip outer HTML wrapper from Drive's HTML export, keeping only body content.
 */
function extractBody(html) {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

/**
 * Decode HTML entities → plain unicode.
 */
function decodeEntities(s) {
  return String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * Strip all HTML tags, returning collapsed whitespace plain text.
 */
function toText(html) {
  return decodeEntities(String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

/**
 * Convert inline HTML to a simpler tag set we can safely emit:
 *   <strong>/<b> → <b>
 *   <em>/<i>     → <em>
 *   <a href>     → <a href> (no other attrs)
 * Everything else stripped. Entity-decoded.
 */
function toInlineHTML(html) {
  let s = String(html);
  // Normalize bold/italic spans (Google Docs uses inline <span style="font-weight:700">)
  s = s.replace(/<span[^>]*font-weight\s*:\s*(?:bold|[6-9]00)[^>]*>([\s\S]*?)<\/span>/gi, '<b>$1</b>');
  s = s.replace(/<span[^>]*font-style\s*:\s*italic[^>]*>([\s\S]*?)<\/span>/gi, '<em>$1</em>');
  // Map semantic tags
  s = s.replace(/<\/?strong>/gi, m => m[1] === '/' ? '</b>' : '<b>');
  s = s.replace(/<\/?em>/gi, m => m[1] === '/' ? '</em>' : '<em>');
  s = s.replace(/<\/?i>/gi, m => m[1] === '/' ? '</em>' : '<em>');
  // Preserve anchor href
  s = s.replace(/<a[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) =>
    `<a href="${href.replace(/^https?:\/\/www\.google\.com\/url\?q=([^&]+).*/, (_, u) => decodeURIComponent(u))}">${inner}</a>`);
  // Strip remaining tags
  s = s.replace(/<(?!\/?(b|em|a)\b)[^>]+>/gi, '');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return decodeEntities(s);
}

/**
 * Split body HTML into H1-delimited sections.
 * Returns [{ heading: "Hook", inner: "<p>...</p>..." }, ...]
 */
function splitByH1(bodyHtml) {
  const re = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
  const sections = [];
  const headings = [];
  let m;
  while ((m = re.exec(bodyHtml)) !== null) {
    headings.push({ heading: toText(m[1]), end: re.lastIndex, start: m.index });
  }
  for (let i = 0; i < headings.length; i++) {
    const innerStart = headings[i].end;
    const innerEnd = i + 1 < headings.length ? headings[i + 1].start : bodyHtml.length;
    sections.push({
      heading: headings[i].heading,
      inner: bodyHtml.slice(innerStart, innerEnd),
    });
  }
  return sections;
}

/**
 * Extract <p>...</p> blocks from a chunk of HTML.
 * Returns array of inline-cleaned strings (paragraph text).
 */
function extractParagraphs(html) {
  const out = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const cleaned = toInlineHTML(m[1]);
    if (cleaned) out.push(cleaned);
  }
  return out;
}

/**
 * Extract <li>...</li> items from the first <ul>/<ol> in HTML chunk.
 * Returns array of inline-cleaned strings.
 */
function extractListItems(html) {
  const out = [];
  const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const cleaned = toInlineHTML(m[1]);
    if (cleaned) out.push(cleaned);
  }
  return out;
}

/**
 * Extract <blockquote>...</blockquote> blocks. Each blockquote contains <p> elements.
 * Returns array of { text, attr } where attr is the attribution line (last paragraph).
 */
function extractBlockquotes(html) {
  const out = [];
  const re = /<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const paras = extractParagraphs(m[1]);
    if (paras.length === 0) continue;
    // Last paragraph that starts with — or - is the attribution
    let attrIdx = -1;
    for (let i = paras.length - 1; i >= 0; i--) {
      if (/^[—-]/.test(paras[i].trim())) { attrIdx = i; break; }
    }
    if (attrIdx === -1) attrIdx = paras.length - 1;
    const text = paras.slice(0, attrIdx).join(' ').trim();
    const attr = paras[attrIdx].replace(/^[—-]\s*/, '').trim();
    if (text) out.push({ text, attr });
  }
  return out;
}

/**
 * Parse "**Label** — text" into { label, text }. If no separator, label is null.
 */
function parseLabelDash(s) {
  // Match leading bold/strong as label
  const bold = s.match(/^<b>([\s\S]*?)<\/b>\s*[—-]\s*([\s\S]+)$/i);
  if (bold) return { label: toText(bold[1]), text: bold[2].trim() };
  const plain = s.match(/^([^—-]+?)\s+[—-]\s+([\s\S]+)$/);
  if (plain) return { label: plain[1].trim(), text: plain[2].trim() };
  return { label: null, text: s };
}

/**
 * Parse chapter line: "MM:SS — Label — sub-label" or "MM:SS — Label"
 * Returns { time, label, sub } or null if no timestamp.
 */
function parseChapter(s) {
  const stripped = toText(s);
  const m = stripped.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[—-]\s*([\s\S]+)$/);
  if (!m) return null;
  const time = m[1];
  const rest = m[2];
  const sub = rest.match(/^(.+?)\s+[—-]\s+(.+)$/);
  if (sub) return { time, label: sub[1].trim(), sub: sub[2].trim() };
  return { time, label: rest.trim(), sub: null };
}

/**
 * Parse meta section: key: value lines.
 */
function parseMeta(html) {
  const out = {};
  for (const para of extractParagraphs(html)) {
    const plain = toText(para);
    const m = plain.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.+)$/i);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  // Also tolerate list-item form
  for (const li of extractListItems(html)) {
    const plain = toText(li);
    const m = plain.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.+)$/i);
    if (m && !out[m[1].toLowerCase()]) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}

/**
 * Map H1 heading text to canonical section key.
 * Tolerant of casing, punctuation, and a few aliases.
 */
function canonicalSection(heading) {
  const h = heading.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
  const map = {
    'hook': 'hook',
    'story': 'story',
    'the story': 'story',
    'what youll hear': 'whatYoullHear',
    'what you ll hear': 'whatYoullHear',
    'whatll hear': 'whatYoullHear',
    'whatyou ll hear': 'whatYoullHear',
    'key claims': 'keyClaims',
    'claims': 'keyClaims',
    'chapters': 'chapters',
    'timestamps': 'chapters',
    'quotes': 'quotes',
    'pull quotes': 'quotes',
    'themes': 'themes',
    'mentioned': 'mentioned',
    'mentioned in episode': 'mentioned',
    'background': 'background',
    'wheretheyre live': 'background',
    'meta': 'meta',
    'frontmatter': 'meta',
  };
  return map[h] || null;
}

/**
 * Main entry point. Takes the HTML body string returned by Drive export
 * and returns a structured EpisodeContent object.
 */
export function parseEpisodeDoc(html) {
  const body = extractBody(html);
  const sections = splitByH1(body);
  const out = {
    hook: null,
    story: [],
    whatYoullHear: [],
    keyClaims: [],
    chapters: [],
    quotes: [],
    themes: [],
    mentioned: [],
    background: [],
    meta: {},
  };
  for (const { heading, inner } of sections) {
    const key = canonicalSection(heading);
    if (!key) continue;
    if (key === 'hook') {
      const paras = extractParagraphs(inner);
      out.hook = paras.join(' ').trim();
    } else if (key === 'story') {
      out.story = extractParagraphs(inner);
    } else if (key === 'whatYoullHear' || key === 'keyClaims' || key === 'themes' || key === 'mentioned' || key === 'background') {
      out[key] = extractListItems(inner).map(parseLabelDash);
    } else if (key === 'chapters') {
      out.chapters = extractListItems(inner)
        .map(parseChapter)
        .filter(Boolean);
    } else if (key === 'quotes') {
      out.quotes = extractBlockquotes(inner);
      if (out.quotes.length === 0) {
        // Fallback: list items in the form `"Quote" — Attribution (timestamp)`
        out.quotes = extractListItems(inner).map(li => {
          const plain = toText(li);
          const m = plain.match(/^["“](.+?)["”]\s*[—-]\s*(.+)$/);
          if (m) return { text: m[1], attr: m[2] };
          return { text: plain, attr: '' };
        });
      }
    } else if (key === 'meta') {
      out.meta = parseMeta(inner);
    }
  }
  return out;
}

// Exported helpers for downstream rendering
export { toText, toInlineHTML, extractBody };
