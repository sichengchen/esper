---
name: esper:ship
description: Verify, commit, push, open a PR, and archive the active plan. Run when a backlog item is complete.
---

You are shipping the active backlog item.

## Step 1: Check there is an active plan

Read `.esper/plans/active/`. If empty, tell the user there is no active plan and stop.

## Step 2: Run full verification

Read `commands` from `.esper/esper.json`. For each of `test`, `lint`, and `typecheck`:
- Skip it entirely if the value is an empty string or missing
- Run it if non-empty, capture the exit code

If no commands are configured, print a warning: "No verification commands configured — skipping. Add test/lint/typecheck commands to .esper/esper.json to enable verification." Then continue.

If any non-empty command fails, stop and report the failures clearly with file and line references. Do NOT proceed until verification passes. Tell the user: fix the failures, then run `/esper:ship` again.

## Step 3: Commit remaining changes

Run `git status --porcelain`. If there are uncommitted changes, run the `/esper:commit` workflow inline — draft the message, show it, wait for approval, commit.

## Step 4: Push the branch

```bash
git push -u origin <branch from plan frontmatter>
```

## Step 5: Open a PR

Read the active plan for title and content. Create the PR:

```bash
gh pr create \
  --title "<plan title>" \
  --body "$(cat <<'EOF'
## What
<plan title and goal>

## Approach
<plan Approach section>

## Verification
<plan Verification section>

Plan: #<plan id>
<if gh_issue set: Closes #<gh_issue>>
EOF
)"
```

Print the PR URL.

## Step 6: Archive the plan

- Move the plan file from `active/` to `done/`
- Update frontmatter:
  ```yaml
  status: done
  shipped_at: <today's date>
  pr: <PR URL>
  ```

If `backlog_mode` is `"github"` and `gh_issue` is set in the plan:
```bash
gh issue close <gh_issue> --comment "Shipped in <PR URL>"
```

## Step 7: Phase check

Read all plan files in `pending/`, `active/`, and `done/` for the current phase (from `esper.json`).

If all plans for the current phase are in `done/`:
- Check phase acceptance criteria in `.esper/phases/<current_phase>.md`
- Print: "Phase <N> complete. All backlog items shipped."
- Ask: "Ready to plan the next phase? Run `/esper:new` to add items, or `/esper:init` to define a new phase."

Otherwise, print how many items remain in the current phase and suggest `/esper:build` to continue.
