// Usage: bun scripts/mint-device-token.ts <NODE-ID>
// Prints the UPDATE to stdout and the token to stderr, so redirecting the SQL
// does not capture the secret. Only the SHA-256 is stored.

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
  console.log(sql);
  console.error(`\n  node : ${nodeId}`);
  console.error(`  token: ${token}`);
  console.error(
    "\n  Store this now — it is not recoverable from the database.\n",
  );
}
