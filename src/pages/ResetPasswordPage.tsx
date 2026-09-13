import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '@/infrastructure/api/client'
import { ROUTES } from '@/core/constants/routes'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const submitting = status === 'loading'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setStatus('error')
      setError('Las contraseñas no coinciden.')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      await api.resetPassword(token, password)
      navigate(`${ROUTES.LOGIN}?reset=ok`)
    } catch (err) {
      setStatus('error')
      setError(err instanceof ApiError ? err.message : 'No se pudo restablecer la contraseña.')
    }
  }

  if (!token) {
    return (
      <div className="max-w-sm mx-auto px-4 py-10">
        <div className="h-1 bg-crimson mb-2" />
        <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment mb-1">
          Enlace Inválido
        </h1>
        <p className="text-[11px] font-mono text-parchment-dim mb-6">
          Este enlace de recuperación no es válido. Pedí uno nuevo.
        </p>
        <Link
          to={ROUTES.FORGOT_PASSWORD}
          className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment"
        >
          Recuperar Contraseña
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-10">
      <div className="h-1 bg-crimson mb-2" />
      <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment mb-1">
        Elegir Nueva Contraseña
      </h1>
      <p className="text-[11px] font-mono text-parchment-dim mb-6">
        Este enlace es válido por 1 hora desde que lo pediste y solo funciona una vez.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim block mb-1">
            Nueva Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 focus:outline-none focus:border-crimson-bright"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim block mb-1">
            Confirmar Contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
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
          disabled={submitting || password === '' || confirmPassword === ''}
          className="text-[12px] font-mono uppercase tracking-widest px-4 py-2.5 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Guardando…' : 'Guardar Contraseña'}
        </button>
      </form>
    </div>
  )
}
