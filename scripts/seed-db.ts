/**
 * Seed the D1 database through wrangler.
 *
 * Applying the seed with `wrangler d1 execute` means the target database comes
 * from wrangler's own config. The previous CLI opened the first *.sqlite file it
 * found under .wrangler/state — so once database_id changed (which every adopter
 * of this template does) it seeded a stale database and still printed success.
 *
 * Usage:
 *   bun scripts/seed-db.ts            # local dev database
 *   bun scripts/seed-db.ts --remote   # deployed D1 (careful)
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSeedSql } from "../src/db/seed";

const DATABASE = "geo-vigilant-db";

const remote = process.argv.includes("--remote");
const target = remote ? "--remote" : "--local";

const sql = await buildSeedSql();
const file = path.join(os.tmpdir(), `geo-vigilant-seed-${Date.now()}.sql`);
fs.writeFileSync(file, sql, "utf-8");

try {
  const result = spawnSync(
    "bunx",
    ["wrangler", "d1", "execute", DATABASE, target, "--file", file],
    { stdio: "inherit", shell: true },
  );
  if (result.status !== 0) {
    console.error(`\nSeeding failed (${target}).`);
    if (!remote) {
      console.error(
        "Run `bun run db:migrate:local` first — the tables must exist.",
      );
    }
    process.exit(result.status ?? 1);
  }
  console.log(`\nSeeded ${DATABASE} (${target.replace("--", "")}).`);
} finally {
  fs.rmSync(file, { force: true });
}
