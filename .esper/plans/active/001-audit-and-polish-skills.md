---
id: 001
title: Audit and polish all 6 skill SKILL.md files
status: active
priority: 1
phase: phase-1
branch: feature/polish-skills
created: 2026-02-18
---

# Audit and polish all 6 skill SKILL.md files

## Context

All 6 skills already exist in `skills/`:
- `skills/esper-init/SKILL.md` — longest and most complex; covers 7 steps including hooks generation
- `skills/esper-build/SKILL.md` — 9-step implementation workflow with git branch management
- `skills/esper-ship/SKILL.md` — verify → commit → push → PR → archive flow
- `skills/esper-commit/SKILL.md` — git diff analysis and commit message drafting
- `skills/esper-backlog/SKILL.md` — formatted table display of pending/active/done plans
- `skills/esper-new/SKILL.md` — interview → codebase exploration → plan file creation

The `hooks/` directory at repo root contains `verify-quick.sh` and `session-reminder.sh` — these appear to be esper's own dev hooks (not template files).

## Approach

1. Read each SKILL.md file in full
2. For each skill, check:
   - Are all referenced paths correct (`.esper/plans/`, frontmatter fields, etc.)?
   - Are instructions unambiguous — would Claude reliably follow them in a fresh context?
   - Is the AskUserQuestion usage correct (valid JSON, 2-4 options per question)?
   - Are edge cases handled (empty backlog, no active plan, git errors)?
   - Does the skill's output match what downstream skills expect?
3. Fix any gaps, ambiguities, or inconsistencies found
4. Ensure the `esper-init` skill's hook generation matches the actual hook files in `hooks/`
5. Validate cross-skill consistency: plan frontmatter fields used by `esper-backlog` and `esper-ship` are written correctly by `esper-init` and `esper-new`

## Files to change

- `skills/esper-init/SKILL.md` (modify — fix any gaps in the 7-step flow)
- `skills/esper-build/SKILL.md` (modify — review edge cases and git error handling)
- `skills/esper-ship/SKILL.md` (modify — verify PR creation command is correct)
- `skills/esper-commit/SKILL.md` (modify — review staging and message format)
- `skills/esper-backlog/SKILL.md` (modify — confirm frontmatter fields match)
- `skills/esper-new/SKILL.md` (modify — confirm subagent usage is correct)

## Verification

- Run: Manual — open a test project, run `/esper:init`, walk through the full workflow
- Expected: All 6 commands work without Claude getting confused or stalling
- Edge cases: Empty backlog, no active plan on `/esper:ship`, git branch already exists on `/esper:build`

## Progress

- Audited all 6 SKILL.md files for correctness, ambiguity, edge cases, and cross-skill consistency
- Fixed `esper-init`: Added explicit handling for "Update constitution" / "Add new phase" / "Reset everything" paths; added `AskUserQuestion` call in Step 4 (phase interview); specified YYYY-MM-DD date format; made hook template concrete with a working example; made Step 7 output explicit; added directory creation instructions
- Fixed `esper-build`: Added empty backlog handling (stop + suggest `/esper:new`); added explicit "continue with active plan → skip to Step 5" path; made test skip condition explicit (skip if `commands.test` is empty)
- Fixed `esper-ship`: Replaced ambiguous "run /esper:commit workflow inline" with explicit inline commit steps; made archive file move destination explicit; clarified phase check filter by `phase:` frontmatter; added push failure handling
- Fixed `esper-commit`: Specified `git diff HEAD` for seeing staged+unstaged changes; added fallback when no active plan exists (stage all, draft generic message); added `AskUserQuestion` for handling unrelated modified files
- Fixed `esper-backlog`: Added empty backlog message; clarified DONE sort behavior with missing `shipped_at`; added "omit empty sections" rule; added `shipped_at` date to done row display
- Fixed `esper-new`: Replaced vague prose subagent description with explicit Task tool invocation; added CONSTITUTION.md read before interview; added out-of-scope check; clarified priority guidance (1=urgent, 2=normal, 3=low)
- Modified: skills/esper-init/SKILL.md, skills/esper-build/SKILL.md, skills/esper-ship/SKILL.md, skills/esper-commit/SKILL.md, skills/esper-backlog/SKILL.md, skills/esper-new/SKILL.md
- Verification: Manual (SKILL.md files are validated through real Claude Code usage per constitution)
