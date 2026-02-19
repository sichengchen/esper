---
name: esper:backlog
description: Show the current backlog of pending and active plans, sorted by priority.
---

Display the current esper backlog for this project.

## Steps

1. Run `esper config check`. If it exits non-zero, tell the user to run `/esper:init` first and stop.

2. Run the backlog display script:
   ```bash
   bash ~/.claude/skills/esper-backlog/backlog.sh
   ```
   Print the script's output verbatim. The script reads all plan files from `.esper/plans/{active,pending,done}/`, parses their frontmatter, and formats a table.

3. Run `esper config get backlog_mode`. If the output is `github`, also run:
   ```bash
   gh issue list --state open --json number,title,labels
   ```
   Cross-reference open issues with: the current phase file's `gh_issue` field (1 issue per phase for features), and fix plan files' `gh_issue` fields (1 issue per fix). Flag any open GitHub issues that have no matching phase or fix plan.

4. Print at the bottom:
   - Current phase: run `esper config get current_phase` and display as `Phase: <output>`
   - Tips: `/esper:apply` to start the top item · `/esper:plan` to add a feature · `/esper:fix` to log a bug
