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
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { applyMonorepo } from "../transforms/monorepo.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const MARKED_DOC = [
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
  "Shared prose that both layouts keep.",
  "",
].join("\n");

const FIXTURE_FILES = {
  "app/globals.css":
    '@import "tailwindcss";\n@import "tw-animate-css";\n\n:root {\n  --radius: 0.5rem;\n}\n',
  "app/layout.tsx":
    'import "./globals.css";\n\nimport { Providers } from "@/components/layout/providers";\n',
  "app/page.tsx": "export default function Home() {\n  return null;\n}\n",
  "components/ui/button.tsx": 'import { cn } from "@/utils/cn";\n',
  "components/ui/sonner.tsx": 'import { Toaster } from "sonner";\n',
  "components/layout/mode-toggle.tsx":
    'import { Button } from "@/components/ui/button";\n',
  "hooks/use-app-mutation.ts": 'import { toast } from "sonner";\n',
  "utils/cn.ts": "export function cn() {}\n",
  "public/next.svg": "<svg />\n",
  "postcss.config.mjs": "export default {};\n",
  "vitest.setup.ts": 'import "@testing-library/jest-dom/vitest";\n',
  "next.config.ts": "export default {};\n",
  "vitest.config.ts": "export default {};\n",
  "components.json": "{}\n",
  "tsconfig.json": "{}\n",
  "eslint.config.mjs": "export default [];\n",
  "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
  "pnpm-workspace.yaml": "ignoredBuiltDependencies:\n  - sharp\n",
  "CLAUDE.md": MARKED_DOC,
  ".claude/rules/code-quality.md": MARKED_DOC,
  "README.md": MARKED_DOC,
};

