---
name: esper:commit
description: Auto-draft a commit message from the active plan context, show it for approval, then commit.
---

You are creating a commit for the current work.

## Step 1: Check there is something to commit

Run `git status --porcelain`. If the output is empty, tell the user there is nothing to commit and stop.

## Step 2: Read context

Read:
- The active plan from `.esper/plans/active/` (for title, approach, and progress)
- `git diff` (staged and unstaged) to understand exactly what changed

## Step 3: Stage relevant files

Run `git status` to see what is modified. Stage files relevant to the current plan:

```bash
git add <files related to the active plan>
```

Do not stage unrelated files. If there are modified files that seem unrelated to the active plan, flag them and ask the user what to do with them.

## Step 4: Draft the commit message

Write a commit message following this format:

```
<type>: <concise description tied to plan title>

<1-3 sentences on what changed and why, drawn from the plan's Approach>

Plan: #<plan id> — <plan title>
```

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
- Committed: `<hash> <title>`
- Next: `/esper:ship` to push and open a PR, or continue working and commit again
