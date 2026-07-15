import { shopifyTokenEndpoint, TOKEN_REFRESH_INTERVAL_MS } from './constants'
import { setError, setToken } from './store'

interface ShopifyTokenResponse {
  access_token: string
  scope: string
}

export async function fetchToken(): Promise<void> {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN
  const clientId = process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET

  if (!shopDomain || !clientId || !clientSecret) {
    setError(
      'Missing SHOPIFY_SHOP_DOMAIN, SHOPIFY_CLIENT_ID, or SHOPIFY_CLIENT_SECRET in .env',
    )
    return
  }

  const res = await fetch(shopifyTokenEndpoint(shopDomain), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })

  if (!res.ok) {
    setError(`Token request failed: ${res.status} ${await res.text()}`)
    return
  }

  const data = (await res.json()) as ShopifyTokenResponse
  setToken({
    access_token: data.access_token,
    scope: data.scope,
    fetched_at: Date.now(),
  })
  console.log(`Shopify access token fetched at ${new Date().toISOString()}`)
}

export function startRefreshLoop(): void {
  fetchToken().catch((err) => setError(String(err)))

  setInterval(() => {
    fetchToken().catch((err) => setError(String(err)))
  }, TOKEN_REFRESH_INTERVAL_MS)
}
