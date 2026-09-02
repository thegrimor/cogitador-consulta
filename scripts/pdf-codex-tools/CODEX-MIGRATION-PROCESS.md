# Full codex-migration process (checklist, for the next faction)

End-to-end write-up of the process used for the Orks 11th-edition codex migration
(`scripts/orks-11th-ed-migration/`, Sept 2026) — kept as a step-by-step guide for the next time
a faction gets a real new-codex release (not a Faction Pack points/errata update). Read
alongside `README.md` in this folder (the PDF-reading/OCR mechanics specifically) and
`scripts/orks-11th-ed-migration/README.md` (the worked example's own notes and known gaps).

## 0. Decide: full replace, or incremental patch?

A **Faction Pack** (dataslate) only tweaks points/rules on top of an existing codex — patch the
existing `public/data/factions/<slug>.json` in place, same as every other Faction Pack commit in
this repo's history.

A **new Codex** redesigns the faction wholesale (new detachments, redesigned datasheets, new
wargear) — full replace is correct, *and safe*: the old file stays fully recoverable from git
history, "deleting" it costs nothing. Confirm which situation you're in by comparing detachment
names between the old JSON and the new PDF — if most names changed, it's a real codex. (For
Orks: 5 of 13 old detachment names carried over into the new codex's 15; that was enough
evidence on its own.)

Work on its own branch off `main`, not on top of an unrelated in-flight branch (a points-update
branch, a styling branch, etc.) — a full-faction-rewrite diff is large and deserves its own PR.

## 1. Check what's actually printed in the PDF before assuming anything

- **Points values**: recent-edition codexes (10th ed onward) generally print none at all —
  search the extracted text for "points values" early; the disclaimer ("...points values are
  reviewed on a regular basis...") is usually right there near the detachments section, and
  finding it early saves you from hunting for a table that doesn't exist. If a matching points
  source doesn't exist for *this specific codex printing* (an old Faction Pack for the
  *previous* codex generation does not count — check by content, e.g. do its detachment names
  match the new codex's), don't invent numbers without explicit user sign-off, and mark
  whatever you do use as visibly temporary (see §5).
- **Leader/Support attachment pairs** ("this unit can be attached to: X, Y, Z"): may not be
  printed per-character at all in a simplified card layout — checked directly against a
  rendered page image before concluding this, don't assume from the text extraction alone.
- **`pdftotext` reliability**: spot-check a rules/prose page *and* a datasheet/card page
  separately — they can use different embedded fonts, and only one might be corrupted. Don't
  assume uniform reliability across the whole book from a single sample.

## 2. Extraction: OCR first, not vision

See `README.md` in this folder for the full mechanics. Short version: if `pdftotext` is
readable, use it (free, exact). If not (a broken embedded-font glyph mapping — confirmed by
identical garbage across every `pdftotext` mode, not just `-layout`), render pages to PNG
(`pdftoppm`) and OCR them (`tesseract`) with `render-and-ocr.mjs` — this reads pixels, so a
broken text layer doesn't matter, and it's near-free token-wise for prose. Only fall back to
actually viewing page images (the expensive path) for the numeric weapon/model stat tables,
which OCR still garbles on dense pages.

**This tool didn't exist during the Orks migration** — that run read every datasheet page
visually, which is the reason it took as long as it did. Start with OCR next time.

## 3. Authoring the JSON

- Reuse `scripts/orks-11th-ed-migration/build-phase2-datasheets.mjs`'s `weapons(...)`/`models(...)`
  compact-line parsers rather than hand-writing full weapon/model objects — they encode the
  bracketed rule tags (`[RAPID FIRE 2]`, `[CLEAVE 1]`, ...) into the right `Weapon` fields
  automatically and already match this app's exact JSON conventions (bare digits for
  `bsWs`/`invSv`, no `+`; `range` without the inch mark; etc).
- Reuse `core()`'s cross-faction lookup for Core-ability text (Leader, Deep Strike, Scouts X",
  Feel No Pain X+...) instead of re-transcribing edition-wide boilerplate. **Search every
  ability `type` across every faction file, not just `type: 'Core'`** — "Super-heavy Walker"
  turned out to be stored as `type: 'Faction'` (duplicated verbatim in three Knight-type faction
  files) and a Core-only lookup missed it entirely.
