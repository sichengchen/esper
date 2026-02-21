---
id: 17
title: Rewrite backlog display as Node.js subcommand
status: done
type: feature
priority: 2
phase: 002-cli-subcommands-and-github-issues
branch: feature/phase-2
created: 2026-02-18
shipped_at: 2026-02-19
pr: https://github.com/sichengchen/esper/pull/4
---
# Rewrite backlog display as Node.js subcommand

## Context

`skills/esper-backlog/backlog.sh` is a 117-line bash script that parses plan frontmatter with `awk`, sorts by priority/date, and formats a table. It duplicates the frontmatter parsing that `lib/frontmatter.js` (plan 012) will provide. Rewriting it as `esper backlog` consolidates all plan file operations into Node.js and eliminates the bash script dependency.

The skill (`skills/esper-backlog/SKILL.md`) currently tells Claude to run `bash ~/.claude/skills/esper-backlog/backlog.sh`. After this change, it will call `esper backlog` (or `node <path>/bin/cli.js backlog`) instead.

Current backlog.sh behavior:
- ACTIVE section: lists plans in `active/` with `#id · title [phase] branch: X`
- PENDING section: lists plans in `pending/` sorted by priority asc, id asc — `#id · title pN [phase]`
- DONE section: last 3 plans in `done/` sorted by `shipped_at` desc — `#id · title shipped DATE`
- Empty backlog message if no plans found

## Approach

1. Create `lib/backlog.js` with a `display()` function:
   - Import `parseFrontmatter` from `lib/frontmatter.js` (depends on plan 012)
   - Read plan files from `active/`, `pending/`, `done/` using shared plan-reading logic
   - Format output identically to the current bash script (same column widths, same sections)
   - Support `--format json` flag for machine-readable output (array of all plans grouped by status)
   - Support `--phase <slug>` flag to filter by phase (default: show all)

2. Wire into `bin/cli.js` router: `esper backlog [--format json|table] [--phase <slug>]`

3. Update `skills/esper-backlog/SKILL.md`:
   - Step 2: replace `bash ~/.claude/skills/esper-backlog/backlog.sh` with `esper backlog` (or `node <cli-path> backlog`)
   - Keep Steps 1, 3, 4 unchanged

4. Remove `skills/esper-backlog/backlog.sh` — no longer needed

5. Add tests in `test/backlog.test.js`:
   - Set up a temp `.esper/plans/` with sample plan files across active/pending/done
   - Run `esper backlog` and verify output matches expected format
   - Test `--format json` returns valid JSON
   - Test empty backlog

## Files to change

- `lib/backlog.js` (create — backlog display logic)
- `bin/cli.js` (modify — add `backlog` subcommand routing)
- `skills/esper-backlog/SKILL.md` (modify — replace bash call with CLI subcommand)
- `skills/esper-backlog/backlog.sh` (delete — replaced by lib/backlog.js)
- `test/backlog.test.js` (create — backlog display tests)

## Verification

- Run: `npm test`
- Expected: all tests pass; `esper backlog` output matches current `backlog.sh` output format
- Edge cases:
  - Empty backlog (no plans in any directory) → prints empty message
  - Only done plans (no active/pending) → shows only DONE section
  - Plans with missing optional fields (`shipped_at` not set) → defaults gracefully
  - `--format json` with no plans → returns `[]`

## Progress
- Milestone 1: Created lib/backlog.js, wired into cli.js, updated skill, deleted backlog.sh, added 5 tests
- Modified: lib/backlog.js (create), bin/cli.js, skills/esper-backlog/SKILL.md, skills/esper-backlog/backlog.sh (deleted), test/backlog.test.js (create)
- Verification: npm test — 49 tests pass
