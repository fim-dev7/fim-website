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
          <img className="brand-logo" src="assets/logo-white.png" alt="Founders In Motion" />
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
        <span className="pill"><span className="dot"></span>New episodes weekly</span>
        <h1>Before the <em>headline.</em></h1>
        <p className="hero-sub">
          Founders In Motion is where the top 1% of early-stage founders around the world, across Australia, Southeast Asia, and the US, share how they're building their business, what's working, what's not. Hosted by <b>Thea Ngo</b>, an early-stage investor and startup nerd.<br /><br />Think pivots, chaos, scandals and how to get through it.<br />
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
        <div className="stats">
          {STATS.map((s) =>
          <div className="stat" key={s.label}>
              <div className="v">{s.value}</div>
              <div className="l">{s.label}</div>
            </div>
          )}
        </div>
      </div>
    </header>);

}

// ─── Guest strip ─────────────────────────────────────────
function GuestStrip() {
  return (
    <div className="guest-strip-wrap">
      <img className="guest-band" src="assets/guests-strip.png" alt="A selection of past guests of Founders In Motion" />
      <div className="guest-meta">
        <span className="label">28 founders</span>
        <span>Early-stage building across continents</span>
      </div>
    </div>);

}

// ─── Ask a question (NotebookLM-style synthesis via /api/ask) ─────────────
// User asks. We POST to /api/ask. The Edge function pulls top transcript
// chunks from Algolia, sends them to Claude with a synthesis prompt, and
// streams back a markdown answer with inline [N] citations to source episodes.

const SUGGESTED_QUESTIONS = [
  "How do I find product-market fit?",
  "How do I raise pre-seed without a product?",
  "When should I quit my job to start a company?",
  "How do I do customer discovery?",
  "What does the messy middle feel like?",
  "How do I write a cold email to investors?",
];

const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ESC_MAP[c]); }

/**
 * Tiny markdown renderer for the Claude-generated answer.
 * Supports: **bold**, *italic*, [N] citations, line breaks, bullet lists.
 * Citations get rewritten as <a class="cite"> linking to the cited source.
 */
function renderAnswerMarkdown(md, sources) {
  if (!md) return "";
  // Pre-escape HTML — only our own tags should appear in the output
  let out = escapeHtml(md);
  // **bold**
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  // *italic* (but not part of **)
  out = out.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
  // Bulleted list lines starting with "- " → wrap in <ul><li>
  // Detect contiguous bullet groups and wrap
  out = out.replace(/((?:^|\n)(?:- [^\n]+\n?)+)/g, (block) => {
    const items = block.trim().split("\n").map((l) => l.replace(/^- /, "").trim()).filter(Boolean);
    return "\n<ul>" + items.map((i) => `<li>${i}</li>`).join("") + "</ul>\n";
  });
  // Citations [N] → anchor
  out = out.replace(/\[(\d{1,2})\]/g, (m, n) => {
    const i = parseInt(n, 10) - 1;
    const src = sources && sources[i];
    if (!src) return m;
    const href = src.has_episode_page ? `episodes/${src.slug}/` : (src.spotify_url || "#");
    const tip = `${src.guest_name}${src.guest_company ? ", " + src.guest_company : ""} — Ep ${src.episode_number}`;
    return `<a class="cite" href="${href}" title="${escapeHtml(tip)}">[${n}]</a>`;
  });
  // Paragraph breaks: split on \n\n, wrap each
  const blocks = out.split(/\n\n+/).map((p) => {
    const trimmed = p.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<ul>") || trimmed.startsWith("<ol>")) return trimmed;
    return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
  });
  return blocks.filter(Boolean).join("\n");
}

/**
 * POST /api/ask and consume the SSE stream.
 * Calls onSources(sources) once early, then onDelta(text) for each text chunk,
 * then onDone() at the end (or onError on failure).
 */
