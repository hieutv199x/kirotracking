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
        className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-primary"
      >
        <CircleHelpIcon className="size-3.5" />
        <span className="sr-only">{title ?? "Explain"}</span>
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
    <div className="flex h-7 items-center gap-1">
      <h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="reveal flex flex-col gap-0.5">
      <h1 className="font-heading text-xl font-semibold tracking-tight text-primary md:text-2xl">
        {title}
      </h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
