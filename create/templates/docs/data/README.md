- **Data access.** Server Components read directly via server actions. Client
  Components never fetch directly — they take server-fetched data as props and
  mutate by calling a server action, then revalidating. See `hooks/users/` for
  the server-action pattern.
