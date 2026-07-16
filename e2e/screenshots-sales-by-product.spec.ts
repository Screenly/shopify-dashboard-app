import { test } from '@playwright/test'
import { RESOLUTIONS } from '@screenly/edge-apps/test/screenshots'
import {
  captureScreenshot,
  getViewScreenshotsDir,
  makeResolvePayload,
} from './screenshot-helpers'

function salesByProductPayload(
  rows: { product_title: string | null; total_sales: string }[],
) {
  return {
    data: {
      shopifyqlQuery: {
        tableData: {
          columns: [
            {
              name: 'product_title',
              displayName: 'Product title',
              dataType: 'STRING',
            },
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

const MOCK_SALES_BY_PRODUCT = salesByProductPayload([
  { product_title: 'The Complete Snowboard', total_sales: '2020.53' },
  { product_title: 'The Multi-location Snowboard', total_sales: '703.79' },
  { product_title: null, total_sales: '61.66' },
  { product_title: 'Gift Card', total_sales: '0' },
])

const NAMED_PRODUCTS = [
  'The Complete Snowboard',
  'The Multi-location Snowboard',
  'The Collection Snowboard: Liquid',
  'The Compare at Price Snowboard',
  'The Inventory Not Tracked Snowboard',
  'The Out of Stock Snowboard',
  'The Videographer Snowboard',
  'The Archived Snowboard',
  'The Draft Snowboard',
  'The Hidden Snowboard',
  'The Minimal Snowboard',
  'The Selling Plans Ski Wax',
  'Gift Card',
  'The 3p Fulfilled Snowboard',
  'The Template Snowboard',
]

// 40 products is comfortably past both the landscape (15) and portrait (30)
// ranked-bar caps, so this scenario also exercises the fold-into-"Other" path.
const PRODUCT_COUNT = 40
const MANY_PRODUCT_NAMES = Array.from(
  { length: PRODUCT_COUNT },
  (_, i) => NAMED_PRODUCTS[i] ?? `Product ${i + 1}`,
)

const MOCK_MANY_SALES_BY_PRODUCT = salesByProductPayload(
  MANY_PRODUCT_NAMES.map((product_title, i) => ({
    product_title,
    total_sales: String(2000 - i * 45),
  })),
)

const SALES_BY_PRODUCT_SETTINGS = {
  access_token: 'mock-access-token',
  view: 'sales_by_product',
  chart_type: 'auto',
}

const DONUT_SETTINGS = {
  access_token: 'mock-access-token',
  view: 'sales_by_product',
  chart_type: 'donut',
}

const viewDir = getViewScreenshotsDir('sales-by-product')

for (const { width, height } of RESOLUTIONS) {
  test(`screenshot ${width}x${height} auto`, async ({ browser }) => {
    await captureScreenshot({
      browser,
      width,
      height,
      viewDir,
      settings: SALES_BY_PRODUCT_SETTINGS,
      resolvePayload: makeResolvePayload(MOCK_SALES_BY_PRODUCT),
      filenameSuffix: '-auto',
    })
  })
}

for (const { width, height } of RESOLUTIONS) {
  test(`screenshot ${width}x${height} donut`, async ({ browser }) => {
    await captureScreenshot({
      browser,
      width,
      height,
      viewDir,
      settings: DONUT_SETTINGS,
      resolvePayload: makeResolvePayload(MOCK_SALES_BY_PRODUCT),
      filenameSuffix: '-donut',
    })
  })
}

// One landscape and one portrait resolution are enough to cover the
// many-bars case; it doesn't need the full resolution matrix like the
// primary scenario above.
const MANY_PRODUCTS_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1080, height: 1920 },
]

for (const { width, height } of MANY_PRODUCTS_RESOLUTIONS) {
  test(`screenshot ${width}x${height} with many products`, async ({
    browser,
  }) => {
    await captureScreenshot({
      browser,
      width,
      height,
      viewDir,
      settings: SALES_BY_PRODUCT_SETTINGS,
      resolvePayload: makeResolvePayload(MOCK_MANY_SALES_BY_PRODUCT),
      filenameSuffix: '-many-products',
    })
  })
}
