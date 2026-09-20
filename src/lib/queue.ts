import { ROLLUP_DEBOUNCE_MS } from "./catalog";

type DirtyKey = `${string}::${string}`;

const dirty = new Set<DirtyKey>();
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

export function markStoriesDirty(orgId: string, storyIds: string[]) {
  for (const id of storyIds) dirty.add(`${orgId}::${id}`);
  schedule();
}

function schedule() {
  if (timer || flushing) return;
  timer = setTimeout(() => {
    timer = null;
    void flushDirty();
  }, ROLLUP_DEBOUNCE_MS);
}

export async function flushDirty() {
  if (flushing) return;
  flushing = true;
  try {
    const { rollupStory, refreshPeriodRollups } = await import("./rollup");
    while (dirty.size > 0) {
      const batch = [...dirty];
      dirty.clear();
      const orgs = new Set<string>();
      for (const key of batch) {
        const [orgId, storyId] = key.split("::");
        rollupStory(orgId, storyId);
        orgs.add(orgId);
      }
      for (const orgId of orgs) refreshPeriodRollups(orgId);
    }
  } finally {
    flushing = false;
    if (dirty.size > 0) schedule();
  }
}

export function flushDirtyNow() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  return flushDirty();
}
