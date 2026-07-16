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

function dateRangeSince(range: DateRange): string {
  return DATE_RANGE_SHOPIFYQL_SINCE[range]
}

export function salesQuery(range: DateRange): string {
  return `FROM sales SHOW total_sales, orders SINCE ${dateRangeSince(range)}`
}

export function sessionsQuery(range: DateRange): string {
  return `FROM sessions SHOW sessions, conversion_rate SINCE ${dateRangeSince(range)}`
}

export type ViewName =
  'summary' | 'sales_over_time' | 'sales_by_product' | 'sales_breakdown' | 'kpi'

export const DEFAULT_VIEW: ViewName = 'summary'

export const VIEW_LABELS: Record<ViewName, string> = {
  summary: 'Summary View',
  sales_over_time: 'Total Sales Over Time',
  sales_by_product: 'Total Sales By Product',
  sales_breakdown: 'Total Sales Breakdown',
  kpi: 'Key Metric',
}

export function isView(value: string): value is ViewName {
  return Object.prototype.hasOwnProperty.call(VIEW_LABELS, value)
}

export type KpiMetric =
  'total_sales' | 'orders' | 'sessions' | 'conversion_rate'

export const DEFAULT_KPI_METRIC: KpiMetric = 'total_sales'

export const KPI_METRIC_LABELS: Record<KpiMetric, string> = {
  total_sales: 'Total Sales',
  orders: 'Orders',
  sessions: 'Sessions',
  conversion_rate: 'Conversion Rate',
}

export function isKpiMetric(value: string): value is KpiMetric {
  return Object.prototype.hasOwnProperty.call(KPI_METRIC_LABELS, value)
}

export type ChartType = 'auto' | 'line' | 'bar' | 'donut'

// 'auto' lets each view pick its own natural chart type (line for a time
// series, ranked bar for a per-product comparison) instead of forcing one.
export const DEFAULT_CHART_TYPE: ChartType = 'auto'

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  auto: 'Auto',
  line: 'Line',
  bar: 'Bar',
  donut: 'Donut',
}

export function isChartType(value: string): value is ChartType {
  return Object.prototype.hasOwnProperty.call(CHART_TYPE_LABELS, value)
}

// GROUP BY hour makes sense only within a single day; 7d/30d windows use daily
// buckets so the chart doesn't render hundreds of points.
function salesOverTimeGroupBy(range: DateRange): 'hour' | 'day' {
  return range === 'today' ? 'hour' : 'day'
}

export function salesOverTimeQuery(range: DateRange): string {
  return `FROM sales SHOW total_sales GROUP BY ${salesOverTimeGroupBy(range)} SINCE ${dateRangeSince(range)}`
}

export function salesByProductQuery(range: DateRange): string {
  return `FROM sales SHOW total_sales GROUP BY product_title SINCE ${dateRangeSince(range)}`
}

export function salesBreakdownQuery(range: DateRange): string {
  return `FROM sales SHOW gross_sales, discounts, returns, net_sales, shipping_charges, return_fees, taxes, total_sales SINCE ${dateRangeSince(range)}`
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
