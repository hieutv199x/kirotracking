import { cn } from "@/lib/utils";

export type BarTone = "work" | "wait" | "rework" | "lock" | "review" | "ok" | "cta";

export function Meter({
  value,
  max,
  tone = "work",
  className,
}: {
  value: number;
  max: number;
  tone?: BarTone;
  className?: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-sm bg-muted", className)}>
      <div
        className={cn("meter-fill h-full rounded-sm", fillClass(tone))}
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
  parts: { key: string; n: number; tone: BarTone }[];
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.n), 0);
  const h = size === "lg" ? "h-3" : size === "sm" ? "h-1.5" : "h-2";
  if (total <= 0) {
    return <div className={cn(h, "rounded-sm bg-muted", className)} />;
  }
  return (
    <div className={cn("meter-fill flex overflow-hidden rounded-sm bg-muted", h, className)}>
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
          "flex h-28 items-end justify-center gap-1 rounded-md px-1 transition-colors duration-200",
          highlight && "bg-accent ring-1 ring-cta/40",
        )}
      >
        <div
          className="meter-fill-y w-3 rounded-t-sm bg-work"
          style={{ height: `${Math.max(workPct, work > 0 ? 8 : 0)}%` }}
        />
        <div
          className="meter-fill-y w-3 rounded-t-sm bg-wait"
          style={{ height: `${Math.max(waitPct, wait > 0 ? 8 : 0)}%` }}
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex h-1.5 overflow-hidden rounded-sm bg-muted transition-shadow duration-200",
        highlight && "ring-1 ring-cta",
      )}
    >
      <div
        className="meter-fill h-full bg-work"
        style={{ width: `${workPct}%` }}
      />
      <div
        className="meter-fill h-full bg-wait"
        style={{ width: `${waitPct}%` }}
      />
    </div>
  );
}

export function LegendDot({
  tone,
  label,
}: {
  tone: BarTone;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-2 rounded-sm", fillClass(tone))} />
      {label}
    </span>
  );
}

function fillClass(tone: BarTone) {
  switch (tone) {
    case "wait":
      return "bg-wait";
    case "rework":
      return "bg-destructive";
    case "review":
      return "bg-secondary-foreground/45";
    case "lock":
      return "bg-primary";
    case "ok":
      return "bg-ok";
    case "cta":
      return "bg-cta";
    case "work":
    default:
      return "bg-work";
  }
}
