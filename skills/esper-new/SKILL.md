---
name: esper:new
description: Add a new item to the backlog. Interviews the user about the feature, explores the codebase for context, then writes a plan file. Like /esper:init but scoped to a single feature or patch.
---

You are adding a new item to the esper backlog.

The user's initial prompt is: $ARGUMENTS

## Step 1: Check setup

Verify `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first and stop.

Read `.esper/CONSTITUTION.md` to understand the project's scope and principles before interviewing.

## Step 2: Interview the user

Use `AskUserQuestion` to clarify the feature. This is scoped — not a full project interview. Focus on:

- What exactly needs to be built or changed?
- Why now — what does this unblock or enable?
- Any constraints: performance, compatibility, design patterns to follow?
- What does "done" look like — how will we verify it works?
- Edge cases or risks to be aware of?

Keep it to 1–2 rounds. Don't over-interview for small patches. If the initial `$ARGUMENTS` prompt already answers most of these, skip to Step 3.

## Step 3: Explore the codebase

Use the Task tool with `subagent_type: "Explore"` to investigate the codebase relevant to this feature:

```
Find existing files and patterns relevant to [feature being added].
Look for similar features already implemented (for consistency).
Identify potential conflicts or dependencies.
Return a concise summary — do not include full file contents.
```

Cross-reference findings against `.esper/CONSTITUTION.md` to confirm the feature is in scope and doesn't violate any principles. If it's out of scope, tell the user and stop.

## Step 4: Determine next plan ID

Read all files in `.esper/plans/pending/`, `.esper/plans/active/`, and `.esper/plans/done/`.
Find the highest `id:` value in any frontmatter across all three directories. Increment by 1 and zero-pad to 3 digits (e.g. `007`). If no plans exist yet, start at `001`.

## Step 5: Write the plan file

Write `.esper/plans/pending/NNN-slug.md` where `NNN` is the next ID and `slug` is a short kebab-case name.

Read `pr_mode` from `esper.json`. Set `branch:` accordingly:
- `pr_mode: "plan"` (or missing): `branch: feature/[kebab-slug]`
- `pr_mode: "phase"`: `branch: phase/[current_phase]` (e.g. `phase/phase-1`) — all plans in this phase share one branch

```markdown
---
id: NNN
title: [concise task title]
status: pending
priority: [1 = urgent/blocking, 2 = normal, 3 = low — ask user or infer from urgency]
phase: [current_phase from esper.json]
branch: feature/[kebab-slug]
created: [today's date in YYYY-MM-DD format]
---

# [Task title]

## Context
[What you found in the codebase — relevant files, existing patterns, dependencies]

## Approach
[Step-by-step implementation plan, specific to this codebase]

## Files to change
- [file path] ([create/modify] — [brief reason])

## Verification
- Run: [test command from esper.json, or "manual" if no test command]
- Expected: [what passing looks like]
- Edge cases: [anything non-obvious]
```

## Step 6: GitHub Issues (if applicable)

If `backlog_mode` is `"github"` in `esper.json`:
```bash
gh issue create --title "[task title]" --body "[approach summary, 2-4 sentences]"
```
Store the returned issue number in the plan frontmatter as `gh_issue: <number>`.

## Step 7: Confirm

Tell the user:
- Plan file created: `.esper/plans/pending/NNN-slug.md`
- Priority assigned: p[N]
- Next: `/esper:build` to start it immediately, or `/esper:backlog` to review the full queue
