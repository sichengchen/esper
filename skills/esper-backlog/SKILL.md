---
name: esper:backlog
description: Show the current backlog of pending and active plans, sorted by priority.
---

Display the current esper backlog for this project.

## Steps

1. Check `.esper/esper.json` exists. If not, tell the user to run `/esper:init` first and stop.

2. Run the backlog display script:
   ```bash
   bash ~/.claude/skills/esper-backlog/backlog.sh
   ```
   Print the script's output verbatim. The script reads all plan files from `.esper/plans/{active,pending,done}/`, parses their frontmatter, and formats a table.

3. If `backlog_mode` is `"github"` in `esper.json`, also run:
   ```bash
   gh issue list --state open --json number,title,labels
   ```
   Cross-reference with local plan files by `gh_issue` field. Flag any GitHub issues that have no matching local plan file.

4. Print at the bottom:
   - Current phase (from `esper.json`): `Phase: phase-1`
   - Tips: `/esper:apply` to start the top item · `/esper:plan` to add a feature · `/esper:fix` to log a bug
