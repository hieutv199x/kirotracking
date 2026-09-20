import Link from "next/link";
import { notFound } from "next/navigation";
import { DEVELOPER_NAMES, ORG_ID, STAGE_LABELS } from "@/lib/catalog";
import { ensureReady } from "@/lib/db";
import { getStoryDetail, parsePeriod } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";
import { StoryTimeline } from "@/components/dashboard/story-timeline";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ storyId: string }>;
  searchParams: Promise<{ period?: string; viewer?: string }>;
}) {
  await ensureReady();
  const { storyId } = await params;
  const { period: periodParam, viewer: viewerParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const viewer = await getViewer(viewerParam);
  const detail = getStoryDetail(ORG_ID, storyId);
  if (!detail) notFound();
  if (viewer.role === "developer" && detail.rollup.developer_id !== viewer.id) {
    notFound();
  }
  const { rollup, events } = detail;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/stories?period=${period}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          ← Story
        </Link>
        <h1 className="font-heading text-lg font-medium">{rollup.story_id}</h1>
        <Badge variant="outline">
          {DEVELOPER_NAMES[rollup.developer_id] ?? rollup.developer_id}
        </Badge>
        <Badge variant="secondary">
          {rollup.current_stage ? STAGE_LABELS[rollup.current_stage] : rollup.status}
        </Badge>
      </div>
      <StoryTimeline rollup={rollup} events={events} />
    </div>
  );
}
