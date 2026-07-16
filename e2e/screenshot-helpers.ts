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
