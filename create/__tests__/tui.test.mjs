// @vitest-environment node
import { describe, expect, it } from "vitest";

import { excludedFeatures, FEATURE_IDS, FEATURES } from "../features.mjs";
import { LAYOUTS } from "../layouts.mjs";
import { moveCursor, toggle } from "../tui.mjs";

describe("moveCursor", () => {
  it("steps through the list", () => {
    expect(moveCursor(0, 1, 3)).toBe(1);
    expect(moveCursor(1, -1, 3)).toBe(0);
  });

  it("wraps at both ends", () => {
    expect(moveCursor(2, 1, 3)).toBe(0);
    expect(moveCursor(0, -1, 3)).toBe(2);
  });

  it("stays put in a single-item list", () => {
    expect(moveCursor(0, 1, 1)).toBe(0);
  });
});

describe("toggle", () => {
  it("removes a selected id and adds an unselected one", () => {
    const on = new Set(["query", "zod"]);

    expect([...toggle(on, "query")]).toEqual(["zod"]);
    expect([...toggle(new Set(["zod"]), "query")]).toEqual(["zod", "query"]);
  });

  it("leaves the source set untouched", () => {
    const on = new Set(["query"]);
    toggle(on, "query");

    expect([...on]).toEqual(["query"]);
  });
});

describe("excludedFeatures", () => {
  it("is empty when everything is selected", () => {
    expect(excludedFeatures(new Set(FEATURE_IDS))).toEqual([]);
  });

  it("lists what was turned off, in declaration order", () => {
    expect(excludedFeatures(new Set(["zod"]))).toEqual(["query", "motion"]);
  });

  it("lists everything when nothing is selected", () => {
    expect(excludedFeatures(new Set())).toEqual(FEATURE_IDS);
  });
});

describe("choice data", () => {
  it("gives every layout and feature a label and detail", () => {
    for (const choice of [...LAYOUTS, ...FEATURES]) {
      expect(choice.label, JSON.stringify(choice)).toBeTruthy();
      expect(choice.detail, JSON.stringify(choice)).toBeTruthy();
    }
  });

  it("gives every feature a distinct --no- flag", () => {
    const flags = FEATURES.map((feature) => feature.flag);

    expect(new Set(flags).size).toBe(flags.length);
    for (const flag of flags) expect(flag).toMatch(/^--no-/);
  });
});
