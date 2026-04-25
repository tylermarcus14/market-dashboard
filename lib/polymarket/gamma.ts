const GAMMA_MARKETS_URL = "https://gamma-api.polymarket.com/markets";

type FetchMarketsOptions = {
  limit?: number;
  offset?: number;
};

export type GammaMarket = Record<string, unknown>;

export async function fetchGammaMarkets({
  limit = 200,
  offset = 0,
}: FetchMarketsOptions = {}) {
  const url = new URL(GAMMA_MARKETS_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("order", "volume24hr");
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
