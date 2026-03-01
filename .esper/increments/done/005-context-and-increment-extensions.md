---
id: 5
title: Context and increment extensions
status: done
type: feature
lane: atomic
priority: 1
created: 2026-03-01
spec: specs/esperkit-spec.md
spec_section: Runtime Contract, Increment Model
parent: 3
depends_on: 4
finished_at: 2026-03-01
---
# Context and increment extensions

## Context

`context.json` currently tracks `active_increment`, `active_increment_scope`, `workflow_mode`, and `commands`. The spec adds `active_run` and `active_execution_mode`. Increment frontmatter needs `execution_mode`, `run_id`, and `spec_version` fields.

## Scope

1. Add `active_run` field to context.json (null when no run, run ID string when active)
2. Add `active_execution_mode` field to context.json ("interactive" or "autonomous", derived from active increment)
3. Update `lib/context.js` to build and publish new fields
4. Add `execution_mode` to increment frontmatter defaults (default: "interactive")
5. Add `run_id` to increment frontmatter defaults (default: null)
6. Add `spec_version` to increment frontmatter defaults (default: null)
7. Update `lib/increment.js` to handle new frontmatter fields
8. Update increment template
9. Update tests

## Files Affected
- lib/context.js (modify — add active_run, active_execution_mode fields)
- lib/increment.js (modify — support new frontmatter fields)
- lib/templates/increment.md (modify — add execution_mode field)
- test/context.test.js (modify — test new fields)
- test/increment.test.js (modify — test new frontmatter)

## Verification
- Run: `npm test`
- Expected: context.json includes new fields, increment create produces valid frontmatter with new fields

## Spec Impact
- None — foundational model extension

## Progress
- [x] Added active_run field to context.json (scans .esper/runs/ for executing runs)
- [x] Added active_execution_mode field to context.json (derived from active increment)
- [x] Updated context.js build() with new fields and no-config fallback
- [x] Added execution_mode to increment frontmatter (default: "interactive")
- [x] Added run_id and spec_version to increment frontmatter (default: null, omitted from YAML)
- [x] Added 3 new tests (context active_run/mode, execution_mode derivation, increment fields)
- [x] All 93 tests pass
