import './css/style.css'
import '@screenly/edge-apps/components'
import {
  getLocale,
  getSettingWithDefault,
  getTimeZone,
  initTokenRefreshLoop,
  setupErrorHandling,
  setupTheme,
  signalReady,
} from '@screenly/edge-apps'
import { createErrorReporter, renderDateRangeSwitcher, showScreen } from './app'
import { getCredentials, withFreshCredentials } from './auth'
import type { RuntimeState, ShopifyCredentials } from './auth'
import type { ChartType, DateRange, KpiMetric, ViewName } from './constants'
import { showView } from './views'
import { loadViewData } from './view-loaders'
import {
  DEFAULT_API_VERSION,
  DEFAULT_CHART_TYPE,
  DEFAULT_DATE_RANGE,
  DEFAULT_KPI_METRIC,
  DEFAULT_REFRESH_INTERVAL,
  DEFAULT_VIEW,
  isChartType,
  isDateRange,
  isKpiMetric,
  isView,
} from './constants'

interface DashboardContext {
  apiVersion: string
  locale: string
  timezone: string
}

let currentRange: DateRange = DEFAULT_DATE_RANGE
let currentView: ViewName = DEFAULT_VIEW
let currentChartType: ChartType = DEFAULT_CHART_TYPE
let currentKpiMetric: KpiMetric = DEFAULT_KPI_METRIC

async function loadActiveView(
  credentials: ShopifyCredentials,
  context: DashboardContext,
): Promise<void> {
  const { token, shopDomain } = credentials
  const { apiVersion, locale, timezone } = context
  const range = currentRange
  const view = currentView
  const chartType = currentChartType
  const kpiMetric = currentKpiMetric

  const { shopInfo, render } = await loadViewData(
    view,
    shopDomain,
    apiVersion,
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

function setupDateRangeSwitcher(onChange: () => void): void {
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

interface AppSettings {
  apiVersion: string
  refreshInterval: number
  displayErrors: boolean
}

function loadAppSettings(): AppSettings {
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
    apiVersion: getSettingWithDefault<string>(
      'api_version',
      DEFAULT_API_VERSION,
    ),
    refreshInterval: getSettingWithDefault<number>(
      'refresh_interval',
      DEFAULT_REFRESH_INTERVAL,
    ),
    displayErrors:
      getSettingWithDefault<string>('display_errors', 'false') === 'true',
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupErrorHandling()
  setupTheme()

  const { apiVersion, refreshInterval, displayErrors } = loadAppSettings()
  const reportError = createErrorReporter(displayErrors)

  const locale = await getLocale()
  const timezone = await getTimeZone()
  const context: DashboardContext = { apiVersion, locale, timezone }

  let credentials: ShopifyCredentials | null = null
  let credentialError: Error | null = null

  const refreshCredentials = async () => {
    credentials = await getCredentials()
    credentialError = null
  }

  try {
    await refreshCredentials()
  } catch (err) {
    credentialError = err instanceof Error ? err : new Error(String(err))
    console.warn('Failed to fetch initial credentials:', err)
  }

  initTokenRefreshLoop(refreshCredentials)

  const getRuntimeState = (): RuntimeState => ({ credentials, credentialError })

  const run = () =>
    withFreshCredentials(
      getRuntimeState,
      refreshCredentials,
      reportError,
      async (creds) => {
        if (!creds.shopDomain) {
          reportError('Please set the Shop Domain in settings.')
          return
        }
        await loadActiveView(creds, context)
      },
    )

  setupDateRangeSwitcher(() => {
    void run()
  })

  await run()
  signalReady()

  setInterval(async () => {
    try {
      await run()
    } catch (err) {
      console.error('Refresh failed:', err)
    }
  }, refreshInterval * 1000)
})
