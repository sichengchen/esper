---
id: 28
title: Update plan-consumption skills for sub-issue lifecycle
status: done
type: feature
priority: 2
phase: 005-github-sub-issues
branch: feature/005-github-sub-issues
created: 2026-02-22
shipped_at: 2026-02-22
---
# Update plan-consumption skills for sub-issue lifecycle

## Context
With lifecycle sync built into `activate()`, `suspend()`, and `finish()` (Plan 026), most consumption skills get sub-issue sync for free. However, `esper-ship` and `esper-backlog` have explicit GitHub issue logic that needs updating. `esper-ship` currently closes fix issues via `Closes #N` in PR bodies and the phase issue the same way. `esper-backlog` shows `gh_issue` numbers when in GitHub mode. Both need awareness that plans now have sub-issues.

## Approach
1. **esper-ship** (`skills/esper-ship/SKILL.md`):
   - Phase PRs: Keep `Closes #<phase_gh_issue>` in the PR body — this closes the parent issue when the PR merges, and GitHub auto-closes sub-issues when the parent closes
   - Fix PRs: The fix plan's `gh_issue` is now a sub-issue. Keep `Closes #<fix_gh_issue>` in fix PR bodies — this still works for sub-issues
   - Remove any explicit `esperkit plan close-issue` calls in the ship flow — lifecycle sync in `finish()` already handles this
   - Add: After the phase PR is opened, list all plan sub-issue numbers in the PR body alongside the plan summaries (e.g., "Plan 026 (#42) — title")

2. **esper-backlog** (`skills/esper-backlog/SKILL.md` and `lib/backlog.js`):
   - When displaying plans in GitHub mode, show `gh_issue` for each plan (not just phase/fix plans)
   - Update the display format to indicate sub-issue relationship: "Plan 026 (#42, sub-issue of #10)"

3. **esper-finish** — no changes needed. The `finish()` function in plan.js now auto-closes the sub-issue via lifecycle sync (Plan 026).

4. **esper-apply** — no changes needed. The `activate()` function now auto-reopens the sub-issue via lifecycle sync (Plan 026).

## Files to change
- `skills/esper-ship/SKILL.md` (modify — add plan issue numbers to PR body, remove explicit close-issue calls if present)
- `skills/esper-backlog/SKILL.md` (modify — update display instructions for sub-issue awareness)
- `lib/backlog.js` (modify — show `gh_issue` for all plans, indicate sub-issue relationship)

## Verification
- Run: manual — ship a phase with `backlog_mode: github` and verify the PR body includes plan sub-issue references; verify `esperkit backlog` shows sub-issue numbers
- Expected: PR body lists plan sub-issues; backlog display shows issue numbers for all plans
- Edge cases: Plans without `gh_issue` (local mode or pre-existing plans) — display gracefully without issue numbers

## Progress
- Updated esper-ship: added plan sub-issue numbers to phase PR body; removed explicit close-issue call (lifecycle sync handles it)
- Updated esper-backlog skill: updated cross-reference description to include all plan sub-issues
- Updated lib/backlog.js: all three sections (active, pending, done) now show gh_issue numbers when present
- Modified: SKILL.md (esper-ship, esper-backlog), lib/backlog.js
- Verification: passed — 73/73 tests pass
