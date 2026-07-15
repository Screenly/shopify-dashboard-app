export const shopifyTokenEndpoint = (shopDomain: string): string =>
  `https://${shopDomain}/admin/oauth/access_token`

export const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000
export const PORT = 3000
