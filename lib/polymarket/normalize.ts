import type { NewMarket, NewMarketSnapshot } from "../db/schema";

import { isRecord, type GammaMarket } from "./gamma";

export type NormalizedGammaMarket = {
  market: NewMarket;
  snapshot: NewMarketSnapshot;
};

export function normalizeGammaMarket(
  row: GammaMarket,
): NormalizedGammaMarket | null {
  const id = readString(row.id);
  const question = readString(row.question);

  if (!id || !question) {
    return null;
  }

  const event = readFirstEvent(row);
  const outcomePrices = readNumberArray(row.outcomePrices);
  const capturedAt = new Date();

  const sharedMetrics = {
    volume: readNumber(row.volumeNum, row.volume),
    volume24hr: readNumber(row.volume24hr, row.volume24hrClob),
    volume1wk: readNumber(row.volume1wk, row.volume1wkClob),
    volume1mo: readNumber(row.volume1mo, row.volume1moClob),
    liquidity: readNumber(row.liquidityNum, row.liquidity),
    bestBid: readNumber(row.bestBid),
    bestAsk: readNumber(row.bestAsk),
    lastTradePrice: readNumber(row.lastTradePrice),
    spread: readNumber(row.spread),
    oneDayPriceChange: readNumber(row.oneDayPriceChange),
    oneWeekPriceChange: readNumber(row.oneWeekPriceChange),
    oneMonthPriceChange: readNumber(row.oneMonthPriceChange),
  };

  return {
    market: {
      id,
      conditionId: readString(row.conditionId),
      question,
      slug: readString(row.slug),
      description: readString(row.description),
      category: readString(row.category),
      eventId: readString(event?.id),
      eventSlug: readString(event?.slug),
      eventTitle: readString(event?.title),
      image: readString(row.image),
      icon: readString(row.icon),
      active: readBoolean(row.active) ?? true,
      closed: readBoolean(row.closed) ?? false,
      archived: readBoolean(row.archived) ?? false,
      acceptingOrders: readBoolean(row.acceptingOrders) ?? false,
      restricted: readBoolean(row.restricted) ?? false,
      ...sharedMetrics,
      outcomes: readStringArray(row.outcomes),
      outcomePrices,
      raw: row,
      startDate: readDate(row.startDate),
      endDate: readDate(row.endDate),
      marketCreatedAt: readDate(row.createdAt),
      marketUpdatedAt: readDate(row.updatedAt),
      lastSyncedAt: capturedAt,
    },
    snapshot: {
      marketId: id,
      capturedAt,
      ...sharedMetrics,
      outcomePrices,
    },
  };
}

function readFirstEvent(row: GammaMarket) {
  return Array.isArray(row.events) && isRecord(row.events[0])
    ? row.events[0]
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function readNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function readStringArray(value: unknown) {
  const parsed = parseJsonArray(value);

  return parsed
    .map((item) => (typeof item === "string" ? item : null))
    .filter((item): item is string => item !== null);
}

function readNumberArray(value: unknown) {
  return parseJsonArray(value)
    .map((item) => readNumber(item))
    .filter((item): item is number => item !== null);
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
