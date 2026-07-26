import { emitKeypressEvents } from "node:readline";

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

export function banner() {
  write(
    `\n  ${accent("◐")}  ${bold("zen")}\n     ${muted("a calm foundation for your next app")}\n\n`
  );
}

export function note(label, value) {
  write(`  ${muted(label.padEnd(10))} ${value}\n`);
}

export function answered(label, value) {
  write(`  ${accent("✓")}  ${muted(label.padEnd(10))} ${value}\n`);
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

const pad = (choices) =>
  Math.max(...choices.map((choice) => choice.label.length)) + 2;

/**
 * Draw a block of lines, redrawing in place as the selection changes. Keys are
 * read in raw mode, so the caller must only reach here with a real terminal.
 */
async function keyLoop({ render, onKey }) {
  emitKeypressEvents(process.stdin);
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
      onKeypress = (_input, key) => {
        if (!key) return;

        if (key.ctrl && key.name === "c") {
          reject(new Error("cancelled"));

          return;
        }

        if (onKey(key)) {
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
    write(`${CSI}?25h`);
    // Collapse the block; the caller prints the chosen answer in its place.
    if (height) write(`${CSI}${height}A${CSI}0J`);
  }
}

export async function select(label, choices) {
  const width = pad(choices);
  let cursor = 0;

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
    `  ${muted("↑↓ move · enter select")}`,
  ];

  await keyLoop({
    render,
    onKey: (key) => {
      if (key.name === "up" || key.name === "k") {
        cursor = moveCursor(cursor, -1, choices.length);
      } else if (key.name === "down" || key.name === "j") {
        cursor = moveCursor(cursor, 1, choices.length);
      } else if (key.name === "return") {
        return true;
      }

      return false;
    },
  });

  return choices[cursor];
}

export async function multiselect(label, choices) {
  const width = pad(choices);
  let selected = new Set(choices.map((choice) => choice.id));
  let cursor = 0;

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
    `  ${muted("↑↓ move · space toggle · enter confirm")}`,
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
      } else if (key.name === "return") {
        return true;
      }

      return false;
    },
  });

  return selected;
}
