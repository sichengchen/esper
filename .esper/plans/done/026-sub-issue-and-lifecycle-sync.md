---
id: 26
title: Add sub-issue creation and lifecycle sync to lib/plan.js
status: done
type: feature
priority: 1
phase: 005-github-sub-issues
branch: feature/005-github-sub-issues
created: 2026-02-22
shipped_at: 2026-02-22
pr: https://github.com/sichengchen/esper/pull/9
---
# Add sub-issue creation and lifecycle sync to lib/plan.js

## Context
`lib/plan.js` currently has `createIssue()` and `closeIssue()` for standalone GitHub issues. The `activate()`, `suspend()`, and `finish()` functions only move files and update frontmatter — they don't touch GitHub. The `gh` CLI has no native `--parent` flag, so sub-issues require a two-step process: create a regular issue, then call the REST API to link it as a sub-issue.

## Approach
1. Add a helper `readBacklogMode()` that reads `backlog_mode` from `.esper/esper.json` (avoids importing config.js to keep plan.js self-contained).
2. Add a helper `readPhaseIssue(phase)` that reads the phase file at `.esper/phases/<phase>.md` and returns its `gh_issue` number.
3. Add `createSubIssue(filename)`:
   - Read plan frontmatter to get phase and title
   - Skip if `gh_issue` is already set (idempotent)
   - Call `gh issue create --title <title> --body <approach summary + "Plan <id>">`
   - Parse issue number from URL output
   - Get the internal issue ID: `gh api repos/{owner}/{repo}/issues/{number} --jq .id`
   - Read the phase's `gh_issue` number from the phase file
   - Add as sub-issue: `gh api repos/{owner}/{repo}/issues/{parent_number}/sub_issues -X POST -F sub_issue_id={child_internal_id}`
   - Store `gh_issue` in plan frontmatter
4. Add `reopenIssue(filename)`:
   - Read plan frontmatter for `gh_issue`
   - No-op if `gh_issue` is not set
   - Call `gh issue reopen <number>`
5. Wire lifecycle sync into existing transition functions:
   - `activate()`: after file move, call `reopenIssue(filename)` if `backlog_mode == "github"`
   - `suspend()`: after file move, call `reopenIssue(filename)` if `backlog_mode == "github"`
   - `finish()`: after file move, call `closeIssue(filename)` if `backlog_mode == "github"`
   - Each sync call should be try/catch — log a warning but don't fail the transition if GitHub is unreachable
6. Register CLI commands in `bin/cli.js`:
   - `esperkit plan create-sub-issue <filename>`
   - `esperkit plan reopen-issue <filename>`
   - Update usage string
7. Add tests in `test/plan.test.js` for the new functions (mock `execFileAsync` to avoid actual GitHub calls).

## Files to change
- `lib/plan.js` (modify — add `createSubIssue`, `reopenIssue`, `readBacklogMode`, `readPhaseIssue`; update `activate`, `suspend`, `finish`)
- `bin/cli.js` (modify — add `create-sub-issue` and `reopen-issue` case routes, update usage string)
- `test/plan.test.js` (modify — add test coverage for new functions)

## Verification
- Run: `npm test`
- Expected: All existing tests pass, new tests for sub-issue and lifecycle functions pass
- Edge cases: Plan with no `gh_issue` (local mode) — transitions work without touching GitHub. Phase file missing `gh_issue` — `createSubIssue` fails gracefully with an error message.

## Progress
- Implemented readBacklogMode() and readPhaseIssue() helpers
- Implemented createSubIssue() with two-step process (create issue, link as sub-issue)
- Implemented reopenIssue() with no-op for plans without gh_issue
- Wired lifecycle sync into activate(), suspend(), finish() with try/catch guards
- Added CLI routes for create-sub-issue and reopen-issue
- Added 10 new tests covering all new functions and lifecycle sync in local mode
- Modified: lib/plan.js, bin/cli.js, test/plan.test.js
- Verification: passed — 73/73 tests pass
