# AGENTS.md

## Project Overview

Excalidraw is an open-source, collaborative virtual whiteboard for sketching hand-drawn-like diagrams. Built with React and TypeScript, it uses a custom Canvas 2D rendering engine and custom state management via `actionManager`.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **UI**: React 19 (functional components, hooks only)
- **Build**: Vite
- **Testing**: Vitest + React Testing Library
- **Package Manager**: Yarn 1.x with workspaces
- **Linting**: ESLint + Prettier

## Project Structure

```
excalidraw-monorepo/
├── excalidraw-app/        # Vite-based web application
├── packages/
│   ├── excalidraw/        # Core library (@excalidraw/excalidraw)
│   │   ├── components/    # React UI components
│   │   ├── actions/       # State actions (actionManager)
│   │   ├── renderer/      # Canvas rendering pipeline
│   │   ├── scene/         # Scene management
│   │   └── types.ts       # Core type definitions (AppState)
│   ├── math/              # Math utilities (points, angles, vectors)
│   ├── element/           # Element types and operations
│   ├── common/            # Shared utilities
│   └── utils/             # General utilities
├── examples/              # Usage examples (Next.js, browser script)
└── dev-docs/              # Developer documentation
```

## Key Commands

- `yarn` — install dependencies
- `yarn start` — start dev server (excalidraw-app)
- `yarn build` — build the app
- `yarn test:app` — run Vitest tests
- `yarn test:typecheck` — TypeScript type checking
- `yarn test:code` — ESLint
- `yarn test:other` — Prettier check
- `yarn test:all` — run all checks
- `yarn fix` — auto-fix linting and formatting

## Architecture

- **State Management**: custom `actionManager` (NOT Redux/Zustand/MobX). State updates via `actionManager.dispatch()` only. State type: `AppState` in `packages/excalidraw/types.ts`.
- **Rendering**: Canvas 2D rendering via custom engine (NOT React DOM for drawing). Pipeline: Scene -> `renderScene()` -> canvas 2D context.
- **Monorepo**: Yarn workspaces with `@excalidraw/*` package aliases defined in `tsconfig.json`.

## Conventions

- Functional components with hooks only (no class components)
- Named exports only (no default exports)
- Props type: `{ComponentName}Props`
- Colocated tests: `ComponentName.test.tsx`
- TypeScript strict mode — no `any`, no `@ts-ignore`
- SCSS modules or CSS custom properties for styling
- kebab-case for utility files, PascalCase for components

## Skills

Available skills in this project (carried over from Day 3):

- **creating-excalidraw-components** (`.agents/skills/`) — Create React components following Excalidraw's patterns and conventions
- **reviewing-excalidraw-changes** (`.agents/skills/`) — Review PRs and diffs for correctness, architecture, conventions, tests, and bundle/import hygiene
- **excalidraw-architecture** (`.agents/skills/`) — Architecture deep-dive with state management and rendering pipeline references
- **analyzing-bundle-size** (`.agents/skills/`) — Bundle size and forbidden-import checks via scripts

## MCPs

This project uses MCP servers configured in `.cursor/mcp.json`. The committed file is `.cursor/mcp.json.example` — copy it to `.cursor/mcp.json` (gitignored) and fill in any secrets via environment variables.

Add your MCPs here during the Day 4 workshop. Each entry should describe the server, the data it touches, and any required secrets.

- **filesystem** (public, `@modelcontextprotocol/server-filesystem`) — read-only access scoped to `./excalidraw-app` and `./examples`. No secrets.
- **context7** (public, `@upstash/context7-mcp`) — fresh library docs as MCP resources. No secrets.
- **<your-custom-mcp>** (custom, `mcp-examples/<name>/`) — purpose, tools exposed, data accessed, secrets used.

See `docs/mcp/SECURITY.md` for the per-MCP threat model and `docs/mcp-testing/` for A/B test results.