async function streamAsk(query, { onSources, onDelta, onDone, onError, signal }) {
  let res;
  try {
    res = await fetch("/api/ask/", {  // trailing slash to bypass vercel.json trailingSlash redirect
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") return;
    onError && onError(err.message || "Network error");
    return;
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    onError && onError(msg);
    return;
  }
  const ct = res.headers.get("content-type") || "";
  // Non-streaming fallback (e.g. empty-result case) returns JSON.
  if (ct.includes("application/json")) {
    const j = await res.json();
    if (j.sources && onSources) onSources(j.sources);
    if (j.answer && onDelta) onDelta(j.answer);
    onDone && onDone();
    return;
  }
  // SSE parsing
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\n\n/);
    buffer = events.pop() || "";
    for (const evt of events) {
      let eventName = "message";
      let dataLine = "";
      for (const line of evt.split("\n")) {
        if (line.startsWith("event: ")) eventName = line.slice(7).trim();
        else if (line.startsWith("data: ")) dataLine = line.slice(6);
      }
      if (!dataLine) continue;
      if (eventName === "done") { onDone && onDone(); return; }
      if (eventName === "error") {
        try { const j = JSON.parse(dataLine); onError && onError(j.error || "Stream error"); } catch { onError && onError("Stream error"); }
        return;
      }
      try {
        const obj = JSON.parse(dataLine);
        if (eventName === "sources" && obj.sources) {
          onSources && onSources(obj.sources);
        } else if (obj.t) {
          onDelta && onDelta(obj.t);
        }
      } catch {
        // ignore malformed event
      }
    }
  }
  onDone && onDone();
}

