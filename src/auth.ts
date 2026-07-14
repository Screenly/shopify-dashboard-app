import {
  getCredentials as getOAuthCredentials,
  getSettingWithDefault,
} from '@screenly/edge-apps'
import { AuthError } from './api'
import type { ErrorReporter } from './app'

export interface ShopifyCredentials {
  token: string
  shopDomain: string
}

export type RuntimeState = {
  credentials: ShopifyCredentials | null
  credentialError: Error | null
}

export async function getCredentials(): Promise<ShopifyCredentials> {
  const shopDomain = getSettingWithDefault<string>('shop_domain', '')

  // Testing/development only: a token supplied directly via settings takes
  // precedence over the Screenly OAuth service.
  const devToken = getSettingWithDefault<string>('access_token', '')
  if (devToken) {
    return { token: devToken, shopDomain }
  }

  // Production path: the Screenly OAuth service delivers the token, and its
  // metadata carries the shop domain captured during the OAuth handshake.
  const { token, metadata } = await getOAuthCredentials()
  const metadataShop = metadata?.shop
  return {
    token,
    shopDomain: typeof metadataShop === 'string' ? metadataShop : shopDomain,
  }
}

export async function withFreshCredentials(
  getRuntimeState: () => RuntimeState,
  refreshCredentials: () => Promise<void>,
  reportError: ErrorReporter,
  action: (credentials: ShopifyCredentials) => Promise<void>,
): Promise<void> {
  const { credentials, credentialError } = getRuntimeState()

  if (!credentials) {
    reportError(credentialError?.message ?? 'No access token available.')
    return
  }

  let firstErr: unknown
  try {
    await action(credentials)
    return
  } catch (err) {
    firstErr = err
  }

  if (!(firstErr instanceof AuthError)) {
    reportError(
      firstErr instanceof Error ? firstErr.message : 'Failed to load data.',
    )
    return
  }

  try {
    await refreshCredentials()
    const { credentials: refreshed } = getRuntimeState()

    if (!refreshed) {
      reportError('No access token after refresh.')
      return
    }

    await action(refreshed)
  } catch (err) {
    reportError(
      err instanceof Error
        ? err.message
        : 'Session expired. Please re-authenticate.',
    )
  }
}
