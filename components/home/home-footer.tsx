import { BrandMark } from "./brand-mark";
import { GITHUB_URL, NPM_URL } from "./constants/links";
import { GitHubIcon } from "./github-icon";

export function HomeFooter() {
  return (
    <footer className="border-border/60 border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <BrandMark className="text-foreground size-5" />
          <span className="text-foreground font-medium">zen starter</span>
          <span>· built for calm work</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            href={NPM_URL}
            rel="noreferrer"
            target="_blank"
          >
            zen-claude-starter on npm
          </a>
          <a
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
            href={GITHUB_URL}
            rel="noreferrer"
            target="_blank"
          >
            <GitHubIcon className="size-4" />
            View on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
