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
  { href: "/", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/funnel", label: "8-step funnel", icon: FilterIcon },
  { href: "/stories", label: "Stories", icon: ListIcon },
  { href: "/people", label: "By person", icon: UsersIcon },
];

const MOBILE_NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/stories", label: "Stories", icon: ListIcon },
  { href: "/me", label: "Me", icon: UserIcon },
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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="hidden w-56 shrink-0 border-r border-sidebar-border bg-sidebar/95 backdrop-blur-sm md:flex md:flex-col">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GitCommitHorizontalIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="font-heading text-sm font-semibold tracking-tight text-primary">
              KiroTracking
            </div>
            <div className="text-[11px] text-muted-foreground">8-step loop → commit</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2 pb-4" aria-label="Primary">
          {DESKTOP_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={withParams(item.href, currentPeriod, currentViewer)}
                className={cn(
                  buttonVariants({ variant: active ? "secondary" : "ghost" }),
                  "cursor-pointer justify-start transition-colors duration-200",
                  active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
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
              "cursor-pointer justify-start transition-colors duration-200",
              pathname === "/me" && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            )}
          >
            <UserIcon data-icon="inline-start" />
            Me
          </Link>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-border/80 bg-background/85 px-4 py-2.5 backdrop-blur-md">
          <div className="mr-auto min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{ORG_NAME}</div>
            <div className="text-[11px] text-muted-foreground md:hidden">KiroTracking</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-border bg-card p-0.5" role="group" aria-label="Period">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    buttonVariants({
                      variant: currentPeriod === p ? "default" : "ghost",
                      size: "sm",
                    }),
                    "cursor-pointer transition-colors duration-200",
                    currentPeriod === p && "bg-primary text-primary-foreground",
                  )}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap rounded-md border border-border bg-card p-0.5" role="group" aria-label="Viewer">
              <Link
                href={viewerHref("lead")}
                className={cn(
                  buttonVariants({
                    variant: currentViewer === "lead" ? "default" : "ghost",
                    size: "sm",
                  }),
                  "cursor-pointer transition-colors duration-200",
                  currentViewer === "lead" && "bg-primary text-primary-foreground",
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
                      variant: currentViewer === d.id ? "default" : "ghost",
                      size: "sm",
                    }),
                    "cursor-pointer transition-colors duration-200",
                    currentViewer === d.id && "bg-primary text-primary-foreground",
                  )}
                >
                  {d.name.split(" ")[0]}
                </Link>
              ))}
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 md:px-6 md:py-6">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur-md md:hidden"
        aria-label="Mobile"
      >
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={withParams(item.href, currentPeriod, currentViewer)}
              className={cn(
                "flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className={cn("size-5", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
