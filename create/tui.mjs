import { emitKeypressEvents } from "node:readline";

import { BACK } from "./wizard.mjs";

/** Thrown when the user interrupts a prompt, so callers can exit quietly. */
export class CancelError extends Error {
  constructor() {
    super("cancelled");
    this.name = "CancelError";
  }
}

const CSI = "[";

const CODES = {
  reset: `${CSI}0m`,
  bold: `${CSI}1m`,
  accent: `${CSI}38;5;115m`,
  muted: `${CSI}38;5;245m`,
};

// Honour the NO_COLOR convention, and never emit escapes into a pipe.
const shouldUseColor = () =>
  Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function paint(code, text) {
  return shouldUseColor() ? `${code}${text}${CODES.reset}` : text;
}

export const accent = (text) => paint(CODES.accent, text);
export const muted = (text) => paint(CODES.muted, text);
export const bold = (text) => paint(CODES.bold, text);

const write = (text) => process.stdout.write(text);

const SHOW_CURSOR = `${CSI}?25h`;

// Raw mode hides the cursor while a prompt is drawing. However the process
// ends — clean exit, interrupt, or crash — it has to come back.
process.on("exit", () => {
  if (process.stdout.isTTY) write(SHOW_CURSOR);
});

export function banner() {
  write(
    `\n  ${accent("◐")}  ${bold("zen")}${muted("start")}\n     ${muted("a calm foundation for your next app")}\n\n`
  );
}

export function note(label, value) {
  write(`  ${muted(label.padEnd(10))} ${value}\n`);
}

let answersHeight = 0;

/**
 * Reprint the block of settled answers, replacing whatever is already there.
 * Stepping back drops entries, so the block has to be rewritten rather than
 * appended to.
 */
export function renderAnswers(answers) {
  if (answersHeight) write(`${CSI}${answersHeight}A${CSI}0J`);

  for (const [label, value] of answers) {
    write(`  ${accent("✓")}  ${muted(label.padEnd(10))} ${value}\n`);
  }

  answersHeight = answers.length;
}

const SPINNER = ["◐", "◓", "◑", "◒"];

/**
 * Run work behind a spinner, collapsing to a single line when it settles. The
 * work must be genuinely async — a synchronous child process would block the
 * event loop and freeze the frames.
 */
export async function task(label, work) {
  const quiet = !process.stdout.isTTY;
  let frame = 0;
  const tick = () =>
    write(`\r  ${accent(SPINNER[frame++ % SPINNER.length])}  ${muted(label)}`);

  if (quiet) write(`  ${label}\n`);
  else tick();

  const timer = quiet ? null : setInterval(tick, 120);
  const settle = (mark) => {
    if (timer) clearInterval(timer);
    if (!quiet) write(`\r${CSI}0K  ${accent(mark)}  ${muted(label)}\n`);
  };

  try {
    const result = await work();
    settle("✓");

    return result;
  } catch (error) {
    settle("✗");
    throw error;
  }
}

export function moveCursor(cursor, delta, length) {
  return (cursor + delta + length) % length;
}

export function toggle(selected, id) {
  const next = new Set(selected);

  if (!next.delete(id)) next.add(id);

  return next;
}

const hint = (keys, canGoBack, back = "← back") =>
  canGoBack ? `${keys} · ${back}` : keys;

const isBack = (key) => key.name === "escape" || key.name === "left";

const pad = (choices) =>
  Math.max(...choices.map((choice) => choice.label.length)) + 2;

/**
 * Draw a block of lines, redrawing in place as the selection changes. Keys are
 * read in raw mode, so the caller must only reach here with a real terminal.
 */
