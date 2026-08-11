import { verifyToken } from '../auth.js'
import { store } from '../db.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')
  const payload = scheme === 'Bearer' ? verifyToken(token) : null
  const user = payload ? store.findUserById(payload.sub) : undefined
  if (!user) return res.status(401).json({ error: 'No autenticado.' })
  req.user = user
  next()
}
