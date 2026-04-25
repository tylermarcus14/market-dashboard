import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  db ??= drizzle(process.env.DATABASE_URL, { schema });
  return db;
}
