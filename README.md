# Shopify Dashboard App

Displays Shopify store sales metrics on your Screenly digital signage screens. Choose from several single-purpose views — a KPI summary with recent orders, sales over time, sales by product, a sales breakdown, or a full-screen key metric — configurable per install via the `view` setting.

## Prerequisites

- [Bun](https://bun.sh/) 1.2+
- [Screenly CLI](https://developer.screenly.io/edge-apps/#getting-started)
- A [Shopify](https://www.shopify.com/) store and an app with Admin API access

## Getting Started

This repository uses a git submodule for Claude AI configuration. Clone it with:

```bash
gh repo clone Screenly/shopify-dashboard-app -- --recurse-submodules
```

Then install dependencies:

```bash
bun install
```

## Development

Before the first run, create the Edge App so `screenly.yml` gets an `id`:

```bash
screenly edge-app create --name shopify-dashboard --in-place
```

Then start the dev server:

```bash
bun run dev
```

This generates a `mock-data.yml` file (gitignored), starts the dev server, and starts a local CORS proxy on `http://127.0.0.1:8080`. The Shopify Admin API does not allow direct browser requests, so all API calls are routed through the CORS proxy.

After `mock-data.yml` is generated, fill in your values under `settings`:

```yaml
settings:
  access_token: '<your Admin API access token>'
  display_errors: 'false'
  override_locale: ''
  override_timezone: ''
  refresh_interval: '300'
  shop_domain: '<your store>.myshopify.com'
```

### Getting a test access token

The `access_token` setting is for testing and development only. In production, tokens are delivered by the Screenly OAuth service via the Shopify integration (the OAuth wiring is deferred for now — see `src/auth.ts`).

To get a token for development:

1. Create an app in the [Shopify Dev Dashboard](https://dev.shopify.com/) with the `read_orders`, `read_products`, and `read_reports` scopes, then release a version and install it on your (development) store.
2. For `orders`, `customers`, and ShopifyQL access, also grant the app protected customer data access: Partner Dashboard → your app → API access requests → Protected customer data access.
3. Exchange the app's client credentials for an access token:

   ```bash
   curl -X POST https://<your store>.myshopify.com/admin/oauth/access_token \
     -H "Content-Type: application/json" \
     -d '{"client_id": "...", "client_secret": "...", "grant_type": "client_credentials"}'
   ```

## Testing

```bash
bun test
```

## Building

```bash
bun run build
```

## Linting & Formatting

```bash
bun run lint
bun run format
```

## Deployment

```bash
bun run deploy
screenly edge-app instance create
```

## Views

The `view` setting selects a single view to show on screen. Digital signage is passive viewing with no on-screen interaction, so this is fixed per install rather than switchable on the device.

| View                   | `view` value       | Description                                                                                           |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| Summary View (default) | `summary`          | KPI cards (total sales, orders, sessions, conversion rate) plus a recent orders table.                |
| Total Sales Over Time  | `sales_over_time`  | Line or bar chart of sales over the selected date range.                                              |
| Total Sales By Product | `sales_by_product` | Ranked bar chart or donut chart of sales by product.                                                  |
| Total Sales Breakdown  | `sales_breakdown`  | Itemized list: gross sales, discounts, returns, net sales, shipping, return fees, taxes, total sales. |
| Key Metric             | `kpi`              | One KPI (chosen via `kpi_metric`) shown full-screen.                                                  |

## Configuration

| Setting              | Description                                                                                                                                                             | Type     | Default         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| `access_token`       | Admin API access token (testing/development only)                                                                                                                       | optional | —               |
| `chart_type`         | Preferred chart style for Total Sales Over Time / Total Sales By Product (`auto`, `line`, `bar`, `donut`)                                                               | optional | `auto`          |
| `default_date_range` | Date range shown when the dashboard loads (`today`, `7d`, `30d`); still changeable on-screen                                                                            | optional | `30d`           |
| `display_errors`     | Show errors on screen for debugging purposes                                                                                                                            | optional | `false`         |
| `kpi_metric`         | Which metric to show full-screen in the Key Metric view (`total_sales`, `orders`, `sessions`, `conversion_rate`)                                                        | optional | `total_sales`   |
| `override_locale`    | Override the locale used for formatting (e.g. `en`, `fr`, `de`)                                                                                                         | optional | `en`            |
| `override_timezone`  | Override the timezone for date display (e.g. `Europe/London`)                                                                                                           | optional | system timezone |
| `refresh_interval`   | How often (in seconds) to refresh Shopify data                                                                                                                          | optional | `300`           |
| `shop_domain`        | The myshopify.com domain of the store (e.g. `my-store.myshopify.com`). Testing/development only — in production the shop domain is provided by the Shopify integration. | optional | —               |
| `view`               | Which view to show (`summary`, `sales_over_time`, `sales_by_product`, `sales_breakdown`, `kpi`)                                                                         | optional | `summary`       |

## Screenshots

```bash
bun run screenshots
```
