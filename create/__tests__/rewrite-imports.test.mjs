// @vitest-environment node
import { describe, expect, it } from "vitest";

import { rewriteImports } from "../transforms/rewrite-imports.mjs";

describe("rewriteImports", () => {
  it("points ui primitives at the shared package", () => {
    expect(
      rewriteImports('import { Button } from "@/components/ui/button";')
    ).toBe('import { Button } from "@repo/ui/components/button";');
  });

  it("rewrites multi-line primitive imports", () => {
    const source = [
      "import {",
      "  DropdownMenu,",
      "  DropdownMenuContent,",
      '} from "@/components/ui/dropdown-menu";',
    ].join("\n");

    expect(rewriteImports(source)).toContain(
      '"@repo/ui/components/dropdown-menu"'
    );
  });

  it("rewrites the cn helper", () => {
    expect(rewriteImports('import { cn } from "@/utils/cn";')).toBe(
      'import { cn } from "@repo/ui/utils/cn";'
    );
  });

  it("rewrites the stylesheet side-effect import", () => {
    expect(rewriteImports('import "./globals.css";')).toBe(
      'import "@repo/ui/styles/globals.css";'
    );
  });

  it("handles single quotes", () => {
    expect(rewriteImports("import { cn } from '@/utils/cn';")).toBe(
      "import { cn } from '@repo/ui/utils/cn';"
    );
  });

  it("leaves app-local aliases alone", () => {
    const source = [
      'import { Providers } from "@/components/layout/providers";',
      'import { useAppMutation } from "@/hooks/use-app-mutation";',
    ].join("\n");

    expect(rewriteImports(source)).toBe(source);
  });

  it("does not touch a utils import that only looks like cn", () => {
    const source = 'import { cnFormat } from "@/utils/cn-format";';

    expect(rewriteImports(source)).toBe(source);
  });
});
