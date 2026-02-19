---
id: 20
title: fix: skill files reference `esper` instead of `esperkit` for CLI commands
status: done
type: fix
priority: 1
phase: phase-3
branch: fix/cli-references-in-skills
created: 2026-02-19
shipped_at: 2026-02-19
---
# fix: skill files reference `esper` instead of `esperkit` for CLI commands

## Context

The CLI binary is registered as `esperkit` in package.json (`"esperkit": "bin/cli.js"`), but all 10 SKILL.md files still use bare `esper` in backtick-wrapped and code-block CLI invocations (e.g., `` `esper config check` `` instead of `` `esperkit config check` ``). This causes command-not-found errors when Claude executes these instructions literally.

~48 individual command references need updating across every skill file.

## Approach

1. In each SKILL.md file, replace all backtick-wrapped and code-block CLI command references from `esper <subcommand>` to `esperkit <subcommand>` where subcommand is one of: `config`, `plan`, `backlog`.
2. Preserve prose references to "esper" (the project name) — only change executable CLI command contexts.
3. The affected subcommands are: `config check`, `config get`, `config set`, `plan next-id`, `plan list`, `plan activate`, `plan suspend`, `plan finish`, `plan archive`, `plan set`, `plan create-issue`, `plan close-issue`, `backlog`.

## Files to change

- `skills/esper-init/SKILL.md` (modify — 1 CLI reference)
- `skills/esper-backlog/SKILL.md` (modify — 4 CLI references)
- `skills/esper-plan/SKILL.md` (modify — 3 CLI references)
- `skills/esper-apply/SKILL.md` (modify — 6 CLI references)
- `skills/esper-continue/SKILL.md` (modify — 3 CLI references)
- `skills/esper-finish/SKILL.md` (modify — 6 CLI references)
- `skills/esper-fix/SKILL.md` (modify — 5 CLI references)
- `skills/esper-ship/SKILL.md` (modify — 8 CLI references)
- `skills/esper-phase/SKILL.md` (modify — 10 CLI references)
- `skills/esper-yolo/SKILL.md` (modify — 10 CLI references)

## Verification

- Run: `grep -rn '`esper ' skills/` and verify zero matches for bare `esper` followed by a known subcommand (config, plan, backlog) inside backticks or code blocks
- Run: `grep -rn '`esperkit ' skills/` to confirm all references now use the correct binary name
- Expected: All CLI command references use `esperkit`, all prose references to "esper" (the project) remain unchanged
- Regression check: Run `esperkit config check` to confirm the CLI itself still works; visually spot-check one skill invocation

## Progress
- Milestones: 1 commit
- Modified: skills/esper-init/SKILL.md, skills/esper-backlog/SKILL.md, skills/esper-plan/SKILL.md, skills/esper-apply/SKILL.md, skills/esper-continue/SKILL.md, skills/esper-finish/SKILL.md, skills/esper-fix/SKILL.md, skills/esper-ship/SKILL.md, skills/esper-phase/SKILL.md, skills/esper-yolo/SKILL.md
- Verification: not yet run — run /esper:finish to verify and archive
