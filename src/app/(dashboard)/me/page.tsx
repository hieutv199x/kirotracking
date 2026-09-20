import { ORG_ID } from "@/lib/catalog";
import { ensureReady } from "@/lib/db";
import { getOverview, getStories, parsePeriod } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";
import { OverviewPanel, standingByStage } from "@/components/dashboard/overview-panel";
import { StoryList } from "@/components/dashboard/story-list";
import { MeEmpty } from "@/components/dashboard/empty-states";

export const dynamic = "force-dynamic";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; viewer?: string }>;
}) {
  await ensureReady();
  const { period: periodParam, viewer: viewerParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const viewer = await getViewer(viewerParam);
  if (viewer.role !== "developer") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-lg font-medium">Tôi</h1>
        <MeEmpty />
      </div>
    );
  }
  const data = getOverview(ORG_ID, period, viewer.id);
  const stories = getStories(ORG_ID, period, { developerId: viewer.id });
  const standing = standingByStage(stories);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-lg font-medium">Tôi · {viewer.name}</h1>
      {stories.length === 0 ? (
        <MeEmpty />
      ) : (
        <>
          <OverviewPanel data={data} standing={standing} />
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-sm font-medium">Story của tôi</h2>
            <StoryList stories={stories} period={period} />
          </section>
        </>
      )}
    </div>
  );
}
