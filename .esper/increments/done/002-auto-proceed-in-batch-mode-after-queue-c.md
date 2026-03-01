---
id: 2
title: Auto-proceed in batch mode after queue confirmation
status: done
type: feature
lane: atomic
priority: 1
created: 2026-03-01
finished_at: 2026-03-01
---
# Auto-proceed in batch mode after queue confirmation

## Context

Currently, after `esper:batch` creates a queue and the user runs `esper:go`, it implements only the first child increment and stops. The user must manually run `esper:go` again for each subsequent child. This creates unnecessary friction — the user already reviewed and approved the full queue, so `esper:go` should loop through all children automatically.

## Scope

1. **Add batch loop to `esper:go` Branch B/C**: When the active increment is a child of a batch parent, after finishing a child increment, `esper:go` should automatically read the next activated child and continue implementing it — looping until all children in the batch are done.
2. **`esper:batch` unchanged** — it stays in plan mode as before.

## Files Affected
- `skills/esper-go/SKILL.md` (modify — add batch auto-loop behavior after finishing a child increment)

## Verification
- Run: `npm test`
- Expected: All existing tests pass (this is a skill instruction change, not a code change)
- Manual: Create a batch, run `esper:go`, and verify it implements all children in sequence without stopping

## Spec Impact
- None — this is a skill instruction change only

## Progress
- [x] Added Step 4 (Batch auto-loop) to `skills/esper-go/SKILL.md`
- [x] Updated Branch C to reference Step 4 after finishing a child increment
- [x] All 87 tests pass
