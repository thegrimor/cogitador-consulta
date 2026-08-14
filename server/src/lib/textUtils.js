// Ability/stratagem/enhancement descriptions in the data files carry GW's original HTML
// markup (<span class="kwb">, <br>, <ul><li>, <b>, <i>) — fine for the frontend's dangerouslySet
// rendering, but noisy and token-expensive to hand the model raw. Flatten to plain text with
// just enough structure (newlines for <br>/<li>) that Claude can still read it as prose.
export function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<li>/gi, '\n• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ̀-ͯ is the combining-diacritics block Unicode NFD decomposition produces
// (á -> a + combining acute) — stripping it gives an accent-insensitive compare so "guiliman"
// / "guilliman" and "espiritu"/"espíritu" match regardless of how the user typed it.
export function normalize(s) {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
