import { react } from "@repo/eslint-config/react";

export default [
  ...react,
  {
    // shadcn primitives are vendored and re-fetched by the CLI — exempt them
    // from prop sorting (their multiline-prop-before-spread isn't autofixable).
    files: ["components/**"],
    rules: {
      "react/jsx-sort-props": "off",
    },
  },
];
