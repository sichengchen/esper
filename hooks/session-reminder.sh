#!/usr/bin/env bash
# Runs when Claude stops. Reminds about uncommitted changes and active plans.

ESPER_JSON=".esper/esper.json"

if [ ! -f "$ESPER_JSON" ]; then
  exit 0
fi

REMINDERS=()

# Check for uncommitted changes
UNCOMMITTED=$(git status --porcelain 2>/dev/null)
if [ -n "$UNCOMMITTED" ]; then
  CHANGED=$(echo "$UNCOMMITTED" | wc -l | tr -d ' ')
  REMINDERS+=("  ! $CHANGED uncommitted file(s) — run /esper:commit when ready")
fi

# Check for active plan
ACTIVE_PLANS=$(ls .esper/plans/active/*.md 2>/dev/null)
if [ -n "$ACTIVE_PLANS" ]; then
  PLAN_TITLE=$(node -e "
    const fs = require('fs');
    const files = fs.readdirSync('.esper/plans/active').filter(f => f.endsWith('.md'));
    if (files.length) {
      const content = fs.readFileSync('.esper/plans/active/' + files[0], 'utf8');
      const match = content.match(/^title:\s*(.+)$/m);
      console.log(match ? match[1] : files[0]);
    }
  " 2>/dev/null)
  REMINDERS+=("  > active plan: $PLAN_TITLE")
fi

# Check for pending plans count
PENDING=$(ls .esper/plans/pending/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$PENDING" -gt 0 ]; then
  REMINDERS+=("  · $PENDING pending item(s) in backlog — run /esper:backlog to review")
fi

if [ ${#REMINDERS[@]} -gt 0 ]; then
  echo ""
  echo "esper:"
  for r in "${REMINDERS[@]}"; do
    echo "$r"
  done
fi

exit 0
