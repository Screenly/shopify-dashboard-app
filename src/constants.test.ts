import { describe, expect, test } from 'bun:test'
import {
  isChartType,
  isDateRange,
  isView,
  salesBreakdownQuery,
  salesByProductQuery,
  salesOverTimeQuery,
} from './constants'

describe('isDateRange', () => {
  test('accepts valid date ranges', () => {
    expect(isDateRange('today')).toBe(true)
    expect(isDateRange('7d')).toBe(true)
    expect(isDateRange('30d')).toBe(true)
  })

  test('rejects invalid values, including inherited Object.prototype names', () => {
    expect(isDateRange('90d')).toBe(false)
    expect(isDateRange('toString')).toBe(false)
    expect(isDateRange('constructor')).toBe(false)
    expect(isDateRange('hasOwnProperty')).toBe(false)
  })
})

describe('isView', () => {
  test('accepts valid views', () => {
    expect(isView('summary')).toBe(true)
    expect(isView('sales_over_time')).toBe(true)
    expect(isView('sales_by_product')).toBe(true)
    expect(isView('sales_breakdown')).toBe(true)
  })

  test('rejects invalid values, including inherited Object.prototype names', () => {
    expect(isView('unknown')).toBe(false)
    expect(isView('toString')).toBe(false)
  })
})

describe('isChartType', () => {
  test('accepts valid chart types', () => {
    expect(isChartType('auto')).toBe(true)
    expect(isChartType('line')).toBe(true)
    expect(isChartType('bar')).toBe(true)
    expect(isChartType('donut')).toBe(true)
  })

  test('rejects invalid values, including inherited Object.prototype names', () => {
    expect(isChartType('pie')).toBe(false)
    expect(isChartType('toString')).toBe(false)
  })
})

describe('salesOverTimeQuery', () => {
  test('groups by hour for today', () => {
    expect(salesOverTimeQuery('today')).toBe(
      'FROM sales SHOW total_sales GROUP BY hour SINCE today',
    )
  })

  test('groups by day for 7d and 30d', () => {
    expect(salesOverTimeQuery('7d')).toBe(
      'FROM sales SHOW total_sales GROUP BY day SINCE -7d',
    )
    expect(salesOverTimeQuery('30d')).toBe(
      'FROM sales SHOW total_sales GROUP BY day SINCE -30d',
    )
  })
})

describe('salesByProductQuery', () => {
  test('groups by product title', () => {
    expect(salesByProductQuery('30d')).toBe(
      'FROM sales SHOW total_sales GROUP BY product_title SINCE -30d',
    )
  })
})

describe('salesBreakdownQuery', () => {
  test('includes all breakdown columns', () => {
    expect(salesBreakdownQuery('30d')).toBe(
      'FROM sales SHOW gross_sales, discounts, returns, net_sales, shipping_charges, return_fees, taxes, total_sales SINCE -30d',
    )
  })
})
