import { NextRequest } from "next/server";

import { ingestMarkets } from "@/lib/polymarket/ingest";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ingestMarkets();

    return Response.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 },
    );
  }
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}
