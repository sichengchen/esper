---
name: esper:backlog
description: Show the current backlog of pending and active plans, sorted by priority.
---

Display the current esper backlog for this project.

## Steps

1. Check `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first and stop.

2. Read all `.md` files from `.esper/plans/active/`, `.esper/plans/pending/`, and `.esper/plans/done/` only.
   Do NOT read `.esper/plans/archived/` — archived phases are historical and not shown in the backlog.
   Parse the YAML frontmatter from each file (the block between the `---` delimiters at the top).
   - For `done/`: sort by `shipped_at` descending (treat missing `shipped_at` as oldest). Show only the 3 most recent. If `done/` is empty, omit the DONE section entirely.
   - For `pending/`: sort by `priority` ascending, then `id` ascending for ties.

3. If `backlog_mode` is `"github"` in `esper.json`, also run:
   ```bash
   gh issue list --state open --json number,title,labels
   ```
   Cross-reference with local plan files by `gh_issue` field. Flag any GitHub issues that have no matching local plan file.

4. Display as a formatted table. Omit sections that are empty:

```
ACTIVE
  #003 · Implement login page                    [phase-1]  branch: feature/login

PENDING
  #001 · Setup project structure          p1     [phase-1]
  #002 · Configure database connection    p2     [phase-1]
  #004 · Add error handling middleware    p3     [phase-1]

DONE (last 3)
  #000 · Project initialization                  shipped 2024-01-15
```

Columns: id · title · priority (p1/p2/p3, only shown for pending) · phase · branch (for active) or shipped date (for done)

If the backlog is completely empty (no files in any directory), print:
```
Backlog is empty. Run `/esper:new <prompt>` to add your first item.
```

5. Print at the bottom:
   - Current phase (from `esper.json`): `Phase: phase-1`
   - Tip: `/esper:build` to start the highest-priority item, `/esper:new <prompt>` to add an item
