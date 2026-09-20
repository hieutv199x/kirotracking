"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DEVELOPERS, LOOP_STAGES, STAGE_LABELS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

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
        aria-label="Bước"
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
        value={params.get("stage") ?? "all"}
        onChange={(e) => set("stage", e.target.value)}
      >
        <option value="all">Mọi bước</option>
        {LOOP_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
      {showPerson ? (
        <select
          aria-label="Người"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          value={params.get("person") ?? "all"}
          onChange={(e) => set("person", e.target.value)}
        >
          <option value="all">Mọi người</option>
          {DEVELOPERS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      ) : null}
      <Button
        size="sm"
        variant={params.get("rework") === "1" ? "secondary" : "outline"}
        onClick={() => set("rework", params.get("rework") === "1" ? "" : "1")}
      >
        Làm lại
      </Button>
      <Button
        size="sm"
        variant={params.get("d08lock") === "3" ? "secondary" : "outline"}
        onClick={() => set("d08lock", params.get("d08lock") === "3" ? "" : "3")}
      >
        Khóa spec ≥ 3
      </Button>
    </div>
  );
}
