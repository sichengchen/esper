# EsperKit Constitution

## Project Identity

**Name:** EsperKit
**Purpose:** Tool-neutral workflow layer for AI-assisted software development. Provides a CLI toolkit for deterministic project-state management and a skills/slash-command layer that gives coding agents operational instructions for spec-driven development.

**What it is:**
- A CLI toolkit (`esperkit`) for project initialization, scaffolding, config, and increment lifecycle management
- A skills layer that instructs coding agents how to work with specs, increments, and delivery rules
- An AI-native workflow system centered on Markdown work files that both humans and agents can read and revise
- A lightweight orchestration layer supporting two complementary workflows: spec-to-code and plan-to-spec

**What it is NOT:**
- Not a SaaS, hosted service, or platform with billing/multi-tenancy
- Not a framework meant to be extended with plugins or middleware
- Not a code generation tool — it orchestrates agent work, it does not generate code itself
- Not coupled to a single host environment, agent vendor, or interaction primitive

## Users

- **Primary:** Developers using AI coding agents (Claude Code, Codex) for software development
- **Secondary:** Tool builders integrating EsperKit's state management into their own agent workflows

## Tech Stack

- **Language:** JavaScript (ES modules)
- **Runtime:** Node.js >= 18
- **Dependencies:** Zero runtime dependencies
- **Package:** Published to npm as `esperkit`
- **Test runner:** Node.js built-in test runner (`node --test`)

## Coding Standards

- ES module syntax (`import`/`export`), no CommonJS
- No runtime dependencies — keep the dependency tree at zero
- CLI entry via `bin/cli.js`, library code in `lib/`, skills in `skills/`, templates in `lib/templates/`
- All state artifacts are Markdown or JSON — no binary formats
- Deterministic CLI operations produce identical output given identical input
- Skill instructions are Markdown files (`SKILL.md`) read by the host agent

## Testing Strategy

- Unit tests live in `test/*.test.js`
- Run with `node --test test/*.test.js` (or `npm test`)
- Tests cover CLI subcommands, config operations, increment lifecycle, and spec management
- Validation mode is **blocking** — tests must pass before an increment can advance

## Scope Boundaries

The following will never be built in this project:

- Authentication, user accounts, or multi-tenancy
- A hosted backend or API service
- GUI or web-based interface
- Code generation or LLM inference
- Package dependency management for user projects
- Git operations beyond what the skill layer instructs the agent to do
