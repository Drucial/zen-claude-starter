#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { excludedFeatures, FEATURES } from "./features.mjs";
import { LAYOUTS } from "./layouts.mjs";
import { resolveTemplate } from "./template-source.mjs";
import { rewriteIdentity } from "./transforms/identity.mjs";
import { applyMonorepo } from "./transforms/monorepo.mjs";
import { pruneFeatures } from "./transforms/prune-features.mjs";
import { trimTemplate } from "./transforms/trim.mjs";
import {
  accent,
  answered,
  banner,
  bold,
  multiselect,
  muted,
  note,
  select,
  task,
} from "./tui.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(HERE, "..");
// A valid npm package name: lowercase, starts alphanumeric, hyphen-separated.
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const USAGE = `Scaffold a new project from the zen-claude-starter template.

Usage: pnpm create-project [name] [parent-dir] [options]

  name           Project name (lowercase letters, digits, hyphens). Prompted if omitted.
  parent-dir     Directory to create the project in. Prompted if omitted.

  --monorepo     Scaffold a Turborepo workspace. Prompted if omitted.
${FEATURES.map((feature) => `  ${feature.flag.padEnd(14)} Leave out ${feature.label}.`).join("\n")}
  -y, --yes      Skip every prompt and take the defaults.
  -h, --help     Show this message.
`;

function die(message) {
  process.stderr.write(`\n  ${accent("✗")}  ${message}\n\n`);
  process.exit(1);
}

function hasCommand(command) {
  try {
    execFileSync(command, ["--version"], { stdio: "ignore" });

    return true;
  } catch {
    return false;
  }
}

/**
 * Run a command without letting its output trample the prompts. Async on
 * purpose — a synchronous child would block the spinner's frames. Output is
 * buffered and only surfaced when the command fails.
 */
function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";

    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} exited with ${code}\n${output}`));
    });
  });
}

function parseArgs(argv) {
  const positional = [];
  const excluded = new Set();
  let monorepo = false;
  let skipPrompts = false;

  for (const arg of argv) {
    const feature = FEATURES.find((option) => option.flag === arg);

    if (arg === "-y" || arg === "--yes") skipPrompts = true;
    else if (arg === "--monorepo") monorepo = true;
    else if (feature) excluded.add(feature.id);
    else if (arg === "-h" || arg === "--help") {
      process.stdout.write(USAGE);
      process.exit(0);
    } else if (arg.startsWith("-")) die(`unknown option: ${arg}`);
    else positional.push(arg);
  }

  return {
    name: positional[0] ?? "",
    parent: positional[1] ?? "",
    monorepo,
    excluded,
    skipPrompts,
  };
}

function expandHome(path) {
  return path.startsWith("~") ? join(homedir(), path.slice(1)) : path;
}

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function main() {
  const {
    name: nameArg,
    parent: parentArg,
    monorepo: monorepoFlag,
    excluded: excludedFlags,
    skipPrompts,
  } = parseArgs(process.argv.slice(2));

  if (!hasCommand("git")) die("git is required");
  if (!existsSync(join(TEMPLATE_DIR, ".git"))) {
    die("must be run from inside the template git repository");
  }

  // Without a terminal there is nobody to answer a prompt, and a pending
  // question would hang until stdin closed. Take the defaults instead.
  const canPrompt = Boolean(process.stdin.isTTY) && !skipPrompts;

  if (canPrompt) banner();

  let name = nameArg;
  while (!NAME_PATTERN.test(name)) {
    if (!canPrompt) die("a project name is required (see --help)");
    if (name) {
      process.stdout.write(
        `  ${muted("Use lowercase letters, digits, and hyphens.")}\n`
      );
    }
    name = await ask(`  ${bold("Project name")} ${muted("›")} `);
  }
  if (canPrompt) answered("name", name);

  // A flag answers its prompt outright.
  const monorepo = monorepoFlag
    ? true
    : canPrompt && (await select("Layout", LAYOUTS)).monorepo;
  if (canPrompt) {
    answered("layout", monorepo ? "monorepo" : "single app");
  }

  const excluded =
    canPrompt && excludedFlags.size === 0
      ? excludedFeatures(await multiselect("Include", FEATURES))
      : [...excludedFlags];
  if (canPrompt) {
    answered(
      "include",
      excluded.length === 0
        ? "everything"
        : muted(`without ${excluded.join(", ")}`)
    );
  }

  const defaultParent = resolve(TEMPLATE_DIR, "..");
  let parent = parentArg;
  if (!parent) {
    const answer = canPrompt
      ? await ask(`  ${bold("Location")} ${muted(`› ${defaultParent}`)} `)
      : "";
    parent = answer || defaultParent;
  }

  parent = expandHome(parent);
  try {
    mkdirSync(parent, { recursive: true });
  } catch {
    die(`cannot create parent directory: ${parent}`);
  }
  parent = resolve(parent);

  const target = join(parent, name);
  if (existsSync(target)) die(`destination already exists: ${target}`);

  if (canPrompt) {
    process.stdout.write("\n");
    note("creating", target);
    const confirm = await ask(`  ${bold("Proceed?")} ${muted("› Y/n")} `);
    if (confirm && !/^y/i.test(confirm)) {
      process.stdout.write(`\n  ${muted("Nothing created.")}\n\n`);
      process.exit(0);
    }
  }

  process.stdout.write("\n");

  await task("building the project", async () => {
    resolveTemplate({ from: "local", templateDir: TEMPLATE_DIR, target });
    rewriteIdentity(target, name);
    trimTemplate(target);
    pruneFeatures(target, excluded);
    if (monorepo) applyMonorepo(target, name);
  });

  // Install before the first commit: the monorepo layout invalidates the
  // template's lockfile, and CI installs with --frozen-lockfile.
  if (hasCommand("pnpm")) {
    await task("installing dependencies", () =>
      run("pnpm", ["install"], target)
    );

    // Moving files across package boundaries changes which import-sort group a
    // specifier belongs to, so hand the result to the project's own autofix
    // rather than re-sorting during the rewrite.
    try {
      await task("formatting", () => run("pnpm", ["fix"], target));
    } catch {
      process.stderr.write(
        `  ${muted("'pnpm fix' reported problems — run it again in the new project.")}\n`
      );
    }
  } else {
    process.stdout.write(
      `  ${muted("pnpm not found — run 'pnpm install' in the new project.")}\n`
    );
  }

  await task("starting git history", async () => {
    await run("git", ["-C", target, "init", "-q"]);
    await run("git", ["-C", target, "add", "-A"]);
    // Disable signing for the scaffold commit so a broken or absent signing
    // setup can't block project creation; sign later commits as usual.
    await run("git", [
      "-C",
      target,
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-qm",
      "Initial commit",
    ]);
  });

  process.stdout.write(
    `\n  ${accent("◐")}  ${bold(name)} ${muted("is ready")}\n\n`
  );
  note("cd", target.replace(homedir(), "~"));
  note("then", "pnpm dev");
  process.stdout.write("\n");
}

try {
  await main();
} catch (error) {
  if (error.message === "cancelled") {
    process.stdout.write(`\n\n  ${muted("Cancelled.")}\n\n`);
    process.exit(130);
  }
  throw error;
}
