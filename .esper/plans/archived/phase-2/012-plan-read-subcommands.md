---
id: 012
title: Add esper plan read subcommands — list, get, next-id
status: done
shipped_at: 2026-02-18
type: feature
priority: 1
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
---

# Add esper plan read subcommands — list, get, next-id

## Context

Skills read plan files constantly: listing plans by phase/status, parsing frontmatter from a single file, and scanning all directories for the highest ID. These operations require Claude to read multiple files and parse YAML frontmatter inline, which burns tokens. Moving them to CLI subcommands means a skill can call `esper plan list --phase phase-2 --dir pending --format json` and get structured data back in one shot.

Frontmatter format is simple YAML between `---` delimiters at the top of each `.md` file. Fields: `id`, `title`, `status`, `type`, `priority`, `phase`, `branch`, `created`, `shipped_at`, `pr`, `gh_issue`.

Plan directories: `.esper/plans/pending/`, `.esper/plans/active/`, `.esper/plans/done/`, `.esper/plans/archived/*/`.

## Approach

1. Create `lib/plan.js` with three exported functions:

   **`list(options)`** — Read `.md` files from specified directories, parse frontmatter, filter and sort:
   - `--dir pending|active|done|archived` (default: all of pending, active, done)
   - `--phase <slug>` — filter by `phase:` field
   - `--type fix|feature` — filter by `type:` field
   - `--format json|table` (default: table)
   - `--sort priority|id` (default: priority asc, then id asc)
   - Table format: `#id  title  status  type  priority  phase`
   - JSON format: array of frontmatter objects

   **`get(filepath)`** — Read a single plan file, return its frontmatter as JSON to stdout. If filepath is just a filename (e.g. `011-cli-subcommand-infra.md`), search across pending/, active/, done/ to find it.

   **`nextId()`** — Scan all plan directories (pending, active, done, archived/*) for the highest `id:` value, return `id + 1` zero-padded to 3 digits.

2. Write a shared `parseFrontmatter(content)` utility in `lib/frontmatter.js`:
   - Split on `---` delimiters
   - Parse key-value pairs (simple YAML: `key: value` per line)
   - Return `{ frontmatter: {}, body: string }`
   - Also export `serializeFrontmatter(obj)` for write operations in the next plan

3. Wire into `bin/cli.js` router: `esper plan list|get|next-id`

4. Add tests in `test/plan.test.js`

## Files to change

- `lib/plan.js` (create — list, get, nextId handlers)
- `lib/frontmatter.js` (create — parseFrontmatter, serializeFrontmatter)
- `bin/cli.js` (modify — add `plan` subcommand routing)
- `test/plan.test.js` (create — tests for plan read subcommands)

## Verification

- Run: `npm test`
- Expected: all tests pass
- Edge cases:
  - `esper plan list` with no plans → empty table, exit 0
  - `esper plan list --dir archived` → scans all subdirectories of archived/
  - `esper plan get` with a filename that exists in multiple dirs → return the first match (active > pending > done)
  - `esper plan next-id` with no plans → returns `001`
  - `esper plan next-id` with plans up to 010 in archived → returns `011`
  - Frontmatter with missing optional fields (no `type:`, no `pr:`) → parsed as undefined, not error

## Progress

- Created `lib/frontmatter.js`: parseFrontmatter (--- delimiters, key: value parsing, numeric coercion, quote stripping) and serializeFrontmatter
- Created `lib/plan.js`: list (--dir, --phase, --type, --format json|table, sorted by priority/id), get (search active > pending > done), nextId (scan all dirs including archived/*)
- Updated `bin/cli.js`: added plan subcommand routing with parseFlags helper for --key value args
- Created `test/plan.test.js`: 12 tests covering all subcommands and edge cases
- Modified: lib/frontmatter.js, lib/plan.js, bin/cli.js, test/plan.test.js
- Verification: passed — all 26 tests pass
