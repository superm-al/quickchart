QuickChart
---
[![Build Status](https://api.travis-ci.com/typpo/quickchart.svg?branch=master)](https://travis-ci.com/typpo/quickchart)

[QuickChart](https://quickchart.io/) is a service that generates images of charts from a URL.  Because these charts are simple images, they are very easy to embed in non-dynamic environments such as email, SMS, chat rooms, and so on.

## See it in action

The chart image generation service is available online at [QuickChart.io](https://quickchart.io/).  There is an interactive editor that allows you to adjust inputs and build images.

Here's an example chart that is defined completely by its URL:

<img src="https://quickchart.io/chart?bkg=white&c=%7Btype%3A%27bar%27%2Cdata%3A%7Blabels%3A%5B%27January%27%2C%27February%27%2C%27March%27%2C%27April%27%2C%27May%27%5D%2Cdatasets%3A%5B%7Blabel%3A%27Dogs%27%2Cdata%3A%5B50%2C60%2C70%2C180%2C190%5D%7D%2C%7Blabel%3A%27Cats%27%2Cdata%3A%5B100%2C200%2C300%2C400%2C500%5D%7D%5D%7D%7D" width="500" />

The above image can be included anywhere you like.  Here is its URL:

[https://quickchart.io/chart?width=500&height=300&c={type:'bar',data:{labels:['January','February','March','April','May'],datasets:[{label:'Dogs',data:[50,60,70,180,190]},{label:'Cats',data:[100,200,300,400,500]}]}}](https://quickchart.io/chart?width=500&height=300&c={type:'bar',data:{labels:['January','February','March','April','May'],datasets:[{label:'Dogs',data:[50,60,70,180,190]},{label:'Cats',data:[100,200,300,400,500]}]}})

As you can see, the Javascript or JSON object contained in the URL defines the chart:

```js
{
  type: 'bar',
  data: {
    labels: ['January', 'February', 'March', 'April', 'May'],
    datasets: [{
      label: 'Dogs',
      data: [ 50, 60, 70, 180, 190 ]
    }, {
      label: 'Cats',
      data: [ 100, 200, 300, 400, 500 ]
    }]
  }
}
```

**Go to  the full [QuickChart documentation](https://quickchart.io/documentation) to learn more.  See [gallery](https://quickchart.io/gallery/) for examples.**

## Configuring your chart

The chart configuration object is based on the popular Chart.js API.  Check out the [Chart.js documentation](https://www.chartjs.org/docs/2.9.4/charts/) for more information on how to customize your chart, or see [QuickChart documentation](https://quickchart.io/documentation#parameters) for API options.

QuickChart includes many Chart.js plugins that allow you to add chart annotations, data labels, and more: `chartjs-plugin-datalabels`, `chartjs-plugin-annotation`, `chartjs-plugin-piechart-outlabels`, `chartjs-chart-radial-gauge`, `chartjs-chart-box-and-violin-plot `, `chartjs-plugin-doughnutlabel`, and `chartjs-plugin-colorschemes`.

### Chart.js versions

Chart.js v3 and v4 are supported via the `version` parameter ([documentation](https://quickchart.io/documentation/) to read more about parameters).  Custom chart plugins such as annotations and outlabels currently not available for >= 3.0.0.

Each QuickChart instance should use 1 specific version of the Chart.js library.  Mixing and matching versions (e.g., rendering a v2 chart followed by a v3 chart) is not well supported.

## QR Codes

The service also produces QR codes.  For example, https://quickchart.io/qr?text=Hello+world produces:

![https://quickchart.io/qr?text=Hello+world](https://quickchart.io/qr?text=Hello+world)

The `/qr` endpoint has the following query parameters:
  - `text` - QR code data (required)
  - `format` - png or svg (png default)
  - `size` - size in pixels of one side of the square image (defaults to 150)
  - `margin` - size of the QR image margin in modules (defaults to 4)
  - `ecLevel` - Error correction level (defaults to M)
  - `dark` - Hex color code for dark portion of QR code (defaults to `000000`)
  - `light` - Hex color code for light portion of QR code (defauls to `ffffff`)

## Client libraries

  - [quickchart-js](https://github.com/typpo/quickchart-js) - Javascript
  - [quickchart-python](https://github.com/typpo/quickchart-python) - Python
  - [quickchart-ruby](https://github.com/typpo/quickchart-ruby) - Ruby
  - [quickchart-php](https://github.com/typpo/quickchart-php) - PHP
  - [quickchart-csharp](https://github.com/typpo/quickchart-csharp) - C#
  - [quickchart-java](https://github.com/typpo/quickchart-java) - Java
  - [chartjs-to-image](https://www.npmjs.com/package/chartjs-to-image) - Javascript package for Chart.js images

## Dependencies and Installation

**Requirements:** Node.js >= 22

Chart generation requires system dependencies for the `canvas` npm package: Cairo, Pango, libjpeg, and giflib.

- **macOS:** `brew install cairo pango libffi`
- **Ubuntu/Debian:** `apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

```bash
npm install
npm run build
npm start
```

The server starts on port 3400. Set the `PORT` environment variable to change this.

## Securing your self-hosted instance

This server assumes all Javascript sent in the config object is friendly.  If you are hosting QuickChart youself, take care not to expose the service to untrusted parties.  Because Chart.js configs may contain arbitrary Javascript, it is necessary to properly sandbox your QuickChart instance if you are exposing it to the outside world.

## Health and Monitoring

- **`GET /healthcheck`** — returns `{"success":true,"version":"2.0.0"}` with a 200 status code
- **`GET /metrics`** — Prometheus-format metrics (request counts, render counts, error counts, duration histograms)

## License

QuickChart is open source, licensed under version 3 of the GNU AGPL.  If you would like to modify this project for commercial purposes (and not release the source code), please [contact me](https://www.ianww.com/).
