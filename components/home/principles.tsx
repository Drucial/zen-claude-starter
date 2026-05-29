import { PRINCIPLES } from "./constants/principles";
import { PrincipleCard } from "./principle-card";
import { Reveal } from "./reveal";

export function Principles() {
  return (
    <section
      className="mx-auto max-w-5xl scroll-mt-16 px-4 py-24 sm:px-6"
      id="principles"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Opinionated, on purpose
        </h2>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
          Fewer decisions to make. More room to think.
        </p>
      </Reveal>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRINCIPLES.map((principle, index) => (
          <Reveal key={principle.title} delay={index * 0.05}>
            <PrincipleCard {...principle} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
