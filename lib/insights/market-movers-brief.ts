import { desc } from "drizzle-orm";

import { getDb } from "../db/client";
import { aiInsights } from "../db/schema";
import { buildMoverSignals, type MoverSignalsInput } from "./movers";

type MarketMoverReport = {
  summary: string;
  topMovers: {
    marketId: string;
    title: string;
    whyItMatters: string;
    risk: string;
    watch: string;
  }[];
  risks: string[];
  watchlist: string[];
};

export async function getLatestMarketMoversBrief() {
  const db = getDb();
  const [insight] = await db
    .select()
    .from(aiInsights)
    .orderBy(desc(aiInsights.createdAt))
    .limit(1);

  return insight ?? null;
}

export async function generateMarketMoversBrief() {
  const inputSignals = await buildMoverSignals();

  if (inputSignals.movers.length === 0) {
    throw new Error("No mover signals available yet");
  }

  const model = (await readEnvValue("OPENAI_MODEL")) || "gpt-5.4-mini";
  const { report, rawResponse } = await callOpenAiForBrief(inputSignals, model);
  const content = renderBriefContent(report);
  const db = getDb();
  const [insight] = await db
    .insert(aiInsights)
    .values({
      title: "Market Movers Brief",
      summary: report.summary,
      content,
      model,
      inputMarketIds: inputSignals.movers.map((mover) => mover.marketId),
      inputSignals,
      report,
      rawResponse,
    })
    .returning();

  return insight;
}

async function callOpenAiForBrief(
  inputSignals: MoverSignalsInput,
  model: string,
): Promise<{ report: MarketMoverReport; rawResponse: Record<string, unknown> }> {
  const apiKey = await readEnvValue("OPENAI_API_KEY");

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate market movers brief");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "medium" },
      input: [
        {
          role: "system",
          content:
            "You write concise market intelligence for prediction-market users. Ground every point in the provided structured signals. Do not invent outside facts.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Create a Market Movers Brief with ranked opportunities, risks, and watchlist notes.",
            signals: inputSignals,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "market_movers_brief",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["summary", "topMovers", "risks", "watchlist"],
            properties: {
              summary: { type: "string" },
              topMovers: {
                type: "array",
                maxItems: 5,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "marketId",
                    "title",
                    "whyItMatters",
                    "risk",
                    "watch",
                  ],
                  properties: {
                    marketId: { type: "string" },
                    title: { type: "string" },
                    whyItMatters: { type: "string" },
                    risk: { type: "string" },
                    watch: { type: "string" },
                  },
                },
              },
              risks: {
                type: "array",
                maxItems: 4,
                items: { type: "string" },
              },
              watchlist: {
                type: "array",
                maxItems: 4,
                items: { type: "string" },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const raw = (await response.json()) as Record<string, unknown>;
  const outputText = extractOutputText(raw);

  if (!outputText) {
    throw new Error("OpenAI response did not include output text");
  }

  return {
    report: JSON.parse(outputText) as MarketMoverReport,
    rawResponse: raw,
  };
}

function extractOutputText(raw: unknown) {
  if (!isRecord(raw) || !Array.isArray(raw.output)) {
    return null;
  }

  for (const item of raw.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (isRecord(content) && content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

function renderBriefContent(report: MarketMoverReport) {
  const topMovers = report.topMovers
    .map((mover, index) => `${index + 1}. ${mover.title}: ${mover.whyItMatters}`)
    .join("\n");
  const risks = report.risks.map((risk) => `- ${risk}`).join("\n");
  const watchlist = report.watchlist.map((item) => `- ${item}`).join("\n");

  return `${report.summary}\n\nTop movers:\n${topMovers}\n\nRisks:\n${risks}\n\nWatchlist:\n${watchlist}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readEnvValue(name: string) {
  if (process.env[name]) {
    return process.env[name];
  }

  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  const { existsSync, readFileSync } = await import("node:fs");
  const { join } = await import("node:path");

  for (const fileName of [".env.local", ".env"]) {
    const filePath = join(process.cwd(), fileName);
    const value = existsSync(filePath)
      ? readValueFromEnvFile(readFileSync(filePath, "utf8"), name)
      : undefined;

    if (value) return value;
  }

  return undefined;
}

function readValueFromEnvFile(contents: string, name: string) {
  const prefix = `${name}=`;
  const line = contents
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith(prefix));

  if (!line) {
    return undefined;
  }

  return line.slice(prefix.length).trim().replace(/^["']|["']$/g, "");
}
