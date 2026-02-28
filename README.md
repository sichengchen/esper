# EsperKit

[![npm](https://img.shields.io/npm/v/esperkit)](https://www.npmjs.com/package/esperkit)

Tool-neutral, simple workflow layer for spec-driven software development. Gives coding agents a durable project constitution, system specs, structured increments, and verifiable delivery rules.

Works with Claude Code and Codex.

## Install

```bash
npm install -g esperkit
esperkit install
```

Then initialize through the agent:

```
esper:init
```

This interviews you, creates the `.esper/` directory with a constitution, spec scaffolding, and workflow config.

## Workflows

EsperKit supports two complementary development styles.

**Spec-to-Code** — define or revise the system spec first, then derive implementation from it.

```
esper:spec    →  open or create the spec working file, revise with the agent
esper:go      →  approve specs, derive increment plan
esper:go      →  approve plan, implement
esper:review  →  verify implementation
```

**Plan-to-Spec** — start from a direct request, implement in bounded increments, then sync back into specs.

```
esper:atom    →  single bounded task (or esper:batch for a queue)
esper:go      →  approve plan, implement
esper:review  →  verify implementation
esper:sync    →  force spec sync if needed (usually automatic)
```

Both workflows use `esper:go` as the shared approval gate and `esper:continue` to resume interrupted sessions.

## Commands

| Command | What it does |
|---|---|
| `esper:init` | Interview, scaffold project, write constitution |
| `esper:spec` | Open or create the spec working file for authoring and revision |
| `esper:atom` | Create a single bounded increment from a direct request |
| `esper:batch` | Create a queued series of related increments |
| `esper:go` | Approve the current working file and advance to the next stage |
| `esper:continue` | Resume interrupted work from current project state |
| `esper:review` | Verify implementation against the approved plan and specs |
| `esper:sync` | Force or retry post-implementation code-to-spec sync |
| `esper:context` | Show current project state and next safe action |

Use the same `esper:*` command names across hosts, including Claude Code and Codex.

### CLI

| Command | What it does |
|---|---|
| `esperkit install` | Install or update host-specific skills |
| `esperkit init` | Create deterministic project scaffolding |
| `esperkit config` | Read or write project config |
| `esperkit context get` | Print runtime context as JSON |
| `esperkit spec` | Manage the spec tree (index, get, create, list) |
| `esperkit increment` | Manage increments (list, create, activate, finish, archive) |
| `esperkit doctor` | Run project health checks |
| `esperkit migrate` | Migrate project state to the latest schema |

## Core Concepts

**Constitution** — durable project-level document describing what the project is and is not, key technical decisions, testing strategy, and principles.

**Specs** — long-lived system description for agents and humans. Architecture, behavior, interfaces, constraints. Not temporary task notes.

**Increments** — bounded units of delivery. Each stores what will change, why, how to verify it, and which specs it touches. Atomic (single task) or systematic (batch queue).

**Working file** — the Markdown file that serves as the shared review surface between you and the agent. Chat, edit directly, or leave comments inside it.

## Project Structure

```
.esper/
├── esper.json              # project config and workflow preferences
├── context.json            # machine-readable runtime state
├── CONSTITUTION.md         # project vision and constraints
├── WORKFLOW.md             # agent bootstrap instructions
└── increments/
    ├── pending/            # queued work
    ├── active/             # current working increment (max 1)
    ├── done/               # completed, not yet archived
    └── archived/           # closed historical increments

<spec_root>/                # default: specs/
├── index.md                # spec tree entrypoint
├── _work/                  # temporary spec coordination files
└── ...                     # organized by domain
```

## Choosing the Right Entry

| Situation | Command |
|---|---|
| Architecture or behavior needs design before coding | `esper:spec` |
| Small, bounded task with a known outcome | `esper:atom` |
| Multiple related changes that should be queued | `esper:batch` |
| Returning after a break or state is unclear | `esper:context` |

## Design Principles

- **Tool-neutral** — project state is readable without depending on one vendor's runtime
- **Specs are durable** — the spec tree lives in files, stays revisable, and remains aligned with shipped work
- **Progressive structure** — small work stays light; large work gets more rigor
- **AI-native by default** — simple intent-level commands; the agent handles the responsible next steps
- **Zero dependencies** — installs instantly with no dependency tree
- **Fail loudly** — verification steps that are advertised as blocking must block

## Docs

- [User Manual](docs/esperkit-user-manual.md) — day-to-day usage guide covering both workflows, all commands, and best practices
- [Product Spec](specs/esperkit-spec.md) — full specification defining artifacts, requirements, and the workflow model

## License

MIT
