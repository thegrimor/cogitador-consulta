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

**Warhammer 40K 10th edition data consultation + army-building + damage-calculation app**, all in Spanish. Four areas, reachable from the nav bar (`Archivo` / `Ejército` / `Mathhammer`) and the home page:

1. **Catalog** (`Archivo`) — browse factions, datasheets, detachments, stratagems, enhancements.
2. **Reglamento** (core rules) — rules glossary, phases reference.
3. **Misiones** — primary/secondary mission card browser plus a mission matcher tool.
4. **Ejército** (roster/army builder) — create and edit army lists, with points, wargear, enhancements, and QR import/export.
5. **Mathhammer** — probabilistic damage calculator between an attacker and defender unit, with a modifier panel for auras/stratagems/abilities.

### Data layer

Runtime data is JSON, generated from source CSVs — the app never parses CSV at runtime. There are two layers:

- **Source (build-time only, not shipped):** `data-source/*.csv` (pipe-delimited wahapedia scrape — `Factions`, `Datasheets`, `Datasheets_models`, `Datasheets_models_cost`, `Datasheets_wargear`, `Datasheets_wargear_cost`, `Datasheets_abilities`, `Datasheets_detachment_abilities`, `Abilities`, `Detachments`, `Detachments_chapters`, `Detachment_abilities`, `Stratagems`, `Datasheets_stratagems`, `Datasheets_keywords`, `Datasheets_unit_composition`, `Datasheets_leader`, `Datasheets_options`, `Datasheets_enhancements`, `Enhancements`, `CoreRules`, `Source`, `Last_update` — kept up to date by `scrape-mfm.mjs`/`update-costs.mjs`/`sync-enhancement-costs.mjs`/`update-detachments.mjs`/`update-wargear-costs.mjs`) plus the hand-authored combat-modifier catalog `src/features/mathhammer/data/modifiers.ts` (`MODIFIER_RULES`). `scripts/generate-faction-data.ts` reads both, folds each `ModifierRule` into the real named entity it describes (a datasheet ability, stratagem, enhancement, or detachment ability — matched by id first, then by name/description text), and writes the runtime artifact below. Run `npm run generate:faction-data` after editing either source, then `npm run verify:faction-data` (checks deterministic regeneration, lossless weapon-rule round-tripping, and that every modifier rule was accounted for — merged, in fallback, or deliberately excluded as Boarding Actions/Combat Patrol or Legends).
- **Runtime artifact (shipped, fetched by the app):** `public/data/factions/<slug>.json` (one per faction) + `public/data/catalog/factions.json` + `public/data/catalog/core-rules.json` + `public/data/missions.json`. `src/infrastructure/data/useGameData.ts` fetches all of the faction/catalog JSON in parallel, flattens them back into the same `GameData` shape the app has always used, and exposes it via `GameDataContext` (read through `useGameDataContext()`). `src/infrastructure/data/useMissionsData.ts` separately fetches `missions.json` for the Misiones pages.

Some faction JSON files carry hand-authored fixes beyond what the generator alone would produce (rule-coverage corrections matched by hand where automatic id/text matching fell short) — `verify:faction-data`'s determinism check will flag those files as differing from a fresh regeneration; that's expected while both layers coexist, not a bug.

