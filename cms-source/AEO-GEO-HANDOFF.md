# AEO/GEO + Ep 30 — Handoff (2026-06-01)

## ✅ Done autonomously (live on foundersinmotion.tech)

- **Domain migrated to the apex** `foundersinmotion.tech` (was pointing at a dead `.com`). All canonicals, og:url, sitemap, llms.txt, robots, and JSON-LD now resolve correctly. `www` 307-redirects to apex (path-preserving).
- **IndexNow**: all 294 URLs submitted to Bing/Yandex/etc., and auto-wired into the sync workflow (new episodes auto-ping).
- **robots directive** `max-snippet:-1, max-image-preview:large, max-video-preview:-1` on every indexable page (lets Google/AI show full snippets + large images — highest-impact AEO tag).
- **Social/author meta**: `author`, `twitter:title/description/image` on all page types; episode `og:title` de-duplicated; `og:type` corrected to `website` on Q/topic pages; `article:published_time` + `article:author` added to episodes.
- **Performance**: React swapped to production builds (~1MB lighter, SRI verified, render confirmed live); preconnect to unpkg; LCP hero image preloaded; explicit image dimensions (fixes layout shift); audio-only episodes now get a fallback og:image.
- **Ep 30 (Caroline Tran, Hello Clever)** grounded materials generated, passed the two-layer zero-hallucination gate + an independent verifier, and uploaded to the Drive CMS.

> Note: the og:title/og:type/article-meta fixes are live on the homepage now; on the 290 generated episode/question/topic pages they finish propagating on the next 6-hourly sync (robots + author are already live everywhere).

---

## 📋 YOUR LIST — everything that needs you

### 1. Publish Ep 30 (Caroline) — almost done
- [ ] **Paste me the Spotify episode URL** (I pulled Apple + all other metadata; only Spotify I can't fetch).
- [ ] **Add the Episodes-sheet row** (I can't write the Sheet — read-only access). Pre-filled values:
  - A `30` · B `$15M ARR Fintech Founder: I Found My First Customer on Facebook | Caroline Tran, Hello Clever` (or a shorter site title) · C `Caroline Tran` · D `Hello Clever` · E *(blank, no YouTube)* · F `<spotify url>` · G `https://podcasts.apple.com/us/podcast/$15m-arr-fintech-founder-i-found-my-first-customer/id1810228671?i=1000771135185` · H `2026-06-04` · I `Fintech | Payments | Pivoting` · J `TRUE`/`FALSE` (hero?) · K *(optional)*
- [ ] **Trigger sync** after the row's in (or the 6h cron picks it up). Then Ep 30 is live.
- [ ] *(Optional)* a custom thumbnail for Ep 30 (no YouTube → currently falls back to the FiM banner).

### 2. AEO accounts (the remaining high-impact items — need your logins)
- [ ] **Google Search Console** → add property `https://foundersinmotion.tech/`, verify (pick "HTML tag" and **paste me the code** — I'll add it + push), then submit `sitemap.xml`. *(Google = biggest engine + powers AI Overviews/Gemini. IndexNow doesn't cover Google.)*
- [ ] **Bing Webmaster Tools** → one-click import from GSC. *(Feeds Bing + Copilot/ChatGPT search; your IndexNow pings already show here.)*

### 3. Optional quick wins
- [ ] **Vercel**: the `www→apex` redirect is a 307 (temporary); flip it to **308 (permanent)** in Settings → Domains (the redirect-type dropdown that wouldn't cooperate with automation). Minor SEO polish.

### 4. Bigger refactors I held off on (your call — I can do these with you watching)
- **Eliminate in-browser Babel** via a one-time build step — the biggest remaining performance win (~3MB off the homepage). Needs a build-pipeline change.
- **Self-host React** (vendor into /assets) — pairs with the Babel change; removes the unpkg dependency.
- **Convert large PNGs to WebP/AVIF** — guests-strip (1.6MB) + og banner (1.87MB) → ~60-80% smaller.
- **Trim/self-host Google Fonts** weights (currently 3 families, 12 weights, render-blocking).
