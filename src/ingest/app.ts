import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { ensureReady } from "@/lib/db";
import { ingestHttpRequest, jsonResponse } from "@/lib/ingest";

export const ingestApp = new Hono();

ingestApp.post("/v1/ingest/events", async (c) => {
  await ensureReady();
  const requestId = c.req.header("x-request-id") ?? randomUUID();
  const rawBody = await c.req.text();
  const contentLengthHeader = c.req.header("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
  const result = ingestHttpRequest({
    authorization: c.req.header("authorization"),
    idempotencyKey: c.req.header("idempotency-key"),
    contentLength: Number.isFinite(contentLength) ? contentLength : null,
    rawBody,
  });
  return jsonResponse(result, requestId);
});

ingestApp.get("/v1/health", (c) => c.json({ ok: true }));
