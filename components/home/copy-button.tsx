"use client";

import { useState } from "react";

import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { copyText } from "./utils/copy";

type CopyButtonProps = {
  value: string;
  label?: string;
};

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!(await copyText(value))) {
      toast.error("Couldn't copy to clipboard");

      return;
    }

    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      aria-label={label}
      size="icon-sm"
      variant="ghost"
      onClick={handleCopy}
    >
      {copied ? (
        <CheckIcon className="text-emerald-500" />
      ) : (
        <CopyIcon className="text-muted-foreground" />
      )}
    </Button>
  );
}
