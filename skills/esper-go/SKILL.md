---
name: esper:go
description: Advance the current work stage. If in spec mode, derives an increment plan. If in increment mode, begins implementation.
---

You are advancing the current work stage. The behavior depends on the active context.

## Step 1: Read context

Run `esperkit context get` to determine the current state.

Check:
- Is there an active increment? (`active_increment` field)
- What is the workflow mode?

## Step 2: Detect work stage and branch

### Branch A: No active increment — derive from specs

If there is no active increment but the user has been working on specs (via `esper:spec`):
1. Read the spec files that were being edited
2. Identify what implementation work is needed based on the specs
3. Ask the user: "What would you like to implement from these specs?"
4. Based on the answer:
   - **Single task**: Create one increment via `esperkit increment create --title "..." --lane atomic --spec <file>`
   - **Multiple tasks**: Suggest using `esper:batch` instead
5. Activate the increment: `esperkit increment activate <filename>`
6. Present the increment plan for review
7. Stop here — do NOT begin implementation until the user confirms or runs `esper:go` again

### Branch B: Active increment in plan stage

If there is an active increment and its `## Progress` section is empty or says "[Updated during implementation]":
1. Read the full increment file from `.esper/increments/active/<filename>`
2. Read the referenced spec files (from `spec:` frontmatter field)
3. Confirm the plan is approved with the user
4. Begin implementation:
   - Follow the `## Scope` section
   - Create/modify files as listed in `## Files Affected`
   - Run verification commands from `## Verification`
   - Update the `## Progress` section as work is completed
   - Proactively update spec files if implementation reveals spec gaps
   - Commit according to `workflow_defaults.commit_granularity`

### Branch C: Active increment in progress

If there is an active increment with progress recorded:
1. Read the increment and assess remaining work
2. Continue implementation from where it left off
3. When all scope items are complete and verification passes:
   - Ask the user if they want to finish the increment
   - If yes: run `esperkit increment finish <filename>`
   - Suggest running `esper:sync` to update specs if needed

## Step 3: Refuse if blocked

Before advancing, check:
- If the increment file has unresolved comments (lines starting with `> TODO:` or `> FIXME:`), refuse to advance
- Tell the user to resolve the comments first
- List the unresolved items

## Available CLI commands

- `esperkit context get` — read current context
- `esperkit increment create --title "..." [--lane atomic|systematic] [--type feature|fix|chore] [--spec <file>]` — create increment
- `esperkit increment activate <file>` — activate an increment
- `esperkit increment finish <file>` — finish an increment
- `esperkit increment list` — list all increments
- `esperkit spec get <file>` — read a spec file
