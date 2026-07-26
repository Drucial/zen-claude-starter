// App-local `@/` paths that become cross-package `@repo/ui` imports once the
// primitives, `cn`, and the theme move out of the app and into packages/ui.
const RULES = [
  [/(["'])@\/components\/ui\//g, "$1@repo/ui/components/"],
  [/(["'])@\/utils\/cn(["'])/g, "$1@repo/ui/utils/cn$2"],
  [/(["'])\.\/globals\.css(["'])/g, "$1@repo/ui/styles/globals.css$2"],
];

export function rewriteImports(source) {
  return RULES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    source
  );
}
