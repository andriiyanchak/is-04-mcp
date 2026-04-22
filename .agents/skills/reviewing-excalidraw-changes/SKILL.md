---
name: reviewing-excalidraw-changes
description: >-
  Review pull requests and local diffs for the Excalidraw monorepo: correctness,
  architecture, project conventions, tests, and bundle/import hygiene. Use when
  reviewing code changes, before merge, after `git diff`, or when the user asks
  for a code review, PR review, or pre-merge check.
---

# Reviewing Excalidraw Code Changes

## When to use this skill

Use when reviewing **any** change set against this project’s conventions (see `AGENTS.md`): PRs, branches compared to `main`/`master`, staged/unstaged diffs, or pasted patches.

## Review process

1. **Scope** — Identify what changed (files, packages: `excalidraw-app`, `packages/excalidraw`, `packages/*`). Note whether the change is UI, actions/state, renderer/canvas, or build/tooling.
2. **Intent** — Infer the user goal from the diff and PR description (if any). Review against that intent, not only style.
3. **Verify** — When the workspace is the Excalidraw monorepo root, prefer running checks relevant to the diff (see [Verification commands](#verification-commands)). If only a skills/docs repo is open, review statically and state which commands should pass in the app repo.
4. **Deep dives** — For UI components, invoke **creating-excalidraw-components**. For state/rendering/data flow, invoke **excalidraw-architecture**. For new imports or dependency shifts, invoke **analyzing-bundle-size**.
5. **Report** — Use the [Feedback format](#feedback-format) below. Order findings by severity, then by file.

## Architecture and conventions (must check)

- **State** — Mutations only through `actionManager.dispatch()`. No Redux, Zustand, MobX, or ad-hoc global stores for editor state.
- **React** — Functional components and hooks only; **named exports** only (no default exports for components).
- **Types** — TypeScript strict: avoid `any` and `@ts-ignore` unless justified in review.
- **Components** — Props type named `{ComponentName}Props`; colocated tests `ComponentName.test.tsx` when behavior/UI is non-trivial.
- **Styling** — SCSS modules or CSS custom properties consistent with surrounding UI.
- **Rendering** — Canvas/scene code paths: respect the existing pipeline (see **excalidraw-architecture**); do not route drawing through React DOM.
- **Monorepo** — Respect package boundaries (`@excalidraw/*`); no forbidden cross-imports (see **analyzing-bundle-size** when in doubt).

## Correctness and quality

- **Logic** — Edge cases, null/empty selection, undo/redo implications if applicable.
- **Accessibility** — For new interactive UI: labels, keyboard paths, focus, where the codebase already patterns them.
- **Performance** — Avoid obvious hot-path allocations or rerender triggers in large lists/canvas; question `useEffect` dependency mistakes.
- **Security** — User-controlled strings/HTML, `dangerouslySetInnerHTML`, file/open URL handling: flag if risky or inconsistent with project norms.

## Tests

- New or changed behavior should have tests where the project typically tests similar code (Vitest + RTL).
- Snapshots: only acceptable when stable and intentional; flag brittle or overly broad snapshots.

## Verification commands

Run from the **Excalidraw monorepo root** (adjust if scripts differ):

- `yarn test:typecheck` — types after TS changes.
- `yarn test:code` — ESLint.
- `yarn test:other` — Prettier check.
- `yarn test:app` — tests; narrow with Vitest file filters when possible.
- `yarn build` — after structural or build config changes.

State what you ran and the result, or what the author should run before merge.

## Feedback format

Use this structure so feedback is scannable:

```markdown
## Summary
[1–3 sentences: what changed and overall risk]

## Findings

### Critical (block merge)
- **File:line** — Issue. **Fix:** …

### Important (should fix)
- …

### Suggestions
- …

### Nits (optional)
- …

## Verification
- [ ] Commands run / recommended: …
```

Severity guide:

- **Critical** — Wrongness, data loss, security, or violates non-negotiable architecture (e.g. bypassing `actionManager` for editor state).
- **Important** — Bugs, missing tests for risky logic, maintainability problems.
- **Suggestions** — Clear improvements, not required for merge.
- **Nits** — Style-only or subjective.

## Related skills

| Topic | Skill |
|--------|--------|
| New/changed React UI | [creating-excalidraw-components](../creating-excalidraw-components/SKILL.md) |
| State, rendering, packages | [excalidraw-architecture](../excalidraw-architecture/SKILL.md) |
| Imports, bundle, dependency rules | [analyzing-bundle-size](../analyzing-bundle-size/SKILL.md) |
