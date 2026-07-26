- **UI primitives** (highest priority): check `packages/ui/components/`, then the
  app's own `components/layout/`. If it exists, compose with it — pass
  props/variants instead of restyling. If not, confirm before creating one, and
  confirm where it belongs: shared primitives go in `packages/ui`, app-specific
  components stay in `apps/web`.
- **Hooks**: grep the app's `hooks/<feature>/` dir for `use-{concept}` first. All
  hooks live under `hooks/`, never co-located with feature components.
- **Utilities**: grep `packages/ui/utils/` and the app's `utils/` dirs before
  adding a helper.
- **Validations / schemas**: check the schema home before adding a new one.
- **Never modify shared packages** (`packages/ui`, `packages/eslint-config`,
  `packages/typescript-config`) behavior or API without an explicit ask — every
  app consumes them.
