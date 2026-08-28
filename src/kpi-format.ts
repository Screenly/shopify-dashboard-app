import type { ShopifyqlTableData } from './api'

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
