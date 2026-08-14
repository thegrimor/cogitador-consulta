import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { authRouter } from './routes/auth.js'
import { rostersRouter } from './routes/rosters.js'
import { chatRouter } from './routes/chat.js'
import { requireAuth } from './middleware/requireAuth.js'
import { ready as dbReady, ping as dbPing } from './db.js'
import { asyncHandler } from './asyncHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8787
const DIST_DIR = path.join(__dirname, '..', '..', 'dist')

// Only needed when the frontend is deployed separately from this backend (a different
// Railway service, Vercel, Netlify, ...) — same-origin requests (dist/ served below, or the
// Vite dev proxy) don't go through CORS at all. Unset in production means "allow any
// origin", which is safe here only because auth is Bearer-token (no cookies/credentials
// involved); set it once you know the frontend's real origin.
//
// An entry starting with "*." matches any subdomain of what follows — e.g. "*.netlify.app"
// covers both the production URL and every branch/PR deploy-preview subdomain Netlify hands
// out, which each get their own unique origin.
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()).filter(Boolean)
if (!allowedOrigins?.length) {
  console.warn(
    'CORS_ORIGIN no está definida — se acepta cualquier origen. Defínela (p. ej. ' +
      'https://tu-frontend.netlify.app o *.netlify.app) en cuanto despliegues el frontend en otro dominio.',
  )
}

function originAllowed(origin) {
  return allowedOrigins.some(allowed => {
    if (allowed.startsWith('*.')) return origin.endsWith(allowed.slice(1))
    return origin === allowed
  })
}

const app = express()
app.use(
  cors({
    origin: !allowedOrigins?.length
      ? true
      : (origin, callback) => callback(null, !origin || originAllowed(origin)),
  }),
)
app.use(express.json({ limit: '2mb' }))

// Round-trips to Postgres (not just "the process is up") — point Railway's Healthcheck
// Path at this (Settings → Deploy on the service) so a bad deploy or a dead DB connection
// actually fails the check instead of looking healthy.
app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    await dbPing()
    res.json({ status: 'ok' })
  }),
)

app.use('/api/auth', authRouter)
app.use('/api/rosters', requireAuth, rostersRouter)
// Public — stateless rules lookup, nothing user- or roster-scoped (see chat.js).
app.use('/api/chat', chatRouter)

// In production the same process CAN serve the built frontend too, if dist/ is present
// (e.g. a single Railway service building the whole repo). When the frontend is deployed
// separately, dist/ just won't exist here and this block is skipped entirely.
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor.' })
})

// Wait for the schema to exist before accepting the first request.
await dbReady

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cogitador server escuchando en http://localhost:${PORT}`)
})
