This is a pnpm workspace orchestrated by Turborepo. Run every task from the
root — `pnpm check`, `pnpm test:run`, and `pnpm build` fan out across packages.

- `apps/web/` — the Next.js app. Owns its routes, app-shell components, hooks,
  and anything only it uses.
  - `app/` — App Router routes, layouts, and server components
  - `components/layout/` — app shell: headers, nav, sidebar, footer
  - `components/<feature>/` or `<view>/` — feature- or view-specific groups
  - `hooks/` — all hooks, in per-feature/model subdirs (e.g. `hooks/users/`).
    Never co-locate hooks with feature components.
  - `context/`, `utils/`, `api/` — create when the app needs them
- `packages/ui/` (`@repo/ui`) — everything shared across apps: shadcn primitives
  in `components/`, `utils/cn.ts`, and the Tailwind theme in
  `styles/globals.css`. Import it as `@repo/ui/components/button`.
- `packages/eslint-config/` (`@repo/eslint-config`) — the lint rules, exported as
  `base`, `react`, and `next`. Each package's `eslint.config.mjs` re-exports one.
- `packages/typescript-config/` (`@repo/typescript-config`) — `base.json` and
  `nextjs.json`, extended by each package's `tsconfig.json`.

**Where does new code go?** Default to `apps/web`. Promote to `packages/ui` only
when a second app would genuinely need it — a primitive, a theme token, a
generic display component. App-specific logic, routes, and data access stay in
the app.

Adding a package: create `packages/<name>` with a `package.json` named
`@repo/<name>`, then depend on it with `"@repo/<name>": "workspace:*"`. The
workspace globs already cover `apps/*` and `packages/*`.
