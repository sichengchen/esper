---
id: 8
title: Skills updates for autonomous execution
status: done
type: feature
lane: atomic
priority: 1
created: 2026-03-01
spec: specs/esperkit-spec.md
spec_section: Skill and Slash-Command Surface
parent: 3
depends_on: 7
finished_at: 2026-03-01
---
# Skills updates for autonomous execution

## Context

The 9 existing skills work for interactive single-agent workflows. The spec adds autonomous execution mode where `esper:go` on an autonomous increment freezes inputs, creates a run, decomposes into task packets, and manages the orchestrator-worker-reviewer loop. `esper:init` also needs to collect multi-agent preferences.

## Scope

1. Update `esper:go` SKILL.md:
   - In Branch B (active increment in plan stage), check `execution_mode`
   - If `autonomous`: freeze spec snapshot, create run via `esperkit run create`, decompose scope into task packets, describe the orchestration loop
   - Add instructions for dispatching tasks to workers and collecting results
   - Add instructions for triggering reviewer pass and processing findings
   - Add escalation rules and stop conditions
2. Update `esper:init` SKILL.md:
   - Add interview questions for `agent_roles` preferences
   - Add interview questions for `autonomous_run_policy` preferences
   - Add interview questions for `provider_defaults`
3. Update `esper:batch` SKILL.md:
   - Add queue preview fields for autonomous execution (role assignments, stop conditions)
4. Update `esper:review` SKILL.md:
   - Add instructions for reviewing against frozen run inputs when a run is active
   - Add run findings persistence

## Files Affected
- skills/esper-go/SKILL.md (modify — add autonomous execution branch)
- skills/esper-init/SKILL.md (modify — add multi-agent interview questions)
- skills/esper-batch/SKILL.md (modify — add autonomous preview fields)
- skills/esper-review/SKILL.md (modify — add run-aware review)

## Verification
- Read each updated skill file and confirm instructions cover the autonomous workflow
- Ensure backward compatibility: interactive mode still works unchanged

## Spec Impact
- Skills are the instruction layer — this completes the spec's skill surface requirements

## Progress
- [x] Updated esper:go — added Branch D (active run), autonomous execution in Branch B, run CLI commands
- [x] Updated esper:init — added Round 4 for multi-agent preferences, agent_roles, autonomous_run_policy
- [x] Updated esper:batch — added execution_mode per increment, autonomous preview fields, policy config commands
- [x] Updated esper:review — added run-aware review, frozen input checks, review record persistence, repair dispatch
- [x] All 106 tests pass (skills are instruction files, no code changes)
