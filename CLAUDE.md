# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (Vite HMR)
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # Preview production build

npm run scrape:mfm    # Scrape mfm.warhammer-community.com points/costs into scripts/mfm-data.json
npm run update:costs  # Apply scripts/mfm-data.json onto Datasheets_models_cost.csv
```

Other one-off data scripts (run manually with `node scripts/<file>.mjs`, not wired to package.json):
- `scrape-mission-actions.mjs` — fills the back-of-card `action` text into `public/data/missions.json`
- `sync-enhancement-costs.mjs` — syncs `Enhancements.csv` cost column from `mfm-data.json`
- `update-detachments.mjs` — adds `disposition`/`dp` columns to `Detachments.csv`
- `update-wargear-costs.mjs` — populates `Datasheets_wargear_cost.csv` per-weapon surcharges

No test suite yet.

## Architecture

**Warhammer 40K 10th edition data consultation + army-building + damage-calculation + battle-scoring app**, all in Spanish. Five areas, reachable from the nav bar (`Archivo` / `Ejército` / `Mathhammer` / `Partidas`) and the home page:

1. **Catalog** (`Archivo`) — browse factions, datasheets, detachments, stratagems, enhancements.
2. **Reglamento** (core rules) — rules glossary, phases reference.
3. **Misiones** — primary/secondary mission card browser plus a mission matcher tool.
4. **Ejército** (roster/army builder) — create and edit army lists, with points, wargear, enhancements, and QR import/export.
5. **Mathhammer** — probabilistic damage calculator between an attacker and defender unit, with a modifier panel for auras/stratagems/abilities.
6. **Partidas** (`/battles`) — round-by-round battle scorer for two players sharing one device: tap the actual scoring conditions from the mission text and the app sums VP automatically.

### Data layer

Static game data lives in `/public/data/*.csv` (pipe-delimited) plus `/public/data/missions.json`. `src/infrastructure/data/useGameData.ts` loads all CSVs in parallel with PapaParse, parses them into domain types, and exposes them via `GameDataContext` (read through `useGameDataContext()`). `src/infrastructure/data/useMissionsData.ts` separately fetches `missions.json` for the Misiones pages.

CSV files: `Factions`, `Datasheets`, `Datasheets_models`, `Datasheets_models_cost`, `Datasheets_wargear`, `Datasheets_wargear_cost`, `Datasheets_abilities`, `Datasheets_detachment_abilities`, `Abilities`, `Detachments`, `Detachments_chapters`, `Detachment_abilities`, `Stratagems`, `Datasheets_stratagems`, `Datasheets_keywords`, `Datasheets_unit_composition`, `Datasheets_leader`, `Datasheets_options`, `Datasheets_enhancements`, `Enhancements`, `CoreRules`, `Source`, `Last_update`.

CSV data is refreshed from Wahapedia/MFM sources via the `scripts/*.mjs` scrapers above rather than hand-edited. All domain types (raw `Raw*` CSV row shapes and clean domain types) are in `src/types/index.ts`.

### Theme system

24 faction themes defined in `src/themes/themes.ts`. Each theme is a set of CSS custom property values. `useTheme` (in `src/shared/hooks/useTheme.ts`) writes them to `data-theme` on `<html>`, which activates overrides defined in `src/index.css` under `[data-theme="<id>"]` blocks. Colors referenced in Tailwind classes (`bg-crimson`, `text-parchment-dim`, etc.) are CSS variables defined in `@theme` in `index.css` — they update automatically when the theme changes. Persisted to localStorage via `ThemePicker`.

### Routing

Routes defined in `src/core/constants/routes.ts` with helper functions (`factionPath`, `datasheetPath`, `mathhammerAttackerPath`, etc.). Router tree configured in `src/App.tsx` (nested under `AppShell`, data-provided by `GameDataProvider`).

```
/                                          → redirect to /catalog
/catalog                                   → CatalogPage (faction grid)
/catalog/factions/:factionId               → FactionPage
/catalog/factions/:factionId/datasheets    → FactionDatasheetsPage
/catalog/factions/:factionId/detachments   → FactionDetachmentsPage
/catalog/factions/:factionId/army-rules    → FactionArmyRulesPage
/catalog/datasheets/:datasheetId           → DatasheetDetailPage (full GW-style sheet)
/catalog/detachments/:detachmentId         → DetachmentDetailPage

/core-rules                                → CoreRulesPage (rules glossary)
/core-rules/phases                         → PhasesListPage
/core-rules/phases/:phaseId                → PhaseDetailPage

/missions/primary                          → MissionsPrimaryListPage
/missions/primary/:cardId                  → MissionPrimaryDetailPage
/missions/secondary                        → MissionsSecondaryListPage
/missions/secondary/:cardId                → MissionSecondaryDetailPage
/missions/matcher                          → MissionMatcherPage (pick two players' primary mission decks)

/roster                                    → RosterListPage
/roster/new                                → RosterNewPage
/roster/:rosterId                          → RosterEditPage

/mathhammer                                → MathhammerPage (?faction=&datasheet=&detachments=&character=&roster=)

/battles                                   → BattleListPage
/battles/new                               → BattleNewPage (setup, can arrive pre-filled from the Mission Matcher)
/battles/:battleId                         → BattleScorePage (round-by-round + end-of-battle scoring)
```

### State: Redux (roster and battles)

`src/store/index.ts` registers two slices: `rosterSlice.ts` and `battleSlice.ts` (Redux Toolkit). `RootState`/`AppDispatch` typed hooks in `src/store/hooks.ts`. `App` is wrapped in `<Provider>` in `main.tsx`. Each slice is persisted to its own `localStorage` key (`cogitador-consulta-rosters`, `cogitador-consulta-battles`) via a `store.subscribe` call in `store/index.ts`; the roster load path also migrates the legacy single-`detachmentId` shape → `detachmentIds[]`.

`RosterList`/`RosterEntry` types are in `src/types/index.ts`. Roster CRUD (`createRoster`, `deleteRoster`, `renameRoster`, `setPointsLimit`, `setDetachments`, `addEntry`, ...) lives in `rosterSlice.ts`; totals are recomputed on every entry mutation.

`Battle`/`BattleRound`/`ConditionSelectionState` types are in `src/types/index.ts`. Unlike rosters, `battleSlice.ts` never stores a VP total — actions (`toggleCondition`, `setConditionCount`, `toggleEobCondition`, `setEobConditionCount`, `swapTacticalCard`, `advanceRound`, `finishBattle`, ...) only record which scoring conditions are checked; VP is always derived on read via `src/core/utils/battleScoring.ts`.

Everything else (catalog, core rules, missions, mathhammer) is local component state / derived from `GameDataContext` — there's no global store for it.

### Army builder (`/roster`)

- `RosterListPage` / `RosterNewPage` / `RosterEditPage` — list, create, and edit rosters.
- `AddUnitPanel`, `WeaponSelector`, `WeaponOptionsEditor`, `CostVariantPicker`, `DetachmentSelectModal`, `RosterEntryRow`, `RosterCard` — the editing UI: adding units, picking wargear loadouts/options, resolving cost variants (e.g. per-model-count pricing), selecting detachments, and rendering each entry.
- Points math (`resolveCostsForUnitIndex`, `sumDetachmentPoints`, model-count resolution, rule selection caps) lives in `src/core/utils/roster.ts`; weapon-option/loadout parsing is in `src/core/utils/weaponOptions.ts`.
- Export to Wahapedia-style plain text (`sectionHeader`, `battleSizeLabel`, etc.) is in `src/core/utils/rosterExport.ts`.
- QR import/export (`RosterQrExportModal`, `RosterQrScanModal`) round-trips a compact roster payload through `lz-string` compression + `qrcode.react` (render) / `qr-scanner` (scan) in `src/core/utils/rosterQrCode.ts`. There's also a BCP-list text importer (`src/features/mathhammer/utils/parseBcpList.ts`) that parses copy-pasted army lists.
- Enhancement-to-unit attachment rules are in `src/core/constants/enhancementAttachments.ts`.

### Mathhammer (`/mathhammer`)

Standalone feature folder at `src/features/mathhammer/`. Computes expected-value damage output (hits → wounds → saves → damage → Feel No Pain, with full probability distribution — stddev/percentiles/kill probability) for an attacker unit's weapons against a defender profile.

- `types.ts` — `CombatModifiers` (every numeric/boolean modifier a rule can apply), `ModifierRule` (a single rule's targeting conditions + effects, keyed by faction/detachment/enhancement/datasheet/leader/keyword), `DamageBreakdown` (per-weapon calculation output).
- `data/modifiers.ts` — the full library of `ModifierRule`s (faction/detachment abilities, enhancements, stratagems, unit abilities) that the modifier panel offers.
- `utils/mathhammer.ts` — the core probability math.
- `components/`: `UnitSelector` (pick attacker/defender), `UnitPanel`, `ModifierPanel` (toggle applicable rules/stratagems), `DamageCalculator` + `GaussianChart` (results + distribution chart), plus `StatsBar`/`WeaponCard`/`AbilityList`/`StratList` variants local to this feature.
- `hooks/usePanelState.ts` — panel selection state, synced to the `?faction=&datasheet=&detachments=&character=&roster=` query params via `mathhammerAttackerPath`.

### Core rules & missions

- `CoreRulesPage`/`PhasesListPage`/`PhaseDetailPage` render the `CoreRules` CSV (categories: `weapon_ability`, `unit_ability`, `concept`, `phase`) plus static phase copy in `src/core/constants/phasesData.ts`.
- Missions pages read `public/data/missions.json` via `useMissionsData`. `MissionMatcherPage` looks up the primary-mission card for a pair of decks via `resolveCard` (`src/core/utils/missionText.ts`, `missions.matrix.grid[ownDeck][opponentDeck]`), using per-deck colors from `src/core/constants/missionDeckColors.ts` and slugging via `missionSlug`. `PrimaryMissionSections` and `SecondaryMissionSections` render card contents (read-only by default; see Partidas below for their interactive mode); secondary missions get a "Con acción" badge when they have actionable text.

### Partidas (`/battles`)

Round-by-round battle scorer for two players on one shared device. The user-facing requirement driving the design: never type a VP number — tap the actual scoring conditions from the mission text and the app sums VP automatically.

- `src/core/utils/battleScoring.ts` — pure VP computation. `conditionKey(sectionIndex, itemIndex)` is the synthetic id for a tier/row (missions data has none). `groupExclusiveRuns` groups sibling tiers/rows into `or`-alternatives (radio groups) vs independent checkboxes. `scorePrimarySections`/`scoreSecondaryCard`/`scoreRoundForPlayer` sum a `ConditionSelectionState` (`checked`/`counts` maps, never a raw number) against a card's sections, honoring `perUnit`/`perEvent` counters, `cap` clamping, and EOB (`headerKind: 'eob'`) filtering. `computeBattleTotals` sums a whole `Battle`.
- `PrimaryMissionSections`/`SecondaryMissionSections` (`src/shared/components/`) take an optional `interactive` prop (`{ selection, onToggle, onCountChange, showEob? }`) that swaps the read-only `VpBadge` per tier/row for a tappable `ConditionToggle`/`ConditionStepper` (`src/shared/components/ConditionToggle/`) — checkbox/radio/stepper chosen per the same rules `battleScoring.ts` uses. Existing read-only call sites are unaffected since the prop is optional.
- `src/store/battleSlice.ts` — `Battle` never caches a VP total, only condition state. `createBattle` seeds a shuffled tactical-secondary deck/hand (`TacticalDeckState`) for any player in `'tactical'` mode; `swapTacticalCard` discards one hand card and draws a replacement (once per round per player, enforced in the UI). `advanceRound` appends rounds (max 5) without deleting history so past rounds stay reviewable/editable.
- `BattleListPage` / `BattleNewPage` / `BattleScorePage` — list with live totals (`BattleCard`), setup (names, primary deck per player, fixed 2-card pick or tactical mode), and the live scorer (round tabs 1–5 + an EOB tab, both players' checklists stacked, "cambiar carta" for tactical hands, "Finalizar partida").
- Entry point: `MissionMatcherPage` gets an "Iniciar Partida" button once both decks resolve, navigating to `/battles/new` with `{ player1Name, player2Name, deck1, deck2 }` as router `state` (not query params — one-time hand-off, not a shareable link).

### Visual style

The UI imitates the official GW Warhammer app: faction color bar in headers (`bg-crimson`), stat boxes, weapon tables (`<table>` not cards), abilities as `Name: description`, keywords at the bottom. Typography uses `font-display` (Orbitron) for headers and `font-mono` (Share Tech Mono) for data. Sizes are mostly `text-[8px]`–`text-[10px]` with `uppercase tracking-widest`. All UI copy is in Spanish.

### Shared components (`src/shared/components/`)

- `RuleTooltip` — wraps any rule badge; shows description on hover. Feed it `getRuleDescription(name)` from `src/core/constants/weaponRules.ts`.
- `AppShell` / `NavBar` / `ThemePicker` — page chrome, top nav (Archivo/Ejército/Mathhammer/Partidas), faction theme switcher.
- `StatsBar`, `WeaponCard`, `AbilityList`, `StratList` — generic datasheet-display building blocks (also duplicated as leaner variants under `src/features/mathhammer/components/` for that feature's own layout needs).
- `VpBadge`, `LoadingScreen`, `ErrorScreen` — small utility components.
- Roster-specific: `AddUnitPanel`, `WeaponSelector`, `WeaponOptionsEditor`, `CostVariantPicker`, `DetachmentSelectModal`, `RosterCard`, `RosterEntryRow`, `RosterQrModal/*`.
- Mission-specific: `PrimaryMissionSections`, `SecondaryMissionSections`, `MissionActionBox` — the first two also power the interactive checklists in Partidas (see above).
- Battle-specific: `BattleCard`, `ConditionToggle` (`ConditionToggle`/`ConditionStepper`).
