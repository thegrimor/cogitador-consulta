import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAuthUser } from '@/store/authSlice'
import { logout } from '@/store/authThunks'
import { ROUTES } from '@/core/constants/routes'

export function AccountMenu() {
  const user = useAppSelector(selectAuthUser)
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!user) {
    return (
      <NavLink
        to={ROUTES.LOGIN}
        className="flex items-center gap-1.5 px-2 py-1 border border-rim-bright hover:border-gold transition-colors"
      >
        <span className="font-display text-[11px] uppercase tracking-widest text-parchment-dim select-none">
          Iniciar Sesión
        </span>
      </NavLink>
    )
  }

  const initial = user.username.trim().slice(0, 1).toUpperCase() || '?'

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-1.5 px-1.5 py-1 border border-rim-bright hover:border-gold transition-colors"
        title="Cuenta"
        aria-label="Menú de cuenta"
        aria-expanded={isOpen}
      >
        <span className="flex items-center justify-center w-5 h-5 shrink-0 bg-crimson/20 border border-crimson-bright text-crimson-bright text-[11px] font-display select-none">
          {initial}
        </span>
        <span className="font-mono text-[11px] text-parchment-dim hidden sm:inline select-none max-w-[12ch] truncate">
          {user.username}
        </span>
        <span className="text-[9px] text-parchment-dim hidden sm:inline select-none">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 border border-rim-bright bg-surface-2 z-30 shadow-2xl">
          <p className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-parchment-dim border-b border-rim-bright truncate">
            Conectado como<br />
            <span className="text-[12px] text-parchment normal-case tracking-normal">{user.username}</span>
          </p>
          <button
            onClick={() => {
              setIsOpen(false)
              dispatch(logout())
            }}
            className="w-full text-left px-3 py-2 text-[11px] font-display uppercase tracking-widest text-parchment-dim hover:bg-surface-3 hover:text-crimson-bright transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  )
}
