import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(readFileSync(join(HERE, "package.json"), "utf8"));

export const { repo: TEMPLATE_REPO, templateRef: TEMPLATE_REF } = MANIFEST.zen;

/**
 * The repo checkout this file lives in, or null when it doesn't live in one.
 * Published to npm, `create/`'s contents become the package root, so the
 * directory name is what tells the two apart.
 */
export function findLocalTemplate() {
  const parent = resolve(HERE, "..");

  return basename(HERE) === "create" && existsSync(join(parent, ".git"))
    ? parent
    : null;
}

export function tarballUrl(repo, ref) {
  return `https://codeload.github.com/${repo}/tar.gz/refs/tags/${ref}`;
}

function git(cwd, ...args) {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function untar(archive, target, extra = []) {
  mkdirSync(target, { recursive: true });
  execFileSync("tar", ["-xf", archive, "-C", target, ...extra], {
    stdio: ["ignore", "ignore", "pipe"],
  });
}

function withStaging(work) {
  const staging = mkdtempSync(join(tmpdir(), "zen-template-"));

  try {
    return work(staging);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

/**
 * Copy the checkout's tracked files, including uncommitted work and excluding
 * everything gitignored. `git stash create` writes a throwaway commit of the
 * working tree without touching it; it prints nothing when the tree is clean,
 * in which case HEAD is already what we want.
 */
function materializeLocal(templateDir, target) {
  let snapshot = "";
  try {
    snapshot = git(templateDir, "stash", "create");
  } catch {
    snapshot = "";
  }

  withStaging((staging) => {
    const archive = join(staging, "snapshot.tar");
    git(
      templateDir,
      "archive",
      "--format=tar",
      "-o",
      archive,
      snapshot || "HEAD"
    );
    untar(archive, target);
  });
}

/** Download a published tag straight from GitHub — no checkout required. */
async function materializeRemote(repo, ref, target) {
  const url = tarballUrl(repo, ref);
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`could not reach GitHub — ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(
      `could not download ${repo}@${ref} (HTTP ${response.status}). ` +
        "The release may not be tagged yet."
    );
  }

  const body = Buffer.from(await response.arrayBuffer());

  withStaging((staging) => {
    const archive = join(staging, "template.tar.gz");
    writeFileSync(archive, body);
    // GitHub wraps everything in a <repo>-<ref>/ directory.
    untar(archive, target, ["--strip-components=1"]);
  });
}

/**
 * Materialize the starter template into `target`.
 *
 * Inside the repo the local checkout wins, so edits to the template are picked
 * up without committing them. Anywhere else — installed from npm — the tag
 * this release was cut from is fetched, which is what makes the output the
 * same on every machine.
 */
export async function resolveTemplate({ templateDir, target }) {
  if (templateDir) {
    materializeLocal(templateDir, target);

    return { from: "local", description: templateDir };
  }

  await materializeRemote(TEMPLATE_REPO, TEMPLATE_REF, target);

  return { from: "remote", description: `${TEMPLATE_REPO}@${TEMPLATE_REF}` };
}
