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

function withPeriod(href: string, period: string) {
  const url = new URL(href, "http://local");
  url.searchParams.set("period", period);
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

  function setPeriod(next: Period) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  function setViewer(next: string) {
    document.cookie = `kt_viewer=${encodeURIComponent(next)}; Path=/; SameSite=Lax`;
    void fetch("/api/viewer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ viewer: next }),
    });
    router.refresh();
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
                href={withPeriod(item.href, currentPeriod)}
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
            href={withPeriod("/me", currentPeriod)}
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

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="mr-auto">
            <div className="text-sm font-medium">{ORG_NAME}</div>
            <div className="text-xs text-muted-foreground">Dashboard visualization</div>
          </div>
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
            <select
              aria-label="Người xem"
              value={viewerId}
              onChange={(e) => void setViewer(e.target.value)}
              className="h-8 min-w-40 rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="lead">Lead · {ORG_NAME}</option>
              {DEVELOPERS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="flex-1 px-4 py-4 md:px-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={withPeriod(item.href, currentPeriod)}
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
