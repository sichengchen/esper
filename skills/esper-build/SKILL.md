---
name: esper:build
description: Implement a backlog item. Automatically picks the highest-priority pending item, or accepts an item id/title. Creates the git branch and implements from the plan.
---

You are implementing a backlog item.

The user's argument (if any) is: $ARGUMENTS

## Step 1: Check setup

Verify `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first and stop.

Check if there is already an active plan in `.esper/plans/active/`. If there is:
- Read the plan's `title:` and `branch:` from the frontmatter
- Tell the user: "There is already an active plan: [title] on branch [branch]."
- Ask (using `AskUserQuestion`): "Continue with it, or suspend it and start a new one?"
  - **Continue**: Skip to Step 5.
  - **Suspend**: Move the plan file back to `.esper/plans/pending/`, update its frontmatter `status: pending`, then continue to Step 2.

## Step 2: Select the plan

Read all `.md` files in `.esper/plans/pending/` and parse their frontmatter.

**If the pending directory is empty**: Tell the user "No pending items in the backlog." and suggest running `/esper:new` to add one. Stop.

**If an argument was given**: Match it against plan `id` or `title` (substring match, case-insensitive). If no match is found, list all pending items and ask the user to clarify.

**If no argument**: Select the plan with the lowest `priority` number. If priorities are equal, pick the lowest `id`.

Show the selected plan title and use `AskUserQuestion` to ask for confirmation before proceeding.

## Step 3: Create the git branch

Read the `branch:` field from the selected plan's frontmatter. Attempt the branch transition BEFORE modifying any plan state:

```bash
git checkout -b <branch-name>
```

If the branch already exists, check it out instead:
```bash
git checkout <branch-name>
```

If git checkout fails for any other reason, stop and report the error. Do NOT proceed to Step 4.

## Step 4: Activate the plan

Only after the git branch is confirmed:

- Move the plan file from `pending/` to `active/` (same filename)
- Update the frontmatter: `status: active`

## Step 5: Read the full plan and constitution

Read:
- The active plan file (full content)
- `.esper/CONSTITUTION.md` (for principles and constraints)
- `.esper/phases/<current_phase from esper.json>.md` (for phase context)

## Step 6: Implement

Follow the plan's **Approach** and **Files to change** sections precisely.

Rules during implementation:
- Read each file before modifying it
- Follow existing code patterns
- Do not add features beyond what the plan describes
- Do not refactor surrounding code unless the plan explicitly requires it

If you encounter something the plan didn't anticipate (a missing dependency, a conflicting pattern, an ambiguous requirement):
1. Stop and describe the discovery to the user
2. Propose a revised approach using `AskUserQuestion`
3. Once the user agrees on the revised approach, **update the plan file** — edit the relevant sections (`## Approach`, `## Files to change`, `## Verification`) to reflect what will actually be built
4. Then continue implementation

The plan is a living document. Keep it accurate as the implementation evolves.

## Step 7: Run verification

After implementation, run the verification steps from the plan's **Verification** section.

Also run the test suite if `commands.test` in `esper.json` is a non-empty string:
```bash
<commands.test value>
```

Skip the test suite if `commands.test` is an empty string or missing.

If any verification fails, fix the failures before considering the task complete. Do not skip or suppress errors.

## Step 8: Update the plan file

Add a `## Progress` section to the active plan file:

```markdown
## Progress
- Implemented [what was done]
- Modified: [list of files changed]
- Verification: [passed / failed with details]
```

## Step 9: Done

Tell the user:
- Implementation complete
- Verification status (passed or failed with details)
- Next: `/esper:commit` to commit, then `/esper:ship` to push and open a PR
