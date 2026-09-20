# Dashboard Page Overrides

> **PROJECT:** KiroTracking
> **Updated:** 2026-09-20
> **Page Type:** Analytics Dashboard / Data View

> Rules here **override** `MASTER.md`. Only deviations are listed.

---

## Layout

- **Max width:** 1400px content column
- **Grid:** dense 12-col feel — KPI 4-up, gates 3-up, bottleneck 8-up
- **Density:** High — tight section gaps (`gap-5`), compact panel padding
- **Shell:** Left sidebar (desktop) + sticky filter header; mobile bottom tabs

## Color (process mining)

| Signal | Token | Hex |
|--------|-------|-----|
| Work / primary bars | `--work` / primary | `#1E40AF` |
| Wait | `--wait` | `#93C5FD` |
| Bottleneck highlight | CTA amber | `#F59E0B` |
| Rework / fail | destructive | `#EF4444` |
| First-pass OK | `--ok` | `#10B981` |
| Standing pip | CTA | `#F59E0B` |

## Typography

- Headings + tabular numbers: **Fira Code** (`font-heading`)
- Body UI: **Fira Sans**
- Page titles use primary blue for brand signal

## Components

- Prefer `.panel` surfaces over heavy shadowed cards
- Meters animate with `meter-fill` (respects `prefers-reduced-motion`)
- Sections use `reveal` enter animation (1–2 key motions max)
- Skip link to `#main` in shell

## Sections (overview order)

1. Page title
2. Stale banner (if needed)
3. KPI ×4
4. Funnel (compact)
5. Bottleneck (work/wait)
6. Gates (first-pass %)
7. D-08 / human lock stacked bar

## Anti-patterns on this page

- Landing-page hero / CTA blocks
- Ornate decoration
- Emoji icons
- Catalog metric IDs in UI copy
