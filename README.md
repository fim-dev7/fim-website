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

## Adding a new episode — Drive-as-CMS workflow

Google Sheets + Drive are the CMS. The site auto-regenerates from them every
6 hours via the GitHub Action in `.github/workflows/sync.yml`.

Per-episode authoring flow:

1. **Episodes sheet** — add a row with episode_number, title, guest_name,
   company, YouTube/Spotify/Apple URLs, published_date, tags (pipe-separated),
   featured (TRUE/FALSE), short_desc.
2. **Transcript** — drop the transcript Google Doc into the transcripts folder
   (`transcript_folder_id` in the Settings sheet). Name it `Ep XX - GuestName`.
3. **Content Doc** — create a new Google Doc in the episode content folder
   (`episode_content_folder_id` in the Settings sheet). Name it
   `Ep XX - GuestName`. Use the H1 sections defined in
   [`EPISODE_DOC_TEMPLATE.md`](EPISODE_DOC_TEMPLATE.md). Easiest: run the
   `fim-pipeline` or `fim-yt-spotify` skill, paste the output, reshape under
   the H1 headings.
4. **Wait or force the sync** — the workflow runs at 0/6/12/18 UTC. To run
   immediately: GitHub repo → **Actions** tab → **Sync FiM site from Google
   Sheets + Drive** → **Run workflow**.
5. The action commits the generated `episodes/<slug>/index.html`,
   `episodes/index.html`, and `data.jsx` back to `main`. Vercel auto-deploys.

The CMS contract is documented fully in [`EPISODE_DOC_TEMPLATE.md`](EPISODE_DOC_TEMPLATE.md).

### Settings sheet — required keys

The sync expects these rows in the **Settings** sheet (column A = key,
column B = value):

| Key | Example | Notes |
|---|---|---|
| `episode_content_folder_id` | `1abc...XYZ` | Drive folder ID for the per-episode content Docs |
| `transcript_folder_id` | `1gu8J2FRG35Z37evtSWC0HAtRZPXDh2QT` | Existing transcripts folder. Optional — defaults to current value. |
| `youtube_channel` | `https://...` | Used in nav + JSON-LD |
| `spotify_show` | `https://...` | |
| `apple_show` | `https://...` | |
| `instagram`, `tiktok`, `my_linkedin`, `show_linkedin` | URLs | |
| `subscriber_count` | `12000` | Surfaced on homepage |

### Generated vs. hand-curated content

- **Generated by sync (DO NOT EDIT)** — `data.jsx`, `episodes/index.html`,
  `episodes/<slug>/index.html` (only pages that came from a content Doc),
  `settings.json`.
- **Hand-curated (edit freely)** — `data-static.jsx` (FAQ, QUOTES, STATS,
  FEATURES, FILTERS), `index.html`, `styles.css`, `episodes/episode.css`,
  `episodes/episodes-archive.css`, the JSON-LD blocks in `index.html`.
- **Hand-built episode pages stay hand-built** — if an episode has a manually
  written `episodes/<slug>/index.html` but no content Doc, the sync leaves
  it alone. Add a content Doc when you're ready to switch it over to CMS.

### Local dry-run

```sh
# Requires .secrets/google-service-account.json + a content Doc to test against
node scripts/sync.js
```

This will hit Google + Algolia for real. To smoke-test the parser/renderer
logic without touching either, run `node scripts/lib/smoke-test.js`.

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
