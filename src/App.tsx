import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { GameDataProvider } from '@/infrastructure/data/GameDataContext'
import { AppShell } from '@/shared/components/AppShell'
import { CatalogPage } from '@/pages/CatalogPage'
import { FactionPage } from '@/pages/FactionPage'
import { DatasheetDetailPage } from '@/pages/DatasheetDetailPage'
import { DetachmentDetailPage } from '@/pages/DetachmentDetailPage'
import { FactionDatasheetsPage } from '@/pages/FactionDatasheetsPage'
import { FactionDetachmentsPage } from '@/pages/FactionDetachmentsPage'
import { FactionArmyRulesPage } from '@/pages/FactionArmyRulesPage'
import { RosterListPage } from '@/pages/RosterListPage'
import { CoreRulesPage } from '@/pages/CoreRulesPage'
import { PhasesListPage } from '@/pages/PhasesListPage'
import { PhaseDetailPage } from '@/pages/PhaseDetailPage'

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
          { path: 'factions/:factionId/datasheets', element: <FactionDatasheetsPage /> },
          { path: 'factions/:factionId/detachments', element: <FactionDetachmentsPage /> },
          { path: 'factions/:factionId/army-rules', element: <FactionArmyRulesPage /> },
          { path: 'datasheets/:datasheetId', element: <DatasheetDetailPage /> },
          { path: 'detachments/:detachmentId', element: <DetachmentDetailPage /> },
        ],
      },
      {
        path: 'core-rules',
        children: [
          { index: true, element: <CoreRulesPage /> },
          { path: 'phases', element: <PhasesListPage /> },
          { path: 'phases/:phaseId', element: <PhaseDetailPage /> },
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
