import { DEVELOPER_NAMES, PERIODS, type Period } from "./catalog";
import { getMeta } from "./db";
import { countStories, getStoryRollup, listStoryEvents, listStoryRollups } from "./rollup";
import { buildOverviewFromStories, inRange, median, periodRange, rate } from "./queries-shared";
import type { OverviewPayload, PersonRow, StoryListItem } from "./types";
import type { LoopStage } from "./catalog";

export function isStale() {
  const lastEvent = getMeta("last_event_received_at");
  const lastRollup = getMeta("last_rollup_at");
  if (!lastEvent || !lastRollup) return false;
  return Date.parse(lastEvent) - Date.parse(lastRollup) > 5 * 60_000;
}

export function getOverview(
  orgId: string,
  period: Period,
  developerId?: string,
): OverviewPayload {
  let stories = listStoryRollups(orgId);
  if (developerId) stories = stories.filter((s) => s.developer_id === developerId);
  const range = periodRange(period);
  const payload = buildOverviewFromStories(stories, range, period);
  payload.stale = isStale();
  return payload;
}

export function getStories(
  orgId: string,
  period: Period,
  filters: {
    developerId?: string;
    stage?: LoopStage;
    rework?: boolean;
    d08LockMin?: number;
    status?: StoryListItem["status"];
  } = {},
): StoryListItem[] {
  const range = periodRange(period);
  const now = Date.now();
  return listStoryRollups(orgId)
    .filter((s) => inRange(s.received_at, range.start, range.end))
    .filter((s) => !filters.developerId || s.developer_id === filters.developerId)
    .filter((s) => !filters.stage || s.current_stage === filters.stage)
    .filter((s) => !filters.rework || s.rework === 1)
    .filter((s) => filters.d08LockMin == null || s.d08_spec_lock >= filters.d08LockMin)
    .filter((s) => !filters.status || s.status === filters.status)
    .map((s) => ({
      story_id: s.story_id,
      developer_id: s.developer_id,
      developer_name: DEVELOPER_NAMES[s.developer_id] ?? s.developer_id,
      current_stage: s.current_stage,
      age_ms: s.received_at ? now - Date.parse(s.received_at) : null,
      d08_total: s.d08_total,
      d08_spec_lock: s.d08_spec_lock,
      d08_review: s.d08_review,
      rework: s.rework === 1,
      rework_branches: s.rework_branches,
      status: s.status,
      received_at: s.received_at,
      committed_at: s.committed_at,
    }))
    .sort((a, b) => (b.received_at ?? "").localeCompare(a.received_at ?? ""));
}

export function getStoryDetail(orgId: string, storyId: string) {
  const rollup = getStoryRollup(orgId, storyId);
  if (!rollup) return null;
  const events = listStoryEvents(orgId, storyId);
  return { rollup, events };
}

export function getPeople(
  orgId: string,
  period: Period,
  developerId?: string,
): PersonRow[] {
  const range = periodRange(period);
  const stories = listStoryRollups(orgId)
    .filter((s) => inRange(s.received_at, range.start, range.end))
    .filter((s) => !developerId || s.developer_id === developerId);
  const byDev = new Map<string, typeof stories>();
  for (const s of stories) {
    const list = byDev.get(s.developer_id) ?? [];
    list.push(s);
    byDev.set(s.developer_id, list);
  }
  const rows: PersonRow[] = [...byDev.entries()].map(([id, list]) => {
    const committed = list.filter((s) => inRange(s.committed_at, range.start, range.end));
    const locked = list.filter((s) => s.spec_locked);
    return {
      developer_id: id,
      name: DEVELOPER_NAMES[id] ?? id,
      stories: list.length,
      d01_committed: committed.length,
      d02_median_ms: median(committed.map((s) => s.cycle_time_ms).filter((n): n is number => n != null)),
      d03_takeover_rate: rate(list.filter((s) => s.takeover).length, list.length),
      d08_median: median(committed.map((s) => s.d08_total)),
      d08_spec_lock_median: median(committed.map((s) => s.d08_spec_lock)),
      d08_review_median: median(committed.map((s) => s.d08_review)),
      d04_lock_then_commit: rate(
        locked.filter((s) => s.status === "committed").length,
        locked.length,
      ),
      sample_small: list.length < 8,
    };
  });
  rows.sort((a, b) => b.stories - a.stories);
  return rows;
}

export function orgHasAnyStory(orgId: string) {
  return countStories(orgId) > 0;
}

export function parsePeriod(value: string | undefined | null): Period {
  if (value && (PERIODS as readonly string[]).includes(value)) return value as Period;
  return "7d";
}
