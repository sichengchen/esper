---
name: esper:init
description: Initialize esper in a project. Interviews the user for workflow preferences, scaffolds the project, and writes the constitution.
---

You are initializing the esper agent-powered development toolkit for this project.

## Step 0: Detect existing setup

Run `esperkit config check`. If it exits 0 (project already set up), use `AskUserQuestion` to ask:
  - "Esper is already set up in this project. What would you like to do?"
  - Options: "Update the constitution", "Re-run init (non-destructive)", "Reset everything"
- If it exits non-zero (not set up), proceed to Step 1.

When already set up:
  - **Update the constitution**: Re-read `.esper/CONSTITUTION.md`, interview the user (Steps 1–2), rewrite it. Keep everything else untouched.
  - **Re-run init**: Run `esperkit init` — it is non-destructive and only creates missing files.
  - **Reset everything**: Confirm with `AskUserQuestion`. If confirmed, delete `.esper/` and proceed from Step 1.

Before scaffolding, check for root bootstrap docs:
- If `AGENTS.md` exists, read it and preserve its non-Esper content.
- If `CLAUDE.md` exists, read it and preserve its non-Esper content.
- Treat any existing `## EsperKit` section as managed content that may be replaced.

## Step 1: Interview the user

Use `AskUserQuestion` to interview the user. Cover these areas in 2–3 rounds.

**Round 1 — Project vision**:
- What is this project and what problem does it solve?
- What is it explicitly NOT? (scope boundaries)
- Who are the primary users?

**Round 2 — Technical decisions**:
- What is the tech stack? (language, framework, runtime)
- What commands run tests, lint, and typecheck? (can be empty if not set up yet)
- What command starts the dev server?

**Round 3 — Workflow preferences** (use AskUserQuestion with these as options):
- Default work mode: `atom` (single-increment focus) or `batch` (multi-increment queue)?
- Commit granularity: `per-increment` or `per-file`?
- PR policy: `explicit-only` (user triggers) or `auto-per-increment`?
- Validation mode: `blocking` (must pass before advancing) or `advisory`?
- Spec sync mode: `proactive` (update specs as you go) or `on-finish` (update at end)?

## Step 2: Write CONSTITUTION.md

Based on the interview, write `.esper/CONSTITUTION.md` covering:
1. **Project identity**: name, purpose, what it is and is not
2. **Users**: who the project serves
3. **Tech stack**: language, framework, runtime, key dependencies
4. **Coding standards**: naming, structure, patterns to follow
5. **Testing strategy**: what gets tested, how, with what tooling
6. **Scope boundaries**: what will never be built here

## Step 3: Run esperkit init

Run `esperkit init` with any options from the interview (e.g., `--spec_root` if the user specified a custom location).

## Step 4: Configure esper.json

Run `esperkit config set commands '<json>'` with the test/lint/typecheck/dev commands from the interview.

Run `esperkit config set workflow_defaults '<json>'` with the workflow preferences from Round 3.

## Step 5: Explain what was created

If `AGENTS.md` or `CLAUDE.md` already existed:
- Re-open the file after `esperkit init`.
- Ensure it contains exactly one `## EsperKit` section with the esper bootstrap instructions.
- If the file already has an `## EsperKit` section, replace only that section.
- If the file has no `## EsperKit` section, append one near the end.
- Preserve all non-Esper content outside that section.

If `AGENTS.md` or `CLAUDE.md` did not exist:
- Keep the scaffolded files from `esperkit init`.

Summarize the scaffolding:
- `.esper/esper.json` — project config
- `.esper/context.json` — runtime context for agent interop
- `.esper/CONSTITUTION.md` — project vision and constraints
- `.esper/WORKFLOW.md` — how to work with esper
- `AGENTS.md` — tool-neutral bootstrap instructions at the repo root
- `CLAUDE.md` — Claude-specific bootstrap instructions at the repo root
- `.esper/increments/` — increment lifecycle directories
- `specs/` — spec tree (system, product, interfaces)

## Step 6: Next steps

If this is an existing codebase with code already written:
- Suggest running `esper:spec` to bootstrap specs from the existing code
- Explain that specs document what the system does and serves as the source of truth

If this is a new project:
- Suggest running `esper:spec` to write the initial spec
- Or `esper:atom` to create the first increment directly
