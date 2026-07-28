import { Chart } from 'chart.js'
import type { ChartConfiguration, ChartTypeRegistry } from 'chart.js'

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
export const MUTED_TEXT = '#898781'
export const PRIMARY_TEXT = '#ffffff'

const MAX_CATEGORICAL_SLICES = CATEGORICAL_COLORS.length - 1 // last slot reserved for "Other"

export function formatCurrency(
  value: number,
  { currencyCode, locale }: ChartOptions,
  compact = false,
): string {
  if (!compact) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(value)
  }

  const { maximumFractionDigits: defaultMaxFractionDigits } =
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).resolvedOptions()

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    notation: 'compact',
    maximumFractionDigits: Math.min(1, defaultMaxFractionDigits ?? 2),
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
      '<div class="chart-empty m-auto text-[1.25rem] text-white/70">No data for this date range.</div>'
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

export interface CenteredSize {
  widthPx: number
  heightPx: number
}

const CENTERED_WRAP_CLASS = 'centered-canvas-wrap'

// Chart.js sizes the canvas off its direct parent's box, so a fixed-size
// wrapper is what centers it — capping the container itself collapses it.
function getCanvas(
  containerId: string,
  centeredSize?: CenteredSize,
): HTMLCanvasElement | null {
  const container = document.getElementById(containerId)
  if (!container) {
    return null
  }

  if (!centeredSize) {
    let canvas = container.querySelector('canvas')
    if (!canvas || canvas.parentElement !== container) {
      container.innerHTML = ''
      canvas = document.createElement('canvas')
      container.appendChild(canvas)
    }
    return canvas
  }

  let wrap = container.querySelector<HTMLDivElement>(`.${CENTERED_WRAP_CLASS}`)
  if (!wrap) {
    container.innerHTML = ''
    wrap = document.createElement('div')
    wrap.className = CENTERED_WRAP_CLASS
    wrap.style.position = 'absolute'
    wrap.style.top = '50%'
    wrap.style.left = '50%'
    wrap.style.transform = 'translate(-50%, -50%)'
    wrap.appendChild(document.createElement('canvas'))
    container.appendChild(wrap)
  }
  wrap.style.width = `${centeredSize.widthPx}px`
  wrap.style.height = `${centeredSize.heightPx}px`
  wrap.style.maxWidth = '100%'
  wrap.style.maxHeight = '100%'
  return wrap.querySelector('canvas')
}

export function renderChart<TType extends keyof ChartTypeRegistry>(
  containerId: string,
  config: ChartConfiguration<TType>,
  centeredSize?: CenteredSize,
): void {
  const canvas = getCanvas(containerId, centeredSize)
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
