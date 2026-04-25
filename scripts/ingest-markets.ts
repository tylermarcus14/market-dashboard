import { loadEnvConfig } from "@next/env";

import { ingestMarkets } from "../lib/polymarket/ingest";

loadEnvConfig(process.cwd());

async function main() {
  const limit = Number(process.env.INGEST_LIMIT ?? 200);
  const result = await ingestMarkets({ limit });

  console.log(
    `Ingested ${result.ingested} markets and ${result.snapshots} snapshots`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
