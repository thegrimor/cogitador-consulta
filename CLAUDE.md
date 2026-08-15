# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Maintenance rule

**Update this file as part of the task, not after.** When a task adds a route, a data file, a store slice, or changes an architectural pattern described below, update the relevant section in the same change. Stale docs here have previously caused wrong assumptions about what's implemented — don't let this file drift from the code again.

## Commands

```bash
npm run dev      # Dev server (Vite HMR)
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # Preview production build

npm run server:install  # one-time: npm install inside server/
npm run server           # backend (Express) with reload, http://localhost:8787
```

The frontend needs the backend running to do anything with the `Ejército` area (login, and
every roster read/write) — `npm run dev` alone serves the static app fine but `/api/*` calls
404 without `npm run server` also running, and the backend itself needs `server/.env` (copy
from `server/.env.example`) with a `DATABASE_URL` pointing at a Postgres instance — it won't
boot without one. Vite's dev server proxies `/api` to `http://localhost:8787` (see
`vite.config.ts`); in production the backend can serve the built `dist/` itself, or the
frontend can be deployed separately and point at the backend via `VITE_API_BASE_URL` (see
`server/README.md`).

One-off data script (run manually with `node scripts/<file>.mjs`, not wired to package.json):
- `scrape-mission-actions.mjs` — fills the back-of-card `action` text into `public/data/missions.json`

No test suite yet.

## Architecture

**Warhammer 40K 10th edition data consultation + army-building + damage-calculation app**, all in Spanish. Four areas, reachable from the nav bar (`Archivo` / `Ejército` / `Mathhammer`) and the home page:

1. **Catalog** (`Archivo`) — browse factions, datasheets, detachments, stratagems, enhancements.
2. **Reglamento** (core rules) — rules glossary, phases reference.
3. **Misiones** — primary/secondary mission card browser plus a mission matcher tool.
4. **Ejército** (roster/army builder) — create and edit army lists, with points, wargear, enhancements, and QR import/export. Requires a logged-in account (see Backend below) — lists are stored server-side per user, not in `localStorage`.
5. **Mathhammer** — probabilistic damage calculator between an attacker and defender unit, with a modifier panel for auras/stratagems/abilities.

### Data layer

All game data is JSON, hand-maintained directly — there is no CSV, no scraper, and no generator script (there used to be; the CSV source, the `modifiers.ts` combat-modifier catalog, and the build pipeline that folded one into the other were deleted once the JSON was verified correct and the app fully migrated onto it). The JSON *is* the source of truth: `public/data/factions/<slug>.json` (one per faction) + `public/data/catalog/factions.json` + `public/data/catalog/core-rules.json` + `public/data/catalog/phases.json` + `public/data/missions.json`. `src/infrastructure/data/useGameData.ts` fetches all of the faction/catalog JSON in parallel, flattens them into the `GameData` shape the app has always used, and exposes it via `GameDataContext` (read through `useGameDataContext()`). `src/infrastructure/data/useMissionsData.ts` separately fetches `missions.json` for the Misiones pages. `phases.json` (`PhaseData[]`, types in `src/types/index.ts`) used to be a static array in `src/core/constants/phasesData.ts`; that file now only keeps the `PHASE_GROUPS` display-order constant — the phase content itself moved to JSON so the chat backend (`server/src/lib/gameDataIndex.js`) can read it too, same as every other domain JSON file.

To correct or add data (fix a rule, add a new codex release, patch an errata), edit the relevant `public/data/factions/<slug>.json` (or `public/data/catalog/*.json`) file directly — there's no regeneration step to run afterward.

