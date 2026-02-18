---
id: 005
title: Archive phase plans on phase completion to keep backlog reads efficient
status: active
priority: 2
phase: phase-1
branch: feature/phase-archiving
created: 2026-02-18
---

# Archive phase plans on phase completion to keep backlog reads efficient

## Context

`esper:backlog` reads ALL files in `.esper/plans/done/` to sort by `shipped_at` and display the 3 most recent. After many phases, `done/` could accumulate hundreds of plan files — every backlog display would read all of them, burning tokens unnecessarily. The backlog should stay fast regardless of project history.

The relevant skills:
- `skills/esper-ship/SKILL.md` — Step 7 (phase check) is where phase completion is detected; this is where archiving should happen
- `skills/esper-backlog/SKILL.md` — Step 2 reads `done/`; needs to stay out of `archived/`
- `skills/esper-init/SKILL.md` — creates the directory structure in Step 5; should include `archived/`

## Approach

### 1. Update `esper-ship/SKILL.md` — Step 7 (Phase check)

When all plans for the current phase are in `done/` (phase complete), after printing the completion message:

1. Move all `.md` files from `.esper/plans/done/` whose `phase:` frontmatter matches the completed phase into `.esper/plans/archived/phase-N/` (creating the directory if it doesn't exist)
2. Update `current_phase` in `esper.json` to the next phase (e.g., `phase-1` → `phase-2`) — or ask the user what the next phase should be called
3. Print: "Phase plans archived to `.esper/plans/archived/phase-N/`"

Note: only archive plans matching the completed phase — if somehow `done/` has plans from multiple phases, only move the completed one's plans.

### 2. Update `esper-backlog/SKILL.md` — Step 2

Change the done section to:
- Read files from `.esper/plans/done/` only (not `archived/`) — this is already correct, just make it explicit
- Add a note: "Archived phases are in `.esper/plans/archived/` and are not shown"
- If `done/` is empty after archiving, the DONE section is omitted

### 3. Update `esper-init/SKILL.md` — Step 5

Add `.esper/plans/archived/` to the list of directories created during init (alongside `pending/`, `active/`, `done/`).

## Files to change

- `skills/esper-ship/SKILL.md` (modify — Step 7: archive phase plans on completion, update current_phase)
- `skills/esper-backlog/SKILL.md` (modify — Step 2: clarify that done/ excludes archived/, add note about archived phases)
- `skills/esper-init/SKILL.md` (modify — Step 5: create archived/ directory during init)

## Verification

- Run: manual
- Expected:
  - After all phase-1 plans ship and phase is complete, `.esper/plans/done/` is empty and `.esper/plans/archived/phase-1/` contains the shipped plans
  - `esper:backlog` shows an empty DONE section (or omits it) — does NOT read archived plans
  - New phase work begins in `pending/` with the next phase, and `esper.json` reflects the updated `current_phase`
- Edge cases:
  - `done/` contains plans from mixed phases — only archive the completed phase's plans, leave others
  - `archived/phase-N/` already exists (re-running after a partial archive) — overwrite gracefully without error
