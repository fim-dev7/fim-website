# How to add a new episode page

The fastest way is to drop the transcript file (`.srt` or `.txt`) into `uploads/` and ask Claude to build the page. The prompt below is what works.

---

## Drop-and-go prompt

> Build a new episode page for `uploads/<filename>`. Match the structure and style of `episodes/28-shakeel-lala/index.html` exactly. Extract real quotes, chapter markers, and specific claims from the transcript — do not invent details. Save it to `episodes/<n>-<slug>/index.html`. Then wire it into:
> - `data.jsx` (add the `url` to the matching `ARCHIVE` or `EPISODES` entry)
> - `episodes/index.html` (move the row up to the featured grid)

That's it. Claude will read the transcript, pull out the substantive moments, and produce the page.

---

## What each page needs (so you can review)

A finished episode page has these sections. When checking the output, scan for each one:

### 1. Head + meta
- `<title>` — pattern: `Ep <N>: <Title> — <Guest>, <Company> | Founders In Motion`
- Meta description — 1–2 sentences with real numbers from the episode
- OG tags
- Link to `../../styles.css` and `../episode.css`

### 2. JSON-LD schema
- `@type: PodcastEpisode`
- `name`, `datePublished`, `duration` (ISO 8601, e.g. `PT35M`), `episodeNumber`
- `actor` (the guest), `host` (Thea)
- `transcript` field — short paraphrase, not the full transcript dumped in

### 3. Header
- Episode number tag with tags (e.g. "Episode 28 · Fintech AI · Customer Discovery")
- Title (matches the on-air title)
- Meta row: Released date, Duration, Guest line
- Guest card with avatar, role, one-line bio, 4 mini-stats

### 4. Listen buttons
YouTube (primary) · Spotify · Apple Podcasts — already wired, just keep the URLs

### 5. Body
- **The story** — 3–4 paragraphs, lead paragraph first
- **What you'll hear** — 5–7 bullets with bolded hooks
- **Key claims** — 4 stat cards (number + 1 sentence each)
- **Chapters** — 8–12 timestamp rows pulled from the actual transcript
- **Quotes** — 3–6 pull quotes (verbatim from the transcript, with timestamp)
- **Themes** — 4–6 bullets capturing what the guest keeps returning to

### 6. Sidebar
- **Mentioned in episode** — companies, people, books referenced
- **Background** or **Where they're live** — guest-specific context
- **Share** — X and LinkedIn share links (update the URL)

### 7. Transcript
A `<details>` element with the opening 3–4 exchanges, then a placeholder note. Drop the full transcript in later when ready — the HTML structure is already there.

### 8. Related episodes
2 cards linking to other full-page episodes.

---

## Slug conventions

- Folder: `episodes/<n>-<first>-<last>/index.html` — lowercase, hyphenated
- Example: Episode 28 with guest Shakeel Lala → `episodes/28-shakeel-lala/`
- Example: Episode 5 with co-founders Kiki and Elan → `episodes/05-kiki-elan/` (zero-pad single-digit episode numbers)

---

## What NOT to do

- Don't invent timestamps. Use the ones in the SRT file.
- Don't invent quotes. Every `<q>...</q>` should be verbatim from the transcript.
- Don't invent companies, VC names, or numbers that aren't in the source.
- Don't paste the entire transcript into the JSON-LD `transcript` field — keep it as a short summary paragraph there. The full transcript belongs in the visible `<details>` block.
- Don't add filler. If a section would only have one bullet, leave it out.

---

## After the page is built

1. Open it locally and skim for typos
2. Check the YouTube/Spotify/Apple links work
3. Check the "Related episodes" links point to real pages
4. Push the change and the new episode goes live
