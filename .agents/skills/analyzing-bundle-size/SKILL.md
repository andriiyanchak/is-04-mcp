---
name: analyzing-bundle-size
description: >-
  Analyze bundle size, check for forbidden imports, and identify large
  dependencies in the Excalidraw project. Use when optimizing bundle size,
  reviewing imports, or checking for unauthorized dependencies.
---

# Analyzing Bundle Size

## When to use this skill
Use when the user asks about bundle size, dependency analysis, import
checking, or when reviewing a PR that adds new dependencies.

## Quick checks
1. Run `scripts/check-imports.sh` to verify no forbidden imports
2. Run `scripts/analyze-deps.sh` to see dependency sizes
3. Review the results and suggest optimizations

## Forbidden dependencies
These should NEVER appear in the codebase:
- State management: zustand, redux, mobx, recoil, jotai
- Canvas libraries: react-konva, fabric.js, pixi.js
- UI frameworks: @mui/material, antd, chakra-ui

