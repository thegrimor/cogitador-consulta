import { Outlet } from 'react-router-dom'
import { NavBar } from '@/shared/components/NavBar'
import { ThemePicker } from '@/shared/components/ThemePicker'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import { ErrorScreen } from '@/shared/components/ErrorScreen'
import { useTheme } from '@/shared/hooks/useTheme'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'

export function AppShell() {
  const [currentTheme, setTheme, themes] = useTheme()
  const { loading, error } = useGameDataContext()

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />

  return (
    <div className="min-h-screen bg-surface-1 text-parchment">
      <header className="sticky top-0 z-20 border-b border-rim-bright bg-surface-2 flex flex-wrap items-center px-4 py-1.5 gap-x-2 gap-y-1 sm:h-10 sm:py-0 sm:gap-x-4">
        <span className="text-[12px] font-display uppercase tracking-[3px] text-crimson-bright shrink-0 select-none">
          Cogitador
        </span>
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
