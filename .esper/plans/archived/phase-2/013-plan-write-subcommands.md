---
id: 013
title: Add esper plan mutation subcommands — activate, suspend, finish, archive, set
status: done
shipped_at: 2026-02-18
type: feature
priority: 1
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
---

# Add esper plan mutation subcommands — activate, suspend, finish, archive, set

## Context

Skills frequently move plan files between directories and update frontmatter fields. These operations are the highest token cost because they require Claude to read the file, parse frontmatter, modify fields, rewrite the file, and then move it — all inline. Extracting these into CLI subcommands means a skill can run `esper plan activate 012-plan-read.md` and the move + status update happens in one call.

Depends on plan 012 for `lib/frontmatter.js` (parseFrontmatter, serializeFrontmatter).

## Approach

1. Add mutation functions to `lib/plan.js`:

   **`activate(filename)`** — Move plan from `pending/` to `active/`, set `status: active` in frontmatter. Print the activated plan's title. Exit 1 if file not found in pending/.

   **`suspend(filename)`** — Move plan from `active/` to `pending/`, set `status: pending`. Exit 1 if file not found in active/.

   **`finish(filename)`** — Move plan from `active/` to `done/`, set `status: done` and `shipped_at: <YYYY-MM-DD>`. Do NOT set `pr:`. Exit 1 if file not found in active/.

   **`archive(phase)`** — Move all `.md` files from `done/` whose `phase:` matches the given phase to `archived/<phase>/`. Create the archived directory if needed. Print count of archived files. Exit 0 even if no files match.

   **`set(filename, key, value)`** — Find the plan file (search pending/, active/, done/, archived/*/), update the frontmatter field `key` to `value`, write back. If key doesn't exist, add it. Print the updated value.

2. Wire into `bin/cli.js` router: `esper plan activate|suspend|finish|archive|set`

3. Add tests in `test/plan-mutations.test.js` — set up temp `.esper/plans/` directories, run mutations, verify file locations and frontmatter content.

## Files to change

- `lib/plan.js` (modify — add activate, suspend, finish, archive, set functions)
- `bin/cli.js` (modify — extend plan subcommand routing)
- `test/plan-mutations.test.js` (create — mutation tests)

## Verification

- Run: `npm test`
- Expected: all tests pass
- Edge cases:
  - `activate` when file is not in pending/ → exit 1 with clear error
  - `finish` sets `shipped_at` to today's date in YYYY-MM-DD format
  - `archive` with no matching plans → prints "0 plans archived", exits 0
  - `archive` with plans from mixed phases → only moves matching ones
  - `set` on a plan in archived/phase-1/ → finds and updates it
  - `set` with a field that doesn't exist yet → adds it to frontmatter

## Progress

- Added 5 mutation functions to `lib/plan.js`: activate, suspend, finish, archive, set
- All use clean read-write-delete pattern with top-level unlink import
- Extended `bin/cli.js` plan routing for all 5 new actions
- Created `test/plan-mutations.test.js`: 13 tests covering all operations and edge cases
- Modified: lib/plan.js, bin/cli.js, test/plan-mutations.test.js
- Verification: passed — all 39 tests pass
