---
name: esper:apply
description: Implement a backlog plan. Enters plan mode to generate a detailed todo list, gets user approval, then implements with mandatory milestone commits. Use /esper:continue to resume an interrupted session.
---

You are implementing a backlog item.

The user's argument (if any): $ARGUMENTS

## Step 1: Check setup

Verify `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first and stop.

Check if there is already an active plan in `.esper/plans/active/`. If there is:
- Read the plan's `title:` and `branch:` from the frontmatter
- Tell the user: "There is already an active plan: [title] on branch [branch]."
- Ask (using `AskUserQuestion`): "Continue with it, or suspend it and start a new one?"
  - **Continue**: Skip to Step 6 (skip the plan-mode gate — infer progress from `git log --oneline -10` and the plan's `## Progress` section, then resume from remaining steps)
  - **Suspend**: Move the plan file back to `.esper/plans/pending/`, update frontmatter `status: pending`, then continue to Step 2

## Step 2: Select the plan

Read all `.md` files in `.esper/plans/pending/` and parse their frontmatter.

**If pending is empty**: "No pending items in the backlog." Suggest `/esper:plan` or `/esper:fix` to add one. Stop.

**If an argument was given**: Match against plan `id` or `title` (substring, case-insensitive). If no match, list all pending items and ask the user to clarify.

**If no argument**: Select the plan with the lowest `priority` number. If priorities are equal, pick the lowest `id`.

Show the selected plan title and use `AskUserQuestion` to confirm before proceeding.

## Step 3: Create the git branch

Read the `branch:` field from the selected plan's frontmatter. Attempt BEFORE modifying plan state:

```bash
git checkout -b <branch-name>
```

If the branch already exists:
```bash
git checkout <branch-name>
```

If checkout fails for any other reason, stop and report the error. Do NOT proceed.

## Step 4: Activate the plan

Only after the git branch is confirmed:
- Move the plan file from `pending/` to `active/` (same filename)
- Update frontmatter: `status: active`

## Step 5: Read plan context

Read:
- The active plan file (full content)
- `.esper/CONSTITUTION.md`
- `.esper/phases/<current_phase from esper.json>.md`

## Step 6: Plan-mode gate — generate todo list

**Do not skip this step.** Do not start writing code until the todo list is approved.

Use the `EnterPlanMode` tool.

While in plan mode:
1. Read each file listed in the plan's `## Files to change` section
2. Read any additional files referenced in the plan's `## Approach` section (imports, parent modules, config files)
3. Based on the exploration, use `TodoWrite` to generate a comprehensive implementation checklist.

   Structure the todos as concrete, code-level tasks. Each todo should be one logical unit of work that will result in a milestone commit. Examples:
   - "Create src/auth/middleware.ts with JWT validation logic"
   - "Wire middleware into src/app.ts route registration"
   - "Add test cases to test/auth.test.ts"
   - "Update plan ## Progress section"

   If the exploration reveals anything the plan didn't anticipate (missing deps, conflicting patterns), add those as todos and note the deviation.

4. Show the `TodoWrite` checklist alongside the plan's `## Approach` section. If they differ, explain why.

Use the `ExitPlanMode` tool (this presents the todo list for user approval).

After the user approves: continue to Step 7.

## Step 7: Implement with milestone commits

Implement the todos in order, following the plan's `## Approach` and the project's CONSTITUTION principles.

Rules during implementation:
- Read each file before modifying it
- Follow existing code patterns and conventions
- Do not add features beyond what the plan describes
- Do not refactor surrounding code unless the plan explicitly requires it

**Mandatory milestone commits** — after each todo item is completed, commit immediately:
```bash
git add <specific files changed for this milestone — never git add -A>
git commit -m "$(cat <<'EOF'
<feat|fix|chore>: <what this milestone accomplished>

Plan: #<id> — <title> (milestone <N>/<total>)
EOF
)"
```

If something unexpected is discovered mid-implementation (missing dependency, conflicting pattern, ambiguous requirement):
1. Stop and describe the discovery to the user via `AskUserQuestion`
2. Agree on a revised approach
3. Update the plan's `## Approach` and `## Files to change` to reflect what will actually be built
4. Update `TodoWrite` to reflect the change
5. Continue

The plan is a living document — keep it accurate as the implementation evolves.

## Step 8: Update Progress and wrap up

After all todos are implemented:

Add or update the `## Progress` section in the active plan file:
```markdown
## Progress
- Milestones: [N] commits
- Modified: [list of files changed]
- Verification: not yet run — run /esper:finish to verify and archive
```

Tell the user:
- "Implementation complete — [N] milestone commits made."
- Next: `/esper:finish` to run verification, commit any remaining changes, and archive the plan.
