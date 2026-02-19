---
id: 18
title: Compact plan details into phase file on archive
status: done
type: feature
priority: 2
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
shipped_at: 2026-02-19
pr: https://github.com/sichengchen/esper/pull/4
---
# Compact plan details into phase file on archive

## Context

When plans are archived and phases complete, the detailed context lives only in individual plan files under `archived/<phase>/`. Future agents need to read many files to understand what was built. The phase file (`.esper/phases/<phase>.md`) should serve as the primary index — a compact summary of all shipped plans, so agents check it first before diving into archived plans.

Currently, phase files only have the original goal/scope/acceptance criteria. After a phase completes, they have no record of what was actually shipped. Phase 1's file still references stale skill names (esper:new, esper:build) because it was never updated.

## Approach

1. Add a `## Shipped Plans` section to phase files. When a plan is archived (via esper:finish or esper:yolo), append a one-liner summary to the current phase file:
   ```markdown
   ## Shipped Plans
   - #011 — Add subcommand routing: refactored bin/cli.js with config check/get/set. Files: bin/cli.js, lib/config.js
   - #012 — Add plan read subcommands: list/get/next-id with filtering. Files: lib/plan.js, bin/cli.js
   ```

2. Update `esper-finish` (Step 4): After running `esper plan finish`, also append the plan's summary to the phase file's `## Shipped Plans` section. Read the plan's title, approach (first sentence), and files list to construct the one-liner.

3. Update `esper-yolo` (Step 4g): Same — after archiving each plan, append to the phase file.

4. Update `esper-ship` (Step 5, phase completion): When all plans are done and the phase PR is opened, mark the phase file's acceptance criteria as checked and set `status: completed` in the phase frontmatter.

5. Update `esper-phase` (Step 3): When reading the completed phase for retrospective, the agent can now read the compact `## Shipped Plans` section instead of scanning individual archived files.

## Files to change

- `skills/esper-finish/SKILL.md` (modify — add phase file update after archive)
- `skills/esper-yolo/SKILL.md` (modify — add phase file update after each plan archive)
- `skills/esper-ship/SKILL.md` (modify — update phase file status on phase completion)
- `skills/esper-phase/SKILL.md` (modify — read Shipped Plans section for retrospective)

## Verification

- Run: `npm test`
- Manual: after running `/esper:finish`, verify the phase file has a new entry in `## Shipped Plans`
- Edge cases:
  - `## Shipped Plans` section doesn't exist yet → create it
  - Plan has no `## Approach` section → use title only
  - Phase file is missing → skip gracefully (shouldn't happen but don't crash)

## Progress
- Milestones: 4 commits
- Modified: skills/esper-finish/SKILL.md, skills/esper-yolo/SKILL.md, skills/esper-ship/SKILL.md, skills/esper-phase/SKILL.md
- Verification: not yet run — run /esper:finish to verify and archive
