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
      "Server Components by default. Reach for the client when a component needs state, effects, or the browser.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Conventions, enforced",
    description:
      "ESLint and Prettier settle imports, props, and types before review, so nobody spends a comment on them.",
  },
  {
    icon: WorkflowIcon,
    title: "A clear data flow",
    description:
      "Server actions read. Typed query factories and one mutation wrapper handle the client. You follow a path someone already walked.",
  },
  {
    icon: Minimize2Icon,
    title: "No needless abstraction",
    description:
      "Three plain lines beat a clever helper used once. Build what this feature needs and stop.",
  },
  {
    icon: FlaskConicalIcon,
    title: "Tested where it counts",
    description:
      "Cover utils, hooks, and server actions. Leave the markup free to change without breaking a suite.",
  },
  {
    icon: LeafIcon,
    title: "Calm by structure",
    description:
      "Every file has a predictable home, so you spend your attention on the feature instead of the wiring.",
  },
];
