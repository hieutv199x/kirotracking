import { LOOP_STAGES, ORG_ID, type LoopStage } from "@/lib/catalog";
import { ensureReady } from "@/lib/db";
import { getOverview, getStories, parsePeriod } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";
import { FunnelBoard } from "@/components/dashboard/funnel-board";
import { FunnelEmpty, OrgEmpty, PeriodEmpty } from "@/components/dashboard/empty-states";
import { StaleBanner } from "@/components/dashboard/stale-banner";
import { standingByStage } from "@/components/dashboard/overview-panel";

export const dynamic = "force-dynamic";

export default async function FunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; stand?: string; viewer?: string }>;
}) {
  await ensureReady();
  const { period: periodParam, stand, viewer: viewerParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const selected =
    stand && (LOOP_STAGES as readonly string[]).includes(stand)
      ? (stand as LoopStage)
      : null;
  const viewer = await getViewer(viewerParam);
  const scope = viewer.role === "developer" ? viewer.id : undefined;
  const data = getOverview(ORG_ID, period, scope);
  const stories = getStories(ORG_ID, period, { developerId: scope });
  const standing = standingByStage(stories);
  const enteredLock = data.funnel.find((s) => s.stage === "spec_lock")?.entered ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <StaleBanner stale={data.stale} />
      {data.org_empty ? (
        <OrgEmpty />
      ) : data.period_empty ? (
        <PeriodEmpty period={period} />
      ) : enteredLock === 0 ? (
        <FunnelEmpty />
      ) : (
        <FunnelBoard
          funnel={data.funnel}
          standing={standing}
          period={period}
          selected={selected}
          viewerId={viewer.id}
        />
      )}
    </div>
  );
}
