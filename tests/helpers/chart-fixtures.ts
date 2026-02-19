export const SIMPLE_BAR_CHART = JSON.stringify({
  type: 'bar',
  data: {
    labels: ['January', 'February', 'March', 'April', 'May'],
    datasets: [
      {
        label: 'Dogs',
        data: [50, 60, 70, 180, 190],
      },
      {
        label: 'Cats',
        data: [100, 200, 300, 400, 500],
      },
    ],
  },
});

export const SIMPLE_LINE_CHART = JSON.stringify({
  type: 'line',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Revenue',
        data: [10, 20, 30, 40],
      },
    ],
  },
});

export const SIMPLE_PIE_CHART = JSON.stringify({
  type: 'pie',
  data: {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        data: [300, 50, 100],
      },
    ],
  },
});

export const SPARKLINE_CHART = JSON.stringify({
  type: 'sparkline',
  data: {
    datasets: [
      {
        data: [1, 5, 2, 8, 3, 7, 4],
      },
    ],
  },
});

export const PROGRESS_BAR_CHART = JSON.stringify({
  type: 'progressBar',
  data: {
    datasets: [
      {
        data: [75],
      },
    ],
  },
});

export const JS_EXPRESSION_CHART = `{
  type: 'bar',
  data: {
    labels: ['A', 'B', 'C'],
    datasets: [{
      label: 'Test',
      data: [1, 2, 3]
    }]
  }
}`;
