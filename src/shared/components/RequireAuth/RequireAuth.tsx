import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectAuthToken, selectAuthUser } from '@/store/authSlice'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import { ROUTES } from '@/core/constants/routes'

/** Gates its child routes behind an authenticated session — rosters live server-side per
 * account now, so there's nothing to show here without one. */
export function RequireAuth() {
  const token = useAppSelector(selectAuthToken)
  const user = useAppSelector(selectAuthUser)
  const location = useLocation()

  // A token is persisted but bootstrapAuth() hasn't resolved it yet — wait instead of
  // bouncing to /login and flashing the form before snapping back.
  if (token && !user) return <LoadingScreen />

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`${ROUTES.LOGIN}?next=${next}`} replace />
  }

  return <Outlet />
}
