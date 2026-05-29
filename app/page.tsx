import { Guides } from "@/components/home/guides";
import { Hero } from "@/components/home/hero";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeNav } from "@/components/home/home-nav";
import { Principles } from "@/components/home/principles";
import { Stack } from "@/components/home/stack";

export default function Home() {
  return (
    <div className="min-h-screen" id="top">
      <HomeNav />
      <main>
        <Hero />
        <Principles />
        <Stack />
        <Guides />
      </main>
      <HomeFooter />
    </div>
  );
}
