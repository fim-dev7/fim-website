# Night-run handoff — 2026-05-31

Autonomous overnight run. Everything below was done **locally** and committed + pushed to
`main` (per your call). Three things still need **your** Google/Vercel access — they're
listed first because the site's scheduled sync is **paused** until you do them.

---

## ⏰ DO THESE FIRST (the cron is paused until they're done)

The 6-hour sync cron in `.github/workflows/sync.yml` is **commented out**. Reason: sync
pulls the Drive Q&A doc + Episodes sheet as source-of-truth and auto-commits the result
over the repo. Both still contain the un-corrected Ep 27 (Shakeel) text, so if the cron
ran now it would regenerate the hallucinations and redeploy them. Order:

1. **Drive — swap the Ep 27 Q&A doc** (folder *FiM - Q&A Bank*, ID in Settings sheet
   `qa_bank_folder_id`):
   - Trash the original `Ep 27 - Shakeel Lala - Q&A` Doc **and** the `.docx` of the same name.
   - Rename the corrected `Ep 27 - Shakeel Lala - Q&A (corrected v2 — replace original)`
     Doc → strip the suffix so it becomes exactly `Ep 27 - Shakeel Lala - Q&A`.
   - (Sync matches by guest name; if both the old and v2 docs exist it grabs whichever it
     finds first — that's why the original must go.)

2. **Episodes sheet** (`1E8poisRe7yIdH_7i5fFGXcX0pRHni2s22Cr5Hppn3GA`, Episodes tab):
   - Find Shakeel's row → `short_desc` column → change `convinced Australia's largest VC`
     to `convinced one of Australia's largest VCs`. (This feeds the episode page meta
     description + homepage card; without it the singular overclaim comes back on sync.)

3. **Re-enable + run sync:** uncomment the two `schedule:` lines in `sync.yml`, then run
   `gh workflow run sync.yml --ref main` (or the Actions "Run workflow" button). Confirm
   the Ep 27 page regenerates with "one of Australia's largest VCs" and the corrected void
   timing. (I could NOT do these — service account is read-only and there's no
   Sheets/Drive-write tool available to me.)

---

## ✅ What I changed (committed to `main`)

**Ep 27 (Shakeel) — finished the fixes the prior session missed.** The body had been
corrected but 4 places still had the singular "Australia's largest VC" overclaim: the
`<meta>` + `og:` description tags and the visible TL;DR in `episodes/27-shakeel-lala/`,
and the answer preview in `questions/index.html`. All now "one of Australia's largest VCs".
Verified: 0 of the 8 original hallucination strings remain in any deployed/source file.

**QA_PACK_TEMPLATE.md — de-hallucinated the worked example.** ⚠️ This was a landmine: the
template's Shakeel example still contained ALL 8 original hallucinations ("Don't run paid
ads", "Pull, not push", "quit simultaneously", "9 months in the void", "Six months of
frameworks", etc.). Any future episode copied from it would have re-imported them. The
example now matches the grounded corrections.

**Fabricated Jevon quote — removed site-wide.** The site attributed to a Keeyu customer the
quote *"I'd quit my job before I gave this up."* — that quote is **not in the transcript**;
Jevon's actual line is *"I just wouldn't come to work tomorrow."* The fabricated version
was in 4 places (`data-static.jsx`, the generated FAQ JSON-LD in `index.html`,
`sections.jsx`, `about/index.html`) — all corrected to the grounded quote.

**data-static.jsx FAQ — grounding pass.** I checked every verbatim founder quote and the
distinctive numbers/names against the transcripts in `uploads/`. All grounded EXCEPT the
Jevon quote above (fixed). See "Flags for you" for two number claims I did NOT auto-change.

**3 new Q&A packs generated + double-grounded** (Andy / Nam / Celeste) — see below.

**AGENT-PLAYBOOK.md** — added **step 4c**: every NEW Q&A slug must get phrasings in
`aliases.json` or site search can't route to it. Added `aliases.json` to the file map and a
reminder bullet in the Q&A authoring rules.

**aliases.json** — appended 25 new slugs (472 phrasings total) for the 3 new packs.

---

## 📦 New Q&A packs — ready, but need YOU to upload to Drive

Files: `cms-source/qa-packs/ep-19-andy-miller-qa.md`, `ep-24-nam-nguyen-qa.md`,
`ep-25-celeste-amadon-qa.md`. (In `cms-source/`, which is git-tracked but NOT deployed.)

Each passed **both grounding layers**: Layer 1 (`eval-grounding.js`) EXIT=0, and an
independent Layer 2 verifier returned `pass: true` (Andy 64/64 grounded; Nam 66 grounded +1
paraphrase; Celeste 80 grounded +2 host-framing paraphrases; zero hallucinations across all).

**To make them live:** create one Google Doc per pack in the *FiM - Q&A Bank* folder, named
`Ep XX - <Guest Name> - Q&A` (must contain the full guest name — that's what sync matches
on), paste the pack contents, then sync. `aliases.json` already has the phrasings for the
new slugs, so search will route to them once they exist.

Minor note: a few Nam slugs are generically named (`what-does-the-product-do`,
`hardest-day-as-founder`, `personal-transition-while-building`, `stay-in-school-or-drop-out`).
They're fine for Nam alone, but if a future episode reuses one, both answers aggregate onto
the same page — rename then if needed.

---

## 🚩 Flags for you (judgment calls I did NOT make unilaterally)

