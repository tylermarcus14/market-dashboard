import assert from "node:assert/strict";
import test from "node:test";

import { normalizeGammaMarket } from "./normalize";

test("normalizes stringified Gamma market fields", () => {
  const normalized = normalizeGammaMarket({
    id: "540816",
    question: "Russia-Ukraine Ceasefire before GTA VI?",
    conditionId: "0xabc",
    slug: "russia-ukraine-ceasefire-before-gta-vi",
    outcomes: "[\"Yes\", \"No\"]",
    outcomePrices: "[\"0.525\", \"0.475\"]",
    active: true,
    closed: false,
    archived: false,
    acceptingOrders: true,
    restricted: true,
    volume: "1605804.228659036",
    volumeNum: 1605804.228659036,
    volume24hr: 4048.311908999999,
    volume1wk: 49389.19258800005,
    volume1mo: 204651.7335019993,
    liquidity: "49504.7792",
    bestBid: 0.52,
    bestAsk: 0.53,
    lastTradePrice: 0.52,
    spread: 0.01,
    oneWeekPriceChange: -0.01,
    oneMonthPriceChange: -0.03,
    startDate: "2025-05-02T15:48:00.174Z",
    endDate: "2026-07-31T12:00:00Z",
    createdAt: "2025-05-02T15:03:10.397014Z",
    updatedAt: "2026-04-25T21:47:52.98439Z",
    events: [
      {
        id: "23784",
        slug: "what-will-happen-before-gta-vi",
        title: "What will happen before GTA VI?",
      },
    ],
  });

  assert.ok(normalized);
  assert.equal(normalized.market.id, "540816");
  assert.deepEqual(normalized.market.outcomes, ["Yes", "No"]);
  assert.deepEqual(normalized.market.outcomePrices, [0.525, 0.475]);
  assert.equal(normalized.market.eventId, "23784");
  assert.equal(normalized.market.acceptingOrders, true);
  assert.equal(normalized.snapshot.volume, 1605804.228659036);
});

test("returns null for malformed rows", () => {
  assert.equal(normalizeGammaMarket({ id: "1" }), null);
  assert.equal(normalizeGammaMarket({ question: "Missing id" }), null);
});

test("handles malformed arrays and numeric strings", () => {
  const normalized = normalizeGammaMarket({
    id: 123,
    question: "Bad id should fail",
    outcomes: "not-json",
    outcomePrices: "[\"0.1\", \"bad\"]",
  });

  assert.equal(normalized, null);

  const valid = normalizeGammaMarket({
    id: "123",
    question: "Valid market",
    outcomes: "not-json",
    outcomePrices: "[\"0.1\", \"bad\"]",
  });

  assert.ok(valid);
  assert.deepEqual(valid.market.outcomes, []);
  assert.deepEqual(valid.market.outcomePrices, [0.1]);
});
