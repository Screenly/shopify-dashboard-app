export const DEFAULT_API_VERSION = '2026-07'

export const DEFAULT_REFRESH_INTERVAL = 300

export const RECENT_ORDERS_COUNT = 8

export type DateRange = 'today' | '7d' | '30d'

export const DEFAULT_DATE_RANGE: DateRange = '30d'

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  '7d': '7D',
  '30d': '30D',
}

const DATE_RANGE_SHOPIFYQL_SINCE: Record<DateRange, string> = {
  today: 'today',
  '7d': '-7d',
  '30d': '-30d',
}

export function isDateRange(value: string): value is DateRange {
  return Object.prototype.hasOwnProperty.call(DATE_RANGE_LABELS, value)
}

export function salesQuery(range: DateRange): string {
  return `FROM sales SHOW total_sales, orders SINCE ${DATE_RANGE_SHOPIFYQL_SINCE[range]}`
}

export function sessionsQuery(range: DateRange): string {
  return `FROM sessions SHOW sessions, conversion_rate SINCE ${DATE_RANGE_SHOPIFYQL_SINCE[range]}`
}

export const SHOP_QUERY = `
  query ShopInfo {
    shop {
      name
      currencyCode
    }
  }
`

export const RECENT_ORDERS_QUERY = `
  query RecentOrders($first: Int!) {
    orders(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`

export const SHOPIFYQL_QUERY = `
  query ShopifyqlQuery($query: String!) {
    shopifyqlQuery(query: $query) {
      tableData {
        columns {
          name
          dataType
          displayName
        }
        rows
      }
      parseErrors
    }
  }
`
