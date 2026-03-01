# EsperKit User Manual

This manual introduces the revised EsperKit workflow for AI-assisted software development.
It tracks the workflow model defined in the spec tree under `specs/` (see `specs/index.md`).
It is written for day-to-day users who want to understand how EsperKit works, when to use each command, and what files EsperKit manages in the repository.

EsperKit supports two working styles:

- Spec-to-Code: define or revise the system spec first, then derive implementation work from it.
- Plan-to-Spec: start from a direct request, implement in bounded increments, then sync the shipped result back into the spec.

## What EsperKit Is

EsperKit has two parts:

- The `esperkit` CLI, which performs deterministic setup and state changes.
- A host instruction layer, exposed as skills or commands, which guides the AI agent through planning, review, execution, and sync.

The CLI owns durable project state on disk.
The instruction layer owns the collaborative workflow.

## Core Ideas

### 1. Constitution

The constitution is the durable project-level contract. It explains:

- what the project is
- what the project is not
- key technical decisions
- testing and delivery rules

### 2. Specs

Specs are the long-lived system description for humans and agents.
They describe architecture, behavior, interfaces, and constraints.
They are not temporary task notes.

### 3. Increments

An increment is a bounded unit of work.
It stores the implementation plan, progress, verification notes, and links back to the relevant specs.

### 4. Behavior Descriptions

A behavior description is a durable spec artifact that explains externally observable behavior in user-reviewable terms.

When behavior is testable, the spec should prefer concrete scenarios with explicit preconditions, a clear trigger, and explicit expected outcomes. Approved behavior descriptions are the preferred source for behavior-driven test-first work.

### 5. Working File

Every meaningful step in EsperKit centers on a Markdown working file.
That file is the shared review surface between you and the agent.

Default rules:

- In Spec-to-Code, the working file is the target spec file or a temporary `_work/` file; after approval, the parent increment becomes the execution ledger.
- In atomic Plan-to-Spec, the active increment is the working file.
- In batch Plan-to-Spec, the parent increment is the working file.

### 6. Runs

A run is a machine-readable autonomous execution record derived from the approved scope contract and its corresponding parent increment.

Run artifacts are stored under `.esper/runs/<run-id>/` with a `run.json`, `tasks/`, and `reviews/` subdirectory.

### 7. Task Packets

A task packet is a bounded work item inside a run. It is subordinate to the parent increment and never becomes a competing top-level contract.

## Command Surface

EsperKit uses a small set of primary commands.
This manual uses the canonical `esper:*` form across hosts:

- `esper:init`
- `esper:spec`
- `esper:go`
- `esper:atom`
- `esper:batch`
- `esper:review`
- `esper:sync`
- `esper:continue`
- `esper:context`

The primary command surface stays small. The workflow stays the same regardless of host integration details.

## Installation and First-Time Setup

### Install the CLI

```bash
npm install -g esperkit
```

This installs the global `esperkit` executable.

### Install the Host Instruction Layer

In the repository root:

```bash
esperkit install
```

This installs or updates the host-specific skills or command assets.
It does not create project workflow files yet.

### Initialize the Project

Run the initialization workflow through the host:

```text
esper:init
```

`esper:init` should gather your workflow preferences, call `esperkit init`, and create the local scaffolding.

Typical generated artifacts:

- `.esper/esper.json`
- `.esper/context.json`
- `.esper/WORKFLOW.md`
- `.esper/CONSTITUTION.md`
- `.esper/increments/pending/`
- `.esper/increments/active/`
- `.esper/increments/done/`
- `.esper/increments/archived/`
- `.esper/runs/`
- the spec root and its `_work/` coordination area

### Setup Flow

```mermaid
flowchart TD
    A[Install CLI<br/>npm install -g esperkit] --> B[Install Host Layer<br/>esperkit install]
    B --> C[Initialize Project<br/>esper:init]
    C --> D[Review Created Scaffolding]
    D --> E[Choose Workflow<br/>Spec-to-Code or Plan-to-Spec]
```

## Workflow 1: Spec-to-Code

Use this when you want the spec to be the source of truth before coding begins.

### Step 1. Open or Create the Spec Working File

Run:

```text
esper:spec
```

The agent should:

- read current project context
- open the relevant spec files when possible
- create a temporary `_work/<topic>.md` file when the change spans multiple specs
- keep the review loop centered on Markdown

### Step 2. Revise the Spec Until It Is Accurate

Stay in the spec loop until the spec describes the intended system behavior.

You can provide feedback by:

- chatting with the agent
- editing the spec file directly
- leaving comments in the working file

