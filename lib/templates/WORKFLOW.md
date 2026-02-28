# Workflow

## Before Making Changes

1. Read `.esper/context.json` to understand the current state.
2. Read `.esper/CONSTITUTION.md` for project vision and constraints.
3. Check for an active increment in `.esper/increments/active/`.
4. Read the relevant spec files under the configured spec root.

## Active Increment

If an active increment exists, it is the authoritative work file.
Follow its Scope and Verification sections.
Do not start new work without finishing or suspending the current increment.

## Spec Authority

The spec tree is the source of truth for system behavior.
Update specs when implementation diverges from documented behavior.
Use `esper:sync` to reconcile specs after shipping an increment.

## Verification

Run the configured test/lint/typecheck commands to validate changes.
Check the `commands` field in `esper.json` for the exact commands.

## Increment Lifecycle

1. **Create**: `esperkit increment create --title "..." --lane atomic`
2. **Activate**: `esperkit increment activate <file>`
3. **Implement**: Write code, validate, commit
4. **Finish**: `esperkit increment finish <file>`
5. **Sync specs**: Update spec files to reflect shipped behavior
