# esper

[![npm](https://img.shields.io/npm/v/@sichengchen/esper)](https://www.npmjs.com/package/@sichengchen/esper)

Vibe coding toolkit for Claude Code. Enforces a structured workflow: interview → plan → build → ship.

## Install

```bash
npx @sichengchen/esper
```

This installs esper skills globally to `~/.claude/skills/`.

## Commands

| Command | What it does |
|---|---|
| `/esper:init <prompt>` | Interview → write constitution → define phase → create backlog → install hooks |
| `/esper:backlog` | Show pending and active plans sorted by priority |
| `/esper:new <prompt>` | Interview → add a new plan to the backlog |
| `/esper:build [item]` | Implement a plan (auto-picks highest priority if no argument) |
| `/esper:commit` | Auto-draft a commit message from the active plan |
| `/esper:done` | Verify → commit → archive plan to done/ (no PR; use for feature plans) |
| `/esper:ship` | Verify → commit → archive → push → open PR |
| `/esper:yolo` | Implement all pending phase plans automatically, committing at milestones |

## Workflow

```bash
npx @sichengchen/esper               # if you haven't
cd your-project                      # then go to your project
```

Open Claude Code in your project directory and run:

```
/esper:init "I want to build X"         # interview → constitution → backlog → hooks

/esper:backlog                          # review the plan queue
/esper:build                            # implement highest-priority item
/esper:commit                           # commit with auto-drafted message
/esper:ship                             # push, open PR, archive
```

For new features mid-project:

```
/esper:new "add rate limiting"          # interview → new plan in backlog
/esper:build rate-limiting              # implement it
/esper:ship                             # ship it
```

## What esper creates in your project

```
.esper/
├── esper.json          # config: backlog mode, commands, current phase
├── CONSTITUTION.md     # vision, tech decisions, testing strategy
├── phases/
│   └── phase-1.md      # MVP scope and acceptance criteria
├── plans/
│   ├── pending/        # queued backlog items
│   ├── active/         # currently being built (max 1)
│   ├── done/           # shipped items (current phase)
│   └── archived/       # shipped items from completed phases
└── hooks/
    ├── verify-quick.sh      # runs lint + typecheck after every file edit
    └── session-reminder.sh  # reminds about uncommitted changes on stop

.claude/
└── settings.json       # hooks config (merged, not overwritten)
```

## Backlog modes

During `/esper:init` you choose how to manage the backlog:

- **Local** — plan files in `.esper/plans/`. Works offline, no dependencies.
- **GitHub Issues** — plans sync to `gh issues`. Requires `gh` CLI and a remote repo.

## Philosophy

- **Constitution first** — every project has a written document defining what it is and is not. Claude reads it every session.
- **Plan before build** — no code is written without a plan file.
- **Phase-based** — work is organized into phases with explicit acceptance criteria.
- **Verified shipping** — `/esper:ship` runs full verification before pushing. Failures block the ship.
