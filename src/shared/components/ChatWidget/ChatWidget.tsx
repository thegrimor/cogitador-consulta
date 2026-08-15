import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useChatStream } from './useChatStream'

/** Global floating rules-assistant widget, mounted once in AppShell so it's reachable from
 * every page. Talks to POST /api/chat (public, no login required — see server/src/routes/chat.js)
 * which grounds its answers in the same public/data/*.json the rest of the app reads, via
 * tool use, rather than answering from the model's own memory of the rules. */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, isStreaming, error, send, reset } = useChatStream()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    send(input)
    setInput('')
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="w-[min(92vw,384px)] h-[min(70vh,560px)] flex flex-col border border-rim-bright bg-surface-2 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-rim-bright bg-surface-3 shrink-0">
            <span className="font-display text-[11px] uppercase tracking-widest text-gold select-none">
              Grimor Inferior
            </span>
            <div className="flex items-center gap-3">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="font-display text-[10px] uppercase tracking-widest text-parchment-dim hover:text-crimson-bright transition-colors"
                  title="Nueva conversación"
                >
                  Reiniciar
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[13px] font-mono text-parchment-dim hover:text-crimson-bright transition-colors leading-none"
                aria-label="Cerrar asistente"
              >
                ✕
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="text-[11px] font-mono text-parchment-dim leading-relaxed">
                Pregúntame por unidades, estratagemas, mejoras, reglas del reglamento o misiones.
                Consulto el catálogo en vivo — no invento datos.
              </p>
            )}
            {messages.map((message, i) => {
              const isLastAssistant = message.role === 'assistant' && i === messages.length - 1
              return (
                <div
                  key={i}
                  className={`text-[11px] font-mono leading-relaxed whitespace-pre-wrap px-2.5 py-1.5 max-w-[90%] ${
                    message.role === 'user'
                      ? 'self-end bg-crimson/15 border border-crimson-bright text-parchment'
                      : 'self-start bg-surface-1 border border-rim-bright text-parchment'
                  }`}
                >
                  {message.content}
                  {isLastAssistant && isStreaming && (
                    <span className="inline-block w-1.5 h-3 ml-0.5 bg-crimson-bright align-middle animate-pulse" />
                  )}
                </div>
              )
            })}
            {error && (
              <p className="text-[11px] font-mono text-crimson-bright border border-crimson-bright px-2.5 py-1.5">
                {error}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-stretch border-t border-rim-bright shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              disabled={isStreaming}
              className="flex-1 min-w-0 bg-surface-1 px-2.5 py-2 text-[11px] font-mono text-parchment placeholder:text-parchment-dim outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="px-3 shrink-0 font-display text-[10px] uppercase tracking-widest text-parchment-dim hover:text-gold disabled:opacity-40 disabled:hover:text-parchment-dim transition-colors"
            >
              {isStreaming ? '···' : 'Enviar'}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center justify-center w-11 h-11 border border-rim-bright bg-surface-2 hover:border-gold transition-colors shadow-lg"
        title="Grimor Inferior"
        aria-label={isOpen ? 'Cerrar el Grimor Inferior' : 'Abrir el Grimor Inferior'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <span className="text-crimson-bright text-base select-none">✕</span>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-crimson-bright" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3 5.5v1.5h10V9.5H7Zm0 3.5v1.5h7V13H7Z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
