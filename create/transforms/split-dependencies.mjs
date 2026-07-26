import { PACKAGES, TARGETS, WORKSPACE_ONLY_PACKAGES } from "./manifest.mjs";

function emptyBuckets() {
  return Object.fromEntries(
    TARGETS.map((target) => [target, { dependencies: {}, devDependencies: {} }])
  );
}

function sortKeys(record) {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b))
  );
}

/**
 * Fan the template's dependencies out across the workspace packages.
 *
 * A package missing from the manifest throws rather than silently vanishing —
 * adding a dependency to the starter has to be an explicit placement decision,
 * which is what keeps the workspace layout from drifting away from the app.
 */
export function splitDependencies(pkg) {
  const buckets = emptyBuckets();
  const missing = [];

  for (const field of ["dependencies", "devDependencies"]) {
    for (const [name, version] of Object.entries(pkg[field] ?? {})) {
      const entry = PACKAGES[name];

      if (!entry) {
        missing.push(name);
        continue;
      }

      for (const target of entry.targets) {
        buckets[target][field][name] = version;
      }
    }
  }

  if (missing.length) {
    throw new Error(
      `unplaced ${missing.length === 1 ? "dependency" : "dependencies"}: ${missing.join(", ")}. ` +
        "Add each to PACKAGES in create/transforms/manifest.mjs with its targets and feature."
    );
  }

  for (const [name, entry] of Object.entries(WORKSPACE_ONLY_PACKAGES)) {
    const field = entry.dev ? "devDependencies" : "dependencies";

    for (const target of entry.targets) {
      buckets[target][field][name] = entry.version;
    }
  }

  return Object.fromEntries(
    Object.entries(buckets).map(([target, fields]) => [
      target,
      {
        dependencies: sortKeys(fields.dependencies),
        devDependencies: sortKeys(fields.devDependencies),
      },
    ])
  );
}
