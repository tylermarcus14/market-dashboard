import type { MarketSnapshot } from "../db/schema";

export type MarketMovement = {
  latestCapturedAt: Date | null;
  previousCapturedAt: Date | null;
  probabilityDeltas: number[];
  primaryProbabilityDelta: number | null;
  volumeDelta: number | null;
  liquidityDelta: number | null;
};

export function calculateMovement(
  latest: MarketSnapshot | null,
  previous: MarketSnapshot | null,
): MarketMovement {
  if (!latest) {
    return {
      latestCapturedAt: null,
      previousCapturedAt: null,
      probabilityDeltas: [],
      primaryProbabilityDelta: null,
      volumeDelta: null,
      liquidityDelta: null,
    };
  }

  const probabilityDeltas = previous
    ? latest.outcomePrices.map(
        (price, index) => price - (previous.outcomePrices[index] ?? price),
      )
    : [];

  return {
    latestCapturedAt: latest.capturedAt,
    previousCapturedAt: previous?.capturedAt ?? null,
    probabilityDeltas,
    primaryProbabilityDelta: probabilityDeltas[0] ?? null,
    volumeDelta: delta(latest.volume, previous?.volume),
    liquidityDelta: delta(latest.liquidity, previous?.liquidity),
  };
}

function delta(current: number | null, previous: number | null | undefined) {
  return current !== null && previous !== null && previous !== undefined
    ? current - previous
    : null;
}
