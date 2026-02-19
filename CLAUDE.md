# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run build          # TypeScript compile to dist/
npm run typecheck      # Type check without emitting
npm run dev            # Dev server with hot reload (tsx watch)
npm start              # Run production build (dist/index.js)
npm test               # Run all tests (vitest)
npm run test:watch     # Watch mode tests
npx vitest run tests/unit/services/chart.service.test.ts  # Run a single test file
npm run lint           # ESLint (src/ and tests/)
npm run format         # Prettier
```

Server runs on port 3400 by default (`PORT` env var to change). Requires Node >= 22.

## Architecture

TypeScript + ESM (`"type": "module"`), strict mode, Node16 module resolution. All imports use `.js` extensions.

### Request Flow

```
Request → Middleware (helmet, CORS, pino-http, rate-limit)
        → Route → Zod validation middleware → Controller → Service → Buffer response
        → Error handler (catches AppError subclasses → JSON)
```

**App factory pattern**: `src/app.ts` exports `createApp()` which returns an Express app without calling `.listen()`. Entry point (`src/index.ts`) calls listen. Tests use supertest directly on the app via `tests/helpers/test-app.ts`.

### Key Layers

- **Schemas** (`src/schemas/`): Zod schemas that validate and coerce query/body params. The `validate()` and `validateMerged()` middleware in `src/middleware/validate.ts` apply these before controllers run.
- **Controllers** (`src/controllers/`): Thin handlers that extract validated params, call services, and format HTTP responses. No business logic here.
- **Services** (`src/services/`): All rendering logic. Zero Express dependency — accept typed inputs, return Buffers.

### Chart Rendering Pipeline

`chart.service.ts` is the core. The rendering flow:

1. **Config parsing**: JSON input is parsed with `JSON.parse()`. Non-JSON (JS expressions with functions like `getGradientFill`) falls back to `chart-config-parser.ts` which uses `vm.createContext()` with a sandboxed environment (1s timeout, eval/WASM disabled, 100KB input limit).
2. **Custom type transforms**: `chart-plugins.ts` converts `sparkline` → `line` and `progressBar` → `bar` with v4-style scale syntax (`scales.x`/`scales.y`).
3. **Rendering**: `chartjs-node-canvas` v5 creates per-render instances. SVG requires `type: 'svg'` in the constructor (not as a param to `renderToBufferSync`).
4. **Post-processing**: SVG gets unique clip-path IDs (`svg.service.ts`). PNG can convert to WebP (sharp) or PDF (pdfkit).

### Error Handling

`AppError` base class in `src/types/errors.ts` with subclasses: `ValidationError` (400), `ChartParseError` (422), `ChartRenderError` (422), `GraphvizRenderError` (422), `QrGenerationError` (422). The global error handler returns JSON `{ error: { code, message } }`. Unknown errors return 500 with generic message (no leak).

### Graphviz

Uses `@viz-js/viz` v3 (WASM-based, replaces deprecated `viz.js` v2). The API is `instance()` → `viz.renderString()`. SVG output is default; PNG conversion goes through sharp.

## API Endpoints

- `GET/POST /chart` — Chart.js v4 config (JSON or JS expression), formats: png/svg/webp/pdf
- `GET /qr` — QR codes (png/svg)
- `GET/POST /graphviz` — Graphviz DOT language, engines: dot/neato/twopi/circo/fdp/osage/patchwork/sfdp
- `GET /healthcheck` — `{ success: true, version: "2.0.0" }`
- `GET /metrics` — Prometheus format (prom-client)

## Environment Variables

`PORT`, `NODE_ENV`, `LOG_LEVEL`, `CORS_ORIGIN`, `RATE_LIMIT_PER_MIN`, `REQUEST_TIMEOUT_MS`, `EXPRESS_JSON_LIMIT`, `CHART_MAX_WIDTH`, `CHART_MAX_HEIGHT`, `DISABLE_METRICS` — all validated by Zod in `src/config/index.ts`.

## Testing

Vitest with `pool: 'forks'`. Test setup in `tests/setup.ts` sets `NODE_ENV=test`, `PORT=3401`, `LOG_LEVEL=error`. Integration tests use supertest on the app factory. Chart fixtures in `tests/helpers/chart-fixtures.ts` use Chart.js v4 format.

## Security Note

Chart configs can contain JavaScript expressions evaluated in a VM sandbox. The sandbox disables `eval()` and WASM code generation, enforces a 1-second timeout, and limits input to 100KB. Gradient/pattern helpers are injected as sandbox globals.

## Additional Instructions

- Before writing any code, describe your approach and wait for approval. Always ask clarifying questions before writing any code if requirements are ambiguous.
- If a task requires changes to more than 3 files, stop and break it into smaller tasks first.
- After writing code, list what could break and suggest tests to cover it.
- When there’s a bug, start by writing a test that reproduces it, then fix it until the test passes.
- Every time I correct you, add a new rule to the CLAUDE .md file so it never happens again.