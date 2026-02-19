# esper

[![npm](https://img.shields.io/npm/v/esperkit)](https://www.npmjs.com/package/esperkit)

Vibe coding toolkit for Claude Code. Enforces a structured workflow: interview → plan → build → ship.

## Install

```bash
npx esperkit
```

This installs esper skills globally to `~/.claude/skills/`.

## Commands

| Command | What it does |
|---|---|
| `/esper:init <prompt>` | Interview → write constitution → define phase → create backlog → install hooks |
| `/esper:backlog` | Show pending and active plans sorted by priority |
| `/esper:plan <prompt>` | Interview → add a feature plan to the current phase backlog |
| `/esper:fix <prompt>` | Interview → add a bug fix plan with its own branch and PR |
| `/esper:apply [item]` | Select a plan, get todo list approved, then implement with milestone commits |
| `/esper:continue` | Resume an interrupted build from where it left off |
| `/esper:finish` | Verify → commit remaining changes → archive plan to `done/` |
| `/esper:ship` | Push → open PR → archive phase when all plans are done |
| `/esper:phase` | Archive current phase, bump phase number, interview for next phase scope |
| `/esper:yolo` | Implement all pending phase plans automatically, committing at milestones |

## Workflow

### 1. Initialize

```bash
npx esperkit        # install skills globally
```

```
/esper:init "I want to build X"
```

Interviews you, writes a constitution, defines Phase 1 with acceptance criteria, creates a backlog of plans, and installs hooks.

---

### 2. Create a phase or a fix

**Next phase** — when Phase N is done:

```
/esper:phase
```

Archives completed plans, bumps the phase number, interviews you about the new scope, and populates the backlog.

**Bug fix** — any time:

```
/esper:fix "login button broken"
```

Scoped interview → fix plan on its own branch. Ships its own standalone PR.

---

### 3. Add a plan to the current phase

```
/esper:plan "add rate limiting"
```

Interviews you, explores the codebase, and writes a detailed plan file in `pending/`. All feature plans share the phase branch and are batched into one phase PR.

```
/esper:backlog                  # review the queue
```

---

### 4. Implement

**Option A — one at a time:**

```
/esper:apply [item]             # select plan, approve todo list, then implement
/esper:continue                 # resume if the session was interrupted
```

**Option B — autopilot:**

```
/esper:yolo                     # implement all pending phase plans automatically
```

---

### 5. Finish a plan

```
/esper:finish
```

Runs verification, commits remaining changes, and archives the plan to `done/`. Repeat Steps 3–5 for each plan in the phase.

---

### 6. Finish the phase

```
/esper:ship
```

Pushes the branch and opens a PR. When all phase plans are done, opens the phase PR and archives the phase — then go back to Step 2.

## Plan types

| Type | Branch | PR |
|---|---|---|
| `feature` | `feature/<phase>` — shared by all phase features | One phase PR when all plans are done |
| `fix` | `fix/<slug>` — own branch | Standalone PR on `/esper:ship` |

Use `/esper:plan` to add features and `/esper:fix` to log bugs. The type is set automatically.

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
│   ├── done/           # finished items (current phase, not yet shipped)
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
- **Plan before build** — no code is written without an approved plan and todo list.
- **Phase-based** — work is organized into phases with explicit acceptance criteria.
- **Verified shipping** — `/esper:finish` and `/esper:ship` run full verification before proceeding. Failures block progress.
