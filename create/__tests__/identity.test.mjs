// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  renderMinimalPage,
  rewriteLayoutTitle,
  rewritePackageJson,
  rewriteReadme,
  sanitizeProjectName,
  toTitleCase,
} from "../transforms/identity.mjs";

describe("sanitizeProjectName", () => {
  it("lowercases and hyphenates", () => {
    expect(sanitizeProjectName("My New App")).toBe("my-new-app");
  });

  it("collapses runs of separators", () => {
    expect(sanitizeProjectName("my___new   app")).toBe("my-new-app");
  });

  it("trims leading and trailing hyphens", () => {
    expect(sanitizeProjectName("--my-app--")).toBe("my-app");
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(sanitizeProjectName("!!!")).toBe("");
  });
});

describe("toTitleCase", () => {
  it("title-cases each hyphenated segment", () => {
    expect(toTitleCase("my-new-app")).toBe("My New App");
  });

  it("ignores empty segments", () => {
    expect(toTitleCase("my--app")).toBe("My App");
  });
});

describe("rewritePackageJson", () => {
  it("drops every script that points into a directory trim.mjs deletes", () => {
    const result = rewritePackageJson(
      {
        name: "zen-claude-starter",
        scripts: {
          dev: "next dev",
          "create-project": "node create/cli.mjs",
          release: "node scripts/release.mjs",
        },
      },
      "my-app"
    );

    expect(result.scripts).toEqual({ dev: "next dev" });
  });

  it("renames, resets the version, and drops the scaffolder script", () => {
    const result = rewritePackageJson(
      {
        name: "zen-claude-starter",
        version: "9.9.9",
        scripts: { dev: "next dev", "create-project": "node create/cli.mjs" },
      },
      "my-app"
    );

    expect(result.name).toBe("my-app");
    expect(result.version).toBe("0.1.0");
    expect(result.scripts).toEqual({ dev: "next dev" });
  });

  it("leaves the source object untouched", () => {
    const pkg = { name: "zen-claude-starter", scripts: { dev: "next dev" } };
    rewritePackageJson(pkg, "my-app");

    expect(pkg.name).toBe("zen-claude-starter");
  });

  it("handles a package without scripts", () => {
    expect(
      rewritePackageJson({ name: "old" }, "my-app").scripts
    ).toBeUndefined();
  });
});

describe("rewriteReadme", () => {
  it("replaces every mention of the template name", () => {
    const markdown =
      "# zen-claude-starter\n\nRun zen-claude-starter locally.\n";

    expect(rewriteReadme(markdown, "zen-claude-starter", "my-app")).toBe(
      "# my-app\n\nRun my-app locally.\n"
    );
  });
});

describe("rewriteLayoutTitle", () => {
  it("swaps the metadata title", () => {
    const source = 'export const metadata = {\n  title: "Next Starter",\n};\n';

    expect(rewriteLayoutTitle(source, "My App")).toContain('title: "My App"');
  });

  it("leaves other string fields alone", () => {
    const source =
      'const metadata = {\n  title: "Old",\n  description: "Keep me",\n};';

    expect(rewriteLayoutTitle(source, "New")).toContain(
      'description: "Keep me"'
    );
  });
});

describe("renderMinimalPage", () => {
  it("renders the project title and keeps the mode toggle", () => {
    const page = renderMinimalPage("My App");

    expect(page).toContain(">My App</h1>");
    expect(page).toContain('from "@/components/layout/mode-toggle"');
  });
});
