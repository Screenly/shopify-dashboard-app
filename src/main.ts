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
  renderKpis,
  renderOrders,
  showScreen,
} from './app'
import { getCredentials, withFreshCredentials } from './auth'
import type { RuntimeState, ShopifyCredentials } from './auth'
import { DEFAULT_API_VERSION, DEFAULT_REFRESH_INTERVAL } from './constants'

interface DashboardContext {
  apiVersion: string
  locale: string
  timezone: string
}

async function loadDashboard(
  credentials: ShopifyCredentials,
  context: DashboardContext,
): Promise<void> {
  const { token, shopDomain } = credentials
  const { apiVersion, locale, timezone } = context
  const [shopInfo, salesTable, sessionsTable, orders] = await Promise.all([
    fetchShopInfo(shopDomain, apiVersion, token),
    fetchSalesSummary(shopDomain, apiVersion, token),
    fetchSessionsSummary(shopDomain, apiVersion, token),
    fetchRecentOrders(shopDomain, apiVersion, token),
  ])

  const shopNameEl = document.getElementById('shop-name')
  if (shopNameEl) {
    shopNameEl.textContent = shopInfo.name
  }

  renderKpis(
    extractKpis(salesTable, sessionsTable, shopInfo.currencyCode, locale),
  )
  renderOrders(orders, locale, timezone)
  showScreen('dashboard')
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
