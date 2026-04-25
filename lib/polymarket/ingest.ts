import { sql } from "drizzle-orm";

import { getDb } from "../db/client";
import { marketSnapshots, markets } from "../db/schema";
import { fetchGammaMarkets } from "./gamma";
import { normalizeGammaMarket } from "./normalize";

type IngestMarketsOptions = {
  limit?: number;
};

export type IngestMarketsResult = {
  fetched: number;
  ingested: number;
  snapshots: number;
};

export async function ingestMarkets({
  limit = 200,
}: IngestMarketsOptions = {}): Promise<IngestMarketsResult> {
  const rows = await fetchGammaMarkets({ limit });
  const normalized = rows.map(normalizeGammaMarket).filter((row) => row !== null);

  if (normalized.length === 0) {
    throw new Error("No valid markets returned from Gamma");
  }

  const db = getDb();
  const marketRows = normalized.map(({ market }) => market);
  const snapshotRows = normalized.map(({ snapshot }) => snapshot);

  await db
    .insert(markets)
    .values(marketRows)
    .onConflictDoUpdate({
      target: markets.id,
      set: {
        conditionId: sql`excluded.condition_id`,
        question: sql`excluded.question`,
        slug: sql`excluded.slug`,
        description: sql`excluded.description`,
        category: sql`excluded.category`,
        eventId: sql`excluded.event_id`,
        eventSlug: sql`excluded.event_slug`,
        eventTitle: sql`excluded.event_title`,
        image: sql`excluded.image`,
        icon: sql`excluded.icon`,
        active: sql`excluded.active`,
        closed: sql`excluded.closed`,
        archived: sql`excluded.archived`,
        acceptingOrders: sql`excluded.accepting_orders`,
        restricted: sql`excluded.restricted`,
        volume: sql`excluded.volume`,
        volume24hr: sql`excluded.volume_24hr`,
        volume1wk: sql`excluded.volume_1wk`,
        volume1mo: sql`excluded.volume_1mo`,
        liquidity: sql`excluded.liquidity`,
        bestBid: sql`excluded.best_bid`,
        bestAsk: sql`excluded.best_ask`,
        lastTradePrice: sql`excluded.last_trade_price`,
        spread: sql`excluded.spread`,
        oneDayPriceChange: sql`excluded.one_day_price_change`,
        oneWeekPriceChange: sql`excluded.one_week_price_change`,
        oneMonthPriceChange: sql`excluded.one_month_price_change`,
        outcomes: sql`excluded.outcomes`,
        outcomePrices: sql`excluded.outcome_prices`,
        raw: sql`excluded.raw`,
        startDate: sql`excluded.start_date`,
        endDate: sql`excluded.end_date`,
        marketCreatedAt: sql`excluded.market_created_at`,
        marketUpdatedAt: sql`excluded.market_updated_at`,
        lastSyncedAt: sql`excluded.last_synced_at`,
      },
    });

  await db.insert(marketSnapshots).values(snapshotRows);

  return {
    fetched: rows.length,
    ingested: marketRows.length,
    snapshots: snapshotRows.length,
  };
}
