"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DEVELOPERS, LOOP_STAGES, STAGE_LABELS } from "@/lib/catalog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <Select
        value={params.get("stage") ?? "all"}
        onValueChange={(v) => set("stage", String(v ?? "all"))}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Mọi stage</SelectItem>
            {LOOP_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {showPerson ? (
        <Select
          value={params.get("person") ?? "all"}
          onValueChange={(v) => set("person", String(v ?? "all"))}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Người" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Mọi người</SelectItem>
              {DEVELOPERS.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : null}
      <Button
        size="sm"
        variant={params.get("rework") === "1" ? "secondary" : "outline"}
        onClick={() => set("rework", params.get("rework") === "1" ? "" : "1")}
      >
        Chỉ rework
      </Button>
      <Button
        size="sm"
        variant={params.get("d08lock") === "3" ? "secondary" : "outline"}
        onClick={() => set("d08lock", params.get("d08lock") === "3" ? "" : "3")}
      >
        D-08 khóa spec ≥ 3
      </Button>
    </div>
  );
}
