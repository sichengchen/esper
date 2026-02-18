---
id: 007
title: Fix esper:ship — archive plan before push so status change is in the PR
status: active
type: fix
priority: 2
phase: phase-1
branch: fix/ship-archive-before-push
created: 2026-02-18
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

**Current order**: Commit (3) → Push (4) → Open PR (5) → Archive (6) → Phase check (7)

**New order**: Commit (3) → Archive (4) → Commit archive (4b) → Push (5) → Open PR (6) → Phase check (7)

Specifically:

1. After Step 3 (commit remaining changes), insert a new step:
   - Move the plan file from `active/` to `done/`
   - Update frontmatter: `status: done`, `shipped_at: today`
   - Commit: `chore: archive plan #<id> — <title>`

2. Then push (the branch now includes the archived plan)

3. Then open PR (or skip if `pr_mode: "phase"`)

4. After PR is opened, update the plan's `pr:` field with the PR URL and amend or add a small commit

**Note on `pr:` field**: The PR URL isn't known until after the PR is opened. Two options:
- Add a second tiny commit after PR creation: `chore: record PR url for plan #<id>`
- Accept that `pr:` is set locally after push (not in the branch) — fine since it's metadata

Use the second approach (simpler): archive + commit before push (so `status: done` and `shipped_at` are in the PR), then set `pr:` locally after the PR is opened without an extra commit.

## Files to change

- `skills/esper-ship/SKILL.md` (modify — reorder steps: archive+commit before push; set pr: field locally after PR opens without extra commit)

## Verification

- Run: manual
- Expected: after `/esper:ship`, the PR diff includes `.esper/plans/done/<plan>.md` with `status: done` and `shipped_at` set
- Edge cases:
  - Archive commit fails (e.g. nothing to stage) — shouldn't happen since plan file is always modified
  - `type: "feature"` — archive still happens before push; `pr:` field is omitted until phase PR is opened

## Progress

- Reordered steps in `skills/esper-ship/SKILL.md`: Commit (3) → Archive + commit archive (4) → Push (5) → Open PR (6) → Phase check (7)
- `pr:` field set locally after PR opens, no extra commit
- `gh issue close` moved into Step 6 (fix plans only)
- Removed stale `pr_mode` reference from edge cases (updated to `type: "feature"`)
- Modified: skills/esper-ship/SKILL.md
- Verification: manual
