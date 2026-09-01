# Orks 11th-ed Codex migration (WIP)

Full rebuild of `public/data/factions/orks.json` from `public/pdf/11th Codex Orks.pdf`
(the actual 11th-edition Codex, not the old Faction Pack dataslate) — see conversation on
branch `orks-codex-11th-ed` for the decision record. Short version: the new codex redesigns
army rules, all 15 detachments, stratagems, enhancements and (next) datasheets wholesale, so
this is a full replace, not an incremental points patch. Nothing in this folder is wired into
the app (not under `public/data/`) until the final swap — the live `orks.json` is untouched
until then.

## Status

- **Phase 1 (done):** `armyRules` + `detachments` + `stratagems` + `enhancements`, transcribed
  from PDF pages 118–137 (printed) / 122–141 (PDF page numbers). Output: `phase1-detachments.json`.
  Built by `build-phase1-detachments.mjs` (re-run it after editing the source data inside that
  script — it's plain JS objects, not hand-written JSON, to make bulk edits easier).
- **Phase 2 (not started):** `datasheets`. PDF pages 142–179 (~38 pages, 2 units/page for most
  infantry, 1/page for big characters/vehicles). **Important:** this PDF's embedded font is
  corrupted/scrambled in `pdftotext` output specifically on the datasheet pages (confirmed
  across `-layout`/`-raw`/plain modes — same wrong characters every time, e.g. "Might is Right"
  extracts as "Might s Rlght"). The rules/detachment pages extract cleanly with plain
  `pdftotext`; datasheets do not. Datasheets must be transcribed by rendering each page to a
  PNG (poppler's `pdftoppm`, installed via `winget install oschwartz10612.Poppler` — see PATH
  note below) and reading the image directly, not by trusting extracted text.
- **Phase 3 (not started):** backfill `effect: CombatEffect` coverage on whatever Phase 1/2
  entries don't have one yet (mirrors how this repo already did it once before, see git log:
  "Sube la cobertura de reglas de combate...", "Resolve the 47 orphaned per-datasheet
  combatEffects entries case by case").
- **Final step (not started):** merge phase1 + phase2 datasheets into one object matching
  `public/data/factions/orks.json`'s existing top-level shape (`id, name, armyRules,
  detachments, stratagems, enhancements, datasheets`), replace the live file with it, delete
  this scratch folder.

## Known gap: no points values

The codex explicitly does not print points costs, Detachment Points (DP), or the mission-system
`disposition` tag per detachment (pg 118: "we have not included points values ... points values
are reviewed on a regular basis" — they live in Warhammer 40,000: The App / a future points
release). So in `phase1-detachments.json`: every enhancement has `cost: 0`, every detachment has
`dp: 0` and `disposition: ""`. These are real placeholders, not verified zeros — do not ship
without either a matching points source for *this* codex printing (the current
`public/pdf/eng_wh40k_faction_pack_orks-...pdf` is for the *previous* codex's unit roster and
does not line up with the redesigned units/detachments here) or explicit sign-off to leave them
blank.

## Tooling note

`pdftoppm`/`pdftocairo` (poppler) got installed via `winget install --id oschwartz10612.Poppler`
mid-session. It's on PATH after a shell restart; until then the binaries are at:
`%LOCALAPPDATA%\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin\`

Render a page range: `pdftoppm.exe -png -r 200 -f <first> -l <last> "public/pdf/11th Codex Orks.pdf" out-prefix`
(PDF page N = printed page N-4 in this book).
