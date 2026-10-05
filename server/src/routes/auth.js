import { Router } from 'express'
import crypto from 'node:crypto'
import { store } from '../db.js'
import { hashPassword, verifyPassword, signToken } from '../auth.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { asyncHandler } from '../asyncHandler.js'

export const authRouter = Router()

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/

function publicUser(user) {
  return { id: user.id, username: user.username }
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body ?? {}
    if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
      return res
        .status(400)
        .json({ error: 'El usuario debe tener 3-24 caracteres (letras, números, _ o -).' })
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
    }
    if (await store.findUserByUsername(username)) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya existe.' })
    }

    const user = {
      id: crypto.randomUUID(),
      username,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    }
    await store.createUser(user)

    const token = signToken({ sub: user.id })
    res.status(201).json({ token, user: publicUser(user) })
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body ?? {}
    const user = typeof username === 'string' ? await store.findUserByUsername(username) : undefined
    if (!user || typeof password !== 'string' || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
    }
    const token = signToken({ sub: user.id })
    res.json({ token, user: publicUser(user) })
  }),
)

// Password recovery by username alone — no email, no token. Deliberate: the app is
// invite-only, so anyone who knows a username is trusted to reset it. Revisit (email-based
// reset) before opening registration to the public. ALLOW_PASSWORD_RESET=false disables it.
authRouter.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    if (process.env.ALLOW_PASSWORD_RESET === 'false') {
      return res.status(403).json({ error: 'La recuperación de contraseña está desactivada.' })
    }
    const { username, password } = req.body ?? {}
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
    }
    const user = typeof username === 'string' ? await store.findUserByUsername(username) : undefined
    if (!user) {
      return res.status(404).json({ error: 'No existe ese usuario.' })
    }
    await store.updateUserPassword(user.id, hashPassword(password))
    const token = signToken({ sub: user.id })
    res.json({ token, user: publicUser(user) })
  }),
)

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})
