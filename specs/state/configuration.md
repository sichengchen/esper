# State Configuration

Status: Draft
Date: 2026-03-01

## Runtime Contract

The CLI publishes host-agnostic runtime state in `.esper/context.json`.

It must include:

- path to the constitution
- `spec_root`
- active increment, if any
- active increment scope, if any
- active run, if any
- active execution mode, if any
- canonical commands
- expected workflow mode
- schema version

The CLI also writes human-readable bootstrap documents such as `AGENTS.md`, `CLAUDE.md`, and `.esper/WORKFLOW.md`.

## Configuration Artifact

The durable configuration artifact is `.esper/esper.json`.

Required top-level fields:

- `schema_version`
- `backlog_mode`
- `spec_root`
- `commands`
- `workflow_defaults`

Supported top-level fields:

- `schema_version`
- `backlog_mode`
- `spec_root`
- `commands`
- `workflow_defaults`
- `spec_policy`
- `increment_policy`
- `agent_roles`
- `autonomous_run_policy`
- `provider_defaults`

Field semantics:

- `schema_version`: the version of the persisted Esper configuration schema
- `backlog_mode`: how increments are stored and surfaced
- `spec_root`: the repository-relative path to the spec tree
- `commands`: the canonical project commands for validation and development tasks
- `workflow_defaults`: project-wide workflow guidance stored as prompt-like policy text
- `spec_policy`: spec governance guidance stored as prompt-like policy text
- `increment_policy`: increment shaping guidance plus bounded guardrails
- `agent_roles`: provider and host mapping for named execution roles
- `autonomous_run_policy`: global limits and guardrails for autonomous execution
- `provider_defaults`: provider-specific operating guidance plus provider-level launch defaults

## Commands

The `commands` object may define:

- `test`
- `lint`
- `typecheck`
- `dev`

Each value is a shell command string. Empty strings disable that slot.

## Workflow Defaults

`workflow_defaults` stores agent-facing policy text in stable slots:

- `planning`
- `session_bootstrap`
- `implementation_style`
- `commits`
- `pull_requests`
- `validation`
- `spec_sync`
- `review`
- `explanations`
- `retention`

Important semantics:

- `session_bootstrap`: tells agents how to re-establish current state before resuming execution
- `implementation_style`: tells agents when to prefer red-green loops derived from approved behavior descriptions or scenarios
- `explanations`: tells agents when to emit walkthroughs, explainers, or durable pattern notes

Runtime use:

- skills read these prompt slots as policy instructions before planning or execution
- the active increment may quote or override a relevant slot for the current unit of work
- the active run may derive narrower task instructions from these prompt slots
- explicit increment fields and run fields win over generic workflow prompts for the current scope

## Other Policy Groups

### `spec_policy`

- `maintenance`
- `approval`
- `drift`

### `increment_policy`

- `sizing`
- `batching`
- `execution`
- `max_files_per_atomic_increment`

### `agent_roles`

- `orchestrator`
- `implementer`
- `reviewer`

Each role stores:

- `provider`
- `host`
- `fresh_invocation`
- `launch`

`launch` stores:

- `command`
- `args`
- `env`
- `workdir_strategy`
- `permission_profile`

### `autonomous_run_policy`

- `enabled`
- `max_review_rounds`
- `max_runtime_minutes`
- `max_cost`
- `require_distinct_reviewer`
- `allow_parallel_tasks`

### `provider_defaults`

Provider defaults are keyed by provider name and may include:

- `orchestration`
- `implementation`
- `review`
- `launch_defaults`

`launch_defaults` stores the default launch object shape:

- `command`
- `args`
- `env`
- `workdir_strategy`
- `permission_profile`

## Resolution Rules

Configuration resolution order:

1. Built-in defaults.
2. `.esper/esper.json`.
3. Active parent increment overrides.
4. Active run overrides.
5. Explicit CLI flags for the current invocation.

Later layers override earlier layers for that invocation.

Launch resolution for spawned agents:

1. provider launch defaults from `provider_defaults.<provider>.launch_defaults`
2. role-specific launch overrides from `agent_roles.<role>.launch`
3. task-local overrides from the active run or task packet when a narrower launch context is required

Later layers override earlier layers for the spawned process.

## Normalization And Mutation

Normalization rules:

- `spec_root` is repository-relative and stored without a leading slash
- path values use forward slashes
- enum values use lowercase kebab-case
- absent optional sections are omitted from disk and resolved from defaults at runtime
- persisted JSON uses stable key ordering

Mutation rules:

- `esperkit init` writes the initial `.esper/esper.json`
- `esperkit config set` mutates `.esper/esper.json`
- `esperkit migrate` upgrades the config schema when it changes
- skills and slash commands use CLI mutations for durable config changes
- invalid config writes fail loudly and leave the existing file unchanged
- durable config mutations refresh `.esper/context.json`

## Migration And Enforcement

Generated assets must be versioned and upgradable.

Rules:

- track a project-level `schema_version`
- provide migrations without destroying user-authored content
- show clear change summaries before destructive replacements
- keep blocking checks genuinely blocking
- record which checks ran for autonomous candidates

Migration scope includes:

- runtime context files
- bootstrap documents
- config schema changes
- run artifact schema changes
- future provider-specific project assets

Verification and enforcement rules:

- if a check is blocking, it exits non-zero on failure
- if a check is advisory, that must be explicitly labeled
- completion and shipping flows respect the configured verification policy
- autonomous runs persist which checks were run, in what mode, and on which candidate

Upgrade-path rules:

- new fields in specs, increments, and runs remain optional when reading older artifacts
- projects without `spec_root` default to `specs`
- projects without increment storage must be initialized or migrated before using the current workflow
- projects without run storage must be migrated before using autonomous execution
- migration is opt-in where changes affect user workflows
