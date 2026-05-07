# MCP Security Model

This document describes the threat model for every MCP server connected to or built in this repo. Update it whenever you add, remove, or change an MCP.

## Trust assumptions

- The **user** trusts the **host** (Cursor, Claude Code, VS Code, ...) to enforce per-tool consent.
- The **user** trusts each **server author** the same way as any installed package — review code before enabling.
- The **server** trusts the host to enforce roots, scopes, rate limits, and confirmation prompts.

## Workshop defaults

- `.cursor/mcp.json` is **gitignored**. Only `.cursor/mcp.json.example` is committed.
- All secrets are read from environment variables via `${env:VAR}`. **No literal tokens** in config.
- Filesystem servers are scoped to the smallest possible set of directories.
- All public servers are pinned to a specific version (no `@latest`).
- Servers that are not actively used are marked `"disabled": true`.

## Per-MCP entries

Add one section per server below. A good entry covers: data accessed, secrets used, who you trust, mitigations.

### filesystem (`@modelcontextprotocol/server-filesystem`)

- **Data accessed:** read/write inside `./excalidraw-app` and `./examples` only.
- **Secrets:** none.
- **Trust:** first-party MCP reference server.
- **Mitigations:** narrow root list; pinned version; no network access.

### context7 (`@upstash/context7-mcp`)

- **Data accessed:** sends library/topic strings to the Context7 API; returns documentation snippets.
- **Secrets:** none for the public tier; API key via env if you upgrade.
- **Trust:** vendor-maintained.
- **Mitigations:** outbound only to `context7.com`; no repo data leaves the machine.

### github (`@modelcontextprotocol/server-github`) — disabled by default

- **Data accessed:** repo metadata, issues, PRs, file contents on github.com.
- **Secrets:** `GITHUB_PERSONAL_ACCESS_TOKEN` via `${env:GH_PAT}`.
- **Trust:** first-party MCP reference server; PAT scope must be minimal (read-only unless creating PRs).
- **Mitigations:** `disabled: true` until needed; rotate the PAT; never commit `mcp.json`.

### excalidraw-scenes (custom)

- **Data accessed:** reads `.excalidraw` files and files under `./dev-docs/` only (`*.md`, `*.mdx`), after resolving paths under the monorepo root; exposes an MCP resource with a static index for `dev-docs/`.
- **Secrets:** none.
- **Trust:** local code, reviewed by the team.
- **Mitigations:** path validation in the server (no traversal outside repo / `dev-docs/`); scene tools require the `.excalidraw` suffix; runs as a subprocess of the host; no network calls.

### `<your-custom-mcp>`

- **Data accessed:** ...
- **Secrets:** ...
- **Trust:** ...
- **Mitigations:** ...

## Incident response

If a secret leaks (e.g., committed `.cursor/mcp.json`):

1. Rotate the token immediately on the issuing service.
2. `git rm --cached .cursor/mcp.json` and force-push (history rewrite if needed).
3. Audit recent tool-call logs in the host for anomalous activity.
4. Add a regression test or pre-commit hook to prevent the same path next time.
