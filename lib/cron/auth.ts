import type { NextRequest } from "next/server";

export function isCronAuthorized(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}
