import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NavBar } from '@/shared/components/NavBar'
import { ThemePicker } from '@/shared/components/ThemePicker'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import { ErrorScreen } from '@/shared/components/ErrorScreen'
import { useTheme } from '@/shared/hooks/useTheme'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'

export function AppShell() {
  const [currentTheme, setTheme, themes] = useTheme()
  const { loading, error } = useGameDataContext()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />

  return (
    <div className="min-h-screen bg-surface-1 text-parchment">
      <header className="sticky top-0 z-20 border-b border-rim-bright bg-surface-2 flex flex-wrap items-center px-4 py-1.5 gap-x-2 gap-y-1 sm:h-10 sm:py-0 sm:gap-x-4">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-crimson-bright shrink-0 select-none"
          aria-label="Cogitador"
        >
          <title>Cogitador</title>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:min-w-0">
          <NavBar />
        </div>
        <div className="ml-auto shrink-0 sm:ml-0">
          <ThemePicker currentTheme={currentTheme} themes={themes} onSelect={setTheme} />
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
