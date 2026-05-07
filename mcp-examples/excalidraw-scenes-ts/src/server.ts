#!/usr/bin/env node
/**
 * excalidraw-scenes — MCP server for working with .excalidraw scene files and dev-docs/.
 *
 * Tools:
 *   - list_scenes(dir):       list .excalidraw files in one directory (repo-relative or absolute within repo)
 *   - read_scene(path):       return parsed JSON of one scene
 *   - extract_text(path):     return all text-element strings from a scene
 *   - summarize_scene(path):  compact stats for a scene (no large blobs)
 *   - list_dev_docs(subdir?): list .md/.mdx under dev-docs/ (recursive)
 *   - read_dev_doc(path):     read one file under dev-docs/ (path relative to dev-docs/)
 *
 * Resource:
 *   - excalidraw://docs/architecture — index + entry points into dev-docs/
 *
 * Run:
 *   npm install && npm run build
 *   node dist/server.js
 *
 * Wire into Cursor: see ../../.cursor/mcp.json.example
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { realpath, readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Monorepo root (mcp-examples/excalidraw-scenes-ts/dist -> three levels up). */
const REPO_ROOT = await realpath(resolve(__dirname, "..", "..", ".."));
const DEV_DOCS_ROOT = resolve(REPO_ROOT, "dev-docs");

const DOC_EXTENSIONS = new Set([".md", ".mdx"]);

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

