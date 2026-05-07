# excalidraw-scenes — Python MCP Server

MCP server (FastMCP-based) for `.excalidraw` scenes and `dev-docs/` inside this monorepo. Paths are constrained **under the repository root** (and under `dev-docs/` for doc tools).

## Tools

| Tool | Description |
|------|-------------|
| `list_scenes(dir)` | List `.excalidraw` files in a **single directory** (relative to repo root) |
| `read_scene(path)` | Return parsed JSON of one scene as a dict |
| `extract_text(path)` | Return strings from all text elements |
| `summarize_scene(path)` | Compact stats dict (counts by type, text elements, embedded files) |
| `list_dev_docs(subdir?)` | List `.md` / `.mdx` under `dev-docs/` (recursive) |
| `read_dev_doc(path)` | Read one file under `dev-docs/` (path relative to `dev-docs/`) |

## Resource

- `excalidraw://docs/architecture` — Markdown index and entry points for `dev-docs/`.

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

- _"Use list_dev_docs and read `docs/introduction/development.mdx`."_
- _"Summarize `mcp-examples/excalidraw-scenes-ts/fixtures/sample.excalidraw`."_
- _"Confirm that an out-of-repo path is rejected for read_scene."_

## stdio gotcha

`FastMCP.run()` writes JSON-RPC to stdout. Use `print(..., file=sys.stderr)` or `logging` for diagnostics — never `print` to stdout, that breaks the protocol.
