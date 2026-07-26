import { RULES } from "./constants/rules";
import { Reveal } from "./reveal";

export function Rules() {
  return (
    <section
      className="border-border/60 bg-card/20 scroll-mt-16 border-y"
      id="rules"
    >
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Rules Claude Code actually follows
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Conventions an agent can read, in a shape the toolchain can enforce.
          </p>
        </Reveal>
        <dl className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {RULES.map((rule) => (
            <Reveal key={rule.title}>
              <dt className="text-base font-semibold tracking-tight">
                {rule.title}
              </dt>
              <dd className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {rule.description}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
