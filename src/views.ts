import { formatLocalizedDate } from '@screenly/edge-apps'
import { formatMoney, formatOrderStatus, KPI_PLACEHOLDER } from './kpi-format'
import type { KpiValues } from './kpi-format'
import type { ShopifyOrder, ShopifyqlTableData } from './api'
import type { ChartDatum } from './charts'
import { renderDonutChart, renderRankedBarChart } from './product-charts'
import { renderColumnChart, renderLineChart } from './time-series-charts'
import type { ChartType, DateRange, KpiMetric, ViewName } from './constants'
import { DATE_RANGE_LABELS } from './constants'

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
    .filter((row) => row.product_title)
    .map((row) => ({
      label: row.product_title,
      value: Number(row.total_sales ?? 0),
    }))

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
    const isTotal = column === 'total_sales'
    const item = document.createElement('div')
    item.className = isTotal
      ? 'breakdown-row breakdown-row-total flex items-center justify-between py-[0.938rem] border-b-[0.047rem] border-white/10 last:border-b-0 mt-2 text-[1.25rem] font-bold portrait:text-[1.5rem]'
      : 'breakdown-row flex items-center justify-between py-[0.938rem] border-b-[0.047rem] border-white/10 last:border-b-0 text-[1.146rem] portrait:text-[1.375rem]'

    const labelEl = document.createElement('span')
    labelEl.className = isTotal
      ? 'breakdown-label text-white'
      : 'breakdown-label text-white/70'
    labelEl.textContent = label

    const valueEl = document.createElement('span')
    valueEl.className = 'breakdown-value tabular-nums'
    valueEl.textContent =
      amount === undefined
        ? KPI_PLACEHOLDER
        : formatMoney(amount, currencyCode, locale)

    item.append(labelEl, valueEl)
    container.appendChild(item)
  }
}

export function renderKpis(kpis: KpiValues): void {
  const fields: [keyof KpiValues, string][] = [
    ['totalSales', 'kpi-total-sales'],
    ['orders', 'kpi-orders'],
    ['sessions', 'kpi-sessions'],
    ['conversionRate', 'kpi-conversion-rate'],
  ]
  for (const [key, id] of fields) {
    const el = document.getElementById(id)
    if (el) {
      el.textContent = kpis[key]
    }
  }
}

const KPI_LABEL_BASE: Record<keyof KpiValues, string> = {
  totalSales: 'Total Sales',
  orders: 'Orders',
  sessions: 'Sessions',
  conversionRate: 'Conversion Rate',
}

export function renderKpiLabels(range: DateRange): void {
  const fields: [keyof KpiValues, string][] = [
    ['totalSales', 'kpi-label-total-sales'],
    ['orders', 'kpi-label-orders'],
    ['sessions', 'kpi-label-sessions'],
    ['conversionRate', 'kpi-label-conversion-rate'],
  ]
  for (const [key, id] of fields) {
    const el = document.getElementById(id)
    if (el) {
      el.textContent = `${KPI_LABEL_BASE[key]} (${DATE_RANGE_LABELS[range]})`
    }
  }
}

const KPI_METRIC_TO_FIELD: Record<KpiMetric, keyof KpiValues> = {
  total_sales: 'totalSales',
  orders: 'orders',
  sessions: 'sessions',
  conversion_rate: 'conversionRate',
}

export function renderKpiSpotlight(
  kpis: KpiValues,
  metric: KpiMetric,
  range: DateRange,
): void {
  const field = KPI_METRIC_TO_FIELD[metric]
  const valueEl = document.getElementById('kpi-spotlight-value')
  const labelEl = document.getElementById('kpi-spotlight-label')
  if (valueEl) {
    valueEl.textContent = kpis[field]
  }
  if (labelEl) {
    labelEl.textContent = `${KPI_LABEL_BASE[field]} (${DATE_RANGE_LABELS[range]})`
  }
}

export function renderOrders(
  orders: ShopifyOrder[],
  locale: string,
  timezone: string,
): void {
  const tbody = document.getElementById('orders-body')
  const empty = document.getElementById('orders-empty')
  if (!tbody || !empty) {
    return
  }

  tbody.innerHTML = ''
  empty.hidden = orders.length > 0

  const cellClassName =
    'py-[0.938rem] px-4 border-b-[0.047rem] border-white/10 group-last:border-b-0'
  const badgeClassName =
    'inline-block py-1 px-3 rounded-[62.438rem] text-[0.938rem] font-semibold bg-white/[0.12] text-white/[0.85] portrait:text-[1.125rem]'

  for (const order of orders) {
    const tr = document.createElement('tr')
    tr.className = 'group'

    const name = document.createElement('td')
    name.className = cellClassName
    name.textContent = order.name

    const date = document.createElement('td')
    date.className = `${cellClassName} portrait:[&:nth-child(2)]:hidden`
    date.textContent = formatLocalizedDate(new Date(order.createdAt), locale, {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    const total = document.createElement('td')
    total.className = cellClassName
    const { amount, currencyCode } = order.totalPriceSet.shopMoney
    total.textContent = formatMoney(amount, currencyCode, locale)

    const payment = document.createElement('td')
    payment.className = cellClassName
    const paymentBadge = document.createElement('span')
    paymentBadge.className = `badge badge-${order.displayFinancialStatus.toLowerCase()} ${badgeClassName}`
    paymentBadge.textContent = formatOrderStatus(order.displayFinancialStatus)
    payment.appendChild(paymentBadge)

    const fulfillment = document.createElement('td')
    fulfillment.className = cellClassName
    const fulfillmentBadge = document.createElement('span')
    fulfillmentBadge.className = `badge badge-${order.displayFulfillmentStatus.toLowerCase()} ${badgeClassName}`
    fulfillmentBadge.textContent = formatOrderStatus(
      order.displayFulfillmentStatus,
    )
    fulfillment.appendChild(fulfillmentBadge)

    tr.append(name, date, total, payment, fulfillment)
    tbody.appendChild(tr)
  }
}

export function showView(view: ViewName): void {
  const views: Record<ViewName, string> = {
    summary: 'view-summary',
    sales_over_time: 'view-sales-over-time',
    sales_by_product: 'view-sales-by-product',
    sales_breakdown: 'view-sales-breakdown',
    kpi: 'view-kpi',
  }
  for (const [viewName, id] of Object.entries(views)) {
    const el = document.getElementById(id)
    if (el) {
      el.hidden = viewName !== view
    }
  }
}
