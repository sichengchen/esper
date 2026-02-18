---
name: esper:done
description: Finalize a plan with a guaranteed commit and archive it to done/. Use instead of esper:ship when the plan is type "feature" and you want to archive before moving on (the phase PR opens later).
---

You are finalizing the active backlog item — committing any remaining work and archiving the plan to `done/`.

## Step 1: Check setup

Verify `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first and stop.

Read `.esper/plans/active/`. If no `.md` file exists, stop: "No active plan to finalize."

Read the active plan's full content and frontmatter (`id`, `title`, `branch`, `type`).

## Step 2: Run verification

Read `commands` from `esper.json`. For each of `test`, `lint`, and `typecheck`:
- Skip it entirely if the value is an empty string or the key is missing
- Run it if non-empty and capture the exit code

If all three commands are empty or missing, print: "No verification commands configured — skipping." Then continue.

If any non-empty command fails, stop and report the failures clearly. Do NOT proceed.

## Step 3: Commit (always)

Run `git diff HEAD` and `git status` to see what's changed.

If there are changes to commit:
1. Stage the files related to this plan (including the plan file itself): `git add <relevant files>`
2. Draft a commit message:
   ```
   <feat|fix|chore>: <concise description>

   <1-3 sentences on what changed and why>

   Plan: #<id> — <title>
   ```
3. Show the draft to the user and wait for approval
4. Once approved, commit:
   ```bash
   git commit -m "$(cat <<'EOF'
   <approved message>
   EOF
   )"
   ```

If the working tree is already clean (nothing to commit), print: "Nothing to commit — plan file will be archived as-is." and continue to Step 4 without committing.

## Step 4: Archive

Move the plan file from `.esper/plans/active/<filename>` to `.esper/plans/done/<filename>` (same filename).

Update the frontmatter of the moved file:
```yaml
status: done
shipped_at: <today's date in YYYY-MM-DD format>
```

Do NOT add a `pr:` field — that is added by `esper:ship` when the PR is opened.

Commit the archive:
```bash
git add .esper/plans/done/<filename>
git add .esper/plans/active/<filename>   # stages the deletion
git commit -m "chore: archive plan #<id> — <title>"
```

## Step 5: Summary

Print: "Plan #<id> — <title> archived to done/."

If `type: "feature"`: print "Feature plan: run `/esper:build` to continue with the next plan. The phase PR will be opened by `/esper:ship` when all plans are done."

If `type: "fix"` (or type is missing): print "Next: run `/esper:ship` to push and open a PR for this fix."
