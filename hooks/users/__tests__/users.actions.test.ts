import { describe, expect, it } from "vitest";

import { createUser, getUser, getUsers } from "@/hooks/users/users.actions";

describe("getUsers", () => {
  it("returns an empty list until wired to a data source", async () => {
    await expect(getUsers()).resolves.toEqual([]);
  });
});

describe("getUser", () => {
  it("returns null until wired to a data source", async () => {
    await expect(getUser("abc")).resolves.toBeNull();
  });
});

describe("createUser", () => {
  it("keeps the caller's fields", async () => {
    const user = await createUser({ name: "Ada", email: "ada@example.com" });

    expect(user).toMatchObject({ name: "Ada", email: "ada@example.com" });
  });

  it("assigns a unique id", async () => {
    const input = { name: "Ada", email: "ada@example.com" };
    const [first, second] = await Promise.all([
      createUser(input),
      createUser(input),
    ]);

    expect(first.id).not.toBe(second.id);
  });
});
