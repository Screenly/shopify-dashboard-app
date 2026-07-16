import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
} from 'chart.js'
import type { Plugin } from 'chart.js'
import type { ChartDatum, ChartOptions } from './charts'
import {
  CATEGORICAL_COLORS,
  MUTED_TEXT,
  PRIMARY_TEXT,
  SINGLE_SERIES_COLOR,
  formatCurrency,
  foldIntoOther,
  renderChart,
  setContainerFixedHeight,
  showEmptyState,
  truncateLabel,
} from './charts'

const MIN_RANKED_BAR_ROW_HEIGHT = 44
const MAX_RANKED_BAR_ROW_HEIGHT = 120
const TARGET_RANKED_BAR_LIST_HEIGHT = 480
const MAX_RANKED_BAR_ITEMS_LANDSCAPE = 15
const MAX_RANKED_BAR_ITEMS_PORTRAIT = 30
const DONUT_SIZE_LANDSCAPE = { widthPx: 1200, heightPx: 520 }
const DONUT_SIZE_PORTRAIT = { widthPx: 800, heightPx: 900 }
const DONUT_RADIUS_LANDSCAPE = '100%'
const DONUT_RADIUS_PORTRAIT = '80%'
const DONUT_LEGEND_FONT_SIZE_LANDSCAPE = 22
const DONUT_LEGEND_FONT_SIZE_PORTRAIT = 26

function rankedBarRowHeight(itemCount: number): number {
  return Math.min(
    MAX_RANKED_BAR_ROW_HEIGHT,
    Math.max(
      MIN_RANKED_BAR_ROW_HEIGHT,
      TARGET_RANKED_BAR_LIST_HEIGHT / itemCount,
    ),
  )
}

function rankedBarThickness(rowHeight: number): number {
  return Math.round(Math.min(72, Math.max(20, rowHeight * 0.6)))
}

// No Tooltip plugin: this is digital signage with no pointer/hover input.
Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
)

function barValueLabelPlugin(options: ChartOptions): Plugin<'bar'> {
  return {
    id: 'barValueLabel',
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0)
      const ctx = chart.ctx
      ctx.save()
      ctx.fillStyle = MUTED_TEXT
      ctx.font = '13px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      meta.data.forEach((bar, i) => {
        const value = chart.data.datasets[0].data[i] as number
        const point = bar.getProps(['x', 'y'], true)
        ctx.fillText(formatCurrency(value, options), point.x + 8, point.y)
      })
      ctx.restore()
    },
  }
}

export function renderRankedBarChart(
  containerId: string,
  bars: ChartDatum[],
  options: ChartOptions,
): void {
  if (bars.length === 0) {
    showEmptyState(containerId)
    return
  }

  const isPortrait = window.matchMedia('(orientation: portrait)').matches
  const maxItems = isPortrait
    ? MAX_RANKED_BAR_ITEMS_PORTRAIT
    : MAX_RANKED_BAR_ITEMS_LANDSCAPE
  // foldIntoOther also sorts descending, and Chart.js renders category index
  // 0 at the top for this horizontal (indexAxis: 'y') layout, so the
  // highest-selling product ends up first.
  const capped = foldIntoOther(bars, maxItems)
  const rowHeight = rankedBarRowHeight(capped.length)
  setContainerFixedHeight(containerId, capped.length * rowHeight + 16)
  renderChart(containerId, {
    type: 'bar',
    data: {
      labels: capped.map((b) => truncateLabel(b.label)),
      datasets: [
        {
          data: capped.map((b) => b.value),
          backgroundColor: SINGLE_SERIES_COLOR,
          borderRadius: {
            topLeft: 0,
            topRight: 4,
            bottomLeft: 0,
            bottomRight: 4,
          },
          maxBarThickness: rankedBarThickness(rowHeight),
          categoryPercentage: 0.8,
          barPercentage: 0.9,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { right: 96 } },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          display: false,
          grid: { display: false },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: PRIMARY_TEXT, font: { size: 14 } },
        },
      },
    },
    plugins: [barValueLabelPlugin(options)],
  })
}

export function renderDonutChart(
  containerId: string,
  slices: ChartDatum[],
  options: ChartOptions,
): void {
  const data = foldIntoOther(slices).filter((d) => d.value > 0)
  if (data.length === 0) {
    showEmptyState(containerId)
    return
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const isPortrait = window.matchMedia('(orientation: portrait)').matches

  setContainerFixedHeight(containerId, null)
  renderChart(
    containerId,
    {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.value),
            backgroundColor: CATEGORICAL_COLORS.slice(0, data.length),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        cutout: '60%',
        radius: isPortrait ? DONUT_RADIUS_PORTRAIT : DONUT_RADIUS_LANDSCAPE,
        plugins: {
          legend: {
            display: true,
            position: isPortrait ? 'bottom' : 'right',
            labels: {
              color: PRIMARY_TEXT,
              boxWidth: 20,
              boxHeight: 20,
              padding: 28,
              font: {
                size: isPortrait
                  ? DONUT_LEGEND_FONT_SIZE_PORTRAIT
                  : DONUT_LEGEND_FONT_SIZE_LANDSCAPE,
              },
              generateLabels: () =>
                data.map((d, i) => {
                  const pct = Math.round((d.value / total) * 100)
                  const amount = formatCurrency(d.value, options, true)
                  return {
                    text: `${truncateLabel(d.label, 40)}  ${amount} · ${pct}%`,
                    fillStyle:
                      CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length],
                    strokeStyle: 'transparent',
                    fontColor: PRIMARY_TEXT,
                    index: i,
                  }
                }),
            },
          },
        },
      },
    },
    isPortrait ? DONUT_SIZE_PORTRAIT : DONUT_SIZE_LANDSCAPE,
  )
}
