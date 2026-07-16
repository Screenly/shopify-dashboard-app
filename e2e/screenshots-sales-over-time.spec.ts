import { test } from '@playwright/test'
import { RESOLUTIONS } from '@screenly/edge-apps/test/screenshots'
import {
  captureScreenshot,
  getViewScreenshotsDir,
  makeResolvePayload,
} from './screenshot-helpers'

function salesOverTimePayload(rows: { day: string; total_sales: string }[]) {
  return {
    data: {
      shopifyqlQuery: {
        tableData: {
          columns: [
            { name: 'day', displayName: 'Day', dataType: 'DAY_TIMESTAMP' },
            {
              name: 'total_sales',
              dataType: 'MONEY',
              displayName: 'Total sales',
            },
          ],
          rows,
        },
        parseErrors: [],
      },
    },
  }
}

// default_date_range defaults to 30d (see screenly.yml), so
// salesOverTimeQuery groups by day, not hour, for these screenshots. A real
// 30-day query returns one row per day; sampling only a handful of dates
// left long straight-line segments between them and looked jagged, so this
// generates a full day-by-day series instead. The wave is a deterministic
// formula (not Math.random()) so screenshots stay reproducible across runs.
const DAY_COUNT = 30
const START_DATE = '2026-06-15T00:00:00Z'

function dailySalesRow(i: number): { day: string; total_sales: string } {
  const date = new Date(START_DATE)
  date.setUTCDate(date.getUTCDate() + i)
  const cycle = (i / DAY_COUNT) * Math.PI * 2
  const value = 1500 + 350 * Math.sin(cycle) + 150 * Math.sin(cycle * 2 + 1)
  return { day: date.toISOString().slice(0, 10), total_sales: value.toFixed(2) }
}

const MOCK_SALES_OVER_TIME = salesOverTimePayload(
  Array.from({ length: DAY_COUNT }, (_, i) => dailySalesRow(i)),
)

const SALES_OVER_TIME_SETTINGS = {
  access_token: 'mock-access-token',
  view: 'sales_over_time',
  chart_type: 'auto',
}

const viewDir = getViewScreenshotsDir('sales-over-time')

for (const { width, height } of RESOLUTIONS) {
  test(`screenshot ${width}x${height}`, async ({ browser }) => {
    await captureScreenshot({
      browser,
      width,
      height,
      viewDir,
      settings: SALES_OVER_TIME_SETTINGS,
      resolvePayload: makeResolvePayload(MOCK_SALES_OVER_TIME),
    })
  })
}
