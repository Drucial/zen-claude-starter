"use client";

import { ArrowDownIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";

import { CommandPill } from "./command-pill";
import { CREATE_COMMAND, GITHUB_URL } from "./constants/links";
import { GitHubIcon } from "./github-icon";

export function Hero() {
  const shouldReduce = useReducedMotion();

  const item = shouldReduce
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
      };

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
        <motion.span
          {...item}
          className="border-border bg-card/50 text-muted-foreground rounded-full border px-3 py-1 font-mono text-xs"
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Next.js 16 · React 19 · Tailwind v4
        </motion.span>
        <motion.h1
          {...item}
          className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-6xl"
          transition={{ duration: 0.5, delay: 0.06, ease: "easeOut" }}
        >
          A calm foundation
          <br />
          for your next app.
        </motion.h1>
        <motion.p
          {...item}
          className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed text-pretty"
          transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
        >
          An opinionated starter that settles the small decisions — structure,
          data flow, conventions — so you can stay in flow and build.
        </motion.p>
        <motion.div
          {...item}
          className="mt-9"
          transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
        >
          <CommandPill command={CREATE_COMMAND} />
        </motion.div>
        <motion.div
          {...item}
          className="mt-6 flex items-center gap-3"
          transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
        >
          <Button asChild>
            <a href="#start">Get started</a>
          </Button>
          <Button asChild variant="outline">
            <a href={GITHUB_URL} rel="noreferrer" target="_blank">
              <GitHubIcon className="size-4" />
              GitHub
            </a>
          </Button>
        </motion.div>
        <motion.a
          {...item}
          aria-hidden
          className="text-muted-foreground hover:text-foreground mt-20 transition-colors"
          href="#principles"
          transition={{ duration: 0.5, delay: 0.36, ease: "easeOut" }}
        >
          <ArrowDownIcon className="size-5 animate-bounce [animation-duration:2s]" />
        </motion.a>
      </div>
    </section>
  );
}
