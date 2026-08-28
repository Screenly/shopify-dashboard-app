import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
} from 'chart.js'
import type { Plugin, ScriptableContext } from 'chart.js'
import type { ChartDatum, ChartOptions } from './charts'
import {
  MUTED_TEXT,
  PRIMARY_TEXT,
  SINGLE_SERIES_COLOR,
  SURFACE_COLOR,
  formatCurrency,
  renderChart,
  showEmptyState,
  truncateLabel,
} from './charts'

const GRIDLINE_COLOR = '#2c2c2a'
const AXIS_COLOR = '#383835'

// No Tooltip/Legend plugin: single-series charts don't need a legend box,
// and this is digital signage with no pointer/hover input.
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
)

// Chart.js has no built-in "label the endpoint" behavior; a datalabels
// plugin package would add one, but the dataviz skill's guidance (label
// selectively, e.g. the endpoint) is cheap enough to draw ourselves.
function endLabelPlugin(options: ChartOptions): Plugin<'line'> {
  return {
    id: 'endLabel',
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0)
      const point = meta.data[meta.data.length - 1]
      const value = chart.data.datasets[0].data.at(-1) as number | undefined
      if (!point || value === undefined) {
        return
      }
      const ctx = chart.ctx
      ctx.save()
      ctx.fillStyle = PRIMARY_TEXT
      ctx.font = '600 14px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(formatCurrency(value, options), point.x, point.y - 14)
      ctx.restore()
    },
  }
}

function firstLastTickCallback(labels: string[]) {
  return (_value: string | number, index: number): string =>
    index === 0 || index === labels.length - 1
      ? truncateLabel(labels[index], 16)
      : ''
}

export function renderLineChart(
  containerId: string,
  points: ChartDatum[],
  options: ChartOptions,
): void {
  if (points.length === 0) {
    showEmptyState(containerId)
    return
  }

  const labels = points.map((p) => p.label)
  renderChart(containerId, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: points.map((p) => p.value),
          borderColor: SINGLE_SERIES_COLOR,
          backgroundColor: SINGLE_SERIES_COLOR,
          borderWidth: 2,
          pointRadius: (ctx: ScriptableContext<'line'>) =>
            ctx.dataIndex === points.length - 1 ? 5 : 0,
          pointBackgroundColor: SINGLE_SERIES_COLOR,
          pointBorderColor: SURFACE_COLOR,
          pointBorderWidth: 2,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          border: { color: AXIS_COLOR },
          ticks: {
            color: MUTED_TEXT,
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            callback: firstLastTickCallback(labels),
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: GRIDLINE_COLOR },
          border: { display: false },
          ticks: {
            color: MUTED_TEXT,
            callback: (value) => formatCurrency(Number(value), options, true),
          },
        },
      },
    },
    plugins: [endLabelPlugin(options)],
  })
}

export function renderColumnChart(
  containerId: string,
  points: ChartDatum[],
  options: ChartOptions,
): void {
  if (points.length === 0) {
    showEmptyState(containerId)
    return
  }

  const labels = points.map((p) => p.label)
  renderChart(containerId, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: points.map((p) => p.value),
          backgroundColor: SINGLE_SERIES_COLOR,
          borderRadius: {
            topLeft: 4,
            topRight: 4,
            bottomLeft: 0,
            bottomRight: 0,
          },
          maxBarThickness: 24,
          categoryPercentage: 0.8,
          barPercentage: 0.9,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          border: { color: AXIS_COLOR },
          ticks: {
            color: MUTED_TEXT,
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            callback: firstLastTickCallback(labels),
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: GRIDLINE_COLOR },
          border: { display: false },
          ticks: {
            color: MUTED_TEXT,
            callback: (value) => formatCurrency(Number(value), options, true),
          },
        },
      },
    },
  })
}
