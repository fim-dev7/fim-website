# Batch episode materials — generated 2026-05-31

7 episodes generated concurrently (Layer-1 grounding gate `EXIT=0` on all). Files are in
`cms-source/` (content docs) and `cms-source/qa-packs/` (Q&A packs) — git-tracked, NOT
deployed. They are **not live**: to publish, each must be uploaded to Drive as a Google Doc
(content → *FiM - Episode Content*; Q&A → *FiM - Q&A Bank*), then sync.

| Provisional # | Guest | Company | Content doc | Q&A pack | Layer-1 |
|---|---|---|---|---|---|
| 04 | Nate Spiteri | Shopfront | ✅ | ✅ (14 Q) | EXIT=0 |
| 07 | Ben Wood | Waste and Progress (?) | ✅ | ✅ (13 Q) | EXIT=0 |
| 08 | Robert Huynh | Nook → Reforge Labs | ✅ | ✅ (15 Q) | EXIT=0 |
| 17 | Satya Tumati | Socratix AI | ✅ | ✅ (12 Q) | EXIT=0 |
| 21 | Ethan Yong | Umami Papi | ✅ | ✅ (14 Q) | EXIT=0 |
| 22 | Jevon Le Roux | Keeyu | ✅ | ✅ (13 Q) | EXIT=0 |
| 23 | Steven Turban | Lumiere | ✅ | ✅ (13 Q) | EXIT=0 |

(Earlier: Andy Miller, Nam Nguyen, Celeste Amadon Q&A packs also in `cms-source/qa-packs/`.)

## 🚩 Reconcile BEFORE uploading to Drive

**Name/brand discrepancies vs the existing site — you decide which is right:**
- **Ben Wood:** transcript says **"Waste and Progress"** (arms: "Work in Progress" / "Waste
  and Progress Textiles"); your `data.jsx`/`data-static.jsx` say **"WipWrk"**. "WipWrk" may be
  the real stylized brand and the transcript caption a garble — confirm the actual name.
- **Steven Turban:** transcript says **"Steven"**; `data-static.jsx` says **"Stephen"**. Files
  are named `steven-turban`. Confirm spelling (affects slug + display).
- **Satya — Socratix AI:** SRT garbled it to "Socratic AI"; materials render **"Socratix"**
  (single token, to pass the grounding gate). Expand to full "Socratix AI" if you want.
- **Nate — "$800K raised":** that figure is stated by the **host**, not Nate (his own numbers
  were the 750 target / 50K / 300K). Verify against the Episodes sheet before publishing.

**Slug hygiene (tighten before Drive upload — aliases should match FINAL slugs):**
- Generic slugs that risk colliding/aggregating with future episodes — namespace or rename:
  Ethan: `most-valuable-startup-lesson`, `underrated-startup-advice`, `founder-to-ceo-transition`,
  `how-to-expand-internationally`; Satya: `most-valuable-founder-lesson-satya`,
  `future-of-building-ai-products`, `leaving-big-company-to-found-startup`.
- Nate's report duplicated `how-to-find-first-investors` (one slug, not two).

## ⏳ Still to do (deferred on purpose)

1. **`aliases.json` merge — NOT done yet.** Each agent *proposed* 10–15 phrasings per new slug
   (captured in their run reports), but I held off because (a) several slugs will be renamed in
   the hygiene pass above, and (b) the pages aren't live until the packs are in Drive — aliases
   are inert until then. Do the merge once slugs are finalized, so phrasings match.
   - Also: 5 **canonical** slugs are now used but still have **no aliases** in `aliases.json`
     (`how-to-pivot-without-losing-team`, `how-to-handle-investor-rejection`,
     `how-to-avoid-founder-burnout`, `bootstrap-vs-venture`, `how-to-validate-startup-idea`).
     The Jevon/Stephen reports include proposed phrasings for these.
2. **Layer-2 (independent verifier) — NOT run for these 7.** The sub-agents lacked the Agent/Task
   tool, so they did a manual self-audit instead; Layer-1 passed on all. Run independent Layer-2
   verifiers (per EVAL-VERIFIER-PROMPT.md) before pushing any of these to Drive.
3. **Episode numbers are provisional** (from the upload filenames). Reconcile with the Episodes
   sheet — the site renumbers (e.g. Drive Ep28 → site 27).
