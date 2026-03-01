---
id: 3
title: Multi-agent execution model
status: done
type: batch
lane: systematic
priority: 1
created: 2026-03-01
spec: specs/esperkit-spec.md
finished_at: 2026-03-01
---
# Multi-agent execution model

Implements the multi-agent execution model from the product spec. This adds the configuration schema, run artifacts, CLI commands, init/migration support, and skill updates needed for bounded autonomous execution in Spec-to-Code.

## Queue

1. **004 — Extended configuration schema**: Add `spec_policy`, `increment_policy`, `agent_roles`, `autonomous_run_policy`, `provider_defaults` to `esper.json`. Migrate `workflow_defaults` to prompt-style fields per spec.
2. **005 — Context and increment extensions**: Add `active_run` and `active_execution_mode` to `context.json`. Add `execution_mode`, `run_id`, `spec_version` to increment frontmatter.
3. **006 — Run artifact model and CLI**: Add `lib/run.js` with run lifecycle (create/get/list/stop). Add task packet and review record structures. Wire into `bin/cli.js` as `esperkit run` subcommands.
4. **007 — Init and migration updates**: Create `.esper/runs/` during init. Write extended config defaults for new fields. Add migration path for existing projects.
5. **008 — Skills updates for autonomous execution**: Update `esper:go` and `esper:init` skill instructions to support `execution_mode` selection and autonomous run awareness.

## Scope

- Configuration schema extensions (spec §12)
- Runtime context extensions (spec §3)
- Increment model extensions (spec §9)
- Run artifact model (spec §10)
- Run CLI commands (spec CLI surface)
- Init scaffolding for runs directory
- Migration for existing projects
- Skill instruction updates

## Verification

- `npm test` passes
- All new config fields round-trip through read/write
- Run create/get/list/stop CLI commands work
- Init creates `.esper/runs/` directory
- Migration adds new fields without destroying existing config
- Context.json reflects active_run when a run is created

## Progress

All 5 child increments completed:
- [x] 004 — Extended configuration schema (schema_version 2, 5 new config sections, dot-notation get/set)
- [x] 005 — Context and increment extensions (active_run, active_execution_mode, execution_mode frontmatter)
- [x] 006 — Run artifact model and CLI (lib/run.js, 9 CLI subcommands, task packets, review records)
- [x] 007 — Init and migration updates (.esper/runs/ dir, v1→v2 migration, config field migration)
- [x] 008 — Skills updates (esper:go, esper:init, esper:batch, esper:review updated for autonomous mode)

Final test count: 106 tests, all passing.
