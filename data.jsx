/* global React */
/* This file is OVERWRITTEN by scripts/sync.js on every sync.
   Hand-curated content (FAQ, QUOTES, STATS, FEATURES, FILTERS) lives in data-static.jsx.
   This bootstrap version was committed so the site renders before the first sync runs.
*/

const EPISODES = [
  {
    n: "28",
    title: "He Raised Backing Before He Had a Business Idea",
    guest: "Shakeel Lala",
    company: "Marloo",
    role: "Founder, Marloo",
    tags: ["Fintech AI", "Customer Discovery", "Pre-Seed"],
    primaryTag: "Fintech AI",
    desc: "Shakeel quit his job, convinced Australia's largest VC to back him with no business idea, ran 800 conversations with financial advisors over 9 months, then vibe-coded a demo the week before Australia's biggest financial advice conference. People tried to buy it on the spot. Marloo has since raised $10M and is live across 6 countries.",
    url: "episodes/28-shakeel-lala/",
    dur: "1:08:42",
    date: "May 14, 2026",
    featured: true,
  },
  {
    n: "26",
    title: "Today's Dating Apps Are Designed to Keep You Single",
    guest: "Celeste Amadon",
    company: "Known",
    role: "Founder, Known",
    tags: ["Consumer Tech", "Female Founder", "Fundraising"],
    primaryTag: "Consumer Tech",
    desc: "Celeste was 21 when she walked into Forerunner Ventures. She raised her pre-seed in 8 days, her seed in 4 days, and fielded 12+ term sheets. Known has set up 1,500 curated dates in beta and hundreds of couples are now in relationships. Her thesis: today's apps are perversely incentivised to keep you single and paying.",
    url: "episodes/26-celeste-amadon/",
    dur: "1:02:14",
    date: "Apr 30, 2026",
  },
  {
    n: "25",
    title: "They Applied to YC 4 Times. Then Raised $4M in 48 Hours.",
    guest: "Nam Nguyen",
    company: "TruthSystems",
    role: "Co-founder, TruthSystems",
    tags: ["AI", "Legal Tech", "YC"],
    primaryTag: "AI",
    desc: "Nam's co-founder was 19 years old. Law firms told them \"come back in 5 years.\" They applied to YC four times. When they finally got in, their $4M round filled in 48 hours. TruthSystems is now the AI governance layer sitting inside law firms in real time.",
    url: "episodes/25-nam-nguyen/",
    dur: "58:21",
    date: "Apr 16, 2026",
  },
];

const FEATURED = EPISODES[0];

const ARCHIVE = [
  { guest: "Kiki & Elan", company: "Sourmilk" },
  { guest: "Nhi Nguyen", company: "MaiMoney" },
  { guest: "Ben Wood", company: "WipWrk" },
  { guest: "Robert Huynh", company: "Reforge Labs" },
  { guest: "Brian Pham", company: "LiteCard" },
  { guest: "Flo Elmazi", company: "Sisterwould" },
  { guest: "Hung Bui", company: "AIducation" },
  { guest: "Vivek & John", company: "Affil.ai (YC S24)" },
  { guest: "Jason Ma", company: "Dyna Robotics" },
  { guest: "Hamish McKay", company: "OrderEditing" },
  { guest: "Satya Tumati", company: "Socratix AI (YC S25)" },
  { guest: "Joe Zhou", company: "Strongroom AI" },
  { guest: "Alessia & Illya", company: "VibeFlow (YC S25)" },
  { guest: "Andy Miller", company: "Heaps Normal", url: "episodes/20-andy-miller/" },
  { guest: "Ethan Yong", company: "Umami Papi" },
  { guest: "Jevon Le Roux", company: "Keeyu" },
  { guest: "Stephen Turban", company: "Lumiere Education" },
  { guest: "Finnlay Morcombe", company: "Fluency" },
  { guest: "Nathan Yun", company: "Paire" },
  { guest: "Celeste Amadon", company: "Known", url: "episodes/26-celeste-amadon/" },
  { guest: "Shakeel Lala", company: "Marloo", url: "episodes/28-shakeel-lala/" },
  { guest: "Nam Nguyen", company: "TruthSystems (YC S25)", url: "episodes/25-nam-nguyen/" },
];

const PLATFORMS = [
  { name: "Spotify", short: "SP", url: "https://open.spotify.com/show/0ZwlHrWLbX6ajZo2hsVVdl", color: "#1DB954" },
  { name: "Apple Podcasts", short: "AP", url: "https://podcasts.apple.com/us/podcast/founders-in-motion/id1810228671", color: "#FC3C44" },
  { name: "YouTube", short: "YT", url: "#", color: "#FF0000" },
  { name: "Instagram", short: "IG", url: "https://www.instagram.com/foundersinmotion/", color: "#D4A87D" },
];

Object.assign(window, { EPISODES, FEATURED, ARCHIVE, PLATFORMS });
