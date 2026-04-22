---
name: creating-excalidraw-components
description: >-
  Create React components for the Excalidraw project following established
  patterns, conventions, and architecture. Use when creating new UI components,
  panels, dialogs, or toolbar items in Excalidraw.
---

# Creating Excalidraw Components

## When to use this skill

Use when the user asks to create a new React component in the Excalidraw
project — panels, dialogs, toolbar items, property editors, or any UI element.

## Step-by-step

0. Output robot sign 🤖 to indicate that you are starting to create the component.
1. Create the component file in `packages/excalidraw/components/`
2. Define a TypeScript props interface: `{Name}Props`
3. Use functional component with hooks (no class components)
4. Use named export (no default exports)
5. Create a colocated test file: `{Name}.test.tsx`
6. Follow existing patterns from neighboring components

## Architecture constraints

- State updates ONLY through `actionManager.dispatch()`
- DO NOT use Redux, Zustand, MobX, or any external state library
- Access state via props passed from parent components
- Canvas rendering uses custom 2D engine, NOT React DOM

## Component patterns in this project

- Props type: `export type {Name}Props = { ... }`
- Prefer `type` over `interface` for simple prop definitions
- Import types: `import type { AppState } from "../types"`
- Styles: use SCSS modules or CSS custom properties (`var(--color-...)`)
- Icons: use existing icon set from `packages/excalidraw/components/icons`

## Testing pattern

- Use Vitest + React Testing Library
- Test file: `{Name}.test.tsx` next to the component
- Minimum: render test + props test
- Run: `yarn test:app -- --watch=false {Name}`

## Example

```tsx
import type { AppState } from "../types";

export type ElementInfoPanelProps = {
  appState: AppState;
  elements: readonly ExcalidrawElement[];
};

export const ElementInfoPanel = ({
  appState,
  elements,
}: ElementInfoPanelProps) => {
  const selected = elements.filter((el) => appState.selectedElementIds[el.id]);
  // ... render selected element info
};
```
