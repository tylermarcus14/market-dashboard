"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateMarketMoversBrief } from "@/lib/insights/market-movers-brief";
import { ingestMarkets } from "@/lib/polymarket/ingest";

export async function refreshMarketDataAction() {
  let notice = "markets-refreshed";

  try {
    await ingestMarkets();
    revalidatePath("/");
  } catch (error) {
    console.error(error);
    notice = "markets-refresh-failed";
  }

  redirect(`/?notice=${notice}`);
}

export async function generateMarketMoversBriefAction() {
  let notice = "brief-generated";

  try {
    await generateMarketMoversBrief();
    revalidatePath("/");
  } catch (error) {
    console.error(error);
    notice = "brief-generation-failed";
  }

  redirect(`/?notice=${notice}`);
}
