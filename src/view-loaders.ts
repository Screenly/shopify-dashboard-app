import {
  fetchRecentOrders,
  fetchSalesByProduct,
  fetchSalesBreakdown,
  fetchSalesOverTime,
  fetchSalesSummary,
  fetchSessionsSummary,
  fetchShopInfo,
} from './api'
import {
  extractKpis,
  renderKpiLabels,
  renderKpiSpotlight,
  renderKpis,
  renderOrders,
} from './app'
import type { ChartType, DateRange, KpiMetric, ViewName } from './constants'
import {
  renderSalesBreakdown,
  renderSalesByProduct,
  renderSalesOverTime,
} from './views'

async function loadSummaryView(
  shopDomain: string,
  token: string,
  range: DateRange,
  locale: string,
  timezone: string,
) {
  const [shopInfo, salesTable, sessionsTable, orders] = await Promise.all([
    fetchShopInfo(shopDomain, token),
    fetchSalesSummary(shopDomain, token, range),
    fetchSessionsSummary(shopDomain, token, range),
    fetchRecentOrders(shopDomain, token),
  ])
  return {
    shopInfo,
    render: () => {
      renderKpiLabels(range)
      renderKpis(
        extractKpis(salesTable, sessionsTable, shopInfo.currencyCode, locale),
      )
      renderOrders(orders, locale, timezone)
    },
  }
}

async function loadKpiView(
  shopDomain: string,
  token: string,
  range: DateRange,
  metric: KpiMetric,
  locale: string,
) {
  const [shopInfo, salesTable, sessionsTable] = await Promise.all([
    fetchShopInfo(shopDomain, token),
    fetchSalesSummary(shopDomain, token, range),
    fetchSessionsSummary(shopDomain, token, range),
  ])
  return {
    shopInfo,
    render: () =>
      renderKpiSpotlight(
        extractKpis(salesTable, sessionsTable, shopInfo.currencyCode, locale),
        metric,
        range,
      ),
  }
}

async function loadSalesOverTimeView(
  shopDomain: string,
  token: string,
  range: DateRange,
  chartType: ChartType,
  locale: string,
  timezone: string,
) {
  const [shopInfo, table] = await Promise.all([
    fetchShopInfo(shopDomain, token),
    fetchSalesOverTime(shopDomain, token, range),
  ])
  return {
    shopInfo,
    render: () =>
      renderSalesOverTime(
        table,
        chartType,
        shopInfo.currencyCode,
        locale,
        timezone,
      ),
  }
}

async function loadSalesByProductView(
  shopDomain: string,
  token: string,
  range: DateRange,
  chartType: ChartType,
  locale: string,
) {
  const [shopInfo, table] = await Promise.all([
    fetchShopInfo(shopDomain, token),
    fetchSalesByProduct(shopDomain, token, range),
  ])
  return {
    shopInfo,
    render: () =>
      renderSalesByProduct(table, chartType, shopInfo.currencyCode, locale),
  }
}

async function loadSalesBreakdownView(
  shopDomain: string,
  token: string,
  range: DateRange,
  locale: string,
) {
  const [shopInfo, table] = await Promise.all([
    fetchShopInfo(shopDomain, token),
    fetchSalesBreakdown(shopDomain, token, range),
  ])
  return {
    shopInfo,
    render: () => renderSalesBreakdown(table, shopInfo.currencyCode, locale),
  }
}

export function loadViewData(
  view: ViewName,
  shopDomain: string,
  token: string,
  range: DateRange,
  chartType: ChartType,
  kpiMetric: KpiMetric,
  locale: string,
  timezone: string,
) {
  if (view === 'sales_over_time') {
    return loadSalesOverTimeView(
      shopDomain,
      token,
      range,
      chartType,
      locale,
      timezone,
    )
  }
  if (view === 'sales_by_product') {
    return loadSalesByProductView(shopDomain, token, range, chartType, locale)
  }
  if (view === 'sales_breakdown') {
    return loadSalesBreakdownView(shopDomain, token, range, locale)
  }
  if (view === 'kpi') {
    return loadKpiView(shopDomain, token, range, kpiMetric, locale)
  }
  return loadSummaryView(shopDomain, token, range, locale, timezone)
}
