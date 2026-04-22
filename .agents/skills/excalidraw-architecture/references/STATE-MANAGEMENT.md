# State Management in Excalidraw

## Core concepts
- `AppState` — single source of truth (packages/excalidraw/types.ts)
- `actionManager` — dispatches state updates (packages/excalidraw/actions/manager.ts)
- Actions follow pattern: `{ name, perform, trackEvent, keyTest }`

## State update flow
1. User interaction triggers an action
2. Action dispatched via `actionManager.dispatch()`
3. `perform()` receives current state, returns new state
4. React re-renders with updated state

## NEVER do
- Direct state mutation
- Import external state libraries (Redux, Zustand, MobX)
- Use React useState for application-level state
- Access state through global imports (use props)
