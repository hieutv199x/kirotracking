import { KpiRow } from "./kpi-row";
import { BottleneckRow } from "./bottleneck-row";
import { GatesRow } from "./gates-row";
import { D08Bar } from "./d08-bar";
import { FunnelBoard } from "./funnel-board";
import { StaleBanner } from "./stale-banner";
import { OrgEmpty, PeriodEmpty } from "./empty-states";
import type { OverviewPayload, StoryListItem } from "@/lib/types";
import type { LoopStage, Period } from "@/lib/catalog";

export function OverviewPanel({
  data,
  standing,
  showFunnel = false,
  selectedStage = null,
}: {
  data: OverviewPayload;
  standing: Record<LoopStage, StoryListItem[]>;
  showFunnel?: boolean;
  selectedStage?: LoopStage | null;
}) {
  if (data.org_empty) return <OrgEmpty />;
  if (data.period_empty) return <PeriodEmpty period={data.period} />;
  return (
    <div className="flex flex-col gap-5">
      <StaleBanner stale={data.stale} />
      <KpiRow data={data} />
      {showFunnel ? (
        <FunnelBoard
          compact
          funnel={data.funnel}
          standing={standing}
          period={data.period}
          selected={selectedStage}
        />
      ) : null}
      <BottleneckRow data={data} />
      <GatesRow data={data} />
      <D08Bar data={data} />
    </div>
  );
}

export function standingByStage(
  stories: StoryListItem[],
): Record<LoopStage, StoryListItem[]> {
  const out = {
    intake: [],
    spec_gen: [],
    spec_lock: [],
    testcase: [],
    implement: [],
    test: [],
    review: [],
    commit: [],
  } as Record<LoopStage, StoryListItem[]>;
  for (const s of stories) {
    if (s.status === "open" && s.current_stage) out[s.current_stage].push(s);
  }
  return out;
}

export function periodFromData(period: Period) {
  return period;
}
