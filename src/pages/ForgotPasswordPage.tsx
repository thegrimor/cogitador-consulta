import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '@/infrastructure/api/client'
import { ROUTES } from '@/core/constants/routes'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const submitting = status === 'loading'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      await api.forgotPassword(email.trim())
      // The backend always answers the same way whether or not the email matched an
      // account — see server/src/routes/auth.js — so this success state is unconditional.
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err instanceof ApiError ? err.message : 'No se pudo procesar la solicitud.')
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-10">
      <div className="h-1 bg-crimson mb-2" />
      <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment mb-1">
        Recuperar Contraseña
      </h1>
      <p className="text-[11px] font-mono text-parchment-dim mb-6">
        Ingresá el email de tu cuenta y te enviaremos un enlace para elegir una nueva
        contraseña.
      </p>

      {status === 'sent' ? (
        <p className="text-[11px] font-mono text-parchment leading-relaxed">
          Si existe una cuenta con ese email, vas a recibir un enlace de recuperación en breve.
          Revisá también la carpeta de spam.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 focus:outline-none focus:border-crimson-bright"
            />
          </div>

          {error && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-crimson-bright">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || email.trim() === ''}
            className="text-[12px] font-mono uppercase tracking-widest px-4 py-2.5 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando…' : 'Enviar Enlace'}
          </button>
        </form>
      )}

      <Link
        to={ROUTES.LOGIN}
        className="block text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mt-4"
      >
        Volver a Iniciar Sesión
      </Link>
    </div>
  )
}
