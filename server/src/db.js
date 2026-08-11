import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Hand-rolled JSON-file store, in keeping with the rest of the app's "plain JSON is the
// source of truth" data layer — no database server, no native deps to install/compile.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.json')

function emptyDb() {
  return { users: [], rosters: [] }
}

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return { users: parsed.users ?? [], rosters: parsed.rosters ?? [] }
  } catch {
    return emptyDb()
  }
}

const db = load()

function persist() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const tmpPath = `${DB_PATH}.tmp`
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2))
  fs.renameSync(tmpPath, DB_PATH)
}

export const store = {
  findUserByUsername(username) {
    const needle = username.trim().toLowerCase()
    return db.users.find(u => u.username.toLowerCase() === needle)
  },

  findUserById(id) {
    return db.users.find(u => u.id === id)
  },

  createUser(user) {
    db.users.push(user)
    persist()
    return user
  },

  listRostersByUser(userId) {
    return db.rosters.filter(r => r.userId === userId)
  },

  findRoster(id) {
    return db.rosters.find(r => r.id === id)
  },

  upsertRoster(roster) {
    const idx = db.rosters.findIndex(r => r.id === roster.id)
    if (idx >= 0) db.rosters[idx] = roster
    else db.rosters.push(roster)
    persist()
    return roster
  },

  deleteRoster(id) {
    const before = db.rosters.length
    db.rosters = db.rosters.filter(r => r.id !== id)
    if (db.rosters.length !== before) persist()
    return db.rosters.length !== before
  },
}
