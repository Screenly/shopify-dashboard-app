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
import type {
  ChartConfiguration,
  ChartTypeRegistry,
  Plugin,
  ScriptableContext,
} from 'chart.js'

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

export interface ChartDatum {
  label: string
  value: number
}

export interface ChartOptions {
  currencyCode: string
  locale: string
}

// Dark-surface reference palette (this app is dark-theme only, no light/dark
// toggle) — see the dataviz skill's references/palette.md for the validated
// categorical order and chart-chrome tokens.
export const CATEGORICAL_COLORS = [
  '#3987e5', // blue
  '#008300', // green
  '#d55181', // magenta
  '#c98500', // yellow
  '#199e70', // aqua
  '#d95926', // orange
  '#9085e9', // violet
  '#e66767', // red
]
export const SINGLE_SERIES_COLOR = CATEGORICAL_COLORS[0]
export const SURFACE_COLOR = '#1a1a19'
const GRIDLINE_COLOR = '#2c2c2a'
const AXIS_COLOR = '#383835'
export const MUTED_TEXT = '#898781'
export const PRIMARY_TEXT = '#ffffff'

const MAX_CATEGORICAL_SLICES = CATEGORICAL_COLORS.length - 1 // last slot reserved for "Other"

export function formatCurrency(
  value: number,
  { currencyCode, locale }: ChartOptions,
  compact = false,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value)
}

export function truncateLabel(label: string, maxLength = 22): string {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label
}

export function foldIntoOther(
  data: ChartDatum[],
  maxSlices: number = MAX_CATEGORICAL_SLICES,
): ChartDatum[] {
  const sorted = [...data].sort((a, b) => b.value - a.value)
  if (sorted.length <= maxSlices) {
    return sorted
  }
  const head = sorted.slice(0, maxSlices)
  const otherValue = sorted
    .slice(maxSlices)
    .reduce((sum, d) => sum + d.value, 0)
  return [...head, { label: 'Other', value: otherValue }]
}

// Chart.js instances must be destroyed before a new one is bound to the same
// canvas, or it throws "Canvas is already in use". Refresh cycles and
// (in principle) view changes both re-render into the same containers.
const chartInstances = new Map<string, Chart>()

export function showEmptyState(containerId: string): void {
  chartInstances.get(containerId)?.destroy()
  chartInstances.delete(containerId)
  const container = document.getElementById(containerId)
  if (container) {
    container.innerHTML =
      '<div class="chart-empty">No data for this date range.</div>'
  }
}

// Chart.js's category scale spreads N bars across the whole container
// height, unlike a fixed-row-height list. Callers that want a compact list
// (e.g. a short ranked bar chart) set an explicit pixel height instead of
// letting the surrounding flex layout stretch it; pass null to go back to
// filling the available space normally.
export function setContainerFixedHeight(
  containerId: string,
  heightPx: number | null,
): void {
  const container = document.getElementById(containerId)
  if (!container) {
    return
  }
  container.style.height = heightPx === null ? '' : `${heightPx}px`
  // The stylesheet's `flex: 1` expands to flex-basis: 0%, which wins over
  // `height` for main-axis sizing in a column flex container. Overriding
  // flex-grow alone isn't enough — the whole shorthand must be reset so
  // flex-basis falls back to `auto` and the explicit height takes effect.
  container.style.flex = heightPx === null ? '' : 'none'
}

function getCanvas(containerId: string): HTMLCanvasElement | null {
  const container = document.getElementById(containerId)
  if (!container) {
    return null
  }
  let canvas = container.querySelector('canvas')
  if (!canvas) {
    container.innerHTML = ''
    canvas = document.createElement('canvas')
    container.appendChild(canvas)
  }
  return canvas
}

export function renderChart<TType extends keyof ChartTypeRegistry>(
  containerId: string,
  config: ChartConfiguration<TType>,
): void {
  const canvas = getCanvas(containerId)
  if (!canvas) {
    return
  }
  chartInstances.get(containerId)?.destroy()
  // Chart.js's constructor doesn't accept a generic ChartConfiguration<TType>
  // directly (its own type narrows to a concrete union); callers already
  // built a fully-typed config, so this cast is a boundary-only widening.
  chartInstances.set(
    containerId,
    new Chart(canvas, config as ChartConfiguration),
  )
}

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
