import "./globals.css";

import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/layout/providers";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Mono is used in the eyebrow, code blocks, and version column — never in the
// LCP text — so it shouldn't compete for priority with the heading font.
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  preload: false,
});

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
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}
      lang="en"
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
