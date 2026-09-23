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

npm run extract-pdf:install                              # one-time: pip install pymupdf
npm run extract-pdf -- "path/to/book.pdf" <first> <last> [outFile]  # cheap PDF text-layer dump
```

The frontend needs the backend running to do anything with the `Ejército` area (login, and
every roster read/write) — `npm run dev` alone serves the static app fine but `/api/*` calls
404 without `npm run server` also running, and the backend itself needs `server/.env` (copy
from `server/.env.example`) with a `DATABASE_URL` pointing at a Postgres instance — it won't
boot without one. Vite's dev server proxies `/api` to `http://localhost:8787` (see
`vite.config.ts`); in production the backend can serve the built `dist/` itself, or the
frontend can be deployed separately and point at the backend via `VITE_API_BASE_URL` (see
`server/README.md`).

One-off data scripts (run manually with `node scripts/<file>.mjs`, not wired to package.json,
except `extract-pdf`/`extract-pdf:install` above which delegate to `extract-text.py`):
- `scrape-mission-actions.mjs` — fills the back-of-card `action` text into `public/data/missions.json`
- `audit-combat-effects.mjs` — triage tool for the Mathhammer combat-effect data audit (see
  "CombatEffect authoring convention" under Mathhammer below): walks every
  `public/data/factions/<slug>.json`, finds every Ability/DetachmentAbility/Stratagem/Enhancement
  (and each `options[].effect` variant) carrying an `effect`, and dumps one Markdown file per
  faction with the bearer name, the HTML-stripped rule text, and the full `effect` JSON side by
  side — so checking a stored effect against its real card text doesn't require re-extracting
  each block from raw JSON by hand. `node scripts/audit-combat-effects.mjs [outDir]
  [--faction=<slug>,...]` (outDir defaults to `./audit-output`, gitignored scratch output — the
  tool only collects data for review, it never edits the faction JSON itself).
- `scripts/pdf-codex-tools/` — **read `CODEX-MIGRATION-PROCESS.md` here before starting any
  future full-codex faction migration** — step-by-step checklist (full-replace-vs-patch
  decision, what to check in the PDF first, extraction, JSON authoring, and a data-quality trap
  to avoid up front rather than clean up after: don't leave the PDF's flavour-text sentence at
  the start of ability/enhancement/stratagem descriptions — this app's convention, confirmed
  against every other faction, is to start at the mechanical rule text). `README.md` in the same
  folder covers the PDF-reading/OCR mechanics specifically: `extract-text.py` (PyMuPDF-based
  plain-text-layer extraction — deps in `requirements.txt`, install via `npm run
  extract-pdf:install` (or `pip install -r scripts/pdf-codex-tools/requirements.txt` directly),
  no system deps; run via `npm run extract-pdf -- <pdf> <first> <last> [outFile]`, see Commands
  above) is the cheap first step, good for most pages (army rules, detachments, stratagems,
  enhancements) where the PDF's text layer isn't broken; it flags pages whose extracted text
  looks mangled so you know which ones need OCR instead. `render-and-ocr.mjs` (poppler
  `pdftoppm` + Tesseract OCR) is the fallback
  for when the text layer produces garbage on a book's datasheet pages (a broken embedded-font
  glyph mapping, not a layout issue — confirmed on the Orks 11th-ed codex across every
  `pdftotext` mode). OCR reads pixels instead, so it doesn't care that the text layer is
  broken, and it's near-free token-wise for prose (ability text, wargear options, keywords) —
  it's unreliable for the numeric weapon/model stat tables specifically, which still need a
  visual check (or the TSV-based positional table reconstruction sketched in that README, not
  yet built). `render-and-ocr.mjs`'s poppler/tesseract install via `winget`.
- `scripts/sm-chapter-split/` — the one-off that turned the five Space Marines chapters with
  their own detachments (Black Templars, Blood Angels, Dark Angels, Deathwatch, Space Wolves)
  into real factions, leaving `space-marines` as their parent. Re-runnable from a clean
  checkout (`--dry` reports the split without writing) and it refuses to run twice. Also
  generates `src/core/constants/smChapterDatasheets.ts`. Read its README before touching the
  Space Marines data — **see "Faction inheritance" below for the model it produced.**
- `scripts/orks-11th-ed-migration/` — one-off pipeline used to rebuild `orks.json` wholesale
  from the actual 11th-edition Codex PDF (not a Faction Pack dataslate) when that codex
  replaced the old Ork data generation entirely; kept as a worked reference for the next
  faction that gets a real new-codex release rather than a points update (used the *visual*
  read-every-page-image approach, before `scripts/pdf-codex-tools/` existed — next time, start
  with that instead). See that folder's README for the full methodology and the gaps this run
  left open (points/DP/disposition placeholders, empty `canBeLedBy`, heuristic
  stratagem/enhancement/detachmentAbility cross-references).
  **The detachment `dp`/`disposition` placeholders and the empty `canBeLedBy` have since been
  closed against the MFM** and
  that README is stale on those points: all 15 Ork detachments now carry real values. The
  placeholders were badly wrong, not merely incomplete — 13 of 15 `dp` values and 12 of 15
  dispositions changed, including 7 detachments stored at `dp: 0`. Orks turn out to be almost
  entirely 1 DP (only War Horde is 3), which is why the guessed 2s and 3s looked plausible.
  `canBeLedBy` was nearly right and needed 3 fixes: `bannernob` added to `boyz`/`nobz`, and
  `beastboss-on-squigosaur` removed from `beast-snagga-boyz` (that datasheet has neither a Leader
  nor a Support ability, so it cannot lead anything). Orks now matches the MFM exactly, 41/41.

**Auditing `canBeLedBy` against the MFM.** Each unit block on an MFM faction page may carry a
`LEADER` *or* a `SUPPORT` tag, and the line right after it is the comma-separated list of units it
attaches to. **Both feed `canBeLedBy`** — the Core rules text stored on a Support datasheet says
so explicitly ("Both of these abilities allow such units to lead other friendly units"), and the
Ork data already mixed them. Reading only the `LEADER` tag reports every Support character as a
spurious extra. Two more traps, both hit on the first attempt here:
- A unit with tiered pricing has several `YOUR ... COST` headers, and only the first is preceded
  by the unit name; walking back from a later one yields a price line, which invents phantom units
  and truncates the real block. Skip a candidate name that looks structural (`N models`, a
  `(+N) N pts` price, another header).
- **Space Marines family swept too (2026-09-22)** — `space-marines.json` + the five chapter files,
  against all six MFM pages (every leader's list agrees across the pages it appears on). The 11th-ed
  PDF migration had emptied `canBeLedBy` on every core datasheet (Intercessors went from 32 leaders
  to 0; the leaks commit did not cause it), so no core Captain/Lieutenant/etc. could lead anything.
  38 bodyguard datasheets rewritten; cross-chapter leaders the MFM no longer lists (e.g. Azrael on
  Crusader Squad) and 5 dead ids with no datasheet anywhere were dropped. Four characters the MFM
  tags `SUPPORT` still carried the Core `Leader` ability — Cato Sicarius, Castellan, Crusade Ancient,
  Sanguinary Priest — and were switched to `Support`. Deliberately **not** touched: Imperial Agents
  Inquisitors in chapter `canBeLedBy` (not audited against the Agents page), and `captain-on-bike`
  on Outriders (user-confirmed, but the MFM has no Captain on Bike entry at all). **Datasheets the
  MFM lists that don't exist in our data**: Tactical Squad, Devastator Squad, Eradicator Squad,
  Lieutenant in Reiver Armour, Pedro Kantor, Uriel Ventris, Marneus Calgar in Armour of
  Antilochus — once one is added, give it the MFM's leader list too.
- The per-datasheet bodyguard list is **not** recoverable from our own JSON: the `Leader`/`Support`
  ability `description` holds the generic Core rules boilerplate, not the unit's own list. So
  `canBeLedBy` is the only place that knowledge lives, and the MFM tags are the only external
  cross-check. Orks could be confirmed two ways only because the *presence* of a Leader/Support
  ability is checkable locally.
- `scripts/space-marines-11th-ed-migration/` — same kind of rebuild, but for a **partial**
  PDF: `public/data/pdf/Space Marine Codex - 11th Edition.pdf` (72 pages, confirmed incomplete
  with the user) covers only the core/generic Adeptus Astartes content (army rules, 15
  detachments, 85 datasheets), not the full previous roster. Per explicit user instruction,
  this migration **replaced only the "core" slice** of `space-marines.json` with what the PDF
  actually contains and **left untouched** everything chapter-locked to Dark Angels, Deathwatch,
  Space Wolves, Black Templars or Blood Angels — so `space-marines.json` became a mix of this
  new codex's core roster plus five untouched, differently-sourced chapter rosters. **Those
  five have since moved out into their own faction files** (see `scripts/sm-chapter-split/`
  and "Faction inheritance" below), so the mix now lives across six files rather than one, and
  a chapter file's text still comes from that older, different source — check which file a
  datasheet is in before assuming which codex printing its text came from. See that folder's README for the classification
  rule (`classification.json`), the same points-placeholder/heuristic-cross-reference caveats
  as Orks, and two real bugs this run found and fixed along the way (a `render-and-ocr.mjs`
  filename-padding bug, and a pre-existing `WeaponCard.tsx` invalid-HTML nested-button bug that
  no previously-existing datasheet happened to trigger).

**2026-09-22 detachment update, sourced from a pre-release preview, not the final codex.** GW
gave tabletopbattles.com a preview copy of the (at-time-of-writing still unpublished) full
11th-edition Codex: Space Marines, and that site published a "Detachment Focus" tactics-article
series (2026-09-19/20) covering every detachment across the core book and all five chapter
books. Every detachment id already existed in our data from the prior PDF migration + chapter
split above — this pass was a reconciliation against those articles, not a from-scratch import,
run as six parallel agents (one per faction file: `space-marines.json` + the five chapter
files). Real drift found and fixed: several `space-marines.json` core detachments (Assault/
Tactical/Devastator Brethren, Terminator Storm Force, Tacticus Attack/Firestorm Force, Phobos
Shadow/Shock Force, Gravis Linebreaker/Siege Force, Ironclad Champions, Gauntlet Task Force) had
an empty `disposition` and `0`-cost enhancement placeholders, now filled in; Black Templars'
Faith-Fuelled Resolve was modeling the wrong stat entirely (+1 OC instead of a conditional +1 A);
Blood Angels' Wrath of the Doomed detachment ability was a stale prior-edition rule (Fanatical
Celerity) replaced with the new codex's actual rule (Sanguinius' Fury), and two Encarmine
Speartip enhancement costs were stale; Space Wolves' Champions of Fenris and Saga of the
Beastslayer each had one outdated mechanic detail corrected. Dark Angels and Deathwatch needed
no changes — already accurate from the prior pass.

**Two caveats future edits should know about:**
- **This is preview/provisional data, not the final published rules.** The source articles
  themselves say points and rules are "subject to change until published on Warhammer Community
  or the 40K App" — same caveat this file already carries for MFM points, but here it applies to
  the rule text itself, not just costs. Re-verify every Space Marines-family detachment
  (`space-marines.json` + `black-templars`/`blood-angels`/`dark-angels`/`deathwatch`/
  `space-wolves`) against the official codex once it actually publishes, the same way the MFM
  sweep already does for points.
- **The source is tactics journalism, not a verbatim rules reprint** — stratagem/enhancement/
  ability text was reconstructed from prose analysis (mechanic described in sentence form, mixed
  with tactical commentary), not copied from a clean rules block, so wording may not exactly
  match the eventual official card text even where the mechanic itself is right. This pass was
  also **text/data only**: no `effect`/`options` (CombatEffect) fields were added for any of
  these detachments' stratagems/enhancements/abilities, so none of this new content is yet
  playable in Mathhammer — that's a separate future pass following the "CombatEffect authoring
  convention" below, best done only once the rules are confirmed non-provisional.
- **Dark Angels points + two rule details from a leak (2026-09-22), not the MFM.** Per explicit
  user instruction, `dark-angels.json` carries leaked 11th-ed prices that break the MFM-only rule
  below: Azrael 150, Lazarus 80, Asmodai 80, Ezekiel 110, Belial 100, Sammael 120, Deathwing
  Terminator Squad 190/380, Deathwing Knights 255 (1st unit), Ravenwing Black Knights 85 (3 models,
  1st-2nd units), Ravenwing Command Squad 115 (1st-2nd), Land Speeder Vengeance 150 (1st-2nd), and
  Inner Circle Companions set equal to `space-marines.json`'s Bladeguard Veteran Squad. The leak
  gave only one number per unit; the user's rule for the tiered units was "raise the other tiers by
  the same amount" (6-model tiers doubled), so every later-copy/6-model price is derived, not
  leaked. The leak also said Azrael's Lion Helm lost its 4+ invulnerable save, but the user chose
  to leave his rules untouched and change only his price. `outrider-squad`'s `canBeLedBy` was empty and is now
  `captain-on-bike`, `chaplain-on-bike` and `ravenwing-command-squad` (user-confirmed; the Command
  Squad is a Support unit for Outriders or Black Knights). The Deathwing
  plasma cannon is 0 pts, which is what the data already had. Re-check all of this against the MFM
  once it publishes.
- One of the parallel agents editing `space-marines.json` observed `defaultWeaponNames[].count`
  values elsewhere in that same file (and, it turned out, in the untouched `orks.json`) getting
  silently reset to `1` mid-task. The cause wasn't pinned down — no PostToolUse hook is
  configured in this project's or the global `.claude/settings.json`, so "a hook" was the
  agent's guess, not a confirmed cause — but the corruption was real (confirmed via `git diff`)
  and unrelated to this task's edits. `space-marines.json` was repaired in-place by the agent
  that noticed it; `orks.json`'s corruption was caught and reverted separately while reviewing
  this batch. If a future session sees unexplained `count: 1` resets on datasheet
  weapons after using the Edit tool, this is a known unresolved flake worth investigating
  properly rather than a one-off.

No test suite yet.

## Architecture

**Warhammer 40K 11th edition data consultation + army-building + damage-calculation app**, all in Spanish. `public/data/catalog/core-rules.json`'s `sources[].edition` field was bumped `10` → `11` across all 72 entries to match — that's a metadata label only; the rule/stratagem/glossary *text* itself hasn't been re-audited for 11th-edition content changes, since neither this file's history nor a live source for that verification is available here. Four areas, reachable from the nav bar (`Archivo` / `Ejército` / `Mathhammer`) and the home page:

1. **Catalog** (`Archivo`) — browse factions, datasheets, detachments, stratagems, enhancements.
2. **Reglamento** (core rules) — rules glossary, phases reference.
3. **Misiones** — primary/secondary mission card browser plus a mission matcher tool.
4. **Ejército** (roster/army builder) — create and edit army lists, with points, wargear, enhancements, and QR import/export. Requires a logged-in account (see Backend below) — lists are stored server-side per user, not in `localStorage`.
5. **Mathhammer** — probabilistic damage calculator between an attacker and defender unit, with a modifier panel for auras/stratagems/abilities.

### Data layer

All game data is JSON, hand-maintained directly — there is no CSV, no scraper, and no generator script (there used to be; the CSV source, the `modifiers.ts` combat-modifier catalog, and the build pipeline that folded one into the other were deleted once the JSON was verified correct and the app fully migrated onto it). The JSON *is* the source of truth: `public/data/factions/<slug>.json` (one per faction) + `public/data/catalog/factions.json` + `public/data/catalog/core-rules.json` + `public/data/catalog/phases.json` + `public/data/missions.json`. `src/infrastructure/data/useGameData.ts` fetches all of the faction/catalog JSON in parallel, flattens them into the `GameData` shape the app has always used, and exposes it via `GameDataContext` (read through `useGameDataContext()`). `src/infrastructure/data/useMissionsData.ts` separately fetches `missions.json` for the Misiones pages. `phases.json` (`PhaseData[]`, types in `src/types/index.ts`) used to be a static array in `src/core/constants/phasesData.ts`; that file now only keeps the `PHASE_GROUPS` display-order constant — the phase content itself moved to JSON so the chat backend (`server/src/lib/gameDataIndex.js`) can read it too, same as every other domain JSON file.

### Faction inheritance (Space Marines chapters)

Most factions are self-contained, but the five Space Marines chapters with their own
detachments are **child factions of `space-marines`**: `black-templars`, `blood-angels`,
`dark-angels`, `deathwatch` and `space-wolves` each have a real entry in `catalog/factions.json`
and a real `public/data/factions/<id>.json`, but **that file holds only what the chapter adds —
never a copy of the parent's content.** What a chapter can field is "its own + the parent's",
applied at read time by `src/core/constants/factionFamily.ts` (`forFaction`,
`forFactionFromMap`, `datasheetsForFaction`, `belongsToFaction`, `isSameFactionFamily`). Use
those helpers instead of comparing `factionId` with `===` anywhere content is scoped to a
faction — a plain `===` silently drops everything a chapter inherits. `server/src/lib/
gameDataIndex.js` keeps its own copy of the same rules so the chat answers agree with the app.

Inheritance is one-way and has exactly one exception:

- The parent `space-marines` is the plain Codex army (67 generic datasheets **plus** the 18
  named characters of successor chapters that have no detachments of their own — Ultramarines,
  Imperial Fists, Iron Hands, Raven Guard, Salamanders, White Scars, listed as
  `SM_SUCCESSOR_CHAPTERS` in `chapters.ts`). It never sees a child's content.
- Those 18 successor characters are the exception: they belong to the parent alone and are
  **not** inherited, so a Dark Angels list can't field Marneus Calgar. This is why datasheets
  get `datasheetsForFaction`/`datasheetBelongsToFaction` while detachments, stratagems and
  enhancements use the blanket `forFaction`.
- `resolveCostsForFactionContext` in `roster.ts` decides "is this an ally?" with
  `isSameFactionFamily`, not `!==` — an inherited core datasheet inside a chapter roster is not
  an allied Assigned Agent, and pricing it as one picks the wrong tier.

**A `catalog/factions.json` entry without its `factions/<id>.json` file is an outage, not a
degraded state**: both `useGameData.ts` and `gameDataIndex.js` load one file per catalog entry,
and the backend does it with an uncaught `readFileSync` at module load — so the missing file
takes down auth and rosters along with the chat.

Rosters saved before the split all carry `space-marines`. `authThunks.ts` reassigns them on
login (chapter-specific detachment first, then any unit only one chapter can field, reading the
generated `smChapterDatasheets.ts` because rosters are fetched before `GameDataContext` holds
any datasheets); a roster naming two chapters at once is left alone rather than forced into one.

To correct or add data (fix a rule, add a new codex release, patch an errata), edit the relevant `public/data/factions/<slug>.json` (or `public/data/catalog/*.json`) file directly — there's no regeneration step to run afterward.

**For core game rules (not points — see the MFM rule below for those) this project's own JSON
(`public/data/catalog/core-rules.json`, `public/data/catalog/phases.json`, the relevant
`public/data/factions/<slug>.json`) is the source of truth to check first**, before memory or an
external wiki/search — the whole point of this app is that it already holds this data. Only fall
back to an external source (the official Warhammer Community core rules, Wahapedia as a secondary
cross-check) when the specific rule genuinely isn't represented in the JSON, and when that happens,
add the missing rule into the appropriate JSON file rather than only hardcoding it into application
logic, so the next lookup doesn't have to leave the project again. **Known gap, not yet closed:**
`maxCopiesAllowed` in `src/core/utils/roster.ts` (the battle-size duplicate-datasheet cap — how many
copies of the same datasheet a roster may contain, doubled for Battleline/Dedicated Transports) was
hardcoded from memory with the wrong numbers (every role capped identically, no Battleline doubling)
and had to be corrected via a live web search, because neither `core-rules.json` nor `phases.json`
documents this rule anywhere — it exists only as a hardcoded table in `roster.ts`, not as project
data. Adding it to `core-rules.json` (or `phases.json`, alongside the other army-composition/battle-size
content) is the right follow-up next time this area is touched, so this rule stops depending on
memory or an external lookup entirely.

**Points values (`pointsCosts`/`wargearCosts`) must always be sourced from the official Munitorum
Field Manual at https://mfm.warhammer-community.com/en** (GW's own canonical, actively-maintained
points reference — v1.4 as of this writing) — never from a third-party wiki (Wahapedia etc.) or
from memory, and never trust one of those against the MFM without rechecking: doing exactly that
during the Imperial Agents fix below (sourcing the "Assigned Agent" prices from Wahapedia instead
of the MFM) produced several outright wrong values that had to be corrected a second time once
the MFM was actually checked — including two vehicles (Imperial Rhino, Inquisitorial Chimera)
Wahapedia showed with an Assigned Agent price hike that the MFM shows has no such distinction at
all. **This site is a client-rendered SPA — `curl`/`WebFetch` return an empty shell with no
prices in it, and asking WebFetch's summarizer model to read it anyway produces confident-looking
but fabricated numbers (caught by their being internally implausible, e.g. a 175-point Rhino) —
you must render it with a real browser to get the actual table.** A headless Chromium works: the
sandbox has one preinstalled (see the environment's own Playwright note), reachable from a plain
Node script even without a local `playwright` install —
`import { chromium } from '<global node_modules path>/playwright/index.mjs'`, launched with
`executablePath` pointing at the preinstalled browser binary and `args: ['--ignore-certificate-errors',
'--proxy-server=<the sandbox's HTTPS_PROXY value>']` (the outbound proxy's CA isn't in Chromium's
trust store) — then `page.goto(...)`, `page.waitForTimeout(...)` for the client render, and
`page.innerText('body')` to get the real text. On the Imperial Agents faction page specifically,
the plain-text dump lists every unit **twice**: the first pass (right after `UNITS`) is the
native "AGENTS OF THE IMPERIUM Detachment" price, the second pass (right after `EVERY MODEL HAS
THE IMPERIUM KEYWORD`) is the "Assigned Agent" (ally) price — diff the two passes per unit rather
than assuming a unit that only appears to differ actually does (most units repeat the identical
number in both passes; only some genuinely differ, and one — Exaction Squad — is actually
*cheaper* as an Assigned Agent, so don't assume the ally price is always the higher one).

**A full `pointsCosts` audit against the MFM (every non-Legends faction page, all 23 factions in
`catalog/factions.json`) was run once, catching real bugs beyond the two above.** The recurring
shapes, all worth checking for again on any future faction edit:
- **A per-copy surcharge tier (the `"(2nd+ unit)"`-style split) silently missing entirely** —
  the JSON has one flat price where the MFM has two (e.g. Adeptus Custodes' Allarus Custodians/
  Vertus Praetors, Chaos Daemons' Fiends/Poxbringer/Contorted Epitome, Orks' Painboss/Beast Snagga
  Boyz, several Chaos Space Marines squads also used by Chaos Daemons/Chaos Knights as allies).
  This is the single most common bug shape found — always check whether the MFM shows one
  "YOUR ... COST" block or two before trusting a single stored price.
- **A titanic super-heavy off by roughly a missing leading digit** — Adeptus Titanicus' four
  Titans, Aeldari's Revenant/Phantom Titan, and T'au's Manta were all stored at 1/10th to 1/20th
  their real MFM cost (e.g. 100 stored vs. 1,100 actual). Sanity-check any suspiciously round,
  suspiciously low price on a unit that fluffed-wise should cost a four-figure sum.
- **A plain typo in the model-count label** — Orks' Gretchin was mislabeled "11 Gretchin" for
  what both the points (80) and the MFM agree is a 20-model unit, which would silently break
  `resolveModelCount`'s match for a 20-model roster entry.
- **`space-marines.json`'s ~85 "core" datasheets from the PDF migration (see that migration's
  README, referenced above) were still carrying the literal placeholder `pointsCosts` entry
  `"Sin puntos oficiales para esta edición del codex todavía"` / `0` pts** — the PDF used for that
  migration didn't include a points section. All of them now have real MFM values; the migration's
  own README is stale on this point and should be treated as historical, not current. A same-named
  datasheet that's chapter-locked (Blood Angels/Dark Angels/Space Wolves/Black Templars/
  Deathwatch) is priced from that chapter's own MFM page, not the core `space-marines` one — check
  `factionKeywords` for a chapter tag before assuming which page applies. Two space-marines.json
  entries remain genuinely unresolved and are not bugs: `kaius-konorius` has no published points
  anywhere on the MFM (current or Legends) — the placeholder is accurate, not stale, for now — and
  `marneus-calgar` no longer matches any current-or-Legends MFM entry under that plain name (the
  MFM only has "Marneus Calgar in Armour of Antilochus", a Legends-tagged variant with a different
  loadout than what's stored) — this needs a content/identity check, not just a price swap, before
  touching it.
- **A cross-faction ally copy (an "Assigned Agent"-style datasheet duplicated verbatim into
  another faction's own JSON, e.g. Genestealer Cults' `-genestealer-cults`-suffixed Astra
  Militarum/Tyranids units, Chaos Knights'/Chaos Daemons' Chaos Space Marines allies, Drukhari's
  Harlequin units now folded into the Aeldari book, Imperial Knights' Adeptus Mechanicus allies)
  drifting out of sync with the source faction's own, correctly-updated copy** — verify against
  the *actual* home faction's MFM page, not the borrowing faction's own (which usually doesn't
  list the unit at all). Genestealer Cults' copies of ~25 Astra Militarum vehicles/squads
  (Leman Russ variants, super-heavies, Chimera, Taurox, etc.) had drifted the furthest — stale
  single prices with the tier split missing entirely, in some cases by 20-40 points.
- A handful of "not found on this faction's own MFM page" hits are just a **plural/singular or
  apostrophe-style name mismatch** with an already-correct price (Aeldari's "Vypers" vs. MFM's
  "Vyper", Death Guard's "Myphitic Blight-hauler" vs. MFM's "-haulers", Orks' "Big'ed Bossbunka"
  which only appears under the MFM page's "Show Legends" toggle at an unchanged price) — confirm
  the price via a name-insensitive cross-check before treating these as bugs.
- Enhancement/Stratagem/detachment-DP costs were spot-checked (Adeptus Custodes, all clean) but
  not swept with the same rigor as datasheet `pointsCosts` — a dedicated pass here would need a
  parser that normalizes MFM's typographic apostrophes/special characters (Ø, ê, ë) against this
  app's plain-ASCII ones first, since a first attempt at this produced mostly false "not found"
  hits from that encoding mismatch rather than real gaps. **Orks has since been swept** (see the
  migration note above). Each MFM faction page ends with a `DETACHMENTS` section that carries
  both the DP cost and the Force Disposition, one block per detachment, in the shape
  `NAME` / `<n>DP` / one line per disposition / `ENHANCEMENTS` — so `dp` and `disposition` are
  both checkable from the same render that the `pointsCosts` sweep already does. Re-render before
  trusting a surprising result rather than assuming a parser bug: Orks really does come back as
  14×1 DP, and two renders agreed.
- **A `disposition` holding two values is a real array**, e.g. `["PRIORITY ASSETS", "TAKE AND
  HOLD"]` — `dispositionList` (`src/core/constants/missionDeckColors.ts`) splits an array and
  nothing else, so a comma-joined string would render as one badge with the comma inside it. The
  dataset is already consistent here (5 two-disposition detachments — Space Marines' Gladius Task
  Force and Blade of Ultramar, Blood Angels' Angelic Inheritors, Deathwatch's Black Spear Task
  Force, Orks' War Horde — all arrays; 234 single strings; 0 comma-joined). Match the Space
  Marines entries when adding another. Beware of auditing this with `set[det.disposition]` as an
  object key: JS coerces an array to `"A,B"`, which makes correct array entries look like
  comma-joined strings — that misreading briefly landed in this file as a fake bug report.

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
Claude API (`@anthropic-ai/sdk`, model `claude-haiku-4-5` — tool-calling + formatting JSON into
prose, not deep reasoning, so Haiku's cost fits the task) with a fixed set of tools
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
startup; searches are case/accent-insensitive substring matches, and faction-scoped lookups
walk the parent/child family — see "Faction inheritance" above). List-returning tools
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

Two migrations live in `authThunks.ts`, both applied to rosters as they're fetched. The first
reassigns pre-chapter-split Space Marines rosters to their chapter faction (see "Faction
inheritance" above). The second is a courtesy import: if an account has zero rosters on the backend
and the browser still has pre-login rosters under the legacy `cogitador-consulta-rosters` key,
`login()`/`register()` adopt them into the account (via `PUT`) once, then delete the legacy key.

**Sync to backend** (`src/store/rosterSyncMiddleware.ts`): a Redux middleware, not thunks
threaded through every call site. It watches every `roster/*` action (except
`hydrateRosters`/`resetRosters`, which move data *from* the server or clear it), and — only
when `auth.token` is set — debounces a `PUT /api/rosters/:id` of the affected roster (id read
off `action.payload.rosterId ?? action.payload.id`), or fires `DELETE` immediately for
`deleteRoster`. This is why roster components (`RosterEditPage`, `AddUnitModal`, etc.) dispatch
the plain `rosterSlice` actions exactly as before — none of them know or care that a backend
exists.

`RequireAuth` (`src/shared/components/RequireAuth`) gates the `/roster/*` route subtree —
unauthenticated visitors are redirected to `/login` (preserving `?next=`); a token still being
validated by `bootstrapAuth()` shows `LoadingScreen` instead of bouncing. **`RequireAuth` only
waits for the auth check, not for `hydrateRosters`** — so a `/roster/:id` page can mount, and run
its first render, before any roster is in the store. Never seed editable form state from `roster`
in a `useState` initialiser there: the initial value is applied once, the guard's "Lista no
encontrada" early return happens after the hooks have run, and when the roster finally arrives the
draft is stuck at its empty starting value. `RosterEditPage`'s name/limit inputs keep their draft
as `string | null` (null = not being edited, render the live roster value) for exactly this reason
— they shipped blank on any connection slow enough to lose that race. `AccountMenu`
(`src/shared/components/AccountMenu`) in the header is a login link when logged out, or a
profile dropdown (avatar initial + username, click to reveal a "Cerrar Sesión" button) when
logged in — same open/close-on-outside-click pattern as `ThemePicker`, which it sits next to
in `AppShell`'s header. Session tokens (`server/src/auth.js`) last 1 year, meant to persist
per device until an explicit logout rather than silently expiring.

Implemented: create/edit/list rosters with points limits, detachment selection (with Detachment Points cost), enhancements, wargear-option legality enforcement and per-weapon surcharges, multi-tier unit costs, leader attachment, allies for Imperium factions, and import/export in Munitorum text format (plus BattleScribe/Listhammer and newrecruit.eu import) plus QR (scan or photo upload).

### Theme system

29 faction themes defined in `src/themes/themes.ts` (the 24 factions plus the five Space Marines chapter factions). Each theme is a set of CSS custom property values. `useTheme` (in `src/shared/hooks/useTheme.ts`) writes them to `data-theme` on `<html>`, which activates overrides defined in `src/index.css` under `[data-theme="<id>"]` blocks. Colors referenced in Tailwind classes (`bg-crimson`, `text-parchment-dim`, etc.) are CSS variables defined in `@theme` in `index.css` — they update automatically when the theme changes. Persisted to localStorage via `ThemePicker`.

### PWA (installable app)

The frontend is an installable Progressive Web App via `vite-plugin-pwa` (config in
`vite.config.ts`, `mode: 'generateSW'` — Workbox-generated service worker, not a hand-written
one). `registerSW()` (from the `virtual:pwa-register` module the plugin provides — typed via
`vite-plugin-pwa/client` in `tsconfig.app.json`'s `types`) is called once in `main.tsx` with
`{ immediate: true }`; it's a no-op in `npm run dev` (the plugin only emits a service worker for
production builds), so `npm run build && npm run preview` is the only way to actually exercise
install/offline behavior locally.

- Manifest (`manifest.webmanifest`, generated at build time from the `manifest` option in
  `vite.config.ts`) — name/short_name/colors/icons. `theme_color`/`background_color` are
  `#080808` (`--color-surface`), matching the app's dark shell regardless of the active faction
  theme.
- Icons live under `public/icons/` (192/512/maskable-512 PNGs + a 180px `apple-touch-icon.png`),
  generated from `public/favicon.svg` centered on a `#080808` square. They're not wired to any
  npm script — regenerate by re-running the puppeteer-based rasterization script used to create
  them (render the SVG in a sized `<body>` via `page.setContent` + `page.screenshot`; `puppeteer`
  is already a devDependency) if `favicon.svg` ever changes.
- Runtime caching (`workbox.runtimeCaching` in `vite.config.ts`): `/data/*` (the faction/catalog/
  mission JSON under `public/data`, ~15MB total) is `StaleWhileRevalidate` — served from cache
  instantly (and offline) once visited, refreshed in the background on every fetch, *not*
  eagerly precached on install (that data is excluded from `globPatterns`, which only precaches
  the built JS/CSS/HTML/icons — precaching the full 15MB would make the first install slow).
  `/api/*` (auth, rosters, chat) is `NetworkOnly` — those responses are per-user/dynamic and must
  never be served stale or offline.
- `registerType: 'autoUpdate'` means a new deployed build's service worker activates and reloads
  the page automatically on the next visit, without a manual "update available" prompt — there's
  no in-app update-toast UI.

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

**Back navigation in the catalog**: the datasheet/detachment lists link to detail pages with
router `state` (`CatalogBackState` in `routes.ts`: the list's `listFactionId`, plus `fromList`).
The detail page's back button ("← <Facción> · Datasheets/Destacamentos") pops history when it
came straight from the list (so filters survive — `FactionDatasheetsPage` keeps its role/search
filters in `?role=&q=` for this), otherwise pushes that faction's list; a chapter list opening
an inherited Space Marines entry goes back to the chapter list, not the parent's.

`RosterList`/`RosterEntry` types are in `src/types/index.ts`. Roster CRUD (`createRoster`, `deleteRoster`, `renameRoster`, `setPointsLimit`, `setDetachments`, `addEntry`, ...) lives in `rosterSlice.ts`; totals are recomputed on every entry mutation. The legacy single-`detachmentId` → `detachmentIds[]` shape migration now lives in `authThunks.ts`'s legacy-import path (see above) since that's the only place old shapes can still surface from.

Everything else (catalog, core rules, missions, mathhammer) is local component state / derived from `GameDataContext` — there's no global store for it.

### Army builder (`/roster`, requires login)

- `RosterListPage` / `RosterNewPage` / `RosterEditPage` — list, create, and edit rosters.
- `AddUnitModal`, `WeaponSelector`, `WeaponOptionsEditor`, `CostVariantPicker`, `DetachmentSelectModal`, `RosterEntryRow`, `RosterCard` — the editing UI: adding units, picking wargear loadouts/options, resolving cost variants (e.g. per-model-count pricing), selecting detachments, and rendering each entry.
- **Adding units is a modal (`AddUnitModal`), not an inline panel.** It used to be an always-mounted
  `AddUnitPanel` block at the bottom of `RosterEditPage`, with a *second* copy of itself inside a
  separate "Aliados" accordion; both are gone. The modal is full-screen on mobile and a centered
  `max-w-3xl` panel from `sm:` up, opened from the primary button in the sticky points bar (and
  from the empty-state CTA). It carries the live points budget in its own header — the page's
  sticky bar is behind the backdrop while it's open, so "quedan N pts" has to be repeated there or
  the player is picking blind. It stays open after each add (the per-datasheet `×N` badge is the
  confirmation) since adding several units in a row is the normal case. Its open state is a
  history entry (router `state.addUnit`), not a `useState`, so the browser/phone back gesture
  closes it back to the roster instead of leaving the page. Allies are a source
  switcher inside it, not a separate component — see the Imperial Agents bullet below.
- Both `AddUnitModal` (the unit picker) and `RosterEditPage`'s own entry list group datasheets into the same 4 GW-app-style display buckets — Personajes / Battleline / Transporte Dedicado / Otros — via `groupByRoleCategory`/`roleCategoryLabel` in `src/core/utils/roster.ts`, which bucket every raw `Datasheet.role` string (there are many more of these across factions than 4 - Fire Support, Transport, Fortifications, "Other Datasheets", etc. - see `ROLE_PRIORITY`) onto `ROLE_CATEGORY_LABELS`'s 4 labels, same priority order as `compareByRolePriority`/`rolePriority`. `AddUnitModal`'s filter tabs are these 4 categories (plus "Todos"), not one tab per raw role.
  **Known data gap:** `ROLE_PRIORITY` keys the transport bucket on the role string
  `'Dedicated Transports'` (37 datasheets across most factions), but `space-marines.json` came out
  of its PDF migration using `'Transport'` (8 datasheets — Rhino, Impulsor, …), which falls through
  to the default and lands them in "Otros", so "Transporte Dedicado" never renders for Space
  Marines. Not fixed here because `maxCopiesAllowed` doubles the duplicate-datasheet cap for
  Battleline/Dedicated Transports — renaming the role changes roster legality, not just grouping.
- Points math (`resolveCostsForUnitIndex`, `sumDetachmentPoints`, model-count resolution, rule selection caps) lives in `src/core/utils/roster.ts`; weapon-option/loadout parsing is in `src/core/utils/weaponOptions.ts`. Points are never cached on a `RosterEntry`/`RosterList` (no `pointsCost`, `wargearSurcharge`, or `totalPoints` fields) — `RosterEntry` only stores the player's choices (`modelCount`, `wargearSelections`, `weaponOptionSelections`, `enhancementId`). Every points figure is resolved fresh from the current `pointsCostMap`/`wargearCostMap`/`enhancements` at read time via `resolveEntryBaseCost` / `resolveEntryWargearSurcharge` / `resolveEntryEnhancementCost` / `resolveEntryPoints` (base + wargear, what the roster editor shows per unit) / `resolveEntryTotalPoints` (+ enhancement, for export text) / `resolveRosterTotalPoints` (whole-roster grand total) — all in `src/core/utils/roster.ts`. This means a correction to a datasheet's points in the JSON data is reflected on every saved roster immediately, with nothing to re-save; it also shrinks what's persisted (backend `PUT /api/rosters/:id`, QR payload).
- Imperial Agents datasheets (`public/data/factions/imperial-agents.json`) are the only ones that get taken as an ally into a foreign faction's roster (the "Agentes del Imperio" source tab inside `AddUnitModal`; `ALLY_FACTION_ID` and `canTakeImperialAgents` both live in `src/core/constants/allies.ts` — the id must match the faction JSON's own `id`, not GW's in-game "AoI" shorthand, which isn't a real `factionId` anywhere in the data), and *some* of them (not all — check the MFM per the rule above rather than assuming) are priced differently for that than for a native Agents of the Imperium army — GW's own "Assigned Agent" vs "AGENTS OF THE IMPERIUM Detachment" distinction, which isn't always a price *increase* (Exaction Squad's ally price is lower). This is encoded as a `"(Assigned Agent)"`/`"(...Detachment)"` annotation on the relevant `pointsCosts` entries — a separate trailing `(...)` group from the `"(2nd+ unit)"`/`"(1st to 3rd units)"` surcharge-tier suffix on the one datasheet needing both (Sisters of Battle Immolator: `"1 model (1st to 3rd units) (Assigned Agent)"`) — `parseTierRange` checks every parenthetical group in a description rather than assuming the tier is the only or last one, and `isAssignedAgentCost` matches the annotation anywhere in the string for the same reason. `resolveCostsForFactionContext` in `roster.ts` picks the right context by comparing the entry's datasheet `factionId` against the roster's own `factionId`, and every points-resolution call site (`resolveRosterTotalPoints`, `rosterExport.ts`'s export/import, `RosterEditPage`, `AddUnitModal`) filters through it before `resolveCostsForUnitIndex`. Skipping this filter at a new call site doesn't error — it just silently grabs whichever tier happens to sort first, so a roster's total quietly comes out wrong by the price gap (seen for real: an imported list with allied Inquisitorial Agents undercounting by exactly the Detachment/Assigned-Agent gap).
  **Which factions may take them** is `canTakeImperialAgents` in `src/core/constants/allies.ts`, a
  hand-keyed set of the 13 Imperium faction slugs. It must stay keyed on the slug ids from
  `catalog/factions.json`: this predicate previously read `THEMES.find(t => t.faction ===
  roster.factionId)?.group === 'imperium'`, but `Theme.faction` holds GW short codes (`'SM'`,
  `'AoI'`) and exists only as a display label for `ThemePicker`, so the lookup never matched, the
  flag was permanently `false`, and the allied-Agents picker had never rendered for any faction at
  all. Same trap `factionColors.ts` already warns about — never match a `factionId` against
  anything in `themes.ts`.
- Export to Wahapedia-style plain text (`sectionHeader`, `battleSizeLabel`, etc.) is in `src/core/utils/rosterExport.ts`. Text import (`RosterListPage`'s "Importar Lista" box) goes through `parseRosterText`, which dispatches by format: `parseMunitorumRosterText` (same file) handles the GW-app export plus its close cousins (Listhammer, BattleScribe, and their Spanish translations — all share one line grammar, distinguished by regex variants); `parseNewRecruitText` (`src/core/utils/parseNewRecruit.ts`, picked via `isNewRecruitText`) handles newrecruit.eu's export, a genuinely different line grammar (a "+"-bordered ALL-CAPS metadata banner, inline `: weapon, weapon` tails instead of separate weapon-bullet lines) kept in its own module for that reason. Both parsers funnel into the same `ParsedRosterText`/`ParsedUnit` shape, so `resolveImportedRoster` (datasheet/detachment/enhancement matching, wargear/weapon-option resolution, leader attachment) is format-agnostic and lives once in `rosterExport.ts`. Adding another source format means adding another `parseXText` producing that same shape, not touching `resolveImportedRoster`.
- QR import/export (`RosterQrExportModal`, `RosterQrScanModal`) round-trips a compact roster payload through `lz-string` compression + `qrcode.react` (render) / `qr-scanner` (scan) in `src/core/utils/rosterQrCode.ts`. There's also a BCP-list text importer (`src/features/mathhammer/utils/parseBcpList.ts`) that parses copy-pasted army lists.
- Enhancement-to-unit attachment rules are in `src/core/constants/enhancementAttachments.ts`.
- **Attached units: one leader + one support per bodyguard unit** (rule text: `core-rules.json`
  `UA012`/`000008346`/`CO054`). A character's kind comes from
  `attachmentKind` in `roster.ts` (Core `Support` ability → support, anything else — Core `Leader`,
  or an Enhancement-only attachment — → leader; no datasheet carries both). `isAttachmentSlotTaken`
  is the single check: `RosterEditPage` uses it to grey out a target whose slot for that kind is
  already filled ("líder/apoyo ocupado"), and `resolveImportedRoster` uses it so an imported list
  never stacks two leaders (or two supports) on the same unit. `setEntryAttachment` in the slice does
  not re-validate. The one "unless otherwise stated" exception in the data is T'au Kroot Carnivores
  (two non-duplicate leaders at 20 models), kept in `EXTRA_LEADER_SLOTS` — add any future one there.
  The GW app exports a support as `• Attached as: Support (Character)`; export writes the same
  label and the parser reads it (plus Spanish `Apoyo`) as `attachmentRole: 'Support'`. Mathhammer
  still models only one attached character (`?character=`).

### Mathhammer (`/mathhammer`)

Standalone feature folder at `src/features/mathhammer/`. Computes expected-value damage output (hits → wounds → saves → damage → Feel No Pain, with full probability distribution — stddev/percentiles/kill probability) for an attacker unit's weapons against a defender profile.

- `types.ts` — `CombatModifiers` (every numeric/boolean modifier a rule can apply), `ModifierRule` (a single rule's targeting conditions + effects, keyed by faction/detachment/enhancement/datasheet/leader/keyword), `DamageBreakdown` (per-weapon calculation output).
- `utils/deriveRules.ts` — derives the modifier panel's toggleable rule list directly from the `effect`/`options` fields on whichever Ability/Stratagem/Enhancement/DetachmentAbility are in scope for the current selection (see Data layer above) — there's no separate flat rule catalog. Also exports `isRuleApplicable` (+ its `RuleVisibilityContext`), the single predicate deciding whether a given rule is currently in scope (combat type, equipped enhancement, weapon-conditional keywords like Heavy/Lance/Torrent/Indirect/Psychic, ANTI-/target-/attacker-keyword requirements). `UnitPanel` uses it to build the rules it shows as toggleable, and `MathhammerPage` runs the player's *active* modifier ids through the same check before calling `resolveModifiers` — a rule can fall out of scope after being toggled on (e.g. switching the selected weapon from melee to ranged after activating a melee-only Ka'tah stance) without the player un-toggling it, so both call sites must agree on what counts as "applicable" or a hidden rule keeps silently contributing its effect.
- `utils/mathhammer.ts` — the core probability math.
- `components/`: `UnitSelector` (pick attacker/defender), `UnitPanel`, `ModifierPanel` (toggle applicable rules/stratagems), `DamageCalculator` + `GaussianChart` (results + distribution chart), plus `StatsBar`/`WeaponCard`/`AbilityList`/`StratList` variants local to this feature.
- `hooks/usePanelState.ts` — panel selection state, synced to the `?faction=&datasheet=&detachments=&character=&roster=` query params via `mathhammerAttackerPath`.
- **Default-active own abilities + sticky panels** (`MathhammerPage.tsx`): a selected unit's or
  attached character's own (non-`isOption`) ability rules — `ModifierRule.datasheetId`/
  `leaderDatasheetId` scoped, i.e. what `deriveModifierRules` derives from `selectedUnit.abilities`/
  `selectedCharacter.abilities` — turn on automatically instead of requiring a manual toggle click,
  the same way an equipped Enhancement's rules already auto-toggle. `ownAbilityIds()` computes this
  set; it seeds `attackerIdsArr`/`defenderIdsArr` when a unit first resolves with no saved
  per-unit localStorage state, and a pair of `useEffect`s mirror the existing enhancement
  auto-toggle pattern to add/remove a character's own ids the moment it's attached/swapped/detached.
  Stratagems, army rules, detachment abilities, aura-sourced abilities and mutually-exclusive
  `options[]` variants (e.g. Ka'tah stances) are deliberately excluded — those still need an
  explicit player choice. The attacker/results/defender columns (desktop 3-column layout) are each
  wrapped in `sticky top-10 max-h-[calc(100vh-2.5rem)] overflow-y-auto` (previously only the
  middle results column had this) so all three stay simultaneously in view, each scrolling
  independently; `UnitPanel`'s own header (`sticky top-0 z-10`) additionally stays pinned within
  that scroll so which side/unit you're on is never scrolled out of view by a long weapons/
  abilities list.

**`CombatEffect` authoring convention** — read this in full before adding/editing an `effect` on
an Ability, Stratagem, Enhancement or DetachmentAbility in `public/data/factions/*.json` (this
is the checklist a future codex import must follow — a two-pass full-game audit, see below,
found that skipping any one of these produces a real, silent mismodel, not just an incomplete
one). The payload must actually represent the ability's real text, and its scoping fields must
match who the text says benefits. Before touching the stored `effect` at all, read the real text
and independently work out from scratch what it *should* be — don't start from "does the stored
value look plausible."

- `effects` should only use `CombatModifiers` keys that represent what the rule text describes.
  If the text describes something this app doesn't model in `CombatModifiers` (Leadership,
  healing wounds, Lone Operative, Objective Control, a SET/override of a named characteristic
  rather than a relative modifier — "change the Damage characteristic of that attack to 0/1", a
  condition tied to one specific dice-roll outcome like "on a Critical Wound", a per-attack
  numeric comparison like "if this attack's Strength is greater than the target's Toughness"),
  **do not** invent a loose substitute modifier — leave `effect` off entirely (or leave that one
  sub-clause unrepresented, if the rest of the ability *is* representable) rather than attach a
  wrong one. A stored `strengthMod`/`hitMod`/`damageReduction` that doesn't correspond to the text
  is worse than no effect, since it silently mismodels the rule rather than just omitting it —
  and `damageReduction` in particular is a strictly *subtractive* modifier floored at 1 damage in
  `mathhammer.ts`, so it can never actually reach a "set Damage to 0" result no matter what value
  is stored.
- **"You can re-roll one Hit/Wound roll" (no "of 1") is a single-use reroll of any one die in the
  pool, regardless of what it shows.** This is a genuinely different mechanic from `rerollXOf1`
  (rerolls every qualifying die across the whole sequence that shows a natural 1) and `rerollAllX`
  (unlimited reroll of every die), and conflating it with either was tried and reverted twice
  before a precise, purpose-built mechanic was added: `rerollOneHit`/`rerollOneWound` in
  `CombatModifiers` (`src/types/index.ts`), applied in `mathhammer.ts` via
  `rerollOneBonus(p, n) = p * (1 - p^n)` — the exact expected-value gain from optimally rerolling
  one die in a pool of `n` i.i.d. Bernoulli(p) trials (reroll only if at least one die missed,
  `1 - p^n`, and the reroll itself succeeds with probability `p`). Exact for integer `n`, and a
  consistent expected-value extension for the fractional/dice-average `n` this engine already uses
  everywhere else (e.g. `D6` attacks). Use these two fields for this exact phrasing — don't fall
  back to `rerollXOf1`/`rerollAllX` as a stand-in, and don't leave the ability unmodeled either.
  Don't confuse this with "re-roll **a** Hit roll **of 1**" (note the "of 1") — that phrasing
  genuinely means "for every Hit roll that comes up a natural 1, you may re-roll it," which
  `rerollHitsOf1` represents exactly, no new mechanic needed. The tell is the word "of": "one Hit
  roll" (no value named) → `rerollOneHit`/`rerollOneWound`; "a Hit roll **of 1**" (a value named)
  → `rerollHitsOf1`/`rerollWoundsOf1`.
  There's no `rerollOneDamage` — only Hit and Wound are covered, since no audited ability needed it.
  **Always split `rerollOneHit`/`rerollOneWound` into separate `options[]` entries, one per reroll
  type, even when the ability's own wording grants both simultaneously with "and" rather than
  offering a choice with "or".** This was tried the other way first (a single combined `effect`
  with both fields set together for the AND-phrased case, keeping `options[]` only for the
  OR-phrased case) and reverted once it became clear the modifier panel needs each reroll type as
  its own independently toggleable button regardless of the ability's phrasing — for an AND-phrased
  ability (e.g. Code Chivalric: "you can re-roll one Hit roll and you can re-roll one Wound roll"),
  the user just toggles both of that ability's option-buttons on to get the full effect; for an
  OR-phrased ability (e.g. "re-roll one Hit roll, one Wound roll **or** one saving throw"), they
  toggle only the one they're choosing. Either way: one `options[]` entry per named reroll type,
  each carrying only its own field (and `bearerOnly: true` on each if the ability's wording
  restricts it, per the `bearerOnly` rule above) — plus, for the OR case, a no-op option for any
  named choice this app doesn't model (e.g. "saving throw" reroll has no corresponding
  `CombatModifiers` field), so the option list still accounts for every real choice without
  inventing an effect for the unrepresentable one.
- **"Select one of the following" / "select either X or Y" is always `options[]`, one entry per
  choice, never a single combined or single-branch effect.** This is the single most common
  authoring bug found across the whole dataset. Two sub-cases both need a split, but for
  different reasons:
  - A true either/or between **independent** abilities ("select either [LETHAL HITS] or
    [SUSTAINED HITS 1]", "improve BS by 1 or WS by 1") — each option should carry only its own
    branch's effect.
  - A **replacement** of the same field's strength under an escalated condition ("re-roll a Hit
    roll of 1; if X, you can re-roll the Hit roll *instead*", "[SUSTAINED HITS 1]; if Below
    Half-strength, [SUSTAINED HITS 2] instead") — this needs a base-tier option and an
    upgraded-tier option, **not** just the weaker tier kept alone (dropping the escalation
    understates the ability) and **not** both values summed into one effect (double-counts it).
  - Contrast this with a **genuine additive superset** — "add 1 to the Hit roll; add 1 to the
    Wound roll *as well* if [unrepresentable condition]" — where the correct move is the
    opposite: keep only the unconditional baseline field and drop the rarer conditional add-on
    entirely, with **no** options split (adding an "as well" option here would let a user
    incorrectly toggle the Wound bonus without the Hit bonus, or without the condition ever being
    checked at all). The tell: does the escalation replace the same field's *value*, or add a
    *different* field on top? Replace → options. Add-on to a real but unrepresentable condition →
    drop the add-on, no split.
- The schema's `requiresAttackerKeyword`/`requiresTargetKeyword`/`requiresAntiKeyword` are all
  **single-string only** — no AND/OR of two keywords anywhere in the dataset. If the text ORs two
  real keywords (**"MONSTER or VEHICLE"**, **"Infantry or Mounted"**, two named unit types that
  are each real, distinct, non-dominant keywords in this faction's own datasheets), and *neither*
  one covers virtually the whole eligible population by itself, **split into `options[]`, one per
  keyword** — do not collapse to whichever one keyword happens to be listed first (this was the
  single largest bug category found in the full-game audit: dozens of "vs Monster or Vehicle"
  abilities silently kept only the Vehicle branch). Collapsing to one keyword is only correct when
  that keyword is genuinely dominant (e.g. a chapter/legion `factionKeywords` entry that already
  covers ~100% of that book's roster, so the OR's other side is unreachable in practice) — check
  this against the faction's actual datasheet keyword lists, don't assume.
- If the text restricts who benefits ("friendly KHORNE unit", "select one enemy unit ... friendly
  ADEPTUS MECHANICUS unit that targets it", "if it is a VEHICLE model"), set
  `requiresAttackerKeyword` (restriction on who attacks) or `requiresTargetKeyword` (restriction
  on the target/defender) to that keyword, lowercased-compared against
  `[...datasheet.keywords, ...datasheet.factionKeywords]` in `UnitPanel.tsx`'s `visibleRules`
  filter. Note that for a `target: "defender"` rule, `requiresAttackerKeyword` and
  `requiresTargetKeyword` end up checking the *same* unit in practice — the defender panel's own
  `selectedUnit` (what `requiresAttackerKeyword` compares against) and the `defenderKeywords` prop
  every panel receives (what `requiresTargetKeyword` compares against) both resolve to whichever
  unit is loaded in the defender/right-hand panel — so either field works for a plain
  self-restriction; the choice only matters once `appliesToNearby` puts the rule on *other* units'
  panels (see below), where `requiresAttackerKeyword` is what actually gates who the buffed unit
  must be.
- **"Mark an enemy unit, then *that same marked unit's own future attacks* are debuffed"**
  (worded as "that unit is suppressed/stunned/prosecuted/pinned...; while a unit is
  suppressed/stunned/..., each time a model in that unit makes an attack, subtract 1 from the Hit
  roll") is **not representable at all, under any `target` value** — leave `effect` off entirely.
  This was traced through `deriveRules.ts`/`UnitPanel.tsx` directly: `target: "attacker"`
  (default) only ever applies the modifier when *this ability's own bearer* is the unit loaded as
  attacker; `target: "defender"` only ever applies it when the bearer is loaded as defender.
  Neither one reaches a dynamically-marked *third-party* unit's own attacks — there is no keyword
  or aura mechanism for "some other, arbitrarily-chosen unit's stats change," so every value tried
  (including `target: "defender"`, which looks plausible but is backwards for this exact shape)
  produces a real, wrong result rather than an incomplete one. Confirmed instances span at least
  11 factions and several different marking verbs — don't assume this is a solved/rare case.
- If the rule benefits a friendly unit **other than its own bearer** — a classic proximity aura
  ("while a friendly X unit is within 6\" of this model..."), a "mark an enemy unit, then units
  that attack it get +1" mechanic, or "pick one other friendly model within X\" and buff it" —
  set `appliesToNearby: true` so `deriveRules.ts`'s aura loop offers it on *other* units' panels,
  not just the bearer's own card. Leave it unset when the bearer is the only beneficiary.
  `appliesToNearby` is **only consulted on datasheet Abilities** — the aura-scan loop never reads
  Enhancement/Stratagem/DetachmentAbility entries, so setting it there is a silent no-op. (An
  Enhancement that buffs a nearby *other* unit doesn't need the flag at all: its effect already
  surfaces on whichever unit is loaded wherever that specific `enhancementId` is selected — just
  set the right keyword restriction.)
- If the ability's own wording is "this model"/"the bearer" (not "models in this unit") **and**
  the bearer's datasheet has the Leader ability (can attach to and lead another unit), set
  `bearerOnly: true` — otherwise the Mathhammer calculator lets the bonus leak onto the whole
  attached unit's attacks instead of just that one character's own. This is only consulted on the
  **attacker** side of the calculation (`MathhammerPage.tsx` splits `attackerBearerMods` out
  separately; the defender side applies all matching rules unfiltered), so it's a no-op to set on
  a `target: "defender"` effect — don't add it there even if the text says "the bearer."
- "[IGNORES COVER]" on the bearer's own attacks → `bsMod: -1`, no `target` (defaults to attacker).
  "Stealth" / "this unit has the Benefit of Cover against ranged attacks" → `hitMod: -1`,
  `target: "defender"`, **no** `combatType` — never `bsMod` for either of these (a recurring
  copy-paste error: `bsMod` improves the *bearer's own* Ballistic Skill, which has no defensive
  meaning at all when paired with `target: "defender"`).
- "You can ignore any or all modifiers to the Hit roll [and/or BS/WS]" → `hitMod: 1` only. If the
  *same sentence* also explicitly extends the ignore-modifiers grant to the Wound roll and/or AP,
  add `woundMod: 1`/`apMod: 1` too — but only for what's explicitly named in that sentence, never
  invented from a broader "ignore any modifiers to ... any roll or test" phrasing.
- A stratagem worded "WHEN: opponent's Shooting/Fight phase, just after the enemy selected
  targets... EFFECT: your unit has a X+ invulnerable save" is a **reactive** grant → always
  `saveMod: 1` regardless of the stated X, never `feelNoPainThreshold`. An ability granting a
  **permanent**/leader/aura/self-declared-per-phase invulnerable save (not a reactive
  "just after enemy targets" trigger) → always `feelNoPainThreshold`, never `saveMod`. The
  distinguishing feature is the reactive-vs-permanent trigger *shape*, not whether the source is a
  Stratagem or an Enhancement/Ability — a reactive Enhancement follows the Stratagem rule too.
