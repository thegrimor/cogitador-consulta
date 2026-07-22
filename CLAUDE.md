# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Maintenance rule

**Update this file as part of the task, not after.** When a task adds a route, a data file, a store slice, or changes an architectural pattern described below, update the relevant section in the same change. Stale docs here have previously caused wrong assumptions about what's implemented — don't let this file drift from the code again.

## Commands

```bash
npm run dev           # Dev server (Vite HMR)
npm run build         # tsc -b && vite build
npm run lint          # ESLint
npm run preview       # Preview production build
npm run scrape:mfm    # Re-scrape Munitorum Field Manual points (scripts/scrape-mfm.mjs)
npm run update:costs  # Refresh unit/wargear costs (scripts/update-costs.mjs)
```

No test suite yet.

## Architecture

**Warhammer 40K 10th edition data consultation app + army builder.** Phase 1 (catalog) and Phase 2 (army builder/roster) are both complete and in active use.

### Data layer

All game data lives in `/public/data/*.csv` (pipe-delimited), sourced from Wahapedia (`public/data/wahapedia.js` re-downloads them from `wahapedia.ru`). `src/infrastructure/data/useGameData.ts` loads all files in parallel with PapaParse, parses them into domain types, and exposes them via `GameDataContext`. Every page reads catalog data through `useGameDataContext()`.

CSV files (`CSV_FILES` in `useGameData.ts`): `Factions`, `Datasheets`, `Datasheets_models`, `Datasheets_wargear`, `Datasheets_abilities`, `Abilities`, `Detachments`, `Detachments_chapters`, `Detachment_abilities`, `Stratagems`, `Datasheets_stratagems`, `Datasheets_keywords`, `Datasheets_unit_composition`, `Datasheets_models_cost`, `Datasheets_wargear_cost`, `Datasheets_leader`, `Enhancements`, `Datasheets_enhancements`, `Datasheets_options`, `Datasheets_detachment_abilities`, `Source`, `Last_update`, `CoreRules`. Also `public/data/missions.json` for mission cards.

All domain types are in `src/types/index.ts`. Raw CSV row types (`Raw*`) and clean domain types are both defined there.

### Roster/army builder state (Redux)

`src/store/index.ts` configures a Redux store (RTK) with a single `roster` slice (`src/store/rosterSlice.ts`). State is persisted to `localStorage` (key `cogitador-consulta-rosters`) via a subscribe callback in `store/index.ts` — not the generic `useLocalStorage` hook. `App` is wrapped in `<Provider store={store}>`. Roster pages read/write through `store/hooks.ts` (typed `useAppDispatch`/`useAppSelector`).

Implemented: create/edit/list rosters with points limits, detachment selection (with Detachment Points cost), enhancements, wargear-option legality enforcement and per-weapon surcharges, multi-tier unit costs, leader attachment, allies for Imperium factions, and import/export in Munitorum text format plus QR (scan or photo upload).

### Theme system

25+ faction themes defined in `src/themes/themes.ts`. Each theme is a set of CSS custom property values. `useTheme` (in `src/shared/hooks/useTheme.ts`) writes them to `data-theme` on `<html>`, which activates overrides defined in `src/index.css` under `[data-theme="<id>"]` blocks. Colors referenced in Tailwind classes (`bg-crimson`, `text-parchment-dim`, etc.) are CSS variables defined in `@theme` in `index.css` — they update automatically when the theme changes. Persisted to localStorage.

### Routing

Routes defined in `src/core/constants/routes.ts` (`ROUTES` + helper functions like `factionPath`, `datasheetPath`, `rosterEditPath`, `mathhammerAttackerPath`). Router tree configured in `src/App.tsx`.

```
/catalog                                  → CatalogPage              (faction grid)
/catalog/factions/:factionId              → FactionPage              (unit list for a faction)
/catalog/factions/:factionId/datasheets   → FactionDatasheetsPage
/catalog/factions/:factionId/detachments  → FactionDetachmentsPage
/catalog/factions/:factionId/army-rules   → FactionArmyRulesPage
/catalog/datasheets/:datasheetId          → DatasheetDetailPage      (full GW-style sheet)
/catalog/detachments/:detachmentId        → DetachmentDetailPage
/core-rules                               → CoreRulesPage
/core-rules/phases                        → PhasesListPage
/core-rules/phases/:phaseId               → PhaseDetailPage
/missions/primary(/:cardId)               → MissionsPrimaryListPage / MissionPrimaryDetailPage
/missions/secondary(/:cardId)             → MissionsSecondaryListPage / MissionSecondaryDetailPage
/missions/matcher                         → MissionMatcherPage
/roster                                   → RosterListPage           (list + import)
/roster/new                               → RosterNewPage
/roster/:rosterId                         → RosterEditPage           (roster builder)
/mathhammer                               → MathhammerPage           (combat simulator)
```

### Visual style

The UI imitates the official GW Warhammer app: faction color bar in headers (`bg-crimson`), stat boxes, weapon tables (`<table>` not cards), abilities as `Name: description`, keywords at the bottom. Typography uses `font-display` (Orbitron) for headers and `font-mono` (Share Tech Mono) for data. Sizes are mostly `text-[8px]`–`text-[10px]` with `uppercase tracking-widest`.

### Shared components

- `RuleTooltip` — wraps any rule badge; shows description on hover. Feed it `getRuleDescription(name)` from `src/core/constants/weaponRules.ts`.
- `StatsBar`, `WeaponCard`, `AbilityList`, `StratList` — older components kept for potential reuse; `DatasheetDetailPage` renders its own tables directly to match GW layout.

### Data update scripts (`/scripts`)

- `wahapedia.js` (in `public/data/`) — re-downloads all Wahapedia CSVs.
- `scrape-mfm.mjs` — scrapes the Munitorum Field Manual (points values) from `mfm.warhammer-community.com`; writes `scripts/mfm-data.json`.
- `scrape-mission-actions.mjs`, `sync-enhancement-costs.mjs`, `update-costs.mjs`, `update-detachments.mjs`, `update-wargear-costs.mjs` — assorted data-sync helpers layered on top of the raw Wahapedia export.
