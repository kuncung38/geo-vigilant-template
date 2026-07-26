/**
 * Mint a device token for a monitoring node.
 *
 * Nodes seeded before this script carried placeholder hashes ("hash1"), which no
 * token can ever produce — so every device POST to /api/telemetry returned 401
 * and the system could not ingest data at all.
 *
 * The plaintext token is printed once and never stored: only its SHA-256 goes in
 * the database, which is what `authMiddleware` compares against. A 256-bit random
 * token needs no password-style KDF — there is nothing to brute force.
 *
 * Usage:
 *   bun scripts/mint-device-token.ts <NODE-ID> [--local|--remote]
 *
 * Emits the UPDATE statement to stdout and the token to stderr, so you can pipe
 * SQL somewhere safe without the secret following it:
 *   bun scripts/mint-device-token.ts NODE-C4-A1 > rotate.sql
 */

const HEX = "0123456789abcdef";

function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let out = "";
  for (const b of buf) {
    out += HEX[(b >> 4) & 0xf] + HEX[b & 0xf];
  }
  return out;
}

async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Single quotes are the only SQL metacharacter reachable from these values. */
function sqlQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export async function mintToken(nodeId: string): Promise<{
  token: string;
  tokenHash: string;
  sql: string;
}> {
  const token = `gv_${nodeId.toLowerCase()}_${randomToken()}`;
  const tokenHash = await sha256Hex(token);
  const sql = `UPDATE monitoring_nodes SET device_token_hash = ${sqlQuote(
    tokenHash,
  )} WHERE id = ${sqlQuote(nodeId)};`;
  return { token, tokenHash, sql };
}

if (import.meta.main) {
  const nodeId = process.argv[2];
  if (!nodeId) {
    console.error(
      "usage: bun scripts/mint-device-token.ts <NODE-ID>\n" +
        "then apply the printed SQL with:\n" +
        '  wrangler d1 execute geo-vigilant-db --local  --command "<sql>"\n' +
        '  wrangler d1 execute geo-vigilant-db --remote --command "<sql>"',
    );
    process.exit(1);
  }

  const { token, sql } = await mintToken(nodeId);
  // SQL on stdout (safe to redirect), secret on stderr (never redirected away).
  console.log(sql);
  console.error(`\n  node : ${nodeId}`);
  console.error(`  token: ${token}`);
  console.error(
    "\n  Store this now — it is not recoverable from the database.\n",
  );
}
