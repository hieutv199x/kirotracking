import { cn } from "@/lib/utils";

export function Meter({
  value,
  max,
  tone = "work",
  className,
}: {
  value: number;
  max: number;
  tone?: "work" | "wait" | "rework" | "lock" | "review";
  className?: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full", fillClass(tone))}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function StackedBar({
  parts,
  className,
  size = "md",
}: {
  parts: { key: string; n: number; tone: "work" | "wait" | "rework" | "lock" | "review" }[];
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.n), 0);
  const h = size === "lg" ? "h-3" : size === "sm" ? "h-1.5" : "h-2";
  if (total <= 0) {
    return <div className={cn(h, "rounded-full bg-muted", className)} />;
  }
  return (
    <div className={cn("flex overflow-hidden rounded-full bg-muted", h, className)}>
      {parts.map((p) =>
        p.n <= 0 ? null : (
          <div
            key={p.key}
            className={fillClass(p.tone)}
            style={{ width: `${(p.n / total) * 100}%` }}
          />
        ),
      )}
    </div>
  );
}

export function DualBar({
  work,
  wait,
  max,
  vertical = false,
  highlight = false,
}: {
  work: number;
  wait: number;
  max: number;
  vertical?: boolean;
  highlight?: boolean;
}) {
  const workPct = max <= 0 ? 0 : (work / max) * 100;
  const waitPct = max <= 0 ? 0 : (wait / max) * 100;
  if (vertical) {
    return (
      <div
        className={cn(
          "flex h-24 items-end justify-center gap-1 rounded-lg px-1",
          highlight && "bg-muted",
        )}
      >
        <div
          className="w-3 rounded-t-sm bg-foreground"
          style={{ height: `${Math.max(workPct, work > 0 ? 6 : 0)}%` }}
        />
        <div
          className="w-3 rounded-t-sm bg-muted-foreground/35"
          style={{ height: `${Math.max(waitPct, wait > 0 ? 6 : 0)}%` }}
        />
      </div>
    );
  }
  return (
    <div className={cn("flex h-2 overflow-hidden rounded-full bg-muted", highlight && "ring-1 ring-foreground")}>
      <div className="h-full bg-foreground" style={{ width: `${workPct}%` }} />
      <div className="h-full bg-muted-foreground/35" style={{ width: `${waitPct}%` }} />
    </div>
  );
}

export function LegendDot({
  tone,
  label,
}: {
  tone: "work" | "wait" | "rework" | "lock" | "review";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-2 rounded-full", fillClass(tone))} />
      {label}
    </span>
  );
}

function fillClass(tone: "work" | "wait" | "rework" | "lock" | "review") {
  switch (tone) {
    case "wait":
      return "bg-muted-foreground/35";
    case "rework":
      return "bg-destructive";
    case "review":
      return "bg-foreground/35";
    case "lock":
    case "work":
    default:
      return "bg-foreground";
  }
}
