import { Router } from 'express'
import crypto from 'node:crypto'
import { store } from '../db.js'
import {
  hashPassword,
  verifyPassword,
  signToken,
  generateResetToken,
  hashResetToken,
} from '../auth.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { asyncHandler } from '../asyncHandler.js'
import { sendPasswordResetEmail } from '../lib/mailer.js'

export const authRouter = Router()

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour — short-lived, unlike session tokens

function publicUser(user) {
  return { id: user.id, username: user.username, email: user.email }
}

// Used to build the link that goes out in the reset email. Points at the frontend (a
// different origin whenever it's deployed separately, e.g. Netlify — see server/README.md),
// not this backend, since /reset-password is a page the user opens in their browser, not an
// API route. Falls back to the request's own origin so same-origin/local-dev setups (Vite's
// proxy, or this process serving dist/) work without setting anything.
function frontendOrigin(req) {
  return process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body ?? {}
    if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
      return res
        .status(400)
        .json({ error: 'El usuario debe tener 3-24 caracteres (letras, números, _ o -).' })
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'Ingresá un email válido — lo necesitás para recuperar tu contraseña.' })
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
    }
    if (await store.findUserByUsername(username)) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya existe.' })
    }
    if (await store.findUserByEmail(email)) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })
    }

    const user = {
      id: crypto.randomUUID(),
      username,
      email: email.trim(),
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

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

authRouter.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body ?? {}
    // Always the same response whether or not the email matches an account — otherwise this
    // endpoint becomes a way to check which emails are registered.
    const genericResponse = {
      ok: true,
      message: 'Si existe una cuenta con ese email, te enviamos un enlace para recuperar tu contraseña.',
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return res.json(genericResponse)
    }

    const user = await store.findUserByEmail(email)
    if (user) {
      const token = generateResetToken()
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()
      await store.setResetToken(user.id, hashResetToken(token), expiresAt)
      const resetUrl = `${frontendOrigin(req)}/reset-password?token=${token}`
      try {
        await sendPasswordResetEmail({ to: user.email, resetUrl })
      } catch (err) {
        // Sending failed (provider outage, bad address, ...) — logged, not surfaced. The
        // token is already stored, so a retry from the user hits the same code path cleanly.
        console.error('No se pudo enviar el email de recuperación:', err)
      }
    }

    res.json(genericResponse)
  }),
)

authRouter.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, password } = req.body ?? {}
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
    }
    const user =
      typeof token === 'string' && token
        ? await store.findUserByResetTokenHash(hashResetToken(token))
        : undefined
    if (!user) {
      return res.status(400).json({ error: 'El enlace no es válido o ya expiró. Pedí uno nuevo.' })
    }

    await store.updatePassword(user.id, hashPassword(password))
    res.json({ ok: true })
  }),
)
