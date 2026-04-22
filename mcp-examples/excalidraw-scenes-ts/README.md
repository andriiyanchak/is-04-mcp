# excalidraw-scenes — TypeScript MCP Server

Minimal MCP server that lets an AI agent work with `.excalidraw` files in the repo.

## Tools

| Tool | Description |
|------|-------------|
| `list_scenes(dir)` | List `.excalidraw` files under a directory |
| `read_scene(path)` | Return parsed JSON of one scene |
| `extract_text(path)` | Return every text-element string in the scene |

## Resource

- `excalidraw://docs/architecture` — stub for `dev-docs/` (replace with a real reader during the workshop).

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

- _"Use the excalidraw-scenes MCP to list every scene under `examples/`."_
- _"Pick the first scene and tell me what text labels it contains."_

## stdio gotcha

Never `console.log` — that corrupts the JSON-RPC stream over stdout.
Use `console.error` for diagnostics; the MCP host shows it in server logs.
