---
phase: phase-2
title: CLI Subcommands and GitHub Issues Mode
status: active
---

# Phase 2: CLI Subcommands and GitHub Issues Mode

## Goal

Replace token-heavy inline file operations in skills with proper CLI subcommands (`esper config`, `esper plan`), then implement the GitHub Issues backlog mode so plans can sync with GH issues. Skills get re-consolidated after the migration.

## In Scope

- Extend `bin/cli.js` with subcommand routing (install remains the default)
- `esper config` subcommands: `check`, `get`, `set`
- `esper plan` subcommands: `list`, `get`, `set`, `next-id`, `activate`, `suspend`, `finish`, `archive`
- Migrate all skills to call CLI subcommands instead of inline file manipulation
- GitHub Issues backlog mode: create issues on plan creation, close on ship
- Skills re-consolidation: fix stale references, remove `pr_mode` remnant, ensure cross-skill consistency

## Out of Scope (deferred)

- Web dashboard or any visual interface
- Multi-agent orchestration
- Automated skill behavior testing (manual validation only)
- npm publish of 0.2.0 (ship when phase is done)

## Acceptance Criteria

- [ ] `esper config check` exits 0 in an esper project, exits 1 otherwise
- [ ] `esper config get current_phase` prints `phase-2`
- [ ] `esper plan list --phase phase-2 --format json` returns valid JSON with all phase-2 plans
- [ ] `esper plan next-id` returns the correct next ID across all directories including archived
- [ ] `esper plan activate`, `finish`, `archive` correctly move files and update frontmatter
- [ ] All skills use CLI subcommands for file operations (no inline frontmatter parsing)
- [ ] `backlog_mode: "github"` creates GH issues on plan creation and closes them on ship
- [ ] `pr_mode` is removed from `esper.json` schema and all skill references
- [ ] All smoke tests pass (`npm test`)

## Phase Notes

Phase 1 retrospective findings:
- Skills accumulated stale references during rapid iteration (pr_mode, removed skill names)
- File operations (frontmatter parsing, directory moves, status updates) are the #1 token cost in skills
- esper.json still contains the deprecated `pr_mode` field from plan 004 (superseded by plan 008's per-plan `type` system)

## Shipped Plans
- #018 — Compact plan details into phase file on archive: Add a `## Shipped Plans` section to phase files. Files: esper-finish/SKILL.md, esper-yolo/SKILL.md, esper-ship/SKILL.md, esper-phase/SKILL.md
