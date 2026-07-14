export const DEFAULT_API_VERSION = '2026-07'

export const DEFAULT_REFRESH_INTERVAL = 300

export const RECENT_ORDERS_COUNT = 8

export const SALES_QUERY = 'FROM sales SHOW total_sales, orders SINCE -30d'

export const SESSIONS_QUERY =
  'FROM sessions SHOW sessions, conversion_rate SINCE -30d'

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
