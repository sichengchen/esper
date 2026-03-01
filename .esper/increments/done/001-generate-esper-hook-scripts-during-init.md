---
id: 1
title: Generate .esper hook scripts during init
status: done
type: fix
lane: atomic
priority: 1
created: 2026-03-01
spec: specs/esperkit-spec.md
spec_section: Initialize EsperKit in the Project
finished_at: 2026-03-01
---
# Generate .esper hook scripts during init

## Context
The current project can trigger a stop-hook lookup for `.esper/hooks/session-reminder.sh`, but that file is missing and the host reports `bash: .esper/hooks/session-reminder.sh: No such file or directory`.
`lib/init.js` creates `.esper/hooks/` but does not write any hook scripts into it, even though the product spec calls out generated hook scripts and shows `.esper/hooks/` as part of the initialized project layout.
This leaves freshly initialized projects in a broken state for hosts that expect the generated reminder hook to exist.

## Scope
- Update the init path so `esperkit init` writes the expected generated hook scripts into `.esper/hooks/`.
- Decide whether the repository-level `hooks/` files are treated as templates or source assets, then make that behavior explicit in code.
- Add or expand init coverage so tests fail if the generated hook files are missing after initialization.

## Files Affected
- `lib/init.js` (modify — generate or copy hook scripts into `.esper/hooks/` during project bootstrap)
- `hooks/session-reminder.sh` (modify — treat it as the generated-script source template and document that role if needed)
- `hooks/verify-quick.sh` (modify — align hook generation behavior and template expectations)
- `test/init.test.js` (modify — verify initialized projects contain the expected hook assets)

## Verification
- Run: `npm test`
- Expected: init coverage passes and explicitly confirms the generated `.esper/hooks/` scripts exist after `esperkit init`

## Spec Impact
- No behavior change is intended beyond matching the existing spec.
- Revisit `specs/esperkit-spec.md` only if implementation reveals the hook-generation contract needs clarification.

## Progress
- Implemented hook generation in `lib/init.js`.
- `esperkit init` now creates `.esper/hooks/session-reminder.sh` by copying the packaged template and creates `.esper/hooks/verify-quick.sh` as a project-specific generated script.
- Both generated hook scripts are marked executable and are only created when missing, preserving non-destructive re-runs.
- Updated the packaged hook source comments to make their template role explicit.
- Expanded init tests to assert the hook directory and generated scripts exist, and that `verify-quick.sh` is a generated hook rather than the placeholder template.
- Verification on 2026-03-01: `npm test` passed.
- Re-ran local `esperkit init` on 2026-03-01 so this checkout now has `.esper/hooks/session-reminder.sh` and `.esper/hooks/verify-quick.sh`.
