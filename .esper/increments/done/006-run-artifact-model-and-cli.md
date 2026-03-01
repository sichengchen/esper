---
id: 6
title: Run artifact model and CLI
status: done
type: feature
lane: atomic
priority: 1
created: 2026-03-01
spec: specs/esperkit-spec.md
spec_section: Autonomous Run Model
parent: 3
depends_on: 5
finished_at: 2026-03-01
---
# Run artifact model and CLI

## Context

The spec defines a run artifact model under `.esper/runs/<run-id>/` with `run.json`, `tasks/`, and `reviews/` subdirectories. No run code exists today. This increment adds the core library and CLI commands.

## Scope

1. Create `lib/run.js` with:
   - `create(incrementFile, opts)` — create a run directory, write `run.json` with frozen inputs, roles, status, and stop conditions
   - `get(runId)` — read and return run.json
   - `list()` — list all run directories
   - `stop(runId, reason)` — set run status to cancelled/escalated
   - `addTask(runId, task)` — create a task packet file under `tasks/`
   - `getTask(runId, taskId)` — read a task packet
   - `listTasks(runId)` — list tasks in a run
   - `addReview(runId, review)` — create a review record under `reviews/`
   - `listReviews(runId)` — list reviews in a run
   - `updateStatus(runId, status)` — update run status
2. Define `run.json` schema: `id`, `increment`, `spec_snapshot`, `roles`, `status`, `tasks`, `reviews`, `stop_conditions`, `created`, `updated`
3. Define task packet schema: `id`, `parent`, `depends_on`, `spec`, `spec_section`, `base_commit`, `files_allowed`, `verification`, `acceptance_criteria`, `assigned_role`, `status`
4. Define review record schema: `id`, `run_id`, `round`, `candidate_commit`, `findings`, `repair_tasks`, `result`, `created`
5. Wire CLI subcommands: `esperkit run create <increment>`, `esperkit run get <id>`, `esperkit run list`, `esperkit run stop <id>`
6. Update context.json when a run is created/stopped
7. Add tests

## Files Affected
- lib/run.js (create — run lifecycle operations)
- bin/cli.js (modify — add `run` subcommand routing)
- lib/context.js (modify — set active_run on run create/stop)
- test/run.test.js (create — full run lifecycle tests)

## Verification
- Run: `npm test`
- Expected: run create produces valid run.json, task packets are persisted, review records are persisted, run list/get/stop work correctly, context.json reflects active_run

## Spec Impact
- None — foundational run model

## Progress
- [x] Created lib/run.js with full run lifecycle (create, get, list, stop, updateStatus)
- [x] Added task packet operations (addTask, getTask, listTasks)
- [x] Added review record operations (addReview, listReviews)
- [x] Wired esperkit run CLI subcommands (create, get, list, stop, add-task, get-task, list-tasks, add-review, list-reviews)
- [x] Run create updates context.json with active_run
- [x] Run stop clears active_run from context
- [x] Created test/run.test.js with 11 tests
- [x] All 104 tests pass
