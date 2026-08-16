import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { asyncHandler } from '../asyncHandler.js'
import { chatTools, executeChatTool } from '../lib/chatTools.js'

export const chatRouter = Router()

// Constructed lazily (not at module load) so a missing key fails the *first request* with a
// clear 503 instead of crashing the whole process at boot — the rest of the app (auth,
// rosters) works fine without ANTHROPIC_API_KEY set.
const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey }) : null

// For list-building/meta questions (opinion, not catalog fact) — restricted to a small allowlist
// the user chose explicitly, not open web search: goonhammer.com (English tactics/meta site),
// tozudos40k.blogspot.com and listhammer.info (Spanish-language community sites). max_uses caps
// spend per turn — each search/fetch call is billed separately from normal model tokens. No beta
// header needed; these are the current (2026) server-side tool versions, run on Anthropic's
// infrastructure — no client-side fetching or scraping happens in this process.
const ALLOWED_META_DOMAINS = ['goonhammer.com', 'tozudos40k.blogspot.com', 'listhammer.info']
const WEB_TOOLS = [
  { type: 'web_search_20260209', name: 'web_search', max_uses: 3, allowed_domains: ALLOWED_META_DOMAINS },
  { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 3, allowed_domains: ALLOWED_META_DOMAINS },
]

const SYSTEM_PROMPT = `Te llamas "Grimor Inferior" y eres el asistente de reglas de Cogitador \
Consulta, una app de consulta para Warhammer 40.000 (10ª edición) en español. Si te preguntan tu \
nombre, respóndelo tal cual.

Te presentas como un cogitador del Adeptus Mechanicus — un motor de datos, no un chatbot genérico. \
Cuando saludes o te presentes por primera vez, hazlo con un tono breve de terminal/máquina (puedes \
aludir al Omnissiah o a los archivos del catálogo si encaja de forma natural), en la línea de: \
">> ENLACE DE COGITADOR ESTABLECIDO / NODO: GRIMOR INFERIOR — activo". Fuera de esa presentación, \
en las respuestas normales a consultas de reglas sé claro y directo — el tono de máquina es un \
detalle de apertura, no una decoración en cada frase.

Respondes preguntas sobre datasheets (unidades), estratagemas, mejoras (enhancements), el glosario \
del reglamento núcleo, la secuencia de fases de juego y misiones, usando SIEMPRE las herramientas \
disponibles para consultar los datos reales del juego — nunca inventes puntos, perfiles, reglas ni \
texto de estratagemas de memoria, aunque creas conocerlos. Si una búsqueda no encuentra lo que el \
usuario pide, dilo con claridad en vez de adivinar o rellenar con conocimiento previo.

Para preguntas de "qué significa X" usa search_core_rules (glosario de términos); para preguntas de \
"cuándo/en qué orden pasa X" o sobre el procedimiento de una fase concreta (Mando, Movimiento, \
Disparo, Carga, Combate, terreno, objetivos, estratagemas, etc.) usa list_phases / get_phase — son \
fuentes distintas, no te quedes solo con el glosario si te preguntan por el procedimiento.

Cuando el nombre de una unidad o facción sea ambiguo, usa search_datasheets o list_factions primero \
para confirmar el id exacto antes de pedir el detalle. Responde siempre en español, de forma \
directa y concisa, citando el nombre exacto de lo que consultaste.

Para preguntas de formación de listas o meta (qué es fuerte ahora mismo, qué combinaciones \
recomienda la comunidad, etc.) puedes buscar y leer contenido de un grupo reducido de webs \
permitidas: Goonhammer, Tozudos40k y ListHammer. Esto es categóricamente distinto de las \
herramientas de datos del catálogo: es la opinión de terceros sobre el estado del juego, no una \
regla oficial ni un hecho verificable. Cada vez que uses algo sacado de una de estas webs, dilo \
explícitamente ("esto es la opinión de [fuente], no una regla oficial") e incluye el enlace o el \
nombre de la fuente en tu respuesta — nunca presentes una opinión de meta como si fuera un dato \
del catálogo, ni mezcles ambas cosas sin dejar claro cuál es cuál.`

const MAX_TOOL_ITERATIONS = 6

function sseSend(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

// POST /api/chat — { messages: [{ role: 'user' | 'assistant', content: string }] } — streams
// back Server-Sent Events (`text` chunks as they're generated, then `done`, or `error`).
// Public (mounted without requireAuth in index.js): this is a stateless rules lookup — nothing
// here reads or writes a user's account or roster, so there's no reason to gate it behind login.
chatRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!client) {
      res.status(503).json({ error: 'El chat no está disponible: falta ANTHROPIC_API_KEY en el backend.' })
      return
    }

    const { messages } = req.body
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Falta el historial de mensajes.' })
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // The API is stateless — we resend the whole conversation each turn, appending our own
    // assistant replies and tool results as the tool loop below runs.
    const conversation = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
        const stream = client.messages.stream({
          model: 'claude-opus-5',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          thinking: { type: 'adaptive' },
          tools: [...chatTools, ...WEB_TOOLS],
          messages: conversation,
        })

        stream.on('text', delta => sseSend(res, 'text', { delta }))

        const message = await stream.finalMessage()
        conversation.push({ role: 'assistant', content: message.content })

        if (message.stop_reason === 'refusal') {
          sseSend(res, 'error', { message: 'No puedo responder a eso.' })
          break
        }

        // Server-side tools (web_search/web_fetch) run their own internal loop capped at 10
        // iterations; hitting that cap mid-search pauses the turn with no client tool_use
        // pending. Resuming is just re-sending the conversation as-is (already pushed above) —
        // no extra user message — so loop again instead of treating this as a finished answer.
        if (message.stop_reason === 'pause_turn') continue

        const toolUses = message.content.filter(block => block.type === 'tool_use')
        if (toolUses.length === 0) break // plain text answer — done

        const toolResults = toolUses.map(toolUse => {
          try {
            return {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: executeChatTool(toolUse.name, toolUse.input),
            }
          } catch (err) {
            return {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: err instanceof Error ? err.message : String(err),
              is_error: true,
            }
          }
        })
        conversation.push({ role: 'user', content: toolResults })
      }
    } catch (err) {
      console.error('Error en /api/chat:', err)
      sseSend(res, 'error', { message: 'Error al consultar el asistente. Inténtalo de nuevo.' })
    }

    sseSend(res, 'done', {})
    res.end()
  }),
)
