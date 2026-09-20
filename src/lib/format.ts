export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatCount(
  n: number | null | undefined,
  unit: string,
  empty = `No ${unit} yet`,
) {
  if (n == null) return empty;
  if (n === 0) return `No ${unit}`;
  return `${formatNumber(n)} ${unit}`;
}

export function formatTimes(n: number | null | undefined) {
  if (n == null) return "not counted";
  if (n === 0) return "none";
  return `${formatNumber(n)}×`;
}

export function formatPct(rate: number | null) {
  if (rate == null) return "n/a";
  return `${Math.round(rate * 100)}%`;
}

export function formatShare(
  rate: number | null,
  clause: string,
  empty = "Not enough data for a rate",
) {
  if (rate == null) return empty;
  if (rate === 0) return `No ${clause}`;
  return `${Math.round(rate * 100)}% ${clause}`;
}

export function formatDuration(
  ms: number | null | undefined,
  opts: { empty?: string; zero?: string } = {},
) {
  const empty = opts.empty ?? "not measured";
  const zero = opts.zero ?? empty;
  if (ms == null || Number.isNaN(ms)) return empty;
  if (ms <= 0) return zero;
  const hours = ms / 3_600_000;
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(ms / 60_000));
    return `${formatNumber(minutes)} min`;
  }
  if (hours < 48) {
    const h = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
    return `${formatNumber(h)} h`;
  }
  const days = hours / 24;
  const d = days >= 10 ? Math.round(days) : Math.round(days * 10) / 10;
  return `${formatNumber(d)} d`;
}

export function durationParts(ms: number | null | undefined): {
  value: string;
  unit: string;
} | null {
  if (ms == null || Number.isNaN(ms) || ms <= 0) return null;
  const hours = ms / 3_600_000;
  if (hours < 1) {
    return { value: formatNumber(Math.max(1, Math.round(ms / 60_000))), unit: "min" };
  }
  if (hours < 48) {
    const h = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
    return { value: formatNumber(h), unit: "h" };
  }
  const days = hours / 24;
  const d = days >= 10 ? Math.round(days) : Math.round(days * 10) / 10;
  return { value: formatNumber(d), unit: "d" };
}

/** Hours (fractional) for chart axes — easier to compare than mixed units. */
export function msToHours(ms: number | null | undefined) {
  if (ms == null || Number.isNaN(ms) || ms <= 0) return 0;
  return Math.round((ms / 3_600_000) * 10) / 10;
}

export function pctInt(rate: number | null | undefined) {
  if (rate == null) return null;
  return Math.round(rate * 100);
}

export function formatMedianP90(medianMs: number | null, p90Ms: number | null) {
  if (medianMs == null) {
    return {
      value: "Not measured",
      detail: "No committed stories in this period — cycle time needs a commit.",
    };
  }
  return {
    value: `Median ${formatDuration(medianMs)}`,
    detail: `9 of 10 stories finish within ${formatDuration(p90Ms)} (p90). Median, not mean.`,
  };
}

function d08Part(n: number, when: string) {
  if (n === 0) return `none at ${when}`;
  return `${formatNumber(n)}× at ${when}`;
}

export function formatD08Split(specLock: number, review: number, other = 0) {
  const parts = [d08Part(specLock, "spec lock"), d08Part(review, "review")];
  if (other > 0) parts.push(`${formatNumber(other)}× at other steps`);
  return parts.join(" · ");
}
