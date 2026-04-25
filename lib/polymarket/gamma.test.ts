import assert from "node:assert/strict";
import test from "node:test";

import { fetchGammaMarkets } from "./gamma";

test("fetches paginated Gamma markets and dedupes by id", async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    requestedUrls.push(url.toString());

    const order = url.searchParams.get("order");
    const offset = url.searchParams.get("offset");

    if (order === "volume24hr" && offset === "0") {
      return jsonResponse([{ id: "1" }, { id: "2" }]);
    }

    if (order === "liquidity" && offset === "0") {
      return jsonResponse([{ id: "2" }, { id: "3" }]);
    }

    return jsonResponse([]);
  };

  try {
    const markets = await fetchGammaMarkets({ limit: 3 });

    assert.deepEqual(
      markets.map((market) => market.id),
      ["1", "2", "3"],
    );
    assert.ok(
      requestedUrls.every((url) => url.includes("active=true")),
      "requests active markets",
    );
    assert.ok(
      requestedUrls.every((url) => url.includes("closed=false")),
      "requests open markets",
    );
    assert.ok(
      requestedUrls.every((url) => url.includes("archived=false")),
      "excludes archived markets",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function jsonResponse(body: unknown[]) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
