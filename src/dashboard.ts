import { getSettingWithDefault } from '@screenly/edge-apps'
import { renderDateRangeSwitcher, showScreen } from './screen'
import type { ShopifyCredentials } from './auth'
import type { ChartType, DateRange, KpiMetric, ViewName } from './constants'
import {
  CHART_TYPE_LABELS,
  DATE_RANGE_LABELS,
  DEFAULT_CHART_TYPE,
  DEFAULT_DATE_RANGE,
  DEFAULT_KPI_METRIC,
  DEFAULT_REFRESH_INTERVAL,
  DEFAULT_VIEW,
  KPI_METRIC_LABELS,
  VIEW_LABELS,
} from './constants'
import { loadViewData } from './view-loaders'
import { showView } from './views'

export function isDateRange(value: string): value is DateRange {
  return Object.prototype.hasOwnProperty.call(DATE_RANGE_LABELS, value)
}

export function isView(value: string): value is ViewName {
  return Object.prototype.hasOwnProperty.call(VIEW_LABELS, value)
}

export function isChartType(value: string): value is ChartType {
  return Object.prototype.hasOwnProperty.call(CHART_TYPE_LABELS, value)
}

export function isKpiMetric(value: string): value is KpiMetric {
  return Object.prototype.hasOwnProperty.call(KPI_METRIC_LABELS, value)
}

export interface DashboardContext {
  locale: string
  timezone: string
}

let currentRange: DateRange = DEFAULT_DATE_RANGE
let currentView: ViewName = DEFAULT_VIEW
let currentChartType: ChartType = DEFAULT_CHART_TYPE
let currentKpiMetric: KpiMetric = DEFAULT_KPI_METRIC

export async function loadActiveView(
  credentials: ShopifyCredentials,
  context: DashboardContext,
): Promise<void> {
  const { token, shopDomain } = credentials
  const { locale, timezone } = context
  const range = currentRange
  const view = currentView
  const chartType = currentChartType
  const kpiMetric = currentKpiMetric

  const { shopInfo, render } = await loadViewData(
    view,
    shopDomain,
    token,
    range,
    chartType,
    kpiMetric,
    locale,
    timezone,
  )

  if (range !== currentRange || view !== currentView) {
    // A newer selection was made while this request was in flight; its own
    // load will render the correct view/data, so skip this stale response.
    return
  }

  const shopNameEl = document.getElementById('shop-name')
  if (shopNameEl) {
    shopNameEl.textContent = shopInfo.name
  }

  renderDateRangeSwitcher(range)
  showView(view)
  render()
  showScreen('dashboard')
}

export function setupDateRangeSwitcher(onChange: () => void): void {
  const switcher = document.getElementById('date-range-switcher')
  if (!switcher) {
    return
  }
  switcher.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-range]',
    )
    const range = button?.dataset.range
    if (!range || !isDateRange(range) || range === currentRange) {
      return
    }
    currentRange = range
    renderDateRangeSwitcher(currentRange)
    onChange()
  })
}

export interface AppSettings {
  refreshInterval: number
  displayErrors: boolean
}

export function loadAppSettings(): AppSettings {
  const configuredRange = getSettingWithDefault<string>(
    'default_date_range',
    DEFAULT_DATE_RANGE,
  )
  if (isDateRange(configuredRange)) {
    currentRange = configuredRange
  }

  const configuredView = getSettingWithDefault<string>('view', DEFAULT_VIEW)
  if (isView(configuredView)) {
    currentView = configuredView
  }

  const configuredChartType = getSettingWithDefault<string>(
    'chart_type',
    DEFAULT_CHART_TYPE,
  )
  if (isChartType(configuredChartType)) {
    currentChartType = configuredChartType
  }

  const configuredKpiMetric = getSettingWithDefault<string>(
    'kpi_metric',
    DEFAULT_KPI_METRIC,
  )
  if (isKpiMetric(configuredKpiMetric)) {
    currentKpiMetric = configuredKpiMetric
  }

  return {
    refreshInterval: getSettingWithDefault<number>(
      'refresh_interval',
      DEFAULT_REFRESH_INTERVAL,
    ),
    displayErrors:
      getSettingWithDefault<string>('display_errors', 'false') === 'true',
  }
}
