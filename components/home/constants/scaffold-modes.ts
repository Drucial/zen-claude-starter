export type ScaffoldMode = {
  id: "single" | "monorepo";
  label: string;
  flag: string;
  steps: string[];
};

// A fixed pair rather than an open array, so the first entry is the guaranteed
// default under noUncheckedIndexedAccess.
export const SCAFFOLD_MODES: [ScaffoldMode, ScaffoldMode] = [
  {
    id: "single",
    label: "Single app",
    flag: "",
    steps: [
      "Run it bare to be prompted for layout, name, and location",
      "Copies the template, then starts fresh git history",
      "Installs dependencies — ready to pnpm dev",
    ],
  },
  {
    id: "monorepo",
    label: "Monorepo",
    flag: " --monorepo",
    steps: [
      "Splits the template into apps/web and packages/ui",
      "Adds @repo/eslint-config, @repo/typescript-config, and Turborepo",
      "Root pnpm check and pnpm build fan out across packages",
    ],
  },
];
