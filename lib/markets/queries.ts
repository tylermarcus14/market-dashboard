import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  not,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { getDb } from "../db/client";
import { marketSnapshots, markets } from "../db/schema";
import { calculateMovement } from "./movement";
import type {
  HistoryWindow,
  MarketHistoryParams,
  MarketListParams,
  MarketSort,
  SortDirection,
} from "./params";

export async function listMarkets(params: MarketListParams) {
  const db = getDb();
  const filters = buildMarketFilters(params);

  return db
    .select(marketSummaryColumns)
    .from(markets)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(orderMarketBy(params.sort, params.dir))
    .limit(params.limit)
    .offset(params.offset);
}

export async function getMarketDetails(id: string) {
  const db = getDb();
  const [market] = await db
    .select(marketSummaryColumns)
    .from(markets)
    .where(eq(markets.id, id))
    .limit(1);

  if (!market) {
    return null;
  }

  const snapshots = await db
    .select()
    .from(marketSnapshots)
    .where(eq(marketSnapshots.marketId, id))
    .orderBy(desc(marketSnapshots.capturedAt))
    .limit(2);

  const latestSnapshot = snapshots[0] ?? null;
  const previousSnapshot = snapshots[1] ?? null;

  return {
    market,
    latestSnapshot,
    movement: calculateMovement(latestSnapshot, previousSnapshot),
  };
}

export async function getMarketHistory(
  id: string,
  { window, limit }: MarketHistoryParams,
) {
  const db = getDb();
  const filters: SQL[] = [eq(marketSnapshots.marketId, id)];
  const cutoff = getHistoryCutoff(window);

  if (cutoff) {
    filters.push(gte(marketSnapshots.capturedAt, cutoff));
  }

  return db
    .select()
    .from(marketSnapshots)
    .where(and(...filters))
    .orderBy(asc(marketSnapshots.capturedAt))
    .limit(limit);
}

function buildMarketFilters(params: MarketListParams) {
  const filters: SQL[] = [];

  if (params.q) {
    filters.push(
      or(
        ilike(markets.question, `%${params.q}%`),
        ilike(markets.description, `%${params.q}%`),
        ilike(markets.eventTitle, `%${params.q}%`),
      )!,
    );
  }

  if (params.status === "open") {
    filters.push(
      eq(markets.active, true),
      eq(markets.closed, false),
      eq(markets.acceptingOrders, true),
      or(isNull(markets.endDate), gte(markets.endDate, new Date()))!,
      not(sql`${markets.raw}->'events'->0->>'ended' = 'true'`),
      not(sql`${markets.raw} ? 'finishedTimestamp'`),
    );
  }

  if (params.status === "active") {
    filters.push(eq(markets.active, true));
  }

  if (params.status === "closed") {
    filters.push(eq(markets.closed, true));
  }

  return filters;
}

const marketSummaryColumns = {
  id: markets.id,
  conditionId: markets.conditionId,
  question: markets.question,
  slug: markets.slug,
  description: markets.description,
  category: markets.category,
  eventId: markets.eventId,
  eventSlug: markets.eventSlug,
  eventTitle: markets.eventTitle,
  image: markets.image,
  icon: markets.icon,
  active: markets.active,
  closed: markets.closed,
  archived: markets.archived,
  acceptingOrders: markets.acceptingOrders,
  restricted: markets.restricted,
  volume: markets.volume,
  volume24hr: markets.volume24hr,
  volume1wk: markets.volume1wk,
  volume1mo: markets.volume1mo,
  liquidity: markets.liquidity,
  bestBid: markets.bestBid,
  bestAsk: markets.bestAsk,
  lastTradePrice: markets.lastTradePrice,
  spread: markets.spread,
  oneDayPriceChange: markets.oneDayPriceChange,
  oneWeekPriceChange: markets.oneWeekPriceChange,
  oneMonthPriceChange: markets.oneMonthPriceChange,
  outcomes: markets.outcomes,
  outcomePrices: markets.outcomePrices,
  startDate: markets.startDate,
  endDate: markets.endDate,
  marketCreatedAt: markets.marketCreatedAt,
  marketUpdatedAt: markets.marketUpdatedAt,
  lastSyncedAt: markets.lastSyncedAt,
};

function orderMarketBy(sort: MarketSort, dir: SortDirection) {
  const column = {
    volume: markets.volume,
    volume24hr: markets.volume24hr,
    liquidity: markets.liquidity,
    lastTradePrice: markets.lastTradePrice,
    spread: markets.spread,
    updatedAt: markets.marketUpdatedAt,
    endDate: markets.endDate,
  }[sort];

  return dir === "asc" ? asc(column) : desc(column);
}

function getHistoryCutoff(window: HistoryWindow) {
  if (window === "all") {
    return null;
  }

  const hours = {
    "1h": 1,
    "6h": 6,
    "24h": 24,
    "7d": 24 * 7,
  }[window];

  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
