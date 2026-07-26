#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(REPO, "create", "package.json");
const RELEASE_BRANCH = "main";

const USAGE = `Cut a release of the zen-claude-starter scaffolder.

Usage: pnpm release <patch|minor|major|x.y.z> [--dry-run] [--skip-smoke]

The published package downloads the template from the git tag it was cut
from, so the version and the tag have to move together. This does that,
verifies the result actually scaffolds, then tags and publishes.
`;

const say = (message) => process.stdout.write(`${message}\n`);
const step = (message) => say(`\n[1m${message}[0m`);

function die(message) {
  process.stderr.write(`\n[31merror:[0m ${message}\n\n`);
  process.exit(1);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: REPO,
    encoding: "utf8",
    ...options,
  })?.trim();
}

function loud(command, args, options = {}) {
  execFileSync(command, args, { cwd: REPO, stdio: "inherit", ...options });
}

export function nextVersion(current, bump) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;

  const [major, minor, patch] = current.split(".").map(Number);

  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  if (bump === "patch") return `${major}.${minor}.${patch + 1}`;

  return null;
}

function preflight(tag) {
  step("Checking the working tree");

  if (run("git", ["status", "--porcelain"])) {
    die("working tree is dirty — commit or stash first");
  }

  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch !== RELEASE_BRANCH) {
    die(`on ${branch}, but releases are cut from ${RELEASE_BRANCH}`);
  }

  run("git", ["fetch", "--tags", "--quiet"]);

  const behind = run("git", [
    "rev-list",
    "--count",
    `HEAD..origin/${RELEASE_BRANCH}`,
  ]);
  if (behind !== "0") {
    die(`${behind} commit(s) behind origin/${RELEASE_BRANCH} — pull first`);
  }

  const tags = run("git", ["tag", "--list", tag]);
  if (tags) die(`${tag} already exists`);

  // Check this before doing anything: the tag is pushed before the package is
  // published, so an auth failure at the publish step strands the release with
  // its tag already public and nothing on the registry to match it.
  try {
    run("npm", ["whoami"], { stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    die("not logged in to npm — run `npm login` first");
  }

  say("  clean, on main, up to date, tag is free, npm is authenticated");
}

function verify() {
  step("Running check and tests");
  loud("pnpm", ["check"]);
  loud("pnpm", ["test:run"]);
}

/**
 * The scaffolder's output is the actual product, so a release that passes its
 * own tests but emits a project that doesn't build is the failure worth
 * catching. Runs against the working copy, which is what the tag will hold.
 */
function smokeTest() {
  step("Scaffolding a throwaway project");
  const parent = mkdtempSync(join(tmpdir(), "zen-release-"));

  try {
    for (const flags of [[], ["--monorepo"]]) {
      const name = flags.length ? "smoke-monorepo" : "smoke-single";
      loud("node", [join(REPO, "create", "cli.mjs"), name, parent, ...flags], {
        stdio: ["ignore", "ignore", "inherit"],
      });

      const project = join(parent, name);
      loud("pnpm", ["check"], {
        cwd: project,
        stdio: ["ignore", "ignore", "inherit"],
      });
      loud("pnpm", ["test:run"], {
        cwd: project,
        stdio: ["ignore", "ignore", "inherit"],
      });
      loud("pnpm", ["build"], {
        cwd: project,
        stdio: ["ignore", "ignore", "inherit"],
      });
      say(`  ${name} scaffolds, checks, tests and builds`);
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
}

function bump(version, tag) {
  step(`Setting version to ${version}`);
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

  manifest.version = version;
  manifest.zen = { ...manifest.zen, templateRef: tag };
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  run("git", ["add", MANIFEST]);

  // The first release cuts the version the manifest already carries, so there
  // is nothing to commit and `git commit` would exit 1 — tag the commit that
  // is already there instead of failing before the tag exists.
  const committed = Boolean(run("git", ["diff", "--cached", "--name-only"]));

  if (committed) {
    run("git", ["commit", "-m", `Release ${tag}`]);
    say(`  committed and tagged ${tag}`);
  } else {
    say(`  already at ${version} — tagging the current commit`);
  }

  run("git", ["tag", "-a", tag, "-m", `Release ${tag}`]);

  return committed;
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    return /^y/i.test((await rl.question(question)).trim());
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    say(USAGE);
    process.exit(0);
  }

  const dryRun = args.includes("--dry-run");
  const skipSmoke = args.includes("--skip-smoke");
  const [bumpArg] = args.filter((arg) => !arg.startsWith("-"));

  if (!bumpArg) die("say which: patch, minor, major, or an exact version");

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const version = nextVersion(manifest.version, bumpArg);

  if (!version) die(`not a version or bump: ${bumpArg}`);

  const tag = `v${version}`;
  say(`\nReleasing [1m${manifest.version} → ${version}[0m as ${tag}`);

  preflight(tag);
  verify();
  if (!skipSmoke) smokeTest();

  if (dryRun) {
    say(`\n[36mDry run — nothing changed.[0m ${tag} is ready to cut.\n`);

    return;
  }

  const committed = bump(version, tag);

  // The tag has to be on GitHub before the package that points at it is
  // installable, so push first and only then publish.
  step("Publishing");
  say("  the tag must reach GitHub before the package that points at it");

  if (!(await confirm(`  Push ${tag} and publish ${version}? [y/N] `))) {
    // Only offer to drop a commit when one was made. Suggesting it otherwise
    // would throw away whatever the user last committed.
    const undo = committed
      ? `git tag -d ${tag} && git reset --hard HEAD~1`
      : `git tag -d ${tag}`;

    say(`\n  Stopped. Nothing left this machine — undo with:\n    ${undo}\n`);

    return;
  }

  loud("git", ["push", "--follow-tags"]);

  // The tag is public from here on, so a failure below is resumable rather
  // than something to undo — say so instead of dumping a stack trace.
  try {
    loud("npm", ["publish"], { cwd: join(REPO, "create") });
  } catch {
    die(
      `${tag} is pushed, but the publish failed. Fix the cause, then finish ` +
        "with:\n    cd create && npm publish"
    );
  }

  say(`\n[32m✓[0m ${tag} released — npx zen-claude-starter@${version}\n`);
}

// Importing this module must not cut a release — only running it does.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
