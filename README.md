# GEO-VIGILANT

A template for building geological / landslide monitoring dashboards on Cloudflare
Workers. It ships a working end-to-end slice: sensor nodes report telemetry over an
authenticated API, readings land in D1, and a React dashboard renders them over a
real 3D terrain map.

Everything in the map stack is free and key-less — there is no API token to obtain
before the map renders.

## Stack

| Layer     | Choice |
| --------- | ------ |
| Runtime   | Cloudflare Workers + [Hono](https://hono.dev) |
| Database  | Cloudflare D1 + [Drizzle ORM](https://orm.drizzle.team) |
| Frontend  | React 18, Vite 6, Tailwind, React Router |
| Map       | [MapLibre GL JS](https://maplibre.org) 5 |
| Basemap   | [OpenFreeMap](https://openfreemap.org) vector tiles (OpenStreetMap data) |
| Elevation | [AWS Open Data Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Terrarium DEM) |
| Tooling   | Bun, Biome, Vitest, Playwright |

## Quick start

```bash
bun install
bun run db:migrate:local
bun run db:seed:local
bun run dev
```

Then open <http://localhost:5173>.

The migrate and seed steps are not optional: without them the API returns 500 and
the dashboard renders empty. It never invents placeholder readings — a monitoring
system that shows a healthy network when its backend is down is worse than one that
shows nothing.

## What you get

- `/` — dashboard: live sensor cards, 24h history table with range filter and
  pagination, and a staleness badge when the newest reading predates the window.
- `/map` — 3D terrain map with real elevation, node markers coloured by condition,
  a 2D/3D toggle, three basemaps, and a relief exaggeration control.
- `/nodes/:id` — per-node diagnostics with a multi-sensor telemetry chart.

Alerts for Warning/Danger nodes surface as dismissible toasts across all pages.

## Sensor ingestion

The dashboard only reads. To get data in, a device POSTs to `/api/telemetry` with a
bearer token. Tokens are stored only as SHA-256 digests.

Mint a token for a node and apply the printed SQL:

```bash
bun run db:token NODE-C4-A1
```

The statement goes to stdout and the secret to stderr, so you can redirect the SQL
without capturing the token. Apply it with `wrangler d1 execute geo-vigilant-db
--local --command "<sql>"` (or `--remote`). Store the token — it cannot be recovered
from the database.

Then simulate a device:

```bash
GV_TOKEN=<token> bun run device:simulate NODE-C4-A1
GV_TOKEN=<token> bun run device:simulate NODE-C4-A1 --condition Danger --watch 60
```

The simulator continues the node's sequence and derives each sensor's condition from
its own thresholds, so it cannot report "Normal" while sending an out-of-range value.
A successful POST also promotes the node's `overallCondition`, which is what drives
the marker colour and the alert toasts.

## Deploy

Two values are deliberately not committed, so this template is not tied to one
Cloudflare account.

1. **Account** — export `CLOUDFLARE_ACCOUNT_ID`, or just `wrangler login` and let
   wrangler prompt you.
2. **Database** — create your own D1 and paste the id into `wrangler.jsonc`:

   ```bash
   bunx wrangler d1 create geo-vigilant-db
   ```

   Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with the id it prints.

Then:

```bash
bun run db:migrate:remote
bun run db:seed:remote      # optional demo data
bun run build
bunx wrangler deploy -c dist/geo_vigilant/wrangler.json
```

Deploy uses the config the Vite plugin generates under `dist/`, which carries the
correct asset paths. Deploying the root `wrangler.jsonc` directly will upload the
wrong directory.

## Testing

```bash
bun run typecheck
bun run lint
bun test tests/integration
bunx vitest run tests/unit
bun run test:e2e          # needs a migrated + seeded local database
```

CI runs all of these on every pull request; end-to-end tests run against a fresh
migrated and seeded database.

## Project structure

```
src/
  client/
    components/   TerrainMap (MapLibre), TelemetryChart, AlertSystem, Navbar
    pages/        Overview, MapOverview, NodeDetail
    lib/          shared status colours, sensor metadata, formatting
  server/         Hono routes, device-token auth
  db/             Drizzle schema + seed data
scripts/          token minting, device simulator, seeding
tests/            unit (Vitest), integration (Bun), e2e (Playwright)
```

## Notes for adapting this template

- **Sensors are defined in one place.** `src/client/lib/telemetry.ts` holds the four
  sensors, their units, icons, thresholds and status colours. Add or rename a sensor
  there and the cards, table and chart all follow.
- **Timestamps are UNIX seconds** everywhere, including `deviceTimestamp`. Use the
  helpers in `lib/telemetry.ts` rather than passing them to `new Date()` directly.
- **SPA routing needs the `ASSETS` binding.** Client routes reach the Worker because
  no static asset matches, so `notFound` hands them back to the asset router. Remove
  that and `/map` 404s in production.
- **The UI is in Indonesian.** Copy lives inline in the page components.
- **Node coordinates drive the map camera.** The map frames the cluster around the
  median position, so one mis-seeded node on the far side of the world will not zoom
  the whole map out.

## Attribution

Map data © OpenStreetMap contributors, served by OpenFreeMap. Elevation from AWS
Open Data Terrain Tiles (SRTM, ASTER, GMTED). Keep the attribution control visible —
it is a licensing requirement, not decoration.
