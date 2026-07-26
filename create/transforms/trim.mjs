import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { stripTemplateOnly } from "./markdown-blocks.mjs";

/** Template-only paths that must never reach a scaffolded project. */
const TEMPLATE_ONLY_PATHS = [
  // The scaffolder itself, and the release tooling that publishes it.
  "create",
  "scripts",
  // The landing page is the template's showcase; new apps get a minimal home.
  join("components", "home"),
  // The design docs describe building the template, not using it.
  "docs",
  // Carrying this over would put someone else's copyright on the user's repo,
  // and GitHub would label their project MIT on the strength of it.
  "LICENSE",
  // The social cards name the product, and sitemap/robots point at its domain.
  // The icons stay: a neutral mark beats the framework's default.
  join("app", "opengraph-image.tsx"),
  join("app", "twitter-image.tsx"),
  join("app", "sitemap.ts"),
  join("app", "robots.ts"),
];

/** Docs carrying sections that only make sense in the template repo. */
const TEMPLATE_ONLY_DOCS = ["README.md"];

export function trimTemplate(dir) {
  for (const path of TEMPLATE_ONLY_PATHS) {
    rmSync(join(dir, path), { recursive: true, force: true });
  }

  for (const file of TEMPLATE_ONLY_DOCS) {
    const path = join(dir, file);
    if (!existsSync(path)) continue;

    writeFileSync(path, stripTemplateOnly(readFileSync(path, "utf8")));
  }
}
