import type { LucideIcon } from "lucide-react";
import {
  FlaskConicalIcon,
  LeafIcon,
  Minimize2Icon,
  ServerIcon,
  ShieldCheckIcon,
  WorkflowIcon,
} from "lucide-react";

export type Principle = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const PRINCIPLES: Principle[] = [
  {
    icon: ServerIcon,
    title: "Server-first",
    description:
      "Server Components by default. Reach for the client only when interactivity truly calls for it.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Conventions, enforced",
    description:
      "ESLint and Prettier hold the line on imports, props, and types — so reviews stay about ideas.",
  },
  {
    icon: WorkflowIcon,
    title: "A clear data flow",
    description:
      "Server actions, typed query factories, and one mutation wrapper. The path is already laid out.",
  },
  {
    icon: Minimize2Icon,
    title: "No needless abstraction",
    description:
      "Three plain lines beat a clever helper used once. Build only what the moment asks for.",
  },
  {
    icon: FlaskConicalIcon,
    title: "Tested where it counts",
    description:
      "Cover the logic — utils, hooks, actions — and leave presentation free to change.",
  },
  {
    icon: LeafIcon,
    title: "Calm by structure",
    description:
      "A predictable home for every file, so your attention stays on the work, not the wiring.",
  },
];
