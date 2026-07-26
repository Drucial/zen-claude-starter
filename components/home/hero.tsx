import { ArrowDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CommandPill } from "./command-pill";
import { CREATE_COMMAND, GITHUB_URL } from "./constants/links";
import { GitHubIcon } from "./github-icon";

// A Server Component on purpose. The entrance runs on CSS so the hero needs no
// hydration, and the h1 animates by transform alone — an element at opacity 0
// is not an LCP candidate, so fading it in would gate the metric on JS.
export function Hero() {
  return (
    <section className="relative scroll-mt-16 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-muted)_0%,transparent_70%)] opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent,var(--color-background))]"
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-28 text-center sm:px-6 sm:py-36">
        <span className="border-border bg-card/50 text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-3 rounded-full border px-3 py-1 font-mono text-xs duration-500">
          Next.js 16 · React 19 · Tailwind v4
        </span>
        <h1 className="animate-in slide-in-from-bottom-3 mt-6 text-5xl font-semibold tracking-tight text-balance duration-500 sm:text-6xl">
          A calm Next.js 16 starter, built for Claude Code
        </h1>
        <p className="text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-3 mt-6 max-w-xl text-lg leading-relaxed text-pretty delay-100 duration-500">
          An opinionated starter that settles structure, data flow, and
          conventions — with CLAUDE.md rules so your agent writes code that
          already fits. Single app or Turborepo monorepo.
        </p>
        <div className="animate-in fade-in-0 slide-in-from-bottom-3 mt-9 delay-200 duration-500">
          <CommandPill command={CREATE_COMMAND} />
        </div>
        <div className="animate-in fade-in-0 slide-in-from-bottom-3 mt-6 flex items-center gap-3 delay-300 duration-500">
          <Button asChild>
            <a href="#start">Scaffold a project</a>
          </Button>
          <Button asChild variant="outline">
            <a href={GITHUB_URL} rel="noreferrer" target="_blank">
              <GitHubIcon className="size-4" />
              GitHub
            </a>
          </Button>
        </div>
        <a
          aria-label="Skip to principles"
          className="text-muted-foreground hover:text-foreground animate-in fade-in-0 mt-20 transition-colors delay-500 duration-500"
          href="#principles"
        >
          <ArrowDownIcon className="size-5 animate-bounce [animation-duration:2s]" />
        </a>
      </div>
    </section>
  );
}
