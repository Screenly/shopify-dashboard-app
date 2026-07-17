import { test } from '@playwright/test'
import { RESOLUTIONS } from '@screenly/edge-apps/test/screenshots'
import {
  captureScreenshot,
  getViewScreenshotsDir,
  MOCK_SHOP,
  resolveSalesOrSessions,
} from './screenshot-helpers'

const MOCK_ORDER_ITEMS = [
  ['#1042', '2025-12-08T09:45:00Z', '512.40', 'PAID', 'FULFILLED'],
  ['#1041', '2025-12-08T08:12:00Z', '89.99', 'PAID', 'UNFULFILLED'],
  ['#1040', '2025-12-07T22:30:00Z', '1240.00', 'PAID', 'FULFILLED'],
  ['#1039', '2025-12-07T18:05:00Z', '64.50', 'PENDING', 'UNFULFILLED'],
  ['#1038', '2025-12-07T15:47:00Z', '310.75', 'PAID', 'PARTIALLY_FULFILLED'],
  ['#1037', '2025-12-07T11:20:00Z', '158.20', 'PAID', 'FULFILLED'],
  ['#1036', '2025-12-06T20:55:00Z', '2051.59', 'PAID', 'FULFILLED'],
  ['#1035', '2025-12-06T16:33:00Z', '45.00', 'REFUNDED', 'FULFILLED'],
]

const MOCK_ORDERS = {
  data: {
    orders: {
      edges: MOCK_ORDER_ITEMS.map(
        ([name, createdAt, amount, financial, fulfillment], index) => ({
          node: {
            id: `gid://shopify/Order/${index + 1}`,
            name,
            createdAt,
            displayFinancialStatus: financial,
            displayFulfillmentStatus: fulfillment,
            totalPriceSet: {
              shopMoney: { amount, currencyCode: 'USD' },
            },
          },
        }),
      ),
    },
  },
}

function resolvePayload(body: string): unknown {
  if (body.includes('shopifyqlQuery')) {
    return resolveSalesOrSessions(body)
  }
  if (body.includes('RecentOrders')) {
    return MOCK_ORDERS
  }
  return MOCK_SHOP
}

const viewDir = getViewScreenshotsDir('summary-view')

for (const { width, height } of RESOLUTIONS) {
  test(`screenshot ${width}x${height}`, async ({ browser }) => {
    await captureScreenshot({
      browser,
      width,
      height,
      viewDir,
      settings: { access_token: 'mock-access-token' },
      resolvePayload,
      filenameSuffix: '-auto',
    })
  })
}
