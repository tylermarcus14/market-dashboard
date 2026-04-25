import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const markets = pgTable(
  "markets",
  {
    id: text("id").primaryKey(),
    conditionId: text("condition_id"),
    question: text("question").notNull(),
    slug: text("slug"),
    description: text("description"),
    category: text("category"),
    eventId: text("event_id"),
    eventSlug: text("event_slug"),
    eventTitle: text("event_title"),
    image: text("image"),
    icon: text("icon"),
    active: boolean("active").notNull().default(true),
    closed: boolean("closed").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    acceptingOrders: boolean("accepting_orders").notNull().default(false),
    restricted: boolean("restricted").notNull().default(false),
    volume: doublePrecision("volume"),
    volume24hr: doublePrecision("volume_24hr"),
    volume1wk: doublePrecision("volume_1wk"),
    volume1mo: doublePrecision("volume_1mo"),
    liquidity: doublePrecision("liquidity"),
    bestBid: doublePrecision("best_bid"),
    bestAsk: doublePrecision("best_ask"),
    lastTradePrice: doublePrecision("last_trade_price"),
    spread: doublePrecision("spread"),
    oneDayPriceChange: doublePrecision("one_day_price_change"),
    oneWeekPriceChange: doublePrecision("one_week_price_change"),
    oneMonthPriceChange: doublePrecision("one_month_price_change"),
    outcomes: jsonb("outcomes").$type<string[]>().notNull().default([]),
    outcomePrices: jsonb("outcome_prices").$type<number[]>().notNull().default([]),
    raw: jsonb("raw").$type<Record<string, unknown>>().notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    marketCreatedAt: timestamp("market_created_at", { withTimezone: true }),
    marketUpdatedAt: timestamp("market_updated_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("markets_active_closed_idx").on(table.active, table.closed),
    index("markets_volume_idx").on(table.volume),
    index("markets_slug_idx").on(table.slug),
    index("markets_event_id_idx").on(table.eventId),
    index("markets_end_date_idx").on(table.endDate),
  ],
);

export const marketSnapshots = pgTable(
  "market_snapshots",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    marketId: text("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    volume: doublePrecision("volume"),
    volume24hr: doublePrecision("volume_24hr"),
    volume1wk: doublePrecision("volume_1wk"),
    volume1mo: doublePrecision("volume_1mo"),
    liquidity: doublePrecision("liquidity"),
    bestBid: doublePrecision("best_bid"),
    bestAsk: doublePrecision("best_ask"),
    lastTradePrice: doublePrecision("last_trade_price"),
    spread: doublePrecision("spread"),
    oneDayPriceChange: doublePrecision("one_day_price_change"),
    oneWeekPriceChange: doublePrecision("one_week_price_change"),
    oneMonthPriceChange: doublePrecision("one_month_price_change"),
    outcomePrices: jsonb("outcome_prices").$type<number[]>().notNull().default([]),
  },
  (table) => [
    index("market_snapshots_market_time_idx").on(
      table.marketId,
      table.capturedAt,
    ),
  ],
);

export const aiInsights = pgTable(
  "ai_insights",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    model: text("model").notNull(),
    inputMarketIds: jsonb("input_market_ids").$type<string[]>().notNull(),
    inputSignals: jsonb("input_signals").$type<Record<string, unknown>>().notNull(),
    report: jsonb("report").$type<Record<string, unknown>>(),
    rawResponse: jsonb("raw_response").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_insights_created_at_idx").on(table.createdAt),
  ],
);

export type Market = typeof markets.$inferSelect;
export type NewMarket = typeof markets.$inferInsert;
export type MarketSnapshot = typeof marketSnapshots.$inferSelect;
export type NewMarketSnapshot = typeof marketSnapshots.$inferInsert;
export type AiInsight = typeof aiInsights.$inferSelect;
export type NewAiInsight = typeof aiInsights.$inferInsert;
