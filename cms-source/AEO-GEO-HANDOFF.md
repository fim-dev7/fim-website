# AEO/GEO + Ep 29 — Status (2026-06-01)

## ✅ Done & live on foundersinmotion.tech

- **Domain** on apex `foundersinmotion.tech` (`www` → apex). All canonicals/og/sitemap/llms/JSON-LD correct.
- **Google Search Console**: verified; sitemap submitted — Success, 299 pages. **Bing Webmaster** imported.
- **IndexNow**: all URLs submitted; auto-pings on every sync.
- **robots** `max-snippet:-1, max-image-preview:large, max-video-preview:-1` on every indexable page.
- **Social/author meta**: author + twitter:title/description/image site-wide; episode og:title de-duplicated; og:type fixed on Q/topic; article:published_time/author on episodes.
- **Performance**: React → production builds; **in-browser Babel eliminated** (~3MB removed; JSX prebuilt into `app.bundle.js`); preconnect; LCP hero preload; explicit image dimensions; audio-only fallback og:image. Homepage verified rendering identically.
- **Ep 29 — Caroline Tran (Hello Clever)**: grounded (two-layer gate + independent verifier), **live** at /episodes/29-caroline-tran/ with $15M ARR, correct names, **custom thumbnail** (card + og:image), question pages, in sitemap.

## ⚠️ ONE workflow change — editing the homepage

The homepage is now a prebuilt bundle (no in-browser Babel). After editing **`sections.jsx`, `app.jsx`, or `tweaks-panel.jsx`**, you MUST rebuild:

```
node scripts/build-client.mjs   # regenerates app.bundle.js
```

…then commit `app.bundle.js` alongside the `.jsx`. (`data.jsx`/`data-static.jsx` are plain data — no rebuild needed.) The 6-hourly sync also rebuilds the bundle automatically, and `verify-site.js` flags if Babel ever creeps back. Editing question/episode CONTENT (Drive Docs + Sheet) is unchanged — drop a transcript, sync, done.

## 🔧 Optional remaining (smaller wins — say the word)

- WebP/resize the large PNGs (guests-strip 1.6MB, og banner 1.87MB) · self-host React (remove unpkg dependency) · trim Google Fonts weights.
- Vercel `www→apex` redirect: bump 307 → 308 if not already done (Settings → Domains).
- Housekeeping: Drive content/Q&A Docs still titled "Ep 30 - Caroline Tran" (harmless — sync matches by guest; rename to "Ep 29" for tidiness).
