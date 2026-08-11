import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { authRouter } from './routes/auth.js'
import { rostersRouter } from './routes/rosters.js'
import { requireAuth } from './middleware/requireAuth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8787
const DIST_DIR = path.join(__dirname, '..', '..', 'dist')

const app = express()
app.use(express.json({ limit: '2mb' }))

app.use('/api/auth', authRouter)
app.use('/api/rosters', requireAuth, rostersRouter)

// In production the same process can serve the built frontend, so there's only one
// deployable unit. In dev, `dist/` won't exist yet — Vite's own dev server handles the
// frontend then, proxying /api to this server (see vite.config.ts).
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

app.listen(PORT, () => {
  console.log(`Cogitador server escuchando en http://localhost:${PORT}`)
})
