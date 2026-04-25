import { NextRequest } from "next/server";

import { isCronAuthorized } from "@/lib/cron/auth";
import { generateMarketMoversBrief } from "@/lib/insights/market-movers-brief";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const insight = await generateMarketMoversBrief();

    return Response.json({
      ok: true,
      insightId: insight.id,
      createdAt: insight.createdAt,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Brief generation failed" },
      { status: 500 },
    );
  }
}
