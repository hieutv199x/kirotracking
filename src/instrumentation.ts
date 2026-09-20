export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { ensureReady } = await import("./lib/db");
  await ensureReady();
}
