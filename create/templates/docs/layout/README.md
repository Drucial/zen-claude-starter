A pnpm workspace orchestrated by [Turborepo](https://turbo.build). Every script
runs from the root and fans out across packages.

```
apps/
  web/                    The Next.js app
    app/                  App Router routes, layouts, server components
    components/layout/    App shell (providers, mode toggle, …)
    hooks/                All hooks, grouped per feature/model
packages/
  ui/                     @repo/ui — shared primitives, cn, Tailwind theme
    components/           shadcn primitives (Button, DropdownMenu, …)
    utils/cn.ts
    styles/globals.css    Theme tokens + @source globs
  eslint-config/          @repo/eslint-config — base / react / next configs
  typescript-config/      @repo/typescript-config — base.json, nextjs.json
turbo.json                Task graph and caching
```

New code defaults to `apps/web`. Promote something to `packages/ui` only when a
second app would genuinely need it. To add a package, create
`packages/<name>` with a `package.json` named `@repo/<name>` and depend on it
with `"@repo/<name>": "workspace:*"` — the workspace globs already cover
`apps/*` and `packages/*`.

Add a shadcn primitive from inside `packages/ui`, so it lands in the shared
package rather than the app:

```bash
cd packages/ui && pnpm dlx shadcn@latest add card
```

Deploying a workspace: point Vercel's **Root Directory** at `apps/web` and let
it detect the rest.
