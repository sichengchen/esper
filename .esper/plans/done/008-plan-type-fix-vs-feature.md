---
id: 008
title: Redesign PR strategy — per-plan type (fix vs feature) replaces global pr_mode
<<<<<<<< HEAD:.esper/plans/done/008-plan-type-fix-vs-feature.md
status: done
========
status: pending
>>>>>>>> fix/ship-archive-before-push:.esper/plans/pending/008-plan-type-fix-vs-feature.md
priority: 1
phase: phase-1
branch: feature/phase-1
created: 2026-02-18
shipped_at: 2026-02-18
---

# Redesign PR strategy — per-plan type (fix vs feature) replaces global pr_mode

## Context

The current `pr_mode` config in `esper.json` is a project-level toggle (`"plan"` | `"phase"`). This is too coarse — a project typically has both hotfixes (each deserves its own PR) and feature work (batched into a phase PR). A global toggle forces you to pick one mode for everything.

**New model**: per-plan `type` field with two values:
- `type: "fix"` — a self-contained patch: 1 task, 1 branch (`fix/slug`), 1 PR opened immediately on ship
- `type: "feature"` — part of a phase: shared `feature/phase-N` branch, PR deferred until the whole phase ships

**GitHub Issues rule**: strictly 1 issue → 1 PR regardless of type.
- `fix`: issue closes when the fix PR merges
- `feature` (phase): phase PR closes all phase issues at once (`Closes #1, Closes #2, ...`)

This replaces `pr_mode` in `esper.json` entirely. No backwards compatibility — `pr_mode` is removed, `type` is required on all new plans.

Affected skills:
- `skills/esper-init/SKILL.md` — remove pr_mode question; add type when decomposing backlog
- `skills/esper-new/SKILL.md` — ask type during interview; set branch accordingly
- `skills/esper-ship/SKILL.md` — read type from plan (not pr_mode from esper.json)

## Approach

### 1. Update `esper-init/SKILL.md`

**Round 3 — Process**: Remove the PR mode question entirely (no more global `pr_mode`).

**Step 3 — esper.json**: Remove `pr_mode` field from the template:
```json
{
  "backlog_mode": "local",
  "current_phase": "phase-1",
  "commands": { ... }
}
```

**Step 5 — Decompose into backlog items**: When writing each plan file, ask (or infer from context) whether each item is a fix or a feature. Set `type:` and `branch:` accordingly:
- `type: "fix"` → `branch: fix/[kebab-slug]`
- `type: "feature"` → `branch: feature/[current_phase]` (e.g. `feature/phase-1`)

Add `type:` to the plan frontmatter template:
```yaml
---
id: 001
title: [task title]
status: pending
type: feature
priority: 1
phase: phase-1
branch: feature/phase-1
created: YYYY-MM-DD
---
```

### 2. Update `esper-new/SKILL.md`

**Step 2 — Interview**: Add a question: "Is this a fix or a feature?"
- `fix`: self-contained patch, gets its own PR immediately when shipped
- `feature`: part of the current phase, batched into the phase PR

**Step 5 — Write the plan file**: Set `type:` and `branch:` based on the answer:
- `type: "fix"` → `branch: fix/[kebab-slug]`
- `type: "feature"` → `branch: feature/[current_phase from esper.json]` (e.g. `feature/phase-1`)

### 3. Update `esper-ship/SKILL.md`

Replace all `pr_mode` references with `type` from the plan frontmatter. No fallback — `type` is required.

**Step 5 — Open a PR**:
- `type: "fix"`: open PR immediately. If `gh_issue` is set, include `Closes #<gh_issue>` in the PR body.
- `type: "feature"`: skip per-plan PR. Print: "Feature plan: PR will be opened when phase is complete."

**Step 6 — Archive**: unchanged (move to done/, set status: done, shipped_at, pr if applicable).

**Step 7 — Phase check**, when all phase plans are done:
- For `type: "feature"` plans with GitHub Issues (`gh_issue` set): collect all their issue numbers
- Open ONE phase PR:
  ```bash
  gh pr create \
    --title "Phase <N>: <phase title>" \
    --base main \
    --body "$(cat <<'EOF'
  ## Phase <N> — <phase title>

  <phase goal>

  ## Shipped plans
  - #<id> — <title>: <one-line summary>

  ## Closes
  Closes #<issue1>, Closes #<issue2>, ...
  EOF
  )"
  ```
- After phase PR is opened, update each feature plan's `pr:` field with the phase PR URL.
- `type: "fix"` plans are already shipped with their own PRs and are excluded from the phase PR body.

## Files to change

- `skills/esper-init/SKILL.md` (modify — remove pr_mode question + esper.json field; add type + branch logic in Step 5)
- `skills/esper-new/SKILL.md` (modify — add type question in Step 2; set type + branch in Step 5)
- `skills/esper-ship/SKILL.md` (modify — replace pr_mode checks with type; no fallback; phase PR closes all feature issues)

## Verification

- Run: manual
- Expected:
  - `esper:new` with `type: "fix"`: plan gets `branch: fix/[slug]`; `/esper:ship` opens PR immediately; if gh_issue set, closes it
  - `esper:new` with `type: "feature"`: plan gets `branch: feature/phase-1`; `/esper:ship` skips PR; phase PR opens when all features ship, closes all feature gh_issues
- Edge cases:
  - Phase contains a mix of fix and feature plans — only feature plans are listed in the phase PR; fix plans already have their own PRs
  - No GitHub Issues (`backlog_mode: "local"`) — `Closes #N` lines are omitted from phase PR body

## Progress

- Removed `pr_mode` from all skills — zero references remain
- `esper-init`: removed PR mode question from Round 3; removed `pr_mode` from esper.json template; replaced branch logic with `type: "fix" | "feature"` + corresponding branch prefix (`fix/` or `feature/phase-N`)
- `esper-new`: added fix-vs-feature question in Step 2; Step 5 sets `type:` + `branch:` based on answer
- `esper-ship`: Step 1 reads `type` from plan frontmatter; Step 5 opens PR immediately for `fix`, skips for `feature`; Step 6 closes gh_issue only for `fix`; Step 7 always opens phase PR on phase completion (feature plans only in body), updates each feature plan's `pr:` field after PR opens
- Modified: skills/esper-init/SKILL.md, skills/esper-new/SKILL.md, skills/esper-ship/SKILL.md
- Verification: manual; `grep pr_mode skills/**/*.md` returns no matches
