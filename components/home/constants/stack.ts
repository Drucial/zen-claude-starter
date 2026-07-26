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
    description: "App Router, server actions, and Turbopack builds.",
    href: "https://nextjs.org/docs",
  },
  {
    name: "React",
    version: "19",
    description:
      "Server Components, and the compiler that ends manual memoization.",
    href: "https://react.dev",
  },
  {
    name: "TypeScript",
    version: "5",
    description: "Strict mode on, with no implicit any to slip through.",
    href: "https://www.typescriptlang.org/docs",
  },
  {
    name: "Tailwind CSS",
    version: "v4",
    description:
      "Utility-first styling, configured in CSS with no JS config file.",
    href: "https://tailwindcss.com/docs",
  },
  {
    name: "TanStack Query",
    version: "v5",
    description:
      "Caching, refetching, and mutations you would otherwise hand-roll.",
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
    description: "Accessible primitives you vendor and then own outright.",
    href: "https://ui.shadcn.com/docs",
  },
  {
    name: "next-themes",
    version: "0.4",
    description: "Light, dark, and system themes with no flash on load.",
    href: "https://github.com/pacocoursey/next-themes",
  },
  {
    name: "Sonner",
    version: "2.0",
    description: "Toasts that stay out of the way.",
    href: "https://sonner.emilkowal.ski",
  },
  {
    name: "Motion",
    version: "12",
    description: "Animation and micro-interactions that survive production.",
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
    description: "Unit tests through React Testing Library, run by Vite.",
    href: "https://vitest.dev",
  },
];
