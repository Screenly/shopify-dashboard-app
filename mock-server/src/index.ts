import cors from 'cors'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { PORT } from './constants'
import { getError, getToken } from './store'
import { fetchToken, startRefreshLoop } from './token'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN

const app = express()
app.use(cors({ origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ }))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.get('/', (_req, res) => {
  res.render('index', { token: getToken(), error: getError(), shopDomain })
})

app.post('/refresh', async (_req, res) => {
  await fetchToken()
  res.redirect('/')
})

// Matches the shape expected by getCredentials() in @screenly/edge-apps.
// Set screenly_oauth_tokens_url=http://localhost:3000/ in mock-data.yml.
app.get('/access_token/', (_req, res) => {
  const token = getToken()
  if (!token) {
    res.status(401).json({ error: getError() ?? 'No token available yet.' })
    return
  }
  res.json({ token: token.access_token, metadata: { shop: shopDomain } })
})

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`)
  startRefreshLoop()
})
