import type { ChartConfiguration, Plugin } from 'chart.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function createBackgroundPlugin(backgroundColor: string | undefined): Plugin {
  return {
    id: 'quickchart-background',
    beforeDraw: (chartInstance) => {
      if (backgroundColor && backgroundColor !== 'transparent') {
        const { ctx, width, height } = chartInstance;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }
    },
  };
}

export function applySparklineTransform(chart: ChartConfiguration): void {
  if (chart.type !== ('sparkline' as string)) return;

  const data = chart.data;
  if (!data?.datasets?.length) {
    throw new Error('"sparkline" requires at least 1 dataset');
  }

  chart.type = 'line';
  const dataseries = data.datasets[0]!.data as number[];
  if (!data.labels) {
    data.labels = Array(dataseries.length);
  }

  chart.options = chart.options || {};
  chart.options.plugins = chart.options.plugins || {};
  chart.options.plugins.legend = chart.options.plugins.legend || { display: false };

  chart.options.elements = chart.options.elements || {};
  chart.options.elements.line = chart.options.elements.line || {
    borderColor: '#000',
    borderWidth: 1,
  };
  chart.options.elements.point = chart.options.elements.point || {
    radius: 0,
  };

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const dp of dataseries) {
    min = Math.min(min, dp);
    max = Math.max(max, dp);
  }

  chart.options.scales = chart.options.scales || {};
  chart.options.scales.x = chart.options.scales.x || { display: false };
  chart.options.scales.y = chart.options.scales.y || {
    display: false,
    min: min - min * 0.05,
    max: max + max * 0.05,
  };
}

export function applyProgressBarTransform(chart: ChartConfiguration): void {
  if (chart.type !== ('progressBar' as string)) return;

  chart.type = 'bar';
  const datasets = chart.data?.datasets;
  if (!datasets || datasets.length < 1 || datasets.length > 2) {
    throw new Error('progressBar chart requires 1 or 2 datasets');
  }

  let usePercentage = false;
  const dataLen = (datasets[0]!.data as number[]).length;

  if (datasets.length === 1) {
    usePercentage = true;
    datasets.push({
      data: Array(dataLen).fill(100) as number[],
    });
  }

  if (
    (datasets[0]!.data as number[]).length !== (datasets[1]!.data as number[]).length
  ) {
    throw new Error('progressBar datasets must have the same size of data');
  }

  chart.data.labels = chart.data.labels || Array.from(Array(dataLen).keys()).map(String);

  const ds1 = datasets[1]!;
  ds1.backgroundColor = ds1.backgroundColor || '#fff';
  ds1.borderColor = ds1.borderColor || '#4e78a7';
  ds1.borderWidth = ds1.borderWidth || 1;

  const existingOptions = chart.options || {};
  chart.options = {
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#fff',
        formatter: (val: number) => {
          if (usePercentage) return `${val}%`;
          return String(val);
        },
        display: (ctx: any) => ctx.datasetIndex === 0,
      },
    } as any,
    scales: {
      x: {
        ticks: { display: false },
        grid: { display: false },
        beginAtZero: true,
      },
      y: {
        stacked: true,
        ticks: { display: false },
        grid: { display: false },
      },
    },
    ...existingOptions,
  };
}
