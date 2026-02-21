---
id: 24
title: Rename phase files and references from phase-N to NNN-slug format
status: done
type: feature
priority: 2
phase: 004-exploration-and-review-skills
branch: feature/phase-4
created: 2026-02-21
shipped_at: 2026-02-21
pr: https://github.com/sichengchen/esper/pull/8
---
# Rename phase files and references from phase-N to NNN-slug format

## Context

Phase files are currently named `phase-N.md` (e.g. `phase-1.md`, `phase-4.md`). The `current_phase` config value stores `phase-N` and this value cascades everywhere: plan frontmatter (`phase:` field), archive directories (`archived/phase-N/`), branch names (`feature/phase-N`), and all skill files that construct paths like `.esper/phases/<current_phase>.md`.

The new naming convention is `NNN-kebab-case-slug.md` (e.g. `001-initial-setup.md`, `004-exploration-review-skills.md`). This matches the plan file naming convention and is more descriptive.

This is a full rename: `current_phase` config value, plan frontmatter, archive dirs, and branch names all adopt the new format.

### Files and patterns affected

**Skill files** (construct phase file paths via `<current_phase>.md`):
- `esper-phase/SKILL.md` — reads/writes phase files, computes next phase number from `phase-N` pattern (Step 6), must change to parse `NNN-` prefix
- `esper-plan/SKILL.md` — reads phase file for scope context
- `esper-fix/SKILL.md` — reads phase file for scope context
- `esper-init/SKILL.md` — creates initial phase file as `phase-1.md`, sets `current_phase: "phase-1"`
- `esper-ship/SKILL.md` — reads phase file for PR creation
- `esper-finish/SKILL.md` — reads phase file to append shipped plan summary
- `esper-apply/SKILL.md` — reads `current_phase`
- `esper-continue/SKILL.md` — reads `current_phase`
- `esper-yolo/SKILL.md` — reads phase file, creates PR

**Config**: `current_phase` in `.esper/esper.json` — changes from `phase-4` to `004-exploration-review-skills`

**Plan frontmatter**: `phase:` and `branch:` fields in all pending/active/done/archived plans

**Archive dirs**: `.esper/plans/archived/phase-N/` directories

**Existing phase files**: 4 files in `.esper/phases/` to rename

**Tests**: Multiple test files hardcode `phase-1`, `phase-2` patterns

## Approach

1. **Rename existing phase files** — rename all 4 phase files:
   - `phase-1.md` → `001-initial-setup.md` (derive slug from title in frontmatter)
   - `phase-2.md` → `002-cli-primitives.md`
   - `phase-3.md` → `003-codex-support.md`
   - `phase-4.md` → `004-exploration-review-skills.md`
   - Update the `phase:` field in each file's frontmatter to match the new filename (without `.md`)

2. **Update `current_phase` config** — run `esperkit config set current_phase 004-exploration-review-skills`

3. **Update plan frontmatter** — for all plans in `done/` and `archived/`, update `phase:` and `branch:` fields. Done plans for phase-4: update `phase: phase-4` → `phase: 004-exploration-review-skills`, `branch: feature/phase-4` → `branch: feature/004-exploration-review-skills`

4. **Rename archive directories** — rename `.esper/plans/archived/phase-N/` to match new phase slugs

5. **Update `esper-init/SKILL.md`** — change initial phase creation from `phase-1.md` to `001-slug.md`, update config initialization from `"current_phase": "phase-1"` to `"current_phase": "001-<slug>"`

6. **Update `esper-phase/SKILL.md`** — change Step 6 (compute next phase number) from parsing `phase-N` to parsing `NNN-` prefix. The next phase number is extracted from the zero-padded prefix. Change phase file creation in Step 7 to use `NNN-slug.md` format

7. **Update all other skill files** — all skills that reference `<current_phase>.md` already use the config value dynamically, so they should work automatically once `current_phase` stores the new format. Verify each skill file doesn't hardcode `phase-` patterns

8. **Update tests** — change all hardcoded `phase-1`, `phase-2` references in test files to the new format (or use test-appropriate slugs like `001-test-phase`)

## Files to change

- `.esper/phases/phase-1.md` → `.esper/phases/001-initial-setup.md` (rename + update frontmatter)
- `.esper/phases/phase-2.md` → `.esper/phases/002-cli-primitives.md` (rename + update frontmatter)
- `.esper/phases/phase-3.md` → `.esper/phases/003-codex-support.md` (rename + update frontmatter)
- `.esper/phases/phase-4.md` → `.esper/phases/004-exploration-review-skills.md` (rename + update frontmatter)
- `.esper/esper.json` (modify — update `current_phase`)
- `.esper/plans/done/*.md` (modify — update `phase:` and `branch:` frontmatter)
- `.esper/plans/archived/phase-1/` → `.esper/plans/archived/001-initial-setup/` (rename)
- `.esper/plans/archived/phase-2/` → `.esper/plans/archived/002-cli-primitives/` (rename)
- `.esper/plans/archived/phase-3/` → `.esper/plans/archived/003-codex-support/` (rename)
- `skills/esper-init/SKILL.md` (modify — new initial phase naming)
- `skills/esper-phase/SKILL.md` (modify — parse NNN prefix instead of phase-N, create NNN-slug.md)
- `skills/esper-yolo/SKILL.md` (modify — verify no hardcoded phase-N patterns)
- `skills/esper-ship/SKILL.md` (modify — verify no hardcoded phase-N patterns)
- `skills/esper-finish/SKILL.md` (modify — verify no hardcoded phase-N patterns)
- `test/plan.test.js` (modify — update phase references)
- `test/plan-mutations.test.js` (modify — update phase references)
- `test/backlog.test.js` (modify — update phase references)
- `test/config.test.js` (modify — update phase references)
- `test/exploration.test.js` (modify — update phase references)
- `test/github-issues.test.js` (modify — update phase references)

## Verification

- Run: `node --test test/*.test.js`
- Expected: all tests pass with new naming convention
- Edge cases: archived plan directories rename correctly, `esper-phase` correctly parses NNN prefix to compute next phase number, branch names with new format work with git

## Progress
- Renamed all 4 phase files to NNN-slug format with updated frontmatter
- Updated current_phase config to 004-exploration-and-review-skills
- Updated phase: field in all 25 plan files (done, active, pending, archived)
- Renamed 3 archive directories (phase-1→001-polish-and-publish, etc.)
- Updated esper-init/SKILL.md to create 001-<slug>.md format
- Updated esper-phase/SKILL.md Step 6 to parse NNN prefix
- Fixed hardcoded phase-N references in esper-revise and esper-ship
- Updated all 6 test files with NNN-slug phase names
- Modified: 4 phase files, esper.json, 25 plan files, 3 archive dirs, 4 skill files, 6 test files
- Verification: 64/64 tests pass
