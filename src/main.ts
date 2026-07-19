import './css/style.css'
import '@screenly/edge-apps/components'
import {
  getLocale,
  getTimeZone,
  initTokenRefreshLoop,
  setupErrorHandling,
  setupTheme,
  signalReady,
} from '@screenly/edge-apps'
import { createErrorReporter } from './screen'
import { getCredentials, withFreshCredentials } from './auth'
import type { RuntimeState, ShopifyCredentials } from './auth'
import {
  loadActiveView,
  loadAppSettings,
  setupDateRangeSwitcher,
} from './dashboard'
import type { DashboardContext } from './dashboard'

document.addEventListener('DOMContentLoaded', async () => {
  setupErrorHandling()
  setupTheme()

  const { refreshInterval, displayErrors } = loadAppSettings()
  const reportError = createErrorReporter(displayErrors)

  const locale = await getLocale()
  const timezone = await getTimeZone()
  const context: DashboardContext = { locale, timezone }

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
          reportError(
            'No shop domain available. Check the Shopify connection in the Screenly web console, or set the Shop Domain setting for local testing.',
          )
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
