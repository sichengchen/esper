---
id: 006
title: Add esper:done skill — finalize a plan with a guaranteed commit
status: active
priority: 2
phase: phase-1
branch: phase/phase-1
created: 2026-02-18
---

# Add esper:done skill — finalize a plan with a guaranteed commit

## Context

Currently the esper workflow has two commit-related commands:
- `/esper:commit` — save partial progress anytime; only commits if there are changes
- `/esper:ship` — verify + commit + push + open PR + archive

There is no command that finalizes a plan (archives it to `done/`) without opening a PR. This gap matters most in `type: "feature"` plans, where per-plan PRs are skipped — the user needs a way to say "this plan is complete, commit my work and archive it" before moving on to the next plan. The phase PR is opened later by `esper:ship` when all phase plans are done.

The key difference from `/esper:commit`:
- `/esper:commit`: partial save, can be called anytime, no-ops if nothing changed
- `/esper:done`: finalization step — **always** produces a commit (even if the only change is the plan file itself), then archives the plan to `done/`

Existing skills:
- `skills/esper-commit/SKILL.md` — most similar; models the commit flow to reuse
- `skills/esper-ship/SKILL.md` — needs a small update: Step 1 currently only checks `active/`; after `esper:done`, the plan is in `done/` without a `pr` field, so `esper:ship` must also check `done/` for unshipped plans

`bin/cli.js` auto-discovers all `skills/` subdirectories — no changes needed there.

## Approach

### 1. Create `skills/esper-done/SKILL.md`

**Step 1: Check setup**
- Verify `.esper/esper.json` exists; if not, stop and tell user to run `/esper:init`
- Read `.esper/plans/active/`. If no `.md` file exists, stop: "No active plan to finalize."
- Read the active plan's full content and frontmatter (`id`, `title`, `branch`, `type`)

**Step 2: Run verification**
- Read `commands` from `esper.json`. For each of `test`, `lint`, `typecheck`:
  - Skip if empty or missing
  - Run if non-empty; capture exit code
- If any non-empty command fails, stop and report. Do NOT proceed.
- If all are empty, print: "No verification commands configured — skipping." and continue.

**Step 3: Commit (always)**
- Run `git diff HEAD` and `git status` to see what's changed
- Stage all files related to the plan (and the plan file itself)
- Draft commit message:
  ```
  <type>: <concise description>

  <1-3 sentences on what changed and why>

  Plan: #<id> — <title>
  ```
- Show draft to user and wait for approval
- Commit:
  ```bash
  git commit -m "$(cat <<'EOF'
  <approved message>
  EOF
  )"
  ```
- If there is **nothing to stage** (working tree is clean), do a no-op note: "Nothing to commit — plan file will be archived as-is." and continue to Step 4 without committing.

**Step 4: Archive**
- Move the plan file from `.esper/plans/active/<filename>` to `.esper/plans/done/<filename>`
- Update the frontmatter:
  ```yaml
  status: done
  shipped_at: <today's date in YYYY-MM-DD format>
  ```
  (No `pr:` field yet — that is added by `esper:ship` when the PR is opened)

**Step 5: Summary**
- Print: "Plan #<id> — <title> archived to done/."
- If `type: "feature"`: print "Feature plan: run `/esper:build` to continue with the next plan. The phase PR will be opened by `/esper:ship` when all plans are done."
- If `type: "fix"` (or missing): print "Next: run `/esper:ship` to push and open a PR."

### 2. Update `skills/esper-ship/SKILL.md` — Step 1

Change Step 1 to also check `done/` for unshipped plans:

> Read `.esper/plans/active/`. If it contains a `.md` file, use that plan.
>
> If `active/` is empty, check `.esper/plans/done/` for the most recently modified plan file that has **no `pr:` field** (or `pr:` is empty). If found, use that plan — it was finalized with `/esper:done` but not yet pushed or PR'd.
>
> If neither is found, tell the user "No active or unshipped plan." and stop.

Change Step 6 to handle already-archived plans:

> If the plan file is in `active/`: move it to `.esper/plans/done/<filename>`, set `status: done`, `shipped_at: today`, `pr: <PR URL>`.
>
> If the plan file is already in `done/` (was archived by `/esper:done`): do not move it. Just update its frontmatter to add `pr: <PR URL>`.

## Files to change

- `skills/esper-done/SKILL.md` (create — the new skill)
- `skills/esper-ship/SKILL.md` (modify — Step 1: check done/ fallback; Step 6: handle already-archived plans)

## Verification

- Run: manual
- Expected:
  - Feature plan workflow: implement plan → `/esper:done` → plan is in `done/` with `status: done`, `shipped_at` set, no `pr` field; working tree committed → repeat for next plan → `/esper:ship` finds done plans, opens phase PR, adds `pr:` to each plan's frontmatter
  - Fix plan workflow: implement → `/esper:done` → `/esper:ship` finds the done plan, pushes, opens PR, updates plan frontmatter with `pr:` URL
  - `/esper:commit` behavior unchanged
- Edge cases:
  - No active plan when running `/esper:done` → stop with clear message
  - Working tree is already clean when `/esper:done` runs → skip commit gracefully, still archive
  - `/esper:ship` run after `/esper:done` in plan mode → finds plan in done/ without pr field, ships it
  - Multiple done plans without `pr` field → esper:ship picks the most recently modified one (or ask user)
