# Episode content Doc — the CMS template

Copy this structure into a new Google Doc when publishing an episode. Save the
Doc into the **Episode Content** Drive folder (the one whose ID is stored in
the Settings sheet under `episode_content_folder_id`). Name the Doc:

    Ep XX - GuestName

Within 6 hours, the sync workflow will parse this Doc, render
`episodes/<n>-<slug>/index.html`, update the homepage data, and Vercel will
redeploy.

You can run the sync manually at any time from the GitHub repo's **Actions**
tab → **Sync FiM site from Google Sheets + Drive** → **Run workflow**.

---

## The structure (H1 headings)

Each top-level heading below must be a **Heading 1** in the Doc. Sections are
parsed by their heading. Order doesn't matter. Any heading the sync doesn't
recognise is ignored. All sections are optional except **Hook** and **Story**.

---

### Hook
One sentence (max two). This is the page meta description, the homepage card
description, and the archive row description. Treat it like the line you'd
use to pitch this episode in a single LinkedIn post.

### Story
The narrative. 3–5 paragraphs. The first paragraph becomes the visual lead;
the rest are body paragraphs. Write it in your voice, not the guest's. This
is the "what is this episode actually about" section.

### What you'll hear
A bulleted list. Each bullet starts with a **bold label**, then an em-dash,
then the explanation. Example:

- **The pre-idea raise** — why one of Australia's largest VCs backed them before they had an application
- **The three lessons of "the void"** — frameworks don't find markets, network is your moat, sit inside firms before you sell

5–7 bullets ideal.

### Key claims
A bulleted list of 4 stat cards. Each bullet is a **bold number or short
phrase** + em-dash + the claim. Example:

- **650+** — Financial advice firms using the product across six countries
- **800** — Discovery conversations before product-market fit
- **$10M** — Latest round
- **6 months** — Time spent finding the idea

### Chapters
A bulleted list of timestamp + label + optional sub-label, em-dash separated.
Example:

- 00:00 — Cold open — "You can vibe code your ideas, but not customers"
- 02:45 — Six months without an idea — Both founders had quit their jobs
- 10:00 — What the product actually is

8–12 entries. Use timestamps that match the audio.

### Quotes
**Pull quotes go inside blockquotes** (in Google Docs: select text, then
Format → Block quote). Each blockquote has two paragraphs: the quote, then the
attribution starting with an em-dash. Example:

> You can vibe code your ideas. You can vibe code products. But you can't vibe code customers.
>
> — Shakeel Lala, on the limits of AI in early-stage building (15:30)

3–6 quotes. Verbatim from the transcript.

### Themes
Bulleted list, same `**bold label** — explanation` shape as "What you'll hear".
This is the "what does the guest keep coming back to" section. 4–6 bullets.

### Mentioned
Sidebar list: people, companies, books, tools referenced in the episode.

- **Marloo** — An AI partner for financial advisors
- **Hardy** — Co-founder, based in London
- **Financial Advice Association of Australia** — Brisbane conference, end of 2024

### Background
Optional sidebar block. Same `**label** — text` shape. Use this for guest-
specific extra context: where the company is operating, what stage they're
at, who else is on the cap table.

### Meta
**Free-form key: value pairs**, one per line (regular paragraph, not a list).
All keys are optional. Example:

duration: 35 min
duration_iso: PT35M
guest_role: Co-founder, Marloo
guest_bio: Left corporate strategy and raised venture capital with co-founder Hardy on the promise they'd find an idea within twelve months.
mini_stats: $10M raised | 650+ firms | 800 calls | 6 countries
tags: Fintech AI · Customer Discovery · Pre-Seed
twitter_share: Shakeel Lala raised backing before he had a business idea. This episode is excellent.
meta_description: Custom SEO meta description if you want to override the Hook.
transcript_summary: A paraphrased one-paragraph summary used in the PodcastEpisode JSON-LD's transcript field. If omitted, the first 800 chars of the transcript are used.
background_title: Custom sidebar title for the Background block (default: "Background").

**`mini_stats` format**: four `value label` pairs separated by `|`. Each pair
must be one short value (e.g. `$10M`) followed by a space and a short label
(e.g. `raised to date`). If you provide fewer than 4 pairs, the mini-stats
block won't render.

---

## What the sheet provides vs. what the Doc provides

| Field | Source |
|---|---|
| Episode number, title, guest name, company | Episodes sheet |
| YouTube, Spotify, Apple URLs | Episodes sheet |
| Published date | Episodes sheet |
| Tags (for badges + filters) | Episodes sheet column I (pipe-separated) **OR** Meta `tags:` line |
| Featured on homepage? | Episodes sheet column J (TRUE/FALSE) |
| Short archive description | Episodes sheet column K **OR** the Doc's Hook section |
| Page hook, story, chapters, quotes, themes | This Doc |
| Duration display | Meta `duration:` |
| Guest role + bio + mini-stats | Meta section |

If an episode has no content Doc, the sync will still:
- show it in the homepage archive list (without a link, or linking to Spotify)
- include it in the archive page
- NOT generate a detail page

This means you can rollout content Docs progressively without breaking
anything.

---

## What if I already have a manually-built episode page?

The sync leaves it alone. Only pages with a `Generated: ...` marker in the
HTML head get overwritten. If you want a hand-built page to become CMS-
managed, create a content Doc — the next sync will overwrite the manual page.

---

## The full pipeline at a glance

1. New episode publishes on YouTube + Spotify + Apple.
2. Add a row to the Episodes sheet (episode_number, title, guest_name, company, URLs, date, tags, featured, short_desc).
3. Drop the transcript Google Doc into the transcripts folder (existing workflow).
4. Run `fim-pipeline` or `fim-yt-spotify` to generate the structured assets.
5. Create a new Google Doc in the Episode Content folder named `Ep XX - GuestName`. Paste the structured asset output and reshape into the H1 sections above.
6. Wait for next sync (every 6h) — or hit **Run workflow** in GitHub Actions for an immediate update.
7. Site updates. Vercel redeploys.
