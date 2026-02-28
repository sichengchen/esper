---
name: esper:review
description: Review the current implementation against the approved increment and specs. Identifies drift, regressions, and missing spec maintenance.
---

You are reviewing the current implementation against the approved increment and spec tree.

## Step 1: Read context

Run `esperkit context get` to determine the current state.

If no active increment, tell the user: "No active increment to review. Run `/e:atom` or `/e:batch` first." and stop.

## Step 2: Read the increment and specs

Read the active increment file from `.esper/increments/active/<filename>`.
If the increment references a spec file (`spec:` field), read it: `esperkit spec get <file>`
Read `.esper/CONSTITUTION.md` for project constraints.

## Step 3: Assess implementation state

Compare the current codebase state against the increment plan:

1. **Scope coverage**: For each item in `## Scope`, check if it has been implemented
2. **Files affected**: For each file in `## Files Affected`, check if the expected changes exist
3. **Verification**: Run the commands in `## Verification` and check results
4. **Spec alignment**: Compare the implementation against the referenced spec — does the code match what the spec describes?

## Step 4: Identify issues

Check for:
- **Drift**: Implementation that diverges from the increment plan (extra changes, different approach)
- **Regressions**: Changes that break existing behavior documented in specs
- **Missing spec maintenance**: Implementation changes that require spec updates but specs haven't been updated
- **Scope creep**: Work done beyond what the increment plan describes
- **Incomplete items**: Scope items not yet implemented

## Step 5: Write findings

Update the active increment file's `## Progress` section with findings:

```markdown
## Progress

### Review Findings — [date]
- [ok] Scope item 1: implemented as planned
- [ok] Scope item 2: implemented as planned
- [drift] Scope item 3: implementation differs — [explanation]
- [incomplete] Scope item 4: not yet implemented
- [spec] product/behavior.md needs updating: [what changed]
```

## Step 6: Recommend next actions

Based on findings:
- If all scope items complete and verification passes: "Ready to finish. Run `/e:go` to complete."
- If spec updates needed: "Run `/e:sync` to update specs before finishing."
- If incomplete items remain: "Run `/e:continue` to resume implementation."
- If drift detected: Present the drift and ask the user how to resolve it.

## Available CLI commands

- `esperkit context get` — read context
- `esperkit spec index` — show spec tree
- `esperkit spec get <file>` — read a spec
- `esperkit increment list` — list increments
