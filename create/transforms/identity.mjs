import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Mirror of the name rules the CLI validates against. */
export function sanitizeProjectName(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toTitleCase(name) {
  return name
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function rewritePackageJson(pkg, name) {
  const next = { ...pkg, name, version: "0.1.0" };

  if (next.scripts) {
    next.scripts = { ...next.scripts };
    delete next.scripts["create-project"];
  }

  return next;
}

export function rewriteReadme(markdown, oldName, newName) {
  return markdown.split(oldName).join(newName);
}

export function rewriteLayoutTitle(source, title) {
  return source.replace(/title:\s*"[^"]*"/, `title: "${title}"`);
}

export function renderMinimalPage(title) {
  return `import { ModeToggle } from "@/components/layout/mode-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">${title}</h1>
    </div>
  );
}
`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Stamp the new project's identity onto the freshly materialized template.
 * Runs while the tree is still flat, so the monorepo transform inherits the
 * renamed package and the minimal home page.
 */
export function rewriteIdentity(dir, name) {
  const title = toTitleCase(name);

  const pkgPath = join(dir, "package.json");
  const pkg = readJson(pkgPath);
  const oldName = pkg.name;
  writeJson(pkgPath, rewritePackageJson(pkg, name));

  const readmePath = join(dir, "README.md");
  if (existsSync(readmePath)) {
    writeFileSync(
      readmePath,
      rewriteReadme(readFileSync(readmePath, "utf8"), oldName, name)
    );
  }

  const layoutPath = join(dir, "app", "layout.tsx");
  if (existsSync(layoutPath)) {
    writeFileSync(
      layoutPath,
      rewriteLayoutTitle(readFileSync(layoutPath, "utf8"), title)
    );
  }

  writeFileSync(join(dir, "app", "page.tsx"), renderMinimalPage(title));
}
