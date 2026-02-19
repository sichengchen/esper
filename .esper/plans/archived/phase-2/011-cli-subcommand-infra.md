---
id: 011
title: Add subcommand routing and esper config commands
status: done
shipped_at: 2026-02-18
type: feature
priority: 1
phase: phase-2
branch: feature/phase-2
created: 2026-02-18
---

# Add subcommand routing and esper config commands

## Context

`bin/cli.js` currently has a single `install()` function that runs unconditionally. To support subcommands like `esper config check` and `esper plan list`, the CLI needs a routing layer that dispatches to the right handler based on `process.argv`. The `install` behavior becomes the default (no subcommand) to maintain backwards compatibility with `npx @sichengchen/esper`.

`esper.json` is read by every single skill as a setup guard and for config values. Three subcommands cover all access patterns:
- `esper config check` — exits 0 if `.esper/esper.json` exists, 1 if not (replaces inline `existsSync` in every skill's Step 1)
- `esper config get [key]` — prints a config value (or the whole file as JSON if no key given)
- `esper config set <key> <value>` — updates a field in esper.json (only used by `esper:phase` to bump `current_phase`)

## Approach

1. Refactor `bin/cli.js`:
   - Parse `process.argv[2]` as the subcommand (`config`, `plan`, or default to `install`)
   - Parse `process.argv[3]` as the action (`check`, `get`, `set`)
   - Keep `install()` as the default when no subcommand is given
   - Add `config(action, args)` handler
   - Import handlers from separate modules: `lib/config.js`, keeping cli.js as the thin router

2. Create `lib/config.js` with three exported functions:
   - `check()` — look for `.esper/esper.json` relative to `process.cwd()`, exit 0 or 1
   - `get(key)` — read and parse `.esper/esper.json`, print `json[key]` if key given, or `JSON.stringify(json, null, 2)` if not
   - `set(key, value)` — read `.esper/esper.json`, set `json[key] = value` (parse value as JSON if possible, else string), write back

3. Update `package.json` if needed (bin entry stays `"esper": "bin/cli.js"`)

4. Add tests for config subcommands in `test/config.test.js`

## Files to change

- `bin/cli.js` (modify — add subcommand routing, keep install as default)
- `lib/config.js` (create — config check/get/set handlers)
- `test/config.test.js` (create — tests for config subcommands)

## Verification

- Run: `npm test`
- Expected: existing install tests still pass; new config tests pass
- Edge cases:
  - `esper` with no args → runs install (backwards compatible)
  - `esper config check` outside an esper project → exits 1
  - `esper config get current_phase` → prints `phase-2`
  - `esper config get` with no key → prints full JSON
  - `esper config set current_phase phase-3` → updates the file
  - `esper config set` with a JSON value like `{"test":"npm test"}` → parses correctly

## Progress

- Refactored `bin/cli.js` as thin router: subcommand dispatch (config, install default), lazy imports
- Created `lib/config.js`: check (exit 0/1), get (key or full JSON), set (JSON-aware value parsing)
- Updated `package.json`: test script runs `test/*.test.js` glob; added `lib/` to files array
- Created `test/config.test.js`: 9 tests covering check/get/set + backwards-compatible install
- Modified: bin/cli.js, lib/config.js, test/config.test.js, package.json
- Verification: passed — all 14 tests pass
