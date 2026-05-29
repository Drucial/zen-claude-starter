import "./globals.css";

import type { ReactNode } from "react";
import type { Metadata } from "next";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  title: "Next Starter",
  description: "A Next.js 16 + React 19 + Tailwind v4 starter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      lang="en"
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
