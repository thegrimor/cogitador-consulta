import crypto from 'node:crypto'

// Deliberately dependency-free: a minimal HMAC-signed token (JWT-shaped, not JWT-compliant)
// and scrypt password hashing, both using only Node's built-in `crypto` module.

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function sign(body) {
  return crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
}

export function signToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL_MS })).toString(
    'base64url',
  )
  return `${body}.${sign(body)}`
}

export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = sign(body)
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = typeof stored === 'string' ? stored.split(':') : []
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(candidate, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
