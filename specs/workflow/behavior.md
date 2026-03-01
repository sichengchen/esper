# Workflow Behavior

Status: Draft
Date: 2026-03-01

## Behavior Descriptions

A behavior description is a durable spec artifact that explains externally observable behavior in user-reviewable terms.

Each behavior description should make it easy for a user to answer:

- what the system does
- under which conditions it does it
- what outcomes the user or caller should expect

## Scenario Quality

When behavior is testable, the spec should prefer concrete scenarios with:

- explicit preconditions
- a clear action or trigger
- explicit expected outcomes

Given/When/Then is the default example structure, but any equally precise form is acceptable.

Example:

```text
Given <starting condition>
When <user or system action>
Then <observable outcome>
```

## Reviewability Rule

Behavior descriptions must be easy for a human to examine quickly.

This means:

- avoid burying core behavior in architecture-only prose
- separate externally observable behavior from internal implementation details
- keep scenarios concrete enough that a reviewer can challenge them before code is written

## BDD And TDD Alignment

Approved behavior descriptions and scenarios are the preferred source for behavior-driven test-first work.

When the change is bounded and testable:

1. Review the behavior description.
2. Confirm or revise the scenario.
3. Derive a failing test from the approved scenario.
4. Implement until the test passes.
5. Refine and clean up without drifting from the approved behavior.

## Drift Signals

Review should treat these as drift indicators:

- code changes behavior but no behavior description changed
- tests change acceptance behavior but no scenario changed
- public behavior changes are described only in implementation notes
- the increment references behavior changes without linking to the governing behavior description
