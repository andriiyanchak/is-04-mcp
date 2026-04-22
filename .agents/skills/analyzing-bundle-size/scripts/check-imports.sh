#!/bin/bash
# Check for forbidden imports in the Excalidraw codebase

echo "=== Forbidden Import Check ==="
echo ""

FORBIDDEN=("zustand" "redux" "mobx" "recoil" "jotai"
           "react-konva" "fabric" "pixi.js"
           "@mui/material" "antd" "@chakra-ui")
FOUND=0

for pkg in "${FORBIDDEN[@]}"; do
  MATCHES=$(grep -r "from ['\"]$pkg" packages/ \
    --include="*.ts" --include="*.tsx" -l 2>/dev/null)
  if [ -n "$MATCHES" ]; then
    echo "FORBIDDEN: '$pkg' found in:"
    echo "$MATCHES" | sed 's/^/  /'
    FOUND=$((FOUND + 1))
  fi
done

echo ""
if [ $FOUND -eq 0 ]; then
  echo "All clear — no forbidden imports found."
else
  echo "Found $FOUND forbidden package(s). Remove them."
fi
exit $FOUND

