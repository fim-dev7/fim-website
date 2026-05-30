/**
 * Aggregate Q&A entries from all episodes into canonical question groups.
 *
 * Multiple episodes can contribute to the same canonical_slug — the resulting
 * /questions/<slug>/ page renders ONE question with N episode contributions
 * stacked. This module produces that grouped structure.
 *
 * Input: array of { episode, entries } where each entry is { question, slug, answer, longForm }.
 *   - `episode` is the enriched episode record (episode_number, guest_name, etc.)
 * Output: Map<slug, {
 *   slug,
 *   question,                   // the question text (de-duped; first non-empty wins)
 *   contributors: [{ ep, entry }]
 * }>
 *
 * If multiple episodes have variant phrasings for the same slug, the first one
 * encountered becomes canonical. Order of contributors = episode_number descending
 * (most recent first) — newer perspectives lead.
 */

export function aggregateQuestions(episodeQaList) {
  const bySlug = new Map();

  for (const { episode, entries } of episodeQaList) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!entry.slug || !entry.question) continue;
      const existing = bySlug.get(entry.slug);
      if (existing) {
        existing.contributors.push({ ep: episode, entry });
      } else {
        bySlug.set(entry.slug, {
          slug: entry.slug,
          question: entry.question,
          contributors: [{ ep: episode, entry }],
        });
      }
    }
  }

  // Sort contributors per slug — most recent episode first
  for (const group of bySlug.values()) {
    group.contributors.sort((a, b) => b.ep.episode_number - a.ep.episode_number);
  }

  return bySlug;
}

/**
 * Helper: given the aggregated map, return an array of "popular" canonical
 * questions (those answered by 2+ episodes). Useful for the homepage and llms.txt.
 */
export function getMultiContributorQuestions(grouped) {
  return Array.from(grouped.values()).filter(g => g.contributors.length >= 2);
}
