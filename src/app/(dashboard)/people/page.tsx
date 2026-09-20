import { ORG_ID } from "@/lib/catalog";
import { ensureReady } from "@/lib/db";
import { getPeople, orgHasAnyStory, parsePeriod } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";
import { PeopleTable } from "@/components/dashboard/people-table";
import { OrgEmpty, PeriodEmpty } from "@/components/dashboard/empty-states";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; viewer?: string }>;
}) {
  await ensureReady();
  const { period: periodParam, viewer: viewerParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const viewer = await getViewer(viewerParam);
  const scope = viewer.role === "developer" ? viewer.id : undefined;
  const rows = getPeople(ORG_ID, period, scope);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-lg font-medium">Theo người</h1>
      {!orgHasAnyStory(ORG_ID) ? (
        <OrgEmpty />
      ) : rows.length === 0 ? (
        <PeriodEmpty period={period} />
      ) : (
        <PeopleTable rows={rows} />
      )}
    </div>
  );
}
