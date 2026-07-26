#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { resolveTemplate } from "./template-source.mjs";
import { rewriteIdentity } from "./transforms/identity.mjs";
import { applyMonorepo } from "./transforms/monorepo.mjs";
import { trimTemplate } from "./transforms/trim.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(HERE, "..");
// A valid npm package name: lowercase, starts alphanumeric, hyphen-separated.
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const USAGE = `Scaffold a new project from the zen-claude-starter template.

Usage: pnpm create-project [name] [parent-dir] [--monorepo] [--yes]

  name         Project name (lowercase letters, digits, hyphens). Prompted if omitted.
  parent-dir   Directory to create the project in. Prompted if omitted.
      --monorepo   Scaffold a Turborepo workspace instead of a single app.
  -y, --yes    Skip the confirmation prompt.
`;

function die(message) {
  process.stderr.write(`[31merror:[0m ${message}\n`);
  process.exit(1);
}

function info(message) {
  process.stdout.write(`[36m${message}[0m\n`);
}

function hasCommand(command) {
  try {
    execFileSync(command, ["--version"], { stdio: "ignore" });

    return true;
  } catch {
    return false;
  }
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

function parseArgs(argv) {
  const positional = [];
  let monorepo = false;
  let skipConfirm = false;

  for (const arg of argv) {
    if (arg === "-y" || arg === "--yes") skipConfirm = true;
    else if (arg === "--monorepo") monorepo = true;
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
    skipConfirm,
  };
}

function expandHome(path) {
  return path.startsWith("~") ? join(homedir(), path.slice(1)) : path;
}

async function main() {
  const {
    name: nameArg,
    parent: parentArg,
    monorepo,
    skipConfirm,
  } = parseArgs(process.argv.slice(2));

  if (!hasCommand("git")) die("git is required");
  if (!existsSync(join(TEMPLATE_DIR, ".git"))) {
    die("must be run from inside the template git repository");
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    let name = nameArg;
    while (!NAME_PATTERN.test(name)) {
      if (name) {
        process.stdout.write(
          "Invalid name. Use lowercase letters, digits, and hyphens.\n"
        );
      }
      name = (
        await rl.question("Project name (lowercase, e.g. my-app): ")
      ).trim();
    }

    const defaultParent = resolve(TEMPLATE_DIR, "..");
    let parent = parentArg;
    if (!parent) {
      const answer = await rl.question(
        `Create in which directory? [${defaultParent}]: `
      );
      parent = answer.trim() || defaultParent;
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

    process.stdout.write("\n");
    info(`Template : ${TEMPLATE_DIR}`);
    info(`New ${monorepo ? "repo" : "app"}  : ${target}`);
    info(
      `Layout   : ${monorepo ? "monorepo (apps/web + packages/*)" : "single app"}`
    );

    if (!skipConfirm) {
      const confirm = (await rl.question("Proceed? [Y/n]: ")).trim() || "Y";
      if (!/^y/i.test(confirm)) {
        process.stdout.write("Aborted.\n");
        process.exit(0);
      }
    }

    rl.close();

    resolveTemplate({ from: "local", templateDir: TEMPLATE_DIR, target });
    rewriteIdentity(target, name);
    trimTemplate(target);
    if (monorepo) applyMonorepo(target, name);

    // Install before the first commit: the monorepo layout invalidates the
    // template's lockfile, and CI installs with --frozen-lockfile.
    if (hasCommand("pnpm")) {
      info("Installing dependencies…");
      run("pnpm", ["install"], target);

      // Moving files across package boundaries changes which import-sort group
      // a specifier belongs to, so hand the result back to the project's own
      // autofix rather than trying to re-sort during the rewrite.
      info("Formatting…");
      try {
        run("pnpm", ["fix"], target);
      } catch {
        process.stderr.write(
          "'pnpm fix' reported problems — run it again in the new project.\n"
        );
      }
    } else {
      process.stdout.write(
        "pnpm not found — skipping install. Run 'pnpm install' in the new project.\n"
      );
    }

    run("git", ["-C", target, "init", "-q"]);
    run("git", ["-C", target, "add", "-A"]);
    // Disable signing for the scaffold commit so a broken or absent signing
    // setup can't block project creation; sign later commits as usual.
    run("git", [
      "-C",
      target,
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-qm",
      "Initial commit",
    ]);

    process.stdout.write("\n");
    info("Done. Next steps:");
    process.stdout.write(`  cd "${target}"\n  pnpm dev\n`);
  } finally {
    rl.close();
  }
}

await main();
