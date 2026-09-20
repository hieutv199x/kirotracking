import { serve } from "@hono/node-server";
import { ingestApp } from "./app";
import { ensureReady } from "../lib/db";

const port = Number(process.env.INGEST_PORT ?? 43124);

async function main() {
  await ensureReady();
  serve({ fetch: ingestApp.fetch, port, hostname: "0.0.0.0" });
  console.log(`KiroTracking ingest listening on http://0.0.0.0:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
