"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DEVELOPERS, LOOP_STAGES, STAGE_LABELS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StoryFilters({ showPerson }: { showPerson: boolean }) {
  const router = useRouter();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`/stories?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Step"
        className="h-8 cursor-pointer rounded-md border border-input bg-card px-2 text-sm transition-colors duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        value={params.get("stage") ?? "all"}
        onChange={(e) => set("stage", e.target.value)}
      >
        <option value="all">All steps</option>
        {LOOP_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
      {showPerson ? (
        <select
          aria-label="Person"
          className="h-8 cursor-pointer rounded-md border border-input bg-card px-2 text-sm transition-colors duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
          value={params.get("person") ?? "all"}
          onChange={(e) => set("person", e.target.value)}
        >
          <option value="all">Everyone</option>
          {DEVELOPERS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      ) : null}
      <Button
        size="sm"
        variant={params.get("rework") === "1" ? "default" : "outline"}
        className={cn("cursor-pointer transition-colors duration-200")}
        onClick={() => set("rework", params.get("rework") === "1" ? "" : "1")}
      >
        Rework
      </Button>
      <Button
        size="sm"
        variant={params.get("d08lock") === "3" ? "default" : "outline"}
        className={cn("cursor-pointer transition-colors duration-200")}
        onClick={() => set("d08lock", params.get("d08lock") === "3" ? "" : "3")}
      >
        Spec lock ≥ 3
      </Button>
    </div>
  );
}
