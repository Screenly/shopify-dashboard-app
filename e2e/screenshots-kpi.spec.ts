import { test } from '@playwright/test'
import { RESOLUTIONS } from '@screenly/edge-apps/test/screenshots'
import {
  captureScreenshot,
  getViewScreenshotsDir,
  MOCK_SHOP,
  resolveSalesOrSessions,
} from './screenshot-helpers'

function resolvePayload(body: string): unknown {
  if (body.includes('shopifyqlQuery')) {
    return resolveSalesOrSessions(body)
  }
  return MOCK_SHOP
}

const viewDir = getViewScreenshotsDir('kpi')

const KPI_SETTINGS = {
  access_token: 'mock-access-token',
  view: 'kpi',
  kpi_metric: 'total_sales',
}

for (const { width, height } of RESOLUTIONS) {
  test(`screenshot ${width}x${height} auto`, async ({ browser }) => {
    await captureScreenshot({
      browser,
      width,
      height,
      viewDir,
      settings: KPI_SETTINGS,
      resolvePayload,
      filenameSuffix: '-auto',
    })
  })
}

const OTHER_METRICS = ['orders', 'sessions', 'conversion_rate']

const OTHER_METRIC_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1080, height: 1920 },
]

for (const metric of OTHER_METRICS) {
  for (const { width, height } of OTHER_METRIC_RESOLUTIONS) {
    test(`screenshot ${width}x${height} ${metric}`, async ({ browser }) => {
      await captureScreenshot({
        browser,
        width,
        height,
        viewDir,
        settings: { ...KPI_SETTINGS, kpi_metric: metric },
        resolvePayload,
        filenameSuffix: `-${metric.replace(/_/g, '-')}`,
      })
    })
  }
}
