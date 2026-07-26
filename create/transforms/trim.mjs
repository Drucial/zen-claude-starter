import { rmSync } from "node:fs";
import { join } from "node:path";

/** Template-only paths that must never reach a scaffolded project. */
const TEMPLATE_ONLY = [
  // The scaffolder itself.
  "create",
  // The landing page is the template's showcase; new apps get a minimal home.
  join("components", "home"),
  // The design docs describe building the template, not using it.
  "docs",
];

export function trimTemplate(dir) {
  for (const path of TEMPLATE_ONLY) {
    rmSync(join(dir, path), { recursive: true, force: true });
  }
}
