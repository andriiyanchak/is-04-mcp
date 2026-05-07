# excalidraw-scenes — TypeScript MCP Server

MCP server for working with `.excalidraw` scenes and `dev-docs/` inside this monorepo. All scene and dev-docs paths are resolved **under the repository root** (no `..` escapes).

## Tools

| Tool | Description |
|------|-------------|
| `list_scenes(dir)` | List `.excalidraw` files in a **single directory** (path relative to repo root or absolute within repo) |
| `read_scene(path)` | Return parsed JSON of one scene (pretty-printed text) |
| `extract_text(path)` | Return every text-element string in the scene, one per line |
| `summarize_scene(path)` | Compact JSON stats: element counts by type, text count, embedded file blob count (no `dataURL`s) |
| `list_dev_docs(subdir?)` | List `.md` / `.mdx` under `dev-docs/`, optionally scoped to a subdirectory |
| `read_dev_doc(path)` | Read one file under `dev-docs/`; argument is relative to `dev-docs/` (e.g. `docs/codebase/json-schema.mdx`) |

## Resource

- `excalidraw://docs/architecture` — short Markdown index, entry points, and pointers to the tools above.

## Run locally

```bash
cd mcp-examples/excalidraw-scenes-ts
npm install
npm run build
npm start
```

## Wire into Cursor

Already configured in [`.cursor/mcp.json.example`](../../.cursor/mcp.json.example) (set `disabled: false` to enable):

```json
"excalidraw-scenes-ts": {
  "command": "node",
  "args": ["./mcp-examples/excalidraw-scenes-ts/dist/server.js"]
}
```

After enabling, reload Cursor and confirm the server appears green in the MCP panel.

## Test prompts

- _"Use list_dev_docs with an empty subdir and read `docs/codebase/json-schema.mdx`."_
- _"Use summarize_scene on `mcp-examples/excalidraw-scenes-ts/fixtures/sample.excalidraw`."_
- _"Try read_scene with a path outside the repo and confirm it errors."_

## stdio gotcha

Never `console.log` — that corrupts the JSON-RPC stream over stdout.
Use `console.error` for diagnostics; the MCP host shows it in server logs.
