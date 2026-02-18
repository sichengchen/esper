---
name: esper:ship
description: Verify, commit, push, open a PR, and archive the active plan. Run when a backlog item is complete.
---

You are shipping the active backlog item.

## Step 1: Check there is an active plan

Read `.esper/plans/active/`. If it contains a `.md` file, use that as the active plan.

If `active/` is empty, check `.esper/plans/done/` for the most recently modified plan file that has **no `pr:` field** (or `pr:` is empty or blank). If found, use that plan — it was finalized with `/esper:done` but not yet pushed or PR'd.

If neither is found, tell the user "No active or unshipped plan to ship." and stop.

Read the plan's full content and frontmatter (`id`, `title`, `type`, `branch`, `phase`, `gh_issue` if present).

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

## Step 4: Archive the plan

Move the plan file from `.esper/plans/active/<filename>` to `.esper/plans/done/<filename>` (same filename).

Update the frontmatter of the moved file:
```yaml
status: done
shipped_at: <today's date in YYYY-MM-DD format>
```

(Leave `pr:` out for now — the PR URL isn't known until Step 6.)

Then commit the archive:
```bash
git add .esper/plans/done/<filename>
git add .esper/plans/active/<filename>  # to stage the deletion
git commit -m "chore: archive plan #<id> — <title>"
```

## Step 5: Push the branch

```bash
git push -u origin <branch from plan frontmatter>
```

If the push fails (e.g. no remote, auth issue), report the error and stop.

## Step 6: Open a PR

Read `type` from the plan frontmatter.

**If `type: "feature"`**: Skip PR creation. Print: "Feature plan: PR will be opened when the full phase is complete." Then continue to Step 7.

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

After the PR is opened, update the plan's `pr:` field with the PR URL (no extra commit needed — this is local metadata):
- If the plan was in `active/` (now in `done/` after Step 4): update `pr:` in `done/<filename>`
- If the plan was already in `done/` (archived by `/esper:done`): update `pr:` in the existing `done/` file

If `type: "fix"` and `backlog_mode` is `"github"` in `esper.json` and `gh_issue` is set in the plan:
```bash
gh issue close <gh_issue> --comment "Shipped in <PR URL>"
```

## Step 7: Phase check

Read all plan files across `pending/`, `active/`, and `done/` where `phase:` matches `current_phase` from `esper.json`.

If all plans for the current phase are in `done/` (none remain in `pending/` or `active/`):
- Print: "Phase <N> complete. All backlog items shipped."
- Read `.esper/phases/<current_phase>.md` and display the acceptance criteria checklist
- **Archive the phase plans**: Move all `.md` files from `.esper/plans/done/` whose `phase:` frontmatter matches `current_phase` into `.esper/plans/archived/<current_phase>/` (create the directory if it doesn't exist). Only move plans matching the completed phase — leave any other-phase plans in `done/`.
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

  Print the PR URL. After the PR is opened, update each feature plan in `done/` to add `pr: <PR URL>` to its frontmatter.

  Ask: "Ready to plan the next phase? Run `/esper:new` to add items, or `/esper:init` to define a new phase."

Otherwise, print how many items remain (pending + active) and suggest `/esper:build` to continue.
