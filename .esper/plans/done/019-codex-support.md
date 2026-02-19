---
id: 19
title: Add Codex support across installer, assets, and docs
status: done
type: feature
priority: 1
phase: phase-3
branch: feature/phase-3
created: 2026-02-19
shipped_at: 2026-02-19
---
# Add Codex support across installer, assets, and docs

## Context

esperkit is currently Claude-only in both packaging and messaging:
- `bin/cli.js` installs skills to `~/.claude/skills/`
- README and package metadata position esper as "for Claude Code"
- Skill docs assume Claude-specific settings paths and command context

Phase 3 requires Codex support without breaking the current Claude workflow. The safest path is provider-aware install/config behavior, plus documentation and tests that cover both providers.

## Approach

1. Define provider model and install targets
   - Add explicit provider options for install (for example: `claude`, `codex`, `all`)
   - Keep current behavior backward compatible when no provider is specified
   - Add provider-specific destination path handling via config/env flags so tests can run in temp dirs

2. Add Codex asset support
   - Decide how esper commands/skills are represented for Codex in this repo
   - Add Codex-targeted templates/files alongside existing Claude skills
   - Ensure shared logic is reused to avoid duplicating workflow content unnecessarily

3. Update installer and CLI UX
   - Extend CLI routing/help text to expose provider-aware installation
   - Keep existing commands (`config`, `plan`, `backlog`) unchanged
   - Preserve current output for Claude users while adding clear Codex guidance

4. Update documentation and metadata
   - Rewrite README positioning and setup instructions to include Codex
   - Document where Codex assets are installed and how commands are used
   - Update package metadata (`description`, `keywords`) to reflect multi-provider support

5. Add tests for provider-aware behavior
   - Cover default install path (Claude compatibility)
   - Cover Codex install target and mixed/all target behavior
   - Verify stale-skill cleanup and output messaging still work as expected

## Files to change

- `bin/cli.js` (modify — provider-aware install logic and messaging)
- `README.md` (modify — document Codex setup and workflow)
- `package.json` (modify — update description/keywords for Codex support)
- `test/*.test.js` (modify/create — installer/provider behavior tests)
- `skills/` and/or provider-specific assets directory (modify/create — Codex-targeted assets)

## Verification

- Run: `npm test`
- Expected:
  - Existing tests remain green
  - New tests verify Claude default behavior remains unchanged
  - New tests verify Codex install target behavior
- Manual:
  - Run installer in a temp directory with provider/env overrides
  - Confirm expected assets are installed for each provider mode
- Edge cases:
  - Unknown provider value returns non-zero with clear usage
  - Provider target selected but asset directory missing fails loudly
  - No existing skill directory should still install cleanly

## Progress

- Implemented provider-aware install in `bin/cli.js` with `--provider claude|codex|all`
- Added Codex target resolution via `$CODEX_HOME/skills` (or `ESPER_CODEX_SKILLS_DIR`)
- Kept backward compatibility: no subcommand still installs to Claude target
- Updated README and package metadata to reflect Claude + Codex support
- Added installer coverage in `test/cli.test.js` for codex, all, and invalid provider
- Added modern installer TUI in `bin/cli.js` for interactive provider selection and styled install progress
- TUI now supports multi-select controls: arrow keys move, `space` toggles provider(s), `enter` starts install
- Added `--interactive` / `--no-tui` behavior and documented both in README
- README install section updated with provider-specific commands, targets, and env overrides
- Updated `test/config.test.js` assertion for installer banner text
- Verification: `npm test` passes (53/53)
