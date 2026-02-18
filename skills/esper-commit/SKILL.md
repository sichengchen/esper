---
name: esper:commit
description: Auto-draft a commit message from the active plan context, show it for approval, then commit.
---

You are creating a commit for the current work.

## Step 1: Check there is something to commit

Run `git status --porcelain`. If the output is empty, tell the user "Nothing to commit." and stop.

## Step 2: Read context

Read:
- `git diff HEAD` to see all staged and unstaged changes
- `git status` to see which files are modified
- The active plan from `.esper/plans/active/` (for title, approach, and progress) — if no active plan exists, proceed without plan context and draft a generic commit message

## Step 3: Stage relevant files

If an active plan exists:
- Stage files that are clearly related to the plan: `git add <files related to the active plan>`
- If there are modified files that seem unrelated to the active plan, flag them and use `AskUserQuestion` to ask the user what to do: "Stage with this commit, skip for now, or discard changes?"

If no active plan exists:
- Stage all modified files: `git add -A`

## Step 4: Draft the commit message

Write a commit message following this format:

```
<type>: <concise description tied to plan title>

<1-3 sentences on what changed and why, drawn from the plan's Approach and Progress>

Plan: #<plan id> — <plan title>
```

Omit the `Plan:` line if there is no active plan.

Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`

Example:
```
feat: add JWT authentication middleware

Implements token validation on all /api routes using the existing
auth utilities. Tokens expire after 24h with refresh support.

Plan: #003 — Setup authentication
```

Show the draft to the user. Wait for approval or edits.

## Step 5: Commit

Once approved, run:

```bash
git commit -m "$(cat <<'EOF'
<approved message>
EOF
)"
```

Confirm the commit hash and tell the user:
- Committed: `<hash> <first line of message>`
- Next: `/esper:ship` to push and open a PR, or continue working and commit again
