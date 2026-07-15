# Mock Server

A local stand-in for the Screenly OAuth service, so the Shopify Edge App's
production credential path (`getCredentials()`) can be exercised locally
without running the full `Screenly/Screenly` backend.

Shopify's OAuth 2.0 client credentials grant is a direct server-to-server
exchange — no user redirect or PKCE involved — so this server just fetches an
access token from Shopify on startup, caches it in memory, refreshes it
periodically, and serves it in the shape `getCredentials()` expects.

## Prerequisites

- [Bun](https://bun.sh/) 1.2+
- A Shopify app (Dev Dashboard) with a Client ID and Client Secret, installed
  on the dev store you want to test against

## Getting Started

```bash
cp .env.example .env
```

Fill in `.env`:

```
SHOPIFY_CLIENT_ID=your_shopify_client_id_here
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret_here
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
```

Then install dependencies and start the server:

```bash
bun install
bun run dev
```

Open `http://localhost:3000` in a browser to see the current token status.

## How It Works

1. On startup, the server exchanges `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET`
   for an access token via Shopify's client credentials grant
   (`POST https://{shop}/admin/oauth/access_token`).
2. The token is cached in memory and re-fetched every 50 minutes in the
   background (Shopify client-credentials tokens don't expire on a fixed
   schedule, but refreshing periodically keeps this resilient to rotation).
3. The Edge App calls `GET /access_token/` to retrieve the current token at
   runtime, matching the shape `getCredentials()` in `@screenly/edge-apps`
   expects.

## Endpoints

| Endpoint             | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `GET /`              | Status page showing the current token and shop domain    |
| `POST /refresh`      | Manually re-fetches the token from Shopify               |
| `GET /access_token/` | Returns `{ token, metadata: { shop } }` for the Edge App |

## Connecting to the Edge App

In `mock-data.yml` (at the repository root), set:

```yaml
settings:
  screenly_oauth_tokens_url: 'http://localhost:3000/'
```

The Edge App will call `GET /access_token/` on startup and whenever
`getCredentials()` is invoked. Leave the `access_token` setting in
`mock-data.yml`/`screenly.yml` unset to actually exercise this path — a
non-empty `access_token` setting takes precedence and skips it entirely (see
`src/auth.ts`).
