# Monorepo scaffolding

Design for adding a `--monorepo` mode to the project scaffolder.

## Problem

`zen-claude-starter` encodes a methodology — strict TypeScript, enforced
lint/format, a fixed `components/` + `hooks/` + `utils/` layout, TanStack Query
data rules, and the `CLAUDE.md` / `.claude/rules/` briefing that keeps Claude
Code inside those lines. The scaffolder can only stamp that methodology into a
single-app repo. Projects that need a workspace get nothing.

A second template repo would solve it and immediately start drifting: two copies
of the rules, two ESLint configs, two sets of conventions to keep in step. So
the monorepo is a **mode of the same scaffolder**, derived from the same
snapshot.

## Goals

- `pnpm create-project my-app --monorepo` produces a working Turborepo +
  pnpm-workspaces repo with the starter's conventions intact.
- The single-app path behaves exactly as it does today.
- One source of truth for rules, ESLint, and app code.
- Structured so publishing the scaffolder as `npx zen-claude-starter` is a
  publish step, not a rewrite.
- Let the optional dependency groups be switched off, interactively or by flag.

## Non-goals

- A second app in the generated workspace. `apps/web` is the only app on day
  one; `packages/ui` proves the cross-package seam.
- A published npm package. The CLI is shaped so publishing is the only
  remaining step, but the `remote` template source isn't written yet.

## Output

```
my-app/
  package.json            root: turbo scripts; turbo + prettier + typescript devDeps
  pnpm-workspace.yaml     packages: ["apps/*", "packages/*"]
  turbo.json
  .prettierrc  .prettierignore  .gitignore  .vscode/  .github/workflows/
  CLAUDE.md               monorepo layout block swapped in
  .claude/                settings.json, hooks/, rules/code-quality.md
  apps/web/
    package.json  next.config.ts  postcss.config.mjs  components.json
    tsconfig.json  eslint.config.mjs  vitest.config.ts  vitest.setup.ts
    app/            layout.tsx, page.tsx, favicon.ico
    components/layout/   providers.tsx, mode-toggle.tsx
    hooks/          use-app-mutation.ts, users/, __tests__/
    public/
  packages/ui/
    package.json (@repo/ui)  components.json  tsconfig.json  eslint.config.mjs
    components/     button.tsx, dropdown-menu.tsx, sonner.tsx
    utils/cn.ts
    styles/globals.css
  packages/eslint-config/     package.json, base.mjs, react.mjs, next.mjs
  packages/typescript-config/ package.json, base.json, nextjs.json
```

Package namespace is `@repo/*` — the Turborepo and shadcn convention, so their
docs paste in verbatim and renaming a project never touches an import.

## Components

### `create/` — the CLI

A zero-dependency Node package. Built-ins only, so it needs no install step and
stays out of the workspace graph, and it carries its own `package.json` with a
`bin` so publishing it is the only step between here and `npx`.

```
create/
  package.json          name "zen-claude-starter", bin, files, type: module
  cli.mjs               args, prompts, orchestration
  tui.mjs               colours, banner, select / multiselect, spinner
  layouts.mjs           the single-app / monorepo choices
  features.mjs          the optional dependency groups
  template-source.mjs   materialize the template into the target dir
  transforms/
    manifest.mjs        package → { targets, feature }
    identity.mjs        project name, README, layout title, minimal page
    trim.mjs            drop create/ + components/home + docs/
    prune-features.mjs  drop the dependency groups that were switched off
    monorepo.mjs        restructure into apps/web + packages/*
    split-dependencies.mjs
    rewrite-imports.mjs
    markdown-blocks.mjs
  templates/
    monorepo/           static workspace files
    no-query/           Providers without the QueryClientProvider
    docs/               layout and data block replacements
  __tests__/
```

`template-source.mjs` exposes `resolveTemplate({ from })`. The `"local"`
strategy is today's `git stash create` → `git archive | tar -x` snapshot, which
captures tracked files including uncommitted work while excluding everything
gitignored. A `"remote"` strategy (GitHub tarball) drops into the same seam for
the `npx` path.

### The package manifest

`manifest.mjs` maps **every** package in the template's `package.json` to
`{ targets, feature }`:

- `targets ⊆ { root, web, ui, eslint-config }` — which generated `package.json`
  the dependency lands in.
- `feature` — `core`, or one of the optional groups (`query`, `zod`, `motion`)
  that the future installer will be able to switch off.

`splitDependencies(pkg)` is pure: manifest plus the template's `package.json`
in, the generated dependency maps out, version ranges preserved.

**Unknown packages throw.** Adding a dependency to the starter without placing
it fails the transform and its test, rather than silently landing nowhere. This
is the anti-drift guarantee, and the same test protects the feature tags.

### Optional features

