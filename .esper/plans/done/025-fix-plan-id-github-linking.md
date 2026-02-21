---
id: 25
title: fix: stop plan #N references from triggering GitHub auto-linking
status: done
type: fix
priority: 2
phase: 004-exploration-and-review-skills
branch: feature/phase-4
created: 2026-02-21
shipped_at: 2026-02-21
pr: https://github.com/sichengchen/esper/pull/8
---
# fix: stop plan #N references from triggering GitHub auto-linking

## Context

Skill files use `#<id>` to reference plan IDs in commit messages and PR bodies (e.g. `Plan: #021`). GitHub automatically links `#N` patterns to issues and PRs, so `#8` in a PR body would link to PR #8 instead of being a plain plan reference. This causes confusing cross-links in GitHub.

### Affected locations

**Commit messages** (less critical — GitHub doesn't auto-link in commit messages on the CLI, but does in the web UI):
- `esper-apply/SKILL.md` line 102: `Plan: #<id> — <title> (milestone)`
- `esper-continue/SKILL.md` line 79: `Plan: #<id> — <title>`
- `esper-finish/SKILL.md` lines 42, 65: `Plan: #<id>`, `chore: archive plan #<id>`
- `esper-yolo/SKILL.md` lines 95, 143, 171: milestone commits, archive commits
- `esper-ship/SKILL.md` line 81: `chore: record PR link for plan #<id>`

**PR bodies** (most critical — GitHub renders these as clickable links):
- `esper-ship/SKILL.md` lines 63, 116: `Plan: #<plan id>`, shipped plan list `- #<id> — <title>`
- `esper-yolo/SKILL.md` lines 212: shipped plan list in phase PR body

**Phase file shipped plans section** (rendered in PR bodies):
- `esper-finish/SKILL.md` line ~80: one-liner format `- #<id> — <title>: ...`
- `esper-yolo/SKILL.md` lines 155-157: one-liner format

**JS source**:
- `lib/plan.js` line 327: `Plan: #${frontmatter.id}` in GitHub issue body

**Intentional GitHub references** (should keep `#N`):
- `esper-ship/SKILL.md` line 64: `Closes #<gh_issue>` — this is a real GitHub issue reference
- `esper-ship/SKILL.md` line 123, `esper-yolo/SKILL.md` line 219: `Closes #<phase_gh_issue>`

## Approach

Replace `#<id>` with `Plan <id>` (no hash) in all plan references to avoid GitHub auto-linking. Keep `Closes #<gh_issue>` patterns unchanged since those are intentional GitHub references.

1. Update all skill SKILL.md files — change `#<id>` plan references to `Plan <id>` or `plan <id>` (no hash prefix). Specific patterns:
   - Commit messages: `Plan: #<id>` → `plan <id>` (e.g. `plan 021 — title (milestone)`)
   - PR bodies: `- #<id> — <title>` → `- Plan <id> — <title>`
   - Archive commits: `chore: archive plan #<id>` → `chore: archive plan <id>`
   - Terminal display (YOLO queue): keep `#<id>` — these aren't sent to GitHub

2. Update `lib/plan.js` — change `Plan: #${frontmatter.id}` to `Plan ${frontmatter.id}`

3. Update shipped plans one-liner format in `esper-finish/SKILL.md` and `esper-yolo/SKILL.md` — change `- #<id> — <title>` to `- Plan <id> — <title>`

4. Leave `Closes #<gh_issue>` patterns unchanged — they are real GitHub issue references

## Files to change

- `skills/esper-apply/SKILL.md` (modify — commit message pattern)
- `skills/esper-continue/SKILL.md` (modify — commit message pattern)
- `skills/esper-finish/SKILL.md` (modify — commit messages and shipped plans format)
- `skills/esper-ship/SKILL.md` (modify — PR body and commit messages)
- `skills/esper-yolo/SKILL.md` (modify — commit messages, PR body, shipped plans format)
- `lib/plan.js` (modify — issue body construction)

## Verification

- Run: `node --test test/*.test.js`
- Expected: all tests pass
- Edge cases: ensure `Closes #<gh_issue>` references are preserved, verify terminal-only output (YOLO queue display) still uses `#` for readability

## Progress
- Replaced `#<id>` with `Plan <id>` (PR bodies) and `plan <id>` (commit messages) in all 5 skill files and lib/plan.js
- Preserved intentional `Closes #<gh_issue>` patterns and terminal-only `#<id>` display
- Modified: skills/esper-apply/SKILL.md, skills/esper-continue/SKILL.md, skills/esper-finish/SKILL.md, skills/esper-ship/SKILL.md, skills/esper-yolo/SKILL.md, lib/plan.js
- Verification: 64/64 tests pass
