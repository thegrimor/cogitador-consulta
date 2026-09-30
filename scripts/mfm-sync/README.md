# MFM sync methodology

How to audit `public/data/factions/<slug>.json` against the official Munitorum Field
Manual (MFM, https://mfm.warhammer-community.com/en) on points, detachment DP/disposition,
and leader (`canBeLedBy`) data. Written during the v1.4 → v1.5 sync (2026-09-30); reuse this
file verbatim for the next MFM version bump instead of re-deriving the approach from scratch.

## Why this exists

Past MFM syncs (v1.2, v1.3, the full 29-faction `pointsCosts` audit, the `canBeLedBy` sweep —
see CLAUDE.md's "Points values" section and git history) were each done with a scraper script
written fresh in a scratch/temp directory and never committed — only the resulting JSON
corrections landed in the repo. This folder is the first attempt at keeping the *method*
around so the next sync doesn't start from zero.

## Step 1: Render the MFM (it's a client-rendered SPA)

`curl`/`WebFetch` return an empty shell — no prices, no detachments, nothing. You must render
it with a real browser. If a browser MCP tool is available in your session, use that. If not
(no browser tools, or they're disconnected), install Playwright's Chromium into a scratch
directory — do **not** add it to this project's `package.json`:

```bash
mkdir -p /path/to/scratch/mfm-check && cd /path/to/scratch/mfm-check
npm init -y && npm install playwright
npx playwright install chromium
```

Faction page URLs are `https://mfm.warhammer-community.com/en/<slug>`, and the slugs match
this app's own `catalog/factions.json` faction ids almost exactly — the one exception is
`adeptus-titanicus`, which the MFM splits into two separate pages, `chaos-titan-legions` and
`titan-legions` (audit both against the one `adeptus-titanicus.json` file).

Dump every faction page's full text to one `.txt` file per faction (`page.innerText('body')`
after `waitUntil: 'networkidle'` + a ~2.5s settle wait — the SPA finishes its client-side
render a moment after network idle). A single Node script looping over all 30 URLs with one
browser instance takes a few minutes; run it in the background.

## Step 2: What the rendered text looks like

Each unit block:

```
BEASTBOSS ON SQUIGOSAUR
YOUR 1ST TO 2ND UNITS COST
1 model
140 pts
YOUR 3RD + UNIT COSTS
1 model
155 pts
```

A changed-since-last-version price carries a ▲ or ▼ arrow right before it, with a `(+N)`/
`(-N)` delta — e.g. `▲ (+15) 100 pts`. These are the values that actually moved in the new
MFM version; check them first, but don't treat unmarked prices as automatically correct —
some may have been wrong before this version too (see the bug shapes list below).

A character with the Leader/Support ability carries a `LEADER` or `SUPPORT` tag right after
its price block, followed by a comma-separated list of the units it can attach to:

```
NAZDREG
YOUR UNIT COSTS
1 model
▼ (-10) 165 pts
LEADER
MEGANOBZ
```

**Both `LEADER` and `SUPPORT` tags feed `canBeLedBy`** — the Core Rules text on a Support
datasheet says explicitly "Both of these abilities allow such units to lead other friendly
units." Reading only `LEADER` reports every Support character as a spurious extra.

Every faction page ends with a `DETACHMENTS` section, one block per detachment:

```
WAR HORDE
3DP
TAKE AND HOLD
PURGE THE FOE
ENHANCEMENTS
Da Boss is Watchin'
25 pts
...
```

`<n>DP` is the detachment's DP cost; the line(s) before `ENHANCEMENTS` are its Force
Disposition(s) — some detachments genuinely have two (see below).

## Step 3: The three things to audit, and how they map to the JSON

1. **Points** — `pointsCosts[]` on each datasheet (`{description, points}`), `wargearCosts[]`,
   and each detachment's enhancement costs. Match `pointsCosts[].description` (e.g.
   `"1 model"`, `"5 models (1st to 3rd units)"`, `"10 Gretchin"`) to the dump's
   `YOUR ... COST(S)` blocks by model-count **and** tier — a unit can have two blocks
   (`YOUR 1ST TO 2ND UNITS COST` / `YOUR 3RD + UNIT COSTS`) that must map to two separate
   `pointsCosts` entries, not one.

2. **Detachment DP + disposition** — match the JSON's `detachments` array entries by name
   against the dump's `DETACHMENTS` section; fix `dp` and `disposition`.
   **`disposition` must stay an array whenever the dump lists 2+ disposition lines for that
   detachment** (confirmed real cases as of v1.4: Space Marines' Gladius Task Force and Blade
   of Ultramar, Blood Angels' Angelic Inheritors, Deathwatch's Black Spear Task Force, Orks'
   War Horde — always check `missionDeckColors.ts`'s `dispositionList`, which splits an array
   and nothing else; a comma-joined string renders as one badge with the comma inside it).
   Also correct each detachment's enhancement costs against its `ENHANCEMENTS` list — this was
   only spot-checked (not swept) as of the last full audit, so treat it as unverified until you
   check it yourself.

3. **Leaders** — `canBeLedBy[]` lives on the **led unit's own datasheet entry** (not the
   character's), and holds the character datasheet ids that can lead it. Confirmed by example:
   `orks.json`'s `boyz.canBeLedBy` includes `"bannernob"` because the dump's BANNERNOB block is
   tagged `SUPPORT` with `BOYZ, NOBZ` in its bodyguard list; `bannernob.canBeLedBy` itself is
   `[]` (characters aren't led). For every LEADER/SUPPORT-tagged character in the dump, add its
   id to `canBeLedBy` on every bodyguard unit named after it, and remove ids no longer listed.

## Known recurring bug shapes (all confirmed real, worth checking every time)

- A per-copy surcharge tier (`"(2nd+ unit)"`-style split) silently missing entirely — the JSON
  has one flat price where the MFM shows two `YOUR ... COST` blocks.
- A titanic super-heavy off by roughly a missing leading digit — a suspiciously low 3-figure
  price on a unit that fluff-wise should cost four figures (confirmed history: Adeptus
  Titanicus' Titans, Aeldari's Revenant/Phantom Titan, T'au's Manta, all found stored at
  1/10th–1/20th their real cost).
- A plain typo in the model-count label (confirmed history: Orks' Gretchin mislabeled
  "11 Gretchin" for what both the points and the MFM agree is a 20-model unit) — compare the
  stored description's number against the dump's number character-by-character, don't assume
  the existing label is right just because a price exists for it.
- A cross-faction ally copy (a datasheet duplicated verbatim into another faction's own JSON —
  Genestealer Cults' Astra Militarum/Tyranids units, Chaos Knights'/Chaos Daemons' Chaos Space
  Marines allies, Drukhari's Harlequin units, Imperial Knights' Adeptus Mechanicus allies)
  drifting out of sync with the source faction's own, correctly-updated copy — verify against
  the actual home faction's own MFM page, not the borrowing faction's.
- A name mismatch (plural/singular, apostrophe/dash Unicode style) that looks like "not found
  on this page" but is actually already correct — cross-check name-insensitively before
  concluding something's missing (confirmed history: Aeldari "Vypers" vs. MFM "Vyper", Death
  Guard "Myphitic Blight-hauler" vs. MFM "-haulers").
- Imperial Agents specifically: every unit on that faction's MFM page appears **twice** — the
  native "AGENTS OF THE IMPERIUM Detachment" price, then (further down) the "Assigned Agent"
  (ally) price. This app encodes the distinction as a `"(Assigned Agent)"` suffix on the
  relevant `pointsCosts[].description`. Diff the two blocks per unit rather than assuming a
  unit that looks identical in both actually differs, or that the ally price is always higher
  (Exaction Squad's is genuinely *lower*).
- Space Marines chapter files (`black-templars.json`, `blood-angels.json`, `dark-angels.json`,
  `deathwatch.json`, `space-wolves.json`) hold **only what that chapter adds** — a chapter's
  MFM page still lists the full army (core Adeptus Astartes units included, since a chapter
  army can field them), but a core unit like "Intercessor Squad" doesn't exist as its own entry
  in the chapter file. Only edit datasheets that actually exist as entries in the file you're
  auditing; a core unit's own points/DP/`canBeLedBy` belong on its entry in `space-marines.json`
  and must be cross-checked against **all six** Space Marines-family MFM pages at once (a core
  unit can be led by a chapter-specific character, so `space-marines.json`'s own `canBeLedBy`
  audit needs every chapter's dump, not just the core page).

## Step 4: Apply and verify

**Use `npm run mfm-sync -- --dumps=<dir>` instead of hand-editing or dispatching LLM agents
per faction.** `sync.mjs` (+ its parser, `parse.mjs`) deterministically parses every dump in
`<dir>` (one `<slug>.txt` per faction, from Step 1) and applies points/wargear/enhancement-cost
fixes, detachment `dp`/`disposition` fixes, and same-file `canBeLedBy` fixes directly to
`public/data/factions/<slug>.json` — no LLM involved, and it's idempotent (safe to re-run).

```bash
npm run mfm-sync -- --dumps=/path/to/dumps            # applies fixes to all factions
npm run mfm-sync -- --dumps=/path/to/dumps --dry       # report only, writes nothing
npm run mfm-sync -- --dumps=/path/to/dumps --faction=orks,tau-empire   # just these factions
```

It writes a Markdown report to `scripts/mfm-sync/reports/` (gitignored) listing every value it
changed, plus a "needs manual review" section per faction for anything it couldn't safely match
on its own — mainly:

- **A tier split added or removed since the last sync** (the JSON has one flat price where the
  MFM now shows two "YOUR ... COST" blocks, or vice versa) — the script only updates a price
  it can already find an equivalent entry for; it never adds or removes `pointsCosts` entries,
  since restructuring the array is a judgment call, not a straight value swap.
- **A name that doesn't match anything on the dump** — usually a genuine plural/apostrophe/dash
  mismatch (see the bug-shape list above) or a datasheet this faction's own MFM page simply
  doesn't list (a cross-faction ally copy, priced on its home faction's page instead).
- **Cross-file `canBeLedBy`** (a core Space Marines unit led by a chapter-specific character, or
  any leader/bodyguard pair split across two faction files) — the script only resolves leader
  relationships within a single file; the Space Marines-family cross-file case from the "Known
  recurring bug shapes" section above still needs a manual pass.

Handle everything the report lists under "manual review" by hand (or a targeted LLM pass for
just those items) — don't assume a clean report means the sync is complete.
