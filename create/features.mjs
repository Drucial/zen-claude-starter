/**
 * Dependency groups the scaffolder can leave out. The ids match the `feature`
 * tags in transforms/manifest.mjs, which is what drops their packages.
 */
export const FEATURES = [
  {
    id: "query",
    label: "TanStack Query",
    detail: "Client cache + useAppMutation",
    flag: "--no-query",
  },
  {
    id: "zod",
    label: "Zod",
    detail: "Schema validation",
    flag: "--no-zod",
  },
  {
    id: "motion",
    label: "Motion",
    detail: "Animation",
    flag: "--no-motion",
  },
];

export const FEATURE_IDS = FEATURES.map((feature) => feature.id);

export function excludedFeatures(selected) {
  return FEATURE_IDS.filter((id) => !selected.has(id));
}
