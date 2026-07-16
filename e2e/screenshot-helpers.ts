import type { Browser } from '@playwright/test'
import {
  createMockScreenlyForScreenshots,
  getScreenshotsDir,
  setupClockMock,
  setupScreenlyJsMock,
} from '@screenly/edge-apps/test/screenshots'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export const SHOP_DOMAIN = 'demo-store.myshopify.com'

export const MOCK_SHOP = {
  data: {
    shop: { name: 'Demo Store', currencyCode: 'USD' },
  },
}

export const MOCK_ORDERS_EMPTY = { data: { orders: { edges: [] } } }

// Every view's route mock branches the same way: the view's own ShopifyQL
// payload, empty recent orders, and shop info as the fallback.
export function makeResolvePayload(salesPayload: unknown) {
  return (body: string): unknown => {
    if (body.includes('shopifyqlQuery')) {
      return salesPayload
    }
    if (body.includes('RecentOrders')) {
      return MOCK_ORDERS_EMPTY
    }
    return MOCK_SHOP
  }
}

export const MOCK_SALES = {
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

export const MOCK_SESSIONS = {
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

// The summary and kpi views both fetch sales and sessions data over the same
// shopifyqlQuery field, distinguishable only by which ShopifyQL query text
// each request carries.
export function resolveSalesOrSessions(body: string): unknown {
  return body.includes('FROM sales') ? MOCK_SALES : MOCK_SESSIONS
}

// edge-apps-scripts' own PNG->WebP conversion only scans the top level of
// screenshots/, so screenshots living in per-view subdirectories are
// converted directly by callers instead of relying on that flat pass.
export function getViewScreenshotsDir(view: string): string {
  const dir = path.join(getScreenshotsDir(), view)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

interface CaptureScreenshotParams {
  browser: Browser
  width: number
  height: number
  viewDir: string
  settings: Record<string, string>
  resolvePayload: (body: string) => unknown
  filenameSuffix?: string
}

export async function captureScreenshot({
  browser,
  width,
  height,
  viewDir,
  settings,
  resolvePayload,
  filenameSuffix = '',
}: CaptureScreenshotParams): Promise<void> {
  const { screenlyJsContent } = createMockScreenlyForScreenshots(
    {},
    {
      api_version: '2026-07',
      display_errors: 'false',
      override_locale: 'en',
      override_timezone: 'Europe/London',
      refresh_interval: '300',
      shop_domain: SHOP_DOMAIN,
      ...settings,
    },
  )

  const context = await browser.newContext({ viewport: { width, height } })
  const page = await context.newPage()

  await setupClockMock(page)
  await setupScreenlyJsMock(page, screenlyJsContent)

  await page.route(`**/${SHOP_DOMAIN}/admin/api/**`, async (route) => {
    const body = route.request().postData() ?? ''
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(resolvePayload(body)),
    })
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const png = await page.screenshot({ fullPage: false })
  const filename = `${width}x${height}${filenameSuffix}.webp`
  await sharp(png).webp().toFile(path.join(viewDir, filename))

  await context.close()
}
