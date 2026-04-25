const GAMMA_MARKETS_URL = "https://gamma-api.polymarket.com/markets";
const PAGE_SIZE = 100;
const FETCH_ORDERS = ["volume24hr", "liquidity", "volume"] as const;

type FetchMarketsOptions = {
  limit?: number;
};

export type GammaMarket = Record<string, unknown>;

export async function fetchGammaMarkets({
  limit = 500,
}: FetchMarketsOptions = {}) {
  const markets = new Map<string, GammaMarket>();
  const pagesPerOrder = Math.ceil(limit / PAGE_SIZE);

  for (const order of FETCH_ORDERS) {
    for (let page = 0; page < pagesPerOrder; page += 1) {
      const rows = await fetchGammaMarketPage({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        order,
      });

      for (const row of rows) {
        const id = typeof row.id === "string" ? row.id : null;

        if (id) {
          markets.set(id, row);
        }
      }

      if (rows.length < PAGE_SIZE || markets.size >= limit) {
        break;
      }
    }

    if (markets.size >= limit) {
      break;
    }
  }

  return Array.from(markets.values()).slice(0, limit);
}

async function fetchGammaMarketPage({
  limit,
  offset,
  order,
}: {
  limit: number;
  offset: number;
  order: (typeof FETCH_ORDERS)[number];
}) {
  const url = new URL(GAMMA_MARKETS_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("archived", "false");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("order", order);
  url.searchParams.set("ascending", "false");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Gamma markets request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Gamma markets response was not an array");
  }

  return data.filter(isRecord);
}

export function isRecord(value: unknown): value is GammaMarket {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