Ability/Stratagem/Enhancement/DetachmentAbility entities carry an optional `effect?: CombatEffect` (or `options?: {name, effect}[]` for mutually-exclusive variants like Ka'tah stances or Doctrina Imperatives) — the mathhammer calculator derives its toggleable rule list directly from whichever of these are in scope for the current selection (see `src/features/mathhammer/utils/deriveRules.ts`) instead of matching against a separate flat catalog.

All domain types are in `src/types/index.ts` (`Datasheet`, `Ability`, `CombatEffect`, etc.) — these are what both the JSON files and the live app agree on.

### Backend (`server/`)

Standalone Node/Express app (its own `package.json`, run via `npm run server` from the root —
see Commands above). Persistence is Postgres via `pg` directly (no ORM): `server/src/db.js`
holds a `users` table and a `rosters` table (id/user_id/timestamps as real columns, the full
`RosterList` blob in a `jsonb` column), with the schema created on boot
(`CREATE TABLE IF NOT EXISTS` — no separate migration step to run). `DATABASE_URL` is
required; the process refuses to start without it. Auth is still dependency-free —
`server/src/auth.js` does scrypt password hashing and HMAC-signed (JWT-shaped, not JWT-library)
tokens using only Node's built-in `crypto`. `id` columns are `TEXT`, not `UUID` — `RosterList.id`
is just `string` on the TS side, and a strict UUID column 500s on anything that doesn't parse
as one.

Route handlers are async (`server/src/asyncHandler.js` wraps them so a rejected promise reaches
the error middleware instead of hanging the request) since every `store.*` call now goes over
the network to Postgres. `db.js` also attaches a `pool.on('error', ...)` handler — without it,
an idle Postgres connection going bad (a DB restart, a network blip, Railway recycling the
connection) is an *unhandled* `'error'` event that crashes the whole Node process, not just
the one in-flight query. Confirmed by forcibly killing the DB connection under a running
server: process died without the handler, survived and kept serving `/api/health` with it.

- `GET /api/health` → `{ status: 'ok' }`, backed by a real `SELECT 1` against Postgres (not
  just "the process is up") — set as the Railway service's Healthcheck Path.
- `POST /api/auth/register`, `POST /api/auth/login` → `{ token, user }`
- `GET /api/auth/me` (bearer token) → `{ user }`
- `GET /api/rosters` / `PUT /api/rosters/:id` / `DELETE /api/rosters/:id` (bearer token, all
  scoped to the authenticated user; `PUT` upserts a full `RosterList` by id) —
  `server/src/routes/rosters.js`
- `POST /api/chat` → Server-Sent Events stream (`text`/`error`/`done`), public (no auth — it's a
  stateless rules lookup, nothing user-scoped) — `server/src/routes/chat.js`. See "Chat
  assistant" below.

CORS (`CORS_ORIGIN` env var, comma-separated origins) matters only when the frontend is
deployed on a different origin than this backend — same-origin requests (Vite's dev proxy, or
this same process serving `dist/`, see below) never go through it. Auth is Bearer-token only
(no cookies), so an unset `CORS_ORIGIN` just means "allow any origin," not a credential leak —
still worth setting once the frontend's real URL is known.

`server/src/index.js` can also serve the built `dist/` and SPA-fall-back to `index.html` for
any non-`/api` route, *if* `dist/` exists next to it — useful for a single-service deploy. When
the frontend is hosted separately (its own Railway service, Vercel, Netlify...), point it at
this backend via the frontend's `VITE_API_BASE_URL` build-time env var (read in
`src/infrastructure/api/client.ts`; empty/unset means same-origin `/api`, which is what local
dev and the single-service deploy both rely on). See `server/README.md` for the Railway
walkthrough.

### Chat assistant

