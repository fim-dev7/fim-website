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
    a: "Pre-seed investors are betting on the founder and the thesis, not the product. Shakeel Lala raised backing from one of Australia's largest VCs with no business idea at all — on the promise he'd spend a year finding something worth building. Celeste Amadon raised her pre-seed in 8 days at age 21 before Known had meaningful traction. Nate Spiteri contacted nearly 1,000 investors before closing his pre-seed for Shopfront. The people who raise without a product have almost always done the most work before asking — deep customer understanding, specific market insight, and a clear view of why now.",
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
  {
    q: "How do founders write a cold email to investors that actually gets a response?",
    a: "Specific, short, and proof-led. Nate Spiteri from Shopfront wrote nearly 1,000 cold investor emails — and the ones that converted led with traction or a sharp insight in the first two lines, not with the company story. Subject lines mattered more than body length. Avoid template language. Investors read for signal; vague \"we're building the X for Y\" gets archived. Concrete numbers, a specific ask, and a clear introduction path are the three things that move a cold email up the queue.",
  },
  {
    q: "What does product-market fit really look like for an early-stage startup?",
    a: "Pull, not push. Jevon Le Roux from Keeyu knew he had it when a customer said \"I just wouldn't come to work tomorrow\" if Keeyu disappeared. Shakeel Lala from Marloo knew it when advisors tried to buy a vibe-coded demo at a conference — before any product existed. The marker is unsolicited demand: people referring you without being asked, customers calling about features you haven't built, churn that won't happen at any price. If you're still pushing — outbound, paid ads, founder-led sales as the only growth lever — you don't have it yet.",
  },
  {
    q: "How do I split equity with a co-founder?",
    a: "The standard advice — even splits unless someone has materially more skin in the game — holds up across the FiM archive. Lopsided splits create resentment when the workload inevitably equalises. The split matters less than the conversation: founders who survive co-founder transitions (Floriye Elmazi rebuilt Sisterwould alone after her co-founder left) had a vesting structure that handled the exit cleanly. Always use 4-year vesting with a 1-year cliff. Document the split before incorporating, not after.",
  },
  {
    q: "When should you incorporate your startup?",
    a: "Before you take any money, sign any customer contracts, or have a co-founder put in real work. Incorporation is cheap (Stripe Atlas, ~$500) and protects you when things get real. Common mistake: bootstrapping for months as a sole prop and incorporating later, then having to messily restructure equity. The founders in the FiM archive who raised quickly had their corporate structure clean and ready when investors started doing diligence.",
  },
  {
    q: "How long does fundraising take for a pre-seed or seed round?",
    a: "Wildly variable. Celeste Amadon closed a pre-seed in 8 days and a seed in 4 — but she'd spent two years on the VC side first. Nam Nguyen took years across four YC rejections before closing $4M in 48 hours. Nate Spiteri contacted nearly 1,000 investors before his pre-seed closed. The pattern: founders who closed fast had pre-built credibility — operator background, prior raises, VC network, or undeniable traction. Without those, expect 3-6 months minimum.",
  },
  {
    q: "What is a SAFE and should I use one for my pre-seed?",
    a: "SAFE = Simple Agreement for Future Equity. It's a convertible instrument — investor gives you money now, gets equity in your next priced round. Y Combinator's standard, increasingly the norm for pre-seed and seed in the US, UK, and Australia. Pros: fast, cheap, no negotiation on valuation. Cons: stacking many SAFEs without tracking dilution can leave founders shocked at their cap table. Most FiM founders raising under $2M used SAFEs; larger rounds tend to priced equity.",
  },
  {
    q: "How do I evaluate a co-founder before going all in?",
    a: "The founders in the FiM archive who survived co-founder challenges shared three traits: they'd worked together meaningfully before founding (not just been friends), they'd disagreed on something hard and resolved it well, and they had explicit alignment on the stakes. Kiki and Elan from Sourmilk left finance careers simultaneously — that synchronicity made the partnership functional. If you haven't built something tough together, do that first. Six months of side-project collaboration tells you more than any reference check.",
  },
  {
    q: "How do founders handle investor rejection?",
    a: "Most rejections aren't about you. Nam Nguyen got four YC rejections — the fifth application succeeded because the team had grown, not because YC changed its mind. Robert Huynh's Nook shut down at $20M valuation and 50K users; he kept building. The founders who get traction reframe rejection as data: which part of the pitch broke down, which investor type wasn't a fit, what evidence would've changed the answer. Keep a CRM of every conversation. Reject the rejection's narrative, not the feedback.",
  },
  {
    q: "What's a fair pre-seed valuation in 2026?",
    a: "Highly dependent on geography, traction, and round size. US pre-seed for software ranges roughly $5M-$15M post-money. APAC and Australia trend lower — $3M-$8M is common. Specific traction (paying customers, signed LOIs, technical moat) pushes higher. The FiM archive shows wide ranges: Celeste Amadon's Known got fully-priced US consumer-tech valuations; Australian fintech rounds tend to land lower. Don't fixate on valuation — fixate on dilution and the quality of investors on the cap table.",
  },
  {
    q: "How do I find my first 10 customers?",
    a: "Direct outbound to people you've already talked to in customer discovery. Shakeel Lala's first Marloo customers came from the 800 advisors he'd interviewed. Nam Nguyen's first big customer came from a cold LinkedIn comment on a director's frustrated post — he then ran a 6-month daily-check-in proving period. Talk to people, build for one, ship overnight, repeat. Convert discovery conversations into beta users into paying customers — in that order.",
  },
  {
    q: "How do I write a startup landing page that converts?",
    a: "Lead with the problem, then the proof. Most early-stage landing pages lead with what the product does — they should lead with what's painful and unsolved. Use customer language (steal phrases from your discovery interviews verbatim). Add specific proof — a number, a logo, a quote — above the fold. Then make one ask: book a call, start a free trial, join the waitlist. One CTA. The founders in the FiM archive who closed early customers had landing pages that read like answers to a specific question, not like brochures.",
  },
  {
    q: "What does YC actually look for in a pre-seed application?",
    a: "Speed of execution, evidence of customer love, and a clean answer to \"why this, why now, why you.\" Nam Nguyen applied to YC four times — the fifth succeeded because the team had real customers in production, conviction tested by six months in Poland, and a billion-dollar frame for why their problem space mattered. YC's bar isn't \"is this idea promising?\" — it's \"would I bet on this team to figure it out?\" Application essays should be short, specific, and showcase the team's reflexes more than the deck.",
  },
  {
    q: "How do I pivot without losing my team or investors?",
    a: "Be transparent early. Hamish McKay from Order Editing spent 6 months with zero revenue before repositioning — the pivot worked because he communicated the discovery loop and the new thesis clearly. Robert Huynh pivoted from Nook to Reforge Labs after Nook shut down. The investors who stayed wanted to see: did the team learn the right things, is the new thesis sharper, and is the cap table workable. Don't pivot in secret. Don't pivot to escape something — pivot toward a thing you can defend.",
  },
  {
    q: "How do I hire my first engineer at a startup?",
    a: "Equity-heavy compensation. Strong opinions, weakly held. The right first engineer is closer to a co-founder than an employee. Look for builders with prior shipping experience, a clear point of view on the stack, and willingness to do work outside their JD. Don't hire from your network of friends — hire from your network of people who've shipped. Trial period of 1-2 weeks paid is standard. The founders in the FiM archive who built fast had a first engineer who could ship full features alone within two weeks of joining.",
  },
  {
    q: "How do founders avoid burning out in the first two years?",
    a: "Ben Wood from WipWrk described it precisely: \"The hardest challenge is maintaining mental balance — those emotional fluctuations of yes, you succeeded, or no, that didn't work, and bringing yourself back to stable every day.\" The founders who lasted shared three things: a non-negotiable weekly anchor (gym, partner, parents), a small group of other founders they were honest with, and a clear separation between \"the company is struggling\" and \"I'm struggling.\" If you're at \"I am the company,\" you're already in trouble.",
  },
  {
    q: "What's the difference between pre-seed, seed, and Series A funding?",
    a: "Pre-seed: betting on the founder and idea, typically $250K-$2M, often SAFE, no product needed. Seed: betting on early traction signals, typically $1M-$5M, can be SAFE or priced, usually has a product and early customers. Series A: betting on a repeatable business, typically $5M-$15M, priced equity with board seats, requires demonstrable PMF and clear unit economics. The FiM archive includes founders at every stage — Shakeel's $10M is roughly a Series A despite the label, Celeste's seed was at Series A scale, and many \"seed\" rounds in APAC look like US pre-seeds.",
  },
  {
    q: "Should I bootstrap or raise venture capital?",
    a: "Depends on the market and the founder. Stephen Turban built Lumiere Education to 8-figure ARR from Ho Chi Minh City without VC. Andy Miller from Heaps Normal mixed angel + venture money to build a $50M+ brand. Venture is the right path when the market is large, the timing is now-or-never, and the company can't reach the prize without capital. Bootstrap when you have a real path to revenue, the market rewards margin over scale, or the constraint is talent rather than capital. Don't take venture because it feels like the default.",
  },
  {
    q: "How do I evaluate a startup idea before quitting my job?",
    a: "Validate the problem first, the solution second, the business model third. Don't build anything until you've talked to 30-50 people who have the problem and described it back to you in their words. Selina Li from gymii.ai surveyed 400+ people before building. Look for evidence the problem is urgent (people have built workarounds), frequent (they hit it weekly), and expensive (in time, money, or stress). Then validate that someone will pay for a solution — pre-orders, LOIs, or a paid pilot — before quitting.",
  },
  {
    q: "What does customer discovery look like in practice?",
    a: "Conversations, not surveys. Embedded time inside the customer's world, not pitch decks. Shakeel Lala spent days inside financial advice firms — sitting with management, compliance, support, and advisors — before pitching anything. Satya Tumati at Socratix AI spent months in risk teams at financial institutions before writing product code. The format that works: 30-60 minute open-ended conversations, ask about their last week (not their hypothetical future), record everything, look for the language they actually use. Stop running discovery when you can describe the problem in their words better than they can.",
  },
];

const STATS = [
  { value: "300K+", label: "Monthly reach (mainly LinkedIn)" },
  { value: "$120M", label: "Largest raise in the archive" },
  { value: "$1B+", label: "Combined valuation of guest companies" },
  { value: "Live", label: "Spotify · Apple · YouTube" },
];

const FEATURES = [
  { icon: "🧭", title: "Customer Discovery", body: "How the best founders find and validate their first customers and why most skip the most important step." },
  { icon: "🔄", title: "Pivots & Rebuilds", body: "Co-founder exits, regulatory collapses, models rebuilt from scratch, the moments nobody posts about." },
  { icon: "🌏", title: "APAC + Global Founders", body: "Founders from Australia, Southeast Asia, and beyond building companies the world hasn't caught up to yet." },
];

Object.assign(window, { QUOTES, FAQ, STATS, FEATURES, FILTERS });
