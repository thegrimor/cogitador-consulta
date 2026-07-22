import type { MissionsData, PrimaryMissionCard } from '@/types'

export function mdBoldToHtml(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
}

export function cleanMissionHtml(html: string): string {
  return html.replace(/\sclass="cB__(?:mark|wmWord)"(?:\s+data-n="\d+")?/g, '')
}

export function missionSlug(url: string): string {
  return url.split('/').filter(Boolean).pop() ?? ''
}

/** Resuelve la carta de misión primaria de `ownDeck` cuando se enfrenta a `opponentDeck`, vía la matriz. */
export function resolveCard(missions: MissionsData, ownDeck: string, opponentDeck: string): PrimaryMissionCard | null {
  const cardName = missions.matrix.grid[ownDeck]?.[opponentDeck]
  if (!cardName) return null
  const deck = missions.primaryMissions.find(d => d.name === ownDeck)
  return deck?.cards.find(c => c.name === cardName) ?? null
}
