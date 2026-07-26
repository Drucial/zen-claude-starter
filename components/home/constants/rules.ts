export type Rule = {
  title: string;
  description: string;
};

export const RULES: Rule[] = [
  {
    title: "CLAUDE.md ships with the project",
    description:
      "Every scaffold carries its own CLAUDE.md and .claude/rules/ describing that project's layout, data flow, and naming — so the first prompt already lands inside the lines.",
  },
  {
    title: "The rules match the layout you chose",
    description:
      "Scaffold a monorepo and the docs describe apps/web and packages/ui. Leave TanStack Query out and the data-access rules describe server actions instead of code that isn't there.",
  },
  {
    title: "The linter is the enforcement, not the prompt",
    description:
      "Import order, prop order, type-over-interface, alias imports, effect discipline. An agent that ignores the guidance fails pnpm check, which fails CI.",
  },
  {
    title: "Fresh containers work on the first try",
    description:
      "A SessionStart hook installs dependencies when a remote Claude Code session boots, so checks and tests run immediately instead of erroring on a missing node_modules.",
  },
];
