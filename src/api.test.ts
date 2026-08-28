import { describe, expect, test } from 'bun:test'
import '@screenly/edge-apps/test'
import {
  salesBreakdownQuery,
  salesByProductQuery,
  salesOverTimeQuery,
} from './api'

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
