#!/bin/bash
# Analyze dependency sizes in the project

echo "=== Dependency Size Analysis ==="
echo ""

echo "--- Top 15 largest node_modules packages ---"
if [ -d "node_modules" ]; then
  du -sh node_modules/*/ 2>/dev/null | sort -rh | head -15
else
  echo "node_modules not found. Run 'yarn install' first."
  exit 1
fi

echo ""
echo "--- Package count per workspace ---"
for pkg in packages/*/; do
  if [ -f "$pkg/package.json" ]; then
    DEPS=$(node -e "
      const p = require('./$pkg/package.json');
      const d = Object.keys(p.dependencies || {}).length;
      const dd = Object.keys(p.devDependencies || {}).length;
      console.log(d + ' deps, ' + dd + ' devDeps');
    " 2>/dev/null)
    echo "  $(basename $pkg): $DEPS"
  fi
done

