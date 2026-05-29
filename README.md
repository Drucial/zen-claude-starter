# zen-claude-starter

A modern, opinionated [Next.js](https://nextjs.org) starter wired for fast,
consistent feature work — with conventions enforced by the toolchain, not just
documented.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind
v4 · TanStack Query v5 · shadcn (base-nova) on [Base UI](https://base-ui.com) ·
next-themes · Sonner.

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

## Scripts

| Command         | What it does                                           |
| --------------- | ------------------------------------------------------ |
| `pnpm dev`      | Start the dev server                                   |
| `pnpm build`    | Production build                                       |
| `pnpm start`    | Serve the production build                             |
| `pnpm fix`      | Auto-fix lint + format (run before committing)         |
| `pnpm check`    | Verify format, lint, and types — the same gate CI runs |
| `pnpm test`     | Vitest in watch mode                                   |
| `pnpm test:run` | Run the test suite once (CI mode)                      |

## Project Structure

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

## Conventions

This repo leans on a small set of hard conventions so generated and
hand-written code stay consistent:

- **Server Components by default.** `"use client"` only for interactivity,
  state, effects, or browser APIs.
- **Components render; logic lives in `utils/`.** No business logic embedded in
  components.
- **Data access.** Server Components read directly via server actions. Client
  Components never fetch directly — they consume `queryOptions()` factories with
  `useQuery(...)` and mutate through the shared `useAppMutation` wrapper. See
  `hooks/users/` for the reference pattern.
- **Enforced style.** ESLint (flat config) + Prettier handle import sorting,
  prop sorting, `type`-over-`interface`, `import type`, `@/` alias imports, and
  effect discipline. `pnpm check` fails on violations.

The full rules live in [`CLAUDE.md`](./CLAUDE.md) and
[`.claude/rules/code-quality.md`](./.claude/rules/code-quality.md) — these also
brief Claude Code when it works in this repo.

## Fonts

Geist Sans and Geist Mono ship via the [`geist`](https://www.npmjs.com/package/geist)
package, so the font files are bundled and builds never reach out to Google
Fonts at build time.

## Claude Code on the Web

A `SessionStart` hook (`.claude/hooks/session-start.sh`) runs `pnpm install`
when a remote session boots, so `pnpm check` and the test suite work
immediately in fresh containers. It takes effect once merged to the default
branch.

## Deploy

Deploys cleanly to [Vercel](https://vercel.com/new). See the
[Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
