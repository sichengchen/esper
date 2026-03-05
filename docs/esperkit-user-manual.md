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

To install skills into the current project instead of the global agent directory:

```bash
esperkit install --project
```

This places skills under `.claude/skills/` (or `.codex/skills/`) inside the project. Requires a git repository.

### Uninstall

To remove all esper skills from the agent directory:

```bash
esperkit uninstall
```

Supports `--provider claude|codex|all` to target specific hosts.

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

## Autonomous Multi-Agent Execution

EsperKit supports a bounded autonomous execution mode for approved Spec-to-Code work. In this mode, multiple agents collaborate under strict scope and safety rules.

### Roles

Three named roles participate in autonomous execution:

- **Orchestrator** — decomposes the approved scope into task packets, dispatches work, integrates results, and is the only role that mutates shared `.esper/` control state.
- **Implementer (worker)** — receives a task packet, reads its scope and acceptance criteria, derives or updates failing tests from approved behavior, and implements until the task passes.
- **Reviewer** — evaluates the merged candidate against the approved scope. The reviewer must be role-distinct from the implementation worker for a given change set.

Roles may map to different providers or hosts. Configuration lives in `agent_roles` in `.esper/esper.json`.

### How a Run Works

1. The user approves the spec with `esper:go`.
2. The orchestrator materializes a parent increment as an execution ledger, freezes the approved spec snapshot, and creates a run.
3. The orchestrator builds a task queue of bounded task packets and marks ready tasks.
4. Ready tasks are dispatched to workers. Each worker:
   - reads the task scope, affected files, and acceptance criteria
   - derives or updates failing tests from the approved behavior descriptions
   - iterates on implementation until tests pass and acceptance criteria are met
   - returns the task result
5. The orchestrator integrates each task result into a merged candidate.
6. When no more ready tasks remain in the current round, the reviewer evaluates the merged candidate.
7. If the reviewer finds issues, findings become repair tasks and the run returns to task dispatch.
8. If the reviewer passes the candidate, the human evaluates the final result.
9. The human may accept, request follow-up within approved scope, or return to spec authoring for scope changes.

### Loops

The autonomous workflow has several nested loops:

- **Task dispatch loop** — the orchestrator keeps dispatching ready task packets until the current round is fully integrated.
- **Worker red-green loop** — each worker iterates on failing tests and implementation until the task packet satisfies its acceptance criteria.
- **Review-repair loop** — reviewer findings become repair tasks and send the run back through task dispatch.
- **Human escalation loop** — blocked or over-budget runs return to the human, who can resolve the issue and resume or change scope and return to spec authoring.

### Rules

- Autonomous execution starts only after the governing spec is approved.
- The approved spec snapshot remains the sole authoritative source of scope and requirements.
- The parent increment remains the active human-facing execution ledger.
- Task packets are run artifacts, not concurrent active increments.
- The run stops and escalates when it hits configured limits or finds ambiguity.

### Configuration

The `autonomous_run_policy` section in `.esper/esper.json` controls:

- `enabled` — whether autonomous execution is available
- `max_review_rounds` — maximum review-repair cycles before escalation
- `max_runtime_minutes` — time budget for a run
- `max_cost` — cost budget for a run
- `require_distinct_reviewer` — enforce role separation between worker and reviewer
- `allow_parallel_tasks` — allow concurrent task execution

### Run Storage

Run artifacts are stored under `.esper/runs/<run-id>/`:

- `run.json` — machine-readable run record
- `tasks/` — task packet artifacts
- `reviews/` — review records

### Multi-Agent Flow

```mermaid
flowchart TD
    A[esper:go<br/>Approve spec] --> B[Materialize parent increment<br/>as execution ledger]
    B --> C[Freeze approved spec<br/>and create run]
    C --> D[Build task queue<br/>and mark ready tasks]
    D --> E{Ready task exists?}
    E -->|Yes| F[Dispatch task packet<br/>to worker]
    E -->|No| G[Reviewer evaluates<br/>merged candidate]

    F --> H[Worker derives failing tests<br/>from approved behavior]
    H --> I{Tests passing and<br/>acceptance met?}
    I -->|No| J[Worker implements<br/>and re-runs checks]
    J --> H
    I -->|Yes| K[Worker returns task result]

    K --> L[Orchestrator integrates<br/>task result into candidate]
    L --> E

    G --> M{Review result?}
    M -->|Pass| N[Human evaluates<br/>final candidate]
    M -->|Findings| O[Create repair tasks]
    O --> P{Within run limits?}
    P -->|Yes| D
    P -->|No| Q[Escalate to human]

    Q --> R{Human decision?}
    R -->|Resolve and resume| D
    R -->|Change scope| S[Return to spec authoring]
    R -->|Cancel| T[Run ends escalated]

    N --> U{Accepted?}
    U -->|Yes| V[esper:review / esper:sync<br/>close out increment]
    U -->|Needs follow-up| O
    U -->|Needs scope change| S
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
