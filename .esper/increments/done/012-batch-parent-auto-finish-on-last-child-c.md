---
id: 12
title: Batch parent auto-finish on last child completion
status: done
type: fix
lane: atomic
parent: 9
priority: 1
created: 2026-03-01
spec: state/model.md
finished_at: 2026-03-01
---
# Batch parent auto-finish on last child completion

## Context
When the last child of a batch finishes and no more pending children remain, the batch parent increment stays stranded in `active/`. The spec says increments should move to `done/` when complete.

## Scope
- In `increment finish`, when the last batch child completes (no next pending child), automatically finish the batch parent too
- Move both the child and parent to `done/`

## Files Affected
- lib/increment.js (modify — auto-finish batch parent when last child completes)
- test/increment-mutations.test.js (modify — add test for batch parent auto-finish)

## Verification
- Run: npm test
- Expected: all tests pass, batch parent moves to done/ when last child finishes

## Spec Impact
- None

## Progress
