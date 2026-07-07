import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static assets from public/static/
app.use('/static/*', serveStatic({ root: './' }))

// Serve the main SPA for all routes
app.use('/*', serveStatic({ root: './', path: 'public/index.html' }))

export default app