### Step 3. Approve the Spec and Begin Execution

Run:

```text
esper:go
```

When the active working file is a spec file, `esper:go` means:

- approve the current spec work
- derive a parent increment as an execution ledger
- begin execution immediately unless ambiguity, conflict, or missing approval is discovered

There is no second approval gate for a derived increment plan in Spec-to-Code. The approved spec is the sole source of scope and requirements.

If scope must change, the workflow returns to spec authoring and requires spec approval again.

### Step 4. Execution

For interactive execution:

- run the configured baseline test command first when available
- prefer red-green loops for bounded, testable changes
- derive failing tests from approved behavior descriptions or scenarios when practical

For autonomous execution:

- freeze the approved spec snapshot and the derived execution ledger
- decompose work into bounded task packets
- preserve approved scope throughout the run

### Spec-to-Code Flow

```mermaid
flowchart TD
    A[esper:spec<br/>Open spec working file] --> B[Revise spec with agent]
    B --> C{Spec approved?}
    C -->|No| B
    C -->|Yes| D[esper:go<br/>Approve spec and begin execution]
    D --> E{Execution mode?}
    E -->|Interactive| F[Lead agent implements]
    E -->|Autonomous| G[Orchestrator creates run<br/>workers implement task packets]
    F --> H[Review and sync<br/>esper:review / esper:sync]
    G --> H
```

## Workflow 2: Plan-to-Spec

Use this when you want to start from a direct request and let EsperKit structure the work from there.

There are two entry modes:

- `esper:atom` for one bounded task
- `esper:batch` for a queued series of related increments

### Atomic Mode

Run:

```text
esper:atom
```

This is the standard path for a single feature, fix, or small change.

The agent should:

- create or open the active increment working file
- translate your request into an implementation plan
- stop in plan-review mode until you explicitly approve

### Batch Mode

Run:

```text
esper:batch
```

Use batch mode when the work should be split into a queue.

The agent should provide a queue preview that shows:

- planned increments
- execution order
- high-level scope of each increment
- relevant spec files or sections expected to change
- expected validation approach
- planned agent roles for orchestration, implementation, and review when autonomous execution is enabled
- autonomous stop conditions when autonomous execution is enabled

### Approve and Implement

After the increment plan or batch queue is acceptable, run:

```text
esper:go
```

That approval advances the active increment into implementation.

### Review the Result

Run:

```text
esper:review
```

This performs an explicit verification pass against:

- the approved increment file
- the relevant spec files
- the delivered implementation

### Sync the Result Back Into the Specs

This should normally happen automatically after implementation.

Run this only when you want to force, retry, or explicitly inspect the sync step:

```text
esper:sync
```

`esper:sync` updates the specs so they match what actually shipped.
That explicit sync step is the fallback when automatic sync did not run or you want to confirm it.

### Plan-to-Spec Flow

```mermaid
flowchart TD
    A{Choose mode} -->|Single change| B[esper:atom]
    A -->|Queued work| C[esper:batch]
    B --> D[Create or revise increment plan]
    C --> D
    D --> E{Plan approved?}
    E -->|No| D
    E -->|Yes| F[esper:go<br/>Approve plan and implement]
    F --> G[esper:review]
    G --> H[Auto sync specs<br/>or esper:sync]
    H --> I[Move increment to done]
```

## Shared Daily Loop

Once a project is initialized, the day-to-day loop is simple:

1. If you are unsure of the current state, run `esper:context`.
2. Re-establish current state with configured baseline checks before active execution resumes.
3. Create or revise the current working file through `esper:spec`, `esper:atom`, or `esper:batch`.
4. Run `esper:go` to cross the active approval boundary and advance the workflow.
5. Let the workflow proactively validate, maintain specs, and emit explanations when review risk is high.
6. Use `esper:review` for explicit implementation verification.
7. Use `esper:sync` for post-implementation spec maintenance, or let the agent sync automatically.
8. Resume later with `esper:continue` when needed.

### Daily Loop Flow

```mermaid
flowchart LR
    A[esper:context] --> B[Baseline checks]
    B --> C[Author or revise working file]
    C --> D[esper:go]
    D --> E[Agent advances workflow]
    E --> F[esper:review]
    F --> G[Auto sync specs<br/>or esper:sync]
    G --> H{More work?}
    H -->|Yes| A
    H -->|No| I[Stop]
```

## Primary Commands

### `esper:init`

Initializes EsperKit in the current repository and creates project scaffolding.

### `esper:spec`

Main entrypoint for spec authoring and spec revision.
Use this when the spec should lead the work.

