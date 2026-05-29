import { ModeToggle } from "@/components/layout/mode-toggle";
import { Button } from "@/components/ui/button";

import { BrandMark } from "./brand-mark";
import { GITHUB_URL } from "./constants/links";
import { GitHubIcon } from "./github-icon";

export function HomeNav() {
  return (
    <header className="border-border/60 bg-background/70 sticky top-0 z-50 border-b backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a className="flex items-center gap-2" href="#top">
          <BrandMark className="text-foreground size-6" />
          <span className="text-sm font-semibold tracking-tight">zen</span>
          <span className="text-muted-foreground text-sm">starter</span>
        </a>
        <div className="flex items-center gap-1">
          <Button
            aria-label="GitHub repository"
            nativeButton={false}
            render={<a href={GITHUB_URL} rel="noreferrer" target="_blank" />}
            size="icon"
            variant="ghost"
          >
            <GitHubIcon className="size-4" />
          </Button>
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}
