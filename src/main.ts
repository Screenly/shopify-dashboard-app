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
import {
  fetchRecentOrders,
  fetchSalesSummary,
  fetchSessionsSummary,
  fetchShopInfo,
} from './api'
import {
  createErrorReporter,
  extractKpis,
  renderDateRangeSwitcher,
  renderKpiLabels,
  renderKpis,
  renderOrders,
  showScreen,
} from './app'
import { getCredentials, withFreshCredentials } from './auth'
import type { RuntimeState, ShopifyCredentials } from './auth'
import type { DateRange } from './constants'
import {
  DEFAULT_API_VERSION,
  DEFAULT_DATE_RANGE,
  DEFAULT_REFRESH_INTERVAL,
  isDateRange,
} from './constants'

interface DashboardContext {
  apiVersion: string
  locale: string
  timezone: string
}

let currentRange: DateRange = DEFAULT_DATE_RANGE

async function loadDashboard(
  credentials: ShopifyCredentials,
  context: DashboardContext,
): Promise<void> {
  const { token, shopDomain } = credentials
  const { apiVersion, locale, timezone } = context
  const range = currentRange
  const [shopInfo, salesTable, sessionsTable, orders] = await Promise.all([
    fetchShopInfo(shopDomain, apiVersion, token),
    fetchSalesSummary(shopDomain, apiVersion, token, range),
    fetchSessionsSummary(shopDomain, apiVersion, token, range),
    fetchRecentOrders(shopDomain, apiVersion, token),
  ])

  if (range !== currentRange) {
    // The range changed again while this request was in flight. That newer
    // selection has its own in-flight (or already-rendered) load, so applying
    // this stale response would show data for the wrong range.
    return
  }

  const shopNameEl = document.getElementById('shop-name')
  if (shopNameEl) {
    shopNameEl.textContent = shopInfo.name
  }

  renderKpiLabels(range)
  renderDateRangeSwitcher(range)
  renderKpis(
    extractKpis(salesTable, sessionsTable, shopInfo.currencyCode, locale),
  )
  renderOrders(orders, locale, timezone)
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

document.addEventListener('DOMContentLoaded', async () => {
  setupErrorHandling()
  setupTheme()

  const apiVersion = getSettingWithDefault<string>(
    'api_version',
    DEFAULT_API_VERSION,
  )
  const refreshInterval = getSettingWithDefault<number>(
    'refresh_interval',
    DEFAULT_REFRESH_INTERVAL,
  )
  const displayErrors =
    getSettingWithDefault<string>('display_errors', 'false') === 'true'
  const reportError = createErrorReporter(displayErrors)

  const configuredRange = getSettingWithDefault<string>(
    'default_date_range',
    DEFAULT_DATE_RANGE,
  )
  if (isDateRange(configuredRange)) {
    currentRange = configuredRange
  }

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
        await loadDashboard(creds, context)
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
