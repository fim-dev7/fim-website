/* global React */
/* Hand-curated content for the FiM homepage.
   This file is NEVER touched by scripts/sync.js — edit it directly.
   Loads BEFORE data.jsx so generated EPISODES/ARCHIVE/PLATFORMS overlay these. */

const FILTERS = ["All", "Fundraising", "Customer Discovery", "AI", "Consumer Tech"];

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
];

// Founder Questions — the FAQ section drives the FAQPage JSON-LD on index.html.
// If you change anything here, also update the JSON-LD block at the top of index.html.
const FAQ = [
  {
    q: "What is the founding journey really like for early-stage founders?",
    a: "The founding journey is rarely the linear growth curve that gets shared on LinkedIn. Most early-stage founders experience a long, chaotic middle between their initial conviction and first real traction — co-founder changes, regulatory pivots, markets that move slower than expected, and extended periods of self-doubt. Founders In Motion documents what that middle actually looks like: the real decisions, the moments of doubt, and the mechanics behind companies that survive it. Guests include founders who rebuilt solo after a co-founder left, raised investor backing before having an idea, walked away from their only term sheet, bought a company out of administration, and built in markets nobody believed in yet.",
  },
  {
    q: "How do early-stage founders find their first customers?",
    a: "Direct, unscripted conversations — not surveys, not landing page signups. Shakeel Lala from Marloo ran 800 conversations with financial advisors before he built a single feature. Jevon Le Roux from Keeyu knew he'd found something real when a customer said \"I just wouldn't come to work tomorrow\" if Keeyu disappeared. Abby Huang from Dime learned it directly: \"I had to learn that when I got my first paying clients — that's when I've built something that people want.\" You're not looking for validation of your idea. You're looking for urgency you can't manufacture.",
  },
  {
    q: "When should you quit your job to start a company?",
    a: "The founders in the Founders In Motion archive who timed this well usually had one of two things before leaving: a problem validated as real through direct conversations, or a specific forcing function. Ethan Yong from Umami Papi got three consecutive \"needs improvement\" reviews and was pushed out of corporate accounting — that was his forcing function. Kiki and Elan from Sourmilk both left 4-year private equity and finance careers simultaneously to start a yogurt company. The pattern: they didn't wait for certainty. They left when staying felt more costly than going.",
  },
  {
    q: "What is customer discovery and how do early-stage founders actually do it?",
    a: "It's the process of confirming whether a problem is real, urgent, and worth building for — before writing a line of code. Vivek and John from Affil.ai (YC) sold before they built — John was manually doing the compliance checks himself at \"blitz breakneck speed\" to simulate the AI before any AI existed. Satya from Socratix AI spent months in deep customer discovery with risk teams at financial institutions before writing product code. The mistake most founders make: pitching during discovery instead of listening. You're looking for what people have already tried, how much it's costing them, and what's stopped them from fixing it.",
  },
  {
    q: "How do you raise a pre-seed round with no product?",
    a: "Pre-seed investors are betting on the founder and the thesis, not the product. Shakeel Lala raised backing from Australia's largest VC with no business idea at all — on the promise he'd spend a year finding something worth building. Celeste Amadon raised her pre-seed in 8 days at age 21 before Known had meaningful traction. Nate Spiteri contacted nearly 1,000 investors before closing his pre-seed for Shopfront. The people who raise without a product have almost always done the most work before asking — deep customer understanding, specific market insight, and a clear view of why now.",
  },
  {
    q: "What happens when your startup fails?",
    a: "Robert Huynh built Nook — a blue-collar job marketplace in Vietnam — to 50,000 users and a $20M valuation before it shut down. His lesson: \"The biggest thing that kills startups is not running out of money. It's easy to get money. It's hard to stay motivated.\" He pivoted to Reforge Labs. Joe Zhou acquired Strongroom AI out of administration following a fraud scandal — and when asked what he'd do if the company didn't survive, his answer was: \"Strongroom dies. I'm going down with the ship.\" Both founders are still building. The failure wasn't the end of the story.",
  },
  {
    q: "What does product-market fit actually feel like?",
    a: "Most founders who've found it describe demand they can't fully service. Shakeel Lala knew Marloo had something when people tried to buy a vibe-coded demo at a conference — before the product was real. Andy Miller knew Heaps Normal had found its market when millions of cans were selling and Robbie Williams asked to invest. Ethan Yong from Umami Papi knew when a chance encounter at a Gordon Ramsay filming got him into 150 Coles stores in the same year he started. It's pull, not push. The absence of unsolicited momentum — even when revenue is growing through outbound — is worth examining closely.",
  },
  {
    q: "How do founders deal with self-doubt and the messy middle?",
    a: "Ben Wood from WipWrk described it precisely: \"The hardest challenge is maintaining mental balance — those emotional fluctuations of yes, you succeeded, or no, that didn't work, and bringing yourself back to stable every day.\" Hung Bui from AIducation: \"Don't be ashamed of the product you're building. Just show them even if it's really bad right now.\" The ones who push through stay connected to the problem, not the scoreboard.",
  },
  {
    q: "How do you validate a startup idea before building it?",
    a: "Find people who have the problem and ask how they currently handle it. If they've built workarounds, hired people to manage it, or pay for partial solutions — that's signal. Selina Li from gymii.ai surveyed 400+ people before building, with 82% saying they wanted the social sharing feature — she used that to prioritise the MVP. Hamish McKay from OrderEditing spent 6 months with zero revenue before repositioning — the validation that mattered was learning that Nike was using a manual workaround to solve the exact problem he was building for. You want pain that is urgent, frequent, and expensive in time, money, or consequence.",
  },
  {
    q: "How do Gen Z founders raise their first round?",
    a: "The Gen Z founders in the Founders In Motion archive who raised fastest did the most customer work before approaching investors. Celeste Amadon closed a $10M seed round in 4 days and fielded 12+ term sheets — she was 21 years old. Nam Nguyen raised $4M in 48 hours after YC acceptance — his co-founder was 19. Jason Ma turned down offers from DeepMind, Nvidia, and Meta to build Dyna Robotics, then raised $120M. None had conventional paths. All had unusually deep conviction about the problem they were solving — and investors read that in the first conversation.",
  },
  {
    q: "How do APAC and international founders raise from global investors?",
    a: "The Founders In Motion archive spans Vietnam, Australia, Singapore, South Africa, India, Italy, and the US. The founders who've raised globally share one pattern: they didn't try to pitch their company as something it wasn't. Nhi Nguyen from MaiMoney raised in Vietnam building for Vietnamese retail investors — the edge was market depth no Western investor could replicate. Stephen Turban built Lumiere Education to an 8-figure run rate from Ho Chi Minh City serving 10,000 students across 105 countries — without relocating to Silicon Valley. The credibility comes from knowing the market better than anyone else in the room, not from proximity to Sand Hill Road.",
  },
  {
    q: "What should early-stage founders focus on before raising money?",
    a: "Get extremely clear on who your customer is and have evidence — not just a thesis. That evidence doesn't need to be revenue; it can be conversations, LOIs, waitlists, or a demo people tried to buy. Early-stage investors read for founder quality as much as market quality — so the prep that matters most sharpens your thinking about the problem, not the kind that polishes your deck. The founders who raise quickly are almost always the ones who've spent the most time with customers before their first investor meeting.",
  },
];

const STATS = [
  { value: "28+", label: "Episodes published" },
  { value: "$120M", label: "Largest raise in the archive" },
  { value: "$1B+", label: "Combined valuation of guest companies" },
  { value: "Live", label: "Spotify · Apple · YouTube" },
];

const FEATURES = [
  { icon: "🧭", title: "Customer Discovery", body: "How the best founders find and validate their first customers and why most skip the most important step." },
  { icon: "💸", title: "Pre-Seed Fundraising", body: "What moves a pre-seed check, how founders raise before they have a product, and what early-stage investors actually read for." },
  { icon: "🔄", title: "Pivots & Rebuilds", body: "Co-founder exits, regulatory collapses, models rebuilt from scratch, the moments nobody posts about." },
  { icon: "🌏", title: "APAC + Global Founders", body: "Founders from Australia, Southeast Asia, and beyond building companies the world hasn't caught up to yet." },
];

Object.assign(window, { QUOTES, FAQ, STATS, FEATURES, FILTERS });
