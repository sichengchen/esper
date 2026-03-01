# Core Overview

Status: Draft
Date: 2026-03-01

## Summary

EsperKit is a tool-neutral workflow layer for AI-assisted software development. It combines:

1. A CLI toolkit for deterministic project initialization and filesystem-backed project state.
2. A skills and command layer that tells coding agents how to use that state.

The system is organized around durable specs, explicit execution artifacts, and predictable approval boundaries.

## Core Rules

- In Spec-to-Code, the approved spec is the sole source of scope and requirements.
- In Spec-to-Code, there is no second approval gate for a derived increment plan.
- In Plan-to-Spec, the increment remains the approval artifact.
- Behavior descriptions and concrete scenarios are first-class spec artifacts.
- For bounded, testable changes, agents should derive red-green execution from approved behavior scenarios when practical.

## Spec Storage Format

Specs are stored first by module, then by topic.

Default rule:

- use `<spec_root>/<module>/<topic>.md` when the project has multiple meaningful modules
- if the project has only one module, the extra module layer is optional and may be omitted

For EsperKit itself, the module layer is required because the system has multiple modules.

## Design Principles

1. Tool-neutral first: project state must remain readable without dependence on one vendor runtime.
2. Specs are durable: the spec tree must live in files, be revisable, and stay aligned with shipped behavior.
3. One contract at a time: in Spec-to-Code, the approved spec is authoritative; in Plan-to-Spec, one parent increment is authoritative.
4. Frozen inputs for autonomy: autonomous runs review against persisted artifacts, not conversation history.
5. Bounded autonomy: automated loops require explicit stop conditions and escalation rules.
6. Human-readable behavior: the spec tree must make intended and current behavior easy for a user to inspect quickly.

## Users

### Primary Users

- solo developers using AI coding agents daily
- small product teams using agent-driven development
- developers working across coding-agent terminals and IDE-like tools

### Secondary Users

- tool builders integrating EsperKit state into custom agent workflows
- contributors joining a project mid-stream who need durable context
- teams adopting spec-first work for larger, higher-risk changes

## Module Map

- `core`: product-level overview and cross-cutting rules
- `workflow`: lifecycle, approval, and behavior semantics
- `state`: persisted models, runtime context, and configuration
- `state`: persisted models, runtime context, interoperability rules, and configuration
- `cli`: deterministic CLI interface
- `skills`: instruction-layer interface
- `patterns`: reusable engineering patterns

## Decision Summary

EsperKit is a cross-tool SDD workflow layer with:

- a split, durable spec tree rooted at `spec_root`
- first-class support for both Spec-to-Code and Plan-to-Spec
- one authoritative scope contract at a time
- a bounded autonomous multi-agent execution mode inside Spec-to-Code
- a first-class run model for task packets, review rounds, and repair loops
- behavior-first review rules that support BDD-style inspection and TDD execution
