// `borderSoft` is a fully literal `border-<color>/60` string (not built by concatenating
// `border` + `/60` at a call site) because Tailwind's JIT scanner extracts class candidates
// as raw text from source files — a template-interpolated `${colors.border}/60` would never
// appear as that literal substring anywhere and silently fails to generate the utility.
export const DECK_COLORS: Record<string, { text: string; bar: string; border: string; borderSoft: string; borderLeft: string }> = {
  'take-and-hold': { text: 'text-deck-hold', bar: 'bg-deck-hold', border: 'border-deck-hold', borderSoft: 'border-deck-hold/60', borderLeft: 'border-l-deck-hold' },
  'purge-the-foe': { text: 'text-deck-purge', bar: 'bg-deck-purge', border: 'border-deck-purge', borderSoft: 'border-deck-purge/60', borderLeft: 'border-l-deck-purge' },
  disruption: { text: 'text-deck-disruption', bar: 'bg-deck-disruption', border: 'border-deck-disruption', borderSoft: 'border-deck-disruption/60', borderLeft: 'border-l-deck-disruption' },
  reconnaissance: { text: 'text-deck-recon', bar: 'bg-deck-recon', border: 'border-deck-recon', borderSoft: 'border-deck-recon/60', borderLeft: 'border-l-deck-recon' },
  'priority-assets': { text: 'text-deck-priority', bar: 'bg-deck-priority', border: 'border-deck-priority', borderSoft: 'border-deck-priority/60', borderLeft: 'border-l-deck-priority' },
}

// Detachments carry `disposition` as the deck's display name in caps ("TAKE AND HOLD"),
// not the slug `DECK_COLORS` is keyed by ("take-and-hold") — this bridges the two so a
// detachment's Force Disposition badge can use the same per-deck color as the mission
// pages instead of a flat neutral border.
export function dispositionDeckSlug(disposition: string): string {
  return disposition.trim().toLowerCase().replace(/\s+/g, '-')
}
