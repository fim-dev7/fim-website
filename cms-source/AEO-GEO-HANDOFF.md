# AEO/GEO + Ep 29 — Status (2026-06-01)

## ✅ Done & live on foundersinmotion.tech

- **Domain** migrated to the apex `foundersinmotion.tech` (was a dead `.com`); `www` 308→apex. All canonicals/og/sitemap/llms/JSON-LD correct.
- **IndexNow**: 294 URLs submitted to Bing/Yandex/etc.; auto-wired into the sync workflow.
- **robots directive** `max-snippet:-1, max-image-preview:large, max-video-preview:-1` on every indexable page.
- **Social/author meta**: author + twitter:title/description/image site-wide; episode og:title de-duplicated; og:type fixed on Q/topic pages; article:published_time/author on episodes.
- **Performance**: React → production builds (~1MB lighter); preconnect to unpkg; LCP hero preload; explicit image dimensions; fallback og:image for audio-only episodes.
- **Google Search Console**: property verified; **sitemap.xml submitted — Status: Success, 299 pages discovered.**
- **Ep 29 — Caroline Tran (Hello Clever)** — generated, grounded (two-layer gate + independent verifier), published. **LIVE at /episodes/29-caroline-tran/** with $15M ARR, correct names (no Clover/Emotion leaks), her question pages, and in the sitemap. (Note: the transcript file said "Ep 30" but the canonical number is **29** per the Sheet — site is correct.)

## 📋 Remaining — all optional

- [ ] **Bing Webmaster Tools** — one-click "Import from Google Search Console" (optional; IndexNow already feeds Bing/Copilot/ChatGPT).
- [ ] **Vercel** — flip the `www→apex` redirect from 307 → 308 (Settings → Domains; the dropdown that wouldn't automate). Minor.
- [ ] *(Optional)* custom thumbnail for Ep 29 (no YouTube → currently the FiM banner fallback).
- [ ] *(Housekeeping)* the Drive content/Q&A Docs are still titled "Ep 30 - Caroline Tran" — harmless (sync matches by guest name), but rename to "Ep 29" in Drive if you want tidiness. Also a stale duplicate "Ep 30" content Doc exists from the $15M re-upload (newest-Doc-wins ignores it).

## 🔧 Bigger refactors (your call — I'll do with you watching)

- Eliminate in-browser Babel via a build step (biggest perf win left, ~3MB) · self-host React · WebP the large PNGs (guests-strip 1.6MB, og banner 1.87MB) · trim/self-host Google Fonts weights.
