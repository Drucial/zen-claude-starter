// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  LAYOUT_BLOCKS,
  readLayoutReplacement,
  swapLayoutBlock,
} from "../transforms/markdown-blocks.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("layout blocks", () => {
  it.each(LAYOUT_BLOCKS)("$file carries a marked block", ({ file }) => {
    const markdown = readFileSync(join(REPO_ROOT, file), "utf8");

    expect(markdown).toContain("<!-- layout:start -->");
    expect(markdown).toContain("<!-- layout:end -->");
  });

  it.each(LAYOUT_BLOCKS)(
    "$file has a monorepo replacement",
    ({ replacement }) => {
      expect(readLayoutReplacement(replacement).trim()).not.toBe("");
    }
  );

  it.each(LAYOUT_BLOCKS)(
    "$file's replacement describes the workspace layout",
    ({ replacement }) => {
      expect(readLayoutReplacement(replacement)).toMatch(
        /packages\/ui|@repo\/ui/
      );
    }
  );
});

describe("swapLayoutBlock", () => {
  const markdown = [
    "## Structure",
    "",
    "<!-- layout:start -->",
    "",
    "single-app layout",
    "",
    "<!-- layout:end -->",
    "",
    "## Conventions",
    "",
    "These stay shared.",
    "",
  ].join("\n");

  it("replaces the block contents", () => {
    const result = swapLayoutBlock(markdown, "workspace layout");

    expect(result).toContain("workspace layout");
    expect(result).not.toContain("single-app layout");
  });

  it("leaves the surrounding prose alone", () => {
    const result = swapLayoutBlock(markdown, "workspace layout");

    expect(result).toContain("## Conventions");
    expect(result).toContain("These stay shared.");
  });

  it("keeps the markers so the swap can happen again", () => {
    const once = swapLayoutBlock(markdown, "first");

    expect(swapLayoutBlock(once, "second")).toContain("second");
  });

  it("throws when the markers are missing", () => {
    expect(() => swapLayoutBlock("# No markers here\n", "x")).toThrow(
      /layout:start/
    );
  });
});
