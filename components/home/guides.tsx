import { CodeBlock } from "./code-block";
import { GUIDES } from "./constants/guides";
import { Reveal } from "./reveal";
import { ScaffoldPlayground } from "./scaffold-playground";

export function Guides() {
  return (
    <section
      className="mx-auto max-w-3xl scroll-mt-16 px-4 py-24 sm:px-6"
      id="start"
    >
      <Reveal>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Find your footing
        </h2>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
          Start a project, then reach for the patterns you&apos;ll use on day
          one.
        </p>
      </Reveal>
      <Reveal className="mt-12">
        <ScaffoldPlayground />
      </Reveal>
      <div className="mt-12 space-y-12">
        {GUIDES.map((guide, index) => (
          <Reveal key={guide.title} delay={index * 0.05}>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                {guide.title}
              </h3>
              <p className="text-muted-foreground mt-2 mb-4 text-sm leading-relaxed">
                {guide.description}
              </p>
              <CodeBlock code={guide.code} language={guide.language} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
