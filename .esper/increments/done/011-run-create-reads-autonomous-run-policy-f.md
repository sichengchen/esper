---
id: 11
title: Run create reads autonomous_run_policy from config
status: done
type: fix
lane: atomic
parent: 9
priority: 1
created: 2026-03-01
spec: state/configuration.md
finished_at: 2026-03-01
---
# Run create reads autonomous_run_policy from config

## Context
`run create` hardcodes stop_conditions (max_review_rounds: 3, max_runtime_minutes: 60, max_cost: null) instead of reading from the project's `autonomous_run_policy` in esper.json.

## Scope
- Read `esper.json` in `run create` and use `autonomous_run_policy` fields for stop conditions
- Fall back to hardcoded defaults when config is absent

## Files Affected
- lib/run.js (modify — read config for stop conditions)
- test/run.test.js (modify — verify stop conditions come from config)

## Verification
- Run: npm test
- Expected: all tests pass, run.json stop_conditions reflect config values

## Spec Impact
- None

## Progress
