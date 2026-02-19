---
name: esper:ship
description: Push the finished plan, open a PR, and archive the phase when all plans are done. Run after /esper:finish has archived the plan to done/.
---

You are shipping a finished backlog item.

## Step 1: Find the plan to ship

Check for uncommitted changes:
```bash
git status --porcelain
```
If the working tree is dirty, stop: "Uncommitted changes found. Run `/esper:finish` first to commit and archive the plan."

Run `esper plan list --dir done --format json` to get all done plans. Filter for plans that have **no `pr` field** (or `pr` is empty or blank). If found, use that plan — it was finalized with `/esper:finish` but not yet pushed or PR'd.

If no unshipped plan is found, tell the user "No finished plan to ship. Run `/esper:finish` first." and stop.

If multiple unshipped plans are found, use `AskUserQuestion` to ask which one to ship.

Read the plan's full content and frontmatter (`id`, `title`, `type`, `branch`, `phase`, `gh_issue` if present).

## Step 2: Run full verification

Run `esper config get commands` to get the commands object. For each of `test`, `lint`, and `typecheck`:
- Skip it entirely if the value is an empty string or the key is missing
- Run it if non-empty and capture the exit code

If all three commands are empty or missing, print: "No verification commands configured — skipping." Then continue.

If any non-empty command fails, stop and report the failures clearly. Do NOT proceed.

## Step 3: Push the branch

```bash
git push -u origin <branch from plan frontmatter>
```

If the push fails (e.g. no remote, auth issue), report the error and stop.

## Step 4: Open a PR

Read `type` from the plan frontmatter.

**If `type: "feature"`**: Skip PR creation. Print: "Feature plan: PR will be opened when the full phase is complete." Then continue to Step 5.

**If `type: "fix"`**: Create the PR using the `gh` CLI:

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

Update the plan's `pr:` field: run `esper plan set <filename> pr <PR URL>` (no extra commit needed — local metadata).

Run `esper config get backlog_mode`. If the output is `github` and `gh_issue` is set in the plan:
```bash
gh issue close <gh_issue> --comment "Shipped in <PR URL>"
```

## Step 5: Phase check

Run `esper config get current_phase` to get the current phase. Then run `esper plan list --dir pending --phase <phase> --format json`, `esper plan list --dir active --phase <phase> --format json`, and `esper plan list --dir done --phase <phase> --format json` to check plan status.

**If plans remain in `pending/` or `active/`**: print how many items remain and suggest `/esper:apply` to continue.

**If all plans for the current phase are in `done/`**:
- Print: "Phase <N> complete. All backlog items shipped."
- Read `.esper/phases/<current_phase>.md` and display the acceptance criteria checklist
- **Archive the phase plans**: Run `esper plan archive <current_phase>` to move all done plans for the phase to `archived/<current_phase>/`.
- Print: "Phase plans archived to `.esper/plans/archived/<current_phase>/`"
- Open ONE PR summarizing the entire phase (targeting `main`):

  Collect all plans where `type: "feature"` for the phase PR body. `type: "fix"` plans already have their own PRs and are excluded.

  ```bash
  gh pr create \
    --title "Phase <N>: <phase title from phases/phase-N.md>" \
    --base main \
    --body "$(cat <<'EOF'
  ## Phase <N> — <phase title>

  <phase goal, 1-2 sentences>

  ## Shipped plans
  - #<id> — <title>: <one-line approach summary>
  ...

  ## Acceptance criteria
  <paste acceptance criteria checklist from phase file>

  <if backlog_mode is "github" and any feature plan has gh_issue set:>
  Closes #<issue1>, Closes #<issue2>, ...
  EOF
  )"
  ```

  Print the PR URL. After the PR is opened, update each feature plan in `archived/<current_phase>/` by running `esper plan set <filename> pr <PR URL>` for each.

  Print: "Ready to plan the next phase? Run `/esper:phase` to define Phase <N+1>."
