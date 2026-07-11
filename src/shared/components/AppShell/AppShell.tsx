import { useEffect, useRef } from 'react'
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
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Header height varies (it wraps to two rows below the `sm` breakpoint), so pages
  // that stick content below it read this instead of hardcoding an offset.
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const setHeight = () =>
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`)
    setHeight()
    const observer = new ResizeObserver(setHeight)
    observer.observe(header)
    return () => observer.disconnect()
  }, [loading])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />

  return (
    <div className="min-h-screen bg-surface-1 text-parchment">
      <header
        ref={headerRef}
        className="sticky top-0 z-20 border-b border-rim-bright bg-surface-2 flex flex-wrap items-center px-4 py-1.5 gap-x-2 gap-y-1 sm:h-10 sm:py-0 sm:gap-x-4"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-crimson-bright shrink-0 select-none"
          aria-label="Cogitador"
        >
          <title>Cogitador</title>
          <defs>
            <mask id="cogitador-skull-mask" maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width="24" height="24" fill="black" />
              <path
                d="M8.7 11.2C8.7 8.7 10.1 7.3 12 7.3C13.9 7.3 15.3 8.7 15.3 11.2C15.3 12.4 14.8 13.3 14.1 13.9L14.1 15.2L9.9 15.2L9.9 13.9C9.2 13.3 8.7 12.4 8.7 11.2Z"
                fill="white"
              />
              <circle cx="10.4" cy="10.6" r="1.15" fill="black" />
              <circle cx="13.6" cy="10.6" r="1.15" fill="black" />
              <path d="M12 11.5L11.45 12.6L12.55 12.6Z" fill="black" />
              <rect x="11" y="13.9" width="0.4" height="1.3" fill="black" />
              <rect x="12.6" y="13.9" width="0.4" height="1.3" fill="black" />
            </mask>
          </defs>
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M10.53 4.44 10.66 1.79 13.34 1.79 13.47 4.44 14.22 4.63 14.95 4.89 15.64 5.22 16.31 5.62 18.27 3.83 20.17 5.73 18.38 7.69 18.78 8.36 19.11 9.05 19.37 9.78 19.56 10.53 22.21 10.66 22.21 13.34 19.56 13.47 19.37 14.22 19.11 14.95 18.78 15.64 18.38 16.31 20.17 18.27 18.27 20.17 16.31 18.38 15.64 18.78 14.95 19.11 14.22 19.37 13.47 19.56 13.34 22.21 10.66 22.21 10.53 19.56 9.78 19.37 9.05 19.11 8.36 18.78 7.69 18.38 5.73 20.17 3.83 18.27 5.62 16.31 5.22 15.64 4.89 14.95 4.63 14.22 4.44 13.47 1.79 13.34 1.79 10.66 4.44 10.53 4.63 9.78 4.89 9.05 5.22 8.36 5.62 7.69 3.83 5.73 5.73 3.83 7.69 5.62 8.36 5.22 9.05 4.89 9.78 4.63ZM12 7.4 13.02 7.52 14 7.86 14.87 8.4 15.6 9.13 16.14 10 16.48 10.98 16.6 12 16.48 13.02 16.14 14 15.6 14.87 14.87 15.6 14 16.14 13.02 16.48 12 16.6 10.98 16.48 10 16.14 9.13 15.6 8.4 14.87 7.86 14 7.52 13.02Z"
          />
          <g mask="url(#cogitador-skull-mask)">
            <rect x="6" y="5" width="12" height="12" fill="currentColor" />
          </g>
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
