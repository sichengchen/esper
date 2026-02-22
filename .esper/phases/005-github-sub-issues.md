---
phase: 005-github-sub-issues
title: GitHub Sub-Issues for Plans
status: active
---

# Phase 5: GitHub Sub-Issues for Plans

## Goal
Make every plan (feature and fix) a GitHub sub-issue of the phase's parent issue, with full lifecycle sync — create on plan creation, close on done, reopen on suspend. This replaces the current model where only phases and fixes get standalone issues and feature plans have no GitHub presence.

## In Scope
- `createSubIssue()` in lib/plan.js — creates a GitHub issue and adds it as a sub-issue of the phase's parent issue via `gh api`
- `reopenIssue()` in lib/plan.js — reopens a closed GitHub issue
- Lifecycle sync wired into `activate()`, `suspend()`, `finish()` — auto-reopen/close when plan status changes
- CLI commands: `esperkit plan create-sub-issue`, `esperkit plan reopen-issue`
- Update esper-phase, esper-plan, esper-fix, esper-init skills to create sub-issues
- Update esper-ship and esper-backlog skills for sub-issue awareness
- Tests for new lib/plan.js functions

## Out of Scope (deferred)
- GitHub Projects board integration
- Bidirectional sync (reading GitHub issue state back into esper)
- Labels or milestones on sub-issues
- Converting existing standalone fix issues into sub-issues retroactively

## Acceptance Criteria
- [ ] Plans created by esper:phase, esper:plan, and esper:fix become sub-issues of the phase's parent GitHub issue
- [ ] `finish()` auto-closes the plan's GitHub issue
- [ ] `suspend()` and `activate()` auto-reopen the plan's GitHub issue if it was closed
- [ ] All lifecycle sync is conditional on `backlog_mode == "github"` and `gh_issue` being set
- [ ] Existing local-mode behavior is unchanged
- [ ] Tests pass for new plan.js functions

## Phase Notes
Phase 4 wrapped cleanly. No carry-forward items. The sub-issue API requires a two-step process: create a regular issue, then call `gh api repos/{owner}/{repo}/issues/{parent}/sub_issues -X POST -F sub_issue_id={child_internal_id}` to establish the parent-child relationship. The `gh` CLI does not have native `--parent` support.

## Shipped Plans
- Plan 26 — Add sub-issue creation and lifecycle sync to lib/plan.js: Add a helper `readBacklogMode()` that reads `backlog_mode` from `.esper/esper.json`. Files: plan.js, cli.js, plan.test.js
