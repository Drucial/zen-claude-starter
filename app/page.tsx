import type { Metadata } from "next";

import { GITHUB_URL } from "@/components/home/constants/links";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/components/home/constants/site";
import { Faq } from "@/components/home/faq";
import { Guides } from "@/components/home/guides";
import { Hero } from "@/components/home/hero";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeNav } from "@/components/home/home-nav";
import { JsonLd } from "@/components/home/json-ld";
import { Principles } from "@/components/home/principles";
import { Rules } from "@/components/home/rules";
import { Stack } from "@/components/home/stack";

// Marketing metadata lives here rather than in the layout: the scaffolder
// overwrites app/page.tsx wholesale, so none of it can reach a generated app.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  keywords: [
    "next.js starter",
    "next.js 16",
    "react 19",
    "tailwind v4",
    "turborepo monorepo starter",
    "claude code",
    "CLAUDE.md",
    "ai coding agent",
    "typescript starter template",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { "max-image-preview": "large", "max-snippet": -1 },
  },
  other: { "github:repo": GITHUB_URL },
};

export default function Home() {
  return (
    <div className="min-h-screen" id="top">
      <JsonLd />
      <HomeNav />
      <main>
        <Hero />
        <Principles />
        <Rules />
        <Stack />
        <Guides />
        <Faq />
      </main>
      <HomeFooter />
    </div>
  );
}
