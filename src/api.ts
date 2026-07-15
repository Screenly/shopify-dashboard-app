import { getCorsProxyUrl } from '@screenly/edge-apps'
import type { DateRange } from './constants'
import {
  RECENT_ORDERS_COUNT,
  RECENT_ORDERS_QUERY,
  SHOP_QUERY,
  SHOPIFYQL_QUERY,
  salesByProductQuery,
  salesBreakdownQuery,
  salesOverTimeQuery,
  salesQuery,
  sessionsQuery,
} from './constants'

export class AuthError extends Error {
  constructor(message = 'Shopify authentication failed') {
    super(message)
    this.name = 'AuthError'
  }
}

export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface ShopifyOrder {
  id: string
  name: string
  createdAt: string
  displayFinancialStatus: string
  displayFulfillmentStatus: string
  totalPriceSet: {
    shopMoney: ShopifyMoney
  }
}

export interface ShopifyqlColumn {
  name: string
  dataType: string
  displayName: string
}

export interface ShopifyqlTableData {
  columns: ShopifyqlColumn[]
  rows: Record<string, string>[]
}

interface GraphqlError {
  message: string
  extensions?: { code?: string }
}

interface GraphqlResponse<T> {
  data?: T
  errors?: GraphqlError[]
}

function throwIfGraphqlErrors(errors: GraphqlError[] | undefined): void {
  if (!errors || errors.length === 0) {
    return
  }
  const isAuthError = errors.some(
    (err) => err.extensions?.code === 'ACCESS_DENIED',
  )
  if (isAuthError) {
    throw new AuthError(errors[0].message)
  }
  throw new Error(errors[0].message)
}

async function graphqlRequest<T>(
  shopDomain: string,
  apiVersion: string,
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const endpoint = `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`
  const res = await fetch(`${getCorsProxyUrl()}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (res.status === 401 || res.status === 403) {
    throw new AuthError()
  }
  if (!res.ok) {
    throw new Error(`Shopify API request failed: ${res.status}`)
  }

  const { data, errors } = (await res.json()) as GraphqlResponse<T>
  throwIfGraphqlErrors(errors)
  if (!data) {
    throw new Error('Shopify API returned an empty response.')
  }
  return data
}

export interface ShopInfo {
  name: string
  currencyCode: string
}

export async function fetchShopInfo(
  shopDomain: string,
  apiVersion: string,
  token: string,
): Promise<ShopInfo> {
  const data = await graphqlRequest<{ shop: ShopInfo }>(
    shopDomain,
    apiVersion,
    token,
    SHOP_QUERY,
  )
  return data.shop
}

export async function fetchRecentOrders(
  shopDomain: string,
  apiVersion: string,
  token: string,
): Promise<ShopifyOrder[]> {
  const data = await graphqlRequest<{
    orders: { edges: { node: ShopifyOrder }[] }
  }>(shopDomain, apiVersion, token, RECENT_ORDERS_QUERY, {
    first: RECENT_ORDERS_COUNT,
  })
  return data.orders.edges.map((edge) => edge.node)
}

async function fetchShopifyqlTable(
  shopDomain: string,
  apiVersion: string,
  token: string,
  shopifyql: string,
): Promise<ShopifyqlTableData | null> {
  const data = await graphqlRequest<{
    shopifyqlQuery: {
      tableData: ShopifyqlTableData | null
      parseErrors: string[]
    }
  }>(shopDomain, apiVersion, token, SHOPIFYQL_QUERY, { query: shopifyql })

  const { tableData, parseErrors } = data.shopifyqlQuery
  if (parseErrors.length > 0) {
    throw new Error(`ShopifyQL parse error: ${parseErrors[0]}`)
  }
  return tableData
}

export async function fetchSalesSummary(
  shopDomain: string,
  apiVersion: string,
  token: string,
  range: DateRange,
): Promise<ShopifyqlTableData | null> {
  return fetchShopifyqlTable(shopDomain, apiVersion, token, salesQuery(range))
}

export async function fetchSessionsSummary(
  shopDomain: string,
  apiVersion: string,
  token: string,
  range: DateRange,
): Promise<ShopifyqlTableData | null> {
  return fetchShopifyqlTable(
    shopDomain,
    apiVersion,
    token,
    sessionsQuery(range),
  )
}

export async function fetchSalesOverTime(
  shopDomain: string,
  apiVersion: string,
  token: string,
  range: DateRange,
): Promise<ShopifyqlTableData | null> {
  return fetchShopifyqlTable(
    shopDomain,
    apiVersion,
    token,
    salesOverTimeQuery(range),
  )
}

export async function fetchSalesByProduct(
  shopDomain: string,
  apiVersion: string,
  token: string,
  range: DateRange,
): Promise<ShopifyqlTableData | null> {
  return fetchShopifyqlTable(
    shopDomain,
    apiVersion,
    token,
    salesByProductQuery(range),
  )
}

export async function fetchSalesBreakdown(
  shopDomain: string,
  apiVersion: string,
  token: string,
  range: DateRange,
): Promise<ShopifyqlTableData | null> {
  return fetchShopifyqlTable(
    shopDomain,
    apiVersion,
    token,
    salesBreakdownQuery(range),
  )
}
