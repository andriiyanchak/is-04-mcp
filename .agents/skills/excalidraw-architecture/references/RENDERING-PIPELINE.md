
# Rendering Pipeline in Excalidraw

## Overview
Excalidraw renders to HTML Canvas 2D, not React DOM.

## Pipeline
1. Scene collects all elements
2. `renderScene()` processes element list
3. Each element type has a dedicated renderer
4. Output goes to canvas 2D context

## Key files
- `packages/excalidraw/renderer/renderScene.ts` — main render entry
- `packages/excalidraw/renderer/renderElement.ts` — per-element rendering
- `packages/excalidraw/scene/` — scene management

## Constraints
- DO NOT use react-konva, fabric.js, pixi.js
- DO NOT render drawing elements via React DOM
- Performance-critical: avoid unnecessary re-renders
- Batch canvas operations when possible
