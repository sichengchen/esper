---
id: 016
title: Skills re-consolidation and cleanup
status: pending
type: feature
priority: 3
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
---

# Skills re-consolidation and cleanup

## Context

Phase 1 iterated rapidly — skills were edited by 10 different plans, some of which superseded earlier changes (plan 008 replaced plan 004's `pr_mode` with per-plan `type`). The last consolidation commit (9dcd98e) updated skills but there may still be:
- Stale `pr_mode` references (esper.json still has `"pr_mode": "phase"`)
- References to removed skills (esper-build, esper-new, esper-done, esper-commit)
- Inconsistent frontmatter templates across plan-creating skills
- Cross-skill assumptions that no longer hold after the type/fix redesign

This plan is a thorough audit and cleanup pass, run after the CLI migration (plan 014) so the skills reflect their final state.

## Approach

1. Remove `pr_mode` from `.esper/esper.json` (this project's own config)
2. Grep all SKILL.md files for stale references:
   - `pr_mode` → remove or replace with `type` logic
   - `esper:build`, `esper:new`, `esper:done`, `esper:commit` → replace with current skill names (`esper:apply`, `esper:plan`, `esper:finish`)
   - `esper-build`, `esper-new`, `esper-done`, `esper-commit` → same
3. Verify frontmatter templates are consistent across plan-creating skills (init Step 5, plan Step 5, fix Step 5, phase Step 8) — all must include `type:` field
4. Verify the `REMOVED_SKILLS` list in `bin/cli.js` is still accurate
5. Verify cross-skill contracts:
   - Fields written by plan-creating skills match fields read by backlog, apply, ship, finish, yolo
   - `branch:` naming convention is consistent (fix → `fix/<slug>`, feature → `feature/<phase>`)
   - Phase completion detection logic is identical in ship and yolo
6. Update README.md if skill names or commands table is stale

## Files to change

- `.esper/esper.json` (modify — remove `pr_mode`)
- `skills/*/SKILL.md` (modify — fix any stale references found)
- `bin/cli.js` (modify — verify REMOVED_SKILLS list)
- `README.md` (modify — update if stale)

## Verification

- Run: `npm test`
- Run: `grep -r 'pr_mode' skills/` → should return no matches
- Run: `grep -r 'esper:build\|esper:new\|esper:done\|esper:commit' skills/` → should return no matches (except in REMOVED_SKILLS or historical context)
- Manual: skim each SKILL.md for coherence
