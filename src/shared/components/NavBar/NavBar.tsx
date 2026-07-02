import { NavLink } from 'react-router-dom'

export function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[12px] font-display uppercase tracking-widest px-3 py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
      isActive
        ? 'border-crimson-bright text-parchment'
        : 'border-transparent text-parchment-dim hover:text-parchment hover:border-rim-bright'
    }`

  return (
    <nav className="flex items-center justify-center gap-1 sm:justify-start">
      <NavLink to="/catalog" className={linkClass}>
        Archivo
      </NavLink>
      <NavLink to="/roster" className={linkClass}>
        Ejército
      </NavLink>
      <NavLink to="/mathhammer" className={linkClass}>
        Mathhammer
      </NavLink>
    </nav>
  )
}
