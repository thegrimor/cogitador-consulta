import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { resetPassword } from '@/store/authThunks'
import { selectAuthStatus, selectAuthError } from '@/store/authSlice'
import { ROUTES } from '@/core/constants/routes'

const inputClass =
  'w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 focus:outline-none focus:border-crimson-bright'
const labelClass = 'text-[10px] font-mono uppercase tracking-widest text-parchment-dim block mb-1'

export function ForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const status = useAppSelector(selectAuthStatus)
  const authError = useAppSelector(selectAuthError)
  const submitting = status === 'loading'
  const error = localError ?? authError

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden.')
      return
    }
    setLocalError(null)
    const ok = await dispatch(resetPassword({ username: username.trim(), password })).unwrap()
    if (ok) navigate(ROUTES.ROSTER)
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-10">
      <div className="h-1 bg-crimson mb-2" />
      <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment mb-1">
        Recuperar Contraseña
      </h1>
      <p className="text-[11px] font-mono text-parchment-dim mb-6">
        Indica tu usuario y elige una contraseña nueva.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Usuario</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Contraseña nueva</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Repetir contraseña</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        {error && (
          <p className="text-[10px] font-mono uppercase tracking-widest text-crimson-bright">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || username.trim() === '' || password === '' || confirm === ''}
          className="text-[12px] font-mono uppercase tracking-widest px-4 py-2.5 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Procesando…' : 'Cambiar contraseña'}
        </button>
      </form>

      <Link
        to={ROUTES.LOGIN}
        className="block text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mt-4"
      >
        ← Volver a iniciar sesión
      </Link>
    </div>
  )
}
