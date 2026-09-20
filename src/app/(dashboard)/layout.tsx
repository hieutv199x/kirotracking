import { Suspense } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureReady } from "@/lib/db";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureReady();
  const viewer = await getViewer();
  return (
    <Suspense fallback={<Skeleton className="h-12 w-full" />}>
      <AppShell viewerId={viewer.id} period="7d">
        {children}
      </AppShell>
    </Suspense>
  );
}
