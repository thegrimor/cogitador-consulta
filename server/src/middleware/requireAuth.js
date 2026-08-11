import { verifyToken } from '../auth.js'
import { store } from '../db.js'
import { asyncHandler } from '../asyncHandler.js'

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')
  const payload = scheme === 'Bearer' ? verifyToken(token) : null
  const user = payload ? await store.findUserById(payload.sub) : undefined
  if (!user) return res.status(401).json({ error: 'No autenticado.' })
  req.user = user
  next()
})
