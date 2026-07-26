import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function git(cwd, ...args) {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Copy the template's tracked files into `target`, including uncommitted work
 * and excluding everything gitignored. `git stash create` writes a throwaway
 * commit of the working tree without touching it; it prints nothing when the
 * tree is clean, in which case HEAD is already what we want.
 */
function materializeLocal(templateDir, target) {
  if (!existsSync(join(templateDir, ".git"))) {
    throw new Error(`not a git repository: ${templateDir}`);
  }

  let snapshot = "";
  try {
    snapshot = git(templateDir, "stash", "create");
  } catch {
    snapshot = "";
  }

  const staging = mkdtempSync(join(tmpdir(), "zen-template-"));
  const archive = join(staging, "snapshot.tar");

  try {
    git(
      templateDir,
      "archive",
      "--format=tar",
      "-o",
      archive,
      snapshot || "HEAD"
    );
    mkdirSync(target, { recursive: true });
    execFileSync("tar", ["-xf", archive, "-C", target], { stdio: "inherit" });
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

/**
 * Materialize the starter template into `target`.
 *
 * `local` reads from the enclosing git checkout — the path used when the CLI
 * runs from inside the template repo. A `remote` strategy that fetches a
 * release tarball from GitHub slots in here for the published `npx` entry
 * point without any caller changing.
 */
export function resolveTemplate({ from = "local", templateDir, target }) {
  if (from === "local") {
    materializeLocal(templateDir, target);

    return;
  }

  throw new Error(`unsupported template source: ${from}`);
}
