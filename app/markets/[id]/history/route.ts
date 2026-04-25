import { NextRequest } from "next/server";

import { parseMarketHistoryParams } from "@/lib/markets/params";
import { getMarketHistory } from "@/lib/markets/queries";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const query = parseMarketHistoryParams(request.nextUrl.searchParams);
    const data = await getMarketHistory(id, query);

    return Response.json({
      data,
      meta: query,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load history" },
      { status: 500 },
    );
  }
}