- Build in a staging location outside `public/data/` (this repo used
  `scripts/<faction>-<edition>-migration/`) so the live app never serves partial/inconsistent
  data mid-build. Commit each phase separately (army rules+detachments → datasheets → points →
  leader pairs) so the work is reviewable and recoverable at every step, not one giant commit
  at the end.
- Run the app locally (`npm run dev`) and spot-check pages (a datasheet, a detachment, a
  Mathhammer calc with the new faction selected) after each phase, not only at the very end.

## 4. Strip flavor text from ability/enhancement/stratagem descriptions — do this DURING transcription, not as cleanup after

**This is the mistake this doc exists to prevent repeating.** The Orks migration's first pass
left in the PDF's narrative sentence at the start of every enhancement description — e.g.
`"Tribal legend speaks of a blood-slick choppa once owned by Grand Warboss Headwoppa. <span
class="kwb">ORKS</span> model only. If this unit made a charge move..."` — and this had to be
cleaned up afterward (`8be37ad`, "Strip flavor-text prefix from Orks enhancement
descriptions"). Checking the other 23 factions afterward confirmed this app's real convention:
**descriptions start at the mechanical rule text, not a flavor sentence** — most factions have
0 or single-digit occurrences out of dozens of entries; Orks was the *only* faction where it was
universal (38/38 enhancements). A few factions do have a smaller version of the same problem
(Emperor's Children 23/34, Death Guard 11/30) — those are pre-existing, not something to fix as
part of a new migration, but don't add to the pile.

**How to do it right the first time:** when transcribing an ability/enhancement/stratagem
description, drop everything before the sentence that starts the actual rule — in practice
that's everything before the first `<span class="kwb">...</span>` keyword badge, since a
mechanical rule opens on a keyword badge essentially every time in this game's writing style
(`ORKS model only`, `Once per battle, per unit`, `WHEN:`, etc. — the `WHEN:`/`TARGET:`/`EFFECT:`
stratagem format is a partial exception; those start with `<b>WHEN:</b>` instead, still not
flavor text). If you do end up needing to fix this after the fact instead: verify
programmatically first (confirm every entry actually contains a `kwb` span, and that the
prefix-to-strip cleanly ends in sentence punctuation) before mechanically stripping — check
against a stable count so you're not silently corrupting entries where the "flavor text" was
actually load-bearing rules content.

## 5. Points/DP/disposition — marking placeholders as placeholders

Whatever temporary numbers end up in the data (backfilled from an old codex by name-match,
supplied directly by the user, or inferred from a pattern), make the placeholder-ness visible
in the data itself, not just in a doc nobody reads mid-game:

- Use a `description` string that says so where the mapping was inferred/assumed rather than
  given directly, e.g. `"2 models (ASSUMED)"` — this renders directly in the app's cost-tier UI,
  so anyone building a list sees the caveat right where they'd use the number.
- Keep a comments-documented `*-overrides.mjs` data file (see
  `scripts/orks-11th-ed-migration/points-overrides.mjs` /`leader-overrides.mjs`) rather than
  editing the generated points/leader fields inline across 50+ datasheet objects — it keeps the
  provenance (what was given vs. inferred vs. assumed, and why) in one reviewable place, and
  makes it trivial to correct a single entry later without re-running the whole build.

## 6. Relational cross-references (`stratagemIds`/`enhancementIds`/`detachmentAbilityIds`/`canBeLedBy`)

- The keyword-heuristic matcher in `build-final.mjs` (regex over `<span class="kwb">` badges vs.
  each datasheet's own keywords/name) gets most of these right but doesn't understand
  "excluding X" exclusions or other prose nuance — treat its output as a good first pass, not
  authoritative, and say so in whatever ships.
- `canBeLedBy` (Leader/Support attachment) usually isn't derivable from the PDF text at all in a
  simplified card layout — get it from the user directly if they have another source (an app
  export, a wiki, personal knowledge) rather than guessing. When mapping a user-supplied
  shorthand name to a specific datasheet, resolve genuine ambiguity by elimination against the
  rest of their list where possible (e.g. a recurring unnamed third unit alongside two already-named
  ones) and flag it as inferred rather than silently picking one.

## Tooling reference

- `winget install --id oschwartz10612.Poppler -e` → `pdftoppm`/`pdftotext`/etc.
- `winget install --id tesseract-ocr.tesseract -e` → `tesseract` (OCR)
- Both land outside PATH until a shell restart; `render-and-ocr.mjs` finds them at their default
  winget install locations as a same-session fallback.
