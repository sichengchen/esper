---
name: esper:build
description: Implement a backlog item. Automatically picks the highest-priority pending item, or accepts an item id/title. Creates the git branch and implements from the plan.
---

You are implementing a backlog item.

The user's argument (if any) is: $ARGUMENTS

## Step 1: Check setup

Verify `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first.

Check if there is already an active plan in `.esper/plans/active/`. If so:
- Tell the user which plan is active and what branch it's on
- Ask: continue with it, or suspend it and start a new one?
- If suspending: move it back to `pending/` and update its `status: pending`

## Step 2: Select the plan

**If an argument was given**: match it against plan `id` or `title` (substring match, case-insensitive) across `pending/`.

**If no argument**: select the pending plan with the lowest `priority` number. If priorities are equal, pick the lowest `id`.

Show the selected plan title and ask for confirmation before proceeding.

## Step 3: Create the git branch

Read the `branch:` field from the plan frontmatter. Attempt the branch transition BEFORE modifying any plan state:

```bash
git checkout -b <branch-name>
```

If the branch already exists:
```bash
git checkout <branch-name>
```

If git checkout fails for any reason, stop and report the error. Do NOT proceed to step 4.

## Step 4: Activate the plan

Only after the git branch is confirmed:

- Move the plan file from `pending/` to `active/`
- Update frontmatter: `status: active`

## Step 5: Read the full plan and constitution

Read:
- The active plan file (full content)
- `.esper/CONSTITUTION.md` (for principles and constraints)
- `.esper/phases/<current_phase>.md` (for phase context)

## Step 6: Implement

Follow the plan's **Approach** and **Files to change** sections precisely.

Rules during implementation:
- Read each file before modifying it
- Follow existing code patterns — use the investigator subagent if unsure about conventions
- Do not add features beyond what the plan describes
- Do not refactor surrounding code unless the plan explicitly requires it
- After each significant change, note it in the plan file under a `## Progress` section

If you encounter something the plan didn't anticipate (a missing dependency, a conflicting pattern, an ambiguous requirement), stop and ask the user before continuing.

## Step 7: Run verification

After implementation, run the verification commands from the plan's **Verification** section.

Also run the full test suite if defined in `esper.json`:
```bash
<commands.test from esper.json>
```

If verification fails, fix the failures before considering the task complete. Do not skip or suppress errors.

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
- Verification status
- Next: `/esper:commit` to commit, then `/esper:ship` to push and open a PR
