"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  GitCommitHorizontalIcon,
  LayoutDashboardIcon,
  ListIcon,
  FilterIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { DEVELOPERS, ORG_NAME, PERIODS, PERIOD_LABELS, type Period } from "@/lib/catalog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DESKTOP_NAV = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboardIcon },
  { href: "/funnel", label: "Phễu 8 bước", icon: FilterIcon },
  { href: "/stories", label: "Story", icon: ListIcon },
  { href: "/people", label: "Theo người", icon: UsersIcon },
];

const MOBILE_NAV = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboardIcon },
  { href: "/stories", label: "Story", icon: ListIcon },
  { href: "/me", label: "Tôi", icon: UserIcon },
];

function withParams(href: string, period: string, viewer: string) {
  const url = new URL(href, "http://local");
  url.searchParams.set("period", period);
  if (viewer && viewer !== "lead") url.searchParams.set("viewer", viewer);
  else url.searchParams.delete("viewer");
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export function AppShell({
  children,
  viewerId,
  period,
}: {
  children: React.ReactNode;
  viewerId: string;
  period: Period;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPeriod = (searchParams.get("period") as Period) || period;
  const currentViewer = searchParams.get("viewer") || viewerId;

  function setPeriod(next: Period) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  function viewerHref(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "lead") params.delete("viewer");
    else params.set("viewer", next);
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="hidden w-56 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-2 px-4 py-4">
          <GitCommitHorizontalIcon className="text-foreground" />
          <div>
            <div className="font-heading text-sm font-medium">KiroTracking</div>
            <div className="text-xs text-muted-foreground">Loop 8 bước</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {DESKTOP_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={withParams(item.href, currentPeriod, currentViewer)}
                className={cn(
                  buttonVariants({ variant: active ? "secondary" : "ghost" }),
                  "justify-start",
                )}
              >
                <item.icon data-icon="inline-start" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href={withParams("/me", currentPeriod, currentViewer)}
            className={cn(
              buttonVariants({ variant: pathname === "/me" ? "secondary" : "ghost" }),
              "justify-start",
            )}
          >
            <UserIcon data-icon="inline-start" />
            Tôi
          </Link>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="mr-auto text-sm font-medium">{ORG_NAME}</div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    buttonVariants({
                      variant: currentPeriod === p ? "secondary" : "ghost",
                      size: "sm",
                    }),
                  )}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap rounded-lg border p-0.5">
              <Link
                href={viewerHref("lead")}
                className={cn(
                  buttonVariants({
                    variant: currentViewer === "lead" ? "secondary" : "ghost",
                    size: "sm",
                  }),
                )}
              >
                Lead
              </Link>
              {DEVELOPERS.map((d) => (
                <Link
                  key={d.id}
                  href={viewerHref(d.id)}
                  className={cn(
                    buttonVariants({
                      variant: currentViewer === d.id ? "secondary" : "ghost",
                      size: "sm",
                    }),
                  )}
                >
                  {d.name.split(" ")[0]}
                </Link>
              ))}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={withParams(item.href, currentPeriod, currentViewer)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
