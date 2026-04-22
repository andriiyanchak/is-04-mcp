---
name: excalidraw-architecture
description: >-
  Understand Excalidraw's architecture: state management, rendering pipeline,
  monorepo structure, and package dependencies. Use when making architectural
  decisions, understanding data flow, or debugging state-related issues.
---

# Excalidraw Architecture Guide

## When to use this skill
Use when you need to understand how Excalidraw works internally:
state management, rendering, package structure, or data flow.

## Quick overview
- Monorepo with Yarn workspaces
- Custom state management via `actionManager` (NOT Redux/Zustand)
- Canvas 2D rendering (NOT React DOM for drawing)
- Packages: excalidraw, math, element, common, utils

## Deep dives
- [State Management](references/STATE-MANAGEMENT.md)
- [Rendering Pipeline](references/RENDERING-PIPELINE.md)
