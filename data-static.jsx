/* global React */
/* Hand-curated content for the FiM homepage.
   This file is NEVER touched by scripts/sync.js — edit it directly.
   Loads BEFORE data.jsx so generated EPISODES/ARCHIVE/PLATFORMS overlay these. */

// Pull quotes — rotate these as new standout moments come up
const QUOTES = [
  {
    text: "You can vibe code your ideas. You can vibe code products. But you cannot vibe code customers.",
    attr: "Shakeel Lala, Founder of Marloo",
    sub: "$10M raised · live across 6 countries",
  },
  {
    text: "Today's dating apps have been designed and tweaked and redesigned to keep you single. They're perversely incentivised to keep people hopeful enough but unsatisfied so they're more likely to upgrade to a paying tier.",
    attr: "Celeste Amadon, Founder of Known",
    sub: "pre-seed raised in 8 days · seed raised in 4 days · 12+ term sheets",
  },
  {
    text: "The biggest thing that kills startups is not running out of money. It's easy to get money. It's hard to stay motivated.",
    attr: "Robert Huynh, Founder of Nook",
    sub: "50,000 users · $20M valuation",
  },
  {
    text: "Strongroom dies. I'm going down with the ship.",
    attr: "Joe Zhou, Founder of Strongroom AI",
    sub: "acquired the company out of administration",
  },
];

const STATS = [
  { value: "300K+", label: "Monthly reach" },
  { value: "$120M", label: "Largest raise in the archive" },
  { value: "$1B+", label: "Combined valuation of guest companies" },
  { value: "Live", label: "Spotify · Apple · YouTube" },
];

const FEATURES = [
  { icon: "🧭", title: "Customer Discovery", body: "How the best founders find and validate their first customers and why most skip the most important step." },
  { icon: "🔄", title: "Pivots & Rebuilds", body: "Co-founder exits, regulatory collapses, models rebuilt from scratch, the moments nobody posts about." },
  { icon: "🌏", title: "APAC + Global Founders", body: "Founders from Australia, Southeast Asia, and beyond building companies the world hasn't caught up to yet." },
];

Object.assign(window, { QUOTES, STATS, FEATURES });
