# EsperKit

[![npm](https://img.shields.io/npm/v/esperkit)](https://www.npmjs.com/package/esperkit)

Tool-neutral workflow layer for AI-assisted software development. Gives coding agents a durable project constitution, system specs, structured increments, and verifiable delivery rules.

Works with Claude Code and Codex. Zero runtime dependencies.

## Install

```bash
npm install -g esperkit
```

Then install the host instruction layer in your repo:

```bash
esperkit install
```

Initialize the project through the agent:

```
esper:init
```

This creates the `.esper/` directory, a constitution, spec scaffolding, and workflow config.

## Two Workflows

EsperKit supports two complementary development styles.

### Spec-to-Code

Define or revise the system spec first, then derive implementation from it.

```
esper:spec          # open or create the spec working file
                    # revise with the agent until accurate
esper:go            # approve specs → derive increment plan
                    # revise the plan until acceptable
esper:go            # approve plan → implement
esper:review        # verify implementation (optional)
```

### Plan-to-Spec

Start from a direct request, implement in bounded increments, then sync back into specs.

```
esper:atom          # single bounded task
esper:batch         # queued series of related increments
                    # revise the plan until acceptable
esper:go            # approve plan → implement
esper:review        # verify implementation (optional)
esper:sync          # force spec sync if needed (usually automatic)
```

## Commands

### Agent Commands (Skills / Slash Commands)

| Command | What it does |
|---|---|
| `esper:init` | Interview → scaffold project → write constitution |
| `esper:spec` | Open or create the spec working file for authoring and revision |
| `esper:atom` | Create a single bounded increment from a direct request |
| `esper:batch` | Create a queued series of related increments |
| `esper:go` | Approve the current working file and advance to the next stage |
| `esper:continue` | Resume interrupted work from current project state |
| `esper:review` | Verify implementation against the approved plan and specs |
| `esper:sync` | Force or retry post-implementation code-to-spec sync |
| `esper:context` | Show current project state and next safe action |

In Claude Code, these are invoked as slash commands: `/e:init`, `/e:spec`, `/e:atom`, `/e:go`, etc.

### CLI Commands

| Command | What it does |
|---|---|
| `esperkit install` | Install or update host-specific skills |
| `esperkit init` | Create deterministic project scaffolding |
| `esperkit config <action>` | Read or write project config |
| `esperkit context get` | Print runtime context as JSON |
| `esperkit spec <action>` | Manage the spec tree (index, get, create, list) |
| `esperkit increment <action>` | Manage increments (list, create, activate, finish, archive) |
| `esperkit exploration <action>` | Manage explorations |
| `esperkit doctor` | Run project health checks |
| `esperkit migrate` | Migrate project state to the latest schema |

## Core Concepts

**Constitution** — a durable project-level document describing what the project is and is not, key technical decisions, testing strategy, and development principles.

**Specs** — the long-lived system description for agents and humans. Describes architecture, behavior, interfaces, and constraints. Not temporary task notes.

**Increments** — bounded units of delivery. Each stores what will change, why, how to verify it, and which specs it touches. Can be atomic (single task) or systematic (batch queue).

**Working file** — the Markdown file that serves as the shared review surface between you and the agent at each workflow step. You can chat, edit it directly, or leave comments inside it.

## What EsperKit Creates

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

## Daily Loop

1. Run `esper:context` if the current state is unclear.
2. Create or revise the working file through `esper:spec`, `esper:atom`, or `esper:batch`.
3. Run `esper:go` to approve and advance.
4. Use `esper:review` for explicit verification.
5. Specs sync automatically after implementation; use `esper:sync` to force or retry.
6. Resume later with `esper:continue`.

## How to Choose the Right Entry Command

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

## License

MIT
