export const LAYOUTS = [
  {
    label: "Single app",
    detail: "One Next.js app in one repo",
    monorepo: false,
  },
  {
    label: "Monorepo",
    detail: "Turborepo workspace — apps/web + packages/ui",
    monorepo: true,
  },
];

/** The layout an answer picks, or undefined when it isn't a listed choice. */
export function selectLayout(answer) {
  const choice = Number(answer.trim() || "1");

  return Number.isInteger(choice) ? LAYOUTS[choice - 1] : undefined;
}
