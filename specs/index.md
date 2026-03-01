# Spec Index

## Format

- Specs are stored by `module/topic`.
- If a project has only one meaningful module, the module layer is optional and may be omitted.
- EsperKit itself uses the module layer because it has multiple modules.

## Core

- [core/overview.md](/Users/sichengchen/src/esper/specs/core/overview.md): product-level overview, design principles, and storage rules

## Workflow

- [workflow/lifecycle.md](/Users/sichengchen/src/esper/specs/workflow/lifecycle.md): authoritative workflow behavior for Spec-to-Code and Plan-to-Spec
- [workflow/behavior.md](/Users/sichengchen/src/esper/specs/workflow/behavior.md): behavior descriptions, scenario structure, and behavior-driven review
- [workflow/requirements.md](/Users/sichengchen/src/esper/specs/workflow/requirements.md): goals, functional requirements, risks, and success criteria

## State

- [state/model.md](/Users/sichengchen/src/esper/specs/state/model.md): product structure, core concepts, and filesystem layout
- [state/interoperability.md](/Users/sichengchen/src/esper/specs/state/interoperability.md): host capability model, fallbacks, and provider-neutral rules
- [state/configuration.md](/Users/sichengchen/src/esper/specs/state/configuration.md): runtime contract, configuration schema, migration, and verification policy

## CLI

- [cli/commands.md](/Users/sichengchen/src/esper/specs/cli/commands.md): deterministic CLI surface

## Skills

- [skills/commands.md](/Users/sichengchen/src/esper/specs/skills/commands.md): skills and slash-command behavior

## Patterns

- [patterns/testing.md](/Users/sichengchen/src/esper/specs/patterns/testing.md): reusable BDD/TDD pattern for behavior-driven red-green work
