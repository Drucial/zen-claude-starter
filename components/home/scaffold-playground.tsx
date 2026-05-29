"use client";

import { useState } from "react";

import { TerminalIcon } from "lucide-react";

import { CopyButton } from "./copy-button";
import { sanitizeProjectName } from "./utils/project-name";

const STEPS = [
  "Prompts for a name and where to create it",
  "Copies the template, then starts fresh git history",
  "Installs dependencies — ready to pnpm dev",
];

export function ScaffoldPlayground() {
  const [raw, setRaw] = useState("my-app");

  const name = sanitizeProjectName(raw) || "my-app";
  const command = `pnpm create-project ${name}`;

  return (
    <div className="border-border bg-card/40 rounded-2xl border p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm font-medium tracking-tight">
        <TerminalIcon className="text-muted-foreground size-4" />
        Start a project
      </div>
      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
        Name it below, copy the command, and run it from the repo.
      </p>
      <label
        className="text-muted-foreground mt-5 block text-xs font-medium"
        htmlFor="project-name"
      >
        Project name
      </label>
      <input
        className="border-border bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-1.5 w-full rounded-lg border px-3 py-2 font-mono text-sm transition-colors outline-none focus-visible:ring-3"
        id="project-name"
        placeholder="my-app"
        spellCheck={false}
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
      />
      <div className="border-border bg-muted/40 mt-4 flex items-center gap-2 rounded-lg border py-2 pr-2 pl-4">
        <code className="flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap">
          <span className="text-muted-foreground">$ </span>
          {command}
        </code>
        <CopyButton label="Copy command" value={command} />
      </div>
      <ul className="text-muted-foreground mt-5 space-y-2 text-sm">
        {STEPS.map((step) => (
          <li key={step} className="flex gap-2.5">
            <span
              aria-hidden
              className="bg-muted-foreground/60 mt-2 size-1 shrink-0 rounded-full"
            />
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}
