# Reading GW codex/faction-pack PDFs into this app's JSON schema

A general playbook, written after doing this once by hand for the Orks 11th-edition codex
(`scripts/orks-11th-ed-migration/`, ~184 pages, 54 datasheets). Read this before starting the
next one — it should turn a multi-hour, mostly-visual transcription job into a much shorter one
where most of the token spend goes to *writing the JSON*, not *reading the PDF*.

This file covers the PDF-reading/OCR mechanics specifically. For the full end-to-end migration
checklist (full-replace-vs-patch decision, what to check in the PDF before starting, points
handling, and a data-quality trap worth avoiding up front), see **`CODEX-MIGRATION-PROCESS.md`**
in this same folder.

## The core problem

GW's codex PDFs use a custom embedded font for the datasheet "card" pages. In at least the
Orks 11th-ed codex, that font's glyph-to-Unicode mapping is **broken for those pages
specifically** — `pdftotext` (any mode: plain, `-layout`, `-raw`) produces the same wrong
characters every time, e.g. "Might is Right: If this unit made a charge move this turn" comes
out as `"Might s Rlght lfth:s unit made a :harge move thcs turn"`. This is not a spacing/layout
artifact you can fix with flags — the text layer itself is wrong. Rules-prose pages (army
rules, detachments, stratagems, enhancements) are usually a *different*, undamaged font and
extract fine with plain `pdftotext`. **Always spot-check a couple of datasheet pages with
`pdftotext` before assuming the whole book is readable that way** — don't rediscover this from
scratch.

## The fix: OCR, not vision

Once `pdftotext` is confirmed broken on a page range, the fix is **not** to read page images
with Claude's vision (expensive, and what ate most of the tokens the first time around). It's
to OCR the rendered page images locally with Tesseract, which reads pixels and doesn't care
that the PDF's own text layer is corrupt.

### One-time setup (Windows, via winget — adapt for other OSes)

```
winget install --id oschwartz10612.Poppler -e         # gives pdftoppm (PDF -> PNG)
winget install --id tesseract-ocr.tesseract -e         # gives tesseract (OCR)
```

Both land outside PATH until a shell restart; `render-and-ocr.mjs` in this folder finds them at
their default winget install locations as a fallback, so you don't need to restart anything
mid-session.

### Running it

```
node scripts/pdf-codex-tools/render-and-ocr.mjs "path/to/codex.pdf" <firstPage> <lastPage> [outDir]
```

Renders each page to a 200dpi PNG and OCRs it, writing one combined `.txt` (page-marked) plus
the individual PNGs (kept, for the fallback below). PDF page numbers are usually offset from
the printed page numbers by the book's front matter (contents, foreword, etc.) — figure out the
offset once (open one PDF page, compare its printed folio number) and note it, since you'll be
converting back and forth constantly.

## What OCR is (and isn't) reliable for — read this before trusting its output

Tested against the Orks codex's most font-damaged pages: OCR reads **prose text — ability
descriptions, wargear options, unit composition, keywords, flavour text — almost perfectly**
(occasional character-level typos: "+1 to hit rolls" misread as "+10 hit rolls", stray
punctuation). That's the bulk of a datasheet's *word count*, so this alone eliminates most of
the token spend.

It's **unreliable for weapon/model stat tables**: OCR reads a table left-to-right, top-to-bottom
by visual position, and a multi-row weapon table with a right-hand abilities column next to it
gets its numbers and names shuffled out of row-alignment (worse on pages with many weapon
profiles, like squad datasheets with 10+ weapon options, than on single-model character pages).
**Don't trust OCR'd numbers in a table without cross-checking them.**

### Recommended workflow

1. `render-and-ocr.mjs` the whole datasheet page range in one go.
2. Read the combined OCR `.txt` (cheap — it's just text) to pull out ability text, wargear
   options, unit composition, keywords almost verbatim. This is most of the work.
3. For the weapon/model stat tables specifically: either (a) view the actual PNG for that page
   with the Read tool (only that one page, not the whole range — far fewer tokens than viewing
   every page for everything), or (b) go further and reconstruct the table programmatically —
   `tesseract page.png out tsv` emits a TSV with per-word bounding boxes
   (`left`/`top`/`width`/`height`/`conf`/`text` columns); since every datasheet page uses the
   same column template (name column, then RANGE/A/BS-WS/S/AP/D at roughly fixed X-offsets), a
   script that clusters words by row (`top`, with a tolerance) and assigns each to the nearest
   known column X-position should reconstruct weapon tables without any vision calls at all.
   **This wasn't built or tested this round** — worth doing before the next big datasheet-heavy
   migration, since it would close the last remaining token-cost gap.
4. Cross-check a handful of pages (not all of them) by comparing the OCR/reconstructed data
   against the actual rendered PNG, to calibrate how much you trust the rest.

## Authoring the JSON fast once you have the text

`scripts/orks-11th-ed-migration/build-phase2-datasheets.mjs`'s `weapons(...)`/`models(...)`
helpers parse a compact one-line-per-weapon/model string format (`"Name [TAGS]|RANGE|A|BS|S|AP|D"`)
into the full schema objects, including turning bracketed rule tags (`[RAPID FIRE 2]`,
`[LETHAL HITS]`, `[CLEAVE 1]`, etc.) into the right `Weapon` rule flags automatically. Reuse
that module directly (it's not Orks-specific) rather than hand-writing weapon objects — it cut
the amount of text needed per weapon by roughly 5x versus a full JS object literal, and it's
already been checked field-by-field against the exact string conventions the app's existing
faction JSON files use (e.g. `bsWs`/`invSv` store the bare digit, no `+`; weapon `range` strips
the inch mark but model `M` keeps it) — conventions that are easy to get subtly wrong by hand.

Similarly reuse `core()` (looks up a Core-type ability's full text from whichever other faction
JSON file already has it — this text is edition-wide boilerplate, not faction-specific, so
there's no reason to re-transcribe "Leader", "Deep Strike", "Feel No Pain X+", etc. by hand) and
watch out for the trap that bit this migration: not every generic-sounding ability is stored
with `type: 'Core'` — "Super-heavy Walker" turned out to be `type: 'Faction'`, duplicated
verbatim in `imperial-knights.json`/`chaos-knights.json`/`adeptus-titanicus.json`, so a
Core-only lookup missed it. Search **all** ability `type`s across every faction file for a name
match before concluding something needs transcribing from scratch.

## Points values

Codexes since ~10th edition generally do not print points at all anymore ("points values are
reviewed on a regular basis..." — they live in a separately-published points document/app).
Check for that disclaimer early (search the extracted text for "points values") rather than
assuming a missing price table is your extraction's fault. If no matching points source exists
for the specific codex printing you're working from, get explicit sign-off before inventing or
backfilling numbers from an older/different source, and mark whatever you do use as clearly
temporary in both the data (a distinguishable description string) and any commit/doc that
touches it.
