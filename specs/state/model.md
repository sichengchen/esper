# State Model

Status: Draft
Date: 2026-03-01

## Product Structure

EsperKit is a two-part product:

1. A CLI toolkit for deterministic state transitions.
2. A skills and command layer for semantic authoring and workflow orchestration.

The CLI owns durable project state. The instruction layer owns judgment-heavy authoring, review, and orchestration behavior.

## Core Concepts

### Constitution

A durable project-level document for identity, scope, and core constraints.

### Spec

The durable agent-facing documentation tree that describes intended design, current behavior, architecture, interfaces, and enduring requirements.

Spec storage rule:

- use module-first paths when the project has multiple meaningful modules
- if the project has only one module, the extra module layer is optional

### Increment

The primary persisted execution artifact.

- In Spec-to-Code, it is derived from the approved spec and acts as an execution ledger.
- In Plan-to-Spec, it is the primary planned work artifact and approval contract.

### Parent Increment

The active increment file in `.esper/increments/active/`.

### Run

A machine-readable autonomous execution record derived from the approved scope contract and its corresponding parent increment.

### Task Packet

A bounded work item inside a run. It is subordinate to the parent increment and never becomes a competing top-level contract.

### Working File

The Markdown file used as the active review-and-revise artifact.

Default rules:

- In Spec-to-Code, the working file is the target spec file or a temporary `_work/` file; after approval, the parent increment becomes the execution ledger.
- In atomic Plan-to-Spec, the active increment is the working file.
- In batch Plan-to-Spec, the parent increment is the working file.

### Runtime Context

A machine-readable summary of current Esper state for tools and hosts.

## Increment Model

The system supports two primary work modes:

- single-job mode: one atomic or bounded increment at a time
- queued mode: a series of increments processed sequentially with minimal pauses

Increment storage:

- `.esper/increments/active/` for the current active parent increment
- `.esper/increments/pending/` for queued child increments that are not yet active
- `.esper/increments/done/` for completed increments after sync and close-out
- `.esper/increments/archived/` for retained historical increments

Default lifecycle:

1. Create the active atomic or parent batch work file in `.esper/increments/active/`.
2. In batch mode, place not-yet-active child increments in `.esper/increments/pending/`.
3. Keep the current parent increment in `.esper/increments/active/` through planning, execution, review, and sync.
4. Move the increment to `.esper/increments/done/` when sync closes it.
5. Optionally move older completed increments to `.esper/increments/archived/`.

Minimum increment shape:

1. Title
2. Context
3. Scope
4. Type
5. Size or lane
6. Files affected
7. Verification
8. Spec impact
9. Progress

Recommended metadata:

- `id`
- `title`
- `status`
- `type`
- `lane`
- `execution_mode`
- `run_id`
- `parent`
- `depends_on`
- `priority`
- `created`
- `spec`
- `spec_section`

## Autonomous Run Model

The system supports a bounded autonomous execution mode for approved Spec-to-Code work.

Rules:

- autonomous execution starts only after the governing spec is approved
- the approved spec snapshot remains the sole authoritative source of scope and requirements
- the parent increment remains the active human-facing execution ledger
- task packets are run artifacts, not concurrent active increments
- the orchestrator is the only role that mutates shared `.esper/` control state
- the reviewer remains role-distinct from the implementation worker for a merged change set
- the run stops and escalates when it hits configured limits or finds ambiguity

Run storage:

- `.esper/runs/<run-id>/run.json`
- `.esper/runs/<run-id>/tasks/`
- `.esper/runs/<run-id>/reviews/`

## Filesystem Layout

Default layout:

```text
.esper/
  esper.json
  context.json
  CONSTITUTION.md
  WORKFLOW.md
  increments/
    pending/
    active/
    done/
    archived/
  runs/
    <run-id>/
      run.json
      tasks/
      reviews/

specs/
  index.md
  _work/
  core/
  workflow/
  state/
  cli/
  skills/
  patterns/
```

The actual spec root comes from `spec_root`.
