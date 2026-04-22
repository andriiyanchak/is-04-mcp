"""excalidraw-scenes — minimal MCP server for working with .excalidraw scene files.

Tools:
    list_scenes(dir):    list .excalidraw files under a directory
    read_scene(path):    return parsed JSON of one scene
    extract_text(path):  return all text-element strings from a scene

Resource:
    excalidraw://docs/architecture — stub for dev-docs/

Run:
    uv sync
    uv run excalidraw-scenes-mcp

Wire into Cursor: see ../../.cursor/mcp.json.example
"""

from __future__ import annotations

import json
from pathlib import Path

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("excalidraw-scenes")


@mcp.tool()
def list_scenes(dir: str) -> list[str]:
    """List .excalidraw files under a directory (relative to the repo root)."""
    root = Path(dir)
    if not root.is_dir():
        raise FileNotFoundError(f"Directory not found: {dir}")
    return sorted(str(p) for p in root.glob("*.excalidraw"))


@mcp.tool()
def read_scene(path: str) -> dict:
    """Return the parsed JSON of an .excalidraw file."""
    return json.loads(Path(path).read_text(encoding="utf-8"))


@mcp.tool()
def extract_text(path: str) -> list[str]:
    """Return every string from text elements inside a .excalidraw file."""
    scene = json.loads(Path(path).read_text(encoding="utf-8"))
    return [
        el["text"]
        for el in scene.get("elements", [])
        if el.get("type") == "text" and isinstance(el.get("text"), str)
    ]


@mcp.resource("excalidraw://docs/architecture")
def architecture_docs() -> str:
    """Stub resource — replace with content from dev-docs/ during the workshop."""
    return "# Excalidraw architecture\n\nReplace this stub with content from dev-docs/."


def main() -> None:
    """Entry point — runs FastMCP over stdio."""
    mcp.run()


if __name__ == "__main__":
    main()
