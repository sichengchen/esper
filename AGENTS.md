# AGENTS

Use this file to bootstrap any coding agent into the Esper workflow.

## EsperKit

Keep project-specific instructions outside this section. The `esper:init` workflow may update only this block.

### Required Reads

1. Read `.esper/context.json` for machine-readable project state.
2. Read `.esper/CONSTITUTION.md` for project scope and constraints.
3. Read `.esper/WORKFLOW.md` for the canonical Esper workflow.
4. If `active_increment` is set, read the matching file under `.esper/increments/active/`.
5. Read the relevant spec files under the configured `spec_root` from `.esper/context.json`.

### Source of Truth

- `.esper/context.json` is the runtime context shared across tools.
- `.esper/WORKFLOW.md` defines the operational workflow.
- The configured `spec_root` is the authoritative spec tree.

### Verification

- Read the `commands` object in `.esper/context.json` for the exact test, lint, typecheck, and dev commands.
- Run the configured commands before closing an increment.
