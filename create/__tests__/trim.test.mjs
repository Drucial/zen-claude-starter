// @vitest-environment node
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { trimTemplate } from "../transforms/trim.mjs";

const dirs = [];

const FIXTURE = {
  LICENSE: "MIT License\n\nCopyright (c) 2026 Drew White\n",
  "create/cli.mjs": "// scaffolder\n",
  "scripts/release.mjs": "// release tooling\n",
  "docs/superpowers/specs/design.md": "# design\n",
  "components/home/hero.tsx": "export function Hero() {}\n",
  "components/layout/providers.tsx": "export function Providers() {}\n",
  "app/opengraph-image.tsx": "export default function Og() {}\n",
  "app/sitemap.ts": "export default function sitemap() {}\n",
  "app/robots.ts": "export default function robots() {}\n",
  "app/icon.svg": "<svg />\n",
  "app/apple-icon.tsx": "export default function AppleIcon() {}\n",
  "README.md":
    "# Template\n\n<!-- template-only:start -->\n\nrelease docs\n\n<!-- template-only:end -->\n\nKept.\n",
};

function buildFixture() {
  const dir = mkdtempSync(join(tmpdir(), "zen-trim-"));
  dirs.push(dir);

  for (const [path, contents] of Object.entries(FIXTURE)) {
    const target = join(dir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }

  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

describe("trimTemplate", () => {
  it("removes the template's own licence", () => {
    // Carrying it over puts a third party's copyright on the user's repo, and
    // GitHub labels the project MIT on the strength of the file alone.
    const dir = buildFixture();
    trimTemplate(dir);

    expect(existsSync(join(dir, "LICENSE"))).toBe(false);
  });

  it("removes the scaffolder, its release tooling, and the design docs", () => {
    const dir = buildFixture();
    trimTemplate(dir);

    for (const path of ["create", "scripts", "docs"]) {
      expect(existsSync(join(dir, path)), path).toBe(false);
    }
  });

  it("removes the marketing surface that names the product", () => {
    const dir = buildFixture();
    trimTemplate(dir);

    for (const path of [
      "components/home",
      "app/opengraph-image.tsx",
      "app/sitemap.ts",
      "app/robots.ts",
    ]) {
      expect(existsSync(join(dir, path)), path).toBe(false);
    }
  });

  it("keeps the icons and the app itself", () => {
    const dir = buildFixture();
    trimTemplate(dir);

    for (const path of [
      "app/icon.svg",
      "app/apple-icon.tsx",
      "components/layout/providers.tsx",
    ]) {
      expect(existsSync(join(dir, path)), path).toBe(true);
    }
  });
});
