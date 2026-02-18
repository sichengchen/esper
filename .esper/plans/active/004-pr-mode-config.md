---
id: 004
title: Add pr_mode config — PR per plan or PR per phase
status: active
priority: 2
phase: phase-1
branch: feature/pr-mode-config
created: 2026-02-18
---

# Add pr_mode config — PR per plan or PR per phase

## Context

Currently `esper:ship` always opens one PR per backlog item (plan). Some teams want to batch all plans in a phase into a single PR instead — shipping a phase as a unit.

**Key constraint**: `pr_mode: "phase"` is only valid when `backlog_mode: "local"`. GitHub Issues mode is architecturally per-plan by definition — the GitHub issue-PR model assumes one issue → one branch → one PR → merge closes the issue. Phase mode breaks this at every step:
- Issues would stay open for the whole phase with no PR to close them against
- `esper:ship` Step 6 calls `gh issue close` with a PR URL that doesn't exist yet in phase mode
- A phase PR closing multiple issues (`Closes #1, #2, #3`) is non-standard and confusing for reviewers

**Design decision**: when `backlog_mode: "github"`, `pr_mode` is always `"plan"` (enforced by `esper:init`). The `pr_mode` config only applies to local-backlog projects.

The relevant files:
- `skills/esper-init/SKILL.md` — Round 3 interview: PR mode question should only be asked when `backlog_mode: "local"`; Step 3 writes `esper.json`; Step 5 writes plan frontmatter `branch:` field
- `skills/esper-new/SKILL.md` — Step 5 writes the plan's `branch:` field
- `skills/esper-ship/SKILL.md` — Step 5 creates the PR; Step 7 is the phase-complete check

The constitution principle "Opinionated defaults, no configurability sprawl" applies — we are adding **one** meaningful config key (`pr_mode`) with exactly two values, only available in local mode. This is a genuine workflow fork, not feature bloat.

## Approach

**Branch strategy for `pr_mode: "phase"`**: all plans in a phase share one branch (`phase/phase-1`). One shared branch, one PR at the end. Plans still have individual `id`s and plan files, but their code lands on a single branch.

### 1. Update `esper-init/SKILL.md`

In **Round 3** (Process interview):
- If `backlog_mode: "github"`: do NOT ask about `pr_mode`. Write `"pr_mode": "plan"` to `esper.json` silently (GitHub Issues always implies plan mode). Optionally print a note: "GitHub Issues mode always uses per-plan PRs."
- If `backlog_mode: "local"`: ask the user about PR mode — "Open a PR for each backlog item, or open one PR when the full phase is done?" Options: `"plan"` (default) or `"phase"`

In **Step 3** (Write esper.json), add `pr_mode` field:
```json
{
  "backlog_mode": "local",
  "pr_mode": "plan",
  "current_phase": "phase-1",
  "commands": { ... }
}
```

In **Step 5** (Decompose into backlog items), set `branch:` based on `pr_mode`:
- `pr_mode: "plan"` → `branch: feature/[kebab-slug]` (current behavior)
- `pr_mode: "phase"` → `branch: phase/[current_phase]` (shared phase branch)

### 2. Update `esper-new/SKILL.md`

In **Step 5** (Write the plan file), read `pr_mode` from `esper.json` and set `branch:`:
- `pr_mode: "plan"` → `branch: feature/[kebab-slug]`
- `pr_mode: "phase"` → `branch: phase/[current_phase from esper.json]`

### 3. Update `esper-ship/SKILL.md`

In **Step 5** (Open a PR), check `pr_mode`:
- `pr_mode: "plan"` (default or missing): current behavior — open the PR, close `gh_issue` if set
- `pr_mode: "phase"`: skip PR creation; print "Phase mode: PR will be opened when phase is complete." Do NOT close any GitHub issue here (this combination is invalid — `backlog_mode` must be `"local"` if `pr_mode` is `"phase"`; no `gh_issue` fields will exist)

In **Step 7** (Phase check), when phase is complete AND `pr_mode: "phase"`:
- Open ONE PR summarizing the entire phase:
  - Title: `"Phase <N>: <phase title from phases/phase-N.md>"`
  - Body: list all shipped plans (id, title, one-line summary of approach)
  - Branch: `phase/<current_phase>` → base: `main`

When `pr_mode: "plan"`, Step 7 keeps its current behavior (no extra PR in phase check).

## Files to change

- `skills/esper-init/SKILL.md` (modify — PR mode question gated on `backlog_mode: "local"`; add `pr_mode` to esper.json template; set `branch:` conditionally)
- `skills/esper-new/SKILL.md` (modify — set `branch:` based on `pr_mode` from esper.json)
- `skills/esper-ship/SKILL.md` (modify — skip PR in Step 5 when `pr_mode: "phase"`; open phase PR in Step 7 on phase completion in phase mode)

## Verification

- Run: manual
- Expected:
  - `esper:init` with `backlog_mode: "github"` never asks about `pr_mode`; `esper.json` gets `"pr_mode": "plan"` automatically
  - `esper:init` with `backlog_mode: "local"` + `pr_mode: "phase"`: plans get `branch: phase/phase-1`; `/esper:ship` skips PR; phase PR opened when last plan ships
  - `esper:init` with `backlog_mode: "local"` + `pr_mode: "plan"` (default): behavior unchanged from current
- Edge cases:
  - Missing `pr_mode` in esper.json → treat as `"plan"` (backwards-compatible)
  - `pr_mode: "phase"` with `backlog_mode: "github"` in an existing esper.json (manually misconfigured) → `esper:ship` should warn and treat as `"plan"` to avoid breaking issue tracking

## Progress

- Implemented `pr_mode` config support across the three affected skills
- `esper-init`: Added `pr_mode` question in Round 3 (gated on `backlog_mode: "local"`); added `pr_mode` field to esper.json template; added conditional `branch:` naming in Step 5
- `esper-new`: Added `pr_mode`-based `branch:` naming logic in Step 5
- `esper-ship`: Step 5 skips PR when `pr_mode: "phase"`; Step 7 opens one phase-summary PR on phase completion when `pr_mode: "phase"`
- Modified: skills/esper-init/SKILL.md, skills/esper-new/SKILL.md, skills/esper-ship/SKILL.md
- Verification: Manual (no test suite yet — separate plan item); `pr_mode` grep across all 3 files confirms consistent semantics
