import { formatLocalizedDate } from '@screenly/edge-apps'
import type { ShopifyOrder, ShopifyqlTableData } from './api'

export interface KpiValues {
  totalSales: string
  orders: string
  sessions: string
  conversionRate: string
}

export const KPI_PLACEHOLDER = '—'

export function formatMoney(
  amount: string,
  currencyCode: string,
  locale: string,
): string {
  const value = Number(amount)
  if (isNaN(value)) {
    return amount
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(value)
}

export function formatPercent(value: string, locale: string): string {
  const num = Number(value)
  if (isNaN(num)) {
    return value
  }
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(num / 100)
}

function firstRowValue(
  table: ShopifyqlTableData | null,
  column: string,
): string | null {
  if (!table || table.rows.length === 0) {
    return null
  }
  const value = table.rows[0][column]
  return value === undefined || value === null ? null : String(value)
}

export function extractKpis(
  salesTable: ShopifyqlTableData | null,
  sessionsTable: ShopifyqlTableData | null,
  currencyCode: string,
  locale: string,
): KpiValues {
  const totalSales = firstRowValue(salesTable, 'total_sales')
  const orders = firstRowValue(salesTable, 'orders')
  const sessions = firstRowValue(sessionsTable, 'sessions')
  const conversionRate = firstRowValue(sessionsTable, 'conversion_rate')

  return {
    totalSales:
      totalSales === null
        ? KPI_PLACEHOLDER
        : formatMoney(totalSales, currencyCode, locale),
    orders: orders ?? KPI_PLACEHOLDER,
    sessions: sessions ?? KPI_PLACEHOLDER,
    conversionRate:
      conversionRate === null
        ? KPI_PLACEHOLDER
        : formatPercent(conversionRate, locale),
  }
}

export function formatOrderStatus(status: string): string {
  if (!status) {
    return ''
  }
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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

  for (const order of orders) {
    const tr = document.createElement('tr')

    const name = document.createElement('td')
    name.textContent = order.name

    const date = document.createElement('td')
    date.textContent = formatLocalizedDate(new Date(order.createdAt), locale, {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    const total = document.createElement('td')
    const { amount, currencyCode } = order.totalPriceSet.shopMoney
    total.textContent = formatMoney(amount, currencyCode, locale)

    const payment = document.createElement('td')
    const paymentBadge = document.createElement('span')
    paymentBadge.className = `badge badge-${order.displayFinancialStatus.toLowerCase()}`
    paymentBadge.textContent = formatOrderStatus(order.displayFinancialStatus)
    payment.appendChild(paymentBadge)

    const fulfillment = document.createElement('td')
    const fulfillmentBadge = document.createElement('span')
    fulfillmentBadge.className = `badge badge-${order.displayFulfillmentStatus.toLowerCase()}`
    fulfillmentBadge.textContent = formatOrderStatus(
      order.displayFulfillmentStatus,
    )
    fulfillment.appendChild(fulfillmentBadge)

    tr.append(name, date, total, payment, fulfillment)
    tbody.appendChild(tr)
  }
}

export function showScreen(screenId: 'dashboard' | 'error-screen'): void {
  const dashboard = document.getElementById('dashboard')
  const errorScreen = document.getElementById('error-screen')
  if (dashboard) {
    dashboard.hidden = screenId !== 'dashboard'
  }
  if (errorScreen) {
    errorScreen.hidden = screenId !== 'error-screen'
  }
}

export function showError(message: string): void {
  showScreen('error-screen')
  const el = document.getElementById('error-message')
  if (el) {
    el.textContent = message
  }
}

export type ErrorReporter = (message: string) => void

export function createErrorReporter(displayErrors: boolean): ErrorReporter {
  if (displayErrors) {
    return (msg) => {
      throw new Error(msg)
    }
  }
  return showError
}
