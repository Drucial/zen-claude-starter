#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import { excludedFeatures, FEATURES } from "./features.mjs";
import { LAYOUTS } from "./layouts.mjs";
import {
  findLocalTemplate,
  resolveTemplate,
  TEMPLATE_REF,
} from "./template-source.mjs";
import { rewriteIdentity } from "./transforms/identity.mjs";
import { finalizeDocs } from "./transforms/markdown-blocks.mjs";
import { applyMonorepo } from "./transforms/monorepo.mjs";
import { pruneFeatures } from "./transforms/prune-features.mjs";
import { trimTemplate } from "./transforms/trim.mjs";
import {
  accent,
  banner,
  bold,
  CancelError,
  multiselect,
  muted,
  note,
  renderAnswers,
  select,
  task,
  text,
} from "./tui.mjs";
import { BACK, runWizard } from "./wizard.mjs";

// Null when installed from npm: there is no checkout, so the template is
// downloaded instead.
const LOCAL_TEMPLATE = findLocalTemplate();
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

const CONFIRM = [
  { id: "create", label: "Create it", detail: "Scaffold and install" },
  {
    id: "back",
    label: "Change something",
    detail: "Step back through the answers",
  },
];

function describeExcluded(excluded) {
  return excluded.length === 0
    ? "everything"
    : `without ${excluded.join(", ")}`;
}

/**
 * The questions, in order. `skip` removes the ones already answered on the
 * command line, which also keeps "back" from landing on a question the user
 * never saw.
 */
function buildSteps({
  nameArg,
  parentArg,
  monorepoFlag,
  excludedFlags,
  defaultParent,
}) {
  return [
    {
      key: "name",
      skip: () => NAME_PATTERN.test(nameArg),
      run: (values, options) =>
        text("Project name", {
          ...options,
          initial: values.name ?? "",
          validate: (value) =>
            NAME_PATTERN.test(value)
              ? ""
              : "Lowercase letters, digits, and hyphens; must start with a letter or digit.",
        }),
    },
    {
      key: "monorepo",
      skip: () => monorepoFlag,
      run: async (_values, options) => {
        const choice = await select("Layout", LAYOUTS, options);

        return choice === BACK ? BACK : choice.monorepo;
      },
    },
    {
      key: "excluded",
      skip: () => excludedFlags.size > 0,
      run: async (_values, options) => {
        const selected = await multiselect("Include", FEATURES, options);

        return selected === BACK ? BACK : excludedFeatures(selected);
      },
    },
    {
      key: "parent",
      skip: () => Boolean(parentArg),
      run: (values, options) =>
        text("Location", {
          ...options,
          initial: values.parent ?? defaultParent,
        }),
    },
    {
      key: "confirmed",
      run: async (values, options) => {
        const target = join(expandHome(values.parent ?? ""), values.name ?? "");
        const choice = await select(`Create ${target}?`, CONFIRM, options);

        return choice === BACK || choice.id === "back" ? BACK : true;
      },
    },
  ];
}

function summarise(values, steps) {
  const rows = [];

  for (const step of steps) {
    if (!(step.key in values)) continue;
    if (step.key === "name") rows.push(["name", values.name]);
    if (step.key === "monorepo") {
      rows.push(["layout", values.monorepo ? "monorepo" : "single app"]);
    }
    if (step.key === "excluded") {
      rows.push(["include", describeExcluded(values.excluded)]);
    }
    if (step.key === "parent") rows.push(["location", values.parent]);
  }

  return rows;
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

  // Without a terminal there is nobody to answer a prompt, and a pending
  // question would hang until stdin closed. Take the defaults instead.
  const canPrompt = Boolean(process.stdin.isTTY) && !skipPrompts;
  // Inside the checkout, siblings of the template. Otherwise, right here.
  const defaultParent = LOCAL_TEMPLATE
    ? resolve(LOCAL_TEMPLATE, "..")
    : process.cwd();

  if (!canPrompt && !NAME_PATTERN.test(nameArg)) {
    die("a project name is required (see --help)");
  }

  const answers = {};
  if (NAME_PATTERN.test(nameArg)) answers.name = nameArg;
  if (monorepoFlag) answers.monorepo = true;
  if (excludedFlags.size > 0) answers.excluded = [...excludedFlags];
  if (parentArg) answers.parent = parentArg;

  if (canPrompt) {
    banner();

    const steps = buildSteps({
      nameArg,
      parentArg,
      monorepoFlag,
      excludedFlags,
      defaultParent,
    });

    await runWizard(steps, {
      values: answers,
      onStep: (values) => renderAnswers(summarise(values, steps)),
    });
  }

  const name = answers.name;
  const monorepo = answers.monorepo ?? false;
  const excluded = answers.excluded ?? [];
  const parent = expandHome(answers.parent ?? defaultParent);

  try {
    mkdirSync(parent, { recursive: true });
  } catch {
    die(`cannot create parent directory: ${parent}`);
  }

  const target = join(resolve(parent), name);
  if (existsSync(target)) die(`destination already exists: ${target}`);

  process.stdout.write("\n");

  await task(
    LOCAL_TEMPLATE ? "building the project" : `fetching ${TEMPLATE_REF}`,
    async () => {
      await resolveTemplate({ templateDir: LOCAL_TEMPLATE, target });
    }
  );

  await task("building the project", async () => {
    rewriteIdentity(target, name);
    trimTemplate(target);
    pruneFeatures(target, excluded);
    if (monorepo) applyMonorepo(target, name);
    // Last: every swap is done, so the markers have nothing left to mark.
    finalizeDocs(target);
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

function cancel() {
  process.stdout.write(
    `\n  ${muted("Cancelled — nothing was installed.")}\n\n`
  );
  process.exit(130);
}

// Raw mode swallows Ctrl+C, so prompts raise CancelError themselves. Outside a
// prompt — during install, say — the signal arrives normally.
process.on("SIGINT", cancel);

try {
  await main();
} catch (error) {
  if (error instanceof CancelError) cancel();

  // A stack trace is noise for the person running a scaffolder. Keep it behind
  // a flag rather than dumping it over the prompts.
  if (process.env.ZEN_DEBUG) throw error;
  die(error.message);
}
