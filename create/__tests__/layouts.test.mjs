// @vitest-environment node
import { describe, expect, it } from "vitest";

import { LAYOUTS, selectLayout } from "../layouts.mjs";

describe("selectLayout", () => {
  it("defaults to the single app on an empty answer", () => {
    expect(selectLayout("").monorepo).toBe(false);
    expect(selectLayout("  ").monorepo).toBe(false);
  });

  it("maps the listed numbers to their layouts", () => {
    expect(selectLayout("1").monorepo).toBe(false);
    expect(selectLayout("2").monorepo).toBe(true);
  });

  it("tolerates surrounding whitespace", () => {
    expect(selectLayout(" 2 ").monorepo).toBe(true);
  });

  it("rejects answers outside the list", () => {
    for (const answer of ["0", "3", "-1"]) {
      expect(selectLayout(answer), answer).toBeUndefined();
    }
  });

  it("rejects answers that aren't whole numbers", () => {
    for (const answer of ["abc", "1.5", "two", "1x"]) {
      expect(selectLayout(answer), answer).toBeUndefined();
    }
  });

  it("lists exactly one monorepo option", () => {
    expect(LAYOUTS.filter((layout) => layout.monorepo)).toHaveLength(1);
  });
});
