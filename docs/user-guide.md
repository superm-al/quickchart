# QuickChart User Guide

QuickChart is a web service that generates chart images, QR codes, and Graphviz diagrams from HTTP requests. The output is a standard image (PNG, SVG, WebP) or PDF that can be embedded anywhere — emails, Slack messages, dashboards, PDFs, or any context where you need a chart without running JavaScript.

## Table of Contents

- [Charts](#charts)
- [QR Codes](#qr-codes)
- [Graphviz Diagrams](#graphviz-diagrams)
- [Error Handling](#error-handling)
- [Self-Hosting](#self-hosting)

---

## Charts

### `GET /chart`

Pass a [Chart.js v4](https://www.chartjs.org/docs/latest/) configuration object as the `chart` query parameter. The response is an image.

**Minimal example:**

```
/chart?chart={type:'bar',data:{labels:['Q1','Q2','Q3'],datasets:[{label:'Revenue',data:[10,20,30]}]}}
```

**curl:**

```bash
curl -o chart.png "http://localhost:3400/chart?chart=\
{type:'bar',data:{labels:['Q1','Q2','Q3'],datasets:[{label:'Revenue',data:[10,20,30]}]}}"
```

**HTML embed:**

```html
<img src="http://localhost:3400/chart?chart={type:'pie',data:{labels:['A','B','C'],datasets:[{data:[30,50,20]}]}}&width=400&height=400&backgroundColor=white" />
```

### `POST /chart`

For larger or complex configs, use a POST request with a JSON body. This avoids URL length limits and the need to URL-encode the config.

```bash
curl -X POST http://localhost:3400/chart \
  -H 'Content-Type: application/json' \
  -d '{
    "chart": "{type:\"bar\",data:{labels:[\"A\",\"B\"],datasets:[{data:[10,20]}]}}",
    "width": 600,
    "height": 400,
    "format": "png",
    "backgroundColor": "white"
  }'  \
  -o chart.png
```

The `chart` field is a string (not a nested JSON object) because it may contain JavaScript expressions.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `chart` | string | *(required)* | Chart.js v4 config. JSON string or JS expression. |
| `width` | integer | 500 | Image width in pixels. Max 3000. |
| `height` | integer | 300 | Image height in pixels. Max 3000. |
| `format` | string | `png` | Output format: `png`, `svg`, `webp`, or `pdf`. |
| `backgroundColor` | string | `transparent` | Background color (CSS color string, e.g. `white`, `#ff0000`). |
| `devicePixelRatio` | number | 2 | Pixel density. Range 0.5–4. Higher values produce sharper images at larger file sizes. |
| `encoding` | string | `url` | Set to `base64` if the `chart` parameter is base64-encoded. |

### Output Formats

- **PNG** (default) — raster image, best for embedding in emails and chat
- **SVG** — vector image, best for web pages that need to scale
- **WebP** — smaller file size than PNG, good browser support
- **PDF** — chart embedded in a PDF page

### Chart.js Configuration

QuickChart uses **Chart.js v4** exclusively. See the [Chart.js docs](https://www.chartjs.org/docs/latest/) for the full configuration reference. Key notes:

- Use `scales.x` and `scales.y` (not the v2-style `xAxes[]`/`yAxes[]`)
- `indexAxis: 'y'` for horizontal bar charts (not `type: 'horizontalBar'`)
- The `chartjs-plugin-datalabels` and `chartjs-plugin-annotation` plugins are registered automatically

### JavaScript Expressions

The `chart` parameter can contain JavaScript expressions, not just JSON. This enables computed values, functions, and gradient fills:

```
{
  type: 'bar',
  data: {
    labels: ['A', 'B', 'C'],
    datasets: [{
      data: [10, 20, 30],
      backgroundColor: getGradientFillHelper('horizontal', ['#36a2eb', '#ff6384'])
    }]
  }
}
```

Available sandbox globals:
- `getGradientFillHelper(direction, colors)` — creates a linear gradient. Direction: `'horizontal'`, `'vertical'`, or `'both'`.
- `getGradientFill(colorStops, linearGradient)` — lower-level gradient API with explicit stops and coordinates.
- `pattern.draw(shapeType, bgColor, patternColor, size)` — creates a pattern fill.

### Custom Chart Types

Two virtual chart types are supported as convenience transforms:

**Sparkline** — a minimal line chart with no axes, legend, or labels:

```json
{
  "type": "sparkline",
  "data": {
    "datasets": [{ "data": [1, 5, 2, 8, 3, 7] }]
  }
}
```

**Progress bar** — a horizontal stacked bar showing progress out of 100:

```json
{
  "type": "progressBar",
  "data": {
    "datasets": [{ "data": [75] }]
  }
}
```

With a single dataset, values are treated as percentages out of 100. With two datasets, the second serves as the denominator.

### Base64 Encoding

If you need to avoid URL-encoding issues, base64-encode your chart config and pass `encoding=base64`:

```bash
CHART=$(echo -n '{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}' | base64)
curl "http://localhost:3400/chart?chart=$CHART&encoding=base64" -o chart.png
```

---

## QR Codes

### `GET /qr`

```
/qr?text=https://example.com
```

**curl:**

```bash
curl -o qr.png "http://localhost:3400/qr?text=https://example.com&size=300"
```

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `text` | string | *(required)* | Data to encode in the QR code. |
| `format` | string | `png` | Output format: `png` or `svg`. |
| `size` | integer | 150 | Width/height of the image in pixels. Max 3000. |
| `margin` | integer | 4 | Quiet zone size in modules. |
| `ecLevel` | string | *(auto)* | Error correction level: `L` (7%), `M` (15%), `Q` (25%), `H` (30%). |
| `dark` | string | `000` | Hex color for dark modules. |
| `light` | string | `fff` | Hex color for light modules. |
| `mode` | string | *(auto)* | Set to `sjis` for Shift-JIS (Japanese) encoding. |

### Examples

Custom colors:
```
/qr?text=hello&dark=336699&light=f0f0f0
```

SVG output:
```
/qr?text=hello&format=svg
```

Large with high error correction:
```
/qr?text=hello&size=500&ecLevel=H
```

---

## Graphviz Diagrams

### `GET /graphviz`

Render graphs written in the [DOT language](https://graphviz.org/doc/info/lang.html).

```
/graphviz?graph=digraph{a->b->c}
```

**curl:**

```bash
curl -o graph.svg "http://localhost:3400/graphviz?graph=digraph{rankdir=LR;a->b->c}"
```

### `POST /graphviz`

```bash
curl -X POST http://localhost:3400/graphviz \
  -H 'Content-Type: application/json' \
  -d '{
    "graph": "digraph { node [shape=box]; Start -> Process -> End }",
    "format": "png",
    "engine": "dot"
  }' \
  -o graph.png
```

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `graph` | string | *(required)* | Graph definition in DOT language. |
| `format` | string | `svg` | Output format: `svg` or `png`. |
| `engine` | string | `dot` | Layout engine: `dot`, `neato`, `twopi`, `circo`, `fdp`, `osage`, `patchwork`, `sfdp`. |
| `width` | integer | *(auto)* | Resize PNG output to this width (PNG only). |
| `height` | integer | *(auto)* | Resize PNG output to this height (PNG only). |

### Layout Engines

- **dot** — hierarchical/directed graphs (default, best for most cases)
- **neato** — undirected graphs using spring model
- **twopi** — radial layout
- **circo** — circular layout
- **fdp** — undirected graphs using force-directed placement
- **osage** — clustered graphs
- **patchwork** — squarified treemaps
- **sfdp** — large undirected graphs

---

## Error Handling

All errors return JSON with an appropriate HTTP status code:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "chart: chart is required"
  }
}
```

### Status Codes

| Code | Error Type | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid parameters |
| 422 | `CHART_PARSE_ERROR` | Chart config cannot be parsed |
| 422 | `CHART_RENDER_ERROR` | Chart.js rendering failed |
| 422 | `GRAPHVIZ_RENDER_ERROR` | Invalid DOT syntax or rendering failure |
| 422 | `QR_GENERATION_ERROR` | QR code generation failed |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests (if rate limiting is enabled) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Self-Hosting

### Requirements

- **Node.js >= 22**
- **System libraries** (for the `canvas` npm package): Cairo, Pango, libjpeg, giflib, librsvg
  - macOS: `brew install cairo pango libffi`
  - Ubuntu/Debian: `apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

### Installation

```bash
git clone https://github.com/typpo/quickchart.git
cd quickchart
npm install
npm run build
npm start
```

The server starts on port 3400. Visit `http://localhost:3400/healthcheck` to verify.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3400` | Server listen port |
| `NODE_ENV` | `production` | `development`, `test`, or `production` |
| `LOG_LEVEL` | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `RATE_LIMIT_PER_MIN` | *(disabled)* | Max requests per minute per IP on `/chart` |
| `REQUEST_TIMEOUT_MS` | `5000` | HTTP request timeout |
| `EXPRESS_JSON_LIMIT` | `100kb` | Max POST body size |
| `CHART_MAX_WIDTH` | `3000` | Maximum allowed chart width in pixels |
| `CHART_MAX_HEIGHT` | `3000` | Maximum allowed chart height in pixels |
| `DISABLE_METRICS` | *(false)* | Set to `1` or `true` to disable `/metrics` |

### Monitoring

- **`GET /healthcheck`** — returns `{"success": true, "version": "2.0.0"}` with a 200 status
- **`GET /metrics`** — Prometheus-format metrics including request counts, render counts, error counts, and request duration histograms

### Security

Chart configs can contain JavaScript expressions. QuickChart evaluates them in a sandboxed VM with the following protections:

- `eval()` and WASM code generation are disabled
- Execution times out after 1 second
- Input is limited to 100KB
- Only gradient and pattern helper functions are available in the sandbox

If you expose QuickChart to untrusted users, these protections mitigate arbitrary code execution. However, you should still run QuickChart behind a reverse proxy and consider rate limiting.
