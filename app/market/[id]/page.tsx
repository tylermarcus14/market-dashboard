import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketHistoryChart } from "@/components/markets/market-history-chart";
import {
  formatCurrency,
  formatDate,
  formatDelta,
  formatPercent,
} from "@/lib/format";
import { getMarketDetails, getMarketHistory } from "@/lib/markets/queries";

type MarketPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MarketPage({ params }: MarketPageProps) {
  const { id } = await params;
  const [details, history] = await Promise.all([
    getMarketDetails(id),
    getMarketHistory(id, { window: "24h", limit: 200 }),
  ]);

  if (!details) {
    notFound();
  }

  const { market, movement } = details;
  const chartData = history.map((snapshot) => ({
    capturedAt: snapshot.capturedAt.toISOString(),
    probability: snapshot.outcomePrices[0] ?? null,
  }));

  return (
    <main className="min-h-screen bg-zinc-50 p-6 font-sans dark:bg-black">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <Link className="text-sm text-zinc-500 underline" href="/">
          Back to dashboard
        </Link>

        <header className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">{market.eventTitle}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {market.question}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {market.description}
          </p>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <StatCard
            label={`${market.outcomes[0] ?? "Primary"} odds`}
            value={formatPercent(market.outcomePrices[0])}
          />
          <StatCard
            label="Snapshot delta"
            value={formatDelta(movement.primaryProbabilityDelta)}
          />
          <StatCard label="24h volume" value={formatCurrency(market.volume24hr)} />
          <StatCard label="Liquidity" value={formatCurrency(market.liquidity)} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Primary probability
                </h2>
                <p className="text-sm text-zinc-500">Last 24 hours</p>
              </div>
              <p className="text-sm text-zinc-500">
                Updated {formatDate(market.lastSyncedAt)}
              </p>
            </div>
            <MarketHistoryChart data={chartData} />
          </div>

          <aside className="space-y-3 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Market details
            </h2>
            <DetailRow label="Status" value={market.closed ? "Closed" : "Open"} />
            <DetailRow label="Accepting orders" value={market.acceptingOrders ? "Yes" : "No"} />
            <DetailRow label="Spread" value={formatPercent(market.spread)} />
            <DetailRow label="Best bid" value={formatPercent(market.bestBid)} />
            <DetailRow label="Best ask" value={formatPercent(market.bestAsk)} />
            <DetailRow label="Ends" value={formatDate(market.endDate)} />
          </aside>
        </section>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-950">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 py-2 text-sm last:border-0 dark:border-zinc-800">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}