- Always double check `combatType` (`'melee'`/`'ranged'`/omitted = either) and `target`
  (`'attacker'`/`'defender'`, defaults to `'attacker'` if omitted) match the text — including
  *duration*, not just the trigger phase: an effect whose WHEN clause fires in one phase but whose
  wording says "until the end of the turn" (rather than "until the end of the phase") carries over
  into whichever phase comes next before that turn ends, so a `combatType` restricting it to only
  the triggering phase's attack type is usually wrong.
- Army-rule-shaped abilities (`Ability`/`DetachmentAbility` entries that apply to the whole
  faction, e.g. Doctrina Imperatives, Harbingers of Dread, Cabal of Sorcerers, Code Chivalric) are
  frequently **denormalized** — the same `id` repeats once per datasheet that carries the ability,
  but only the first occurrence (usually inside `armyRules[]`) actually carries the `effect`/
  `options`; the rest are bare `{id, name, description, type}` stubs with no effect data at all.
  When editing one of these, check every occurrence's shape before assuming the `id` is unique
  (a plain-text search will find several near-identical hits) — editing the wrong occurrence is a
  silent no-op, not an error.

A two-pass audit covering all ~1858 `effect` entries across every faction (first a pattern-based
sweep for known bug shapes, then a from-scratch, independent-re-derivation re-audit once the
first pass turned out to be missing real bugs by only checking against a list of already-known
shapes) found roughly 330 mismodeled entries spanning every rule above — `scripts/
audit-combat-effects.mjs` (see "One-off data script" above) is the tool that made re-checking
this systematically, faction by faction, possible, and is the right starting point for auditing
any faction this hasn't already been run against (e.g. right after importing a new codex).

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
- Roster-specific: `AddUnitModal`, `WeaponSelector`, `WeaponOptionsEditor`, `CostVariantPicker`, `DetachmentSelectModal`, `RosterCard`, `RosterEntryRow`, `RosterQrModal/*`.
- Mission-specific: `PrimaryMissionSections`, `MissionActionBox`.
