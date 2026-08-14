import { useCallback, useRef, useState } from 'react'
import { API_BASE_URL } from '@/infrastructure/api/client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Parses one complete SSE frame ("event: x\ndata: {...}") into its two fields. Frames the
 * backend never sends fields it doesn't need on are silently skipped. */
function parseSseFrame(frame: string): { event: string; data: unknown } | null {
  const eventLine = frame.split('\n').find(line => line.startsWith('event: '))
  const dataLine = frame.split('\n').find(line => line.startsWith('data: '))
  if (!eventLine || !dataLine) return null
  return { event: eventLine.slice('event: '.length), data: JSON.parse(dataLine.slice('data: '.length)) }
}

/** Drives POST /api/chat's Server-Sent Events stream (server/src/routes/chat.js) — plain
 * `fetch` + manual SSE framing rather than `EventSource`, since EventSource can't send a POST
 * body (the conversation history). Conversation lives only in this hook's state — nothing is
 * persisted, same as the backend route, which is intentionally stateless/anonymous. */
export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      setError(null)
      const history = [...messages, { role: 'user' as const, content: trimmed }]
      setMessages([...history, { role: 'assistant', content: '' }])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? `Error ${res.status} al conectar con el asistente.`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let frameEnd
          while ((frameEnd = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, frameEnd)
            buffer = buffer.slice(frameEnd + 2)
            const parsed = parseSseFrame(frame)
            if (!parsed) continue

            if (parsed.event === 'text') {
              const { delta } = parsed.data as { delta: string }
              setMessages(prev => {
                const next = [...prev]
                const last = next[next.length - 1]
                next[next.length - 1] = { ...last, content: last.content + delta }
                return next
              })
            } else if (parsed.event === 'error') {
              setError((parsed.data as { message: string }).message)
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Error al conectar con el asistente.')
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages, isStreaming],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, error, send, reset }
}
