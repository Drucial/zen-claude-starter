import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PACKAGES } from "./manifest.mjs";
import { swapDocBlocks } from "./markdown-blocks.mjs";

const TEMPLATES = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates"
);

/**
 * What each optional feature owns beyond its packages.
 *
 * `files` are deleted, `overlay` is copied over the tree (whole-file swaps beat
 * surgical edits for a JSX wrapper like Providers), and `docBlock` names the
 * marked doc section that gets rewritten.
 *
 * zod and motion have none of these — nothing in a scaffolded project imports
 * them, so dropping their packages is the whole job.
 */
export const FEATURE_ASSETS = {
  query: {
    files: [
      join("hooks", "use-app-mutation.ts"),
      join("hooks", "__tests__", "use-app-mutation.test.tsx"),
      join("hooks", "users", "users.queries.ts"),
    ],
    overlay: "no-query",
    docBlock: "data",
  },
};

function removePackages(dir, feature) {
  const path = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf8"));

  for (const field of ["dependencies", "devDependencies"]) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      if (PACKAGES[name]?.feature === feature) delete pkg[field][name];
    }
  }

  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

/**
 * Strip the features the user turned off. Runs while the tree is still flat,
 * so the monorepo transform splits an already-reduced dependency set.
 */
export function pruneFeatures(dir, excluded) {
  for (const feature of excluded) {
    removePackages(dir, feature);

    const assets = FEATURE_ASSETS[feature];
    if (!assets) continue;

    for (const file of assets.files ?? []) {
      rmSync(join(dir, file), { force: true });
    }

    if (assets.overlay) {
      cpSync(join(TEMPLATES, assets.overlay), dir, { recursive: true });
    }

    if (assets.docBlock) swapDocBlocks(dir, assets.docBlock);
  }
}
