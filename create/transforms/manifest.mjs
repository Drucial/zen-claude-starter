/**
 * Where every template dependency lands in the generated workspace, and which
 * feature owns it.
 *
 * `targets` are the generated package.json files a dependency belongs to:
 * `root`, `web` (apps/web), `ui` (packages/ui), `eslint-config`
 * (packages/eslint-config). Several packages are needed in more than one —
 * pnpm links them per workspace, so each package declares what it imports.
 *
 * `feature` is `core` or one of OPTIONAL_FEATURES. Nothing reads it yet; it is
 * the placement the installer's dependency toggles will key off, recorded here
 * so the manifest is written once.
 *
 * Whether a package lands in `dependencies` or `devDependencies` is inherited
 * from the template's own classification — this map only decides where.
 */
export const PACKAGES = {
  // Runtime
  "@tanstack/react-query": { targets: ["web"], feature: "query" },
  "@tanstack/react-query-devtools": { targets: ["web"], feature: "query" },
  "class-variance-authority": { targets: ["ui"], feature: "core" },
  clsx: { targets: ["ui"], feature: "core" },
  "lucide-react": { targets: ["web", "ui"], feature: "core" },
  motion: { targets: ["web"], feature: "motion" },
  next: { targets: ["web"], feature: "core" },
  // Consumed by the app's mode toggle and by the ui package's Toaster.
  "next-themes": { targets: ["web", "ui"], feature: "core" },
  "radix-ui": { targets: ["ui"], feature: "core" },
  react: { targets: ["web", "ui"], feature: "core" },
  "react-dom": { targets: ["web"], feature: "core" },
  // The Toaster lives in packages/ui; useAppMutation calls toast() in apps/web.
  sonner: { targets: ["web", "ui"], feature: "core" },
  "tailwind-merge": { targets: ["ui"], feature: "core" },
  // packages/ui/styles/globals.css @imports it, so it resolves from there.
  "tw-animate-css": { targets: ["ui"], feature: "core" },
  zod: { targets: ["web"], feature: "zod" },

  // Tooling
  "@eslint/js": { targets: ["eslint-config"], feature: "core" },
  "@next/eslint-plugin-next": { targets: ["eslint-config"], feature: "core" },
  "@stylistic/eslint-plugin": { targets: ["eslint-config"], feature: "core" },
  "@tailwindcss/postcss": { targets: ["web"], feature: "core" },
  "@testing-library/dom": { targets: ["web"], feature: "core" },
  "@testing-library/jest-dom": { targets: ["web"], feature: "core" },
  "@testing-library/react": { targets: ["web"], feature: "core" },
  "@types/node": { targets: ["web"], feature: "core" },
  "@types/react": { targets: ["web", "ui"], feature: "core" },
  "@types/react-dom": { targets: ["web"], feature: "core" },
  "@vitejs/plugin-react": { targets: ["web"], feature: "core" },
  "@vitest/coverage-v8": { targets: ["web"], feature: "core" },
  eslint: { targets: ["web", "ui"], feature: "core" },
  "eslint-config-prettier": { targets: ["eslint-config"], feature: "core" },
  "eslint-plugin-import": { targets: ["eslint-config"], feature: "core" },
  "eslint-plugin-react": { targets: ["eslint-config"], feature: "core" },
  "eslint-plugin-react-hooks": { targets: ["eslint-config"], feature: "core" },
  "eslint-plugin-react-you-might-not-need-an-effect": {
    targets: ["eslint-config"],
    feature: "core",
  },
  "eslint-plugin-simple-import-sort": {
    targets: ["eslint-config"],
    feature: "core",
  },
  "eslint-plugin-unused-imports": {
    targets: ["eslint-config"],
    feature: "core",
  },
  globals: { targets: ["eslint-config"], feature: "core" },
  jsdom: { targets: ["web"], feature: "core" },
  // Formatting runs once from the root across the whole workspace.
  prettier: { targets: ["root"], feature: "core" },
  "prettier-plugin-tailwindcss": { targets: ["root"], feature: "core" },
  tailwindcss: { targets: ["web", "ui"], feature: "core" },
  typescript: { targets: ["root", "web", "ui"], feature: "core" },
  "typescript-eslint": { targets: ["eslint-config"], feature: "core" },
  vitest: { targets: ["web"], feature: "core" },
};

/** Packages the workspace needs that the single-app template has no use for. */
export const WORKSPACE_ONLY_PACKAGES = {
  turbo: { targets: ["root"], feature: "core", version: "^2.10.7", dev: true },
};

/**
 * Dependency groups the installer will be able to switch off. `zod` and
 * `motion` are leaves — dropping them is a dependency-key delete. `query`
 * additionally owns useAppMutation, the users hooks, the QueryClientProvider,
 * and the data-access sections of the docs.
 */
export const OPTIONAL_FEATURES = ["query", "zod", "motion"];

export const TARGETS = ["root", "web", "ui", "eslint-config"];