async function keyLoop({ render, onKey }) {
  // Node waits half a second on a lone escape to see whether an arrow-key
  // sequence follows. That delay is the whole feel of "go back", so shorten it
  // to the point where a split sequence is still unlikely.
  emitKeypressEvents(process.stdin, { escapeCodeTimeout: 50 });
  const wasRaw = Boolean(process.stdin.isRaw);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  write(`${CSI}?25l`);

  let height = 0;
  const draw = () => {
    if (height) write(`${CSI}${height}A${CSI}0J`);
    const lines = render();
    write(`${lines.join("\n")}\n`);
    height = lines.length;
  };

  let onKeypress;

  try {
    draw();
    await new Promise((resolve, reject) => {
      onKeypress = (input, key) => {
        if (!key) return;

        if (key.ctrl && key.name === "c") {
          reject(new CancelError());

          return;
        }

        if (onKey(key, input)) {
          resolve();

          return;
        }

        draw();
      };
      process.stdin.on("keypress", onKeypress);
    });
  } finally {
    if (onKeypress) process.stdin.off("keypress", onKeypress);
    process.stdin.setRawMode(wasRaw);
    process.stdin.pause();
    write(SHOW_CURSOR);
    // Collapse the block; the caller prints the chosen answer in its place.
    if (height) write(`${CSI}${height}A${CSI}0J`);
  }
}

export async function select(label, choices, { canGoBack = false } = {}) {
  const width = pad(choices);
  let cursor = 0;
  let back = false;

  const render = () => [
    `  ${bold(label)}`,
    "",
    ...choices.map((choice, index) => {
      const active = index === cursor;
      const marker = active ? accent("●") : muted("○");
      const name = active
        ? accent(choice.label.padEnd(width))
        : choice.label.padEnd(width);

      return `  ${marker}  ${name}${muted(choice.detail)}`;
    }),
    "",
    `  ${muted(hint("↑↓ move · enter select", canGoBack))}`,
  ];

  await keyLoop({
    render,
    onKey: (key) => {
      if (key.name === "up" || key.name === "k") {
        cursor = moveCursor(cursor, -1, choices.length);
      } else if (key.name === "down" || key.name === "j") {
        cursor = moveCursor(cursor, 1, choices.length);
      } else if (canGoBack && isBack(key)) {
        back = true;

        return true;
      } else if (key.name === "return") {
        return true;
      }

      return false;
    },
  });

  return back ? BACK : choices[cursor];
}

export async function multiselect(label, choices, { canGoBack = false } = {}) {
  const width = pad(choices);
  let selected = new Set(choices.map((choice) => choice.id));
  let cursor = 0;
  let back = false;

  const render = () => [
    `  ${bold(label)}`,
    "",
    ...choices.map((choice, index) => {
      const active = index === cursor;
      const on = selected.has(choice.id);
      const box = on ? accent("◼") : muted("◻");
      const name = active
        ? accent(choice.label.padEnd(width))
        : choice.label.padEnd(width);

      return `  ${box}  ${name}${muted(choice.detail)}`;
    }),
    "",
    `  ${muted(hint("↑↓ move · space toggle · enter confirm", canGoBack))}`,
  ];

  await keyLoop({
    render,
    onKey: (key) => {
      if (key.name === "up" || key.name === "k") {
        cursor = moveCursor(cursor, -1, choices.length);
      } else if (key.name === "down" || key.name === "j") {
        cursor = moveCursor(cursor, 1, choices.length);
      } else if (key.name === "space") {
        selected = toggle(selected, choices[cursor].id);
      } else if (canGoBack && isBack(key)) {
        back = true;

        return true;
      } else if (key.name === "return") {
        return true;
      }

      return false;
    },
  });

  return back ? BACK : selected;
}

/**
 * A single-line text field. Written in raw mode rather than with readline so
 * that escape means "go back" here exactly as it does in the selectors.
 */
export async function text(
  label,
  { initial = "", validate, canGoBack = false } = {}
) {
  let value = initial;
  let problem = "";
  let back = false;

  const render = () => [
    `  ${bold(label)} ${muted("›")} ${value}${accent("█")}`,
    problem ? `  ${muted(problem)}` : "",
    `  ${muted(hint("enter confirm", canGoBack, "esc back"))}`,
  ];

  await keyLoop({
    render,
    onKey: (key, input) => {
      if (canGoBack && key.name === "escape") {
        back = true;

        return true;
      }

      if (key.name === "return") {
        problem = validate?.(value) ?? "";

        return !problem;
      }

      if (key.name === "backspace") value = value.slice(0, -1);
      else if (input && !key.ctrl && !key.meta && input >= " ") value += input;

      return false;
    },
  });

  return back ? BACK : value;
}
