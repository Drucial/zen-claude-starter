"use server";

// Example server actions. Replace the bodies with a real data source
// (DB, external API). The starter ships no database on purpose.

export type User = {
  id: string;
  name: string;
  email: string;
};

export async function getUsers(): Promise<User[]> {
  return [];
}

export async function getUser(id: string): Promise<User | null> {
  void id;

  return null;
}

export async function createUser(input: {
  name: string;
  email: string;
}): Promise<User> {
  return { id: crypto.randomUUID(), ...input };
}
