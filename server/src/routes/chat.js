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

const SYSTEM_PROMPT = `Te llamas "Grimor Inferior" y eres el asistente de reglas de Cogitador \
Consulta, una app de consulta para Warhammer 40.000 (10ª edición) en español. Si te preguntan tu \
nombre, respóndelo tal cual.

Respondes preguntas sobre datasheets (unidades), estratagemas, mejoras (enhancements), reglas del \
reglamento núcleo y misiones, usando SIEMPRE las herramientas disponibles para consultar los datos \
reales del juego — nunca inventes puntos, perfiles, reglas ni texto de estratagemas de memoria, \
aunque creas conocerlos. Si una búsqueda no encuentra lo que el usuario pide, dilo con claridad en \
vez de adivinar o rellenar con conocimiento previo.

Cuando el nombre de una unidad o facción sea ambiguo, usa search_datasheets o list_factions primero \
para confirmar el id exacto antes de pedir el detalle. Responde siempre en español, de forma \
directa y concisa, citando el nombre exacto de lo que consultaste.`

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
          tools: chatTools,
          messages: conversation,
        })

        stream.on('text', delta => sseSend(res, 'text', { delta }))

        const message = await stream.finalMessage()
        conversation.push({ role: 'assistant', content: message.content })

        if (message.stop_reason === 'refusal') {
          sseSend(res, 'error', { message: 'No puedo responder a eso.' })
          break
        }

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
