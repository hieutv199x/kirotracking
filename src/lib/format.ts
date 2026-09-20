export function formatNumber(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function formatCount(
  n: number | null | undefined,
  unit: string,
  empty = `Chưa có ${unit}`,
) {
  if (n == null) return empty;
  if (n === 0) return `Không có ${unit}`;
  return `${formatNumber(n)} ${unit}`;
}

export function formatTimes(n: number | null | undefined) {
  if (n == null) return "chưa đếm được";
  if (n === 0) return "không lần nào";
  return `${formatNumber(n)} lần`;
}

export function formatPct(rate: number | null) {
  if (rate == null) return "chưa tính được";
  return `${Math.round(rate * 100)}%`;
}

export function formatShare(
  rate: number | null,
  clause: string,
  empty = "Chưa đủ dữ liệu để tính tỷ lệ",
) {
  if (rate == null) return empty;
  if (rate === 0) return `Không có ${clause}`;
  return `${Math.round(rate * 100)}% ${clause}`;
}

export function formatDuration(
  ms: number | null | undefined,
  opts: { empty?: string; zero?: string } = {},
) {
  const empty = opts.empty ?? "chưa đo được";
  const zero = opts.zero ?? empty;
  if (ms == null || Number.isNaN(ms)) return empty;
  if (ms <= 0) return zero;
  const hours = ms / 3_600_000;
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(ms / 60_000));
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

export function formatMedianP90(medianMs: number | null, p90Ms: number | null) {
  if (medianMs == null) {
    return {
      value: "Chưa đo được",
      detail: "Chưa có story commit trong kỳ — thời gian xong chỉ tính khi story đã vào repo.",
    };
  }
  return {
    value: `Trung vị ${formatDuration(medianMs)}`,
    detail: `9 trên 10 story xong trong ${formatDuration(p90Ms)} (p90). Dùng trung vị, không dùng trung bình.`,
  };
}

function d08Part(n: number, when: string) {
  if (n === 0) return `không lần nào ${when}`;
  return `${formatNumber(n)} lần ${when}`;
}

export function formatD08Split(specLock: number, review: number, other = 0) {
  const parts = [d08Part(specLock, "lúc khóa spec"), d08Part(review, "lúc review")];
  if (other > 0) parts.push(`${formatNumber(other)} lần ở bước khác`);
  return parts.join(" · ");
}
