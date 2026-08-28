import {
  getCredentials as getOAuthCredentials,
  getSettingWithDefault,
} from '@screenly/edge-apps'
import { AuthError } from './api'
import type { ErrorReporter } from './screen'

export interface ShopifyCredentials {
  token: string
  shopDomain: string
}

export type RuntimeState = {
  credentials: ShopifyCredentials | null
  credentialError: Error | null
}

export async function getCredentials(): Promise<ShopifyCredentials> {
  // Testing/development only fallback, used when neither the manual dev
  // token nor the OAuth response carries a shop domain (e.g. a mock backend
  // that doesn't return metadata). Real installs get the shop domain from
  // the OAuth service, so this setting is not required.
  const fallbackShopDomain = getSettingWithDefault<string>('shop_domain', '')

  // Testing/development only: a token supplied directly via settings takes
  // precedence over the Screenly OAuth service.
  const devToken = getSettingWithDefault<string>('access_token', '')
  if (devToken) {
    return { token: devToken, shopDomain: fallbackShopDomain }
  }

  // Production path: the Screenly OAuth service delivers the token, and its
  // metadata carries the shop domain captured during the OAuth handshake.
  // getOAuthCredentials() doesn't check the response status itself, so a
  // backend-side OAuth error (e.g. Shopify not connected for this org) comes
  // back as a token-less body rather than a rejected promise.
  const { token, metadata } = await getOAuthCredentials()
  if (!token) {
    throw new AuthError(
      'Shopify is not connected for this organization. Connect it in the Screenly web console under Integrations.',
    )
  }
  const metadataShop = metadata?.shop
  return {
    token,
    shopDomain:
      typeof metadataShop === 'string' ? metadataShop : fallbackShopDomain,
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
