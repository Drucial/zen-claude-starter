# zen-claude-starter

Scaffold a Next.js app — or a Turborepo workspace — with the conventions
already wired up and enforced.

```bash
npx zen-claude-starter
```

It asks for a name, a layout, which optional dependencies you want, and where
to put it, then installs, formats, and opens with one clean commit.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) ·
Tailwind v4 · shadcn on Radix · TanStack Query · Zod · next-themes · Sonner ·
Motion · Vitest, with ESLint and Prettier enforcing the conventions rather than
just documenting them.

## Options

Anything you pass skips its prompt.

| Option                                    | Effect                                         |
| ----------------------------------------- | ---------------------------------------------- |
| `<name>`                                  | Project name (lowercase, hyphens)              |
| `<parent-dir>`                            | Where to create it (default: current dir)      |
| `--monorepo`                              | Turborepo workspace: `apps/web`, `packages/ui` |
| `--no-query` / `--no-zod` / `--no-motion` | Leave that dependency out                      |
| `-y`, `--yes`                             | Skip every prompt and take the defaults        |

Prompts are skipped entirely when stdin isn't a terminal, so this is safe to
run from a script — pass a name, or it exits with a message rather than
hanging.

## What you get

A single app looks like this:

```
app/          App Router routes, layouts, server components
components/   ui/ primitives, layout/ shell, feature groups
hooks/        All hooks, grouped per feature/model
utils/        Global utilities
```

`--monorepo` splits the same code into `apps/web` and `packages/ui`, adds
`@repo/eslint-config` and `@repo/typescript-config`, and points the root
scripts at Turborepo. Script names are identical in both, so `pnpm check`
means the same thing either way.

Every project ships a `CLAUDE.md` and `.claude/rules/` describing its own
layout and conventions, so Claude Code works inside the lines from the first
prompt.

Source and issues: https://github.com/Drucial/zen-claude-starter
