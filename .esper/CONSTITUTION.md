# esper — Constitution

## What This Is

esper is a vibe coding toolkit for Claude Code power users. It enforces a structured, plan-driven workflow — interview → plan → build → ship — by delivering a set of Claude Code skills and project-level hooks that keep Claude focused and accountable. The target user is a developer who uses Claude Code daily and wants guardrails: a constitution, a backlog, and verified shipping, without slowing down the vibe.

## What This Is NOT

- **Not a generic project manager** — no timelines, assignments, velocity tracking, or dashboards
- **Not a CI/CD system** — does not replace GitHub Actions, CircleCI, or any pipeline tooling
- **Not a multi-agent orchestrator** — stays Claude Code-centric; one AI, one plan, one PR at a time
- **Not a web app** — no UI, no server; entirely CLI + skill files

## Technical Decisions

- **Stack**: Node.js (ESM), no framework, no build step
- **Architecture**: Skills are markdown files installed globally to `~/.claude/skills/`. The CLI is a single `bin/cli.js` that copies skill files. Hooks are bash scripts generated per-project by `esper:init`.
- **Key dependencies**: None. Zero runtime dependencies — the toolkit must install and run without pulling a dependency tree.

## Testing Strategy

- **What gets tested**: The CLI installer (`bin/cli.js`) — smoke tests verify it copies skill files correctly to the expected destination
- **What doesn't**: Skill SKILL.md files are not unit-tested; they are validated through real Claude Code usage
- **Tooling**: Node.js built-in test runner (`node --test`)
- **Commands**: `node --test test/` (once test directory exists)

## Principles

1. **Zero dependencies** — the package must install instantly with no dependency tree; skills are markdown, hooks are bash
2. **Skills are the product** — the quality of SKILL.md files is what users experience; polish them like user-facing docs
3. **Eat your own dog food** — esper is developed using esper; all backlog items are plan files, all shipping goes through `/esper:ship`
4. **Opinionated defaults, no configurability sprawl** — one workflow, done well; resist adding flags and options
5. **Fail loudly** — verification hooks and ship checks must block on failure; never silently skip
