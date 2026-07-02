/**
 * Topic hub configuration — each hub is a question-shaped page that answers
 * a founder query by drawing from multiple episodes in the archive.
 *
 * To add a new hub: append a new object below. Sync regenerates pages.
 *
 * featuredEpisodeNumbers should be in display order (most relevant first).
 * Each hub gets:
 *   - /topics/<slug>/index.html
 *   - WebPage + ItemList + FAQPage + BreadcrumbList JSON-LD
 *   - Inclusion in sitemap.xml and llms.txt
 */

export const TOPICS = [
  {
    slug: 'customer-discovery',
    question: 'How do early-stage founders find their first customers?',
    intro: `Customer discovery is the unsexy work most founders skip — and the single biggest predictor of which early-stage companies survive. It's the process of confirming whether a problem is real, urgent, and worth building for, before writing a line of code. Across the Founders In Motion archive, the founders who closed customers fast had one thing in common: they did discovery as a contact sport, not a survey.`,
    summary: `What actually works: direct, unscripted conversations with people who have the problem. Embedded time inside the customer's world. Listening for the workarounds they've already built. Stopping when you can describe the pain in their language better than they can.`,
    keyAnswers: [
      {
        q: 'How many discovery conversations is enough?',
        a: 'No magic number, but the FiM archive suggests at least 50 before you build, and 200+ before you sell at scale. Shakeel Lala ran 800 conversations across nine months before Marloo had product-market fit. Satya Tumati at Socratix AI spent months embedded in risk teams. The metric that matters: can you describe the customer\'s problem in their words better than they can?',
      },
      {
        q: 'What\'s the right way to structure a customer discovery call?',
        a: 'Open-ended, customer-led. Ask about their last week (not their hypothetical future). Record everything. Look for the language they actually use. Avoid pitching your solution until you can describe the problem better than they can. The mistake most founders make: turning discovery into a sales call before they\'ve learned anything.',
      },
      {
        q: 'When do you stop doing customer discovery?',
        a: 'When the same answers keep coming back. When you can predict what the next 5 conversations will say. When you have evidence that customers are already paying real money for workarounds. Hamish McKay learned this directly with Order Editing — discovery told him Nike was using a manual workaround for the exact problem he was building for. That was the green light.',
      },
    ],
    featuredEpisodeNumbers: [27, 16, 24, 25, 2],
    seeAlso: ['pre-seed-fundraising', 'product-market-fit'],
  },
  {
    slug: 'pre-seed-fundraising',
    question: 'How do early-stage founders raise a pre-seed round?',
    intro: `Pre-seed investors are betting on the founder and the thesis, not the product. The Founders In Motion archive includes founders who closed in days and founders who took years — and the pattern that separates them isn't talent or category. It's how much customer work was done before the first investor meeting.`,
    summary: `Across the archive, the founders who raised quickly had three things: deep customer understanding from real conversations, a specific market insight that wasn't obvious to outsiders, and a clear point of view on why now. Founders who took longer either lacked one of those or were raising in a market that didn't fit venture economics.`,
    keyAnswers: [
      {
        q: 'How long does a pre-seed round take to close?',
        a: 'Wildly variable. Celeste Amadon closed pre-seed in 8 days and seed in 4 days — but she came from the VC side and had built her network there first. Nate Spiteri contacted nearly 1,000 investors before his Shopfront pre-seed closed. Without pre-built credibility, expect 3-6 months minimum.',
      },
      {
        q: 'Can you raise pre-seed with no product?',
        a: 'Yes. Shakeel Lala raised backing from one of Australia\'s largest VCs with no business idea at all — on the promise he\'d spend a year finding something worth building. Celeste Amadon raised her pre-seed before Known had meaningful traction. The bar isn\'t product, it\'s evidence the founder has done deep work and the thesis is defensible.',
      },
      {
        q: 'What pre-seed valuation should I expect in 2026?',
        a: 'Wildly geographic. US pre-seed for software ranges roughly $5M-$15M post-money. APAC and Australia trend lower — $3M-$8M is common. Specific traction (paying customers, signed LOIs, technical moat) pushes higher. Don\'t fixate on valuation — fixate on dilution and the quality of investors on the cap table.',
      },
      {
        q: 'Should I use a SAFE or a priced round?',
        a: 'SAFEs for speed and simplicity, priced rounds when the round is larger and the cap table needs structure. The FiM archive includes founders who raised on both. Watch for SAFE stacking — multiple SAFEs without tracking dilution can leave you shocked at your cap table later.',
      },
    ],
    featuredEpisodeNumbers: [27, 25, 24, 31, 23, 3],
    seeAlso: ['customer-discovery', 'product-market-fit'],
  },
  {
    slug: 'product-market-fit',
    question: 'How do I know when I\'ve found product-market fit?',
    intro: `Product-market fit is the moment demand stops needing to be manufactured. Across the Founders In Motion archive, the founders who found it describe the same signal from different angles: people trying to buy before the product is finished. The founders who missed it describe the same trap — traction metrics that masked a product nobody truly needed.`,
    summary: `The pattern across the archive: unsolicited demand is the only reliable signal. Shakeel Lala knew Marloo had it when advisors tried to buy a vibe-coded demo at a conference. Jevon Le Roux knew Keeyu's first version didn't when it turned out to be "a vitamin, not a painkiller." Validate demand before you build, ship before it feels ready, and treat growth metrics with suspicion until real money follows.`,
    keyAnswers: [
      {
        q: 'What does product-market fit actually look like?',
        a: 'Unsolicited demand. Shakeel Lala\'s marker was advisors trying to buy Marloo\'s vibe-coded demo at a Brisbane conference — before the product existed. If you need a full pitch to explain the value, you\'re not there yet; his half-sentence pitch test is the bar.',
      },
      {
        q: 'How do I validate an idea before building it?',
        a: 'Research demand first. Caroline Tran\'s hard-won rule after building products "no one\'s buying": ask who the customers are, whether there\'s real demand, and whether they\'ll pay — before building anything. John from Affil.ai puts the YC version simply: "sell before you build."',
      },
      {
        q: 'Can traction hide a broken business?',
        a: 'Yes. Robert Huynh\'s team at Nook felt like they were "actually moving" because users and revenue grew — but burn rate, hidden costs, and shrinking margins meant the underlying business "didn\'t make sense." Growth metrics are not fit.',
      },
      {
        q: 'What separates a painkiller from a vitamin?',
        a: 'Whether it solves the crux of the problem. Keeyu\'s first version could detect e-commerce order issues but users still had to fix them manually — "it was a vitamin for retailers, it wasn\'t a painkiller." Will Bodewes shut down his first startup, a patented speaker company, for the same reason: he\'d built "a nice to have."',
      },
    ],
    featuredEpisodeNumbers: [27, 29, 21, 7, 11],
    seeAlso: ['customer-discovery', 'pivots-and-rebuilds', 'pricing-your-product'],
  },
  {
    slug: 'cofounders',
    question: 'How do I find and choose a co-founder?',
    intro: `The co-founder decision compounds harder than almost any other early choice. The Founders In Motion archive includes founders who married high-school friendships to companies, founders who met their co-founder through structured matching programs, and solo founders who learned the cost of going alone the hard way.`,
    summary: `Three patterns from the archive: long trust beats fast chemistry (Celeste Amadon's co-founder was a friend of five years; Caroline Tran's was "the smartest guy in the room" from high school). Complementary skills beat similarity (Andy Miller: "I work on the brand, he brings the beer"). And structured matching works if you treat it seriously — EF put Elia in a room with 60 candidates in three days and "celebrates break-ups" so no one wastes time.`,
    keyAnswers: [
      {
        q: 'Should I be a solo founder or find a co-founder?',
        a: 'Selina Li built gymii.ai solo and is now "a big advocate of finding a co-founder." Going solo means total freedom — "you can really do whatever you want every day" — but it gets disorganized, and she "didn\'t realize... how lonely of a journey it is."',
      },
      {
        q: 'How do I evaluate a co-founder before going all in?',
        a: 'Time and trust. Celeste Amadon has known her co-founder since they were 18 — "he is my life partner... I can trust him to act on my behalf and he can trust me to act on his." Caroline Tran\'s version: "always keep in contact with your smart friends," because you never know when you\'ll build together.',
      },
      {
        q: 'What is co-founder matching actually like?',
        a: 'Elia from VibeFlow calls it "one of the most important processes in a startup." At Entrepreneur First in Paris he met around 60 people in three days, and the program "celebrates break-ups" so failed pairings don\'t drag on. YC\'s matching platform is "like a Tinder or Bumble" for founders.',
      },
      {
        q: 'How should co-founders divide roles?',
        a: 'By genuine comparative advantage. Andy Miller\'s split at Heaps Normal: "I work on the brand, he brings the beer" — his co-founder Benny is the professional brewer. The division works because neither pretends to do the other\'s job.',
      },
    ],
    featuredEpisodeNumbers: [25, 18, 2, 29, 19],
    seeAlso: ['founder-mental-health', 'yc-and-accelerators', 'pivots-and-rebuilds'],
  },
  {
    slug: 'pivots-and-rebuilds',
    question: 'When should a startup pivot — and how do you survive it?',
    intro: `Almost every episode in the Founders In Motion archive contains a pivot, a rebuild, or a shutdown. The founders who came out the other side share a trait: they read the warning signs early enough to act, and they treated the pivot as a commercial decision rather than an identity crisis.`,
    summary: `The warning signs are consistent across the archive: sign-ups without activity, growth without margins, a thesis that depends on something outside your control. The founders who survived — Caroline Tran pivoting Hello Clever to merchant payments, Hung Bui rebuilding after an empty platform — moved toward immediate revenue. The most common regret, in Robert Huynh's words: "not pivoting sooner."`,
    keyAnswers: [
      {
        q: 'What warning signs tell you it\'s time to pivot?',
        a: 'Hung Bui watched two tickers: users signed up but "there was basically no activities on the platform," and monthly actives were "too embarrassing to discuss." Robert Huynh\'s Nook had the opposite trap — growing users and revenue masking burn and shrinking margins. Both signals mean the same thing: patch-fixes won\'t save the model.',
      },
      {
        q: 'How do I pivot without losing my team or investors?',
        a: 'Pick the version of the pivot that makes money fastest. Hello Clever moved from a consumer financial app to merchant payments because consumer products were hard to fund in Australia — Caroline chose a product that could "immediately commercialize and start making revenue."',
      },
      {
        q: 'What\'s the biggest pivot regret founders report?',
        a: 'Waiting. Robert Huynh looks back fondly on Nook\'s impact and team, but: "My biggest regret was probably not pivoting sooner."',
      },
      {
        q: 'How do I tell my team and customers the startup is shutting down?',
        a: 'Robert Huynh\'s rule: acknowledge what happened, don\'t beat around the bush, don\'t sugarcoat — but offer a way forward. Telling the team and customers was far harder than telling investors, because employees "are making a career bet on you."',
      },
    ],
    featuredEpisodeNumbers: [29, 10, 7, 17, 21, 30],
    seeAlso: ['product-market-fit', 'founder-mental-health', 'customer-discovery'],
  },
  {
    slug: 'pricing-your-product',
    question: 'How do early-stage founders price their product?',
    intro: `Pricing is the decision founders revisit most and research least. The Founders In Motion archive covers pricing a SaaS product with no customers, pricing premium consumer goods against giants, pricing robots against labor costs, and defending an unfashionable pricing model against years of investor pressure.`,
    summary: `The archive's consensus: pricing is an experiment, not a formula. Hamish McKay repriced Order Editing every two months, walking it from $400 to $600 a month to find willingness to pay. Floriye Elmazi positioned Sisterwould premium first, then lowered the price as scale allowed. The deeper lesson from Josh Foreman at InDebted: when a pricing model reflects genuine customer value, defend it — his biggest regret is rebuilding it 15 times on investor feedback only to end up where he started.`,
    keyAnswers: [
      {
        q: 'How do I price with no customers yet?',
        a: 'Keep testing upward. Hamish McKay launched Order Editing "at like four hundred dollars a month," then asked "can we sell it at 500," found out they could, then 600 — changing pricing almost every two months to discover willingness to pay. Caroline Tran\'s variant: give the first customer a reasonable (not cheap) price, then let the market supply data points.',
      },
      {
        q: 'How should I price a premium consumer product?',
        a: 'Decide what you are first — FMCG, premium, or in-between — then check the margins sustain the business. Floriye Elmazi launched Sisterwould at $58 with a Sephora-level vision, and only reduced to $39 after two and a half years of scale. Andy Miller at Heaps Normal sometimes held or cut prices as they scaled, passing economies of scale to drinkers because accessibility was part of the brand.',
      },
      {
        q: 'How do you price against an existing cost, like labor?',
        a: 'Anchor to what you replace. Dyna Robotics rents robots at several grand a month rather than selling hardware — on par with or cheaper than typical US labor cost — because their restaurant customers are price-sensitive and low-margin.',
      },
    ],
    featuredEpisodeNumbers: [15, 9, 19, 14, 32],
    seeAlso: ['product-market-fit', 'consumer-and-retail', 'customer-discovery'],
  },
  {
    slug: 'yc-and-accelerators',
    question: 'Is YC or an accelerator worth it — and what do they actually look for?',
    intro: `The Founders In Motion archive includes YC S24 and S25 founders, an EF alumnus, an Antler graduate, and founders who applied to YC four times before getting in. Between them they answer the questions founders actually ask: what gets you in, what you really get out, and what to do if you don't get in.`,
    summary: `What YC looked for, per Nam Nguyen's fourth (successful) application: team conviction, real traction with customers trusting them in high-stakes situations, and a clear billion-dollar vision. What you get: the network, more than the badge — "the network is gonna grow with you," per VibeFlow's Elia. And Satya Tumati's reminder: they applied with no product, no website, not even a name. The worst that happens is a no.`,
    keyAnswers: [
      {
        q: 'What does YC actually look for?',
        a: 'Nam Nguyen applied four times. The fourth application had all three pieces: the conviction of the team, real traction with customers trusting them in high-stakes situations, and a clear billion-dollar vision. Satya Tumati\'s counterpoint: Socratix applied with just an idea — you don\'t need confidence, because the worst case is a rejection.',
      },
      {
        q: 'What do you actually get from YC — badge, network, or mentorship?',
        a: 'Both VibeFlow founders pick the network. Alessia: "everyone wants to help each other, so that\'s the biggest value." Elia: the "logo badge YC is crazy," but "the network is gonna grow with you and it\'s always gonna be relevant no matter the stage."',
      },
      {
        q: 'Is an accelerator worth it for a first-time founder?',
        a: 'Nate Spiteri\'s view: going alone could take 5 or 10 times longer. Accelerators like Antler have experts who see thousands of ideas a year and — being investors themselves — can quickly tell you whether your market is big enough.',
      },
      {
        q: 'What if I don\'t get in?',
        a: 'Recreate the two ingredients. Per Affil.ai\'s Vivek and John: take "sell before you build" to heart, and find a community of founders to grind around — "grinding with other people just gives you so much more motivation."',
      },
    ],
    featuredEpisodeNumbers: [24, 18, 16, 11, 3],
    seeAlso: ['pre-seed-fundraising', 'cofounders', 'customer-discovery'],
  },
  {
    slug: 'founder-mental-health',
    question: 'How do founders protect their mental health while building?',
    intro: `The messy middle takes a personal toll the highlight reels never show. Founders In Motion asks every guest about it directly — and the answers cover burnout, comparison, loneliness, missed years with family, and the emotional whiplash of being "punched in the gut every single day," as Nam Nguyen puts it.`,
    summary: `The archive's honest accounting: the costs are real — Finnlay Morcombe names time with family as his number one; Will Bodewes reckons he traded two years of friendships and travel. What keeps founders sane: naming the trade explicitly (Hamish McKay's "slam life hard for five years" frame), refusing the comparison game ("comparison is the thief of joy" — Will Bodewes), and, in Lauren Barker's case, simply logging off LinkedIn to stay in her own lane.`,
    keyAnswers: [
      {
        q: 'How do I stop comparing myself to faster-growing startups?',
        a: 'Will Bodewes felt the "we should be better, we should be bigger" pressure at Phonely and landed on "comparison is the thief of joy." Lauren Barker\'s harder-edged version: after her lowest day scrolling founder stories, "I\'m not gonna be on LinkedIn in an active way, because I know that for my mental health I need to just be like — what am I doing in my lane."',
      },
      {
        q: 'What does building a startup actually cost founders personally?',
        a: 'Finnlay Morcombe lists his skateboarding, mountain biking, and extended friend network — but "the number one cost" is time with family. Will Bodewes puts it as two years of hanging out with friends and traveling, justified because the path "gives me a lot of optionality" for the rest of his life.',
      },
      {
        q: 'Is work-life balance even possible in the early years?',
        a: 'Hamish McKay\'s answer is acceptance rather than balance: he reverse-engineered what founding by 25 required and framed it as "what if I just slam life hard for five years." Ben Wood names the real difficulty — the emotional fluctuations, plus 50–60 hours a week with your co-founder.',
      },
      {
        q: 'What does the low point actually feel like?',
        a: 'Nam Nguyen\'s hardest stretch was fundraising in a Polish winter, taking "a lot of nos back to back" against a parental deadline to go back to school. His summary of founder life: "you sign up to get punched in the gut every single day."',
      },
    ],
    featuredEpisodeNumbers: [28, 23, 15, 6, 24, 30],
    seeAlso: ['cofounders', 'pivots-and-rebuilds', 'building-in-public'],
  },
  {
    slug: 'apac-fundraising',
    question: 'How do founders raise and build from Australia and Asia-Pacific?',
    intro: `Most startup advice is written for San Francisco. The Founders In Motion archive is one of the few places where founders talk specifically about raising and building from Australia, Southeast Asia, and Europe — what transfers, what doesn't, and where the local edge actually is.`,
    summary: `The regional patterns from the archive: US capital is winnable from Australia with real traction and physical presence (Finnlay Morcombe raised from Accel without his Australian revenue being discounted). Australia doubles as a testing ground — per Brian Pham, US and UK companies release there first and it's a crowded market, so winning locally signals global strength. And the ecosystems differ structurally: Nhi Nguyen points out Vietnam has no equivalent of Australia's mandatory superannuation quietly building wealth in the background.`,
    keyAnswers: [
      {
        q: 'How do Australian founders raise from US investors?',
        a: 'Finnlay Morcombe names the two misconceptions Australians carry: that you can "just go to the valley" and raise a massive round, and the cognitive dissonance that it\'s both hard and possible at once. What worked for Fluency: actually moving to the US, real traction, thesis fit, and the leverage of "we have enough capital in the bank anyway."',
      },
      {
        q: 'Do US investors discount Australian revenue?',
        a: 'Finnlay had heard "they\'re going to discount it to zero" — but for Fluency it didn\'t happen: "No, not for us. Accel didn\'t anyway." His hypothesis: discounting hits vertical software harder than horizontal products.',
      },
      {
        q: 'Why is Australia a good startup testing ground?',
        a: 'Brian Pham\'s case: Australia "has been a release point for a lot of US and UK based companies" — Apple and Google Wallet features often come to Australia first after the US — and it\'s a crowded market, so winning there signals a strong chance globally.',
      },
      {
        q: 'Is building outside the US "hard mode"?',
        a: 'Elia from VibeFlow: "for me 100% agree with that." His two reasons: network — in San Francisco "you have to make zero effort to meet anyone you want" — and belief, the ambient sense that "you can do anything," which in Europe gives way to imposter syndrome.',
      },
    ],
    featuredEpisodeNumbers: [23, 8, 5, 18, 31],
    seeAlso: ['pre-seed-fundraising', 'yc-and-accelerators'],
  },
  {
    slug: 'building-in-public',
    question: 'Should founders build in public?',
    intro: `Building in public is the distribution strategy of choice for the archive's consumer and SaaS founders alike — and several of them are unusually honest about its costs. This hub collects both sides: why it works, and what it does to you.`,
    summary: `Why it works: Hamish McKay started posting on LinkedIn before he had a company, and calls building in public "100% the most viral way" Order Editing grew in year one. Kiki from Sourmilk grew to 10k followers on a personal quit-my-job story — people root "for somebody and not something." The costs: inflated perception of your progress, and what Kiki calls "a very real toll to putting yourself out there every single day."`,
    keyAnswers: [
      {
        q: 'Why build in public at all?',
        a: 'Demand before production. Sourmilk is perishable dairy on cold chain — they can\'t make product first and sell later, so building in public builds "a virtual line out the door" before the yogurt hits shelves. For Order Editing, building in public was "100% the most viral way to grow" in year one.',
      },
      {
        q: 'How do I build a founder audience on social media?',
        a: 'Post from the personal account, not the company\'s. Kiki grew her Instagram to 10k with "I quit my job in private equity to start a yogurt company" — conversion from views to followers "is all about a personal story and feeling like they\'re rooting for somebody and not something." Hamish McKay\'s compounding rule: every post should be incrementally better than the last; by your hundredth, you\'re writing top-1% content.',
      },
      {
        q: 'What\'s the downside of building in public?',
        a: 'Two, per Sourmilk: perception — people assume you\'re much further along and ask where to buy a product that isn\'t in stores yet — and the personal toll of daily exposure. Kiki had to reframe so missed views and follows stopped feeling personal. Lauren Barker went further and left LinkedIn entirely for her mental health.',
      },
    ],
    featuredEpisodeNumbers: [15, 4, 26, 30],
    seeAlso: ['consumer-and-retail', 'founder-mental-health', 'customer-discovery'],
  },
  {
    slug: 'consumer-and-retail',
    question: 'How do founders get a consumer product made, into retail, and scaled?',
    intro: `The archive's consumer founders cover the full physical-product gauntlet: finding a manufacturer, getting past pay-to-play grocery gatekeepers, scaling out of a garage, and building brand differentiation on a tight budget.`,
    summary: `The through-line: proximity wins. Nathan Yun's manufacturing advice is to work with makers directly and visit factories in person — "you need to do 99% of that work." Floriye Elmazi's retail advice is that "opportunity doesn't just come, you have to go and get that opportunity" — one retail win (Revolve) creates credibility for the next (Chemist Warehouse). Even Ethan Yong's Coles deal started with a conversation at a checkout — and jars he happened to carry in the car.`,
    keyAnswers: [
      {
        q: 'How do I find a manufacturer?',
        a: 'Nathan Yun (Paire): "work with the makers directly," skip middleman agencies, and physically visit factories in China, Vietnam, India, or Bangladesh. Alibaba and trade shows are starting points, but "you need to do 99% of that work" — it doesn\'t happen from home.',
      },
      {
        q: 'How hard is it to get into grocery stores and retailers?',
        a: 'Kiki and Elan are blunt: "it\'s hard" — hoops, pay-to-play models, big margin cuts, and systems "really built for these legacy brands." But breaking in can double revenue and put an independent brand on a legacy trajectory. Floriye\'s method: relentless outbound from day one — each win is credibility for the next.',
      },
      {
        q: 'How do I differentiate a consumer brand on a tight budget?',
        a: 'Nathan Yun went "down this very craftsmanship, technical, nerdy path to make the best socks in the world" while competitors chased fancy prints — "all the nerdy details, all the over-engineering, that was gonna be our point of difference."',
      },
      {
        q: 'When do I move production out of the garage?',
        a: 'When fulfillment eats the whole week. Ethan Yong hit the point where preparing, cooking, filling, labeling and packaging jars took Friday through Sunday just to meet orders — the signal he needed production at scale.',
      },
    ],
    featuredEpisodeNumbers: [26, 20, 4, 9],
    seeAlso: ['pricing-your-product', 'building-in-public', 'product-market-fit'],
  },
];
