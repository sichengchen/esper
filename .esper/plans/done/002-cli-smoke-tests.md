---
id: 002
title: Add CLI smoke tests
status: done
priority: 2
phase: phase-1
branch: feature/cli-smoke-tests
created: 2026-02-18
shipped_at: 2026-02-18
---

# Add CLI smoke tests

## Context

`bin/cli.js` is the npm installer — it copies skill directories from `skills/` to `~/.claude/skills/`. There are currently no automated tests. The `package.json` references `node >=18` and uses ESM (`"type": "module"`). The Node.js built-in test runner (`node:test`) is available from Node 18+.

## Approach

1. Create `test/cli.test.js` using `node:test` and `node:assert`
2. Write smoke tests that:
   - Import and invoke the install logic against a temp directory (not the real `~/.claude/skills/`)
   - Verify that each skill directory is copied correctly
   - Verify that existing skill directories are updated (overwritten) without error
   - Verify the process exits cleanly (exit code 0)
3. Refactor `bin/cli.js` minimally to accept a target directory override for testability (env var `ESPER_SKILLS_DIR` or a function export) — keep the change minimal
4. Update `package.json` scripts: add `"test": "node --test test/"`

## Files to change

- `test/cli.test.js` (create — smoke tests using node:test)
- `bin/cli.js` (modify — accept `ESPER_SKILLS_DIR` env var override for testability)
- `package.json` (modify — add `"scripts": { "test": "node --test test/" }`)

## Verification

- Run: `node --test test/`
- Expected: All tests pass, output shows `pass` for each case
- Edge cases: Test with a fresh temp dir (no existing skills) and a pre-populated temp dir (updating)

## Progress

- Modified `bin/cli.js`: added `ESPER_SKILLS_DIR` env var override (defaults to `~/.claude/skills`)
- Created `test/cli.test.js`: 3 smoke tests using `node:test` — fresh install, update existing, exit code 0
- Updated `package.json`: added `"test": "node --test test/cli.test.js"` (note: `test/` directory form fails on Node 24; explicit file path used)
- Modified: bin/cli.js, test/cli.test.js, package.json
- Verification: passed — all 3 tests pass via `npm test`
