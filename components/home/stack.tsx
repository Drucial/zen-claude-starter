import { ArrowUpRightIcon } from "lucide-react";

import { STACK } from "./constants/stack";
import { Reveal } from "./reveal";

export function Stack() {
  return (
    <section
      className="border-border/60 bg-muted/20 scroll-mt-16 border-y"
      id="stack"
    >
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            The stack: Next.js 16, React 19, Tailwind v4
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Modern, well-documented tools. Follow any thread to its source.
          </p>
        </Reveal>
        <Reveal className="border-border/60 mt-12 border-t">
          <ul>
            {STACK.map((item) => (
              <li key={item.name}>
                <a
                  className="group border-border/60 hover:bg-card/60 flex items-center gap-4 border-b px-2 py-4 transition-colors"
                  href={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="w-36 shrink-0 text-sm font-medium tracking-tight sm:w-44">
                    {item.name}
                  </span>
                  <span className="text-muted-foreground hidden flex-1 text-sm sm:block">
                    {item.description}
                  </span>
                  <span className="text-muted-foreground ml-auto font-mono text-xs sm:ml-0">
                    {item.version}
                  </span>
                  <ArrowUpRightIcon className="text-muted-foreground group-hover:text-foreground size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
