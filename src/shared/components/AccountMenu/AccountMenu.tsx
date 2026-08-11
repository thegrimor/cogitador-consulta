import { NavLink } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAuthUser } from '@/store/authSlice'
import { logout } from '@/store/authThunks'
import { ROUTES } from '@/core/constants/routes'

export function AccountMenu() {
  const user = useAppSelector(selectAuthUser)
  const dispatch = useAppDispatch()

  if (!user) {
    return (
      <NavLink
        to={ROUTES.LOGIN}
        className="text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border border-rim-bright text-parchment-dim hover:text-parchment transition-colors whitespace-nowrap"
      >
        Iniciar Sesión
      </NavLink>
    )
  }

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-[11px] font-mono uppercase tracking-widest text-parchment-dim">
        {user.username}
      </span>
      <button
        onClick={() => dispatch(logout())}
        className="text-[11px] font-mono uppercase tracking-widest px-2 py-1 text-parchment-dim hover:text-crimson-bright transition-colors"
      >
        Salir
      </button>
    </div>
  )
}
