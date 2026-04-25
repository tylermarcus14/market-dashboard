import { NextRequest } from "next/server";

import {
  generateMarketMoversBrief,
  getLatestMarketMoversBrief,
} from "@/lib/insights/market-movers-brief";
import { buildMoverSignals } from "@/lib/insights/movers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get("refresh") === "true") {
      const data = await generateMarketMoversBrief();

      return Response.json({ data, refreshed: true });
    }

    const data = await getLatestMarketMoversBrief();

    if (data) {
      return Response.json({ data, refreshed: false });
    }

    const signals = await buildMoverSignals();

    return Response.json({
      data: null,
      refreshed: false,
      signals,
      message: "No brief generated yet. Call /insights/trends?refresh=true.",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load insights" },
      { status: 500 },
    );
  }
}
