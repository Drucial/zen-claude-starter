import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type RevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Scroll-reveal driven entirely by CSS — see `.reveal` in globals.css.
 *
 * Deliberately not a client component: the previous version rendered
 * `opacity: 0` into the SSR HTML and only revealed it once an
 * IntersectionObserver fired, so every section below the fold was blank until
 * hydration. Here the content is visible by default and the animation only
 * attaches where the browser supports it and the reader hasn't asked for less
 * motion.
 */
export function Reveal({ children, className }: RevealProps) {
  return <div className={cn("reveal", className)}>{children}</div>;
}
