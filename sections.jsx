/* global React, EPISODES, FEATURED, ARCHIVE, PLATFORMS, FILTERS, QUOTES, FAQ, STATS, FEATURES */
const { useState, useEffect, useMemo } = React;

// ─── Helpers ─────────────────────────────────────────
function initials(name) {
  if (!name) return "—";
  const parts = name.replace(/&/g, "and").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Nav ─────────────────────────────────────────
function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="#top" className="brand">
          <img className="brand-logo" src="assets/logo-white.png" alt="Founders In Motion" width="28" height="28" decoding="async" />
          <span className="brand-text">Founders <em>In Motion</em></span>
        </a>
        <div className="nav-links">
          <a href="#episodes">Episodes</a>
          <a href="#faq">Founder Questions</a>
          <a href="#about">About</a>
        </div>
        <a className="btn btn-primary" href="https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl">
          Listen Free
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </nav>);

}

// ─── Hero ─────────────────────────────────────────
function Hero() {
  return (
    <header className="hero" id="top">
      <div className="container hero-inner">
        <div className="hero-grid">
        <figure className="hero-photo">
          <img src="assets/thea-hero-2.jpg" alt="Thea Ngo — host of Founders In Motion" width="888" height="1100" fetchPriority="high" decoding="async" />
          <figcaption><b>Thea Ngo</b><span>Host</span></figcaption>
        </figure>
        <div className="hero-text">
        <span className="pill"><span className="dot"></span>New episodes weekly</span>
        <h1>Before the <em>headline.</em></h1>
        <p className="hero-sub">
          Founders In Motion is where the top 1% of early-stage founders around the world, across Australia, Southeast Asia, and the US, share how they're building their business, what's working, what's not. Hosted by <b>Thea Ngo</b>.<br /><br />Think pivots, chaos, scandals and how to get through it.<br />
        </p>
        <div className="hero-cta">
          <a href="https://www.youtube.com/@foundersinmotion" className="btn btn-primary">
            <YouTubeIcon /> Watch on YouTube
          </a>
          <a href="https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl" className="btn btn-secondary">
            <SpotifyIcon /> Listen on Spotify
          </a>
          <a href="https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671" className="btn btn-secondary">
            <AppleIcon /> Apple Podcasts
          </a>
          <a href="#episodes" className="btn btn-secondary">Browse Episodes</a>
        </div>
        </div>
        </div>
        <div className="stats">
          {STATS.map((raw) => {
            const s = raw.label === "Episodes published" && typeof ARCHIVE !== "undefined"
              ? { ...raw, value: ARCHIVE.length + "+" }
              : raw;
            return (
          <div className="stat" key={s.label}>
              <div className="v">{s.value}</div>
              <div className="l">{s.label}</div>
            </div>
            );
          })}
        </div>
      </div>
    </header>);

}

// ─── Guest strip ─────────────────────────────────────────
function GuestStrip() {
  return (
    <div className="guest-strip-wrap">
      <img className="guest-band" src="assets/guests-strip.png" alt="A selection of past guests of Founders In Motion" width="2560" height="476" loading="lazy" decoding="async" />
      <div className="guest-meta">
        <span className="label">{typeof ARCHIVE !== "undefined" ? ARCHIVE.length : 32}+ founders</span>
        <span>Early-stage building across continents</span>
      </div>
    </div>);

}

// ─── Ask the archive (alias-backed Algolia search) ────────────────────────
// Algolia indexes Q&A entries with build-time-generated aliases — natural-
// language phrasings of each canonical question. User queries match against
// the aliases first, so semantic intent reaches the canonical /questions/
// <slug>/ page without any runtime API call. All intelligence is precomputed
// by Claude when content is added; runtime is pure static search.
const ALGOLIA_APP_ID = "G2C3CUY2G8";
const ALGOLIA_SEARCH_KEY = "fad56bd6443dfbfc93a64a2b5c1d629c";
const ALGOLIA_INDEX = "fim_episodes";

