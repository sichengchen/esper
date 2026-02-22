---
id: 27
title: Update plan-creation skills to use sub-issues
status: active
type: feature
priority: 2
phase: 005-github-sub-issues
branch: feature/005-github-sub-issues
created: 2026-02-22
---
# Update plan-creation skills to use sub-issues

## Context
Four skills create plans: `esper-phase` (bulk plan creation), `esper-plan` (single feature plan), `esper-fix` (single fix plan), and `esper-init` (initial phase setup). Currently, `esper-phase` and `esper-init` create a phase issue but no plan issues. `esper-fix` creates a standalone issue via `esperkit plan create-issue`. `esper-plan` has no GitHub integration. All four need to call `esperkit plan create-sub-issue` after creating plans, replacing any standalone issue creation.

## Approach
1. **esper-phase** (`skills/esper-phase/SKILL.md`):
   - In Step 8, after writing all plan files, add a new block: if `backlog_mode == "github"`, loop through each created plan file and run `esperkit plan create-sub-issue <filename>`
   - Keep the existing phase issue creation unchanged (it's the parent)

2. **esper-plan** (`skills/esper-plan/SKILL.md`):
   - After writing the plan file, add: if `backlog_mode == "github"`, run `esperkit plan create-sub-issue <filename>`
   - This is new — `esper-plan` currently has no GitHub integration

3. **esper-fix** (`skills/esper-fix/SKILL.md`):
   - In Step 6, replace `esperkit plan create-issue <filename>` with `esperkit plan create-sub-issue <filename>`
   - Update the comment: sub-issue of the phase's parent issue, not a standalone issue

4. **esper-init** (`skills/esper-init/SKILL.md`):
   - After the initial phase plans are created and the phase issue exists, add: if `backlog_mode == "github"`, loop through each created plan file and run `esperkit plan create-sub-issue <filename>`

## Files to change
- `skills/esper-phase/SKILL.md` (modify — add sub-issue creation loop after plan files are written)
- `skills/esper-plan/SKILL.md` (modify — add sub-issue creation after plan file is written)
- `skills/esper-fix/SKILL.md` (modify — replace `create-issue` with `create-sub-issue`)
- `skills/esper-init/SKILL.md` (modify — add sub-issue creation loop after initial plans)

## Verification
- Run: manual — create a test phase with `backlog_mode: github` and verify sub-issues appear under the phase issue on GitHub
- Expected: Each plan shows as a sub-issue of the phase's parent issue; `gh_issue` is stored in each plan's frontmatter
- Edge cases: Phase without `gh_issue` (local mode) — no sub-issues created, no errors
