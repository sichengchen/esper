---
phase: phase-1
title: Polish and Publish
status: active
---

# Phase 1: Polish and Publish

## Goal

Deliver a polished, publishable 0.1.0 to npm. All six skills work end-to-end, the CLI installs correctly, smoke tests pass, and the package is ready for real users to `npx @sichengchen/esper`.

## In Scope

- Audit and polish all 6 skill SKILL.md files for correctness and clarity
- Add smoke tests for the CLI installer
- Prepare `package.json` with full npm metadata (keywords, repository, homepage)
- Polish README for npm discoverability
- Publish `0.1.0` to npm

## Out of Scope (deferred)

- GitHub Issues backlog mode (the sync logic is specced in skills but not the focus now)
- Web dashboard or any visual interface
- Additional skills beyond the current 6
- Automated testing of skill behavior (manual validation only for MVP)

## Acceptance Criteria

- [ ] All 6 skills (`esper:init`, `esper:backlog`, `esper:new`, `esper:build`, `esper:commit`, `esper:ship`) pass manual end-to-end validation in a test project
- [ ] `npx @sichengchen/esper` installs skills correctly and exits cleanly
- [ ] CLI smoke tests pass via `node --test test/`
- [ ] `package.json` has keywords, repository, and homepage fields
- [ ] Version is `0.1.0` and package is published to npm as `@sichengchen/esper`
