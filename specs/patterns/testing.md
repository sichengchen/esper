# Testing Pattern

Status: Draft
Date: 2026-03-01

## Purpose

This file captures the preferred reusable testing pattern for behavior-driven work in EsperKit-managed projects.

## Pattern

For bounded, testable changes:

1. Start from the approved behavior description.
2. Pick or refine a concrete scenario.
3. Express that scenario as a failing test.
4. Implement until the test passes.
5. Clean up while preserving the approved behavior.

This is the preferred bridge between BDD-style spec review and red-green TDD execution.

## Expected Inputs

- an approved behavior description
- one or more concrete scenarios
- the configured baseline test command, when available

## Guardrails

- do not invent new scope in the test that is not present in the approved behavior
- if the behavior must change, return to spec authoring first
- if tests are impractical, document why the change cannot follow the normal red-green path

## Review

Review should confirm:

- the test actually encodes the approved behavior
- the implementation matches the approved scenario
- behavior descriptions and scenarios stay aligned with shipped behavior
