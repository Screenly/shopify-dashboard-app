import { describe, expect, test } from 'bun:test'
import '@screenly/edge-apps/test'
import { isChartType, isDateRange, isKpiMetric, isView } from './dashboard'

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
    expect(isView('kpi')).toBe(true)
  })

  test('rejects invalid values, including inherited Object.prototype names', () => {
    expect(isView('unknown')).toBe(false)
    expect(isView('toString')).toBe(false)
  })
})

describe('isKpiMetric', () => {
  test('accepts valid metrics', () => {
    expect(isKpiMetric('total_sales')).toBe(true)
    expect(isKpiMetric('orders')).toBe(true)
    expect(isKpiMetric('sessions')).toBe(true)
    expect(isKpiMetric('conversion_rate')).toBe(true)
  })

  test('rejects invalid values, including inherited Object.prototype names', () => {
    expect(isKpiMetric('unknown')).toBe(false)
    expect(isKpiMetric('toString')).toBe(false)
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
