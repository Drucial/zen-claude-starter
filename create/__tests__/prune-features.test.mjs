// @vitest-environment node
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { FEATURE_IDS } from "../features.mjs";
import { PACKAGES } from "../transforms/manifest.mjs";
import { pruneFeatures } from "../transforms/prune-features.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const MARKED_DOC = [
  "<!-- data:start -->",
  "",
  "query flow with useAppMutation",
  "",
  "<!-- data:end -->",
  "",
  "Shared prose.",
  "",
].join("\n");

const FIXTURE_FILES = {
  "hooks/use-app-mutation.ts": "export function useAppMutation() {}\n",
  "hooks/__tests__/use-app-mutation.test.tsx": "// test\n",
  "hooks/users/users.queries.ts": "export const userQueries = {};\n",
  "hooks/users/users.actions.ts": '"use server";\n',
  "components/layout/providers.tsx":
    'import { QueryClientProvider } from "@tanstack/react-query";\n',
  "CLAUDE.md": MARKED_DOC,
  ".claude/rules/code-quality.md": MARKED_DOC,
  "README.md": MARKED_DOC,
};

const dirs = [];

function buildFixture() {
  const dir = mkdtempSync(join(tmpdir(), "zen-prune-"));
  dirs.push(dir);

  for (const [path, contents] of Object.entries(FIXTURE_FILES)) {
    const target = join(dir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }

  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
  writeFileSync(join(dir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);

  return dir;
}

function readPkg(dir) {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
}

function allDeps(dir) {
  const pkg = readPkg(dir);

  return { ...pkg.dependencies, ...pkg.devDependencies };
}

afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

describe("pruneFeatures", () => {
  it("changes nothing when nothing is excluded", () => {
    const dir = buildFixture();
    const before = allDeps(dir);
    pruneFeatures(dir, []);

    expect(allDeps(dir)).toEqual(before);
    expect(existsSync(join(dir, "hooks/use-app-mutation.ts"))).toBe(true);
  });

  it.each(FEATURE_IDS)("drops every package tagged %s", (feature) => {
    const dir = buildFixture();
    pruneFeatures(dir, [feature]);

    const remaining = Object.keys(allDeps(dir)).filter(
      (name) => PACKAGES[name]?.feature === feature
    );

    expect(remaining).toEqual([]);
  });

  it("keeps core packages when a feature is dropped", () => {
    const dir = buildFixture();
    pruneFeatures(dir, ["query", "zod", "motion"]);

    const deps = allDeps(dir);

    expect(deps.next).toBeDefined();
    expect(deps["radix-ui"]).toBeDefined();
    expect(deps.vitest).toBeDefined();
  });

  it("leaves files alone for leaf features", () => {
    const dir = buildFixture();
    pruneFeatures(dir, ["zod", "motion"]);

    expect(existsSync(join(dir, "hooks/use-app-mutation.ts"))).toBe(true);
    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toContain(
      "query flow with useAppMutation"
    );
  });

  describe("without query", () => {
    it("removes the query hooks and their test", () => {
      const dir = buildFixture();
      pruneFeatures(dir, ["query"]);

      for (const path of [
        "hooks/use-app-mutation.ts",
        "hooks/__tests__/use-app-mutation.test.tsx",
        "hooks/users/users.queries.ts",
      ]) {
        expect(existsSync(join(dir, path)), path).toBe(false);
      }
    });

    it("keeps the server actions, which stand on their own", () => {
      const dir = buildFixture();
      pruneFeatures(dir, ["query"]);

      expect(existsSync(join(dir, "hooks/users/users.actions.ts"))).toBe(true);
    });

    it("swaps in a providers tree with no QueryClientProvider", () => {
      const dir = buildFixture();
      pruneFeatures(dir, ["query"]);

      const providers = readFileSync(
        join(dir, "components/layout/providers.tsx"),
        "utf8"
      );

      expect(providers).not.toContain("@tanstack/react-query");
      expect(providers).toContain("ThemeProvider");
      expect(providers).toContain("Toaster");
    });

    it("rewrites the data-access docs so they don't describe missing code", () => {
      const dir = buildFixture();
      pruneFeatures(dir, ["query"]);

      for (const file of [
        "CLAUDE.md",
        ".claude/rules/code-quality.md",
        "README.md",
      ]) {
        const markdown = readFileSync(join(dir, file), "utf8");

        expect(markdown, file).not.toContain("useAppMutation");
        expect(markdown, file).toContain("Shared prose.");
      }
    });
  });
});
