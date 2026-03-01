---
id: 4
title: Extended configuration schema
status: done
type: feature
lane: atomic
priority: 1
created: 2026-03-01
spec: specs/esperkit-spec.md
spec_section: Configuration
parent: 3
finished_at: 2026-03-01
---
# Extended configuration schema

## Context

`esper.json` currently supports `schema_version`, `backlog_mode`, `spec_root`, `commands`, and `workflow_defaults` (with closed-control fields). The spec defines five new top-level config sections and converts `workflow_defaults` to prompt-style policy strings.

## Scope

1. Migrate `workflow_defaults` from closed-control fields (`work_mode`, `commit_granularity`, `pr_policy`, `validation_mode`, `spec_sync_mode`) to prompt-style instruction strings (`planning`, `commits`, `pull_requests`, `validation`, `spec_sync`, `review`, `retention`)
2. Add `spec_policy` section with `maintenance`, `approval`, `drift` prompt slots
3. Add `increment_policy` section with `sizing`, `batching`, `execution` prompt slots and `max_files_per_atomic_increment` number
4. Add `agent_roles` section with `orchestrator`, `implementer`, `reviewer` role mappings — each storing `provider`, `host`, `fresh_invocation`, and `launch` object
5. Add `autonomous_run_policy` section with `enabled`, `max_review_rounds`, `max_runtime_minutes`, `max_cost`, `require_distinct_reviewer`, `allow_parallel_tasks`
6. Add `provider_defaults` section with per-provider policy text and `launch_defaults`
7. Update `lib/config.js` defaults, validation, and read/write logic
8. Update `config set` CLI to handle nested keys
9. Update existing tests, add new tests for all new fields

## Files Affected
- lib/config.js (modify — add defaults, validation for new sections)
- bin/cli.js (modify — update config set to handle nested keys)
- test/config.test.js (modify — add tests for new fields)

## Verification
- Run: `npm test`
- Expected: all config tests pass, new fields round-trip correctly, defaults populate on fresh init

## Spec Impact
- None — this is foundational schema work

## Progress
- [x] Migrated workflow_defaults to prompt-style instruction strings
- [x] Added spec_policy section
- [x] Added increment_policy section
- [x] Added agent_roles section with orchestrator/implementer/reviewer
- [x] Added autonomous_run_policy section
- [x] Added provider_defaults section
- [x] Updated config.js defaults, get, and set with dot-notation support
- [x] Bumped schema_version to 2
- [x] Updated all existing tests for new schema
- [x] Added 3 new tests (dot-notation get, dot-notation set, init sections)
- [x] All 90 tests pass
