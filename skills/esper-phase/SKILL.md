---
name: esper:phase
description: Define the next development phase. Archives the current phase's completed plans, bumps current_phase, interviews the user about the new phase scope, and creates a backlog of feature plans.
---

You are defining the next development phase.

The user's initial prompt (if any): $ARGUMENTS

## Step 1: Check setup

Verify `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first and stop.

Read `.esper/esper.json` to get `current_phase` (e.g. `"phase-1"`).

## Step 2: Verify current phase is complete

Run:
```bash
ls .esper/plans/pending/ 2>/dev/null
ls .esper/plans/active/ 2>/dev/null
```

Count `.md` files in `pending/` and `active/` whose frontmatter `phase:` matches `current_phase`.

If any matching plans remain, stop:
> "Phase <current_phase> still has unfinished plans. Complete them with `/esper:apply` and `/esper:finish` before starting a new phase."

## Step 3: Read context

Read:
- `.esper/CONSTITUTION.md` — project principles and scope
- `.esper/phases/<current_phase>.md` — what was just completed
- Scan titles of all `.md` files in `.esper/plans/done/` where `phase:` matches `current_phase` — for a retrospective summary

Summarize for the user: "Phase <N> (<title>) is complete. You shipped: [list of done plan titles]."

## Step 4: Interview for the new phase

Use `AskUserQuestion` in 2 rounds:

**Round 1 — Scope:**
- What does this next phase deliver? What is the goal?
- What is explicitly in scope for this phase?
- What is deferred (not this phase)?
- What are the acceptance criteria — how do we know this phase is done?

**Round 2 — Retrospective** (skip if $ARGUMENTS already covers these):
- Anything from the previous phase to revisit or carry forward?
- Any new technical constraints or architectural decisions for this phase?

## Step 5: Archive current phase plans

Create the archive directory if needed:
```bash
mkdir -p .esper/plans/archived/<current_phase>
```

Move all `.md` files from `.esper/plans/done/` whose frontmatter `phase:` matches `current_phase`:
```bash
mv .esper/plans/done/<filename>.md .esper/plans/archived/<current_phase>/
```

Print: "Archived <N> completed plans to `.esper/plans/archived/<current_phase>/`"

## Step 6: Compute the next phase number and update config

Parse `current_phase` to get the next phase slug:
- If `current_phase` matches the pattern `phase-N` (where N is an integer), the next phase is `phase-<N+1>`
- If it does not match (custom naming), use `AskUserQuestion` to ask: "What should the new phase be named? (e.g. `phase-2`)"

Update `.esper/esper.json` — set `current_phase` to the new phase slug.

## Step 7: Write the new phase file

Create `.esper/phases/<new_phase>.md`:

```markdown
---
phase: <new_phase>
title: <title from interview>
status: active
---

# Phase <N>: <title>

## Goal
[What this phase delivers and why it matters]

## In Scope
- [deliverable or feature]

## Out of Scope (deferred)
- [explicitly deferred item]

## Acceptance Criteria
- [ ] [measurable criterion]

## Phase Notes
[Retrospective findings from the previous phase that inform this one]
```

## Step 8: Decompose into backlog plans

Break the new phase into atomic tasks — each task is one PR worth of work.

All plans in this phase get:
- `type: "feature"` (for fix-type items, the user can run `/esper:fix` separately)
- `phase: <new_phase>`
- `branch: feature/<new_phase>`

Find the highest `id:` value across ALL existing plan files (pending/, active/, done/, and all archived/ subdirectories). Increment by 1 and zero-pad to 3 digits for the first new plan. Continue incrementing for each subsequent plan.

Write `.esper/plans/pending/NNN-slug.md` for each plan:

```markdown
---
id: NNN
title: [task title]
status: pending
type: feature
priority: [1 = blocking, 2 = normal, 3 = low]
phase: <new_phase>
branch: feature/<new_phase>
created: [today YYYY-MM-DD]
---

# [Task title]

## Context
[What exists in the codebase relevant to this task]

## Approach
[Step-by-step implementation plan]

## Files to change
- [file path] ([create/modify] — [why])

## Verification
- Run: [test command or "manual"]
- Expected: [what passing looks like]
- Edge cases: [anything non-obvious]
```

If `backlog_mode` is `"github"` in `esper.json`, create a GitHub issue for each plan:
```bash
gh issue create --title "[title]" --body "[approach summary]"
```
Store the returned issue number as `gh_issue: <number>` in the plan frontmatter.

## Step 9: Summary

Print:
- "Phase <N> defined: <title>"
- "<X> plans created in `.esper/plans/pending/`"
- Next steps: "Run `/esper:backlog` to review, then `/esper:apply` to start building."
