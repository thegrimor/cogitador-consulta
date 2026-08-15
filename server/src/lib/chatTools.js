// Tool definitions + dispatcher for the /api/chat rules assistant (routes/chat.js). Each tool
// is a thin wrapper over gameDataIndex.js that formats the result as plain text for the model
// — the model never sees raw game-data JSON, only these formatted summaries, which keeps
// responses grounded in public/data instead of the model's training-data memory of the rules.
import {
  listFactions,
  searchDatasheets,
  getDatasheet,
  getDetachments,
  getStratagems,
  getEnhancements,
  getArmyRules,
  getCoreStratagems,
  searchCoreRules,
  listPhases,
  getPhase,
  searchMissions,
} from './gameDataIndex.js'
import { stripHtml } from './textUtils.js'

// Some factions (Space Marines especially, with 50+ chapter-specific detachments) have enough
// detachments/stratagems/enhancements that formatting *all* of them in one tool result would be
// tens of thousands of tokens — cap each list-returning tool at a character budget and tell the
// model how to narrow the query (by detachmentId) instead of silently truncating with no signal.
const MAX_TOOL_RESULT_CHARS = 12000

function joinCapped(items, formatter, hint) {
  const chunks = []
  let used = 0
  for (const item of items) {
    const text = formatter(item)
    if (used + text.length > MAX_TOOL_RESULT_CHARS && chunks.length > 0) break
    chunks.push(text)
    used += text.length + 2
  }
  let result = chunks.join('\n\n')
  if (chunks.length < items.length) {
    result += `\n\n[Mostrando ${chunks.length} de ${items.length} — el resto no cabe en una sola consulta.${hint ? ` ${hint}` : ''}]`
  }
  return result
}

function formatWeapon(w) {
  const rules = w.rules ?? {}
  const flags = Object.entries(rules)
    .filter(([key, value]) => key.startsWith('is') && value === true)
    .map(([key]) => key.slice(2))
  const extras = []
  if (rules.antiEntries?.length) {
    extras.push(...rules.antiEntries.map(a => `Anti-${a.keyword} ${a.threshold}+`))
  }
  if (rules.meltaValue) extras.push(`Melta ${rules.meltaValue}`)
  if (rules.cleaveValue) extras.push(`Cleave -${rules.cleaveValue}`)
  if (rules.sustainedHitsValue) extras.push(`Sustained Hits ${rules.sustainedHitsValue}`)
  if (rules.rapidFireValue) extras.push(`Rapid Fire ${rules.rapidFireValue}`)
  const ruleText = [...flags, ...extras].join(', ')
  return `- ${w.name} [${w.type}] Rango ${w.range}, A${w.A}, HP/HA${w.bsWs}, F${w.S}, PA${w.AP}, D${w.D}${ruleText ? ` — ${ruleText}` : ''}`
}

function formatDatasheet(ds) {
  const lines = [`${ds.name} — ${ds.factionName} (${ds.role})`]
  if (ds.keywords?.length) lines.push(`Palabras clave: ${ds.keywords.join(', ')}`)
  if (ds.factionKeywords?.length) lines.push(`Palabras clave de facción: ${ds.factionKeywords.join(', ')}`)

  lines.push('', 'Perfiles:')
  for (const m of ds.models ?? []) {
    lines.push(`- ${m.name}: M${m.M} T${m.T} Sv${m.Sv} SvInv${m.invSv} H${m.W} Ld${m.Ld} OC${m.OC}`)
  }

  if (ds.loadout) lines.push('', stripHtml(ds.loadout))

  if (ds.weapons?.length) {
    lines.push('', 'Armamento:')
    for (const w of ds.weapons) lines.push(formatWeapon(w))
  }

  if (ds.abilities?.length) {
    lines.push('', 'Habilidades:')
    for (const a of ds.abilities) lines.push(`- ${a.name}: ${stripHtml(a.description)}`)
  }

  if (ds.options?.length) {
    lines.push('', 'Opciones de equipo:')
    for (const o of ds.options) lines.push(`- ${stripHtml(o.description)}`)
  }

  if (ds.pointsCosts?.length) {
    lines.push('', 'Coste en puntos:')
    for (const p of ds.pointsCosts) lines.push(`- ${p.description}: ${p.points} pts`)
  }

  if (ds.wargearCosts?.length) {
    lines.push('', 'Sobrecoste de armamento:')
    for (const w of ds.wargearCosts) lines.push(`- ${w.name}: +${w.points} pts`)
  }

  if (ds.canBeLedBy?.length) lines.push('', `Puede ser liderada por: ${ds.canBeLedBy.join(', ')}`)

  if (ds.damagedDescription) {
    lines.push('', `Dañada (≤${ds.damagedW} Heridas restantes): ${stripHtml(ds.damagedDescription)}`)
  }

  return lines.join('\n')
}

