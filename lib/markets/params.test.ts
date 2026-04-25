import assert from "node:assert/strict";
import test from "node:test";

import { parseMarketHistoryParams, parseMarketListParams } from "./params";

test("parses market list params with defaults", () => {
  const params = parseMarketListParams(new URLSearchParams());

  assert.deepEqual(params, {
    q: null,
    status: "open",
    sort: "volume24hr",
    dir: "desc",
    limit: 50,
    offset: 0,
  });
});

test("clamps market list pagination and validates enums", () => {
  const params = parseMarketListParams(
    new URLSearchParams({
      q: " election ",
      status: "closed",
      sort: "liquidity",
      dir: "asc",
      limit: "500",
      offset: "-10",
    }),
  );

  assert.equal(params.q, "election");
  assert.equal(params.status, "closed");
  assert.equal(params.sort, "liquidity");
  assert.equal(params.dir, "asc");
  assert.equal(params.limit, 100);
  assert.equal(params.offset, 0);
});

test("parses history params", () => {
  const params = parseMarketHistoryParams(
    new URLSearchParams({ window: "7d", limit: "20" }),
  );

  assert.deepEqual(params, {
    window: "7d",
    limit: 20,
  });
});
