# Shopify Dashboard App

Displays Shopify store sales metrics on your Screenly digital signage screens: total sales, order count, sessions, conversion rate, and recent orders.

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
  api_version: '2026-07'
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

## Configuration

| Setting             | Description                                                           | Type     | Default         |
| ------------------- | --------------------------------------------------------------------- | -------- | --------------- |
| `access_token`      | Admin API access token (testing/development only)                     | optional | —               |
| `api_version`       | Shopify Admin API version used for GraphQL requests                   | optional | `2026-07`       |
| `display_errors`    | Show errors on screen for debugging purposes                          | optional | `false`         |
| `override_locale`   | Override the locale used for formatting (e.g. `en`, `fr`, `de`)       | optional | `en`            |
| `override_timezone` | Override the timezone for date display (e.g. `Europe/London`)         | optional | system timezone |
| `refresh_interval`  | How often (in seconds) to refresh Shopify data                        | optional | `300`           |
| `shop_domain`       | The myshopify.com domain of the store (e.g. `my-store.myshopify.com`) | required | —               |

## Screenshots

```bash
bun run screenshots
```
