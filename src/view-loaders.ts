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
  apiVersion: string,
  token: string,
  range: DateRange,
  locale: string,
  timezone: string,
) {
  const [shopInfo, salesTable, sessionsTable, orders] = await Promise.all([
    fetchShopInfo(shopDomain, apiVersion, token),
    fetchSalesSummary(shopDomain, apiVersion, token, range),
    fetchSessionsSummary(shopDomain, apiVersion, token, range),
    fetchRecentOrders(shopDomain, apiVersion, token),
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
  apiVersion: string,
  token: string,
  range: DateRange,
  metric: KpiMetric,
  locale: string,
) {
  const [shopInfo, salesTable, sessionsTable] = await Promise.all([
    fetchShopInfo(shopDomain, apiVersion, token),
    fetchSalesSummary(shopDomain, apiVersion, token, range),
    fetchSessionsSummary(shopDomain, apiVersion, token, range),
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
  apiVersion: string,
  token: string,
  range: DateRange,
  chartType: ChartType,
  locale: string,
  timezone: string,
) {
  const [shopInfo, table] = await Promise.all([
    fetchShopInfo(shopDomain, apiVersion, token),
    fetchSalesOverTime(shopDomain, apiVersion, token, range),
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
  apiVersion: string,
  token: string,
  range: DateRange,
  chartType: ChartType,
  locale: string,
) {
  const [shopInfo, table] = await Promise.all([
    fetchShopInfo(shopDomain, apiVersion, token),
    fetchSalesByProduct(shopDomain, apiVersion, token, range),
  ])
  return {
    shopInfo,
    render: () =>
      renderSalesByProduct(table, chartType, shopInfo.currencyCode, locale),
  }
}

async function loadSalesBreakdownView(
  shopDomain: string,
  apiVersion: string,
  token: string,
  range: DateRange,
  locale: string,
) {
  const [shopInfo, table] = await Promise.all([
    fetchShopInfo(shopDomain, apiVersion, token),
    fetchSalesBreakdown(shopDomain, apiVersion, token, range),
  ])
  return {
    shopInfo,
    render: () => renderSalesBreakdown(table, shopInfo.currencyCode, locale),
  }
}

export function loadViewData(
  view: ViewName,
  shopDomain: string,
  apiVersion: string,
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
      apiVersion,
      token,
      range,
      chartType,
      locale,
      timezone,
    )
  }
  if (view === 'sales_by_product') {
    return loadSalesByProductView(
      shopDomain,
      apiVersion,
      token,
      range,
      chartType,
      locale,
    )
  }
  if (view === 'sales_breakdown') {
    return loadSalesBreakdownView(shopDomain, apiVersion, token, range, locale)
  }
  if (view === 'kpi') {
    return loadKpiView(shopDomain, apiVersion, token, range, kpiMetric, locale)
  }
  return loadSummaryView(shopDomain, apiVersion, token, range, locale, timezone)
}
