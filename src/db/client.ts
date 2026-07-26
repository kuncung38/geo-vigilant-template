import { drizzle as drizzleBun } from "drizzle-orm/bun-sqlite";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

// biome-ignore lint/suspicious/noExplicitAny: supports D1Database or bun:sqlite Database
export function getDb(db: any) {
  if (
    typeof db?.prepare === "function" &&
    typeof db?.exec === "function" &&
    !db?.batch
  ) {
    return drizzleBun(db, { schema });
  }
  return drizzleD1(db, { schema });
}
