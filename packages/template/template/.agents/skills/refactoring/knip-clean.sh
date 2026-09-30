#!/bin/bash
# knip-clean.sh - Delete all unused files reported by knip in one shot
# Usage: bash knip-clean.sh

set -e

echo "Running knip to find unused files..."
KNIP_OUTPUT=$(pnpm run knip 2>&1 || true)

# Extract files starting with src/ (knip outputs file paths directly)
UNUSED_FILES=$(echo "$KNIP_OUTPUT" | grep -E '^src/.*\.(ts|tsx|js|jsx)' | awk '{print $1}' | sort -u)

if [ -z "$UNUSED_FILES" ]; then
    echo "No unused files found in src/"
    exit 0
fi

FILE_COUNT=$(echo "$UNUSED_FILES" | wc -l | tr -d ' ')
echo "Found $FILE_COUNT unused files to delete:"
echo "$UNUSED_FILES"
echo ""

# Delete all files at once
echo "$UNUSED_FILES" | xargs rm -f

echo ""
echo "Deleted $FILE_COUNT files."

# Clean up empty directories
find src -type d -empty -delete 2>/dev/null || true

echo "Done! Run 'pnpm run validate' to verify."
