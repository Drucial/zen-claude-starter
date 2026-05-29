import { CopyButton } from "./copy-button";

type CommandPillProps = {
  command: string;
};

export function CommandPill({ command }: CommandPillProps) {
  return (
    <div className="border-border bg-card/60 hover:border-foreground/20 flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-4 shadow-sm backdrop-blur transition-colors">
      <code className="font-mono text-sm">
        <span className="text-muted-foreground">$ </span>
        {command}
      </code>
      <CopyButton label="Copy command" value={command} />
    </div>
  );
}
