import type { Principle } from "./constants/principles";

export function PrincipleCard({ icon: Icon, title, description }: Principle) {
  return (
    <div className="group border-border bg-card/40 hover:border-foreground/20 hover:bg-card h-full rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
      <div className="border-border bg-background text-foreground group-hover:border-foreground/20 flex size-10 items-center justify-center rounded-xl border transition-colors">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
