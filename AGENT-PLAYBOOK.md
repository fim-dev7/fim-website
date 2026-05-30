# Agent Playbook — FiM Website

**For future Claude sessions when Thea throws you a transcript and says "do everything."**

This file is the source of truth. The pipeline lives in `scripts/sync.js` and its lib helpers. The published site lives at https://fim-website.vercel.app (custom domain `foundersinmotion.com` pending DNS).

---

## When Thea drops a transcript and says "do everything"

She'll typically give you:
- A transcript file (`.srt` or `.txt`) or paste the text
- An episode number + guest name + company (if she hasn't already added to the sheet)
- Sometimes the YouTube/Spotify/Apple URLs

Your job is to produce **two structured Google Docs** in Drive and trigger the sync. That's it. The repo + sync render everything else.

### The pipeline at a glance

```
Transcript (.srt/.txt)
        │
        ▼
Two Drive Docs you'll create
        │
        ├─ Episode Content Doc → renders episodes/<slug>/index.html
        │   Folder: FiM - Episode Content
        │   ID: 1tB7b1B7g8goxaRxCbOwOXJaEqbNF6flR
        │
        └─ Q&A Pack Doc → renders /questions/<slug>/index.html + episode FAQ
            Folder: FiM - Q&A Bank
            ID: (in Settings sheet under qa_bank_folder_id)
        │
        ▼
Trigger sync workflow on main
        │
        ▼
GitHub Action runs scripts/sync.js → commits regenerated files → Vercel deploys
```

### Step-by-step

**1. Confirm the episode is in the Episodes sheet.**
- Sheet ID: `1E8poisRe7yIdH_7i5fFGXcX0pRHni2s22Cr5Hppn3GA`
- Tab: `Episodes`
- Required columns: episode_number, title, guest_name, guest_company, youtube_url, spotify_url, apple_url, published_date
- Optional: tags (pipe-separated), featured (TRUE/FALSE), short_desc
- Read sheet via `mcp__19ae1e43-...__read_file_content` with the sheet ID.
- If row missing, ask Thea to add it before proceeding.

**2. Confirm the transcript is in the transcript folder.**
- Folder ID: `1gu8J2FRG35Z37evtSWC0HAtRZPXDh2QT`
- Filename convention: `Ep XX <Guest Name> (<Company>).srt` or `.txt`
- If missing, Thea will upload it.

**3. Create the Episode Content Doc.**

- **Where**: Folder ID `1tB7b1B7g8goxaRxCbOwOXJaEqbNF6flR` (FiM - Episode Content)
- **Name**: `Ep XX - <Guest Name>` (must contain full guest name — sync matches on guest_name, not number)
- **Tool**: `mcp__19ae1e43-...__create_file` with `contentMimeType: 'text/plain'`, `disableConversionToGoogleType: false` (default). Plain-text upload auto-converts to a Google Doc. Headings render as plain text — the parser supports both `<h1>` and `<p># …</p>` markdown markers.
- **Structure**: see `EPISODE_DOC_TEMPLATE.md` for the H1 section list (Hook, Story, What you'll hear, Key claims, Chapters, Quotes, Themes, Mentioned, Background, Meta). Each H1 becomes a section in the rendered page.

**4. Create the Q&A Pack Doc.**

- **Where**: Folder ID stored in Settings sheet row `qa_bank_folder_id`. Read it with `mcp__19ae1e43-...__read_file_content` on the spreadsheet.
- **Name**: `Ep XX - <Guest Name> - Q&A` (must contain full guest name — same matching logic as content Doc).
- **Tool**: same as above.
- **Structure**: see `QA_PACK_TEMPLATE.md`. Each H1 is a question. Below the H1 are key-value lines (`slug:`, `answer:`) followed by optional long-form paragraphs.

**5. Trigger the sync workflow.**

```bash
GH_TOKEN="$(cat /tmp/pat.txt)" gh workflow run sync.yml --ref main
```

Or open https://github.com/fim-dev7/fim-website/actions/workflows/sync.yml → Run workflow.

**6. Watch the run.**

```bash
RUN_ID=$(GH_TOKEN="$(cat /tmp/pat.txt)" gh run list --workflow=sync.yml --limit 1 --json databaseId --jq '.[0].databaseId')
GH_TOKEN="$(cat /tmp/pat.txt)" gh run watch "$RUN_ID" --exit-status --interval 5
```

Sync should: parse the new content Doc + Q&A pack, regenerate `episodes/<slug>/index.html`, update `data.jsx`, `episodes/index.html`, regenerate `/questions/<slug>/index.html` for each Q&A's canonical_slug, refresh `sitemap.xml` / `llms.txt`, push Algolia records, auto-commit, push to main.

**7. Verify production.**

```bash
SLUG=<episode-slug>  # e.g. 29-jane-doe
curl -sI "https://fim-website.vercel.app/episodes/$SLUG/" | head -1
curl -s "https://fim-website.vercel.app/episodes/$SLUG/" | grep -c '"@type": "FAQPage"'
```

Should return `HTTP/2 200` and at least `1` FAQPage block.

For each new Q&A slug you added:
```bash
curl -sI "https://fim-website.vercel.app/questions/<slug>/" | head -1
```

---

## Authoring rules — content Doc

Read `EPISODE_DOC_TEMPLATE.md`. Key points:

- **Hook**: 1–2 sentence pitch. Lands as the meta description, homepage card desc, and FAQ intro answer.
- **Story**: 3–5 paragraphs. First paragraph becomes `.lead`.
- **What you'll hear**: 5–7 bullets, each `**Label** — text`. Becomes FAQPage Q&As + on-page bullets.
- **Key claims**: 4 bullets, each `**NUMBER** — text`. Renders as 4 stat cards.
- **Chapters**: 8–12 bullets, each `MM:SS — Label — sub-label`.
- **Quotes**: 3–6 blockquotes (start each line `>`), one attribution line per quote starting with `—`.
- **Themes**: 4–6 bullets, `**Theme** — explanation`. Becomes "Themes [Guest] returns to".
- **Mentioned**: sidebar list, `**Name** — description`.
- **Background** (optional): sidebar list. Use Meta `background_title:` to override the H5 label (e.g. "Ideas they explored and killed").
- **Meta**: key:value lines (one per paragraph). Required-ish:
  - `duration: 35 min`
  - `duration_iso: PT35M`
  - `guest_role: Founder, Companyname`
  - `guest_bio: One sentence.`
  - `mini_stats: $10M raised | 650+ firms | 800 calls | 6 countries` (4 pipe-separated)
  - `tags: Fintech AI · Customer Discovery · Pre-Seed` (· separated)
  - `background_title: Ideas they explored and killed` (optional)
  - `twitter_share: Tweet text`

Use the verbatim transcript for quotes. Don't invent timestamps, numbers, or facts.

## Authoring rules — Q&A pack

Read `QA_PACK_TEMPLATE.md`. Key points:

- **Each H1 is a question.** Phrase as a real founder question, not a statement. End with `?`.
- **`slug:`** is the URL key. Multiple episodes can share the same slug → their answers aggregate on one `/questions/<slug>/` page.
  - Use kebab-case: `how-to-raise-pre-seed-without-product`
  - Prefer short, search-friendly slugs that match likely Google queries
  - **For new canonical questions, pick a NEW slug.** For contributing to existing canonicals, reuse the slug.
- **`answer:`** is the 1–2 sentence summary that shows on the question page beside this episode's avatar.
- Long-form paragraphs after the metadata become the expanded answer on the question page + the FAQ entry on the episode page.
- Aim for **10–15 questions per episode**. Mix:
  - 5–7 episode-native (unique to this guest's story)
  - 5–8 canonical contributions (this episode adds to a cross-archive question)

### Canonical question slugs (use these when possible)

When an episode contributes to one of these, use the exact slug. Don't make up variants.

| Slug | Question |
|---|---|
| `how-to-raise-pre-seed-without-product` | How do I raise a pre-seed round without a product? |
| `how-to-do-customer-discovery` | How do I do customer discovery? |
| `how-to-find-first-customers` | How do I find my first 10 customers? |
| `how-to-find-product-market-fit` | How do I know when I've found product-market fit? |
| `when-to-quit-job-to-start-company` | When should I quit my job to start a company? |
| `how-to-write-cold-email-to-investors` | How do I write a cold email to investors that gets a response? |
| `how-to-split-equity-with-cofounder` | How do I split equity with a co-founder? |
| `when-to-incorporate-startup` | When should I incorporate my startup? |
| `how-long-fundraising-takes` | How long does a pre-seed or seed round take to close? |
| `safe-vs-priced-round` | Should I use a SAFE or a priced round for my pre-seed? |
| `how-to-handle-investor-rejection` | How do founders handle investor rejection? |
| `how-to-evaluate-cofounder` | How do I evaluate a co-founder before going all in? |
| `how-to-pivot-without-losing-team` | How do I pivot without losing my team or investors? |
| `how-to-hire-first-engineer` | How do I hire my first engineer at a startup? |
| `how-to-avoid-founder-burnout` | How do I avoid burning out in the first two years? |
| `bootstrap-vs-venture` | Should I bootstrap or raise venture capital? |
| `what-yc-looks-for` | What does YC actually look for in a pre-seed application? |
| `how-to-validate-startup-idea` | How do I validate a startup idea before building it? |
| `how-to-raise-as-apac-founder` | How do APAC founders raise from global investors? |
| `how-to-survive-startup-failure` | What happens when your startup fails? How do founders survive it? |

Add new canonical slugs only when you've checked above and the question doesn't fit.

---

## File map — where things live in the repo

```
/                                              static deploy root
├── index.html                                  homepage (React + FAQPage JSON-LD)
├── data.jsx                                    GENERATED — EPISODES/ARCHIVE/PLATFORMS
├── data-static.jsx                             HAND-EDITED — FAQ/QUOTES/STATS/FEATURES
├── styles.css, episodes/episode.css            hand-edited
├── sitemap.xml, robots.txt, llms.txt           GENERATED
├── settings.json                               GENERATED
├── episodes/
│   ├── index.html                              GENERATED archive page
│   └── <n>-<slug>/index.html                   GENERATED from content Doc (or hand-built — preserved)
├── topics/
│   ├── index.html                              GENERATED hub index
│   └── <slug>/index.html                       GENERATED hub from topics-config.js
├── questions/
│   ├── index.html                              GENERATED question index
│   └── <slug>/index.html                       GENERATED from Q&A pack Docs
├── about/index.html                            hand-edited
├── api/                                        (none — pure static site)
├── assets/                                     hand-edited
├── scripts/
│   ├── sync.js                                 orchestrator (runs in GH Action every 6h + manual)
│   └── lib/
│       ├── parse-doc.js                        parses content Drive Doc HTML
│       ├── parse-qa-pack.js                    parses Q&A pack Drive Doc
│       ├── render-episode.js                   renders episodes/<slug>/index.html
│       ├── render-data.js                      renders data.jsx + episodes/index.html
│       ├── render-meta.js                      renders sitemap.xml + robots.txt + llms.txt
│       ├── render-homepage-faq.js              regenerates FAQPage JSON-LD in index.html
│       ├── render-topic-hub.js                 renders topics/<slug>/index.html
│       ├── render-question-hub.js              renders questions/<slug>/index.html
│       ├── topics-config.js                    hand-edited topic configs
│       └── aggregate-questions.js              groups Q&As by canonical_slug across episodes
├── .github/workflows/sync.yml                  cron schedule + manual trigger
└── EPISODE_DOC_TEMPLATE.md                     authoring contract for content Doc
└── QA_PACK_TEMPLATE.md                         authoring contract for Q&A pack Doc
└── AGENT-PLAYBOOK.md                           this file
```

## Drive folder map

| Folder | ID | Contents |
|---|---|---|
| FiM - Episode Content | `1tB7b1B7g8goxaRxCbOwOXJaEqbNF6flR` | One Doc per episode with structured page content |
| FiM - Q&A Bank | *(in Settings sheet `qa_bank_folder_id`)* | One Doc per episode with 10–15 Q&As |
| FiM - Transcripts | `1gu8J2FRG35Z37evtSWC0HAtRZPXDh2QT` | One file per episode (`.srt` or `.txt`) |
| Episodes sheet | `1E8poisRe7yIdH_7i5fFGXcX0pRHni2s22Cr5Hppn3GA` | Episode metadata (Episodes tab) + Settings tab |

## Service account access

The Drive folders + spreadsheet are all shared with:
`fim-sync@fim-website-497208.iam.gserviceaccount.com`

If a new folder is added, it must be shared with this email (Viewer access is enough) for sync to read it.

## GitHub Actions auth (for triggering workflow)

A PAT lives at `/tmp/pat.txt` on Thea's machine (do not paste contents in chat — read with `cat`). Auth with `GH_TOKEN="$(cat /tmp/pat.txt)" gh ...`.

## What you do NOT do

- Don't edit `data.jsx`, `sitemap.xml`, `robots.txt`, `llms.txt`, `settings.json`, `episodes/index.html`, generated episode pages, generated topic pages, or generated question pages by hand. Sync overwrites them.
- Don't create episode pages by writing HTML directly — drop the content Doc, sync handles it.
- Don't expose admin/write Algolia keys client-side. The search-only key `fad56bd6443dfbfc93a64a2b5c1d629c` is the only one safe in browser code.
- Don't push directly to `main` — auto-mode classifier blocks it. Use a feature branch + `gh pr create` + `gh pr merge`.
- Don't add runtime API routes (no `/api/...`). The site is fully static. Pre-generate everything.

## Useful command snippets

```bash
# Read Episodes sheet (returns markdown)
mcp__19ae1e43-d7e3-424b-a3c2-e508898e2806__read_file_content fileId=1E8poisRe7yIdH_7i5fFGXcX0pRHni2s22Cr5Hppn3GA

# List recent Drive activity (to see what folders the connected account can see)
mcp__19ae1e43-d7e3-424b-a3c2-e508898e2806__list_recent_files pageSize=10

# Trigger sync
GH_TOKEN="$(cat /tmp/pat.txt)" gh workflow run sync.yml --ref main

# Get latest run id
GH_TOKEN="$(cat /tmp/pat.txt)" gh run list --workflow=sync.yml --limit 1 --json databaseId --jq '.[0].databaseId'

# Watch a specific run
GH_TOKEN="$(cat /tmp/pat.txt)" gh run watch <id> --exit-status --interval 5

# Pull last sync log (to debug)
GH_TOKEN="$(cat /tmp/pat.txt)" gh run view <id> --log | grep -E '📄|📝|❓|🎉|❌'

# Check what got committed by sync
GH_TOKEN="$(cat /tmp/pat.txt)" gh api repos/fim-dev7/fim-website/commits/main --jq '.commit.message, .files[].filename'
```
