# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (Vite HMR)
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

No test suite yet.

## Architecture

**Warhammer 40K 10th edition data consultation app.** Phase 1 (catalog) is complete; Phase 2 (army builder) is next.

### Data layer

All game data lives in `/public/data/*.csv` (pipe-delimited). `src/infrastructure/data/useGameData.ts` loads all 12 files in parallel with PapaParse, parses them into domain types, and exposes them via `GameDataContext`. Every page reads data exclusively through `useGameDataContext()` — there is no Redux store yet (Phase 2 will add one for rosters).

CSV files: `Factions`, `Datasheets`, `Datasheets_models`, `Datasheets_wargear`, `Datasheets_abilities`, `Abilities`, `Detachments`, `Detachment_abilities`, `Stratagems`, `Datasheets_stratagems`, `Datasheets_keywords`, `Datasheets_unit_composition`.

All domain types are in `src/types/index.ts`. Raw CSV row types (`Raw*`) and clean domain types are both defined there.

### Theme system

25+ faction themes defined in `src/themes/themes.ts`. Each theme is a set of CSS custom property values. `useTheme` (in `src/shared/hooks/useTheme.ts`) writes them to `data-theme` on `<html>`, which activates overrides defined in `src/index.css` under `[data-theme="<id>"]` blocks. Colors referenced in Tailwind classes (`bg-crimson`, `text-parchment-dim`, etc.) are CSS variables defined in `@theme` in `index.css` — they update automatically when the theme changes. Persisted to localStorage.

### Routing

Routes defined in `src/core/constants/routes.ts` with helper functions (`factionPath`, `datasheetPath`, etc.). Router configured in `src/App.tsx`.

```
/catalog                      → CatalogPage   (faction grid)
/catalog/factions/:factionId  → FactionPage   (units + detachments)
/catalog/datasheets/:id       → DatasheetDetailPage (full GW-style sheet)
/roster                       → RosterListPage (Phase 2 placeholder)
```

### Visual style

The UI imitates the official GW Warhammer app: faction color bar in headers (`bg-crimson`), stat boxes, weapon tables (`<table>` not cards), abilities as `Name: description`, keywords at the bottom. Typography uses `font-display` (Orbitron) for headers and `font-mono` (Share Tech Mono) for data. Sizes are mostly `text-[8px]`–`text-[10px]` with `uppercase tracking-widest`.

### Shared components

- `RuleTooltip` — wraps any rule badge; shows description on hover. Feed it `getRuleDescription(name)` from `src/core/constants/weaponRules.ts`.
- `StatsBar`, `WeaponCard`, `AbilityList`, `StratList` — older components kept for potential reuse; `DatasheetDetailPage` renders its own tables directly to match GW layout.

### Phase 2: Army builder (not yet started)

Plan: `src/store/index.ts` + `src/store/rosterSlice.ts` (RTK already installed). Types `RosterList` and `RosterEntry` are already defined in `src/types/index.ts`. Persist with `useLocalStorage` hook (`src/shared/hooks/useLocalStorage.ts`). Wrap `App` in `<Provider>` in `main.tsx`. Pages: `RosterListPage` and `RosterEditPage` at `/roster` and `/roster/:id`.
