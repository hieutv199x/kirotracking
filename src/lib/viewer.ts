import { cookies } from "next/headers";
import { DEVELOPERS } from "./catalog";

export const VIEWER_COOKIE = "kt_viewer";

export async function getViewer() {
  const store = await cookies();
  const value = store.get(VIEWER_COOKIE)?.value ?? "lead";
  if (value === "lead") return { id: "lead" as const, name: "Lead kỹ thuật", role: "lead" as const };
  const dev = DEVELOPERS.find((d) => d.id === value);
  if (!dev) return { id: "lead" as const, name: "Lead kỹ thuật", role: "lead" as const };
  return { id: dev.id, name: dev.name, role: "developer" as const };
}
