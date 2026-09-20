import { cookies } from "next/headers";
import { DEVELOPERS } from "./catalog";

export const VIEWER_COOKIE = "kt_viewer";

export type Viewer = {
  id: string;
  name: string;
  role: "lead" | "developer";
};

function resolve(value: string | undefined | null): Viewer {
  if (!value || value === "lead") {
    return { id: "lead", name: "Engineering lead", role: "lead" };
  }
  const dev = DEVELOPERS.find((d) => d.id === value);
  if (!dev) return { id: "lead", name: "Engineering lead", role: "lead" };
  return { id: dev.id, name: dev.name, role: "developer" };
}

export async function getViewer(queryViewer?: string | string[] | undefined) {
  const fromQuery = Array.isArray(queryViewer) ? queryViewer[0] : queryViewer;
  if (fromQuery) return resolve(fromQuery);
  const store = await cookies();
  return resolve(store.get(VIEWER_COOKIE)?.value);
}
