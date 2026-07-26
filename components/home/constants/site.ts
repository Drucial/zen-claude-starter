// Set NEXT_PUBLIC_SITE_URL in the Vercel project (Production scope). Without
// it, Next falls back to the per-deployment preview hostname, which would put
// an ephemeral URL in every canonical tag and social card.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://zenstart.io";

export const SITE_NAME = "zen-claude-starter";

export const SITE_TITLE =
  "Next.js 16 Starter for Claude Code — React 19, Tailwind v4";

export const SITE_DESCRIPTION =
  "An opinionated Next.js 16, React 19, and Tailwind v4 starter template. Scaffold a single app or Turborepo monorepo with CLAUDE.md rules Claude Code follows.";

export const AUTHOR_NAME = "Drew White";
export const AUTHOR_URL = "https://github.com/Drucial";