### `esper:go`

Shared approval command.
It crosses the active approval boundary and advances the workflow.

- If the active file is a spec: approve the spec, materialize a derived execution ledger, and begin execution (no second approval gate).
- If the active file is an increment: approve the plan in Plan-to-Spec and begin implementation.
- When resuming active execution, re-establishes current state with configured baseline checks when available.
- For bounded, testable changes, prefers red-green work derived from approved behavior descriptions or scenarios.

### `esper:context`

Summarizes current project state, including:

- active increment
- active run, if any
- spec root
- expected commands
- likely next safe action

### `esper:atom`

Main entrypoint for one bounded unit of direct-request work.

### `esper:batch`

Main entrypoint for queued, multi-increment work.

### `esper:review`

Runs a focused review against the approved plan and relevant specs.
Identifies drift, regressions, missing spec maintenance, and scope creep.
May request explanation artifacts when correctness alone is not sufficient for safe review.

### `esper:sync`

Reconciles shipped behavior back into the durable spec tree.
Use it when you need to force or retry syncing the shipped implementation back into the specs.
Behavior-changing work must update behavior descriptions and concrete scenarios before close-out.

### `esper:continue`

Resumes work from current project state without rebuilding context manually.
Restores confidence with configured baseline checks before active execution resumes.

## What EsperKit Writes in the Repo

A typical repository layout looks like this:

```text
.esper/
├── esper.json
├── context.json
├── CONSTITUTION.md
├── WORKFLOW.md
├── increments/
│   ├── pending/
│   ├── active/
│   ├── done/
│   └── archived/
├── runs/
│   └── <run-id>/
│       ├── run.json
│       ├── tasks/
│       └── reviews/
└── ...

<spec_root>/
├── index.md
├── _work/
└── ...
```

### Increment States

- `pending/`: queued work not yet active
- `active/`: current working increment
- `done/`: completed increments not yet archived
- `archived/`: closed historical increments

## How to Choose the Right Entry Command

Use `esper:spec` when:

- you are changing architecture
- the behavior needs to be designed before coding
- multiple components need a coherent contract first

Use `esper:atom` when:

- the task is small and bounded
- you already know the requested outcome
- one increment is enough

Use `esper:batch` when:

- the work naturally breaks into a queue
- order matters
- you want one reviewed execution plan for several related changes

Use `esper:context` when:

- you are returning to a project after a break
- the active stage is unclear
- you want the next safe action before editing anything

## Best Practices

- Treat the Markdown working file as the source of truth for the current step.
- Do not skip `esper:go`; approval is the stage transition.
- Use `esper:review` when you want an explicit verification pass, even if the agent already ran tests.
- Expect spec sync to happen automatically after implementation; use `esper:sync` when you need to force or retry it.
- Prefer `esper:atom` for small changes and `esper:batch` only when the queue is genuinely useful.
- Use `esper:continue` instead of re-explaining context to the agent.
- For bounded, testable changes, prefer red-green loops derived from approved behavior descriptions or scenarios.
- Behavior-changing work must update behavior descriptions and concrete scenarios before close-out.

## Common Mistakes

### Editing Code Before the Plan Is Approved

In Plan-to-Spec, if you are still revising the increment file, stay in the planning loop.
Use `esper:go` only when you want execution to begin.

In Spec-to-Code, remember that `esper:go` on an approved spec begins execution directly — there is no second plan-approval gate.

### Letting Specs Drift After Plan-First Work

If you used `esper:atom` or `esper:batch`, remember that code alone is not the final artifact.
The agent should normally sync specs automatically. If that did not happen, run `esper:sync` to bring the spec back in line with what shipped.

### Starting a Batch for a Single Small Task

If the work does not need a queue, use `esper:atom`.
Batch mode adds coordination overhead by design.

## Quick Start Examples

### Example A: Spec-First Feature

```text
esper:init
esper:spec
esper:go       # approve spec and begin execution directly
esper:review
esper:sync     # optional: force a final code-to-spec pass
```

### Example B: Direct Small Change

```text
esper:atom
esper:go
esper:review
esper:sync   # optional: force or retry spec sync
```

### Example C: Queued Delivery

```text
esper:batch
esper:go
esper:review
esper:sync   # optional: force or retry spec sync
```

## Mental Model

EsperKit is easiest to use if you remember three rules:

1. Every major step happens around a Markdown file.
2. `esper:go` crosses the active approval boundary — one gate, not two, in Spec-to-Code.
3. Specs must stay aligned with shipped code.

If you follow those rules, the rest of the command set stays small and predictable.
