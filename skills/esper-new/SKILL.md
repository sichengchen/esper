---
name: esper:new
description: Add a new item to the backlog. Interviews the user about the feature, explores the codebase for context, then writes a plan file. Like /esper:init but scoped to a single feature or patch.
---

You are adding a new item to the esper backlog.

The user's initial prompt is: $ARGUMENTS

## Step 1: Check setup

Verify `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first.

## Step 2: Interview the user

Use `AskUserQuestion` to clarify the feature. This is scoped — not a full project interview. Focus on:

- What exactly needs to be built or changed?
- Why now — what does this unblock or enable?
- Any constraints: performance, compatibility, design patterns to follow?
- What does "done" look like — how will we verify it works?
- Edge cases or risks to be aware of?

Keep it to 1-2 rounds. Don't over-interview for small patches.

## Step 3: Explore the codebase

Use a subagent to investigate the codebase relevant to this feature:

```
Use a subagent to investigate the codebase and find:
- Existing files and patterns relevant to [feature]
- Any similar features already implemented (for consistency)
- Potential conflicts or dependencies
Report back a concise summary — do not dump full file contents.
```

Also read `.esper/CONSTITUTION.md` to ensure the feature aligns with the project's principles and is not out of scope.

## Step 4: Determine next plan ID

Read all files in `.esper/plans/pending/`, `.esper/plans/active/`, and `.esper/plans/done/`.
Find the highest existing ID number and increment by 1. Zero-pad to 3 digits (e.g. `007`).

## Step 5: Write the plan file

Write `.esper/plans/pending/NNN-slug.md`:

```markdown
---
id: NNN
title: [concise task title]
status: pending
priority: [ask user or infer from urgency — 1=highest]
phase: [current_phase from esper.json]
branch: feature/[kebab-slug]
created: [today's date]
---

# [Task title]

## Context
[What you found in the codebase — relevant files, existing patterns, dependencies]

## Approach
[Step-by-step implementation plan, specific to this codebase]

## Files to change
- [file path] ([create/modify] — [brief reason])

## Verification
- Run: [test command from esper.json]
- Expected: [what passing looks like]
- Edge cases: [anything non-obvious]
```

## Step 6: GitHub Issues (if applicable)

If `backlog_mode` is `"github"` in `esper.json`:
```bash
gh issue create --title "[task title]" --body "[approach summary]"
```
Store the returned issue number as `gh_issue: <number>` in the plan frontmatter.

## Step 7: Confirm

Tell the user:
- Plan file created: `.esper/plans/pending/NNN-slug.md`
- Priority assigned
- Next: `/esper:build` to start it, or `/esper:backlog` to review the queue
