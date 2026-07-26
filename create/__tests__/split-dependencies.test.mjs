// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  OPTIONAL_FEATURES,
  PACKAGES,
  TARGETS,
} from "../transforms/manifest.mjs";
import { splitDependencies } from "../transforms/split-dependencies.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const templatePkg = JSON.parse(
  readFileSync(join(REPO_ROOT, "package.json"), "utf8")
);

const FEATURES = ["core", ...OPTIONAL_FEATURES];

describe("manifest", () => {
  it("places every dependency the template declares", () => {
    const declared = [
      ...Object.keys(templatePkg.dependencies ?? {}),
      ...Object.keys(templatePkg.devDependencies ?? {}),
    ];
    const unplaced = declared.filter((name) => !PACKAGES[name]);

    expect(unplaced).toEqual([]);
  });

  it("does not place packages the template no longer declares", () => {
    const declared = new Set([
      ...Object.keys(templatePkg.dependencies ?? {}),
      ...Object.keys(templatePkg.devDependencies ?? {}),
    ]);
    const stale = Object.keys(PACKAGES).filter((name) => !declared.has(name));

    expect(stale).toEqual([]);
  });

  it("gives every package a known target and feature", () => {
    for (const [name, entry] of Object.entries(PACKAGES)) {
      expect(entry.targets.length, `${name} has no target`).toBeGreaterThan(0);
      for (const target of entry.targets) {
        expect(TARGETS, `${name} → ${target}`).toContain(target);
      }
      expect(FEATURES, `${name} → ${entry.feature}`).toContain(entry.feature);
    }
  });

  it("tags the dependency groups the installer will make optional", () => {
    const byFeature = (feature) =>
      Object.entries(PACKAGES)
        .filter(([, entry]) => entry.feature === feature)
        .map(([name]) => name)
        .sort();

    expect(byFeature("query")).toEqual([
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
    ]);
    expect(byFeature("zod")).toEqual(["zod"]);
    expect(byFeature("motion")).toEqual(["motion"]);
  });
});

describe("splitDependencies", () => {
  const buckets = splitDependencies(templatePkg);

  it("preserves the template's version ranges", () => {
    expect(buckets.web.dependencies.next).toBe(templatePkg.dependencies.next);
    expect(buckets.ui.dependencies["radix-ui"]).toBe(
      templatePkg.dependencies["radix-ui"]
    );
  });

  it("keeps a dependency's dev/runtime classification", () => {
    expect(buckets.web.devDependencies.vitest).toBe(
      templatePkg.devDependencies.vitest
    );
    expect(buckets.web.dependencies.vitest).toBeUndefined();
  });

  it("copies shared packages into every target that imports them", () => {
    expect(buckets.web.dependencies["lucide-react"]).toBeDefined();
    expect(buckets.ui.dependencies["lucide-react"]).toBeDefined();
  });

  it("routes the eslint plugins to the config package, not the app", () => {
    expect(
      buckets["eslint-config"].devDependencies["eslint-plugin-react"]
    ).toBeDefined();
    expect(buckets.web.devDependencies["eslint-plugin-react"]).toBeUndefined();
  });

  it("keeps formatting at the root and linting in the packages", () => {
    expect(buckets.root.devDependencies.prettier).toBeDefined();
    expect(buckets.web.devDependencies.eslint).toBeDefined();
    expect(buckets.ui.devDependencies.eslint).toBeDefined();
  });

  it("adds turbo, which the single-app template has no use for", () => {
    expect(buckets.root.devDependencies.turbo).toBeDefined();
  });

  it("throws and names the package when one is unplaced", () => {
    expect(() =>
      splitDependencies({ dependencies: { "left-pad": "^1.0.0" } })
    ).toThrow(/left-pad/);
  });
});