A floating rules-assistant widget (`ChatWidget`, in-character as "Grimor Inferior", mounted
globally in `AppShell` — bottom-right, every page) answers questions about datasheets,
stratagems, enhancements, the core-rules glossary, the phase-by-phase sequence of play, and
missions. It's a thin tool-use loop, not a RAG index: `server/src/routes/chat.js` calls the
Claude API (`@anthropic-ai/sdk`, model `claude-opus-5`) with a fixed set of tools
(`server/src/lib/chatTools.js` — `list_factions`, `search_datasheets`/`get_datasheet`,
`get_detachments`, `get_stratagems`/`get_core_stratagems`, `get_universal_effects` (faction-agnostic
combat rules with a math effect, e.g. Cover — distinct from `get_core_stratagems`, which cost CP),
`get_enhancements`, `get_army_rules`, `search_core_rules` (terminology glossary), `list_phases`/
`get_phase` (sequence-of-play procedure — a distinct data source from the glossary, see "Core
rules & missions" above), `search_missions`, `get_mission_matchup` (Force Disposition matchup →
Primary Mission card, same lookup as `MissionMatcherPage`'s `missions.matrix.grid`)) that
search/read `public/data/*.json` on demand — the ~15MB of game data is
never sent as context, only the specific datasheet/stratagem/etc. the model asks for, via
`server/src/lib/gameDataIndex.js` (loads and indexes all faction JSON into memory once at
startup; searches are case/accent-insensitive substring matches). List-returning tools
(`get_stratagems`, `get_enhancements`, `get_detachments`, `list_phases`) cap their formatted
output at ~12k chars, since chapter-heavy factions like Space Marines have 50+ detachments — the
model is told to re-call with a narrower `detachmentId` instead of getting a silently truncated
wall of text. `ChatWidget`'s empty-conversation state also shows a static, zero-cost greeting
(never sent to the API) phrased in the same cogitator-boot-log voice the system prompt gives the
model for its own real self-introductions.

The route is public (no `requireAuth`) and stateless — conversation history lives only in the
browser tab (`useChatStream` hook), round-tripped in full on every request; nothing is
persisted server-side or tied to an account. Responses stream back as Server-Sent Events
(`text` chunks, then `done`, or `error`) over a manual `client.messages.stream()` + tool-result
loop (not the SDK's tool runner, to keep the SSE forwarding straightforward) — capped at 6 tool
iterations per turn. Requires `ANTHROPIC_API_KEY` in `server/.env`; without it the route
replies `503` instead of the process failing to boot, so the rest of the app (auth, rosters,
catalog) works fine with the key unset.

### State: Redux (`roster` + `auth`)

`src/store/index.ts` configures a Redux store (RTK) with two slices: `roster`
(`src/store/rosterSlice.ts`) and `auth` (`src/store/authSlice.ts`). `RootState`/`AppDispatch`
typed hooks are in `src/store/hooks.ts`. `App` is wrapped in `<Provider store={store}>` in
`main.tsx`. Only the auth **token** is persisted to `localStorage` (key
`cogitador-consulta-auth`) via a `store.subscribe` call in `store/index.ts` — roster data is
no longer mirrored to `localStorage` directly (it used to be, under
`cogitador-consulta-rosters`; that's what let one user's lists bleed into another's on reload,
which is exactly the bug this rework fixes). Rosters are fetched fresh from the backend and
live only in memory, scoped to whichever account is currently authenticated.

**Auth flow** (`src/store/authThunks.ts`, `src/infrastructure/api/client.ts`):
`bootstrapAuth()` (dispatched once, from `AppShell`, on app load) validates a persisted token
against `GET /api/auth/me`; `login()`/`register()` call the matching endpoint. All three —
plus `logout()` — follow the same shape: dispatch `resetRosters()` first (or on failure),
*then* update `auth` state, *then* fetch and `hydrateRosters()`. That ordering is what
guarantees a page reload, a login, a fresh registration, or a logout never shows a mix of two
users' lists — there is never a moment where `auth.user` points at one account while
`roster.rosters` still holds another's data. `rosterSlice`'s `hydrateRosters`/`resetRosters`
reducers exist only for this — regular roster mutations never call them directly.

One courtesy migration lives in `authThunks.ts`: if an account has zero rosters on the backend
and the browser still has pre-login rosters under the legacy `cogitador-consulta-rosters` key,
`login()`/`register()` adopt them into the account (via `PUT`) once, then delete the legacy key.

**Sync to backend** (`src/store/rosterSyncMiddleware.ts`): a Redux middleware, not thunks
threaded through every call site. It watches every `roster/*` action (except
`hydrateRosters`/`resetRosters`, which move data *from* the server or clear it), and — only
when `auth.token` is set — debounces a `PUT /api/rosters/:id` of the affected roster (id read
off `action.payload.rosterId ?? action.payload.id`), or fires `DELETE` immediately for
`deleteRoster`. This is why roster components (`RosterEditPage`, `AddUnitPanel`, etc.) dispatch
the plain `rosterSlice` actions exactly as before — none of them know or care that a backend
exists.

`RequireAuth` (`src/shared/components/RequireAuth`) gates the `/roster/*` route subtree —
unauthenticated visitors are redirected to `/login` (preserving `?next=`); a token still being
validated by `bootstrapAuth()` shows `LoadingScreen` instead of bouncing. `AccountMenu`
(`src/shared/components/AccountMenu`) in the header is a login link when logged out, or a
profile dropdown (avatar initial + username, click to reveal a "Cerrar Sesión" button) when
logged in — same open/close-on-outside-click pattern as `ThemePicker`, which it sits next to
in `AppShell`'s header. Session tokens (`server/src/auth.js`) last 1 year, meant to persist
per device until an explicit logout rather than silently expiring.

Implemented: create/edit/list rosters with points limits, detachment selection (with Detachment Points cost), enhancements, wargear-option legality enforcement and per-weapon surcharges, multi-tier unit costs, leader attachment, allies for Imperium factions, and import/export in Munitorum text format plus QR (scan or photo upload).

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

/roster                                    → RosterListPage   (behind RequireAuth)
/roster/new                                → RosterNewPage    (behind RequireAuth)
/roster/:rosterId                          → RosterEditPage   (behind RequireAuth)

/mathhammer                                → MathhammerPage (?faction=&datasheet=&detachments=&character=&roster=)

/login                                     → LoginPage (login + register, toggled in one form; ?next= to return after auth)
```

`RosterList`/`RosterEntry` types are in `src/types/index.ts`. Roster CRUD (`createRoster`, `deleteRoster`, `renameRoster`, `setPointsLimit`, `setDetachments`, `addEntry`, ...) lives in `rosterSlice.ts`; totals are recomputed on every entry mutation. The legacy single-`detachmentId` → `detachmentIds[]` shape migration now lives in `authThunks.ts`'s legacy-import path (see above) since that's the only place old shapes can still surface from.

Everything else (catalog, core rules, missions, mathhammer) is local component state / derived from `GameDataContext` — there's no global store for it.

### Army builder (`/roster`, requires login)

- `RosterListPage` / `RosterNewPage` / `RosterEditPage` — list, create, and edit rosters.
- `AddUnitPanel`, `WeaponSelector`, `WeaponOptionsEditor`, `CostVariantPicker`, `DetachmentSelectModal`, `RosterEntryRow`, `RosterCard` — the editing UI: adding units, picking wargear loadouts/options, resolving cost variants (e.g. per-model-count pricing), selecting detachments, and rendering each entry.
- Points math (`resolveCostsForUnitIndex`, `sumDetachmentPoints`, model-count resolution, rule selection caps) lives in `src/core/utils/roster.ts`; weapon-option/loadout parsing is in `src/core/utils/weaponOptions.ts`.
- Export to Wahapedia-style plain text (`sectionHeader`, `battleSizeLabel`, etc.) is in `src/core/utils/rosterExport.ts`.
- QR import/export (`RosterQrExportModal`, `RosterQrScanModal`) round-trips a compact roster payload through `lz-string` compression + `qrcode.react` (render) / `qr-scanner` (scan) in `src/core/utils/rosterQrCode.ts`. There's also a BCP-list text importer (`src/features/mathhammer/utils/parseBcpList.ts`) that parses copy-pasted army lists.
- Enhancement-to-unit attachment rules are in `src/core/constants/enhancementAttachments.ts`.

### Mathhammer (`/mathhammer`)

Standalone feature folder at `src/features/mathhammer/`. Computes expected-value damage output (hits → wounds → saves → damage → Feel No Pain, with full probability distribution — stddev/percentiles/kill probability) for an attacker unit's weapons against a defender profile.

- `types.ts` — `CombatModifiers` (every numeric/boolean modifier a rule can apply), `ModifierRule` (a single rule's targeting conditions + effects, keyed by faction/detachment/enhancement/datasheet/leader/keyword), `DamageBreakdown` (per-weapon calculation output).
- `utils/deriveRules.ts` — derives the modifier panel's toggleable rule list directly from the `effect`/`options` fields on whichever Ability/Stratagem/Enhancement/DetachmentAbility are in scope for the current selection (see Data layer above) — there's no separate flat rule catalog.
- `utils/mathhammer.ts` — the core probability math.
- `components/`: `UnitSelector` (pick attacker/defender), `UnitPanel`, `ModifierPanel` (toggle applicable rules/stratagems), `DamageCalculator` + `GaussianChart` (results + distribution chart), plus `StatsBar`/`WeaponCard`/`AbilityList`/`StratList` variants local to this feature.
- `hooks/usePanelState.ts` — panel selection state, synced to the `?faction=&datasheet=&detachments=&character=&roster=` query params via `mathhammerAttackerPath`.

### Core rules & missions

- `CoreRulesPage` renders `public/data/catalog/core-rules.json` (categories: `weapon_ability`, `unit_ability`, `concept`, `phase`) — a glossary of terminology. `PhasesListPage`/`PhaseDetailPage` render `public/data/catalog/phases.json` (`GameData.phases`) — the step-by-step sequence of play (Battle Round, the five phases, terrain, objectives, stratagem timing, etc.); grouped for the list view via `PHASE_GROUPS` in `src/core/constants/phasesData.ts`. Glossary vs. procedure are deliberately separate data sources, not duplicates.
- Missions pages read `public/data/missions.json` via `useMissionsData`. `MissionMatcherPage` looks up the primary-mission card for a pair of decks via `missions.matrix.grid[ownDeck][opponentDeck]`, using per-deck colors from `src/core/constants/missionDeckColors.ts` and slugging via `src/core/utils/missionText.ts`. `PrimaryMissionSections` and `MissionActionBox` render card contents; secondary missions get a "Con acción" badge when they have actionable text.

### Visual style

The UI imitates the official GW Warhammer app: faction color bar in headers (`bg-crimson`), stat boxes, weapon tables (`<table>` not cards), abilities as `Name: description`, keywords at the bottom. Typography uses `font-display` (Orbitron) for headers and `font-mono` (Share Tech Mono) for data. Sizes are mostly `text-[8px]`–`text-[10px]` with `uppercase tracking-widest`. All UI copy is in Spanish.

### Shared components (`src/shared/components/`)

- `RuleTooltip` — wraps any rule badge; shows description on hover. Feed it `getRuleDescription(name)` from `src/core/constants/weaponRules.ts`.
- `AppShell` / `NavBar` / `ThemePicker` — page chrome, top nav (Archivo/Ejército/Mathhammer), faction theme switcher.
- `AccountMenu` — header login link, or a profile dropdown (avatar + username → Cerrar Sesión) when logged in. `RequireAuth` — route-gate wrapper (`<Outlet/>` if authenticated, else redirect to `/login`); not itself in the header, used in `App.tsx`'s router tree.
- `ChatWidget` — global floating rules-assistant button + panel, mounted once in `AppShell` (not route-gated, works logged out). `useChatStream` drives the `POST /api/chat` SSE stream. See "Chat assistant" above.
- `StatsBar`, `WeaponCard`, `AbilityList`, `StratList` — generic datasheet-display building blocks (also duplicated as leaner variants under `src/features/mathhammer/components/` for that feature's own layout needs).
- `VpBadge`, `LoadingScreen`, `ErrorScreen` — small utility components.
- Roster-specific: `AddUnitPanel`, `WeaponSelector`, `WeaponOptionsEditor`, `CostVariantPicker`, `DetachmentSelectModal`, `RosterCard`, `RosterEntryRow`, `RosterQrModal/*`.
- Mission-specific: `PrimaryMissionSections`, `MissionActionBox`.
