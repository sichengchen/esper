---
id: 14
title: Migrate all skills to use CLI subcommands
status: done
type: feature
priority: 2
phase: 002-cli-subcommands-and-github-issues
branch: feature/phase-2
created: 2026-02-18
shipped_at: 2026-02-19
pr: https://github.com/sichengchen/esper/pull/4
---
# Migrate all skills to use CLI subcommands

## Context

With `esper config` and `esper plan` subcommands built (plans 011-013), every skill can replace its inline file operations with CLI calls. This is the migration step — update all 10 SKILL.md files to use the new subcommands.

Current skills: esper-init, esper-apply, esper-backlog, esper-continue, esper-finish, esper-fix, esper-phase, esper-plan, esper-ship, esper-yolo.

The highest-impact replacements (by token savings):
1. **Setup guard** (every skill Step 1): replace `existsSync` check with `esper config check`
2. **Plan listing** (backlog, apply, phase, ship, yolo): replace multi-file reads with `esper plan list`
3. **Plan activation/finish/archive** (apply, finish, yolo, phase, ship): replace move+rewrite with single CLI call
4. **Next ID** (init, plan, fix, phase): replace directory scan with `esper plan next-id`
5. **Frontmatter updates** (ship, fix, plan): replace read-modify-write with `esper plan set`
6. **Config reads** (every skill): replace JSON.parse of esper.json with `esper config get`

## Approach

For each skill, replace inline file operations with the equivalent CLI subcommand. Preserve all skill logic — only the mechanics of reading/writing plan files change. The skill's decision-making, user interaction, and git operations stay the same.

## Files to change

- `skills/esper-init/SKILL.md` (modify)
- `skills/esper-apply/SKILL.md` (modify)
- `skills/esper-backlog/SKILL.md` (modify)
- `skills/esper-continue/SKILL.md` (modify)
- `skills/esper-finish/SKILL.md` (modify)
- `skills/esper-fix/SKILL.md` (modify)
- `skills/esper-phase/SKILL.md` (modify)
- `skills/esper-plan/SKILL.md` (modify)
- `skills/esper-ship/SKILL.md` (modify)
- `skills/esper-yolo/SKILL.md` (modify)

## Progress
- Milestone 1: Migrated esper-apply, esper-finish, esper-continue to CLI subcommands
- Milestone 2: Migrated esper-backlog, esper-fix, esper-plan to CLI subcommands
- Milestone 3: Migrated esper-init, esper-ship, esper-phase, esper-yolo to CLI subcommands
- Modified: all 10 skills/*/SKILL.md files
- Verification: npm test — 39 tests pass
