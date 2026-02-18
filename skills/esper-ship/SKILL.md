---
name: esper:ship
description: Verify, commit, push, open a PR, and archive the active plan. Run when a backlog item is complete.
---

You are shipping the active backlog item.

## Step 1: Check there is an active plan

Read `.esper/plans/active/`. If the directory is empty or contains no `.md` files, tell the user "No active plan to ship." and stop.

Read the active plan's full content and frontmatter (`id`, `title`, `branch`, `phase`, `gh_issue` if present).

## Step 2: Run full verification

Read `commands` from `.esper/esper.json`. For each of `test`, `lint`, and `typecheck`:
- Skip it entirely if the value is an empty string or the key is missing
- Run it if non-empty and capture the exit code

If all three commands are empty or missing, print: "No verification commands configured — skipping. Add test/lint/typecheck commands to `.esper/esper.json` to enable verification." Then continue.

If any non-empty command fails, stop and report the failures clearly. Do NOT proceed.

Fix the failures. If fixing them requires changes that go beyond what the plan originally described (new files, a different approach, additional scope):
- Update the active plan file — edit `## Approach`, `## Files to change`, and/or `## Verification` to reflect what was actually done
- Then run `/esper:ship` again

If the fixes are minor and stay within the plan's described scope, just fix and re-run without updating the plan.

## Step 3: Commit remaining changes

Run `git status --porcelain`. If there are uncommitted changes:

1. Run `git diff HEAD` to see what changed
2. Run `git status` to see all modified files
3. Stage the files related to this plan: `git add <relevant files>`
4. Draft a commit message in this format:
   ```
   <type>: <concise description>

   <1-3 sentences on what changed and why>

   Plan: #<id> — <title>
   ```
5. Show the draft to the user and wait for approval
6. Once approved, commit:
   ```bash
   git commit -m "$(cat <<'EOF'
   <approved message>
   EOF
   )"
   ```

If there is nothing to commit, skip this step.

## Step 4: Push the branch

```bash
git push -u origin <branch from plan frontmatter>
```

If the push fails (e.g. no remote, auth issue), report the error and stop.

## Step 5: Open a PR

Read `pr_mode` from `.esper/esper.json` (treat missing as `"plan"`).

**If `pr_mode: "phase"`**: Skip PR creation. Print: "Phase mode: PR will be opened when the full phase is complete." Then continue to Step 6.

**If `pr_mode: "plan"` (default)**: Create the PR using the `gh` CLI:

```bash
gh pr create \
  --title "<plan title>" \
  --body "$(cat <<'EOF'
## What
<plan title and goal, 1-2 sentences>

## Approach
<plan Approach section, summarized>

## Verification
<plan Verification section>

Plan: #<plan id>
<if gh_issue is set in plan frontmatter: Closes #<gh_issue>>
EOF
)"
```

Print the PR URL returned by `gh pr create`.

## Step 6: Archive the plan

Move the plan file from `.esper/plans/active/<filename>` to `.esper/plans/done/<filename>` (same filename).

Update the frontmatter of the moved file:
```yaml
status: done
shipped_at: <today's date in YYYY-MM-DD format>
pr: <PR URL from Step 5>
```

If `backlog_mode` is `"github"` in `esper.json` and `gh_issue` is set in the plan:
```bash
gh issue close <gh_issue> --comment "Shipped in <PR URL>"
```

## Step 7: Phase check

Read all plan files across `pending/`, `active/`, and `done/` where `phase:` matches `current_phase` from `esper.json`.

If all plans for the current phase are in `done/` (none remain in `pending/` or `active/`):
- Print: "Phase <N> complete. All backlog items shipped."
- Read `.esper/phases/<current_phase>.md` and display the acceptance criteria checklist

  **If `pr_mode: "phase"`**: Open one PR summarizing the entire phase:

  ```bash
  gh pr create \
    --title "Phase <N>: <phase title from phases/phase-N.md>" \
    --base main \
    --body "$(cat <<'EOF'
  ## Phase <N> — <phase title>

  <phase goal, 1-2 sentences>

  ## Shipped plans
  - #<id> — <title>: <one-line approach summary>
  - #<id> — <title>: <one-line approach summary>
  ...

  ## Acceptance criteria
  <paste acceptance criteria checklist from phase file>
  EOF
  )"
  ```

  Print the PR URL. Then ask: "Ready to plan the next phase? Run `/esper:new` to add items, or `/esper:init` to define a new phase."

  **If `pr_mode: "plan"` (default or missing)**: Just ask: "Ready to plan the next phase? Run `/esper:new` to add items, or `/esper:init` to define a new phase."

Otherwise, print how many items remain (pending + active) and suggest `/esper:build` to continue.
