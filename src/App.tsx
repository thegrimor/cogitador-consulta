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
import { RosterNewPage } from '@/pages/RosterNewPage'
import { RosterEditPage } from '@/pages/RosterEditPage'
import { CoreRulesPage } from '@/pages/CoreRulesPage'
import { PhasesListPage } from '@/pages/PhasesListPage'
import { PhaseDetailPage } from '@/pages/PhaseDetailPage'
import { MissionsPrimaryListPage } from '@/pages/MissionsPrimaryListPage'
import { MissionsSecondaryListPage } from '@/pages/MissionsSecondaryListPage'
import { MissionPrimaryDetailPage } from '@/pages/MissionPrimaryDetailPage'
import { MissionSecondaryDetailPage } from '@/pages/MissionSecondaryDetailPage'
import { MissionMatcherPage } from '@/pages/MissionMatcherPage'
import { MathhammerPage } from '@/pages/MathhammerPage'
import { BattleListPage } from '@/pages/BattleListPage'
import { BattleNewPage } from '@/pages/BattleNewPage'
import { BattleScorePage } from '@/pages/BattleScorePage'

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
        path: 'missions',
        children: [
          { path: 'primary', element: <MissionsPrimaryListPage /> },
          { path: 'primary/:cardId', element: <MissionPrimaryDetailPage /> },
          { path: 'secondary', element: <MissionsSecondaryListPage /> },
          { path: 'secondary/:cardId', element: <MissionSecondaryDetailPage /> },
          { path: 'matcher', element: <MissionMatcherPage /> },
        ],
      },
      {
        path: 'roster',
        children: [
          { index: true, element: <RosterListPage /> },
          { path: 'new', element: <RosterNewPage /> },
          { path: ':rosterId', element: <RosterEditPage /> },
        ],
      },
      { path: 'mathhammer', element: <MathhammerPage /> },
      {
        path: 'battles',
        children: [
          { index: true, element: <BattleListPage /> },
          { path: 'new', element: <BattleNewPage /> },
          { path: ':battleId', element: <BattleScorePage /> },
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
