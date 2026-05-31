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
    featuredEpisodeNumbers: [27, 25, 24, 23, 3],
    seeAlso: ['customer-discovery', 'product-market-fit'],
  },
];
