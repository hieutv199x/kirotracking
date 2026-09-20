import { ORG_ID } from "@/lib/catalog";
import { ensureReady } from "@/lib/db";
import { getOverview, getStories, parsePeriod } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";
import { OverviewPanel, standingByStage } from "@/components/dashboard/overview-panel";
import { PageTitle } from "@/components/dashboard/hint";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; viewer?: string }>;
}) {
  await ensureReady();
  const { period: periodParam, viewer: viewerParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const viewer = await getViewer(viewerParam);
  const scope = viewer.role === "developer" ? viewer.id : undefined;
  const data = getOverview(ORG_ID, period, scope);
  const stories = getStories(ORG_ID, period, { developerId: scope });
  const standing = standingByStage(stories);
  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Overview"
        subtitle="8-step loop health — commits, cycle time, bottlenecks, first-pass gates."
      />
      <OverviewPanel data={data} standing={standing} showFunnel />
    </div>
  );
}
