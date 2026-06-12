// Glosario de reglas especiales de armas y tipos de arma — Warhammer 40K 10ª edición
export const WEAPON_RULES: Record<string, string> = {
  // ── Tipos de arma ────────────────────────────────────────────────────────────
  'Assault': 'Puedes disparar con esta arma incluso si tu unidad avanzó este turno. Si lo haces, resta 1 a las tiradas de impacto.',
  'Heavy': 'Si el portador de esta arma no se movió este turno, mejora su Habilidad con Armas de Fuego en 1 al realizar ataques con ella.',
  'Pistol': 'Puedes disparar con esta arma contra unidades enemigas a 1" de unidades amigas tuyas. Si lo haces, solo puedes seleccionar como objetivo la unidad enemiga más cercana, aunque hay excepciones.',
  'Rapid Fire': 'Antes de realizar tiradas de impacto, si el objetivo está dentro de la mitad del alcance de esta arma, su Habilidad con Armas de Fuego mejora en 1 y esta arma inflige un número doble de ataques.',
  'Torrent': 'Esta arma impacta automáticamente. No realices tiradas de impacto.',
  'Indirect Fire': 'Puedes realizar ataques con esta arma contra unidades objetivo no visibles para el portador. Si lo haces, resta 1 a las tiradas de impacto.',
  'Psychic': 'Esta arma es psíquica. Si el portador no tiene la habilidad de Adepto Psíquico, resta 1 a las tiradas de impacto al realizar ataques con esta arma.',

  // ── Reglas especiales de armas ───────────────────────────────────────────────
  'Blast': 'El número de ataques de esta arma se cuenta de forma especial: si la unidad objetivo tiene entre 6 y 10 modelos, suma 1 al número de ataques; si tiene 11 o más modelos, suma D3 al número de ataques.',
  'Devastating Wounds': 'Si una tirada de herida para un ataque con esta arma es un 6 sin modificar, ese ataque inflige un número de Heridas Mortales igual a su característica de Daño, y el ataque finaliza (no se realizan tiradas de salvación normales ni de invulnerabilidad).',
  'Lethal Hits': 'Los impactos críticos de esta arma hieren automáticamente al objetivo.',
  'Melta': 'Si el objetivo está dentro de la mitad del alcance de esta arma, suma el valor indicado (ej. Melta 2) a la característica de Daño.',
  'Sustained Hits': 'Cada impacto crítico realizado con esta arma genera un número adicional de impactos igual al valor indicado.',
  'Twin-linked': 'Cuando realices tiradas de herida con esta arma, puedes repetir las tiradas de herida.',
  'Anti': 'Si el objetivo tiene la Palabra Clave indicada, los ataques con esta arma hieren críticamente con la tirada de herida mínima indicada (ej. Anti-Infantería 4+ hiere críticamente con 4+).',
  'Precision': 'Si un ataque con esta arma impacta críticamente, puedes elegir a qué modelo de la unidad objetivo se aplica el ataque (en lugar de al modelo más cercano).',
  'Ignores Cover': 'Las tiradas de salvación realizadas para ataques con esta arma no pueden beneficiarse de las bonificaciones de cobertura.',
  'Lance': 'Si el portador realizó una carga este turno, mejora la Penetración de Armadura de esta arma en 1 al realizar ataques.',
  'Cumbersome': 'Si el portador avanzó o realizó una carga este turno, no puede realizar ataques con esta arma.',
  'Hazardous': 'Después de que una unidad resuelva todos sus ataques con armas peligrosas, tira 1D6 por cada arma peligrosa que haya disparado. Por cada resultado de 1, esa unidad sufre 1 Herida Mortal.',
  'One Shot': 'El portador solo puede realizar 1 ataque con esta arma por partida, independientemente de cuántos disparos pueda realizar normalmente.',
  'Extra Attacks': 'Los ataques con esta arma se realizan además de los ataques normales del portador.',
  'Devastating': 'Si una tirada de herida no modificada de 6 se obtiene para un ataque con esta arma, ese ataque inflige un número de Heridas Mortales.',
}

// Alias para versiones numéricas (Rapid Fire 2, Melta 2, Sustained Hits 2, Anti-X 4+…)
export function getRuleDescription(ruleName: string): string | undefined {
  // Buscar coincidencia exacta
  if (WEAPON_RULES[ruleName]) return WEAPON_RULES[ruleName]

  // Coincidencia por prefijo para reglas con valor numérico
  for (const key of Object.keys(WEAPON_RULES)) {
    if (ruleName.startsWith(key)) return WEAPON_RULES[key]
  }

  return undefined
}
