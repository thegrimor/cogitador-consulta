export function mdBoldToHtml(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
}

export function cleanMissionHtml(html: string): string {
  return html.replace(/\sclass="cB__(?:mark|wmWord)"(?:\s+data-n="\d+")?/g, '')
}

export function missionSlug(url: string): string {
  return url.split('/').filter(Boolean).pop() ?? ''
}
