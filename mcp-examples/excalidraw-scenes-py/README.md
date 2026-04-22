# excalidraw-scenes — Python MCP Server

Minimal MCP server (FastMCP-based) that lets an AI agent work with `.excalidraw` files in the repo.

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
cd mcp-examples/excalidraw-scenes-py
uv sync                # creates .venv and installs deps
uv run excalidraw-scenes-mcp
```

If you prefer pip:

```bash
pip install -e .
excalidraw-scenes-mcp
```

## Wire into Cursor

Already configured in [`.cursor/mcp.json.example`](../../.cursor/mcp.json.example) (set `disabled: false` to enable):

```json
"excalidraw-scenes-py": {
  "command": "uv",
  "args": [
    "run",
    "--directory",
    "./mcp-examples/excalidraw-scenes-py",
    "excalidraw-scenes-mcp"
  ]
}
```

After enabling, reload Cursor and confirm the server appears green in the MCP panel.

## Test prompts

- _"Use the excalidraw-scenes MCP to list every scene under `examples/`."_
- _"Pick the first scene and tell me what text labels it contains."_

## stdio gotcha

`FastMCP.run()` writes JSON-RPC to stdout. Use `print(..., file=sys.stderr)` or `logging` for diagnostics — never `print` to stdout, that breaks the protocol.
