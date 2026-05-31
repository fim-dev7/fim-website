# Session-complete handoff — 2026-05-31

Supersedes NIGHT-RUN-HANDOFF.md and BATCH-MATERIALS-HANDOFF.md for current state.

## ✅ LIVE NOW (pushed to `main` → Vercel)

- **All 28 episodes** rendered: `episodes/1-abby-huang/` … `episodes/28-will-bodewes/` (correct sheet numbering; Shakeel=27, Will Bodewes=28).
- **253 question pages** (`/questions/<slug>/`) + topic hubs, up from 11.
- **`aliases.json`**: 253 slugs / ~2,646 search phrasings (every question discoverable).
- **AEO**: `rel=canonical` + `og:url`/`og:site_name`/`og:image` + `twitter:card` on every page type; custom on-brand `404.html`; `robots.txt` AEO-open.
- **Ep 27 (Shakeel)**: all 8 original hallucinations fixed; "one of Australia's largest VCs"; the fabricated Jevon "I'd quit my job…" quote purged site-wide.
- **sync.js**: episode description now single-sources from the content-doc Hook (no more sheet `short_desc` duplication).
- Every episode passed the Layer-1 grounding gate (EXIT=0). Names use the **sheet-canonical** spellings (sheet overrides transcript).

## 🗂️ Drive state
- Created the full set of Drive Docs (Episode Content folder `1tB7b1B…` + Q&A Bank `14wZE6a…`): all 28 episodes now have a content doc + a Q&A pack.
- **The sync cron is PAUSED** (commented `schedule:` in `.github/workflows/sync.yml`). Re-enable (uncomment 2 lines) when you're happy — until then the site won't auto-refresh, but it's fully synced + pushed as of now.

## ⚠️ DRIVE RE-UPLOAD NEEDED (5 episodes — source corrected AFTER the live Drive doc was made)
Independent Layer-2 verification found issues in these; I fixed the **local source** (committed) but I **can't update/delete Drive docs** (read+create only). So the LIVE pages still show the pre-fix version until you swap. For each: **delete the listed Doc(s)** → tell me → I re-upload the corrected local file → re-sync.

| Ep | Why | Delete these Drive Doc(s) |
|----|-----|---------------------------|
| **23 Finnlay** (highest value) | live page is the thin 36-sec **teaser**; full transcript version ready (15 Q + chapters) | content `1c4UkpffSORgbd33H7Y_BsHMVJzUtSDf_hsNdlnWSuOA` + Q&A `1-cod-ToC62lxGKZAKE-EHyrKk1u-Q4YLKfsf7FWmjGc` |
| **11 Vivek/John** | co-founder attribution was swapped (sell-before-build/pay-signal = John; eng-cost = Vivek) | content `147es11sj6nQR6mUEHr4phmYzr9L7daiaibfvyRp54BM` + Q&A `1o3NLfNwR7e9jqjAA4YJodEb6Q9rvsajabslrOY0Wjgs` |
| **18 Alessia/Elia** | attribution + Hook conflation + "customers"→"users" quote | content `1HYWGsmwc51bMaEETwRD5Yg1jbEhu0xdLJOIOImU1zbg` + Q&A `1nQaXWKFMS-2XUAD_X-fvtXTLenthGbu9GBc1-_Irgh4` |
| **4 Kiki/Elan** | dropped a fabricated "Feastables" (transcript: "Feast of Bowls") | content `1hjsj4W6aVdIiyn8kIPaAnZfGxbaZZaDqO5aqIE3WQos` (Q&A was clean — leave it) |
| **12 SipHRD** (low priority) | dropped unverified city name "Melbourne" (likely correct, just not in transcript) | content `19DAKhmjfQ2qTF7JcGS5toe7DD1PzWIwK9Hj6HhZ9ZNA` (Q&A clean) |

## 🔬 Layer-2 verification status
- **Independently Layer-2 verified (9 episodes):** Andy, Nam, Celeste, Will Bodewes (spotless), SipHRD, Finnlay, Kiki/Elan, Vivek/John, Alessia/Elia. All issues found were minor or attribution and are now fixed in source.
- **Layer-1 + agent self-audit only (~17 episodes):** Abby, Selina, Nate, Nhi, Ben, Robert, Brian, Floriye, Hung, Jason Ma, Hamish, Satya, Joe Zhou, Ethan, Jevon, Stephen, Sam Richardson. These passed the programmatic gate and each agent did a manual transcript audit; a formal Layer-2 sweep on them is the remaining QA nice-to-have. (They're all single-founder → low attribution risk, which was the only systematic issue found.)

## 🧹 Housekeeping
- Delete the stray **`_test-can-delete`** doc in the Q&A Bank.
- **Re-enable the sync cron** in `sync.yml` when ready.
- **Connect `foundersinmotion.com`** in Vercel + DNS (steps in NIGHT-RUN-HANDOFF.md).
- PAT left untouched per your instruction (and confirmed absent from git history).

## ⚙️ Known limitation
Multi-founder episodes whose source transcript has **no speaker labels** make per-founder attribution fallible. Layer-2 is the safety net — run it on any future multi-founder episode before publishing.
