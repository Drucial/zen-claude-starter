export type Guide = {
  title: string;
  description: string;
  language: string;
  code: string;
};

export const GUIDES: Guide[] = [
  {
    title: "Add a UI component",
    description:
      "Vendor a shadcn primitive into components/ui with the new-york style, then compose it. Pass props and variants rather than restyling.",
    language: "bash",
    code: "pnpm dlx shadcn@latest add card dialog",
  },
  {
    title: "Fetch and mutate with TanStack Query",
    description:
      "Define a typed query factory beside the model, call it directly, and reach for the shared useAppMutation wrapper to write.",
    language: "tsx",
    code: `// hooks/posts/posts.queries.ts
import { queryOptions } from "@tanstack/react-query";

import { getPosts } from "./posts.actions";

export const postQueries = {
  all: () => queryOptions({ queryKey: ["posts"], queryFn: getPosts }),
};

// in a client component
const { data } = useQuery(postQueries.all());

const createPost = useAppMutation({
  mutationFn: createPost,
  successMessage: "Post published",
  invalidates: [postQueries.all().queryKey],
});`,
  },
  {
    title: "Validate with Zod",
    description:
      "Keep a form's schema and its inferred type in the form file, where the coupling is obvious. Parse on submit for typed, validated input.",
    language: "tsx",
    code: `// components/contact/contact-form.tsx
import { z } from "zod";

const contactSchema = z.object({
  email: z.email(),
  message: z.string().min(1, "Required"),
});

type ContactInput = z.infer<typeof contactSchema>;

function onSubmit(values: ContactInput) {
  const result = contactSchema.safeParse(values);
  if (!result.success) return result.error;
  // result.data is typed and validated
}`,
  },
  {
    title: "Write a test",
    description:
      "Co-locate it in a __tests__ dir beside the file. Cover utils, hooks, and server actions. Leave the markup alone.",
    language: "tsx",
    code: `// utils/__tests__/slugify.test.ts
import { describe, expect, it } from "vitest";

import { slugify } from "@/utils/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
});`,
  },
];
