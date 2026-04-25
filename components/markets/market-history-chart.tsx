"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HistoryPoint = {
  capturedAt: string;
  probability: number | null;
};

type MarketHistoryChartProps = {
  data: HistoryPoint[];
};

export function MarketHistoryChart({ data }: MarketHistoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No snapshot history yet.
      </div>
    );
  }

  return (
    <div className="h-64 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="capturedAt"
            minTickGap={32}
            tick={{ fontSize: 12 }}
            tickFormatter={(value: string) =>
              new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(value))
            }
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "-",
              "Primary odds",
            ]}
            labelFormatter={(value) => {
              const date = new Date(String(value));

              return Number.isNaN(date.getTime())
                ? String(value)
                : new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(date);
            }}
          />
          <Line
            dataKey="probability"
            dot={false}
            stroke="#2563eb"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
