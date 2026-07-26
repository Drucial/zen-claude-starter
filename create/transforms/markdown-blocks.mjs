import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates",
  "docs"
);

const CLAUDE = "CLAUDE.md";
const CODE_QUALITY = join(".claude", "rules", "code-quality.md");
const README = "README.md";

/**
 * Sections of the docs that describe a choice the scaffolder can change. Only
 * these are marked, so the conventions around them stay written once.
 *
 * `layout` swaps the single-app directory structure for the workspace one.
 * `data` swaps the TanStack Query flow for the server-actions-only one.
 */
export const DOC_BLOCKS = {
  layout: [CLAUDE, CODE_QUALITY, README],
  data: [CLAUDE, CODE_QUALITY, README],
};

const REPLACEMENT_NAMES = {
  [CLAUDE]: "CLAUDE.md",
  [CODE_QUALITY]: "code-quality.md",
  [README]: "README.md",
};

const markers = (block) => ({
  start: `<!-- ${block}:start -->`,
  end: `<!-- ${block}:end -->`,
});

export function swapBlock(markdown, block, replacement) {
  const { start, end } = markers(block);
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);

  if (!pattern.test(markdown)) {
    throw new Error(`no ${start} … ${end} block to replace`);
  }

  return markdown.replace(
    pattern,
    `${start}\n\n${replacement.trim()}\n\n${end}`
  );
}

export function readReplacement(block, file) {
  return readFileSync(join(DOCS_ROOT, block, REPLACEMENT_NAMES[file]), "utf8");
}

export function swapDocBlocks(dir, block) {
  for (const file of DOC_BLOCKS[block]) {
    const path = join(dir, file);

    try {
      writeFileSync(
        path,
        swapBlock(
          readFileSync(path, "utf8"),
          block,
          readReplacement(block, file)
        )
      );
    } catch (error) {
      throw new Error(`${file}: ${error.message}`);
    }
  }
}
