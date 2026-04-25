import { and, desc, eq, gte, inArray, isNull, not, or, sql } from "drizzle-orm";

import { getDb } from "../db/client";
import { marketSnapshots, markets } from "../db/schema";

export type MoverSignal = {
  marketId: string;
  question: string;
  eventTitle: string | null;
  outcomes: string[];
  latestProbabilities: number[];
  probabilityDelta: number | null;
  probabilityDeltaSource: "snapshots" | "gamma_price_change" | "none";
  volume24hr: number | null;
  liquidity: number | null;
  spread: number | null;
  endDate: string | null;
  descriptionSnippet: string | null;
  reasonSelected: string;
  score: number;
};

export type MoverSignalsInput = {
  generatedAt: string;
  marketsAnalyzed: number;
  movers: MoverSignal[];
};

export async function buildMoverSignals(limit = 8): Promise<MoverSignalsInput> {
  const db = getDb();
  const marketRows = await db
    .select({
      id: markets.id,
      question: markets.question,
      eventTitle: markets.eventTitle,
      description: markets.description,
      outcomes: markets.outcomes,
      outcomePrices: markets.outcomePrices,
      volume24hr: markets.volume24hr,
      liquidity: markets.liquidity,
      spread: markets.spread,
      oneDayPriceChange: markets.oneDayPriceChange,
      oneWeekPriceChange: markets.oneWeekPriceChange,
      endDate: markets.endDate,
    })
    .from(markets)
    .where(
      and(
        eq(markets.active, true),
        eq(markets.closed, false),
        eq(markets.acceptingOrders, true),
        or(isNull(markets.endDate), gte(markets.endDate, new Date()))!,
        not(sql`${markets.raw}->'events'->0->>'ended' = 'true'`),
        not(sql`${markets.raw} ? 'finishedTimestamp'`),
      ),
    )
    .orderBy(desc(markets.volume24hr))
    .limit(200);

  if (marketRows.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      marketsAnalyzed: 0,
      movers: [],
    };
  }

  const snapshots = await db
    .select()
    .from(marketSnapshots)
    .where(inArray(marketSnapshots.marketId, marketRows.map((market) => market.id)))
    .orderBy(desc(marketSnapshots.capturedAt))
    .limit(1000);

  const snapshotsByMarket = new Map<string, typeof snapshots>();

  for (const snapshot of snapshots) {
    const existing = snapshotsByMarket.get(snapshot.marketId) ?? [];

    if (existing.length < 2) {
      existing.push(snapshot);
      snapshotsByMarket.set(snapshot.marketId, existing);
    }
  }

  const movers = marketRows
    .map((market): MoverSignal | null => {
      const marketSnapshots = snapshotsByMarket.get(market.id) ?? [];
      const latestSnapshot = marketSnapshots[0];
      const previousSnapshot = marketSnapshots[1];
      const snapshotDelta =
        latestSnapshot && previousSnapshot
          ? (latestSnapshot.outcomePrices[0] ?? 0) -
            (previousSnapshot.outcomePrices[0] ?? 0)
          : null;
      const fallbackDelta = market.oneDayPriceChange ?? market.oneWeekPriceChange;
      const probabilityDelta = snapshotDelta ?? fallbackDelta ?? null;
      const probabilityDeltaSource = snapshotDelta !== null
        ? "snapshots"
        : fallbackDelta !== null && fallbackDelta !== undefined
          ? "gamma_price_change"
          : "none";

      if (
        market.outcomePrices.length === 0 ||
        market.liquidity === null ||
        market.liquidity < 10_000 ||
        probabilityDelta === null
      ) {
        return null;
      }

      const score =
        Math.abs(probabilityDelta) * 100 +
        Math.log10((market.volume24hr ?? 0) + 1) +
        Math.log10((market.liquidity ?? 0) + 1) * 0.5 -
        (market.spread ?? 0) * 10;

      return {
        marketId: market.id,
        question: market.question,
        eventTitle: market.eventTitle,
        outcomes: market.outcomes,
        latestProbabilities: market.outcomePrices,
        probabilityDelta,
        probabilityDeltaSource,
        volume24hr: market.volume24hr,
        liquidity: market.liquidity,
        spread: market.spread,
        endDate: market.endDate?.toISOString() ?? null,
        descriptionSnippet: market.description?.slice(0, 500) ?? null,
        reasonSelected: buildReasonSelected(probabilityDelta, market.volume24hr, market.spread),
        score,
      };
    })
    .filter((mover): mover is MoverSignal => mover !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    generatedAt: new Date().toISOString(),
    marketsAnalyzed: marketRows.length,
    movers,
  };
}

function buildReasonSelected(
  probabilityDelta: number,
  volume24hr: number | null,
  spread: number | null,
) {
  const reasons = [`${formatSignedPercent(probabilityDelta)} probability move`];

  if (volume24hr !== null) {
    reasons.push(`$${Math.round(volume24hr).toLocaleString()} 24h volume`);
  }

  if (spread !== null) {
    reasons.push(`${formatSignedPercent(spread).replace("+", "")} spread`);
  }

  return reasons.join(", ");
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}
