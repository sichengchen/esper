---
id: 003
title: Prepare package for npm publish
status: pending
priority: 3
phase: phase-1
branch: feature/npm-publish-prep
created: 2026-02-18
---

# Prepare package for npm publish

## Context

`package.json` currently has minimal fields: `name`, `version`, `description`, `bin`, `files`, `engines`, `type`, `license`. It is missing `keywords`, `repository`, `homepage`, and `author` — all of which improve npm discoverability. The README is well-written but lacks a badge and could use a cleaner TL;DR at the top for npm visitors.

## Approach

1. Add to `package.json`:
   - `keywords`: `["claude-code", "ai", "developer-tools", "vibe-coding", "agent", "workflow"]`
   - `repository`: `{ "type": "git", "url": "https://github.com/sichengchen/esper" }` (confirm URL)
   - `homepage`: GitHub repo URL
   - `author`: user's name/email
   - Bump version to `0.1.0` if not already
2. Verify `files` array in `package.json` includes everything needed (`bin/`, `skills/`, `hooks/`) and excludes test files and `.esper/`
3. Add `.npmignore` (or verify `.gitignore` covers it) to exclude `test/`, `.esper/`, `.claude/` from the published package
4. Add a one-line npm install badge to README and confirm the `npx` command is correct
5. Do a dry-run publish: `npm publish --dry-run` to confirm the package contents

## Files to change

- `package.json` (modify — add metadata fields, confirm version)
- `.npmignore` (create — exclude test/, .esper/, .claude/ from npm publish)
- `README.md` (modify — add npm badge, confirm npx command)

## Verification

- Run: `npm publish --dry-run`
- Expected: Dry-run output shows only `bin/`, `skills/`, `hooks/` in the tarball; no test files or .esper/ included
- Edge cases: Confirm `npx @sichengchen/esper` works from a directory without the package installed locally
