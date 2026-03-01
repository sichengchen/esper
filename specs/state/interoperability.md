# State Interoperability

Status: Draft
Date: 2026-03-01

## Scope

EsperKit must work across coding agents and IDE-like tools while preserving one tool-neutral on-disk contract.

## Supported Host Categories

- Claude Code
- Codex
- Superset and similar IDE-like tools
- generic tool environments that can read files and run shell commands

## Capability Model

The system must model host capabilities such as:

- structured prompts
- plan mode
- todo or checklist APIs
- subagent or task delegation
- cross-provider task delegation
- role-separated orchestration and review
- hook integration

## Fallback Rules

- structured prompts fall back to concise plain-text prompts
- plan mode falls back to inline checklist generation
- todo APIs fall back to Markdown checklists
- subagent exploration falls back to local repository search
- multi-agent execution falls back to one agent performing orchestrator, worker, and reviewer roles sequentially using the same persisted run artifacts
- host-specific hooks fall back to durable file-based reminders

## Provider Neutrality

Provider-specific behavior may vary, but:

- workflow semantics must stay consistent
- project state must stay tool-neutral
- provider-specific behavior must be explicit and named in config
- agent roles may map to different providers or hosts as long as the on-disk run contract stays consistent
