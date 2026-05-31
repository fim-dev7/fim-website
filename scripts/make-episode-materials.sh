#!/usr/bin/env bash
#
# make-episode-materials.sh — raw transcript ➜ FiM website materials.
#
# Turns one episode's raw transcript (from uploads/, or pulled from the Drive
# transcript folder) into the two things the site pipeline needs:
#   1. an Episode Content Doc   (per EPISODE_DOC_TEMPLATE.md)
#   2. a Q&A Pack               (per QA_PACK_TEMPLATE.md)
# …both run through the two-layer grounding gate, with aliases.json updated.
#
# Output lands locally in cms-source/ (git-tracked, NOT deployed). It does NOT
# upload to Drive or run sync — you paste the two files into Google Docs in the
# Episode Content + Q&A Bank folders, then sync.
#
# Usage:
#   scripts/make-episode-materials.sh "Guest Name" <episode_number>
# Example:
#   scripts/make-episode-materials.sh "Jane Doe" 29
#
# Requires the `claude` CLI (you have it — you're using Claude Code). Inherits
# this project's MCP servers (Drive) + skills automatically.

set -euo pipefail

GUEST="${1:?usage: make-episode-materials.sh \"Guest Name\" <episode_number>}"
EP="${2:?usage: make-episode-materials.sh \"Guest Name\" <episode_number>}"

# Run from the repo root regardless of where it's invoked.
cd "$(dirname "$0")/.."

PROMPT="Run the Founders In Motion WEBSITE content pipeline for ONE episode. First read these and follow them exactly: AGENT-PLAYBOOK.md, EPISODE_DOC_TEMPLATE.md, QA_PACK_TEMPLATE.md, EVAL-VERIFIER-PROMPT.md.

EPISODE: guest = '${GUEST}', episode number = ${EP}.

STEP 1 — TRANSCRIPT (source of truth):
  - If a file in uploads/ has a name containing '${GUEST}', use it.
  - Otherwise find it in the Drive transcript folder (ID 1gu8J2FRG35Z37evtSWC0HAtRZPXDh2QT)
    using the Drive MCP: search_files by the guest name, read_file_content, and save the
    text to uploads/Ep ${EP} ${GUEST}.txt.

STEP 2 — GENERATE two grounded files. Verbatim quotes only, exact numbers, no invented
abstractions or motivational lines the guest did not say:
  - Episode Content Doc -> cms-source/ep-${EP}-<slug>-content.md   (EPISODE_DOC_TEMPLATE.md)
  - Q&A Pack            -> cms-source/qa-packs/ep-${EP}-<slug>-qa.md (QA_PACK_TEMPLATE.md;
    reuse the canonical slugs listed in AGENT-PLAYBOOK.md wherever a question fits).

STEP 3 — GROUNDING GATE (do not finish until it passes):
  - Layer 1: run  node scripts/eval-grounding.js \"<transcript-path>\" \"<content-path>\" \"<qa-path>\"
    (without piping, so the real exit code shows). Fix or remove every ungrounded quote/number/
    name until it exits 0.
  - Layer 2: spawn an independent general-purpose sub-agent using EVAL-VERIFIER-PROMPT.md to audit
    both files against the transcript. Fix anything that is not GROUNDED or PARAPHRASED, then re-run
    Layer 1.

STEP 4 — ALIASES: for every NEW slug you introduced, append 10-15 natural-language search phrasings
to aliases.json (see step 4c in AGENT-PLAYBOOK.md). Do not touch existing canonical slugs' aliases.

STEP 5 — DO NOT upload to Drive and DO NOT run scripts/sync.js. When done, print: the two output file
paths, the slugs used (mark canonical vs new), and the final Layer-1 + Layer-2 grounding verdicts."

# Scoped allow-list: only the tools this job actually needs — read/write files, run
# node, spawn the grounding sub-agent, and the read-only Drive lookups. No blanket
# permission bypass. If a tool still prompts, approve it in this terminal, or adjust
# the list below. (You can raise autonomy yourself via claude's permission flags —
# see `claude --help` — but that's your call, not baked in here.)
DRIVE="mcp__19ae1e43-d7e3-424b-a3c2-e508898e2806"
exec claude -p "$PROMPT" \
  --allowedTools "Bash Read Write Edit Glob Grep Task ${DRIVE}__read_file_content ${DRIVE}__search_files"
