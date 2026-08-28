import { describe, expect, test } from 'bun:test'
import type { ShopifyqlTableData } from './api'
import {
  extractKpis,
  formatMoney,
  formatOrderStatus,
  formatPercent,
  KPI_PLACEHOLDER,
} from './kpi-format'

const SALES_TABLE: ShopifyqlTableData = {
  columns: [
    { name: 'total_sales', dataType: 'MONEY', displayName: 'Total sales' },
    { name: 'orders', dataType: 'INTEGER', displayName: 'Orders' },
  ],
  rows: [{ total_sales: '2051.59', orders: '2' }],
}

const SESSIONS_TABLE: ShopifyqlTableData = {
  columns: [
    { name: 'sessions', dataType: 'INTEGER', displayName: 'Sessions' },
    {
      name: 'conversion_rate',
      dataType: 'PERCENT',
      displayName: 'Conversion rate',
    },
  ],
  rows: [{ sessions: '7', conversion_rate: '28.6' }],
}

describe('formatMoney', () => {
  test('formats an amount with its currency', () => {
    expect(formatMoney('2051.59', 'USD', 'en')).toBe('$2,051.59')
  })

  test('returns the raw value when not numeric', () => {
    expect(formatMoney('n/a', 'USD', 'en')).toBe('n/a')
  })
})

describe('formatPercent', () => {
  test('formats a percentage value', () => {
    expect(formatPercent('28.6', 'en')).toBe('28.6%')
  })

  test('returns the raw value when not numeric', () => {
    expect(formatPercent('n/a', 'en')).toBe('n/a')
  })
})

describe('formatOrderStatus', () => {
  test('title-cases an enum-style status', () => {
    expect(formatOrderStatus('PARTIALLY_FULFILLED')).toBe('Partially Fulfilled')
  })

  test('returns an empty string for empty input', () => {
    expect(formatOrderStatus('')).toBe('')
  })
})

describe('extractKpis', () => {
  test('extracts values from sales and sessions tables', () => {
    const kpis = extractKpis(SALES_TABLE, SESSIONS_TABLE, 'USD', 'en')
    expect(kpis.totalSales).toBe('$2,051.59')
    expect(kpis.orders).toBe('2')
    expect(kpis.sessions).toBe('7')
    expect(kpis.conversionRate).toBe('28.6%')
  })

  test('falls back to placeholders when tables are missing', () => {
    const kpis = extractKpis(null, null, 'USD', 'en')
    expect(kpis.totalSales).toBe(KPI_PLACEHOLDER)
    expect(kpis.orders).toBe(KPI_PLACEHOLDER)
    expect(kpis.sessions).toBe(KPI_PLACEHOLDER)
    expect(kpis.conversionRate).toBe(KPI_PLACEHOLDER)
  })

  test('falls back to placeholders when a column is absent', () => {
    const salesWithoutOrders: ShopifyqlTableData = {
      columns: SALES_TABLE.columns.slice(0, 1),
      rows: [{ total_sales: '100.00' }],
    }
    const kpis = extractKpis(salesWithoutOrders, null, 'USD', 'en')
    expect(kpis.totalSales).toBe('$100.00')
    expect(kpis.orders).toBe(KPI_PLACEHOLDER)
  })

  test('falls back to placeholders when tables have no rows', () => {
    const emptyTable: ShopifyqlTableData = {
      columns: SALES_TABLE.columns,
      rows: [],
    }
    const kpis = extractKpis(emptyTable, null, 'USD', 'en')
    expect(kpis.totalSales).toBe(KPI_PLACEHOLDER)
  })
})
