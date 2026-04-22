#!/usr/bin/env node
/**
 * excalidraw-scenes — minimal MCP server for working with .excalidraw scene files.
 *
 * Tools:
 *   - list_scenes(dir):       list .excalidraw files under a directory
 *   - read_scene(path):       return parsed JSON of one scene
 *   - extract_text(path):     return all text-element strings from a scene
 *
 * Resource:
 *   - excalidraw://docs/architecture — exposes dev-docs/ as MCP resources (stub)
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
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const server = new McpServer({
  name: "excalidraw-scenes",
  version: "0.1.0",
});

server.registerTool(
  "list_scenes",
  {
    title: "List Excalidraw scenes",
    description:
      "List .excalidraw files under a directory (path is relative to the repo root). Returns one path per line.",
    inputSchema: {
      dir: z
        .string()
        .describe("Directory to scan, e.g. 'examples' or 'excalidraw-app/data'"),
    },
  },
  async ({ dir }) => {
    const root = resolve(dir);
    const stats = await stat(root).catch(() => null);
    if (!stats || !stats.isDirectory()) {
      return {
        content: [{ type: "text", text: `Directory not found: ${dir}` }],
        isError: true,
      };
    }
    const entries = await readdir(root, { withFileTypes: true });
    const scenes = entries
      .filter((e) => e.isFile() && e.name.endsWith(".excalidraw"))
      .map((e) => join(dir, e.name));
    return {
      content: [
        {
          type: "text",
          text: scenes.length ? scenes.join("\n") : `(no .excalidraw files in ${dir})`,
        },
      ],
    };
  },
);

server.registerTool(
  "read_scene",
  {
    title: "Read Excalidraw scene",
    description:
      "Return the parsed JSON of an .excalidraw file as a pretty-printed string.",
    inputSchema: {
      path: z.string().describe("Path to a .excalidraw file"),
    },
  },
  async ({ path }) => {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    return {
      content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
    };
  },
);

server.registerTool(
  "extract_text",
  {
    title: "Extract text from scene",
    description:
      "Return every string from text elements inside a .excalidraw file, one per line.",
    inputSchema: {
      path: z.string().describe("Path to a .excalidraw file"),
    },
  },
  async ({ path }) => {
    const raw = await readFile(path, "utf8");
    const scene = JSON.parse(raw) as { elements?: Array<{ type: string; text?: string }> };
    const texts = (scene.elements ?? [])
      .filter((el) => el.type === "text" && typeof el.text === "string")
      .map((el) => el.text as string);
    return {
      content: [{ type: "text", text: texts.length ? texts.join("\n") : "(no text)" }],
    };
  },
);

server.registerResource(
  "architecture-docs",
  "excalidraw://docs/architecture",
  {
    title: "Excalidraw architecture docs",
    description:
      "Stub resource — replace this with a real dev-docs/ reader during the workshop.",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: "# Excalidraw architecture\n\nReplace this stub with content from dev-docs/.",
      },
    ],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("excalidraw-scenes MCP listening on stdio");
