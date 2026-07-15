import { formatLocalizedDate } from '@screenly/edge-apps'
import { formatMoney, KPI_PLACEHOLDER } from './app'
import type { ShopifyqlTableData } from './api'
import type { ChartDatum } from './charts'
import { renderColumnChart, renderLineChart } from './charts'
import { renderDonutChart, renderRankedBarChart } from './product-charts'
import type { ChartType, ViewName } from './constants'

export function renderSalesOverTime(
  table: ShopifyqlTableData | null,
  chartType: ChartType,
  currencyCode: string,
  locale: string,
  timezone: string,
): void {
  const rows = table?.rows ?? []
  const points: ChartDatum[] = rows.map((row) => {
    const value = Number(row.total_sales ?? 0)
    if ('hour' in row) {
      const label = formatLocalizedDate(new Date(row.hour), locale, {
        timeZone: timezone,
        hour: 'numeric',
      })
      return { label, value }
    }
    const label = formatLocalizedDate(new Date(row.day), locale, {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
    })
    return { label, value }
  })

  // 'auto' and 'donut' (which doesn't fit a time series) both fall back to
  // this view's natural default (line).
  if (chartType === 'bar') {
    renderColumnChart('sales-over-time-chart', points, { currencyCode, locale })
  } else {
    renderLineChart('sales-over-time-chart', points, { currencyCode, locale })
  }
}

export function renderSalesByProduct(
  table: ShopifyqlTableData | null,
  chartType: ChartType,
  currencyCode: string,
  locale: string,
): void {
  const rows = table?.rows ?? []
  const bars: ChartDatum[] = rows
    .map((row) => ({
      label: row.product_title || 'Other',
      value: Number(row.total_sales ?? 0),
    }))
    .sort((a, b) => b.value - a.value)

  // 'auto' and 'line' (which doesn't fit a category comparison) both fall
  // back to this view's natural default (ranked bar).
  if (chartType === 'donut') {
    renderDonutChart('sales-by-product-chart', bars, { currencyCode, locale })
  } else {
    renderRankedBarChart('sales-by-product-chart', bars, {
      currencyCode,
      locale,
    })
  }
}

const BREAKDOWN_ROWS: [string, string][] = [
  ['gross_sales', 'Gross sales'],
  ['discounts', 'Discounts'],
  ['returns', 'Returns'],
  ['net_sales', 'Net sales'],
  ['shipping_charges', 'Shipping charges'],
  ['return_fees', 'Return fees'],
  ['taxes', 'Taxes'],
  ['total_sales', 'Total sales'],
]

export function renderSalesBreakdown(
  table: ShopifyqlTableData | null,
  currencyCode: string,
  locale: string,
): void {
  const row = table?.rows[0]
  const container = document.getElementById('sales-breakdown-list')
  if (!container) {
    return
  }

  container.innerHTML = ''
  for (const [column, label] of BREAKDOWN_ROWS) {
    const amount = row?.[column]
    const item = document.createElement('div')
    item.className =
      column === 'total_sales'
        ? 'breakdown-row breakdown-row-total'
        : 'breakdown-row'

    const labelEl = document.createElement('span')
    labelEl.className = 'breakdown-label'
    labelEl.textContent = label

    const valueEl = document.createElement('span')
    valueEl.className = 'breakdown-value'
    valueEl.textContent =
      amount === undefined
        ? KPI_PLACEHOLDER
        : formatMoney(amount, currencyCode, locale)

    item.append(labelEl, valueEl)
    container.appendChild(item)
  }
}

export function showView(view: ViewName): void {
  const views: Record<ViewName, string> = {
    summary: 'view-summary',
    sales_over_time: 'view-sales-over-time',
    sales_by_product: 'view-sales-by-product',
    sales_breakdown: 'view-sales-breakdown',
  }
  for (const [viewName, id] of Object.entries(views)) {
    const el = document.getElementById(id)
    if (el) {
      el.hidden = viewName !== view
    }
  }
}
