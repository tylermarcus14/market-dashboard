import Link from "next/link";

import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getLatestMarketMoversBrief } from "@/lib/insights/market-movers-brief";
import { parseMarketListParams } from "@/lib/markets/params";
import { listMarkets } from "@/lib/markets/queries";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = parseMarketListParams(toUrlSearchParams(await searchParams));
  const [markets, latestBrief] = await Promise.all([
    listMarkets(params),
    getLatestMarketMoversBrief(),
  ]);
  const totalVolume24hr = markets.reduce(
    (sum, market) => sum + (market.volume24hr ?? 0),
    0,
  );
  const totalLiquidity = markets.reduce(
    (sum, market) => sum + (market.liquidity ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-zinc-50 p-6 font-sans dark:bg-black">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-950">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Polymarket Intelligence
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Market Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                Active markets from Polymarket Gamma API, backed by stored snapshots for trend
                analysis.
              </p>
            </div>
            <p className="text-sm text-zinc-500">
              Showing {markets.length} markets
            </p>
          </div>
        </header>

        <form className="grid gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-950 sm:grid-cols-[1fr_repeat(4,auto)]">
          <input
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-black dark:text-zinc-50"
            defaultValue={params.q ?? ""}
            name="q"
            placeholder="Search markets"
          />
          <select
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-black"
            defaultValue={params.status}
            name="status"
          >
            <option value="open">Open</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
          <select
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-black"
            defaultValue={params.sort}
            name="sort"
          >
            <option value="volume24hr">24h volume</option>
            <option value="volume">Total volume</option>
            <option value="liquidity">Liquidity</option>
            <option value="spread">Spread</option>
            <option value="endDate">End date</option>
          </select>
          <select
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-black"
            defaultValue={params.dir}
            name="dir"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
            Apply
          </button>
        </form>

        <section className="grid gap-3 md:grid-cols-3">
          <StatCard label="24h volume" value={formatCurrency(totalVolume24hr)} />
          <StatCard label="Liquidity" value={formatCurrency(totalLiquidity)} />
          <StatCard label="Default sort" value={params.sort} />
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-950">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Market Movers Brief
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                AI summary generated from stored snapshot movement and market
                quality signals.
              </p>
            </div>
            {latestBrief ? (
              <p className="text-sm text-zinc-500">
                {formatDate(latestBrief.createdAt)}
              </p>
            ) : null}
          </div>
          {latestBrief ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {latestBrief.summary}
              </p>
              <BriefMoverList report={latestBrief.report} />
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-zinc-950">
          <div className="grid gap-4 border-b border-zinc-200 p-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 md:grid-cols-[1fr_120px_120px_120px]">
            <span>Market</span>
            <span>Odds</span>
            <span>24h volume</span>
            <span>Liquidity</span>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {markets.map((market) => (
              <Link
                className="grid gap-4 p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 md:grid-cols-[1fr_120px_120px_120px]"
                href={`/market/${market.id}`}
                key={market.id}
              >
                <div>
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">
                    {market.question}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {market.eventTitle ?? "No event"} · ends{" "}
                    {formatDate(market.endDate)}
                  </p>
                </div>
                <MarketMetric
                  label="Odds"
                  value={formatPercent(market.outcomePrices[0])}
                />
                <MarketMetric
                  label="24h volume"
                  value={formatCurrency(market.volume24hr)}
                />
                <MarketMetric
                  label="Liquidity"
                  value={formatCurrency(market.liquidity)}
                />
              </Link>
            ))}
          </div>
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

function MarketMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500 md:hidden">
        {label}
      </p>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{value}</p>
    </div>
  );
}

function BriefMoverList({ report }: { report: Record<string, unknown> | null }) {
  if (!report || !Array.isArray(report.topMovers)) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {report.topMovers.slice(0, 4).map((item, index) => {
        if (!isBriefMover(item)) {
          return null;
        }

        return (
          <Link
            className="rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            href={`/market/${item.marketId}`}
            key={item.marketId}
          >
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {index + 1}. {item.title}
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {item.whyItMatters}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

function isBriefMover(value: unknown): value is {
  marketId: string;
  title: string;
  whyItMatters: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "marketId" in value &&
    "title" in value &&
    "whyItMatters" in value &&
    typeof value.marketId === "string" &&
    typeof value.title === "string" &&
    typeof value.whyItMatters === "string"
  );
}

function toUrlSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
}
