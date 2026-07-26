See `CLAUDE.md` → Data Fetching & Mutations for the full flow. In short:

- **Server Components** read data directly via server actions.
- **Client Components** never fetch directly — take server-fetched data as
  props, and mutate by calling a server action and revalidating.
