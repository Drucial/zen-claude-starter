export type StackItem = {
  name: string;
  version: string;
  description: string;
  href: string;
};

export const STACK: StackItem[] = [
  {
    name: "Next.js",
    version: "16",
    description: "The React framework — App Router, server actions, Turbopack.",
    href: "https://nextjs.org/docs",
  },
  {
    name: "React",
    version: "19",
    description: "UI library with Server Components and the new compiler era.",
    href: "https://react.dev",
  },
  {
    name: "TypeScript",
    version: "5",
    description: "Typed JavaScript, strict mode on, no implicit escapes.",
    href: "https://www.typescriptlang.org/docs",
  },
  {
    name: "Tailwind CSS",
    version: "v4",
    description: "Utility-first styling, configured entirely in CSS.",
    href: "https://tailwindcss.com/docs",
  },
  {
    name: "TanStack Query",
    version: "v5",
    description: "Async state, caching, and mutations done right.",
    href: "https://tanstack.com/query/latest/docs/framework/react/overview",
  },
  {
    name: "Zod",
    version: "4",
    description: "Schema validation with static type inference.",
    href: "https://zod.dev",
  },
  {
    name: "shadcn · Radix",
    version: "new-york",
    description: "Unstyled primitives you vendor and own outright.",
    href: "https://ui.shadcn.com/docs",
  },
  {
    name: "next-themes",
    version: "0.4",
    description: "Light, dark, and system themes without the flash.",
    href: "https://github.com/pacocoursey/next-themes",
  },
  {
    name: "Sonner",
    version: "2.0",
    description: "Calm, opinionated toast notifications.",
    href: "https://sonner.emilkowal.ski",
  },
  {
    name: "Motion",
    version: "12",
    description: "Production-ready animation and micro-interactions.",
    href: "https://motion.dev/docs/react",
  },
  {
    name: "Turborepo",
    version: "2",
    description: "Task graph and caching for the monorepo layout.",
    href: "https://turborepo.com/docs",
  },
  {
    name: "Vitest",
    version: "4",
    description: "Fast unit tests with React Testing Library.",
    href: "https://vitest.dev",
  },
];
