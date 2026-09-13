import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, register } from '@/store/authThunks'
import { selectAuthStatus, selectAuthError } from '@/store/authSlice'
import { ROUTES } from '@/core/constants/routes'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const status = useAppSelector(selectAuthStatus)
  const error = useAppSelector(selectAuthError)
  const submitting = status === 'loading'
  const justReset = searchParams.get('reset') === 'ok'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = await dispatch(
      mode === 'login'
        ? login({ username: username.trim(), password })
        : register({ username: username.trim(), email: email.trim(), password }),
    ).unwrap()
    if (ok) {
      const next = searchParams.get('next')
      navigate(next && next.startsWith('/') ? next : ROUTES.ROSTER)
    }
  }

  const canSubmit =
    username.trim() !== '' && password !== '' && (mode === 'login' || email.trim() !== '')

  return (
    <div className="max-w-sm mx-auto px-4 py-10">
      <div className="h-1 bg-crimson mb-2" />
      <h1 className="text-[16px] font-display uppercase tracking-[3px] text-parchment mb-1">
        {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
      </h1>
      <p className="text-[11px] font-mono text-parchment-dim mb-6">
        Las listas de ejército se guardan en tu cuenta.
      </p>

      {justReset && mode === 'login' && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-parchment mb-4">
          Contraseña actualizada. Iniciá sesión con la nueva.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim block mb-1">
            Usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full bg-surface-3 border border-rim-bright text-parchment text-[13px] font-mono px-3 py-2 focus:outline-none focus:border-crimson-bright"
          />
        </div>

        {mode === 'register' && (
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
        )}

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim">
              Contraseña
            </label>
            {mode === 'login' && (
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
          disabled={submitting || !canSubmit}
          className="text-[12px] font-mono uppercase tracking-widest px-4 py-2.5 border border-crimson-bright text-parchment hover:bg-crimson/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Crear Cuenta'}
        </button>
      </form>

      <button
        onClick={() => setMode(m => (m === 'login' ? 'register' : 'login'))}
        className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim hover:text-parchment mt-4"
      >
        {mode === 'login' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Iniciar sesión'}
      </button>
    </div>
  )
}
