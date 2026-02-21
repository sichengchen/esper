---
phase: phase-4
title: Exploration & Review Skills
status: active
---

# Phase 4: Exploration & Review Skills

## Goal

Add three new skills that fill gaps in the esper workflow: `explore` for pre-planning investigation, `review` for code quality feedback, and `revise` for plan/phase document quality. These skills make the workflow more deliberate — explore before you plan, review before you ship.

## In Scope

- `esper:explore` — codebase-aware and open-ended exploration, saves findings to `.esper/explorations/`
- `esper:review` — code review on branch/PR diffs, focused on code quality
- `esper:revise` — user-driven revision of plan, phase, and fix markdown files (user gives feedback, agent applies edits)
- README updated
- CLI installer updated to include the three new skill directories

## Out of Scope (deferred)

- Automated review triggers (hooks that auto-run review on commit)
- Integration with external review tools or linters
- Review scoring or metrics

## Acceptance Criteria

- [ ] `esper:explore` interviews the user, explores the codebase, and saves a markdown exploration doc
- [ ] `esper:review` reads branch diffs and provides structured code review feedback
- [ ] `esper:revise` lets the user give feedback on plan/phase/fix documents and applies their revisions
- [ ] All three skills install correctly via `esperkit install`
- [ ] Existing skills remain backward compatible

## Phase Notes

Phase 3 wrapped cleanly. No carry-forward items. The three new skills follow the same pattern as existing skills — markdown SKILL.md files in `skills/` directories, installed via `bin/cli.js`.

## Shipped Plans
- #021 — Add esper:explore skill for pre-planning investigation: Create esper-explore SKILL.md with 5-step workflow plus lib/exploration.js CLI module. Files: SKILL.md, exploration.js, cli.js, exploration.test.js
- #022 — Add esper:review skill for code quality review: Create esper-review SKILL.md with 6-step workflow for branch/PR diff review with fix batching. Files: SKILL.md
- #023 — Add esper:revise skill for user-driven document revision: Create esper-revise SKILL.md with 6-step workflow for user feedback and iterative edits. Files: SKILL.md
