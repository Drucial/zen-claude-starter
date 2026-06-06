# Code Quality

React 19 + Next.js 16 (App Router) + TypeScript (strict) + Tailwind v4. These are
hard conventions for this repo — not conditional on stack.

## Anti-defaults (counter common Claude tendencies)

- No premature abstractions. Three similar lines beats a helper used once.
- Don't add features or improvements beyond what was asked.
- Don't refactor adjacent code while fixing a bug.
- No dead code or commented-out blocks.
- WHY comments only, never WHAT. If code needs a "what" comment, rename instead.
- Keep comments terse and concise
- Don't modify generated files (`*.gen.*`, `*.generated.*`).
- Don't use map indexes as keys. Use real unique identifiers — indices shift with mutations.
- No IIFEs, ever. Never invoke a function inline to produce a value — including
  `await`-ing or calling a helper inside JSX (`{(() => {…})()}`, `{await fn()}`).
  Do the work in the component body and assign it to a named variable, or pull it
  into a named function the body calls.

## Naming

- **Files**: kebab-case (`entry-card.tsx`, `auth-client.ts`, `use-entry-phase.ts`).
- **Component exports**: PascalCase (`EntryCard`).
- **Hooks**: `use-*.ts` files; camelCase exports (`useEntryPhase`).
- **Booleans**: `is` / `has` / `should` / `can` prefix.
- **Functions**: verb-first (`getUser`, `createEntry`).
- **Constants**: `SCREAMING_SNAKE`.

## Code markers

- `TODO(@drew): desc` for planned work.
- `FIXME(@drew): desc (#issue)` for known bugs.
- `HACK(@drew): desc` for ugly workarounds (explain the proper fix).
- Never `XXX`, `TEMP`, `REMOVEME`.

## TypeScript

- Never use `any` — use proper types, `unknown`, or generics.
- Avoid type casting (`as`) — fix the root types instead.
- Use `import type` for type-only imports.
- Prefer `type` over `interface`.
- Remove unused imports/vars entirely — no underscore prefixes.

## React discipline

- **Server Components by default.** Reach for `"use client"` only when the component
  needs interactivity, state, effects, or browser APIs.
- **Presentation only.** Components render; business logic lives in the associated
  `utils/` dir. Components never embed non-trivial logic.
- **No state-sync in effects.** Don't mirror props/state into other state with
  `useEffect(() => setX(prop), [prop])` — derive the value during render instead.
  Enforced by `eslint-plugin-react-you-might-not-need-an-effect` (strict).
- **No reflexive memoization.** Don't add `useMemo`/`useCallback`/`React.memo` by
  default. Add only with a measured, profiled reason.
- **Accessible by default.** Every interactive control ships with an accessible
  name — icon-only buttons and standalone checkboxes/inputs get an `aria-label`
  (include the item it acts on, e.g. `Check ${name}`) or an associated `<label>`.
  Generic labels ("Expand", "Edit") are ambiguous in lists — name the target.
  Never ship an unlabeled control.
- **`nativeButton={false}` when rendering a Base UI button as a non-button.**
  Base UI button-like primitives (`Button`, `Tabs.Tab`, etc.) default
  `nativeButton` to `true` and throw a console error when their `render` prop is
  an `<a>`/`<Link>`. Whenever you pass `render={<Link …/>}` (or any non-`<button>`)
  to one, set `nativeButton={false}`.

## Constants

- **Collections** (arrays/objects/tables, e.g. `NAV_ITEMS = [...]`) belong in a
  `constants/` file — never inline in a component.
- **Scalars** (e.g. `DELAY_TIME = 300`) may stay inline.

## Forms & validation

- **Form schemas live in the form file.** A form's zod schema and its inferred
  input type are defined in the same component file as the form — never in a
  co-located `utils/schemas.ts`. They're tightly coupled to the form and
  shouldn't be hunted down elsewhere. (A schema genuinely shared by multiple
  forms is the rare exception — only then promote it to a shared module.)

## Shared formatters & cross-cutting utils

- **Anything that enforces consistency across views lives in common `utils/`**,
  never co-located in a feature `utils/` dir. Formatters and similar helpers that
  turn a value into a display string (`formatDate`, `formatCurrency`,
  `formatName`, …) belong there so the whole app reads that value one consistent
  way.
- This applies to **cross-cutting output only**. Logic tied to a single feature —
  bucketing, filtering, navigation — stays with that feature.

## Data access

See `CLAUDE.md` → Data Fetching & Mutations for the full flow. In short:

- **Server Components** may read data directly via server actions.
- **Client Components** never fetch directly — consume queries via
  `useQuery(queryOptions…)` and mutations via the shared `useAppMutation` wrapper.

## Reuse before build

Search before creating anything new.

- **UI primitives** (highest priority): check `components/ui/`, then
  `components/shared/`, then `components/layout/`. If it exists, compose with it —
  pass props/variants instead of restyling. If not, confirm before creating one.
- **Hooks**: grep the relevant `hooks/<feature>/` dir for `use-{concept}` first. All hooks live under `hooks/`, never co-located with feature components.
- **Utilities**: grep `utils/` and feature `utils/` dirs before adding a helper.
- **Validations / schemas**: check the schema home before adding a new one.
- **Never modify shared UI** (`components/ui/`, `components/shared/`) behavior or API
  without an explicit ask — many places consume it.

## Tests

- **Tests ship with the logic.** Any PR that adds or changes testable logic
  (`utils/`, hooks, server actions) includes its tests in the same PR — never a
  follow-up. Run `pnpm test:coverage` before opening a PR.
- Test logic, not presentation. Cover `utils/`, hooks, server actions, and other
  business logic. Don't write tests for presentational UI components.
- Co-locate tests with the file under test in a `__tests__/` dir next to it
  (e.g. `hooks/users/__tests__/use-users.test.ts`).
- Name test files `<name>.test.ts` / `<name>.test.tsx`.

## File size

- Keep files small. Extract subcomponents, utils, or constants before a file grows
  unwieldy.
- Don't duplicate logic across components or files — extract to a shared util or
  component.
