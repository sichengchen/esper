---
name: esper:backlog
description: Show the current backlog of pending and active plans, sorted by priority.
---

Display the current esper backlog for this project.

## Steps

1. Check `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first.

2. Read all `.md` files from `.esper/plans/active/`, `.esper/plans/pending/`, and `.esper/plans/done/`.
   Parse the YAML frontmatter from each file. For the done section, sort by `shipped_at` descending and show only the 3 most recent.

3. If `backlog_mode` is `"github"` in `esper.json`, also run:
   ```bash
   gh issue list --state open --json number,title,labels
   ```
   Cross-reference with local plan files by `gh_issue` field.

4. Display as a formatted table:

```
ACTIVE
  #003 · Implement login page                    [phase-1]  branch: feature/login

PENDING
  #001 · Setup project structure          p1     [phase-1]
  #002 · Configure database connection    p2     [phase-1]
  #004 · Add error handling middleware    p3     [phase-1]

DONE (last 3)
  #000 · Project initialization                  shipped
```

Columns: id · title · priority (p1/p2/p3) · phase · status/branch

5. Print at the bottom:
   - Current phase (from `esper.json`)
   - Tip: `/esper:build` to start the highest-priority item, `/esper:new <prompt>` to add an item
