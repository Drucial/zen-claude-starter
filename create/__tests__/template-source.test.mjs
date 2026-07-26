// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  findLocalTemplate,
  tarballUrl,
  TEMPLATE_REF,
  TEMPLATE_REPO,
} from "../template-source.mjs";

const CREATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(CREATE_DIR, "package.json"), "utf8")
);

describe("tarballUrl", () => {
  it("points at the tag's source archive", () => {
    expect(tarballUrl("owner/repo", "v1.2.3")).toBe(
      "https://codeload.github.com/owner/repo/tar.gz/refs/tags/v1.2.3"
    );
  });
});

describe("template ref", () => {
  it("tracks the package version, so a release reproduces its own output", () => {
    expect(TEMPLATE_REF).toBe(`v${manifest.version}`);
  });

  it("names the repo the tag lives in", () => {
    expect(TEMPLATE_REPO).toMatch(/^[\w.-]+\/[\w.-]+$/);
  });
});

describe("findLocalTemplate", () => {
  it("finds the checkout when running from inside the repo", () => {
    expect(findLocalTemplate()).toBe(join(CREATE_DIR, ".."));
  });
});

describe("published package", () => {
  it("has no template file npm would strip from the tarball", () => {
    // npm silently drops any file named .gitignore when packing, so a template
    // that ships one loses it for every npx user while working locally.
    const stripped = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name === ".gitignore") stripped.push(path);
      }
    };
    walk(join(CREATE_DIR, "templates"));

    expect(stripped).toEqual([]);
  });

  it("ships every module the CLI imports", () => {
    const entryPoints = ["cli.mjs", ...manifest.files];
    const imported = new Set();

    for (const file of entryPoints) {
      if (!file.endsWith(".mjs")) continue;
      const source = readFileSync(join(CREATE_DIR, file), "utf8");

      for (const [, path] of source.matchAll(/from "\.\/([^"]+)"/g)) {
        imported.add(path.split("/")[0]);
      }
    }

    for (const dependency of imported) {
      const shipped = manifest.files.some(
        (file) =>
          file === dependency || file === dependency.replace(/\.mjs$/, "")
      );

      expect(shipped, `${dependency} is missing from package.json files`).toBe(
        true
      );
    }
  });
});
