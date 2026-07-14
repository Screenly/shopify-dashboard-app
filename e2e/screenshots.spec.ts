import { test } from '@playwright/test'
import {
  createMockScreenlyForScreenshots,
  getScreenshotsDir,
  RESOLUTIONS,
  setupClockMock,
  setupScreenlyJsMock,
} from '@screenly/edge-apps/test/screenshots'
import path from 'path'

const SHOP_DOMAIN = 'demo-store.myshopify.com'

const MOCK_SHOP = {
  data: {
    shop: { name: 'Demo Store', currencyCode: 'USD' },
  },
}

const MOCK_SALES = {
  data: {
    shopifyqlQuery: {
      tableData: {
        columns: [
          {
            name: 'total_sales',
            dataType: 'MONEY',
            displayName: 'Total sales',
          },
          { name: 'orders', dataType: 'INTEGER', displayName: 'Orders' },
        ],
        rows: [{ total_sales: '48210.25', orders: '312' }],
      },
      parseErrors: [],
    },
  },
}

const MOCK_SESSIONS = {
  data: {
    shopifyqlQuery: {
      tableData: {
        columns: [
          { name: 'sessions', dataType: 'INTEGER', displayName: 'Sessions' },
          {
            name: 'conversion_rate',
            dataType: 'PERCENT',
            displayName: 'Conversion rate',
          },
        ],
        rows: [{ sessions: '10482', conversion_rate: '3.1' }],
      },
      parseErrors: [],
    },
  },
}

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

const { screenlyJsContent } = createMockScreenlyForScreenshots(
  {},
  {
    access_token: 'mock-access-token',
    api_version: '2026-07',
    display_errors: 'false',
    override_locale: 'en',
    override_timezone: 'Europe/London',
    refresh_interval: '300',
    shop_domain: SHOP_DOMAIN,
  },
)

for (const { width, height } of RESOLUTIONS) {
  test(`screenshot ${width}x${height}`, async ({ browser }) => {
    const screenshotsDir = getScreenshotsDir()

    const context = await browser.newContext({ viewport: { width, height } })
    const page = await context.newPage()

    await setupClockMock(page)
    await setupScreenlyJsMock(page, screenlyJsContent)

    await page.route(`**/${SHOP_DOMAIN}/admin/api/**`, async (route) => {
      const body = route.request().postData() ?? ''
      let payload: unknown = MOCK_SHOP
      if (body.includes('shopifyqlQuery')) {
        payload = body.includes('FROM sales') ? MOCK_SALES : MOCK_SESSIONS
      } else if (body.includes('RecentOrders')) {
        payload = MOCK_ORDERS
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: path.join(screenshotsDir, `${width}x${height}.png`),
      fullPage: false,
    })

    await context.close()
  })
}
