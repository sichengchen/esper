---
id: 15
title: Uninstall command and per-project install
status: done
type: feature
lane: atomic
priority: 1
created: 2026-03-04
spec: cli/commands.md
finished_at: 2026-03-04
---
# Uninstall command and per-project install

## Context

The current `esperkit install` command copies skills to global agent directories (`~/.claude/skills/`, `~/.codex/skills/`). There is no way to:
1. Remove installed skills (`uninstall`)
2. Install skills into a project-local directory instead of the global agent directory (`--project`)

Per-project install allows teams to pin skill versions in their repo (e.g. `.claude/skills/` within the project). Uninstall provides a clean removal path.

## Scope

1. **`esperkit uninstall`** — removes all esper skill directories from the agent skills folder(s)
   - Accepts `--provider claude|codex|all` (same as install)
   - Removes each `esper-*` skill directory that was installed
   - Prints removal status for each skill
   - Exits cleanly if nothing to remove

2. **`esperkit install --project`** — installs skills into the current project's `.claude/skills/` (or codex equivalent) rather than the global directory
   - Uses `<cwd>/.claude/skills/` for Claude, `<cwd>/.codex/skills/` for Codex
   - Otherwise behaves identically to global install (copies skills, removes stale, chmod .sh)
   - Errors if not in a git repo (no `.git/` directory)

## Files Affected
- `bin/cli.js` (modify — add uninstall handler, add --project flag to install, add uninstall to routing)
- `test/cli.test.js` (modify — add tests for uninstall and --project install)
- `specs/cli/commands.md` (modify — add uninstall to CLI surface)

## Verification
- Run: `npm test`
- Expected: all existing tests pass, new tests for uninstall and project-install pass

## Spec Impact
- `specs/cli/commands.md` — add `esperkit uninstall` to CLI surface

## Progress
- [x] `esperkit uninstall` command — removes all esper-* skills from agent dirs, supports --provider
- [x] `esperkit install --project` flag — installs to cwd/.claude/skills/ instead of global, requires .git
- [x] TUI wizard — refactored to generic `tuiSelect`, added action selector (install/install-project/uninstall)
- [x] Tests — 6 new tests (uninstall removes skills, codex-only uninstall, nothing-to-remove, stale skills, project install, project-no-git)
- [x] Spec updated — `specs/cli/commands.md` includes new commands
- [x] README updated — install --project and uninstall sections
- [x] User manual updated — install --project and uninstall sections
- All 117 tests pass
