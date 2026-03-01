---
id: 13
title: Enhance doctor health checks
status: done
type: feature
lane: atomic
parent: 9
priority: 1
created: 2026-03-01
spec: state/configuration.md
finished_at: 2026-03-01
---
# Enhance doctor health checks

## Context
The doctor command checks basic project health but doesn't verify the `runs/` directory or workflow_defaults completeness.

## Scope
- Add check for `runs/` directory existence
- Add check that all expected workflow_defaults slots are present
- Add check for `autonomous_run_policy` section

## Files Affected
- lib/doctor.js (modify — add runs/, workflow_defaults, and autonomous_run_policy checks)
- test/doctor.test.js (modify — add test for new checks)

## Verification
- Run: npm test
- Expected: all tests pass

## Spec Impact
- None

## Progress
