export function formatNumber(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function formatPct(rate: number | null) {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function formatDuration(ms: number | null | undefined) {
  if (ms == null || Number.isNaN(ms)) return "—";
  const abs = Math.max(0, ms);
  const hours = abs / 3_600_000;
  if (hours < 1) {
    const minutes = Math.round(abs / 60_000);
    return `${formatNumber(minutes)} phút`;
  }
  if (hours < 48) {
    const h = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
    return `${formatNumber(h).replace(".", ",")} giờ`;
  }
  const days = hours / 24;
  const d = days >= 10 ? Math.round(days) : Math.round(days * 10) / 10;
  return `${formatNumber(d).replace(".", ",")} ngày`;
}

export function formatCyclePair(medianMs: number | null, p90Ms: number | null) {
  return `Trung vị ${formatDuration(medianMs)} · p90 ${formatDuration(p90Ms)}`;
}
