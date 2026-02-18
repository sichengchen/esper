---
id: 009
title: Add esper:continue skill to resume interrupted builds
status: pending
type: feature
priority: 2
phase: phase-1
branch: feature/phase-1
created: 2026-02-18
---

# Add esper:continue skill to resume interrupted builds

## Context

`/esper:build` is the primary implementation skill but has no recovery path when a session is interrupted mid-implementation. The active plan moves to `.esper/plans/active/` and a branch is created, but if Claude stops before finishing (context window exhausted, user closes session, etc.) there is no structured way to resume. The user must re-orient Claude manually.

The existing `esper:build` skill (at `skills/esper-build/SKILL.md`) follows a structured step-by-step flow: pick plan → create branch → read plan + constitution → implement → verify → write Progress. A `esper:continue` skill should dovetail into this same flow starting *after* branch creation, by reading the active plan and inferring what is left.

The CLI installer (`bin/cli.js`) auto-discovers all directories under `skills/` — adding `skills/esper-continue/SKILL.md` is sufficient; no changes to `bin/cli.js` are needed.

All esper skills follow the same SKILL.md structure: numbered steps, `AskUserQuestion` for decisions, explicit git operations, plan as a living document.

## Approach

1. Create `skills/esper-continue/` directory and write `SKILL.md`
2. Skill steps:
   - **Step 1 — Check setup**: Verify `.esper/esper.json` exists; find exactly one plan in `.esper/plans/active/`. If none found, tell user there is nothing to continue and suggest `/esper:build`. If multiple active plans exist (shouldn't happen), surface the conflict.
   - **Step 2 — Assess current state**: Read the full active plan (all sections including any existing Progress). Run `git status` to confirm we're on the right branch. Run `git diff HEAD` to see what code changes have already been made. Cross-reference the diff against the plan's **Approach** and **Files to change** sections to infer which steps are done and which remain.
   - **Step 3 — Report and confirm**: Show the user a brief summary — active plan title/ID, what appears done, what appears remaining. Ask: "Does this look right?" before proceeding. This prevents Claude from re-doing work already committed.
   - **Step 4 — Continue implementation**: Resume from remaining Approach steps. Update the plan file as a living document (add/refine steps if something unexpected is found, update **Files to change** if new files are involved).
   - **Step 5 — Verification**: Run verification commands from `esper.json` (`test`, `lint`, `typecheck`) and the plan's **Verification** section. If anything fails, fix it before continuing.
   - **Step 6 — Update Progress section**: Append or update the `## Progress` section in the active plan file with what was done in this session.
   - **Step 7 — Wrap up**: Tell the user what was completed. Suggest `/esper:commit` to commit changes, or `/esper:ship` if implementation is fully done and verified.

## Files to change

- `skills/esper-continue/SKILL.md` (create — new skill implementing the steps above)

## Verification

- Run: manual (install skill via `node bin/cli.js`, confirm `esper-continue` appears in `~/.claude/skills/`)
- Expected: skill is discoverable as `/esper:continue`; on an interrupted build it correctly identifies what's done vs remaining; on a clean project with no active plan it reports "nothing to continue"
- Edge cases:
  - No active plan → graceful message, suggest `/esper:build`
  - Active plan with no Progress section yet → treat all Approach steps as remaining
  - Active plan where all Approach steps appear done but verification hasn't been run → jump to Step 5 (verification)
  - Branch mismatch (current branch ≠ plan's `branch:`) → warn user before proceeding