function AskBox() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [sources, setSources] = useState([]);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | retrieving | synthesizing | done | error
  const [error, setError] = useState(null);

  // Trigger a synthesis run for `submitted`. Aborts a previous in-flight one.
  useEffect(() => {
    if (!submitted) {
      setSources([]); setAnswer(""); setPhase("idle"); setError(null);
      return;
    }
    const controller = new AbortController();
    setSources([]); setAnswer(""); setError(null);
    setPhase("retrieving");
    let gotFirstDelta = false;
    streamAsk(submitted, {
      onSources: (s) => { setSources(s); setPhase("synthesizing"); },
      onDelta:   (t) => { if (!gotFirstDelta) { gotFirstDelta = true; setPhase("synthesizing"); } setAnswer((a) => a + t); },
      onDone:    () => setPhase("done"),
      onError:   (msg) => { setError(msg); setPhase("error"); },
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [submitted]);

  // Reflect ?q= in URL hash on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const q = params.get("q");
    if (q) { setQuery(q); setSubmitted(q); }
  }, []);

  function handleSubmit(e) {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSubmitted(q);
    try { window.history.replaceState(null, "", `#ask?q=${encodeURIComponent(q)}`); } catch {}
  }

  function clearAll() {
    setQuery(""); setSubmitted(""); setAnswer(""); setSources([]); setError(null); setPhase("idle");
    try { window.history.replaceState(null, "", "#ask"); } catch {}
  }

  function chooseSuggestion(s) { setQuery(s); setSubmitted(s); }

  const answerHtml = renderAnswerMarkdown(answer, sources);
  const showSpinner = phase === "retrieving" || phase === "synthesizing";

  return (
    <section className="panel ask" id="ask">
      <div className="container">
        <div className="section-head">
          <div className="kicker">Ask the archive</div>
          <h2>Get a real answer, drawn from real founders.</h2>
          <p>Every transcript across 28 episodes is searchable. Type any founder question and an answer gets synthesized from the moments founders actually said it — with citations.</p>
        </div>

        <div className="ask-wrap">
          <form className="ask-input-row" onSubmit={handleSubmit}>
            <svg className="ask-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input
              type="search"
              className="ask-input"
              placeholder="How do I raise a pre-seed round without a product?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck="false"
              aria-label="Ask a founder question"
            />
            {query && (<button type="button" className="ask-clear" onClick={clearAll} aria-label="Clear">×</button>)}
            <button type="submit" className="ask-submit" disabled={!query.trim() || showSpinner}>
              {showSpinner ? "…" : "Ask"}
            </button>
          </form>

          {!submitted && !query && (
            <div className="ask-suggestions">
              <span className="ask-suggestions-label">Try:</span>
              {SUGGESTED_QUESTIONS.map((s) => (
                <button key={s} className="ask-chip" onClick={() => chooseSuggestion(s)}>{s}</button>
              ))}
            </div>
          )}

          {phase === "retrieving" && (
            <div className="ask-status"><span className="ask-spin" aria-hidden></span> Pulling relevant transcripts…</div>
          )}
          {phase === "synthesizing" && !answer && (
            <div className="ask-status"><span className="ask-spin" aria-hidden></span> Synthesizing answer from {sources.length || "the"} episodes…</div>
          )}
          {error && <div className="ask-status ask-error">⚠ {error}</div>}

          {(answer || phase === "done") && (
            <article className="ask-answer">
              <div className="ask-answer-body" dangerouslySetInnerHTML={{ __html: answerHtml }} />
              {phase !== "done" && answer && <span className="ask-cursor" aria-hidden></span>}
            </article>
          )}

          {sources.length > 0 && phase !== "retrieving" && (
            <section className="ask-sources">
              <h4>Sources</h4>
              <div className="ask-sources-grid">
                {sources.map((s) => <AskSource key={s.n} source={s} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

function AskSource({ source }) {
  const href = source.has_episode_page ? `episodes/${source.slug}/` : (source.spotify_url || "#");
  return (
    <a className="ask-source" href={href} target={source.has_episode_page ? "_self" : "_blank"} rel="noreferrer">
      <div className="ask-source-n">[{source.n}]</div>
      <div className="ask-source-body">
        <div className="ask-source-guest"><b>EP {source.episode_number} · {source.guest_name}</b> · <i>{source.guest_company}</i></div>
        <div className="ask-source-title">{source.title}</div>
      </div>
      <div className="ask-source-arrow" aria-hidden>↗</div>
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
function PullQuote({ quote }) {
  return (
    <section className="quote-section">
      <div className="container">
        <blockquote className="quote">
          <q>{quote.text}</q>
          <div className="attr">
            <span><b>{quote.attr}</b> · {quote.sub}</span>
          </div>
        </blockquote>
      </div>
    </section>);

}

// ─── Episodes ─────────────────────────────────────────
function Episodes() {
  const [data, setData] = useState({ episodes: EPISODES, _meta: null });

  useEffect(() => {
    let cancel = false;
    fetch("episodes.json").
    then((r) => r.ok ? r.json() : Promise.reject(r)).
    then((j) => {if (!cancel) setData({ episodes: j.episodes || EPISODES, _meta: j._meta || null });}).
    catch(() => {});
    return () => {cancel = true;};
  }, []);

  return (
    <section className="panel" id="episodes">
      <div className="container">
        <div className="eps-header">
          <div>
            <div className="label">Recent Episodes</div>
            <h2 className="h2" style={{ marginTop: 16 }}>Start here.</h2>
          </div>
          <a href="episodes/" className="btn btn-secondary">
            Browse all episodes <span>→</span>
          </a>
        </div>
        <div className="eps-grid">
          {data.episodes.slice(0, 3).map((ep) =>
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
      <div className="epc-tag">Ep {ep.n} · {ep.tags.join(" · ")}</div>
      <h3 className="epc-title">{ep.title}</h3>
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
              The founding journey raises questions that most content skips. Here's what 28 episodes with early-stage founders actually taught us.
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
          <div className="thea-avatar">TN</div>
          <div>
            <h2 className="h2">Thea Ngo</h2>
            <div className="role-tag">Early-stage investor &amp; professional question-asker</div>
            <p>Hi, I'm Thea. I invest in early-stage founders for a living, which mostly means I spend my days asking nosy questions, and trying to figure out which weird ideas are about to become inevitable.

            </p>
            <p>Founders In Motion is the show I started because the LinkedIn highlight reel was driving me a little crazy. Nobody talks about the year of nothing, the co-founder breakup, the term sheet you walked away from, the customer who said "I'd quit my job before I gave this up." I was so curious of the messy middle, so I went and got it.

            </p>
            <p>28 episodes deep, I've talked to founders building non-alcoholic beer ($50M+ valued), AI robotics ($120M raised), YC companies, chili oil empires (150 stores, Gordon Ramsay's seal of approval), and the next frontier dating apps (seed closed in 4 days). The only thing they have in common: they were still in the thick of it when we hit record.

            </p>
            <p>{"Things I'm into: cold founder DMs, niche verticals, anyone building the next big thing. If you're early and a little obsessed, I'd love to meet you. I'm best found on LinkedIn these days!!\n\nAND THANK YOU FOR WATCHING <3\n"}

            </p>
            <div className="socials">
              <a className="social" href="https://www.linkedin.com/in/theango/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
              <a className="social" href="https://www.instagram.com/foundersinmotion/" target="_blank" rel="noreferrer">Instagram ↗</a>
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
            <a href="https://www.instagram.com/foundersinmotion/">Instagram</a>
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