const SUGGESTED_QUESTIONS = [
  "How do I find product-market fit?",
  "How do I raise pre-seed without a product?",
  "When should I quit my job to start a company?",
  "How do I do customer discovery?",
  "What does the messy middle feel like?",
  "How do I write a cold email to investors?",
];

async function searchQA(query, { signal } = {}) {
  if (!query || !query.trim()) return { hits: [] };
  const url = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
  const body = JSON.stringify({
    params: new URLSearchParams({
      query,
      hitsPerPage: "6",
      filters: "type:question",
      removeWordsIfNoResults: "lastWords",
    }).toString(),
  });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": ALGOLIA_APP_ID,
      "X-Algolia-API-Key": ALGOLIA_SEARCH_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal,
  });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = await res.json();
  // Normalize to the same shape the hero/related UI expects
  const hits = (data.hits || []).map((h) => ({
    slug: h.slug_q,
    question: h.question,
    answer: h.answer,
    episode_number: h.episode_number,
    guest_name: h.guest_name,
    guest_company: h.guest_company,
  }));
  return { hits };
}

function AskBox() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // slug → number of founders who answered this canonical question (from qa-index.json),
  // so the search result can flag "+N more perspectives" before you click in.
  const [counts, setCounts] = useState({});
  useEffect(() => {
    fetch("qa-index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((idx) => {
        const m = {};
        (idx || []).forEach((q) => { m[q.slug] = q.contributor_count || 1; });
        setCounts(m);
      })
      .catch(() => {});
  }, []);

  // Debounced semantic search — fires 350ms after typing stops.
  useEffect(() => {
    if (!submitted) { setHits([]); setError(null); return; }
    const ctrl = new AbortController();
    setLoading(true); setError(null);
    searchQA(submitted, { signal: ctrl.signal })
      .then((data) => { setHits(data.hits || []); })
      .catch((err) => { if (err.name !== "AbortError") setError(err.message || "Search failed"); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [submitted]);

  // Debounce the live query → submitted
  useEffect(() => {
    if (!query.trim()) { setSubmitted(""); return; }
    const id = setTimeout(() => setSubmitted(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  // ?q= deep link
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const q = params.get("q");
    if (q) { setQuery(q); setSubmitted(q); }
  }, []);

  function chooseSuggestion(s) { setQuery(s); }
  function clearAll() { setQuery(""); setSubmitted(""); }

  const [hero, ...related] = hits;

  return (
    <section className="panel ask" id="ask">
      <div className="container">
        <div className="section-head">
          <div className="kicker">Ask the archive</div>
          <h2>Get a real answer, drawn from real founders.</h2>
          <p>Type any founder question — semantic search picks the canonical answer from the archive. Click for the full version.</p>
        </div>

        <div className="ask-wrap">
          <div className="ask-input-row">
            <svg className="ask-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input
              type="search"
              className="ask-input"
              placeholder="How can I get customers before I have a product?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck="false"
              aria-label="Ask a founder question"
            />
            {query && (<button type="button" className="ask-clear" onClick={clearAll} aria-label="Clear">×</button>)}
          </div>

          {!query && (
            <div className="ask-suggestions">
              <span className="ask-suggestions-label">Try:</span>
              {SUGGESTED_QUESTIONS.map((s) => (
                <button key={s} className="ask-chip" onClick={() => chooseSuggestion(s)}>{s}</button>
              ))}
            </div>
          )}

          {loading && <div className="ask-status"><span className="ask-spin" aria-hidden></span> Finding the best answer…</div>}
          {error && <div className="ask-status ask-error">⚠ {error}</div>}
          {submitted && !loading && hits.length === 0 && !error && (
            <div className="ask-status">No answers matched. The archive's strongest areas: customer discovery, pre-seed fundraising, pivots, product-market fit. Try rephrasing in those terms — or <a href="questions/" style={{color:"var(--cream)"}}>browse all questions</a>.</div>
          )}

          {hero && <AskHero hit={hero} count={counts[hero.slug] || 1} />}
          {related.length > 0 && (
            <div className="ask-related">
              <div className="ask-related-label">Related</div>
              {related.map((hit) => <AskRelated key={hit.slug + hit.episode_number} hit={hit} count={counts[hit.slug] || 1} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AskHero({ hit, count = 1 }) {
  const href = `questions/${hit.slug}/`;
  const others = count - 1;
  return (
    <a className="ask-hero" href={href}>
      <div className="ask-hero-badge">Best match{count > 1 ? ` · ${count} perspectives` : ""}</div>
      <h3 className="ask-hero-question">{hit.question}</h3>
      <p className="ask-hero-answer">{hit.answer}</p>
      <div className="ask-hero-footer">
        <div className="ask-hero-attr">
          <b>{hit.guest_name}</b> · <i>{hit.guest_company}</i> · EP {hit.episode_number}
          {others > 0 && (<span className="ask-hero-more"> · +{others} other founder{others === 1 ? "" : "s"} answered this</span>)}
        </div>
        <div className="ask-hero-cta">{count > 1 ? `See all ${count} perspectives` : "Read full answer"} <span aria-hidden>→</span></div>
      </div>
    </a>
  );
}

function AskRelated({ hit, count = 1 }) {
  const href = `questions/${hit.slug}/`;
  return (
    <a className="ask-related-card" href={href}>
      <div className="ask-related-body">
        <h4 className="ask-related-question">{hit.question}</h4>
        <div className="ask-related-attr"><b>{hit.guest_name}</b> · EP {hit.episode_number}{count > 1 ? ` · ${count} perspectives` : ""}</div>
      </div>
      <div className="ask-related-arrow" aria-hidden>↗</div>
    </a>
  );
}

// ─── What this is ─────────────────────────────────────────
function WhatThisIs() {
  return (
    <section className="panel" id="what">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="label">What this is</div>
            <h2 className="h2">The founding journey doesn't look like the highlights reel.</h2>
          </div>
        </div>
        <div className="what">
          <div className="what-copy">
            <p>Most founder content is about the outcome. Founders In Motion is about the process, what actually happens between the idea and the exit, and why the messy middle is where everything real gets decided.

            </p>
            <p>
              Each episode is one unscripted conversation with one early-stage founder. No pitch. No PR. Just the real story of how they found the problem, built the first thing, lost confidence, rebuilt it, and kept going.
            </p>
            <p>Guests come from Australia, Southeast Asia, Vietnam, South Africa, India, and the US, founders the world hasn't heard from yet.

            </p>
          </div>
          <div className="what-card">
            {FEATURES.map((f) =>
            <div key={f.title} className="feature">
                <div className="ico">{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.body}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

}

// ─── Pull quote ─────────────────────────────────────────
function PullQuote({ quote, quotes }) {
  const list = quotes && quotes.length ? quotes : [quote];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % list.length), 6500);
    return () => clearInterval(t);
  }, [list.length]);
  const q = list[Math.min(i, list.length - 1)];
  return (
    <section className="quote-section">
      <div className="container">
        <blockquote className="quote" key={i}>
          <q>{q.text}</q>
          <div className="attr">
            <span><b>{q.attr}</b> · {q.sub}</span>
          </div>
        </blockquote>
        {list.length > 1 &&
        <div className="quote-dots">
            {list.map((_, n) =>
          <button
            key={n}
            type="button"
            className={"quote-dot" + (n === i ? " active" : "")}
            aria-label={"Show quote " + (n + 1)}
            onClick={() => setI(n)} />
          )}
          </div>
        }
      </div>
    </section>);

}

// ─── Episodes ─────────────────────────────────────────
function Episodes() {
  // Homepage trio comes straight from the synced bundle (EPISODES = the curated
  // "Start here" picks generated by sync from the Sheet). No runtime override.

  return (
    <section className="panel" id="episodes">
      <div className="container">
        <div className="eps-header">
          <div>
            <div className="label">Most popular</div>
            <h2 className="h2" style={{ marginTop: 16 }}>Start here.</h2>
          </div>
          <a href="episodes/" className="btn btn-secondary">
            Browse all episodes <span>→</span>
          </a>
        </div>
        <div className="eps-grid">
          {EPISODES.slice(0, 3).map((ep) =>
          <EpisodeCard key={ep.n} ep={ep} />
          )}
        </div>

        <div className="archive">
          <div className="label">25+ EPISODES IN THE ARCHIVE</div>
          <div className="chips">
            {ARCHIVE.map((g, i) =>
            g.url ?
            <a key={i} className="chip chip-link" href={g.url}>
                <b>{g.guest}</b> · <i>{g.company}</i>
              </a> :
            <span key={i} className="chip">
                <b>{g.guest}</b> · <i>{g.company}</i>
              </span>
            )}
            <a href="episodes/" className="chip cta">
              Browse all episodes →
            </a>
          </div>
        </div>
      </div>
    </section>);

}

function EpisodeCard({ ep }) {
  return (
    <article className="epc">
      <div className="epc-tag">Ep {ep.n}{ep.tags && ep.tags.length ? " · " + ep.tags.join(" · ") : ""}</div>
      <h3 className="epc-title">{ep.title.split(/\s*\|\s*/)[0]}</h3>
      <p className="epc-desc">{ep.desc}</p>
      <div className="epc-guest">
        <div className="avatar">{initials(ep.guest)}</div>
        <div className="guest-meta">
          <b>{ep.guest}</b>
          <i>{ep.company}</i>
        </div>
        <a className="listen" href={ep.url || "#"} onClick={ep.url ? undefined : (e) => e.preventDefault()}>Listen now <span>→</span></a>
      </div>
    </article>);

}

// ─── FAQ ─────────────────────────────────────────
function FaqSection() {
  return (
    <section className="panel" id="faq">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="label">What founders actually ask</div>
            <h2 className="h2" style={{ marginTop: 16 }}>The questions nobody answers honestly.</h2>
            <p style={{ marginTop: 20, maxWidth: 640, color: "var(--muted)", fontSize: 17, lineHeight: 1.6 }}>
              The founding journey raises questions that most content skips. Here's what {typeof ARCHIVE !== "undefined" ? ARCHIVE.length : 32} episodes with early-stage founders actually taught us.
            </p>
          </div>
        </div>
        <div className="faq-grid">
          {FAQ.map((item, i) =>
          <article className="faq-item" key={i}>
              <h3>{item.q}</h3>
              <p className="a">{item.a}</p>
            </article>
          )}
        </div>
      </div>
    </section>);

}

// ─── Listen ─────────────────────────────────────────
function Listen() {
  return (
    <section className="panel listen-section" id="listen">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="label">Listen free</div>
            <h2 className="h2" style={{ marginTop: 16 }}>Available everywhere you listen.</h2>
            <p style={{ marginTop: 20, color: "var(--muted)", fontSize: 17 }}>
              New episodes weekly. Completely free.
            </p>
          </div>
        </div>
        <div className="platforms">
          {PLATFORMS.map((p) =>
          <a key={p.name} className="platform" href={p.url} target="_blank" rel="noreferrer">
              <span className="ico">{p.short}</span>
              <span className="name">{p.name}</span>
              <span className="arrow">↗</span>
            </a>
          )}
        </div>
      </div>
    </section>);

}

// ─── About Thea ─────────────────────────────────────────
function About() {
  return (
    <section className="panel" id="about">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="label">The host</div>
          </div>
        </div>
        <div className="about">
          <img className="thea-avatar" src="assets/thea-ngo.jpg" alt="Thea Ngo, host of Founders In Motion" loading="lazy" decoding="async" />
          <div>
            <h2 className="h2">Thea Ngo</h2>
            <div className="role-tag">Early-stage investor &amp; professional question-asker</div>
            <p>Hi, I'm Thea. I invest in early-stage founders for a living, which mostly means I spend my days asking nosy questions, and trying to figure out which weird ideas are about to become inevitable.

            </p>
            <p>Founders In Motion is the show I started because the LinkedIn highlight reel was driving me a little crazy. Nobody talks about the year of nothing, the co-founder breakup, the term sheet you walked away from, the customer who said "I just wouldn't come to work tomorrow." I was so curious of the messy middle, so I went and got it.

            </p>
            <p>{typeof ARCHIVE !== "undefined" ? ARCHIVE.length : 32} episodes deep, I've talked to founders building non-alcoholic beer ($50M+ valued), AI robotics ($120M raised), YC companies, chili oil empires (150 stores, Gordon Ramsay's seal of approval), and the next frontier dating apps (seed closed in 4 days). The only thing they have in common: they were still in the thick of it when we hit record.

            </p>
            <p>{"Things I'm into: cold founder DMs, niche verticals, anyone building the next big thing. If you're early and a little obsessed, I'd love to meet you. I'm best found on LinkedIn these days!!\n\nAND THANK YOU FOR WATCHING <3\n"}

            </p>
            <div className="socials">
              <a className="social" href="https://www.linkedin.com/in/theango/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
              <a className="social" href="https://www.instagram.com/thea.yaps" target="_blank" rel="noreferrer">Instagram ↗</a>
              <a className="social" href="https://www.tiktok.com/@foundersinmotion" target="_blank" rel="noreferrer">TikTok ↗</a>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

// ─── Footer ─────────────────────────────────────────
function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-row">
          <a href="#top" className="brand">
            <img className="brand-logo" src="assets/logo-white.png" alt="Founders In Motion" style={{ height: 24 }} />
            <span className="brand-text">Founders <em>In Motion</em></span>
          </a>
          <nav className="footer-nav">
            <a href="https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl">Spotify</a>
            <a href="https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671">Apple</a>
            <a href="https://www.instagram.com/thea.yaps">Instagram</a>
            <a href="https://www.tiktok.com/@foundersinmotion">TikTok</a>
            <a href="https://www.linkedin.com/in/theango/">LinkedIn</a>
          </nav>
          <div className="copyright">© 2026 Founders In Motion · Hosted by Thea Ngo</div>
        </div>
        <div className="footer-mark">Founders <em>In Motion</em></div>
      </div>
    </footer>);

}

// ─── Icons ─────────────────────────────────────────
function SpotifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0a12 12 0 100 24 12 12 0 000-24zm5.5 17.3a.75.75 0 01-1 .25c-2.7-1.6-6.1-2-10.1-1.1a.75.75 0 11-.3-1.5c4.4-1 8.2-.5 11.2 1.3.4.3.5.7.2 1zm1.5-3.4a.94.94 0 01-1.3.3c-3.1-1.9-7.9-2.5-11.6-1.4a.94.94 0 11-.5-1.8c4.3-1.3 9.6-.6 13.1 1.6.5.3.6.9.3 1.3zm.1-3.5C15.3 8.2 8.6 7.9 5.1 9a1.1 1.1 0 11-.7-2.1c4.1-1.3 11.4-1 15.7 1.6a1.1 1.1 0 11-1.1 1.9z" />
    </svg>);

}
function AppleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.1 6.2c.9 0 2-.6 2.7-1.4.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-1 2.8zM15 12.8c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9s-1.9-.9-3.1-.9c-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.6-.8 3.1-.8s1.9.8 3.1.8c1.3 0 2.1-1.2 2.9-2.3 1-1.4 1.3-2.7 1.4-2.7 0 0-2.7-1-2.7-3.8z" />
    </svg>);

}
function YouTubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
    </svg>);

}

Object.assign(window, {
  Nav, Hero, GuestStrip, WhatThisIs, PullQuote,
  Episodes, FaqSection, Listen, About, Footer
});