function buildFixture() {
  const dir = mkdtempSync(join(tmpdir(), "zen-monorepo-"));

  for (const [path, contents] of Object.entries(FIXTURE_FILES)) {
    const target = join(dir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }

  // The real package.json keeps the fixture honest about dependency placement.
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ ...pkg, name: "my-app" }, null, 2)}\n`
  );

  return dir;
}

function readJson(dir, path) {
  return JSON.parse(readFileSync(join(dir, path), "utf8"));
}

describe("applyMonorepo", () => {
  let dir;

  beforeAll(() => {
    dir = buildFixture();
    applyMonorepo(dir, "my-app");
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("moves the app into apps/web", () => {
    expect(existsSync(join(dir, "apps/web/app/layout.tsx"))).toBe(true);
    expect(
      existsSync(join(dir, "apps/web/components/layout/mode-toggle.tsx"))
    ).toBe(true);
    expect(existsSync(join(dir, "apps/web/hooks/use-app-mutation.ts"))).toBe(
      true
    );
    expect(existsSync(join(dir, "apps/web/public/next.svg"))).toBe(true);
  });

  it("moves the primitives, cn, and the theme into packages/ui", () => {
    expect(existsSync(join(dir, "packages/ui/components/button.tsx"))).toBe(
      true
    );
    expect(existsSync(join(dir, "packages/ui/utils/cn.ts"))).toBe(true);
    expect(existsSync(join(dir, "packages/ui/styles/globals.css"))).toBe(true);
  });

  it("leaves no app directories behind at the root", () => {
    for (const path of ["app", "components", "utils", "hooks", "public"]) {
      expect(existsSync(join(dir, path)), path).toBe(false);
    }
  });

  it("drops the single-app lockfile so pnpm regenerates it for the workspace", () => {
    expect(existsSync(join(dir, "pnpm-lock.yaml"))).toBe(false);
  });

  it("rewrites imports across the package boundary", () => {
    const modeToggle = readFileSync(
      join(dir, "apps/web/components/layout/mode-toggle.tsx"),
      "utf8"
    );
    const button = readFileSync(
      join(dir, "packages/ui/components/button.tsx"),
      "utf8"
    );
    const layout = readFileSync(join(dir, "apps/web/app/layout.tsx"), "utf8");

    expect(modeToggle).toContain('"@repo/ui/components/button"');
    expect(button).toContain('"@repo/ui/utils/cn"');
    expect(layout).toContain('"@repo/ui/styles/globals.css"');
  });

  it("keeps app-local aliases untouched", () => {
    const layout = readFileSync(join(dir, "apps/web/app/layout.tsx"), "utf8");

    expect(layout).toContain('"@/components/layout/providers"');
  });

  it("tells Tailwind to scan the package and every app", () => {
    const css = readFileSync(
      join(dir, "packages/ui/styles/globals.css"),
      "utf8"
    );
    const [firstSource] = css
      .split("\n")
      .filter((line) => line.startsWith("@source"));

    expect(css.indexOf("@import")).toBeLessThan(css.indexOf("@source"));
    expect(firstSource).toBe('@source "../components";');
    expect(css).toContain('@source "../../../apps/*/app";');
  });

  it("delegates root scripts to turbo while keeping their names", () => {
    const root = readJson(dir, "package.json");

    expect(root.name).toBe("my-app");
    expect(root.scripts.build).toBe("turbo run build");
    expect(root.scripts.check).toBe(
      "pnpm format:check && pnpm lint && pnpm typecheck"
    );
    expect(root.devDependencies.turbo).toBeDefined();
  });

  it("links apps/web to the workspace packages", () => {
    const web = readJson(dir, "apps/web/package.json");

    expect(web.dependencies["@repo/ui"]).toBe("workspace:*");
    expect(web.devDependencies["@repo/eslint-config"]).toBe("workspace:*");
    expect(web.dependencies.next).toBeDefined();
  });

  it("exports the ui package's components, utils, and styles", () => {
    const ui = readJson(dir, "packages/ui/package.json");

    expect(ui.name).toBe("@repo/ui");
    expect(ui.exports["./components/*"]).toBe("./components/*.tsx");
    expect(ui.dependencies["radix-ui"]).toBeDefined();
  });

  it("makes the eslint plugins real dependencies of the config package", () => {
    const config = readJson(dir, "packages/eslint-config/package.json");

    expect(config.dependencies["eslint-plugin-react"]).toBeDefined();
    expect(config.devDependencies).toBeUndefined();
  });

  it("declares the workspace globs without losing existing settings", () => {
    const workspace = readFileSync(join(dir, "pnpm-workspace.yaml"), "utf8");

    expect(workspace).toContain('- "apps/*"');
    expect(workspace).toContain('- "packages/*"');
    expect(workspace).toContain("ignoredBuiltDependencies");
  });

  it("ignores dependencies and build output inside every package", () => {
    const lines = readFileSync(join(dir, ".gitignore"), "utf8").split("\n");

    // Root-anchored patterns would leave apps/web/node_modules and
    // packages/*/node_modules tracked, committing them on scaffold.
    expect(lines.filter((line) => line.startsWith("/"))).toEqual([]);
    expect(lines).toContain("node_modules");
    expect(lines).toContain(".next/");
    expect(lines).toContain(".turbo");
  });

  it("swaps the layout docs without touching the shared prose", () => {
    for (const file of [
      "CLAUDE.md",
      ".claude/rules/code-quality.md",
      "README.md",
    ]) {
      const markdown = readFileSync(join(dir, file), "utf8");

      expect(markdown, file).not.toContain("single-app layout");
      expect(markdown, file).toContain("Shared prose that both layouts keep.");
      expect(markdown, file).toMatch(/packages\/ui|@repo\/ui/);
    }
  });

  it("copies the workspace-aware config templates over the single-app ones", () => {
    expect(existsSync(join(dir, "turbo.json"))).toBe(true);
    expect(
      readFileSync(join(dir, "apps/web/next.config.ts"), "utf8")
    ).toContain("transpilePackages");
    expect(
      readFileSync(join(dir, "apps/web/eslint.config.mjs"), "utf8")
    ).toContain("@repo/eslint-config/next");
  });
});
