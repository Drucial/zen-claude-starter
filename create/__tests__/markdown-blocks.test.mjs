// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  DOC_BLOCKS,
  readReplacement,
  stripBlockMarkers,
  stripTemplateOnly,
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

describe("stripTemplateOnly", () => {
  const markdown = [
    "# Project",
    "",
    "Kept intro.",
    "",
    "<!-- template-only:start -->",
    "",
    "## Releasing",
    "",
    "Only the template repo releases.",
    "",
    "<!-- template-only:end -->",
    "",
    "## Scripts",
    "",
    "Kept outro.",
    "",
  ].join("\n");

  it("removes the marked section and its markers", () => {
    const result = stripTemplateOnly(markdown);

    expect(result).not.toContain("Releasing");
    expect(result).not.toContain("template-only");
  });

  it("keeps everything around it", () => {
    const result = stripTemplateOnly(markdown);

    expect(result).toContain("Kept intro.");
    expect(result).toContain("## Scripts");
    expect(result).toContain("Kept outro.");
  });

  it("removes every marked section, not just the first", () => {
    const twice = `${markdown}\n<!-- template-only:start -->\nsecond\n<!-- template-only:end -->\n`;

    expect(stripTemplateOnly(twice)).not.toContain("second");
  });

  it("leaves a document without markers alone", () => {
    expect(stripTemplateOnly("# Plain\n\nNothing marked.\n")).toBe(
      "# Plain\n\nNothing marked.\n"
    );
  });

  it("does not collapse the surrounding blank lines into a run", () => {
    expect(stripTemplateOnly(markdown)).not.toMatch(/\n{3}/);
  });
});

describe("the template's own README", () => {
  it("keeps the scaffolder and release docs out of generated projects", () => {
    const readme = readFileSync(join(REPO_ROOT, "README.md"), "utf8");
    const stripped = stripTemplateOnly(readme);

    expect(readme).toContain("## Scaffolding a project");
    expect(stripped).not.toContain("## Scaffolding a project");
    expect(stripped).not.toContain("pnpm release");
    expect(stripped).not.toContain("npx zen-claude-starter");
  });

  it("keeps the parts a generated project still needs", () => {
    const stripped = stripTemplateOnly(
      readFileSync(join(REPO_ROOT, "README.md"), "utf8")
    );

    expect(stripped).toContain("## Getting Started");
    expect(stripped).toContain("## Scripts");
    expect(stripped).toContain("## Project Structure");
    expect(stripped).toContain("## Conventions");
    expect(stripped).toContain("## Deploy");
  });
});

describe("stripBlockMarkers", () => {
  it("removes every marker, whichever block it belongs to", () => {
    const markdown = [
      "## A",
      "<!-- layout:start -->",
      "kept",
      "<!-- layout:end -->",
      "## B",
      "<!-- data:start -->",
      "also kept",
      "<!-- data:end -->",
      "",
    ].join("\n");
    const result = stripBlockMarkers(markdown);

    expect(result).not.toContain("<!--");
    expect(result).toContain("kept");
    expect(result).toContain("also kept");
  });

  it("does not leave a run of blank lines where markers were", () => {
    const markdown =
      "a\n\n<!-- data:start -->\n\nb\n\n<!-- data:end -->\n\nc\n";

    expect(stripBlockMarkers(markdown)).not.toMatch(/\n{3}/);
  });

  it("leaves ordinary comments alone", () => {
    const markdown = "<!-- prettier-ignore -->\nkept\n";

    expect(stripBlockMarkers(markdown)).toContain("<!-- prettier-ignore -->");
  });
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
