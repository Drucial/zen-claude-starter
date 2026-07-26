import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { swapDocBlocks } from "./markdown-blocks.mjs";
import { rewriteImports } from "./rewrite-imports.mjs";
import { splitDependencies } from "./split-dependencies.mjs";

const TEMPLATE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates",
  "monorepo"
);

export const WEB = join("apps", "web");
export const UI = join("packages", "ui");

/** Moved wholesale into apps/web — the app keeps its own @/ alias for these. */
const APP_PATHS = [
  "app",
  join("components", "layout"),
  "hooks",
  "public",
  "postcss.config.mjs",
  "vitest.setup.ts",
];

/** Replaced by workspace-aware versions in templates/monorepo. */
const SUPERSEDED_PATHS = [
  "next.config.ts",
  "vitest.config.ts",
  "components.json",
  "tsconfig.json",
  "eslint.config.mjs",
  // The template's lockfile describes the single-app layout; pnpm regenerates
  // it against the workspace before the initial commit.
  "pnpm-lock.yaml",
];

const ROOT_SCRIPTS = {
  dev: "turbo run dev",
  build: "turbo run build",
  start: "turbo run start",
  lint: "turbo run lint",
  "lint:fix": "turbo run lint:fix",
  typecheck: "turbo run typecheck",
  test: "turbo run test",
  "test:run": "turbo run test:run",
  "test:coverage": "turbo run test:coverage",
  format: "prettier --write .",
  "format:check": "prettier --check .",
  fix: "pnpm lint:fix && pnpm format",
  check: "pnpm format:check && pnpm lint && pnpm typecheck",
};

const WEB_SCRIPTS = {
  dev: "next dev",
  build: "next build",
  start: "next start",
  lint: "eslint .",
  "lint:fix": "eslint . --fix",
  typecheck: "tsc --noEmit",
  test: "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
};

const PACKAGE_SCRIPTS = {
  lint: "eslint .",
  "lint:fix": "eslint . --fix",
  typecheck: "tsc --noEmit",
};

// Tailwind v4 has no config file to list content globs, so the theme declares
// what to scan: its own primitives plus every app in the workspace.
const SOURCE_DIRECTIVES = [
  '@source "../components";',
  '@source "../../../apps/*/app";',
  '@source "../../../apps/*/components";',
];

function move(dir, from, to) {
  const source = join(dir, from);
  if (!existsSync(source)) return;

  const destination = join(dir, to);
  mkdirSync(dirname(destination), { recursive: true });
  renameSync(source, destination);
}

function sortKeys(record) {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b))
  );
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function* walkSourceFiles(dir) {
  if (!existsSync(dir)) return;

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      yield* walkSourceFiles(path);
    } else if (/\.(ts|tsx)$/.test(path)) {
      yield path;
    }
  }
}

function restructureFiles(dir) {
  // The theme ships with the primitives that depend on it.
  move(dir, join("app", "globals.css"), join(UI, "styles", "globals.css"));
  move(dir, join("components", "ui"), join(UI, "components"));
  move(dir, "utils", join(UI, "utils"));

  for (const path of APP_PATHS) {
    move(dir, path, join(WEB, path));
  }

  // `components/` held only ui/ and layout/, both now relocated.
  rmSync(join(dir, "components"), { recursive: true, force: true });

  for (const path of SUPERSEDED_PATHS) {
    rmSync(join(dir, path), { recursive: true, force: true });
  }

  cpSync(TEMPLATE_ROOT, dir, { recursive: true });

  // npm drops a file literally named .gitignore from the published tarball, so
  // the template ships it undotted and it gets its real name here. Without
  // this the workspace keeps the single-app ignore rules, whose anchored
  // patterns miss apps/*/node_modules — and the initial commit swallows them.
  renameSync(join(dir, "gitignore"), join(dir, ".gitignore"));
}

function rewriteWorkspaceImports(dir) {
  for (const workspace of [WEB, UI]) {
    for (const path of walkSourceFiles(join(dir, workspace))) {
      const source = readFileSync(path, "utf8");
      const rewritten = rewriteImports(source);

      if (rewritten !== source) writeFileSync(path, rewritten);
    }
  }
}

function addSourceDirectives(dir) {
  const path = join(dir, UI, "styles", "globals.css");
  const lines = readFileSync(path, "utf8").split("\n");
  const lastImport = lines.findLastIndex((line) => line.startsWith("@import"));

  lines.splice(lastImport + 1, 0, "", ...SOURCE_DIRECTIVES);
  writeFileSync(path, lines.join("\n"));
}

function writeWorkspaceManifest(dir) {
  const path = join(dir, "pnpm-workspace.yaml");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";

  writeFileSync(
    path,
    `packages:\n  - "apps/*"\n  - "packages/*"\n\n${existing}`
  );
}

function writePackageJsons(dir, name, pkg) {
  const buckets = splitDependencies(pkg);

  writeJson(join(dir, "package.json"), {
    name,
    version: "0.1.0",
    private: true,
    packageManager: pkg.packageManager,
    scripts: ROOT_SCRIPTS,
    devDependencies: buckets.root.devDependencies,
  });

  writeJson(join(dir, WEB, "package.json"), {
    name: "web",
    version: "0.1.0",
    private: true,
    scripts: WEB_SCRIPTS,
    dependencies: sortKeys({
      ...buckets.web.dependencies,
      "@repo/ui": "workspace:*",
    }),
    devDependencies: sortKeys({
      ...buckets.web.devDependencies,
      "@repo/eslint-config": "workspace:*",
      "@repo/typescript-config": "workspace:*",
    }),
  });

  writeJson(join(dir, UI, "package.json"), {
    name: "@repo/ui",
    version: "0.0.0",
    private: true,
    exports: {
      "./components/*": "./components/*.tsx",
      "./utils/*": "./utils/*.ts",
      "./styles/*": "./styles/*",
    },
    scripts: PACKAGE_SCRIPTS,
    dependencies: buckets.ui.dependencies,
    devDependencies: sortKeys({
      ...buckets.ui.devDependencies,
      "@repo/eslint-config": "workspace:*",
      "@repo/typescript-config": "workspace:*",
    }),
  });

  writeJson(join(dir, "packages", "eslint-config", "package.json"), {
    name: "@repo/eslint-config",
    version: "0.0.0",
    private: true,
    type: "module",
    exports: {
      "./base": "./base.mjs",
      "./react": "./react.mjs",
      "./next": "./next.mjs",
    },
    // Plugins a config package re-exports are runtime requirements for every
    // consumer, so they land in dependencies regardless of how the single-app
    // template classified them.
    dependencies: sortKeys({
      ...buckets["eslint-config"].dependencies,
      ...buckets["eslint-config"].devDependencies,
    }),
  });
}

/**
 * Restructure a materialized single-app template into a Turborepo workspace.
 * Runs after rewriteIdentity, so package.json already carries the project's
 * name and the home page is the minimal one.
 */
export function applyMonorepo(dir, name) {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

  restructureFiles(dir);
  rewriteWorkspaceImports(dir);
  addSourceDirectives(dir);
  writePackageJsons(dir, name, pkg);
  writeWorkspaceManifest(dir);
  swapDocBlocks(dir, "layout");
}
