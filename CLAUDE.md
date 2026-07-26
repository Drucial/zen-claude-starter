# Project Guide

Next.js 16 + React 19 + Tailwind v4 starter. TypeScript strict, ESLint + Prettier enforced. Run `pnpm fix` to auto-format and fix lint; `pnpm check` to verify (format, lint, typecheck).

Code conventions (naming, anti-defaults, React discipline, reuse): @.claude/rules/code-quality.md

## Communication

Speak plainly and concisely. No filler, no preamble, no restating the question. Still surface what matters — the plan before a multi-step change, the root cause of a bug, tradeoffs in a decision — just say it directly and stop. Prefer a short answer over a long one when both are complete.

## Branching & PRs

- **1 unit of work = 1 branch = 1 PR.** Scope each PR as a cohesive,
  independently-shippable chunk. Don't split tightly-related work that ships
  together — deps + the layer that consumes them, a shell + the routes it renders,
  a schema + its CRUD all belong in one PR. Don't over-group either: independent
  slices that could ship on their own get their own PR.
- **Keep PR descriptions lean.** A clear title and a short description of the goal
  and scope is enough. Skip exhaustive checklists and boilerplate unless the work
  genuinely needs them.

## Architecture

### Directory Structure

<!-- layout:start -->

- `app/` — Next.js App Router routes, layouts, and server components
- `components/` — global, cross-feature components only
  - `ui/` — shadcn-style primitives (Button, Input, Dialog, etc.)
  - `layout/` — app shell: headers, nav, sidebar, footer
  - `shared/` — generic reusable components not tied to any feature
  - `<feature>/` or `<view>/` — feature- or view-specific component groups
- `hooks/` — all hooks live here, organized into per-feature/model subdirs (e.g. `hooks/users/`). Never co-locate hooks with feature components.
- `context/` — global React context providers
- `utils/` — global utilities
- `api/` — external API clients and integration layer

Create top-level `components`, `context`, `utils` dirs only when the code is needed globally; otherwise co-locate within the feature directory that owns it. Hooks are the exception — they always live under `hooks/`, never co-located.

<!-- layout:end -->

### Component Co-location

Feature and view component directories should co-locate their own `utils/` and `constants/` subdirectories when the component needs them:

```
components/dashboard/
  dashboard.tsx
  dashboard-header.tsx
  utils/
    format-metrics.ts
  constants/
    nav-items.ts
```

### Data Fetching & Mutations

- **Database access**: use Next.js server actions. Never call the DB from a component.
- **Server Components**: may read data directly via server actions.
- **Client Components**: never fetch directly. Consume queries and mutations as below.
- **Queries**: define `queryOptions()` factories in the model's hooks dir (e.g. `hooks/users/users.queries.ts`) and call them directly with `useQuery(userQueries.all())`. Keys + `queryFn` + config live in one typed place. Promote to a custom hook only when there's real shared logic (combined queries, polling, derived state).
- **Mutations**: use the shared `useAppMutation` wrapper, which standardizes success/error toasts and an `invalidates: [...]` option. Write a per-model mutation hook only when a mutation needs logic beyond toast + invalidation. **Invalidate by query-key reference, not raw arrays** — pass the factory's key (`invalidates: [todoQueries.all().queryKey]`), never a hand-written `[["todos"]]`, so keys live in one typed place and can't drift.
- **External APIs**: live in `api/`. Consume the same way — no direct fetch calls in client components.
