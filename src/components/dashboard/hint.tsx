"use client";

import type { ReactNode } from "react";
import { CircleHelpIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Hint({ children }: { children: ReactNode }) {
  const title = typeof children === "string" ? children : undefined;
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        title={title}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <CircleHelpIcon className="size-3.5" />
        <span className="sr-only">{title ?? "Giải thích"}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-56 text-left leading-snug">{children}</TooltipContent>
    </Tooltip>
  );
}

export function SectionHead({
  title,
  hint,
}: {
  title: string;
  hint?: ReactNode;
}) {
  return (
    <div className="flex h-8 items-center gap-1">
      <h2 className="font-heading text-sm font-medium">{title}</h2>
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}
