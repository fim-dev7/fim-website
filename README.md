# Founders In Motion — Website

Static website for the Founders In Motion podcast. Built as plain HTML + CSS with a small amount of React for the homepage. Designed to be deployed as static files anywhere (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3+CloudFront).

---

## What's here

```
/
├── index.html              ← homepage (React via inline Babel)
├── styles.css              ← shared site styles
├── sections.jsx            ← homepage React components (loaded via Babel)
├── data.jsx                ← homepage content (EPISODES, ARCHIVE, FAQ, STATS, etc.)
├── app.jsx                 ← React bootstrap
├── tweaks-panel.jsx        ← in-page edit panel (dev-only — can be removed)
├── episodes.json           ← runtime override for episodes list (optional)
├── assets/                 ← logos, brand imagery
├── episodes/               ← per-episode show-notes pages
│   ├── index.html          ← full episode archive
│   ├── episode.css         ← shared styles for episode pages
│   ├── 28-shakeel-lala/index.html
│   ├── 26-celeste-amadon/index.html
│   ├── 25-nam-nguyen/index.html
│   └── 20-andy-miller/index.html
├── uploads/                ← raw transcripts (.srt/.txt) — do not deploy
└── NOTION.md               ← internal notes
```

**Do not deploy**: `uploads/`, `NOTION.md`, `*.napkin`, `.thumbnail.png` files. Everything else is intended to be served as-is.

---

## Deploy

### Option 1 — Vercel / Netlify / Cloudflare Pages (recommended)

1. Push this folder to a GitHub repo.
2. Connect the repo to Vercel/Netlify/Cloudflare Pages.
3. Build command: **none** (static site).
4. Output directory: **root** (`.`).
5. Add the custom domain (e.g. `foundersinmotion.com`) in the dashboard.
6. The platform handles HTTPS, CDN, and clean URLs (so `/episodes/28-shakeel-lala/` resolves to `episodes/28-shakeel-lala/index.html`).

### Option 2 — Any static host

Upload the project root (minus the do-not-deploy folders above) to any static host. Ensure clean-URL routing for the `/episodes/<slug>/` folders. Most hosts handle `index.html` resolution automatically.

### Notes on the React parts

`index.html` uses Babel-transpiled-at-runtime React (loaded via CDN). This is fine for shipping but adds ~150KB of JS. If you want a leaner production build later, the homepage components in `sections.jsx` are straightforward to port to a build-time React/Vite setup. The episode pages are pure HTML and have no JS dependency.

---

## How content is structured

### Homepage

Content lives in `data.jsx`. The key arrays are:

- `EPISODES` — the three featured episode cards. Each entry can include a `url` field to link to a per-episode page.
- `ARCHIVE` — the chip list of all other episodes. Entries with a `url` field become clickable; entries without one render as static labels.
- `FAQ` — Founder Questions section (12 entries; each is `{ q, a }`).
- `STATS`, `FEATURES`, `QUOTES`, `PLATFORMS` — supporting content.

### Per-episode pages

Each episode lives at `episodes/<n>-<slug>/index.html`. Pages share `episodes/episode.css` for styling. They include:

- A `<script type="application/ld+json">` block with `PodcastEpisode` schema, including a `transcript` field
- A header with title, duration, guest card with mini-stats
- "Listen on" buttons (YouTube primary, Spotify, Apple)
- Body sections: The story · What you'll hear · Key claims · Chapters · Quotes · Themes
- A sidebar with: Mentioned in episode · Background · Share links
- A `<details>` block containing the full transcript (collapsed by default, crawlable by Google)
- A "Related episodes" section

---

## Adding a new episode page

The fastest path is to drop the transcript into `uploads/` and ask Claude to build the page. See `EPISODE_TEMPLATE.md` for the structure each new page should follow.

Manual workflow:

1. Copy `episodes/28-shakeel-lala/index.html` to `episodes/<n>-<slug>/index.html`
2. Update the title, meta description, JSON-LD schema, header, stats, body sections, quotes, transcript, and related-episodes block with content extracted from the transcript
3. Add the episode to `episodes/index.html` (in either the featured grid or the full archive list)
4. If you want it linked from the homepage:
   - For featured cards: add `url: "episodes/<n>-<slug>/"` to the relevant `EPISODES` entry in `data.jsx`
   - For archive chips: add `url: "episodes/<n>-<slug>/"` to the relevant `ARCHIVE` entry in `data.jsx`

---

## SEO notes

The site is optimised for AEO (answer-engine optimisation) and traditional SEO:

- All content is server-rendered HTML (no JS required to read it). Even the homepage's React components are inlined into a single HTML file at build time when deployed via a static host.
- Every episode page has a `PodcastEpisode` JSON-LD block with `transcript` field
- The homepage has a `PodcastSeries` and `FAQPage` JSON-LD block
- Transcripts are inside `<details>` elements — fully crawlable, collapsed by default for UX
- Meta tags (description, og:title, og:description) are explicit on every page
- The `episodes/index.html` page is the canonical hub for the archive

---

## Brand

See `uploads/FiM - Brand & Design Style Guide.md` for typography, colors, and tone of voice notes. Key tokens are defined as CSS variables at the top of `styles.css`.

---

## Contact

Host: Thea Ngo — [LinkedIn](https://www.linkedin.com/in/theango/)
