#!/usr/bin/env bash
# backlog.sh — esper backlog display
# Reads .esper/plans/{active,pending,done}/ and formats a table.
# Called from the esper:backlog skill. Run from the project root.

set -euo pipefail

PLANS_DIR=".esper/plans"

# extract_field FILE FIELD_NAME
# Reads lines between first pair of --- delimiters, finds "key: value"
extract_field() {
  local file="$1"
  local field="$2"
  awk -v field="$field" '
    /^---$/ {
      if (in_front == 0) { in_front = 1; next }
      else { exit }
    }
    in_front && $0 ~ "^" field ": " {
      sub("^" field ": ", "")
      gsub(/^["'"'"']|["'"'"']$/, "")
      print
      exit
    }
  ' "$file"
}

has_content=0

# ACTIVE section
active_files=()
if [ -d "$PLANS_DIR/active" ]; then
  while IFS= read -r -d '' f; do
    active_files+=("$f")
  done < <(find "$PLANS_DIR/active" -name "*.md" -print0 2>/dev/null | sort -z)
fi

if [ ${#active_files[@]} -gt 0 ]; then
  echo "ACTIVE"
  for f in "${active_files[@]}"; do
    id=$(extract_field "$f" "id")
    title=$(extract_field "$f" "title")
    phase=$(extract_field "$f" "phase")
    branch=$(extract_field "$f" "branch")
    printf "  #%s · %-45s [%s]  branch: %s\n" "$id" "$title" "$phase" "$branch"
  done
  echo ""
  has_content=1
fi

# PENDING section — sort by priority asc, then id asc
pending_files=()
if [ -d "$PLANS_DIR/pending" ]; then
  while IFS= read -r -d '' f; do
    pending_files+=("$f")
  done < <(find "$PLANS_DIR/pending" -name "*.md" -print0 2>/dev/null)
fi

if [ ${#pending_files[@]} -gt 0 ]; then
  echo "PENDING"
  # Build sortable lines: "priority TAB id TAB file"
  sort_data=()
  for f in "${pending_files[@]}"; do
    priority=$(extract_field "$f" "priority")
    id=$(extract_field "$f" "id")
    priority=${priority:-9}
    id_num=${id:-999}
    sort_data+=("${priority}"$'\t'"${id_num}"$'\t'"${f}")
  done

  sorted=$(printf '%s\n' "${sort_data[@]}" | sort -t$'\t' -k1,1n -k2,2n)

  while IFS=$'\t' read -r priority id_num filepath; do
    id=$(extract_field "$filepath" "id")
    title=$(extract_field "$filepath" "title")
    phase=$(extract_field "$filepath" "phase")
    printf "  #%s · %-45s p%-2s  [%s]\n" "$id" "$title" "$priority" "$phase"
  done <<< "$sorted"
  echo ""
  has_content=1
fi

# DONE section — last 3, sorted by shipped_at desc
done_files=()
if [ -d "$PLANS_DIR/done" ]; then
  while IFS= read -r -d '' f; do
    done_files+=("$f")
  done < <(find "$PLANS_DIR/done" -name "*.md" -print0 2>/dev/null)
fi

if [ ${#done_files[@]} -gt 0 ]; then
  echo "DONE (last 3)"
  # Build sortable: "shipped_at TAB file"
  done_data=()
  for f in "${done_files[@]}"; do
    shipped=$(extract_field "$f" "shipped_at")
    shipped=${shipped:-0000-00-00}
    done_data+=("${shipped}"$'\t'"${f}")
  done

  sorted_done=$(printf '%s\n' "${done_data[@]}" | sort -t$'\t' -k1,1r | head -3)

  while IFS=$'\t' read -r shipped filepath; do
    id=$(extract_field "$filepath" "id")
    title=$(extract_field "$filepath" "title")
    display_date="${shipped:-unknown}"
    printf "  #%s · %-45s  shipped %s\n" "$id" "$title" "$display_date"
  done <<< "$sorted_done"
  echo ""
  has_content=1
fi

if [ "$has_content" -eq 0 ]; then
  echo "Backlog is empty. Run \`/esper:plan\` to add your first feature, or \`/esper:fix\` to log a bug."
fi
