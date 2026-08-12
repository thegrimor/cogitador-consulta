import { Router } from 'express'
import { store } from '../db.js'
import { asyncHandler } from '../asyncHandler.js'

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

rostersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rosters = await store.listRostersByUser(req.user.id)
    res.json({ rosters: rosters.map(stripOwner) })
  }),
)

rostersRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!isValidRoster(req.body) || req.body.id !== id) {
      return res.status(400).json({ error: 'Lista inválida.' })
    }
    const existing = await store.findRoster(id)
    if (existing && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado.' })
    }
    const roster = await store.upsertRoster({ ...req.body, userId: req.user.id })
    res.json({ roster: stripOwner(roster) })
  }),
)

rostersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await store.findRoster(req.params.id)
    if (existing && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado.' })
    }
    await store.deleteRoster(req.params.id)
    res.status(204).end()
  }),
)