function formatStratagem(s) {
  return (
    `${s.name} [${s.type}, ${s.cpCost} PE] — destacamento: ${s.detachmentId}, ` +
    `turno: ${s.turn}, fase: ${s.phase}\n${stripHtml(s.description)}`
  )
}

function formatEnhancement(e) {
  return `${e.name} (+${e.cost} pts) — destacamento: ${e.detachmentName}\n${stripHtml(e.description)}`
}

function formatAbility(a) {
  return `${a.name}: ${stripHtml(a.description)}`
}

function formatPhase(p) {
  const lines = [`${p.ref} ${p.name} (${p.group})`, p.summary, '']
  for (const s of p.subsections) lines.push(`${s.ref} ${s.name}: ${stripHtml(s.description)}`)
  return lines.join('\n')
}

export const chatTools = [
  {
    name: 'list_factions',
    description:
      'Lista todas las facciones disponibles (id y nombre). Úsala para obtener el factionId ' +
      'exacto antes de llamar a otras herramientas que lo requieren.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'search_datasheets',
    description:
      'Busca datasheets (unidades) por nombre, en una facción concreta o en todas. Devuelve una ' +
      'lista corta de coincidencias con su id exacto — usa ese id con get_datasheet para ver el ' +
      'perfil completo (estadísticas, armamento, habilidades, puntos).',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Texto a buscar en el nombre de la unidad, p. ej. "Guilliman" o "Tactical Squad".',
        },
        factionId: {
          type: 'string',
          description: 'Opcional: id de facción para limitar la búsqueda (ver list_factions).',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_datasheet',
    description:
      'Devuelve el perfil completo de una datasheet (unidad): estadísticas de modelo, armamento ' +
      'con todas sus reglas, habilidades, opciones de equipo, coste en puntos y quién puede ' +
      'liderarla. Requiere el id exacto (obtenlo primero con search_datasheets).',
    input_schema: {
      type: 'object',
      properties: {
        datasheetId: { type: 'string', description: 'Id exacto de la datasheet.' },
      },
      required: ['datasheetId'],
    },
  },
  {
    name: 'get_detachments',
    description: 'Lista los destacamentos de una facción, con sus habilidades de destacamento.',
    input_schema: {
      type: 'object',
      properties: {
        factionId: { type: 'string', description: 'Id de facción (ver list_factions).' },
      },
      required: ['factionId'],
    },
  },
  {
    name: 'get_stratagems',
    description:
      'Lista los estratagemas de una facción, opcionalmente filtrados por destacamento. No ' +
      'incluye los estratagemas núcleo (comunes a cualquier facción) — usa get_core_stratagems ' +
      'para esos.',
    input_schema: {
      type: 'object',
      properties: {
        factionId: { type: 'string' },
        detachmentId: { type: 'string', description: 'Opcional: id de destacamento para filtrar.' },
      },
      required: ['factionId'],
    },
  },
  {
    name: 'get_core_stratagems',
    description:
      'Lista los estratagemas núcleo del reglamento, comunes a cualquier facción y destacamento ' +
      '(p. ej. Contraataque de Mando).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_enhancements',
    description: 'Lista las mejoras (enhancements) de una facción, opcionalmente filtradas por destacamento.',
    input_schema: {
      type: 'object',
      properties: {
        factionId: { type: 'string' },
        detachmentId: { type: 'string', description: 'Opcional.' },
      },
      required: ['factionId'],
    },
  },
  {
    name: 'get_army_rules',
    description:
      'Lista las reglas de ejército (army rules) de una facción, p. ej. "Oath of Moment" para Space Marines.',
    input_schema: {
      type: 'object',
      properties: { factionId: { type: 'string' } },
      required: ['factionId'],
    },
  },
  {
    name: 'search_core_rules',
    description:
      'Busca en el glosario de terminología del reglamento núcleo (conceptos, habilidades de ' +
      'arma/unidad) por nombre o resumen. Es un glosario de qué significa cada término (p. ej. ' +
      '"Sostenido", "Letal", "Cobertura") — no el procedimiento paso a paso de las fases; para eso ' +
      'usa list_phases / get_phase.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'list_phases',
    description:
      'Lista las secciones del reglamento que describen la secuencia de juego paso a paso: la ' +
      'ronda de batalla, las cinco fases del turno (Mando, Movimiento, Disparo, Carga, Combate), ' +
      'terreno, objetivos, momento de uso de estratagemas, vehículos/monstruos, transportes, ' +
      'unidades adjuntas, reservas estratégicas, aeronaves, etc. Devuelve solo id/nombre/resumen — ' +
      'usa get_phase con el id para el procedimiento completo de una sección.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_phase',
    description:
      'Devuelve el procedimiento completo de una sección del reglamento (p. ej. la fase de ' +
      'Disparo), con cada subsección numerada y su texto íntegro — de dónde sale la secuencia ' +
      'exacta de pasos, no un resumen. Acepta el id (de list_phases) o el nombre en inglés tal ' +
      'cual aparece ahí (p. ej. "Shooting Phase").',
    input_schema: {
      type: 'object',
      properties: { phaseId: { type: 'string' } },
      required: ['phaseId'],
    },
  },
  {
    name: 'search_missions',
    description: 'Busca misiones primarias y secundarias por nombre.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
]

export function executeChatTool(name, input) {
  switch (name) {
    case 'list_factions':
      return JSON.stringify(listFactions())

    case 'search_datasheets': {
      const results = searchDatasheets(input.query, input.factionId)
      return results.length ? JSON.stringify(results) : 'Sin coincidencias.'
    }

    case 'get_datasheet': {
      const ds = getDatasheet(input.datasheetId)
      return ds ? formatDatasheet(ds) : `No se encontró ninguna datasheet con id "${input.datasheetId}".`
    }

    case 'get_detachments': {
      const detachments = getDetachments(input.factionId)
      if (!detachments) return `Facción desconocida: "${input.factionId}".`
      if (!detachments.length) return 'Sin destacamentos para esa facción.'
      return joinCapped(
        detachments,
        d =>
          `${d.name} [${d.id}] (${d.disposition}, ${d.dp} PD)\n` +
          d.abilities.map(a => `  - ${formatAbility(a)}`).join('\n'),
        'Pregunta por un destacamento concreto (por nombre) para ver el resto.',
      )
    }

    case 'get_stratagems': {
      const stratagems = getStratagems(input.factionId, input.detachmentId)
      if (!stratagems) return `Facción desconocida: "${input.factionId}".`
      if (!stratagems.length) return 'Sin estratagemas para ese filtro.'
      return joinCapped(
        stratagems,
        formatStratagem,
        'Vuelve a llamar con detachmentId (ver get_detachments) para acotar el resultado.',
      )
    }

    case 'get_core_stratagems':
      return joinCapped(getCoreStratagems(), formatStratagem)

    case 'get_enhancements': {
      const enhancements = getEnhancements(input.factionId, input.detachmentId)
      if (!enhancements) return `Facción desconocida: "${input.factionId}".`
      if (!enhancements.length) return 'Sin mejoras para ese filtro.'
      return joinCapped(
        enhancements,
        formatEnhancement,
        'Vuelve a llamar con detachmentId (ver get_detachments) para acotar el resultado.',
      )
    }

    case 'get_army_rules': {
      const rules = getArmyRules(input.factionId)
      if (!rules) return `Facción desconocida: "${input.factionId}".`
      return rules.map(formatAbility).join('\n\n')
    }

    case 'search_core_rules': {
      const rules = searchCoreRules(input.query)
      return rules.length
        ? rules.map(r => `${r.name} [${r.category}]: ${r.summary}\n${stripHtml(r.description)}`).join('\n\n')
        : 'Sin coincidencias.'
    }

    case 'list_phases':
      return joinCapped(
        listPhases(),
        p => `${p.ref} ${p.name} [${p.id}] (${p.group}): ${p.summary}`,
      )

    case 'get_phase': {
      const phase = getPhase(input.phaseId)
      return phase ? formatPhase(phase) : `No se encontró ninguna fase/sección con id "${input.phaseId}".`
    }

    case 'search_missions': {
      const { primary, secondary } = searchMissions(input.query)
      if (!primary.length && !secondary.length) return 'Sin coincidencias.'
      const lines = [
        ...primary.map(c => `[Misión primaria] ${c.name} (mazo: ${c.deck})`),
        ...secondary.map(c => `[Misión secundaria] ${c.name}`),
      ]
      return lines.join('\n')
    }

    default:
      throw new Error(`Herramienta desconocida: "${name}".`)
  }
}
