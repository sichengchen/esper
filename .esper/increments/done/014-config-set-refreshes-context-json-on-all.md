---
id: 14
title: Config set refreshes context.json on all mutations
status: done
type: fix
lane: atomic
parent: 9
priority: 1
created: 2026-03-01
spec: state/configuration.md
finished_at: 2026-03-01
---
# Config set refreshes context.json on all mutations

## Context
The spec says "durable config mutations refresh context.json". Currently `config set` only syncs `commands` and `spec_root` changes to context.json. A full rebuild should run on any config mutation to ensure context stays consistent.

## Scope
- Change `syncContext` in `lib/config.js` to always rebuild context.json via `build()` after any config set
- This ensures any config field that affects context derivation is properly reflected

## Files Affected
- lib/config.js (modify — rebuild context on any config set)
- test/config.test.js (modify — verify context refresh on non-commands/spec_root mutations)

## Verification
- Run: npm test
- Expected: all tests pass

## Spec Impact
- None

## Progress
