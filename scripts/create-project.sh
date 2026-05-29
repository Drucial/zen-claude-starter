#!/usr/bin/env bash
# Scaffold a new project from this template into a fresh, git-initialized dir.
# Usage: pnpm create-project [name] [parent-dir] [--yes]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Template root is the parent of this script's scripts/ dir.
TEMPLATE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

die() {
  printf '\033[31merror:\033[0m %s\n' "$1" >&2
  exit 1
}
info() { printf '\033[36m%s\033[0m\n' "$1"; }

usage() {
  cat <<'EOF'
Scaffold a new project from this template.

Usage: pnpm create-project [name] [parent-dir] [--yes]

  name         Project name (lowercase letters, digits, hyphens). Prompted if omitted.
  parent-dir   Directory to create the project in. Prompted if omitted.
  -y, --yes    Skip the confirmation prompt.
EOF
}

command -v git >/dev/null 2>&1 || die "git is required"
[ -d "$TEMPLATE_DIR/.git" ] || die "must be run from inside the template git repository"

skip_confirm=0
positional=()
for arg in "$@"; do
  case "$arg" in
    -y | --yes) skip_confirm=1 ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*) die "unknown option: $arg" ;;
    *) positional+=("$arg") ;;
  esac
done

name="${positional[0]:-}"
parent="${positional[1]:-}"

# A valid npm package name: lowercase, starts alphanumeric, hyphen-separated.
while :; do
  [ -n "$name" ] || read -rp "Project name (lowercase, e.g. my-app): " name
  if printf '%s' "$name" | grep -Eq '^[a-z0-9][a-z0-9-]*$'; then
    break
  fi
  echo "Invalid name. Use lowercase letters, digits, and hyphens."
  name=""
done

default_parent="$(cd "$TEMPLATE_DIR/.." && pwd)"
if [ -z "$parent" ]; then
  read -rp "Create in which directory? [$default_parent]: " parent
  parent="${parent:-$default_parent}"
fi
parent="${parent/#\~/$HOME}"
mkdir -p "$parent" || die "cannot create parent directory: $parent"
parent="$(cd "$parent" && pwd)"
target="$parent/$name"

[ -e "$target" ] && die "destination already exists: $target"

echo
info "Template : $TEMPLATE_DIR"
info "New app  : $target"
if [ "$skip_confirm" -eq 0 ]; then
  read -rp "Proceed? [Y/n]: " confirm
  case "${confirm:-Y}" in
    [Yy]*) ;;
    *)
      echo "Aborted."
      exit 0
      ;;
  esac
fi

# Snapshot the current working copy (tracked files incl. uncommitted changes),
# excluding everything gitignored (node_modules, .next, .env, …). Falls back to
# HEAD when the tree is clean.
snapshot="$(git -C "$TEMPLATE_DIR" stash create || true)"
snapshot="${snapshot:-HEAD}"
mkdir -p "$target"
git -C "$TEMPLATE_DIR" archive --format=tar "$snapshot" | tar -xf - -C "$target"

# The scaffolder itself is template-only — don't carry it into the new project.
rm -f "$target/scripts/create-project.sh"
rmdir "$target/scripts" 2>/dev/null || true

# Rewrite project identity: package name, README mentions, page title.
TARGET="$target" PNAME="$name" node <<'NODE'
const fs = require("fs");
const path = require("path");

const target = process.env.TARGET;
const name = process.env.PNAME;
const pretty = name
  .split("-")
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(" ");

const pkgPath = path.join(target, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const oldName = pkg.name;
pkg.name = name;
pkg.version = "0.1.0";
if (pkg.scripts) delete pkg.scripts["create-project"];
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const readmePath = path.join(target, "README.md");
if (fs.existsSync(readmePath)) {
  const md = fs.readFileSync(readmePath, "utf8").split(oldName).join(name);
  fs.writeFileSync(readmePath, md);
}

const layoutPath = path.join(target, "app", "layout.tsx");
if (fs.existsSync(layoutPath)) {
  const src = fs
    .readFileSync(layoutPath, "utf8")
    .replace(/title:\s*"[^"]*"/, `title: "${pretty}"`);
  fs.writeFileSync(layoutPath, src);
}
NODE

git -C "$target" init -q
git -C "$target" add -A
# Disable signing for the scaffold commit so a broken/absent signing setup
# can't block project creation; sign later commits as usual.
git -C "$target" -c commit.gpgsign=false commit -qm "Initial commit"

if command -v pnpm >/dev/null 2>&1; then
  info "Installing dependencies…"
  (cd "$target" && pnpm install)
else
  echo "pnpm not found — skipping install. Run 'pnpm install' in the new project."
fi

echo
info "Done. Next steps:"
echo "  cd \"$target\""
echo "  pnpm dev"
