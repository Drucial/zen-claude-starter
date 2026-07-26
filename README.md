# zen-claude-starter

A modern, opinionated [Next.js](https://nextjs.org) app wired for fast,
consistent feature work — with conventions enforced by the toolchain, not just
documented.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) ·
Tailwind v4 · shadcn (new-york) on [Radix](https://www.radix-ui.com) ·
next-themes · Sonner · Vitest.

<!-- template-only:start -->

TanStack Query, Zod, and Motion ship by default and can be left out at scaffold
time; everything above is always present.

<!-- template-only:end -->

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io) (this repo is pnpm-only — a `pnpm-lock.yaml` is
  committed)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `app/page.tsx` to get
going — the page hot-reloads.

<!-- template-only:start -->

## Scaffolding a project

Stamp this methodology into a fresh, git-initialized repo. From anywhere, with
no clone:

```bash
npx zen-claude-starter                    # prompts for everything
npx zen-claude-starter my-app --monorepo  # or answer up front
```

From inside this repo, the same scaffolder runs against your working copy, so
uncommitted template edits are picked up without committing them:

```bash
pnpm create-project
```

Run it bare and it walks you through the name, layout, dependencies, and
location with arrow-key selection — escape steps back a question. Anything you
pass as an argument or flag skips its prompt:

| Flag                                      | Effect                                      |
| ----------------------------------------- | ------------------------------------------- |
| `--monorepo`                              | Turborepo workspace instead of a single app |
| `--no-query` / `--no-zod` / `--no-motion` | Leave that dependency out                   |
| `-y`, `--yes`                             | Skip every prompt and take the defaults     |

Either layout copies the template, installs, formats, and opens with one clean
commit. `--monorepo` splits the same code into `apps/web` and `packages/ui`,
adds `@repo/eslint-config` and `@repo/typescript-config`, and points the root
scripts at Turborepo — script names and CI workflows are identical, so
`pnpm check` means the same thing either way.

TanStack Query, Zod, and Motion are the only optional dependencies; everything
else is load-bearing. Dropping Query also removes `useAppMutation`, the query
hooks, and the `QueryClientProvider`, and rewrites the data-access rules in
`CLAUDE.md` to describe server actions rather than code that isn't there.

Prompts are skipped entirely when stdin isn't a terminal, so scripted runs take
the defaults and fail fast on a missing name instead of hanging.

## Releasing the scaffolder

`npx` downloads the template from the git tag the release was cut from, so a
given version scaffolds the same project forever — which also means the version
and the tag have to move together.

```bash
pnpm release patch --dry-run   # verify without changing anything
pnpm release patch             # or minor, major, or an exact version
```

It refuses to run on a dirty tree, off `main`, behind the remote, or onto a tag
that already exists. Then it runs `check` and the test suite, scaffolds a
throwaway project in each layout and builds it — a release that passes its own
tests while emitting a project that doesn't build is the failure worth catching
— and only then bumps, commits, and tags. Pushing and publishing happen last,
behind a confirmation, and it prints the undo if you decline.

| Command               | What it does                             |
| --------------------- | ---------------------------------------- |
| `pnpm create-project` | Scaffold a project from the working copy |
| `pnpm release <bump>` | Verify, tag, and publish the scaffolder  |

<!-- template-only:end -->

## Scripts

| Command              | What it does                                           |
| -------------------- | ------------------------------------------------------ |
| `pnpm dev`           | Start the dev server                                   |
| `pnpm build`         | Production build                                       |
| `pnpm start`         | Serve the production build                             |
| `pnpm fix`           | Auto-fix lint + format (run before committing)         |
| `pnpm check`         | Verify format, lint, and types — the same gate CI runs |
| `pnpm lint`          | ESLint only                                            |
| `pnpm format`        | Prettier write                                         |
| `pnpm typecheck`     | `tsc --noEmit`                                         |
| `pnpm test`          | Vitest in watch mode                                   |
| `pnpm test:run`      | Run the test suite once (CI mode)                      |
| `pnpm test:coverage` | Run the suite once with a coverage report              |

## Project Structure

<!-- layout:start -->

```
app/          App Router routes, layouts, server components
components/    Cross-feature components only
  ui/         shadcn-style primitives (Button, DropdownMenu, …)
  layout/     App shell (providers, mode toggle, …)
  shared/     Generic reusable components (create when needed)
hooks/        All hooks, grouped per feature/model (e.g. hooks/users/)
utils/        Global utilities (cn, …)
context/      Global React context providers (create when needed)
api/          External API clients (create when needed)
```

<!-- layout:end -->

## Conventions

This repo leans on a small set of hard conventions so generated and
hand-written code stay consistent:

- **Server Components by default.** `"use client"` only for interactivity,
  state, effects, or browser APIs.
- **Components render; logic lives in `utils/`.** No business logic embedded in
  components.

<!-- data:start -->

- **Data access.** Server Components read directly via server actions. Client
  Components never fetch directly — they consume `queryOptions()` factories with
  `useQuery(...)` and mutate through the shared `useAppMutation` wrapper. See
  `hooks/users/` for the reference pattern.

<!-- data:end -->

- **Tests ship with the logic.** Anything testable — `utils/`, hooks, server
  actions — lands with its tests, co-located in a `__tests__/` dir.
- **Enforced style.** ESLint (flat config) + Prettier handle import sorting,
  prop sorting, `type`-over-`interface`, `import type`, `@/` alias imports, and
  effect discipline. `pnpm check` fails on violations.

The full rules live in [`CLAUDE.md`](./CLAUDE.md) and
[`.claude/rules/code-quality.md`](./.claude/rules/code-quality.md) — these also
brief Claude Code when it works in this repo.

## Fonts

Geist Sans and Geist Mono are loaded with [`next/font`](https://nextjs.org/docs/app/api-reference/components/font),
which self-hosts the fonts at build time — the create-next-app default.

## Claude Code on the Web

A `SessionStart` hook (`.claude/hooks/session-start.sh`) runs `pnpm install`
when a remote session boots, so `pnpm check` and the test suite work
immediately in fresh containers. It takes effect once merged to the default
branch.

## Deploy

Deploys cleanly to [Vercel](https://vercel.com/new). See the
[Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
