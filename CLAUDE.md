# Project Guide

Next.js 16 + React 19 + Tailwind v4 starter. TypeScript strict, ESLint + Prettier enforced. Run `pnpm fix` to auto-format and fix lint; `pnpm check` to verify (format, lint, typecheck).

## Architecture

### Directory Structure

- `app/` — Next.js App Router routes, layouts, and server components
- `components/` — global, cross-feature components only
  - `ui/` — shadcn-style primitives (Button, Input, Dialog, etc.)
  - `layout/` — app shell: headers, nav, sidebar, footer
  - `shared/` — generic reusable components not tied to any feature
  - `<feature>/` or `<view>/` — feature- or view-specific component groups
- `hooks/` — global hooks, grouped per model for data access
- `context/` — global React context providers
- `utils/` — global utilities
- `api/` — external API clients and integration layer

Create top-level `components`, `hooks`, `context`, `utils` dirs only when the code is needed globally. Otherwise co-locate within the feature directory that owns it.

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

### Components: Presentation Only

- UI components stay presentational. Offload business logic to files in the associated `utils/` dir.
- Static data (e.g., `navItems = [...]`) belongs in a `constants/` file, never inline in a component.
- Components must not fetch or mutate data directly — they call hooks only.

### Data Fetching & Mutations

- **Database access**: use Next.js server actions. Never call the DB from a component.
- **Hooks per model**: group data hooks by model in `hooks/` (e.g., `hooks/use-users.ts`, `hooks/use-posts.ts`). Each file owns its model's queries and mutations.
- **TanStack Query**: wrap server actions in `useQuery` / `useMutation` inside the hook files. Components consume the hooks.
- **External APIs**: live in `api/`. Consume via hooks the same way — no direct fetch calls in components.

### File Size & Reuse

- Keep files small. Refactor by extracting subcomponents, utils, or constants before a file grows unwieldy.
- Don't duplicate logic across components or files — extract to a shared util or component.
- Prefer composing existing components over creating new ones. Check `components/ui/`, `components/shared/`, and `components/layout/` before adding anything new.
