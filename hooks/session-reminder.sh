#!/usr/bin/env bash
# Runs when Claude stops. Reminds about uncommitted changes and active increments.

ESPER_JSON=".esper/esper.json"

if [ ! -f "$ESPER_JSON" ]; then
  exit 0
fi

REMINDERS=()

# Check for uncommitted changes
UNCOMMITTED=$(git status --porcelain 2>/dev/null)
if [ -n "$UNCOMMITTED" ]; then
  CHANGED=$(echo "$UNCOMMITTED" | wc -l | tr -d ' ')
  REMINDERS+=("  ! $CHANGED uncommitted file(s)")
fi

# Check for active increment
ACTIVE_INCREMENTS=$(ls .esper/increments/active/*.md 2>/dev/null)
if [ -n "$ACTIVE_INCREMENTS" ]; then
  INC_TITLE=$(node -e "
    const fs = require('fs');
    const files = fs.readdirSync('.esper/increments/active').filter(f => f.endsWith('.md'));
    if (files.length) {
      const content = fs.readFileSync('.esper/increments/active/' + files[0], 'utf8');
      const match = content.match(/^title:\s*(.+)$/m);
      console.log(match ? match[1] : files[0]);
    }
  " 2>/dev/null)
  REMINDERS+=("  > active increment: $INC_TITLE")
fi

# Check for pending increments count
PENDING=$(ls .esper/increments/pending/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$PENDING" -gt 0 ]; then
  REMINDERS+=("  · $PENDING pending increment(s) — run /e:ctx to review")
fi

if [ ${#REMINDERS[@]} -gt 0 ]; then
  echo ""
  echo "esper:"
  for r in "${REMINDERS[@]}"; do
    echo "$r"
  done
fi

exit 0
