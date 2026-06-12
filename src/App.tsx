import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { GameDataProvider } from '@/infrastructure/data/GameDataContext'
import { AppShell } from '@/shared/components/AppShell'
import { CatalogPage } from '@/pages/CatalogPage'
import { FactionPage } from '@/pages/FactionPage'
import { DatasheetDetailPage } from '@/pages/DatasheetDetailPage'
import { RosterListPage } from '@/pages/RosterListPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/catalog" replace /> },
      {
        path: 'catalog',
        children: [
          { index: true, element: <CatalogPage /> },
          { path: 'factions/:factionId', element: <FactionPage /> },
          { path: 'datasheets/:datasheetId', element: <DatasheetDetailPage /> },
        ],
      },
      {
        path: 'roster',
        children: [
          { index: true, element: <RosterListPage /> },
        ],
      },
    ],
  },
])

export function App() {
  return (
    <GameDataProvider>
      <RouterProvider router={router} />
    </GameDataProvider>
  )
}