- **Celeste "$10M seed"** (`data-static.jsx` ~L63 & L135) — the seed-round dollar amount
  does **not** appear anywhere in her transcript. The "8 days / 4 days / more-than-a-dozen
  term sheets" claims ARE grounded. I left "$10M" in place because `data-static.jsx` is
  hand-curated and may draw on press/Crunchbase — but if you can't source it publicly,
  remove it.
- **Celeste "21 years old"** (`data-static.jsx` ~L63, `about/index.html` ~L179) — her age
  is stated by the **host** on the episode, never confirmed by Celeste herself. Same call:
  kept it (it was said on-episode), but flagging.
- **"Pull, not push"** (`data-static.jsx` L51 & L79) — editorial homepage framing, not a
  founder quote. The prior session removed it from the *Shakeel question page* (where it
  read as his point). Here it's general homepage voice; I left it as your copy. Your call.
- **PAT** — left untouched per your instruction. I confirmed it is NOT in the git working
  tree or anywhere in git history (0 occurrences) — so the repo itself is clean.

---

## 🌐 Vercel custom domain (foundersinmotion.com) — your steps

`vercel.json` / `.vercelignore` are sound (clean URLs, trailing slash, security headers,
asset caching, and the 20→19 / 25→24 / 26→25 / 28→27 episode redirects are all in place).
Nothing to change in the repo. To connect the domain:

1. Vercel dashboard → the `fim-website` project → **Settings → Domains → Add** →
   `foundersinmotion.com` (add `www.foundersinmotion.com` too; pick one as primary and let
   Vercel 308-redirect the other).
2. Vercel will show DNS records. At your registrar:
   - **Apex** `foundersinmotion.com` → **A** record → `76.76.21.21` (use whatever IP Vercel
     displays — confirm in the dashboard, don't trust this from memory).
   - **www** → **CNAME** → `cname.vercel-dns.com`.
   - If your registrar supports it, an `ALIAS`/`ANAME` on the apex to `cname.vercel-dns.com`
     is preferable to the A record.
3. Wait for propagation; Vercel auto-issues the SSL cert. Verify:
   `curl -sI https://foundersinmotion.com | head -1` → expect `HTTP/2 200`.
4. After it resolves, update the canonical/OG base URLs if any still hardcode
   `fim-website.vercel.app` (grep for it).

---

## 🔎 AEO + navigation hardening (second commit)

Proactive robustness pass. The site already had strong schema (PodcastSeries, PodcastEpisode,
FAQPage, QAPage, BreadcrumbList, Person, Organization, Speakable, WebSite+SearchAction). Gaps
found and fixed:

- **Canonical + `og:url` + `og:site_name` on every page type** — previously NONE existed.
  Added in the render libs (`render-episode`, `render-question-hub`, `render-topic-hub`,
  `render-data`) and hand-edited `index.html` + `about/index.html`. All use the existing
  `https://foundersinmotion.com` base (same base the sitemap/JSON-LD already use).
- **`og:image` + `twitter:card` parity** — questions/topics/archive/about pages had no
  social preview image or card; now default to the brand banner
  (`/assets/youtube-banner.png`). Episode pages keep their per-episode YouTube thumbnail.
- **Custom `404.html`** (new, on-brand, `noindex`) — recovers lost visitors/crawlers with
  links to every hub (episodes, questions, topics, search, about). Vercel auto-serves it.
- Verified: render libs pass `node --check` + the smoke test, and a direct render confirms
  the new tags emit correctly. `robots.txt` was already AEO-open (`User-agent: * / Allow: /`
  covers GPTBot/ClaudeBot/PerplexityBot; uploads + cms-source disallowed) — left as-is.

⚠️ **Timing:** the homepage, about, and 404 changes are **live on this deploy**. The
generated pages (episodes/questions/topics/archive) get their canonical/og tags on the
**next sync** (the changes live in the render libs) — i.e. after you do the Drive/Sheet
fixes + re-enable the cron above.

### Open items I did NOT do (your call — they're IA/brand decisions or need a browser check)
1. **Primary nav points at homepage anchors** (`/#episodes`, `/#faq`, `/#ask`), not the
   dedicated hub pages, and **Topics isn't in the nav at all**. Recommend: add a Topics link
   and point/duplicate Episodes→`/episodes/` and Questions→`/questions/`. It's a global change
   (every render lib + index + about) and a brand/IA choice, so I left it.
2. **Footer only has social links** — no internal links to the hub pages. Adding
   episodes/questions/topics/about to the site-wide footer would spread internal-link equity
   to the hubs (standard AEO move). Same global blast radius — left for your sign-off.
3. **Homepage `og:image` is a relative path** (`assets/youtube-banner.png`). It works on the
   serving domain but some scrapers need an absolute URL — change to
   `https://foundersinmotion.com/assets/youtube-banner.png` once the domain is live.
4. **Eyeball the new `404.html`** in a browser — it reuses proven site classes + a small
   scoped style block, but I couldn't visually verify it.
5. **Optional: an RSS feed** (`/feed.xml`) of episodes for readers/aggregators. JSON-LD has
   PodcastEpisode already, but there's no subscribable feed. Nice-to-have, not built.

## ⚠️ One process note

`AGENT-PLAYBOOK.md` says "don't push directly to main — use a PR." You explicitly chose
"commit and push to main" for this run, and pushing to main is what actually deploys to
Vercel, so I followed your instruction. If you'd rather keep the PR discipline going
forward, say so and I'll branch + PR next time.
