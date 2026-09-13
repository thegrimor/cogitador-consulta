import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error(
    'DATABASE_URL no está definida. Apunta a tu base de datos Postgres (en Railway: la variable ' +
      'que expone el plugin Postgres, referenciada en el servicio del backend).',
  )
}

// Railway's managed Postgres sits behind a self-signed cert chain — require SSL but don't
// verify it. Only relevant for actual remote hosts; a local Postgres in dev has no TLS at all.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString)
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

// pg's Pool emits 'error' on an *idle* client going bad (the DB restarting, a network
// blip, Railway recycling the connection, ...) — with no listener, Node treats that as an
// unhandled 'error' event and crashes the whole process. A query actively in flight when
// this happens still rejects normally and is handled by asyncHandler; this only stops a
// background idle-connection hiccup from taking the entire backend down with it.
pool.on('error', err => {
  console.error('Error inesperado en una conexión inactiva de Postgres:', err)
})

function mapUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    resetTokenHash: row.reset_token_hash,
    resetTokenExpiresAt:
      row.reset_token_expires_at instanceof Date
        ? row.reset_token_expires_at.toISOString()
        : row.reset_token_expires_at,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  }
}

function mapRoster(row) {
  // `data` holds the full RosterList (id/name/factionId/.../createdAt/updatedAt) as jsonb;
  // id/created_at/updated_at are duplicated into their own columns for indexing/ordering,
  // not because the row shape and the JSON shape need to match field-for-field.
  return { ...row.data, userId: row.user_id }
}

async function migrate() {
  // `id` columns are TEXT, not UUID: RosterList.id is just `string` on the TypeScript side
  // (crypto.randomUUID() today, but nothing enforces that shape), and a strict UUID column
  // would 500 on any id that doesn't happen to parse as one.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
  // Added after the initial release, for password recovery — ADD COLUMN IF NOT EXISTS so
  // this stays idempotent on databases that already have the `users` table from before these
  // columns existed. `email` is nullable (accounts created before this change have none, and
  // there's no profile-edit UI yet to backfill one) and its uniqueness is enforced by a
  // partial index instead of an inline UNIQUE constraint, so multiple NULLs are allowed.
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;')
  await pool.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (lower(email)) WHERE email IS NOT NULL;',
  )
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash TEXT;')
  await pool.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;',
  )
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rosters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS rosters_user_id_idx ON rosters (user_id);')
}

// Awaited once from index.js before the server starts accepting requests, so the very
// first request can never race table creation.
export const ready = migrate()

// Used by the /api/health route — a real round-trip to Postgres, not just "the process is
// running," since that's the failure mode a health check actually needs to catch.
export async function ping() {
  await pool.query('SELECT 1')
}

export const store = {
  async findUserByUsername(username) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE lower(username) = lower($1)',
      [username.trim()],
    )
    return rows[0] ? mapUser(rows[0]) : undefined
  },

  async findUserById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    return rows[0] ? mapUser(rows[0]) : undefined
  },

  async createUser(user) {
    await pool.query(
      'INSERT INTO users (id, username, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)',
      [user.id, user.username, user.email, user.passwordHash, user.createdAt],
    )
    return user
  },

  async findUserByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [
      email.trim(),
    ])
    return rows[0] ? mapUser(rows[0]) : undefined
  },

  // Called on a successful "olvidé mi contraseña" request. `tokenHash` is a sha256 of the
  // raw token that only ever leaves the server in the email link — the DB never holds a
  // usable token, same reasoning as password hashing.
  async setResetToken(userId, tokenHash, expiresAt) {
    await pool.query(
      'UPDATE users SET reset_token_hash = $2, reset_token_expires_at = $3 WHERE id = $1',
      [userId, tokenHash, expiresAt],
    )
  },

  async findUserByResetTokenHash(tokenHash) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE reset_token_hash = $1 AND reset_token_expires_at > now()',
      [tokenHash],
    )
    return rows[0] ? mapUser(rows[0]) : undefined
  },

  // Sets the new password and, in the same statement, burns the reset token so it can't be
  // replayed — a used or abandoned reset link never works twice.
  async updatePassword(userId, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = $2, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = $1',
      [userId, passwordHash],
    )
  },

  async listRostersByUser(userId) {
    const { rows } = await pool.query(
      'SELECT user_id, data FROM rosters WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId],
    )
    return rows.map(mapRoster)
  },

  async findRoster(id) {
    const { rows } = await pool.query('SELECT user_id, data FROM rosters WHERE id = $1', [id])
    return rows[0] ? mapRoster(rows[0]) : undefined
  },

  async upsertRoster(roster) {
    const { userId, ...data } = roster
    await pool.query(
      `INSERT INTO rosters (id, user_id, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET data = $3, updated_at = $5`,
      [roster.id, userId, JSON.stringify(data), data.createdAt, data.updatedAt],
    )
    return roster
  },

  async deleteRoster(id) {
    const { rowCount } = await pool.query('DELETE FROM rosters WHERE id = $1', [id])
    return rowCount > 0
  },
}
