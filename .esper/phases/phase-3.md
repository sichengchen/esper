---
phase: phase-3
title: Add Codex Support
status: active
---

# Phase 3: Add Codex Support

## Goal

Expand esperkit from Claude-only to support Codex workflows while preserving the existing project structure and phase-based delivery model.

## In Scope

- Define Codex-compatible command flow for init, planning, implementation, and shipping
- Add install targets for Codex assets alongside existing Claude skills
- Update docs and templates to cover both Claude and Codex usage
- Add tests for provider-aware CLI behavior

## Out of Scope (deferred)

- Removing Claude support
- Multi-agent orchestration across providers
- Hosted dashboard or remote control plane

## Acceptance Criteria

- [ ] `esperkit` installs artifacts required for Codex in addition to Claude
- [ ] Existing Claude workflows remain backward compatible
- [ ] README documents setup and end-to-end flow for Codex users
- [ ] Tests cover provider-aware install and command behavior

## Phase Notes

Phase 2 delivered CLI primitives (`config`, `plan`, `backlog`) and consolidated plan/file operations. Phase 3 should reuse those primitives so Codex support is mostly adapter and packaging work, not a redesign.
