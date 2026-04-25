import { NextRequest } from "next/server";

import { listMarkets } from "@/lib/markets/queries";
import { parseMarketListParams } from "@/lib/markets/params";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const params = parseMarketListParams(request.nextUrl.searchParams);
    const data = await listMarkets(params);

    return Response.json({
      data,
      meta: params,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load markets" },
      { status: 500 },
    );
  }
}