/** Normalize and ensure `targetPath` stays inside `rootReal` (after realpath). */
async function assertInsideRoot(rootDir: string, targetPath: string): Promise<string> {
  const rootReal = await realpath(rootDir);
  const normalized = isAbsolute(targetPath)
    ? resolve(targetPath)
    : resolve(rootReal, targetPath);

  let resolved: string;
  try {
    resolved = await realpath(normalized);
  } catch {
    resolved = normalized;
  }

  if (process.platform === "win32") {
    const rootLower = rootReal.toLowerCase();
    const resolvedLower = resolved.toLowerCase();
    const prefix = rootLower.endsWith("\\") ? rootLower : rootLower + "\\";
    if (resolvedLower !== rootLower && !resolvedLower.startsWith(prefix)) {
      throw new Error(`Path escapes repository root: ${targetPath}`);
    }
    return resolved;
  }

  const rel = relative(rootReal, resolved);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path escapes repository root: ${targetPath}`);
  }
  return resolved;
}

async function resolveScenePath(userPath: string): Promise<string> {
  const abs = await assertInsideRoot(REPO_ROOT, userPath);
  if (!abs.endsWith(".excalidraw")) {
    throw new Error("Scene path must end with .excalidraw");
  }
  return abs;
}

async function resolveSceneDir(userDir: string): Promise<string> {
  const abs = await assertInsideRoot(REPO_ROOT, userDir);
  const stats = await stat(abs).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error(`Directory not found: ${userDir}`);
  }
  return abs;
}

async function resolveDevDocsSubdir(subdir: string): Promise<string> {
  const abs = await assertInsideRoot(DEV_DOCS_ROOT, subdir);
  const stats = await stat(abs).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error(`dev-docs subdirectory not found: ${subdir || "."}`);
  }
  return abs;
}

async function resolveDevDocFile(relToDevDocs: string): Promise<string> {
  if (isAbsolute(relToDevDocs)) {
    throw new Error("dev-docs path must be relative to dev-docs/");
  }
  const trimmed = relToDevDocs.replace(/^[/\\]+/, "");
  if (!trimmed || trimmed.includes("..")) {
    throw new Error("Invalid dev-docs path");
  }
  const abs = resolve(DEV_DOCS_ROOT, trimmed);
  const inside = await assertInsideRoot(DEV_DOCS_ROOT, abs);
  const ext = extname(inside).toLowerCase();
  if (!DOC_EXTENSIONS.has(ext)) {
    throw new Error("Only .md and .mdx files are allowed under dev-docs/");
  }
  return inside;
}

async function walkMarkdownFiles(dir: string, baseRel: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = join(dir, ent.name);
    const rel = baseRel ? join(baseRel, ent.name) : ent.name;
    if (ent.isDirectory()) {
      out.push(...(await walkMarkdownFiles(full, rel)));
    } else if (ent.isFile()) {
      const ext = extname(ent.name).toLowerCase();
      if (DOC_EXTENSIONS.has(ext)) {
        out.push(rel.replaceAll("\\", "/"));
      }
    }
  }
  return out.sort();
}

const server = new McpServer({
  name: "excalidraw-scenes",
  version: "0.2.0",
});

server.registerTool(
  "list_scenes",
  {
    title: "List Excalidraw scenes",
    description:
      "List .excalidraw files in a single directory. Paths are relative to the monorepo root or absolute paths inside the repo.",
    inputSchema: {
      dir: z
        .string()
        .describe("Directory to scan, e.g. 'examples' or 'excalidraw-app/data'"),
    },
  },
  async ({ dir }) => {
    try {
      const absDir = await resolveSceneDir(dir);
      const entries = await readdir(absDir, { withFileTypes: true });
      const relBase = relative(REPO_ROOT, absDir).replaceAll("\\", "/");
      const scenes = entries
        .filter((e) => e.isFile() && e.name.endsWith(".excalidraw"))
        .map((e) => (relBase ? `${relBase}/${e.name}` : e.name));
      return {
        content: [
          {
            type: "text",
            text: scenes.length ? scenes.join("\n") : `(no .excalidraw files in ${dir})`,
          },
        ],
      };
    } catch (e) {
      return errorResult(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "read_scene",
  {
    title: "Read Excalidraw scene",
    description:
      "Return the parsed JSON of an .excalidraw file as a pretty-printed string (must be under the repo root).",
    inputSchema: {
      path: z.string().describe("Path to a .excalidraw file"),
    },
  },
  async ({ path }) => {
    try {
      const abs = await resolveScenePath(path);
      const raw = await readFile(abs, "utf8");
      const parsed = JSON.parse(raw);
      return {
        content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
      };
    } catch (e) {
      return errorResult(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "extract_text",
  {
    title: "Extract text from scene",
    description:
      "Return every string from text elements inside a .excalidraw file, one per line (path must be under repo root).",
    inputSchema: {
      path: z.string().describe("Path to a .excalidraw file"),
    },
  },
  async ({ path }) => {
    try {
      const abs = await resolveScenePath(path);
      const raw = await readFile(abs, "utf8");
      const scene = JSON.parse(raw) as { elements?: Array<{ type: string; text?: string }> };
      const texts = (scene.elements ?? [])
        .filter((el) => el.type === "text" && typeof el.text === "string")
        .map((el) => el.text as string);
      return {
        content: [{ type: "text", text: texts.length ? texts.join("\n") : "(no text)" }],
      };
    } catch (e) {
      return errorResult(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "summarize_scene",
  {
    title: "Summarize Excalidraw scene",
    description:
      "Return compact JSON stats: schema type/version, element counts by type, text element count, number of file blobs. Omits heavy fields like dataURL.",
    inputSchema: {
      path: z.string().describe("Path to a .excalidraw file under the repo root"),
    },
  },
  async ({ path }) => {
    try {
      const abs = await resolveScenePath(path);
      const raw = await readFile(abs, "utf8");
      const scene = JSON.parse(raw) as {
        type?: unknown;
        version?: unknown;
        elements?: Array<{ type?: unknown; text?: unknown }>;
        files?: Record<string, unknown>;
        appState?: Record<string, unknown>;
      };
      const elements = Array.isArray(scene.elements) ? scene.elements : [];
      const countsByType: Record<string, number> = {};
      let textElementCount = 0;
      for (const el of elements) {
        const t = typeof el?.type === "string" ? el.type : "unknown";
        countsByType[t] = (countsByType[t] ?? 0) + 1;
        if (el?.type === "text" && typeof el.text === "string") {
          textElementCount += 1;
        }
      }
      const filesCount =
        scene.files && typeof scene.files === "object" && !Array.isArray(scene.files)
          ? Object.keys(scene.files).length
          : 0;
      const summary = {
        type: scene.type,
        version: scene.version,
        elementCount: elements.length,
        countsByType,
        textElementCount,
        embeddedFilesCount: filesCount,
        hasAppState: Boolean(scene.appState && typeof scene.appState === "object"),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (e) {
      return errorResult(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "list_dev_docs",
  {
    title: "List dev-docs markdown files",
    description:
      "List .md and .mdx files under dev-docs/, optionally scoped to a subdirectory (path relative to dev-docs/).",
    inputSchema: {
      subdir: z
        .string()
        .optional()
        .describe("Subdirectory under dev-docs/, e.g. 'docs/introduction' or empty for all"),
    },
  },
  async ({ subdir }) => {
    try {
      const base = await resolveDevDocsSubdir(subdir ?? "");
      const relPrefix = relative(DEV_DOCS_ROOT, base).replaceAll("\\", "/");
      const files = await walkMarkdownFiles(base, relPrefix === "" ? "" : relPrefix);
      return {
        content: [
          {
            type: "text",
            text: files.length ? files.join("\n") : "(no .md/.mdx files in this tree)",
          },
        ],
      };
    } catch (e) {
      return errorResult(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "read_dev_doc",
  {
    title: "Read dev-docs file",
    description:
      "Read a .md or .mdx file from dev-docs/. Argument is the path relative to dev-docs/ (e.g. docs/codebase/json-schema.mdx).",
    inputSchema: {
      path: z.string().describe("Path under dev-docs/, e.g. docs/codebase/json-schema.mdx"),
    },
  },
  async ({ path }) => {
    try {
      const abs = await resolveDevDocFile(path);
      const text = await readFile(abs, "utf8");
      return {
        content: [{ type: "text", text }],
      };
    } catch (e) {
      return errorResult(e instanceof Error ? e.message : String(e));
    }
  },
);

const ARCHITECTURE_RESOURCE_TEXT = `# Excalidraw dev-docs index

**Repository root:** \`${REPO_ROOT}\`

Use MCP tools **list_dev_docs** and **read_dev_doc** to browse and read files under \`dev-docs/\` (validated paths only).

## Suggested entry points

- \`docs/codebase/json-schema.mdx\` — .excalidraw JSON schema
- \`docs/introduction/development.mdx\` — development notes
- \`docs/introduction/contributing.mdx\` — contributing
- \`README.md\` — dev-docs site readme

All paths above are relative to \`dev-docs/\` for **read_dev_doc**.
`;

server.registerResource(
  "architecture-docs",
  "excalidraw://docs/architecture",
  {
    title: "Excalidraw architecture docs",
    description: "Index and entry points for dev-docs/; use list_dev_docs and read_dev_doc for content.",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: ARCHITECTURE_RESOURCE_TEXT,
      },
    ],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("excalidraw-scenes MCP listening on stdio");
