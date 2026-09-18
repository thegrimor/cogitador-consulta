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

- **Phase 2 (done, staged in `phase2-data.mjs`): 85 datasheets**, every one of the book's 72
  pages read visually against the rendered PNG (not OCR alone — weapon/model stat tables are
  explicitly unreliable under OCR, see `../pdf-codex-tools/README.md`). Covers every named
  character (Guilliman, Calgar, Tigurius, Cato Sicarius, chapter-flavoured named characters
  that aren't one of this app's 5 protected chapters — Kor'sarro Khan, Vulkan He'stan, Kayvaan
  Shrike, etc.), the full generic troop/elite roster (Intercessor/Assault Intercessor/Heavy
  Intercessor/Hellblaster/Sternguard/Vanguard/Scout/Terminator squads and their variants), and
  vehicles through Rhino/Impulsor/Repulsor/Land Raider variants/Dreadnoughts/Storm
  Speeders/Land Speeder/the Gladiator family (the PDF's last page). Uses `helpers.mjs`
  (adapted from the Orks migration's `weapons()`/`models()` compact-line parsers, unchanged,
  plus a `core()` ability lookup sourced from every ability already in the kept/protected
  portion of this same file, and an `armyRule()` helper embedding Phase 1's army-rule text).

- **Final assembly (done, `build-final.mjs`):** merges kept-protected + new content and writes
  `public/data/factions/space-marines.json` directly (**not idempotent against its own
  output** — it reads `currentSM` from that same file, so re-running it after a prior run
  requires the already-merged new army rules to be excluded from "kept" by id, not just by the
  general protected/core classification the other collections use; datasheets/detachments/
  enhancements/stratagems don't have this problem since their new ids never match the
  classification's "protected" criteria). Final counts: **165 datasheets, 45 detachments, 130
  enhancements, 193 stratagems, 8 army rules.** Stratagem/enhancement/detachment-ability
  cross-referencing against the new datasheets is the same best-effort keyword heuristic as the
  Orks migration, broadened to also match `<b>WORD</b>` (this migration's own text mixes that
  with `<span class="kwb">`, since neither is required for `ruleHtml.ts`'s auto-highlighting to
  work) — avg. 7.8 stratagems, 7.8 enhancements, 1.8 detachment-abilities per new datasheet.
  `canBeLedBy` is left empty for every new datasheet, same known gap as the Orks migration (not
  printed per-character in this simplified card layout).

- **Verified in the running app** (`npm run dev` + Playwright): the datasheets list, a new
  character page (Roboute Guilliman), a new squad page (Intercessor Squad, wargear options +
  points placeholder), a new detachment page (Gladius Task Force — enhancements, stratagems,
  correct `type` display string), a preserved Blood Angels detachment still present
  ("The Angelic Host"), and Mathhammer with a new-detachment unit selected. No console errors
  after the fixes below.
  - Found and fixed a real pre-existing bug this migration was the first to surface broadly:
    `WeaponCard.tsx` nested an interactive `<button>` (the "Se movió" HEAVY-weapon toggle)
    inside the card's own outer `<button>` — invalid HTML, React hydration error, browser
    silently reparents the inner button breaking its click target. No datasheet already in the
    app happened to have a `[HEAVY]` weapon exercising that exact code path; this codex's
    generic troops (Intercessor Squad, Heavy Intercessor Squad, etc.) do. Fixed by changing the
    inner control to a `role="button"`-accessible `<span>` (`src/features/mathhammer/components/
    WeaponCard/WeaponCard.tsx`).
  - Found and fixed a formatting bug in this migration's own `phase1-data.mjs`: stratagem
    `type` strings were built as `<kebab-detachment-id>::<category> Stratagem` instead of
    matching the existing convention (`<Detachment Display Name> – <category> Stratagem`, en
    dash) — fixed by having `detachment()` register its display name for `stratagem()` to look
    up.

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
