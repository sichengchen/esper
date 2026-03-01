# CLI Commands

Status: Draft
Date: 2026-03-01

## Role

The CLI toolkit is the deterministic executable layer.

It is responsible for:

- installation
- deterministic project initialization
- creating and mutating local Esper artifacts
- publishing machine-readable project state

It does not own semantic authoring of specs, increments, or review findings.

## CLI Surface

EsperKit exposes a CLI surface equivalent to:

- `esperkit install`
- `esperkit init`
- `esperkit config get [key]`
- `esperkit config set <key> <value>`
- `esperkit context get`
- `esperkit spec index`
- `esperkit spec get <file>`
- `esperkit spec create <path>`
- `esperkit spec set-root <path>`
- `esperkit spec archive <file>`
- `esperkit increment list`
- `esperkit increment get <file>`
- `esperkit increment create`
- `esperkit increment activate <file>`
- `esperkit increment finish <file>`
- `esperkit increment set <field>`
- `esperkit increment group`
- `esperkit run create <increment>`
- `esperkit run get <id>`
- `esperkit run list`
- `esperkit run stop <id>`
- `esperkit doctor`
- `esperkit migrate`

## Interface Rules

- CLI creation commands are deterministic scaffolding or state-transition commands.
- CLI commands do not replace semantic authoring workflows owned by skills and commands.
- The CLI must remain usable on its own.
