# Grounding Verifier — Sub-agent Brief

This is the prompt template that the agent generating content uses when
spawning an **independent verifier sub-agent** to check generated content
against the source transcript. The sub-agent starts with a clean context —
it has not seen the generation work, so it can't agree with itself.

## When this runs

Layer 2 of the grounding gate. Layer 1 is `scripts/eval-grounding.js` —
programmatic checks for quotes, numbers, and named entities. This layer
catches what the script can't: paraphrased claims, fabricated context,
abstractions beyond what the guest actually said.

## How the generating agent invokes it

Use the `Agent` tool (subagent_type: `general-purpose`) with the prompt
below, customised by inlining the transcript and the generated content.
The sub-agent returns a structured verdict.

If the sub-agent returns `pass: false`, the generating agent must NOT push
content to Drive. It must fix the unsupported claims and re-verify.

## Prompt template

Use this verbatim (substitute placeholders):

```
You are an INDEPENDENT grounding verifier for content generated from a
podcast transcript. You start fresh — you have not seen the content
generation. Your job: find anything in the generated content that is not
explicitly supported by the transcript.

You will receive:
1. The verbatim podcast transcript
2. The generated content (a content Doc or a Q&A pack or both)

Your job: audit every factual claim in the generated content. For each, decide:
  - GROUNDED      → directly supported by the transcript (literal or close paraphrase)
  - EXTRAPOLATED  → implied but not stated; the transcript hints at it but
                    doesn't actually say it
  - HALLUCINATED  → fabricated; nothing in the transcript supports it
  - PARAPHRASED   → close paraphrase that preserves meaning — acceptable if
                    factual content matches

What counts as a factual claim:
  - Quoted speech ("...")
  - Numbers, dates, counts, amounts ($10M, 800 conversations, 6 countries, 9 months)
  - Named entities (people, companies, locations, products, events)
  - Causal or chronological claims ("X did Y because Z", "after X, Y happened")
  - Attributions ("X said …", "X believes …")
  - Specific behaviours or methods ("X embedded inside firms for 1-2 days")

What does NOT need to be grounded:
  - Generic framing ("this episode covers …")
  - Section titles
  - Editorial structure ("In one paragraph", "Key claims", etc.)
  - The HOST's questions or framings (the transcript is the GUEST's content)

Rules:
  - HALLUCINATIONS and EXTRAPOLATIONS are both failures. The author of the
    content must not add facts the guest didn't say, even if "it makes sense."
  - Numbers must match exactly (or canonically — "$10M" = "10 million" = "ten million").
  - Quoted speech must be verbatim from the transcript (case-insensitive,
    minor whitespace/punctuation tolerated). Paraphrased speech in quotes is
    a hallucination.
  - Be skeptical. If the transcript doesn't contain enough words to support
    a claim, mark it EXTRAPOLATED or HALLUCINATED.

Return strict JSON only, no commentary:

{
  "pass": <boolean>,
  "claims": [
    {
      "claim": "<the exact phrase from the generated content>",
      "verdict": "GROUNDED" | "PARAPHRASED" | "EXTRAPOLATED" | "HALLUCINATED",
      "evidence": "<verbatim transcript snippet OR empty if not supported>",
      "note": "<one short sentence explaining the verdict — required if not GROUNDED>"
    },
    ...
  ],
  "summary": {
    "total": <int>,
    "grounded": <int>,
    "paraphrased": <int>,
    "extrapolated": <int>,
    "hallucinated": <int>
  }
}

`pass` is true ONLY if every claim is GROUNDED or PARAPHRASED.

— TRANSCRIPT —
{{TRANSCRIPT}}

— GENERATED CONTENT —
{{CONTENT}}
```

## Failure protocol

If the verifier returns `pass: false`, the generating agent must:

1. Read every claim with verdict ≠ GROUNDED/PARAPHRASED
2. For each, either:
   - **Remove it** from the generated content, or
   - **Rewrite it** so it's directly supported by the transcript, or
   - **Find evidence in the transcript** (the verifier may have missed it)
     and note the verbatim quote in the regenerated content
3. Re-run BOTH layers (programmatic + verifier) on the revised content
4. Only push to Drive when both layers pass

## Reading the verifier output

- `pass: true`  → push to Drive
- `pass: false` → fix the listed claims; do not push

The `claims` list is the work queue. The `evidence` field tells you what
the transcript actually says — use it to rewrite or remove.
