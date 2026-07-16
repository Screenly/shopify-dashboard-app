import { test } from '@playwright/test'
import { RESOLUTIONS } from '@screenly/edge-apps/test/screenshots'
import {
  captureScreenshot,
  getViewScreenshotsDir,
  makeResolvePayload,
} from './screenshot-helpers'

const BREAKDOWN_COLUMNS = [
  'gross_sales',
  'discounts',
  'returns',
  'net_sales',
  'shipping_charges',
  'return_fees',
  'taxes',
  'total_sales',
] as const

function salesBreakdownPayload(row: Record<string, string>) {
  return {
    data: {
      shopifyqlQuery: {
        tableData: {
          columns: BREAKDOWN_COLUMNS.map((name) => ({
            name,
            displayName: name,
            dataType: 'MONEY',
          })),
          rows: [row],
        },
        parseErrors: [],
      },
    },
  }
}

const MOCK_SALES_BREAKDOWN = salesBreakdownPayload({
  gross_sales: '2481.90',
  discounts: '134.50',
  returns: '87.25',
  net_sales: '2260.15',
  shipping_charges: '95.00',
  return_fees: '12.00',
  taxes: '186.35',
  total_sales: '2553.50',
})

const SALES_BREAKDOWN_SETTINGS = {
  access_token: 'mock-access-token',
  view: 'sales_breakdown',
  chart_type: 'auto',
}

const viewDir = getViewScreenshotsDir('sales-breakdown')

for (const { width, height } of RESOLUTIONS) {
  test(`screenshot ${width}x${height}`, async ({ browser }) => {
    await captureScreenshot({
      browser,
      width,
      height,
      viewDir,
      settings: SALES_BREAKDOWN_SETTINGS,
      resolvePayload: makeResolvePayload(MOCK_SALES_BREAKDOWN),
      filenameSuffix: '-auto',
    })
  })
}
