---
id: 007
title: Fix esper:ship — archive plan before push so status change is in the PR
status: done
type: fix
priority: 2
phase: 001-polish-and-publish
branch: fix/ship-archive-before-push
created: 2026-02-18
shipped_at: 2026-02-18
pr: merged-to-main
---

# Fix esper:ship — archive plan before push so status change is in the PR

## Context

Currently `esper:ship` archives the plan (Step 6) AFTER pushing (Step 4) and opening the PR (Step 5). This means the plan file's `status: done` and `shipped_at` changes are made locally but never committed or pushed — the PR never includes the plan being closed.

Correct order should be:
1. Archive plan → commit archive → push (plan closure is in the branch)
2. Open PR

Affected skill: `skills/esper-ship/SKILL.md`

## Approach

Reorder steps in `esper-ship/SKILL.md`:

**New order**: Commit (3) → Archive + commit archive (4) → Push (5) → Open PR (6) → Phase check (7)

## Files to change

- `skills/esper-ship/SKILL.md` (modify — reorder steps: archive+commit before push; set pr: field locally after PR opens without extra commit)

## Verification

- Run: manual
- Expected: after `/esper:ship`, the PR diff includes `.esper/plans/done/<plan>.md` with `status: done` and `shipped_at` set
- Edge cases:
  - `type: "feature"` — archive still happens before push; `pr:` field is omitted until phase PR is opened

## Progress

- Reordered steps in `skills/esper-ship/SKILL.md`: Commit (3) → Archive + commit archive (4) → Push (5) → Open PR (6) → Phase check (7)
- `pr:` field set locally after PR opens, no extra commit
- `gh issue close` moved into Step 6 (fix plans only)
- Removed stale `pr_mode` reference from edge cases (updated to `type: "feature"`)
- Modified: skills/esper-ship/SKILL.md
- Verification: manual — step order confirmed in skill file on fix/ship-archive-before-push branch
