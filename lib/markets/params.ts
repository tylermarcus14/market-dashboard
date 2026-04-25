export type MarketStatus = "open" | "active" | "closed" | "all";
export type MarketSort =
  | "volume"
  | "volume24hr"
  | "liquidity"
  | "lastTradePrice"
  | "spread"
  | "updatedAt"
  | "endDate";
export type SortDirection = "asc" | "desc";
export type HistoryWindow = "1h" | "6h" | "24h" | "7d" | "all";

export type MarketListParams = {
  q: string | null;
  status: MarketStatus;
  sort: MarketSort;
  dir: SortDirection;
  limit: number;
  offset: number;
};

export type MarketHistoryParams = {
  window: HistoryWindow;
  limit: number;
};

const marketSorts = new Set<MarketSort>([
  "volume",
  "volume24hr",
  "liquidity",
  "lastTradePrice",
  "spread",
  "updatedAt",
  "endDate",
]);

const statuses = new Set<MarketStatus>(["open", "active", "closed", "all"]);
const directions = new Set<SortDirection>(["asc", "desc"]);
const historyWindows = new Set<HistoryWindow>(["1h", "6h", "24h", "7d", "all"]);

export function parseMarketListParams(
  searchParams: URLSearchParams,
): MarketListParams {
  return {
    q: cleanString(searchParams.get("q")),
    status: readEnum(searchParams.get("status"), statuses, "open"),
    sort: readEnum(searchParams.get("sort"), marketSorts, "volume24hr"),
    dir: readEnum(searchParams.get("dir"), directions, "desc"),
    limit: readInt(searchParams.get("limit"), 50, 1, 100),
    offset: readInt(searchParams.get("offset"), 0, 0, 10_000),
  };
}

export function parseMarketHistoryParams(
  searchParams: URLSearchParams,
): MarketHistoryParams {
  return {
    window: readEnum(searchParams.get("window"), historyWindows, "24h"),
    limit: readInt(searchParams.get("limit"), 200, 1, 1_000),
  };
}

function cleanString(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readEnum<T extends string>(
  value: string | null,
  allowed: Set<T>,
  fallback: T,
) {
  return value && allowed.has(value as T) ? (value as T) : fallback;
}

function readInt(value: string | null, fallback: number, min: number, max: number) {
  if (value === null || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}
