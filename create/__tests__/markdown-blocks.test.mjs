// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  DOC_BLOCKS,
  readReplacement,
  swapBlock,
} from "../transforms/markdown-blocks.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const cases = Object.entries(DOC_BLOCKS).flatMap(([block, files]) =>
  files.map((file) => ({ block, file }))
);

describe("doc blocks", () => {
  it.each(cases)("$file carries a $block block", ({ block, file }) => {
    const markdown = readFileSync(join(REPO_ROOT, file), "utf8");

    expect(markdown).toContain(`<!-- ${block}:start -->`);
    expect(markdown).toContain(`<!-- ${block}:end -->`);
  });

  it.each(cases)("$file has a $block replacement", ({ block, file }) => {
    expect(readReplacement(block, file).trim()).not.toBe("");
  });

  it.each(cases.filter(({ block }) => block === "layout"))(
    "$file's layout replacement describes the workspace",
    ({ block, file }) => {
      expect(readReplacement(block, file)).toMatch(/packages\/ui|@repo\/ui/);
    }
  );

  it.each(cases.filter(({ block }) => block === "data"))(
    "$file's data replacement drops the client cache",
    ({ block, file }) => {
      const replacement = readReplacement(block, file);

      expect(replacement).not.toMatch(/useAppMutation|useQuery\(/);
      expect(replacement).toMatch(/server action/i);
    }
  );
});

describe("swapBlock", () => {
  const markdown = [
    "## Structure",
    "",
    "<!-- layout:start -->",
    "",
    "single-app layout",
    "",
    "<!-- layout:end -->",
    "",
    "## Data",
    "",
    "<!-- data:start -->",
    "",
    "query flow",
    "",
    "<!-- data:end -->",
    "",
    "Shared prose that every variant keeps.",
    "",
  ].join("\n");

  it("replaces the named block's contents", () => {
    const result = swapBlock(markdown, "layout", "workspace layout");

    expect(result).toContain("workspace layout");
    expect(result).not.toContain("single-app layout");
  });

  it("leaves the other block alone", () => {
    const result = swapBlock(markdown, "layout", "workspace layout");

    expect(result).toContain("query flow");
  });

  it("leaves the surrounding prose alone", () => {
    const result = swapBlock(markdown, "data", "server actions only");

    expect(result).toContain("## Structure");
    expect(result).toContain("Shared prose that every variant keeps.");
  });

  it("keeps the markers so the swap can happen again", () => {
    const once = swapBlock(markdown, "data", "first");

    expect(swapBlock(once, "data", "second")).toContain("second");
  });

  it("throws when the markers are missing", () => {
    expect(() => swapBlock("# No markers here\n", "layout", "x")).toThrow(
      /layout:start/
    );
  });
});
