export type Rule = {
  title: string;
  description: string;
};

export const RULES: Rule[] = [
  {
    title: "CLAUDE.md ships with the project",
    description:
      "Every scaffold carries its own CLAUDE.md and .claude/rules/ covering that project's structure, data flow, and naming. The first prompt lands inside the lines.",
  },
  {
    title: "The rules match the layout you chose",
    description:
      "Scaffold a monorepo and the docs describe apps/web and packages/ui. Leave TanStack Query out and the data-access rules cover server actions, so nothing points at code you never installed.",
  },
  {
    title: "Enforcement lives in the linter",
    description:
      "Import order, prop order, alias imports, effect discipline. An agent that ignores the guidance fails pnpm check, and pnpm check gates CI.",
  },
  {
    title: "Fresh containers work on the first try",
    description:
      "A SessionStart hook installs dependencies when a remote Claude Code session boots. Checks and tests run on the first try rather than failing on a missing node_modules.",
  },
];
