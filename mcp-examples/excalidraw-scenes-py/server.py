"""excalidraw-scenes — MCP server for working with .excalidraw scene files and dev-docs/.

Tools:
    list_scenes(dir):       list .excalidraw files under a directory (repo-relative)
    read_scene(path):     return parsed JSON of one scene as a dict
    extract_text(path):    return all text-element strings from a scene
    summarize_scene(path): compact stats for a scene (no large blobs)
    list_dev_docs(subdir): list .md/.mdx under dev-docs/ (recursive)
    read_dev_doc(path):    read one file under dev-docs/ (relative to dev-docs/)

Resource:
    excalidraw://docs/architecture — index + entry points into dev-docs/

Run:
    uv sync
    uv run excalidraw-scenes-mcp

Wire into Cursor: see ../../.cursor/mcp.json.example
"""

from __future__ import annotations

import json
from pathlib import Path

from mcp.server.fastmcp import FastMCP

# mcp-examples/excalidraw-scenes-py/server.py -> three parents to monorepo root
REPO_ROOT: Path = Path(__file__).resolve().parent.parent.parent
DEV_DOCS_ROOT: Path = REPO_ROOT / "dev-docs"
DOC_EXTENSIONS: frozenset[str] = frozenset({".md", ".mdx"})

mcp = FastMCP("excalidraw-scenes")


def _assert_inside_root(root: Path, user_path: str) -> Path:
    """Resolve user_path to an absolute path that must lie inside root (after resolve)."""
    root_real = root.resolve()
    raw = Path(user_path)
    candidate = raw.resolve() if raw.is_absolute() else (root_real / raw).resolve()
    try:
        candidate.relative_to(root_real)
    except ValueError as e:
        raise ValueError(f"Path escapes repository root: {user_path}") from e
    return candidate


def _resolve_scene_dir(user_dir: str) -> Path:
    p = _assert_inside_root(REPO_ROOT, user_dir)
    if not p.is_dir():
        raise FileNotFoundError(f"Directory not found: {user_dir}")
    return p


def _resolve_scene_file(user_path: str) -> Path:
    p = _assert_inside_root(REPO_ROOT, user_path)
    if p.suffix != ".excalidraw":
        raise ValueError("Scene path must end with .excalidraw")
    return p


def _resolve_dev_docs_subdir(subdir: str) -> Path:
    dev = DEV_DOCS_ROOT.resolve()
    if subdir:
        p = Path(subdir)
        if p.is_absolute():
            raise ValueError("subdir must be relative to dev-docs/")
        if ".." in p.parts:
            raise ValueError("Invalid dev-docs subdir")
        base = _assert_inside_root(dev, str(dev / p))
    else:
        base = dev
    if not base.is_dir():
        raise FileNotFoundError(f"dev-docs subdirectory not found: {subdir or '.'}")
    return base


def _resolve_dev_doc_file(rel_to_dev_docs: str) -> Path:
    raw = Path(rel_to_dev_docs)
    if raw.is_absolute():
        raise ValueError("dev-docs path must be relative to dev-docs/")
    s = rel_to_dev_docs.lstrip("/\\")
    if not s or ".." in Path(s).parts:
        raise ValueError("Invalid dev-docs path")
    full = (DEV_DOCS_ROOT / s).resolve()
    _assert_inside_root(DEV_DOCS_ROOT, str(full))
    if full.suffix.lower() not in DOC_EXTENSIONS:
        raise ValueError("Only .md and .mdx files are allowed under dev-docs/")
    return full


def _walk_markdown_files(base: Path) -> list[str]:
    out: list[str] = []
    dev_resolved = DEV_DOCS_ROOT.resolve()
    for path in sorted(base.rglob("*")):
        if path.is_file() and path.suffix.lower() in DOC_EXTENSIONS:
            rel = path.resolve().relative_to(dev_resolved).as_posix()
            out.append(rel)
    return out


@mcp.tool()
def list_scenes(dir: str) -> list[str]:
    """List .excalidraw files under a directory (relative to monorepo root)."""
    root = _resolve_scene_dir(dir)
    rel_base = root.relative_to(REPO_ROOT.resolve()).as_posix()
    scenes: list[str] = []
    for p in sorted(root.glob("*.excalidraw")):
        name = p.name
        scenes.append(f"{rel_base}/{name}" if rel_base else name)
    return scenes


@mcp.tool()
def read_scene(path: str) -> dict:
    """Return the parsed JSON of an .excalidraw file (must be under repo root)."""
    p = _resolve_scene_file(path)
    return json.loads(p.read_text(encoding="utf-8"))


@mcp.tool()
def extract_text(path: str) -> list[str]:
    """Return every string from text elements inside a .excalidraw file."""
    p = _resolve_scene_file(path)
    scene = json.loads(p.read_text(encoding="utf-8"))
    return [
        el["text"]
        for el in scene.get("elements", [])
        if el.get("type") == "text" and isinstance(el.get("text"), str)
    ]


@mcp.tool()
def summarize_scene(path: str) -> dict:
    """Compact stats: type/version, element counts, text count, embedded file keys count."""
    p = _resolve_scene_file(path)
    scene = json.loads(p.read_text(encoding="utf-8"))
    elements: list = scene.get("elements") if isinstance(scene.get("elements"), list) else []
    counts_by_type: dict[str, int] = {}
    text_element_count = 0
    for el in elements:
        if not isinstance(el, dict):
            t = "unknown"
        else:
            t = el["type"] if isinstance(el.get("type"), str) else "unknown"
        counts_by_type[t] = counts_by_type.get(t, 0) + 1
        if el.get("type") == "text" and isinstance(el.get("text"), str):
            text_element_count += 1
    files = scene.get("files")
    files_count = (
        len(files)
        if isinstance(files, dict) and not isinstance(files, list)
        else 0
    )
    app_state = scene.get("appState")
    return {
        "type": scene.get("type"),
        "version": scene.get("version"),
        "elementCount": len(elements),
        "countsByType": counts_by_type,
        "textElementCount": text_element_count,
        "embeddedFilesCount": files_count,
        "hasAppState": bool(isinstance(app_state, dict)),
    }


@mcp.tool()
def list_dev_docs(subdir: str = "") -> list[str]:
    """List .md and .mdx paths under dev-docs/, optional subdirectory (relative to dev-docs/)."""
    base = _resolve_dev_docs_subdir(subdir)
    return _walk_markdown_files(base)


@mcp.tool()
def read_dev_doc(path: str) -> str:
    """Read a .md or .mdx file; path is relative to dev-docs/ (e.g. docs/codebase/json-schema.mdx)."""
    p = _resolve_dev_doc_file(path)
    return p.read_text(encoding="utf-8")


@mcp.resource("excalidraw://docs/architecture")
def architecture_docs() -> str:
    """Index and entry points for dev-docs/."""
    root = REPO_ROOT.resolve()
    return f"""# Excalidraw dev-docs index

**Repository root:** `{root}`

Use MCP tools **list_dev_docs** and **read_dev_doc** to browse and read files under `dev-docs/` (validated paths only).

## Suggested entry points

- `docs/codebase/json-schema.mdx` — .excalidraw JSON schema
- `docs/introduction/development.mdx` — development notes
- `docs/introduction/contributing.mdx` — contributing
- `README.md` — dev-docs site readme

All paths above are relative to `dev-docs/` for **read_dev_doc`.
"""


def main() -> None:
    """Entry point — runs FastMCP over stdio."""
    mcp.run()


if __name__ == "__main__":
    main()
