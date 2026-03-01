# Workflow Requirements

Status: Draft
Date: 2026-03-01

## Problem

EsperKit needs a durable, tool-neutral workflow layer for agent-assisted software development. Without strong spec and execution contracts, teams drift into chat-only planning, ambiguous ownership, and hard-to-audit agent work.

## Goals

1. Make EsperKit the source of truth for project intent, system behavior, and workflow state across tools.
2. Keep specs durable, editable, and reviewable by humans.
3. Support both Spec-to-Code and Plan-to-Spec.
4. Support bounded multi-agent execution without creating competing contracts.
5. Keep the workflow lightweight for small work and rigorous for higher-risk work.

## Non-Goals

1. Hosted orchestration platforms.
2. Full project-management suites.
3. Replacing CI/CD, issue trackers, or source control.
4. Long-running background schedulers.

## Functional Requirements

### Spec Authoring

- The spec tree must support behavior descriptions, user flows, functional requirements, non-functional requirements, state models, interfaces, rollout notes, and open questions.
- The spec tree must be split across multiple focused files, not forced into one monolithic document.
- The spec tree may include reusable engineering patterns when that reduces repeated rediscovery.
- Code-to-spec generation must be handled by the instruction layer, not the CLI alone.

### Delivery Discipline

- Baseline validation state should be re-established before active execution resumes when checks are configured.
- For bounded, testable changes, red-green work is preferred over broad code-first edits.
- When approved behavior scenarios exist, failing tests should be derived from those scenarios first.
- Behavior-changing work must update behavior descriptions before close-out.
- Review may require explanation artifacts when correctness alone is insufficient for safe handoff.

### Increment And Run Discipline

- Increments must link to relevant spec files or sections.
- When behavior changes are in scope, increments must link to the governing behavior description or scenario set.
- In Spec-to-Code, the parent increment is an execution ledger derived from the approved spec.
- In Plan-to-Spec, the parent increment is the approval artifact.
- Autonomous runs must preserve the approved scope and stop on ambiguity, conflict, or configured limits.

## Success Criteria

1. A user can approve a spec and proceed directly into Spec-to-Code execution without a second increment-plan approval gate.
2. A user can still review and approve increment plans in Plan-to-Spec.
3. Users can inspect behavior descriptions and concrete scenarios before implementation.
4. Agents can derive test-first execution from approved behavior scenarios.
5. An autonomous run can decompose, review, repair, and return control without losing the governing scope contract.
6. An external tool can read one machine-readable runtime file and one human-readable workflow file to understand the current project state.
7. Existing projects can be explicitly upgraded into the current model with a clear path.
8. Blocking verification behavior is genuinely blocking.

## Risks

1. Too much ceremony could slow small work.
2. Too many artifact types could confuse users without strong defaults.
3. Provider-specific divergence could fragment the workflow.
4. Poor task partitioning could erase the value of multiple workers.

## Rollout Plan

### Phase 1: Interoperability Foundation

- clarify the CLI toolkit vs skill-layer boundary
- add `esperkit install`
- add `esperkit init`
- add `.esper/context.json`
- add `.esper/WORKFLOW.md` plus bootstrap docs
- add migration support for generated assets

### Phase 2: Spec Foundation

- add the spec artifact model
- add the split spec-tree templates and index
- add skill-driven code-to-spec generation workflows
- add the primary spec authoring workflow
- add shared approval-and-advance semantics

### Phase 3: Increment Foundation

- add unified increment artifacts
- add increment CLI support
- add single-job smart work and queued work
- add proactive validation, spec maintenance, and PR preparation

### Phase 4: Autonomous Run Foundation

- add run artifacts under `.esper/runs/`
- add run metadata in increments and runtime context
- add bounded orchestration rules for task delegation, review, and repair loops
- add role-mapping defaults for mixed-provider execution
- add recovery and resume behavior for interrupted runs

### Phase 5: Spec Synchronization And Drift Detection

- add stronger drift detection
- add clearer traceability between shipped work and spec maintenance
- add stronger close-out rules for behavior-changing work

## Open Questions

1. Should Plan-to-Spec eventually support the same autonomous run model?
2. How strict should requirement traceability be for very small increments?
3. Should behavior scenarios gain stable IDs by default?
