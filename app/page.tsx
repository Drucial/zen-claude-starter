import { ModeToggle } from "@/components/layout/mode-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">Hello, world.</h1>
    </div>
  );
}
