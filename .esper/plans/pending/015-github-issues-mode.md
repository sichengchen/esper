---
id: 015
title: Implement GitHub Issues backlog mode
status: pending
type: feature
priority: 2
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
---

# Implement GitHub Issues backlog mode

## Context

The skills already reference `backlog_mode: "github"` and `gh_issue:` frontmatter but the logic has never been exercised end-to-end. The rule is: 1 GH issue = 1 plan = 1 PR. When `backlog_mode` is `"github"`:
- Plan creation → `gh issue create`
- Plan shipped → `gh issue close` with PR URL

Skills that create plans: esper-init (Step 5), esper-plan (Step 6), esper-fix (Step 6), esper-phase (Step 8).
Skills that close issues: esper-ship (Step 4, fix type only; Step 5, phase PR for features).

The `gh` CLI is required and must be authenticated.

## Approach

1. Add `esper plan create-issue <filename>` subcommand to `lib/plan.js`:
   - Read the plan's frontmatter (title, id) and body (Approach section summary)
   - Run `gh issue create --title "<title>" --body "<approach summary>\n\nPlan: #<id>"`
   - Parse the returned issue number
   - Update the plan's `gh_issue` frontmatter field
   - Print the issue number and URL

2. Add `esper plan close-issue <filename> [--comment <text>]` subcommand:
   - Read `gh_issue` from the plan's frontmatter
   - If no `gh_issue`, exit 0 silently (no-op for local-mode plans)
   - Run `gh issue close <gh_issue> --comment "<text>"`
   - Print confirmation

3. Update plan-creating skills (init, plan, fix, phase) to call `esper plan create-issue` after writing each plan file when `backlog_mode` is `"github"`.

4. Update esper-ship to call `esper plan close-issue` when shipping fix-type plans, and to include `Closes #N` in phase PRs for feature-type plans.

5. Add a `esper config check-gh` subcommand that verifies `gh` CLI is available and authenticated (for use in esper-init when user selects github backlog mode).

6. Add tests in `test/github-issues.test.js` — mock `gh` CLI calls or skip if not authenticated.

## Files to change

- `lib/plan.js` (modify — add create-issue, close-issue)
- `lib/config.js` (modify — add check-gh)
- `bin/cli.js` (modify — route new subcommands)
- `skills/esper-init/SKILL.md` (modify — call create-issue in Step 5 when github mode)
- `skills/esper-plan/SKILL.md` (modify — call create-issue in Step 6)
- `skills/esper-fix/SKILL.md` (modify — call create-issue in Step 6)
- `skills/esper-phase/SKILL.md` (modify — call create-issue in Step 8)
- `skills/esper-ship/SKILL.md` (modify — call close-issue on ship)
- `test/github-issues.test.js` (create)

## Verification

- Run: `npm test`
- Manual: in a test repo with `backlog_mode: "github"`, run `/esper:plan`, verify a GH issue is created; run `/esper:ship`, verify the issue is closed
- Edge cases:
  - `gh` not installed → `esper config check-gh` exits 1, esper-init warns user
  - `gh` not authenticated → clear error message
  - `backlog_mode: "local"` → create-issue/close-issue are never called, no-op if called directly
  - Plan already has `gh_issue` set → skip create-issue (idempotent)
