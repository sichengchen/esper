---
id: 003
title: Prepare package for npm publish
status: done
priority: 3
phase: phase-1
branch: feature/npm-publish-prep
created: 2026-02-18
shipped_at: 2026-02-18
---

# Prepare package for npm publish

## Context

`package.json` currently has minimal fields. Added npm metadata for discoverability.

## Files changed

- `package.json` — added `keywords`, `repository`, `homepage`, `author`; normalized `bin` path (npm pkg fix); added `scripts.test`
- `.npmignore` — excludes `test/`, `.esper/`, `.claude/`, `.git/`
- `README.md` — added npm badge, `/esper:done` and `/esper:yolo` to commands table, `archived/` to directory structure

## Verification

- `npm publish --dry-run` — no warnings; tarball contains only `bin/`, `skills/`, `hooks/`, `README.md`, `package.json`
- Total package: 11.5 kB packed, 32.3 kB unpacked, 11 files

## Progress

- Updated `package.json`: added keywords, repository (git+https normalized), homepage, author; ran `npm pkg fix` to remove `./` prefix from bin path
- Created `.npmignore`: excludes test/, .esper/, .claude/, .gitignore from published package
- Updated `README.md`: added npm badge, `/esper:done` and `/esper:yolo` entries, `archived/` in structure diagram
- Verification: `npm publish --dry-run` passed with no warnings — tarball is clean
