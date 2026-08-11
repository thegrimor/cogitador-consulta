import { Router } from 'express'
import crypto from 'node:crypto'
import { store } from '../db.js'
import { hashPassword, verifyPassword, signToken } from '../auth.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const authRouter = Router()

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/

function publicUser(user) {
  return { id: user.id, username: user.username }
}

authRouter.post('/register', (req, res) => {
  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return res
      .status(400)
      .json({ error: 'El usuario debe tener 3-24 caracteres (letras, números, _ o -).' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
  }
  if (store.findUserByUsername(username)) {
    return res.status(409).json({ error: 'Ese nombre de usuario ya existe.' })
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  store.createUser(user)

  const token = signToken({ sub: user.id })
  res.status(201).json({ token, user: publicUser(user) })
})

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body ?? {}
  const user = typeof username === 'string' ? store.findUserByUsername(username) : undefined
  if (!user || typeof password !== 'string' || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
  }
  const token = signToken({ sub: user.id })
  res.json({ token, user: publicUser(user) })
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})
