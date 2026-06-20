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
          fill="currentColor"
          fillRule="evenodd"
          className="w-5 h-5 text-crimson-bright shrink-0 select-none"
          aria-label="Cogitador"
        >
          <title>Cogitador</title>
          <path d="M10.55 4.54 10.67 1.89 13.33 1.89 13.45 4.54 14.19 4.72 14.91 4.98 15.6 5.31 16.25 5.7 18.21 3.91 20.09 5.79 18.3 7.75 18.69 8.4 19.02 9.09 19.28 9.81 19.46 10.55 22.11 10.67 22.11 13.33 19.46 13.45 19.28 14.19 19.02 14.91 18.69 15.6 18.3 16.25 20.09 18.21 18.21 20.09 16.25 18.3 15.6 18.69 14.91 19.02 14.19 19.28 13.45 19.46 13.33 22.11 10.67 22.11 10.55 19.46 9.81 19.28 9.09 19.02 8.4 18.69 7.75 18.3 5.79 20.09 3.91 18.21 5.7 16.25 5.31 15.6 4.98 14.91 4.72 14.19 4.54 13.45 1.89 13.33 1.89 10.67 4.54 10.55 4.72 9.81 4.98 9.09 5.31 8.4 5.7 7.75 3.91 5.79 5.79 3.91 7.75 5.7 8.4 5.31 9.09 4.98 9.81 4.72Z M12 9.4 12.67 9.49 13.3 9.75 13.84 10.16 14.25 10.7 14.51 11.33 14.6 12 14.51 12.67 14.25 13.3 13.84 13.84 13.3 14.25 12.67 14.51 12 14.6 11.33 14.51 10.7 14.25 10.16 13.84 9.75 13.3 9.49 12.67 9.4 12 9.49 11.33 9.75 10.7 10.16 10.16 10.7 9.75 11.33 9.49Z" />
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