`transforms/prune-features.mjs` reads the same `feature` tags to drop what the
user turned off. `zod` and `motion` are leaves — nothing in a scaffolded
project imports them, so removing their packages is the whole job. `query`
additionally owns `useAppMutation`, the query hooks and their test, the
`QueryClientProvider`, and the data-access sections of the docs.

Two mechanisms carry the difference. `Providers` is swapped wholesale from
`templates/no-query/` rather than edited, because unwrapping a JSX provider is
not a safe textual edit. The docs use the same marked-block swap as the layout,
under a second `data` block — leaving a project whose `CLAUDE.md` still
described `useAppMutation` would be worse than not offering the toggle.

Pruning runs while the tree is still flat, so the monorepo transform splits an
already-reduced dependency set and needs no knowledge of features.

### Variant-specific docs

`CLAUDE.md`, `.claude/rules/code-quality.md`, and `README.md` describe the
single-app layout. Maintaining two full copies guarantees drift, so only the
layout-specific sections are wrapped in markers:

```
<!-- layout:start -->
… single-app directory structure …
<!-- layout:end -->
```

`markdown-blocks.mjs` swaps the block contents for the variant in
`create/templates/docs/<block>/`. Two blocks exist: `layout` (single-app vs
workspace directory structure) and `data` (TanStack Query vs server actions).
Everything else in those files — the conventions, the anti-defaults — stays
shared and written once.

## Data flow

```
template repo
  └─ resolveTemplate({ from: "local" })   → target dir (tracked files, no gitignored paths)
       └─ identity transform              → project name, title, minimal page
            ├─ trim transform             → drop create/, components/home, docs/
            ├─ prune-features             → drop excluded deps, files, doc blocks
            └─ monorepo transform
                 ├─ splitDependencies()   → root / web / ui / eslint-config deps
                 ├─ file moves            → apps/web, packages/ui
                 ├─ rewriteImports()      → @/components/ui/* → @repo/ui/components/*
                 ├─ copy static templates → turbo.json, packages/*
                 └─ swapMarkdownBlocks()  → monorepo layout docs
                      └─ pnpm install → git init → commit
```

Install runs **before** the initial commit in both modes. The monorepo layout
invalidates the copied `pnpm-lock.yaml`, so it is deleted and regenerated, and
CI runs `pnpm install --frozen-lockfile` — the correct lockfile has to be in the
initial commit.

## Import rewrites

Applied to every moved `.ts`/`.tsx`:

| From                | To                            |
| ------------------- | ----------------------------- |
| `@/components/ui/*` | `@repo/ui/components/*`       |
| `@/utils/cn`        | `@repo/ui/utils/cn`           |
| `./globals.css`     | `@repo/ui/styles/globals.css` |

`apps/web` keeps its own `@/*` alias for app-local `components/`, `hooks/`, and
`utils/`.

## Task orchestration

Root scripts keep the **same names** as the single-app repo, delegating to
`turbo run <task>`, so the five existing `.github/workflows/*.yml` copy over
untouched:

```
dev|build|start|lint|lint:fix|typecheck|test|test:run|test:coverage → turbo run <task>
format / format:check → prettier at root
fix   → pnpm lint:fix && pnpm format
check → pnpm format:check && pnpm lint && pnpm typecheck
```

## Styling across packages

The Tailwind theme moves to `packages/ui/styles/globals.css` so it ships with
the primitives that depend on it. `apps/web/app/layout.tsx` imports it, and
`@source` directives (`../components`, `../../../apps/*/app`,
`../../../apps/*/components`) make Tailwind v4 scan both the package and every
app. `apps/web/next.config.ts` sets `transpilePackages: ["@repo/ui"]` — the
package exports TypeScript source.

Both `apps/web` and `packages/ui` get a `components.json`: the app's `ui` alias
points at `@repo/ui/components` so imports resolve, and the package's own config
means `pnpm dlx shadcn@latest add …` run there vendors into the package.

## Error handling

- Invalid project name, existing destination, missing `git`, running outside the
  template repo: fail with a message before any filesystem writes.
- A dependency missing from the manifest throws during the transform, naming the
  package.
- A renamed or missing marker block fails `markdown-blocks.test.mjs`.
- `pnpm` absent: skip install and say so, as today.

## Testing

Unit tests over the pure transforms, `// @vitest-environment node`:

- `identity.test.mjs` — name sanitization, `package.json` / README / title rewrites.
- `rewrite-imports.test.mjs` — the mapping table, including no-ops.
- `split-dependencies.test.mjs` — placement, feature tags, and the coverage
  invariant against the real `package.json`.
- `markdown-blocks.test.mjs` — every marked block has a monorepo replacement.
- `monorepo.test.mjs` — the transform over a temp fixture tree: file layout, the
  `workspace:*` link, rewritten imports.

End-to-end verification is manual and documented in the plan: scaffold both
modes into a temp directory and run `check` / `build` / `test:run` in each.
