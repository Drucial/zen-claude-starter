export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ: FaqItem[] = [
  {
    question: "Does this work with Claude Code?",
    answer:
      "Every project it scaffolds carries a CLAUDE.md and a .claude/rules/ directory covering that project's structure, data flow, and naming. ESLint holds the same line on import order, prop order, and effect discipline, so pnpm check fails when an agent drifts from it.",
  },
  {
    question: "Single app or monorepo?",
    answer:
      "You choose when you scaffold. The monorepo splits the same code into apps/web and packages/ui under Turborepo, sharing @repo/eslint-config and @repo/typescript-config. Script names match the single-app layout, so pnpm check means the same thing in both.",
  },
  {
    question: "Can I leave out TanStack Query, Zod, or Motion?",
    answer:
      "Yes. Those three are the only optional dependencies. Drop Query and the scaffolder also removes useAppMutation, the query hooks, and the QueryClientProvider, then rewrites the data-access rules in CLAUDE.md to describe server actions.",
  },
  {
    question: "Do I need to clone the repo?",
    answer:
      "No. Run npx zen-claude-starter from any directory. It asks for a name, a layout, the dependencies you want, and where to put the project.",
  },
  {
    question: "Can I switch layouts later?",
    answer:
      "No command does it for you. Moving a single app into a workspace means creating the package directories and relocating files by hand. Scaffold the monorepo up front if you expect a second app.",
  },
  {
    question: "How do I update a project after scaffolding?",
    answer:
      "You don't. The scaffolder copies the code once and steps back. After that first commit the files belong to your repo, and later releases of the starter leave them alone.",
  },
];
