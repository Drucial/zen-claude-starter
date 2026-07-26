// @vitest-environment node
import { describe, expect, it } from "vitest";

import { BACK, previousStep, runWizard } from "../wizard.mjs";

/** A step that returns each scripted answer in turn and records that it ran. */
function scripted(key, answers, log, options = {}) {
  const queue = [...answers];

  return {
    key,
    ...options,
    run: () => {
      log.push(key);

      return Promise.resolve(queue.shift());
    },
  };
}

describe("previousStep", () => {
  const steps = [{ key: "a" }, { key: "b", skip: () => true }, { key: "c" }];

  it("finds the nearest earlier answerable step", () => {
    expect(previousStep(steps, 2, {})).toBe(0);
  });

  it("returns null from the first step", () => {
    expect(previousStep(steps, 0, {})).toBeNull();
  });

  it("skips over steps the flags already answered", () => {
    expect(previousStep(steps, 2, {})).not.toBe(1);
  });
});

describe("runWizard", () => {
  it("collects an answer from each step in order", async () => {
    const log = [];
    const values = await runWizard([
      scripted("a", ["one"], log),
      scripted("b", ["two"], log),
    ]);

    expect(values).toEqual({ a: "one", b: "two" });
    expect(log).toEqual(["a", "b"]);
  });

  it("passes over steps whose answer came from a flag", async () => {
    const log = [];
    const values = await runWizard(
      [
        scripted("a", ["one"], log, { skip: () => true }),
        scripted("b", ["two"], log),
      ],
      { values: { a: "from-flag" } }
    );

    expect(values.a).toBe("from-flag");
    expect(log).toEqual(["b"]);
  });

  it("re-asks the previous step on BACK", async () => {
    const log = [];
    const values = await runWizard([
      scripted("a", ["first", "second"], log),
      scripted("b", [BACK, "two"], log),
    ]);

    expect(log).toEqual(["a", "b", "a", "b"]);
    expect(values).toEqual({ a: "second", b: "two" });
  });

  it("discards the answer of the step it returns to, and everything after", async () => {
    const seen = [];
    let visits = 0;
    const values = await runWizard([
      scripted("a", ["one"], []),
      {
        key: "b",
        run: (current) => {
          // On the retry, b's own stale answer and c's must both be gone.
          seen.push({ ...current });

          return Promise.resolve(seen.length === 1 ? "two" : "two-again");
        },
      },
      {
        key: "c",
        run: () => Promise.resolve(++visits === 1 ? BACK : "three"),
      },
    ]);

    expect(seen[0]).toEqual({ a: "one" });
    expect(seen[1]).toEqual({ a: "one" });
    expect(values).toEqual({ a: "one", b: "two-again", c: "three" });
  });

  it("stays put when the first step asks to go back", async () => {
    const log = [];
    const values = await runWizard([scripted("a", [BACK, "one"], log)]);

    expect(log).toEqual(["a", "a"]);
    expect(values).toEqual({ a: "one" });
  });

  it("skips back over flag-answered steps", async () => {
    const log = [];
    await runWizard([
      scripted("a", ["one", "one-again"], log),
      scripted("b", [], log, { skip: () => true }),
      scripted("c", [BACK, "three"], log),
    ]);

    expect(log).toEqual(["a", "c", "a", "c"]);
  });

  it("keeps a flag-supplied answer that sits after the step it went back to", async () => {
    let visits = 0;
    const values = await runWizard(
      [
        scripted("a", ["one", "one-again"], []),
        { key: "b", skip: () => true, run: () => Promise.resolve("never") },
        {
          key: "c",
          run: () => Promise.resolve(++visits === 1 ? BACK : "three"),
        },
      ],
      { values: { b: "from-flag" } }
    );

    expect(values.b).toBe("from-flag");
  });

  it("tells the first answerable step it has nowhere to go back to", async () => {
    const offers = [];
    const record = (key) => ({
      key,
      run: (_values, options) => {
        offers.push([key, options.canGoBack]);

        return Promise.resolve(key);
      },
    });

    await runWizard([
      { key: "flagged", skip: () => true, run: () => Promise.resolve("x") },
      record("first"),
      record("second"),
    ]);

    expect(offers).toEqual([
      ["first", false],
      ["second", true],
    ]);
  });

  it("reports progress before each step and once at the end", async () => {
    const snapshots = [];
    await runWizard([scripted("a", ["one"], []), scripted("b", ["two"], [])], {
      onStep: (values) => snapshots.push({ ...values }),
    });

    expect(snapshots).toEqual([{}, { a: "one" }, { a: "one", b: "two" }]);
  });
});
