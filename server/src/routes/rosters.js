import { Router } from 'express'
import { store } from '../db.js'

export const rostersRouter = Router()

const REQUIRED_FIELDS = [
  'id',
  'name',
  'factionId',
  'detachmentIds',
  'entries',
  'totalPoints',
  'pointsLimit',
  'createdAt',
  'updatedAt',
]

function isValidRoster(body) {
  return (
    body &&
    typeof body === 'object' &&
    REQUIRED_FIELDS.every(field => field in body) &&
    Array.isArray(body.detachmentIds) &&
    Array.isArray(body.entries)
  )
}

function stripOwner(roster) {
  const { userId: _userId, ...rest } = roster
  return rest
}

// All routes here run behind requireAuth (mounted in index.js), so req.user is always set.

rostersRouter.get('/', (req, res) => {
  res.json({ rosters: store.listRostersByUser(req.user.id).map(stripOwner) })
})

rostersRouter.put('/:id', (req, res) => {
  const { id } = req.params
  if (!isValidRoster(req.body) || req.body.id !== id) {
    return res.status(400).json({ error: 'Lista inválida.' })
  }
  const existing = store.findRoster(id)
  if (existing && existing.userId !== req.user.id) {
    return res.status(403).json({ error: 'No autorizado.' })
  }
  const roster = store.upsertRoster({ ...req.body, userId: req.user.id })
  res.json({ roster: stripOwner(roster) })
})

rostersRouter.delete('/:id', (req, res) => {
  const existing = store.findRoster(req.params.id)
  if (existing && existing.userId !== req.user.id) {
    return res.status(403).json({ error: 'No autorizado.' })
  }
  store.deleteRoster(req.params.id)
  res.status(204).end()
})
