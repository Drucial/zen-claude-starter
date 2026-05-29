import { CopyButton } from "./copy-button";

type CodeBlockProps = {
  code: string;
  language?: string;
};

export function CodeBlock({ code, language = "bash" }: CodeBlockProps) {
  return (
    <div className="border-border bg-card/40 overflow-hidden rounded-xl border">
      <div className="border-border/60 flex items-center justify-between border-b py-1.5 pr-1.5 pl-4">
        <span className="text-muted-foreground font-mono text-xs tracking-wide">
          {language}
        </span>
        <CopyButton label="Copy code" value={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-[0.8125rem] leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
