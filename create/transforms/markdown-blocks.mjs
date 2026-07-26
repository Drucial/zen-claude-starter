import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates",
  "monorepo",
  "docs"
);

const START = "<!-- layout:start -->";
const END = "<!-- layout:end -->";
const BLOCK = /<!-- layout:start -->[\s\S]*?<!-- layout:end -->/;

/**
 * The docs describe a directory layout the monorepo doesn't have. Only those
 * sections are marked, so the conventions around them stay written once.
 */
export const LAYOUT_BLOCKS = [
  { file: "CLAUDE.md", replacement: "CLAUDE.layout.md" },
  {
    file: join(".claude", "rules", "code-quality.md"),
    replacement: "code-quality.layout.md",
  },
  { file: "README.md", replacement: "README.layout.md" },
];

export function swapLayoutBlock(markdown, replacement) {
  if (!BLOCK.test(markdown)) {
    throw new Error(`no ${START} … ${END} block to replace`);
  }

  return markdown.replace(BLOCK, `${START}\n\n${replacement.trim()}\n\n${END}`);
}

export function readLayoutReplacement(name) {
  return readFileSync(join(DOCS_ROOT, name), "utf8");
}

export function swapLayoutBlocks(dir) {
  for (const { file, replacement } of LAYOUT_BLOCKS) {
    const path = join(dir, file);

    try {
      writeFileSync(
        path,
        swapLayoutBlock(
          readFileSync(path, "utf8"),
          readLayoutReplacement(replacement)
        )
      );
    } catch (error) {
      throw new Error(`${file}: ${error.message}`);
    }
  }
}
