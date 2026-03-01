# Skill Commands

Status: Draft
Date: 2026-03-01

## Role

The instruction layer translates user intent into CLI-backed state transitions while owning semantic authoring workflows.

It is responsible for:

- spec authoring
- increment authoring
- review loops
- code-to-spec generation
- multi-agent orchestration behavior

## Naming Model

The user-facing command surface should stay small, explicit, and easy to type.

Core examples:

- `esper:init`
- `esper:spec`
- `esper:go`
- `esper:atom`
- `esper:batch`
- `esper:review`
- `esper:sync`
- `esper:continue`
- `esper:context`

The primary command surface stays small. Specialized sub-workflows remain secondary.

## Command Semantics

### `esper:spec`

- reads the current spec tree and workflow state
- keeps the user in the spec revision loop
- makes behavior descriptions and concrete scenarios easy to inspect and revise when behavior is in scope
- may use `_work/` files for temporary coordination or walkthroughs
- stops in spec mode until the user explicitly advances

### `esper:init`

- confirms repository context
- runs `esperkit init`
- asks for workflow preferences before or during initialization
- explains what scaffolding was created
- directs the user to the next step: spec bootstrapping

### `esper:go`

- crosses the active approval boundary
- on a spec work file, it begins Spec-to-Code execution after materializing a derived execution ledger
- on an increment work file, it approves the increment in Plan-to-Spec
- when resuming active execution, it should re-establish current state with configured baseline checks when available
- for bounded, testable changes, it should prefer red-green work derived from approved behavior descriptions or scenarios

### `esper:review`

- compares implementation against the active increment and relevant specs
- identifies drift, regressions, missing spec maintenance, and scope creep
- may request explanation artifacts when correctness alone is not sufficient for safe review

### `esper:context`

- reads `.esper/context.json`
- summarizes the active increment, active run if any, spec root, and expected commands
- identifies the immediate next safe action

### `esper:atom`

- is the main entrypoint for atomic Plan-to-Spec work
- uses the active increment as the primary Markdown working file
- keeps the workflow in plan-authoring mode until the user explicitly advances

### `esper:batch`

- is the main entrypoint for queued or series work
- inspects the current queue
- decomposes requested work into a queue when needed
- presents a queue preview before execution
- defines role assignments and stop conditions before execution when autonomous execution is planned

### `esper:sync`

- reconciles shipped behavior back into the durable spec tree

### `esper:continue`

- resumes from project state instead of conversational memory
- should restore confidence with configured baseline checks before active execution resumes

## Optional Specialized Workflows

Hosts may expose more specific expert commands as secondary paths.

Examples:

- `esper:spec-bootstrap`
- `esper:spec-revise`
- `esper:spec-review`
- `esper:increment-new`
- `esper:increment-finish`
- `esper:run-inspect`

## Lifecycle Coverage

The instruction layer must support:

- initialization through `esper:init`
- spec authoring through `esper:spec`
- approval and stage advancement through `esper:go`
- direct-request work through `esper:atom` and `esper:batch`
- explicit review through `esper:review`
- post-implementation spec sync through `esper:sync`
- context recovery through `esper:context` and `esper:continue`

## Requirements

- commands stay consistent across hosts even when syntax differs
- commands read project artifacts instead of relying on chat memory
- commands do not introduce state formats that diverge from the CLI toolkit
- smart commands infer the current stage from project state
- smart commands proactively validate, maintain specs, and prepare reviewable outputs when configured
