import { FAQ } from "./constants/faq";
import { Reveal } from "./reveal";

export function Faq() {
  return (
    <section
      className="mx-auto max-w-3xl scroll-mt-16 px-4 py-24 sm:px-6"
      id="faq"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Questions worth asking first
        </h2>
      </Reveal>
      <dl className="mt-14 space-y-8">
        {FAQ.map((item) => (
          <Reveal key={item.question}>
            <dt className="text-base font-semibold tracking-tight">
              {item.question}
            </dt>
            <dd className="text-muted-foreground mt-2 leading-relaxed">
              {item.answer}
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
