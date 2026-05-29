import { queryOptions } from "@tanstack/react-query";

import { getUser, getUsers } from "./users.actions";

// queryOptions factories co-locate the query key, queryFn, and config in one
// typed place. Call them directly: `useQuery(userQueries.all())`. Don't wrap in
// a custom hook unless there's real shared logic (combined queries, polling).
export const userQueries = {
  all: () =>
    queryOptions({
      queryKey: ["users"],
      queryFn: getUsers,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ["users", id],
      queryFn: () => getUser(id),
    }),
};
