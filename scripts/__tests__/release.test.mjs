// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { nextVersion } from "../release.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("nextVersion", () => {
  it("bumps each part", () => {
    expect(nextVersion("1.2.3", "patch")).toBe("1.2.4");
    expect(nextVersion("1.2.3", "minor")).toBe("1.3.0");
    expect(nextVersion("1.2.3", "major")).toBe("2.0.0");
  });

  it("resets the parts below the one it bumps", () => {
    expect(nextVersion("1.9.9", "major")).toBe("2.0.0");
    expect(nextVersion("1.9.9", "minor")).toBe("1.10.0");
  });

  it("takes an exact version", () => {
    expect(nextVersion("1.2.3", "4.5.6")).toBe("4.5.6");
  });

  it("rejects anything that isn't a bump or a version", () => {
    for (const input of ["", "next", "1.2", "v1.2.3", "1.2.3.4"]) {
      expect(nextVersion("1.2.3", input), input).toBeNull();
    }
  });
});

describe("release wiring", () => {
  it("is reachable as pnpm release", () => {
    const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));

    expect(pkg.scripts.release).toBe("node scripts/release.mjs");
  });

  it("stays out of the published package", () => {
    const manifest = JSON.parse(
      readFileSync(join(REPO, "create", "package.json"), "utf8")
    );

    expect(manifest.files).not.toContain("scripts");
  });
});
