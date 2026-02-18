#!/usr/bin/env bash
# TEMPLATE — this file is not used directly.
# /esper:init generates a project-specific version at .esper/hooks/verify-quick.sh
# with the user's actual commands written as literal strings (no eval, no dynamic reading).
#
# Generated output example:
#
#   echo "--- esper: lint ---"
#   npm run lint
#   [ $? -ne 0 ] && FAILED=1
#
#   echo "--- esper: typecheck ---"
#   npx tsc --noEmit
#   [ $? -ne 0 ] && FAILED=1

echo "This is a template. Run /esper:init to generate the project-specific version."
exit 0
