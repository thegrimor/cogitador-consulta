// Fixed per-faction color, independent of whichever of the 24 themes is active — see the
// --color-faction-* block near the top of index.css for the full rationale. Keyed by the
// slug id from public/data/catalog/factions.json (also Datasheet.factionId/
// Detachment.factionId), NOT src/themes/themes.ts's short ids ("ac", "ork"...) — the two
// don't line up, so this table was built by hand, matching each faction by display name
// against themes.ts, and takes that theme's own crimsonBright as this faction's frozen color.
//
// Tailwind needs the literal class string at each call site (see missionDeckColors.ts's
// `borderSoft` comment) — `text` is pre-composed for that reason, not built by concatenating
// `text-faction-` + a slug at the call site.
interface FactionColor {
  hex: string
  text: string
}

export const FACTION_COLORS: Record<string, FactionColor> = {
  'adepta-sororitas': { hex: '#e24352', text: 'text-faction-adepta-sororitas' },
  'adeptus-custodes': { hex: '#e8a020', text: 'text-faction-adeptus-custodes' },
  'adeptus-mechanicus': { hex: '#e04545', text: 'text-faction-adeptus-mechanicus' },
  'adeptus-titanicus': { hex: '#9098a8', text: 'text-faction-adeptus-titanicus' },
  aeldari: { hex: '#d8c878', text: 'text-faction-aeldari' },
  'astra-militarum': { hex: '#7a9840', text: 'text-faction-astra-militarum' },
  'chaos-daemons': { hex: '#b447e4', text: 'text-faction-chaos-daemons' },
  'chaos-knights': { hex: '#907665', text: 'text-faction-chaos-knights' },
  'chaos-space-marines': { hex: '#c09020', text: 'text-faction-chaos-space-marines' },
  'death-guard': { hex: '#6a9830', text: 'text-faction-death-guard' },
  drukhari: { hex: '#18b0b0', text: 'text-faction-drukhari' },
  'emperors-children': { hex: '#e02aa8', text: 'text-faction-emperors-children' },
  'genestealer-cults': { hex: '#995ce7', text: 'text-faction-genestealer-cults' },
  'grey-knights': { hex: '#90a8d0', text: 'text-faction-grey-knights' },
  'imperial-agents': { hex: '#b08020', text: 'text-faction-imperial-agents' },
  'imperial-knights': { hex: '#dc4657', text: 'text-faction-imperial-knights' },
  'leagues-of-votann': { hex: '#e07820', text: 'text-faction-leagues-of-votann' },
  necrons: { hex: '#00e5c8', text: 'text-faction-necrons' },
  orks: { hex: '#50d820', text: 'text-faction-orks' },
  'space-marines': { hex: '#547fe2', text: 'text-faction-space-marines' },
  'tau-empire': { hex: '#4da6ff', text: 'text-faction-tau-empire' },
  'thousand-sons': { hex: '#20a0b8', text: 'text-faction-thousand-sons' },
  tyranids: { hex: '#ba44de', text: 'text-faction-tyranids' },
  'world-eaters': { hex: '#ed2a2a', text: 'text-faction-world-eaters' },
}

export function factionColor(factionId: string): FactionColor | undefined {
  return FACTION_COLORS[factionId]
}
