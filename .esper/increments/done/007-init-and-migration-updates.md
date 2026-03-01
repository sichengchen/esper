---
id: 7
title: Init and migration updates
status: done
type: feature
lane: atomic
priority: 1
created: 2026-03-01
spec: specs/esperkit-spec.md
spec_section: Initialization, Project Asset Migration
parent: 3
depends_on: 6
finished_at: 2026-03-01
---
# Init and migration updates

## Context

`esperkit init` currently creates the `.esper/` directory structure including `increments/` subdirs but does not create `.esper/runs/`. Config defaults need updating for the new schema fields. Migration needs to upgrade existing projects.

## Scope

1. Update `lib/init.js` to create `.esper/runs/` directory during init
2. Update `lib/init.js` to write extended config defaults (new `workflow_defaults` prompt strings, `spec_policy`, `increment_policy`, `agent_roles`, `autonomous_run_policy`, `provider_defaults`)
3. Update `lib/migrate.js` to:
   - Detect old `workflow_defaults` closed-control fields and convert to prompt-style strings
   - Add missing new top-level config sections with sensible defaults
   - Create `.esper/runs/` if missing
   - Bump schema version appropriately
4. Update tests

## Files Affected
- lib/init.js (modify — create runs dir, write extended defaults)
- lib/migrate.js (modify — add migration for new config fields and runs dir)
- test/init.test.js (modify — verify runs dir and new defaults)
- test/migrate.test.js (modify — test migration from old to new schema)

## Verification
- Run: `npm test`
- Expected: fresh init creates `.esper/runs/`, config has all new fields, migration converts old projects cleanly

## Spec Impact
- None — infrastructure change

## Progress
- [x] Init creates .esper/runs/ directory
- [x] Migration converts old workflow_defaults to prompt-style strings
- [x] Migration adds spec_policy, increment_policy, agent_roles, autonomous_run_policy, provider_defaults
- [x] Migration upgrades schema_version from 1 to 2
- [x] Migration creates .esper/runs/ if missing
- [x] Added 2 new tests (runs dir in migration, v1→v2 config migration)
- [x] Updated init test to check for runs dir
- [x] All 106 tests pass
