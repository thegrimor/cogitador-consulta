# Orks 11th-ed Codex migration (WIP)

Full rebuild of `public/data/factions/orks.json` from `public/pdf/11th Codex Orks.pdf`
(the actual 11th-edition Codex, not the old Faction Pack dataslate) — see conversation on
branch `orks-codex-11th-ed` for the decision record. Short version: the new codex redesigns
army rules, all 15 detachments, stratagems, enhancements and (next) datasheets wholesale, so
this is a full replace, not an incremental points patch. Nothing in this folder is wired into
the app (not under `public/data/`) until the final swap — the live `orks.json` is untouched
until then.

## Status: live (public/data/factions/orks.json has been replaced)

- **Phase 1 (done):** `armyRules` + `detachments` + `stratagems` + `enhancements`, transcribed
  from PDF pages 118–137 (printed) / 122–141 (PDF page numbers). Built by
  `build-phase1-detachments.mjs` → `phase1-detachments.json` (plain JS objects, not
  hand-written JSON, to make bulk edits easier — re-run the script after editing it).
- **Phase 2 (done):** all 54 `datasheets`, PDF pages 142–179. Raw transcription in
  `datasheet-notes-raw.md` (from rendering each page to PNG with poppler's `pdftoppm` and
  reading the image directly — `pdftotext` is unusable on these pages, its embedded-font
  decode is corrupted specifically there, confirmed across `-layout`/`-raw`/plain modes, e.g.
  "Might is Right" extracts as "Might s Rlght"; the rules/detachment pages extract fine with
  plain `pdftotext`). Encoded into `datasheets-data.mjs` via the compact weapon/model line
  parser in `build-phase2-datasheets.mjs`.
- **Final assembly (done):** `build-final.mjs` merges phase1 + the 54 datasheets, cross-references
  every stratagem/enhancement/detachmentAbility against each datasheet's keywords/name (best-effort
  regex heuristic — see caveat below), and writes `public/data/factions/orks.json` directly.
- **Verified working:** ran the app (`npm run dev` + Playwright) against the new file —
  `/catalog/factions/orks/datasheets`, `/catalog/factions/orks/detachments`, several individual
  datasheet pages (Warboss, Boyz, Gorkanaut), the War Horde detachment page, and Mathhammer with
  a Warboss selected. No console errors; weapon tables, abilities, wargear options, points,
  stratagems and the Mathhammer modifier panel (including an `appliesToNearby` aura ability)
  all rendered correctly.

To rebuild from scratch: `node build-phase1-detachments.mjs phase1-detachments.json && node build-final.mjs`
(datasheets-data.mjs is edited directly, not regenerated).

## Known gap: no points values

The codex explicitly does not print points costs, Detachment Points (DP), or the mission-system
`disposition` tag per detachment (pg 118: "we have not included points values ... points values
are reviewed on a regular basis" — they live in Warhammer 40,000: The App / a future points
release). Checked every page of the PDF (including the QR/app page at the very end) and both
other Orks "Faction Pack" PDFs in the repo (`public/pdf/eng_wh40k_faction_pack_orks-...pdf` and
`public/data/pdf/orks.pdf`, v1.2 and v1.1 respectively) — both are for the *previous* codex
generation's unit roster, not this one.

Per explicit user sign-off (this is a known-stale placeholder, not a verified value): where an
enhancement or detachment in the new codex shares its exact NAME with one in the old
`orks.json`, `build-phase1-detachments.mjs` copies that old `cost`/`dp`/`disposition` over as a
temporary number — same name, **not** verified same rules text, since several redesigned
units/detachments kept a flavour name while changing mechanically (e.g. the Warboss's whole
weapon loadout changed). Anything with no name match stays at `0`/`""`. Current tally: 13/38
enhancements and 8/15 detachments got a backfilled value this way; the rest are unmatched (new
detachments: Runt Swarm, Shoota Boyz, Wreckas, Madcap Meks, Flyboyz, Brute Bosses, Wurrband).
**None of these numbers should be trusted for an actual game** — replace them wholesale once a
points source that actually matches this codex printing exists. Phase 2 (datasheets) should
apply the same same-name backfill for per-unit points, for consistency.

## Known gaps / not verified (read before trusting this data for real games)

- **Points, Detachment Points, disposition:** still the known-stale backfill from the old
  codex described below — real, unverified numbers, not from this codex (which doesn't print
  them at all).
- **`canBeLedBy` is empty on every datasheet.** In this codex's simplified card layout,
  individual Leader characters do NOT print a "This unit can be attached to: X, Y, Z" line
  (checked directly against the rendered Warboss page image) — that pairing isn't recoverable
  from what's on the page at all. The Leader-attachment feature in the roster builder/army-list
  UI will not suggest any bodyguard units for any Ork character until this is filled in by hand
  (likely needs the core rulebook's separate leader-pairing reference, if this edition still
  ships one).
- **`stratagemIds`/`enhancementIds`/`detachmentAbilityIds` per datasheet are a heuristic
  match**, not hand-verified: `build-final.mjs` regexes each stratagem/enhancement/detachment-ability's
  keyword badges and matches them against each datasheet's own keywords/name. It doesn't
  understand "excluding X" exclusions or other prose nuance, so expect some false positives
  (e.g. a "TITANIC units excluded" stratagem may still get attached to a Titanic datasheet) and
  possible misses for oddly-worded restrictions.
- **`Super-heavy Walker` core ability** (Gorkanaut, Morkanaut, Stompa) has no match in the
  cross-faction core-abilities lookup (no other faction file has a super-heavy walker yet) — it
  ships as a flagged `[[TODO...]]` stub description pending real rules text.
- **`sourceId` is empty** and **`baseSize` is empty on every model except the Warboss (40mm)** —
  neither was captured/reliable from the page images at the transcription pass.
- A few individual items were flagged uncertain during transcription and encoded as my best
  reading rather than 100% confirmed — worth a second look against the PDF pages named:
  Morkanaut's "Big an' Shooty" ability wording (pg 171, PDF page 175), Runtherd's "That'll Learn
  Ya" D6 mechanic (pg 155/PDF 159 — encoded as a player choice, not a die-roll threshold), and
  the "[BLAST N]"/"[HUNTER: X]" weapon-rule tags generally, which are new to this codex and
  aren't in the app's `Weapon` rules schema (`isBlast` is a bare boolean, no stored magnitude;
  `HUNTER` profiles have no schema representation at all) — the full bracket text is preserved
  in each weapon's `description` for display, but nothing beyond `isBlast: true` is encoded
  structurally for `BLAST`, and `HUNTER` isn't encoded at all.

## Tooling note

`pdftoppm`/`pdftocairo` (poppler) got installed via `winget install --id oschwartz10612.Poppler`
mid-session. It's on PATH after a shell restart; until then the binaries are at:
`%LOCALAPPDATA%\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin\`

Render a page range: `pdftoppm.exe -png -r 200 -f <first> -l <last> "public/pdf/11th Codex Orks.pdf" out-prefix`
(PDF page N = printed page N-4 in this book).
