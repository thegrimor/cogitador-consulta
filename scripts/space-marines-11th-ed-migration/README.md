# Space Marines 11th-ed core-codex migration (WIP)

Source: `public/data/pdf/Space Marine Codex - 11th Edition.pdf` — **72 pages, incomplete**
(confirmed with the user 2026-09-17: this is a partial PDF, ends mid-datasheet on page 72, not
the full book). Per explicit user instruction, this migration replaces the **core/generic**
portion of `public/data/factions/space-marines.json` with whatever this PDF actually contains
(even though that's less than what's there today), while leaving **Dark Angels, Deathwatch,
Space Wolves, Black Templars and Blood Angels** content completely untouched.

Nothing in this folder is wired into the app until the final swap — `space-marines.json` is
untouched until then.

## Scope decision

`classification.json` tags every current detachment/datasheet/enhancement/stratagem as
`protected` (chapters strictly ⊆ {Dark Angels, Deathwatch, Space Wolves, Black Templars, Blood
Angels}, or a chapter-flagged datasheet with one of those 5 as its second Faction keyword) or
`core` (everything else — generic Adeptus Astartes content, plus non-"big-5" chapter flavour
like Ultramarines/Iron Hands/Salamanders/Imperial Fists/Raven Guard/White Scars/Blood Ravens,
which this app never modeled as its own protected chapter). `protected` survives the migration
unchanged; `core` gets wholesale replaced by whatever's transcribed from the PDF — most of it is
simply **dropped**, since this PDF covers far less than the 22 detachments / 104 datasheets /
85 enhancements / 125 stratagems currently classified `core`.

| | Protected (kept) | Core (replaced/dropped) |
|---|---|---|
| Detachments | 30 | 22 |
| Datasheets | 80 | 104 |
| Enhancements | 98 | 85 |
| Stratagems | 145 | 125 |

Points/DP/disposition: the PDF prints none (confirmed — no "points value" text anywhere in the
72 pages). Per explicit user sign-off (2026-09-17), **no backfill** — everything new gets
`cost:0`/`dp:0`/`disposition:''` placeholders, not a name-matched guess from the data being
replaced (unlike the Orks migration, which did backfill).

## Status

- **Phase 1 (done, staged in `phase1-data.mjs`):** army rules + all 15 detachments this PDF
  covers (pages 3–18 / printed 158–173), each with its full rules/enhancements/stratagems.
  Transcribed by **visually reading every page image**, not OCR alone — OCR's own
  `DETACHMENT RULES` running-header count said 10 detachments; the real count, confirmed page
  by page against the rendered PNGs, is **15** (OCR silently merged several one-page
  detachments into their neighbours). This book's core army rules also replace the old
  `oath-of-moment` army rule (`Combat Doctrines` + `Transhuman Strategist` + `Librarius`); the
  other 5 existing army rules (`curse-of-the-wulfen`, `mission-tactics`, `templar-vows`,
  `assigned-agents`, `kill-team`) are chapter-specific and are untouched.
  - Detachment names, in book order: Gladius Task Force, Assault Brethren, Tactical Brethren,
    Devastator Brethren, Terminator Storm Force, Tacticus Attack Force, Tacticus Firestorm
    Force, Phobos Shadow Force, Phobos Shock Force, Gravis Linebreaker Force, Gravis Siege
    Force, Stormlance Task Force, Ironclad Champions, Gauntlet Task Force, Ironstorm Spearhead.
    Only 3 of these (Gladius Task Force, Stormlance Task Force, Ironstorm Spearhead) share a
    name with a detachment in the current data — this codex printing substantially redesigned
    the core detachment roster, not just refreshed points.
  - `CombatEffect` encoding: only added where an ability/stratagem/enhancement has a single
    clear numeric/boolean combat modifier (matches `src/types/index.ts`'s `CombatModifiers`).
    Movement/reserves/objective-control-only effects are transcribed as text but left without a
    structured `effect` — same as plenty of pre-existing entries in the untouched data.
  - Keyword styling: `src/core/utils/ruleHtml.ts` auto-links/colors "Adeptus Astartes" mentions
    and auto-badges `[BRACKETED]` ability terms **at render time**, from plain text — so this
    content does not need every keyword pre-wrapped in `<span class="kwb">`. Only wrapped where
    it matches existing precedent closely (the two-span "ADEPTUS ASTARTES" form) or where it's
    one of `ruleHtml.ts`'s `UNIT_TYPE_KEYWORDS` (gets a themed accent only if pre-wrapped).
  - Validated structurally (`node` sanity script): no duplicate ids, every
    enhancement/stratagem's `detachmentId` resolves to a real new detachment, counts match the
    page-by-page read (15 detachments / 32 enhancements / 48 stratagems).

- **Phase 2 (not started): datasheets.** The PDF's datasheet section runs pages 19/20–72
  (~55-62 units, characters first, ending mid-way through the Gladiator vehicle family on the
  last page). Needs the same per-page visual verification as Phase 1 — OCR undercounted
  detachments by 33%, and weapon/model stat tables are explicitly unreliable under OCR (see
  `../pdf-codex-tools/README.md`), so every datasheet's tables need a rendered-PNG cross-check,
  not just the OCR text.

- **Final assembly (not started):** merge Phase 1 + Phase 2 into `armyRules`/`detachments`/
  `enhancements`/`stratagems`/`datasheets`, keeping every `protected`-classified entry from the
  current file byte-for-byte, cross-reference stratagem/enhancement/detachmentAbility ids against
  the new datasheets (heuristic, same caveats as the Orks migration's `build-final.mjs`), write
  `public/data/factions/space-marines.json`, then verify in `npm run dev` (a datasheet, a
  detachment page, Mathhammer with a new-detachment unit selected) before considering this done.

## Tooling notes specific to this PDF

- No text layer at all (confirmed via `pdftotext`) — this is a fully rasterized/scanned PDF, not
  just broken-font datasheet pages like Orks. `extract-text.py` (Step 0 in the general README)
  won't help here either; every page needs `render-and-ocr.mjs` + visual spot-checks.
- Offset: PDF page N = printed page N+155 (confirmed via page 4's footer "159").
- `render-and-ocr.mjs` had a real bug, fixed in this session: it derived the rendered PNGs'
  zero-padding width from the requested page *range* (`last`), but `pdftoppm` actually pads to
  the digit-width of the PDF's total page count. Asking for early pages of a 72-page PDF (e.g.
  1-4) produced `page-01.png` on disk while the script looked for `page-1.png` and silently
  skipped every page. Fixed to discover the real filenames from the output directory instead of
  reconstructing them.
- Tesseract wasn't installed on this machine; `winget install --id tesseract-ocr.tesseract -e`
  needed an interactive UAC approval (silent/user-scope installs both failed) — installed to
  `C:\Program Files\Tesseract-OCR\tesseract.exe`, not the `%LOCALAPPDATA%` path
  `render-and-ocr.mjs`'s fallback guesses, so it only worked this session via a `PATH` prefix
  (`export PATH="/c/Program Files/Tesseract-OCR:$PATH"`) — worth updating the script's fallback
  guess, or just relying on a real PATH entry after a shell restart, next time.
