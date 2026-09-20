"use client";

import { useState } from "react";
import Link from "next/link";
import { LOOP_STAGES, STAGE_LABELS, type LoopStage, type Period } from "@/lib/catalog";
import { formatDuration, formatNumber, formatPct } from "@/lib/format";
import type { FunnelStep, StoryListItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export function FunnelBoard({
  funnel,
  standing,
  period,
}: {
  funnel: FunnelStep[];
  standing: Record<LoopStage, StoryListItem[]>;
  period: Period;
}) {
  const [open, setOpen] = useState<LoopStage | null>(null);
  const list = open ? standing[open] ?? [] : [];

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {LOOP_STAGES.map((stage, i) => {
          const step = funnel.find((f) => f.stage === stage);
          if (!step) return null;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setOpen(stage)}
              className="text-left"
            >
              <Card size="sm" className="h-full hover:bg-muted/40">
                <CardHeader>
                  <CardDescription>
                    Bậc {i + 1} · {STAGE_LABELS[stage]}
                  </CardDescription>
                  <CardTitle>{formatNumber(step.entered)} đã vào</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <div>{formatNumber(step.standing)} đang đứng</div>
                  <div>Trung vị {formatDuration(step.median_ms)}</div>
                  <div>
                    Đi tiếp {step.conversion == null ? "—" : formatPct(step.conversion)}
                  </div>
                  {stage === "spec_lock" && step.extra?.lk03_median != null ? (
                    <div>LK-03 trung vị {formatNumber(step.extra.lk03_median)} lần trả</div>
                  ) : null}
                  {stage === "review" && step.extra ? (
                    <div>
                      RV-02 trung vị {formatNumber(step.extra.rv02_blocker_median ?? 0)}{" "}
                      blocker · {formatNumber(step.extra.rv02_major_median ?? 0)} major
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
      <Sheet open={open != null} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {open ? `Đang đứng — ${STAGE_LABELS[open]}` : "Story"}
            </SheetTitle>
            <SheetDescription>Story đang kẹt ở bậc này trong kỳ đang chọn.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4 pb-4">
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có story đang đứng ở bậc này.</p>
            ) : (
              list.map((s) => (
                <Link
                  key={s.story_id}
                  href={`/stories/${s.story_id}?period=${period}`}
                  className="flex items-center justify-between rounded-lg border p-2 text-sm"
                >
                  <span>{s.story_id}</span>
                  <Badge variant="outline">{s.developer_name}</Badge>
                </Link>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
