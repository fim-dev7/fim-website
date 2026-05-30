# Q&A Pack — the CMS template

Copy this structure into a new Google Doc when "closing" an episode. Save the
Doc into the **FiM - Q&A Bank** Drive folder (ID stored in Settings sheet
under `qa_bank_folder_id`). Name the Doc:

    Ep XX - <Guest Name> - Q&A

Each H1 (`# ...`) is a question. Below the question:

- `slug:` — the URL slug for this question's canonical page (`/questions/<slug>/`).
  Multiple episodes can share a slug — they all aggregate on one page.
- `answer:` — a 1–2 sentence summary that displays on the question page
  with this episode's avatar.
- Long-form paragraphs (optional) below the metadata become the expanded
  answer on the question page and the FAQ entry on the episode page.

Aim for **10–15 questions per episode**: ~5–7 episode-native (unique to this
guest's story) + ~5–8 contributions to canonical questions.

---

## Example pack — Ep 27, Shakeel Lala (Marloo)

```
# How did Shakeel Lala raise venture capital before having a business idea?
slug: how-to-raise-pre-seed-without-product
answer: He convinced Australia's largest VC to back him and his co-founder Hardy on a single trust exercise — give us a year, we'll either come back with a product in market or come back honest about not finding one. They spent 9 months in "the void" before landing on Marloo.

Shakeel and Hardy had both come out of consulting and corporate strategy. They'd agreed on the principles of how they wanted to build long before they agreed on what to build. They pitched one of Australia's largest VCs on a trust exercise: a year of paid investigation, with the explicit option of returning empty-handed.

What they did with that year: built and discarded frameworks across vertical B2B AI SaaS, including home services and an SMB succession marketplace. The lesson Shakeel keeps coming back to is that frameworks don't find markets — 800 conversations with financial advisors did.

# What does Shakeel mean by "frameworks don't find markets"?
slug: frameworks-dont-find-markets
answer: The consulting reflex of building decision trees and ranked criteria to identify the "right" market sharpens thinking but doesn't surface real opportunity. Six months of frameworks produced no market. 800 advisor conversations produced Marloo.

Shakeel and Hardy started "the void" — the 6–7 months between both quitting their jobs and committing to an idea — by doing what consultants do: building frameworks. Five-point lists became 20-point lists. Nothing ever ticked all the boxes. They threw the frameworks out, went back to their networks, and ran 800 customer conversations across vertical B2B SaaS markets. The conversations found the market.

# What was the Brisbane conference moment?
slug: brisbane-conference-moment-shakeel
answer: A week before the Financial Advice Association of Australia conference at the end of 2024, Shakeel and Hardy vibe-coded a working demo. They paid for an exhibitor stand. Financial advisors tried to buy Marloo on the spot — before the product was real.

By that point Shakeel could describe Marloo in a single sentence and watch advisors physically relax. The half-sentence pitch test: if your proposition is sharp enough, someone will want to buy before you've finished describing the product. The vibe-coded demo at FAAA in Brisbane was the public confirmation.

# How do I do customer discovery?
slug: how-to-do-customer-discovery
answer: Shakeel ran 800 advisor conversations across 9 months, embedded inside firms 1–2 days at a time. Consultative approach that became sales when he could describe Marloo in a half sentence and watch advisors physically relax.

The consultative-then-product pattern: sit inside a firm for 1–2 days, talk to management, compliance, support, and advisors. Get in the door under the guise of helping them shape what AI-first operations could look like. Once you're in, transition to product propositioning. Keep iterating the pitch until someone listens to half a sentence and wants to buy.

# How do I find my first 10 customers?
slug: how-to-find-first-customers
answer: Direct outbound to people you've already talked to in customer discovery. Shakeel's first Marloo customers came from the 800 advisors he'd interviewed. The pipeline was already warm before the product existed.

The pattern: discovery conversations are also the customer pipeline. Each conversation produced a relationship that converted later. Don't run paid ads. Don't build a marketing site. Talk to people, build for one, ship overnight, repeat.

# What does product-market fit feel like?
slug: how-to-find-product-market-fit
answer: For Shakeel, the marker was advisors trying to buy the vibe-coded demo at the Brisbane conference — before the product existed. Unsolicited demand. Half-sentence pitch test passed.

Pull, not push. The absence of unsolicited momentum — even when revenue is growing through outbound — is the signal something is still off.

# When should I quit my job to start a company?
slug: when-to-quit-job-to-start-company
answer: Shakeel and Hardy both quit their jobs simultaneously and convinced one of Australia's largest VCs to fund the year of investigation. The forcing function was the commitment itself — both of them gone, no fallback.

For founders without the VC backing, the equivalent forcing function is enough customer evidence + a specific commitment date. Don't wait for certainty.

# How long does fundraising take?
slug: how-long-fundraising-takes
answer: Shakeel's $10M round came on the back of 9 months of investigation and 12+ months of building Marloo. Live across 6 countries by the time the round closed. From quitting his job to that round: about 18 months.

# What does "the messy middle" feel like?
slug: how-to-survive-messy-middle
answer: Shakeel calls it "the void" — the 6–7 months after both founders quit their jobs but before they'd committed to an idea. Constant pitching of ideas to each other. Building frameworks that didn't work. Two co-founders in a void with no external accountability.

Internal pressure > external pressure. Shakeel describes setting expectations of himself so high that external pressure feels small by comparison. The Internal-pressure-as-anchor approach is the survival mechanism.

# How do I build globally from day one?
slug: how-to-build-global-from-day-one
answer: Co-founder Hardy in London, dev team in Wellington, distribution across the UK and APAC. Shakeel and Hardy split responsibilities by geography from day one, with clean async division of labour.

The approach: founders cover their nearest markets. Dev work happens where the talent is cheapest and best. Sales follows the founders' networks. No co-location requirement.

# What is the half-sentence pitch test?
slug: half-sentence-pitch-test
answer: If your proposition is sharp enough, someone will want to buy before you've finished describing the product. Shakeel hit this around the tail of the 800-conversation period.

The test forces you to compress until only the irreducible value remains. If you need three sentences, the proposition isn't tight yet.
```

---

## Notes for future Claude

- **Slug discipline matters.** Use the canonical slug list in `AGENT-PLAYBOOK.md` whenever a question fits. Adding `how-i-found-customers` when `how-to-find-first-customers` exists splits the page in two and weakens AEO.
- **Plain-text upload is fine.** The parser handles `<p># Question?</p>` (markdown-style) and `<h1>Question?</h1>` (proper Heading 1 in Docs) equally well.
- **Answer length:** the `answer:` field should be tight (1–2 sentences). Long-form paragraphs are optional. Question pages render the answer prominently and the long-form is collapsed in a "More from this episode" details block.
- **Quote founders directly when powerful.** Wrap in double quotes inside the answer text.
- **Don't invent.** Every claim should be traceable to the transcript. Cite numbers, names, dates exactly as the guest said them.
- **One Q&A pack Doc per episode.** Don't split across multiple Docs.
