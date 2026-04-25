import { getMarketDetails } from "@/lib/markets/queries";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await getMarketDetails(id);

    if (!data) {
      return Response.json({ error: "Market not found" }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load market" },
      { status: 500 },
    );
  }
}
