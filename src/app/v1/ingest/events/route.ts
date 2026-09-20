import { ingestApp } from "@/ingest/app";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return ingestApp.fetch(request);
}
