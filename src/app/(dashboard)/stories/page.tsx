import { ORG_ID, type LoopStage } from "@/lib/catalog";
import { ensureReady } from "@/lib/db";
import { getStories, orgHasAnyStory, parsePeriod } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";
import { StoryList } from "@/components/dashboard/story-list";
import { StoryFilters } from "@/components/dashboard/story-filters";
import { OrgEmpty, PeriodEmpty } from "@/components/dashboard/empty-states";

export const dynamic = "force-dynamic";

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    stage?: string;
    person?: string;
    rework?: string;
    d08lock?: string;
  }>;
}) {
  await ensureReady();
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const viewer = await getViewer();
  const scope = viewer.role === "developer" ? viewer.id : params.person;
  const stories = getStories(ORG_ID, period, {
    developerId: scope,
    stage: params.stage as LoopStage | undefined,
    rework: params.rework === "1",
    d08LockMin: params.d08lock === "3" ? 3 : undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">Story</h1>
      <StoryFilters showPerson={viewer.role === "lead"} />
      {!orgHasAnyStory(ORG_ID) ? (
        <OrgEmpty />
      ) : stories.length === 0 ? (
        <PeriodEmpty period={period} />
      ) : (
        <StoryList stories={stories} period={period} />
      )}
    </div>
  );
}