Ability/Stratagem/Enhancement/DetachmentAbility entities carry an optional `effect?: CombatEffect` (or `options?: {name, effect}[]` for mutually-exclusive variants like Ka'tah stances) — the mathhammer calculator derives its toggleable rule list directly from whichever of these are in scope for the current selection (see `src/features/mathhammer/utils/deriveRules.ts`) instead of matching against a separate flat catalog.

All domain types are in `src/types/index.ts`. Raw CSV row types (`Raw*`) are used only by `csvParsers.ts` and the generator/verify scripts under `scripts/`; clean domain types (`Datasheet`, `Ability`, `CombatEffect`, etc.) are what the live app consumes.

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
```

### State: Redux (roster only)

`src/store/index.ts` + `src/store/rosterSlice.ts` (Redux Toolkit). `RootState`/`AppDispatch` typed hooks in `src/store/hooks.ts`. `App` is wrapped in `<Provider>` in `main.tsx`. The store is persisted to `localStorage` (key `cogitador-consulta-rosters`) via a `store.subscribe` call in `store/index.ts`, with a migration for the legacy single-`detachmentId` shape → `detachmentIds[]`.

`RosterList`/`RosterEntry` types are in `src/types/index.ts`. Roster CRUD (`createRoster`, `deleteRoster`, `renameRoster`, `setPointsLimit`, `setDetachments`, `addEntry`, ...) lives in `rosterSlice.ts`; totals are recomputed on every entry mutation.

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
- `data/modifiers.ts` — the hand-authored `ModifierRule` catalog; only consumed at build time by `scripts/generate-faction-data.ts` (see Data layer above). At runtime the modifier panel gets its rule list from `deriveRules.ts` reading the `effect`/`options` fields already folded into the selected Ability/Stratagem/Enhancement/DetachmentAbility, not from this file directly.
- `utils/mathhammer.ts` — the core probability math.
- `components/`: `UnitSelector` (pick attacker/defender), `UnitPanel`, `ModifierPanel` (toggle applicable rules/stratagems), `DamageCalculator` + `GaussianChart` (results + distribution chart), plus `StatsBar`/`WeaponCard`/`AbilityList`/`StratList` variants local to this feature.
- `hooks/usePanelState.ts` — panel selection state, synced to the `?faction=&datasheet=&detachments=&character=&roster=` query params via `mathhammerAttackerPath`.

### Core rules & missions

- `CoreRulesPage`/`PhasesListPage`/`PhaseDetailPage` render `public/data/catalog/core-rules.json` (categories: `weapon_ability`, `unit_ability`, `concept`, `phase`) plus static phase copy in `src/core/constants/phasesData.ts`.
- Missions pages read `public/data/missions.json` via `useMissionsData`. `MissionMatcherPage` looks up the primary-mission card for a pair of decks via `missions.matrix.grid[ownDeck][opponentDeck]`, using per-deck colors from `src/core/constants/missionDeckColors.ts` and slugging via `src/core/utils/missionText.ts`. `PrimaryMissionSections` and `MissionActionBox` render card contents; secondary missions get a "Con acción" badge when they have actionable text.

### Visual style

The UI imitates the official GW Warhammer app: faction color bar in headers (`bg-crimson`), stat boxes, weapon tables (`<table>` not cards), abilities as `Name: description`, keywords at the bottom. Typography uses `font-display` (Orbitron) for headers and `font-mono` (Share Tech Mono) for data. Sizes are mostly `text-[8px]`–`text-[10px]` with `uppercase tracking-widest`. All UI copy is in Spanish.

### Shared components (`src/shared/components/`)

- `RuleTooltip` — wraps any rule badge; shows description on hover. Feed it `getRuleDescription(name)` from `src/core/constants/weaponRules.ts`.
- `AppShell` / `NavBar` / `ThemePicker` — page chrome, top nav (Archivo/Ejército/Mathhammer), faction theme switcher.
- `StatsBar`, `WeaponCard`, `AbilityList`, `StratList` — generic datasheet-display building blocks (also duplicated as leaner variants under `src/features/mathhammer/components/` for that feature's own layout needs).
- `VpBadge`, `LoadingScreen`, `ErrorScreen` — small utility components.
- Roster-specific: `AddUnitPanel`, `WeaponSelector`, `WeaponOptionsEditor`, `CostVariantPicker`, `DetachmentSelectModal`, `RosterCard`, `RosterEntryRow`, `RosterQrModal/*`.
- Mission-specific: `PrimaryMissionSections`, `MissionActionBox`.
