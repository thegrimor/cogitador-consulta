# Space Marines chapter split

One-off migration that turned the five Space Marines chapters with their own detachments into
real factions, leaving `space-marines` as the shared parent. Kept as the record of how the data
was cut, and because the script is re-runnable from a clean checkout if the split ever needs
redoing (e.g. after a new codex import adds chapter content to `space-marines.json` again).

```bash
node scripts/sm-chapter-split/split.mjs --dry   # report the split, write nothing
node scripts/sm-chapter-split/split.mjs         # do it
```

## The model

Inheritance, with the parent's content stored exactly once:

```
space-marines (parent)   85 datasheets, 21 detachments, 83 stratagems, 56 enhancements
 ├─ black-templars       18 / 3 / 12 /  8   + Templar Vows
 ├─ blood-angels         15 / 3 / 12 /  8
 ├─ dark-angels          16 / 3 / 12 /  8
 ├─ deathwatch           10 / 2 /  9 /  5   + Mission Tactics
 └─ space-wolves         21 / 3 / 12 /  8   + Curse of the Wulfen
```

**A child file holds only what that chapter adds — never a copy of the parent's content.** A
child faction's real roster is "own + parent's", applied at read time by
`src/core/constants/factionFamily.ts`. This is what keeps a Captain's points in exactly one
place; duplicating the core into each child would recreate the cross-faction drift bug that
CLAUDE.md documents for ally copies.

The parent keeps the 67 truly generic datasheets **plus the 18 named characters of successor
chapters that have no detachments of their own** (Ultramarines, Imperial Fists, Iron Hands,
Raven Guard, Salamanders, White Scars). Those are available when you pick plain Space Marines
and are *not* inherited by the five children — a Dark Angels list can't take Marneus Calgar.

## How each kind of content is assigned

| Content | Rule |
|---|---|
| Datasheet | owns a chapter's faction keyword → that child; otherwise parent |
| Detachment | `chapters` includes `"Space Marines"` → parent (shared); otherwise that child |
| Stratagem / Enhancement | follows its `detachmentId` |
| Detachment ability | nested inside its detachment, travels with it |
| Army rule | child only when **every** datasheet carrying it (Faction-type ability matched by name, the same way `useGameData.ts` tags them) belongs to that child |

The script throws rather than guessing if a datasheet carries two chapter keywords, or a
non-generic detachment names anything other than exactly one chapter. Neither happens in the
current data.

## Why `catalog/factions.json` and the files must stay in sync

Both `src/infrastructure/data/useGameData.ts` and the chat backend's
`server/src/lib/gameDataIndex.js` load `factions/<id>.json` for **every** entry in
`catalog/factions.json`. The backend does it with an uncaught `readFileSync` at module load, so
an entry without a matching file **crashes the whole server** — auth and rosters included, not
just the chat. Adding a faction to the catalog without its file is therefore not a degraded
state, it's an outage.

## Known gaps left open

- **`Assigned Agents` and `Kill Team` stayed with the parent.** No datasheet references either
  one through a Faction-type ability, so the script had no evidence to assign them and its
  no-owner default is "leave with the parent". `Kill Team` in particular reads like a Deathwatch
  rule and probably belongs in `deathwatch.json`, but moving it on the strength of its name
  would be exactly the kind of heuristic cross-reference the Orks/Space Marines codex migrations
  already left as debt. Needs a look at the actual book.
- **`combatEffects` stayed with the parent unsplit.** Its three entries are read by nothing in
  `src/` or `server/` (two of them are Space Wolves' Preytaker's Eye). Children get an empty
  array. Left alone rather than cleaned up as part of an unrelated change.
- The per-faction `armyRuleChaptersMap` built in `useGameData.ts` matches army rules to
  chapters by scanning each faction's *own* datasheets, so after the split a child's datasheets
  can no longer tag a parent-owned rule. It only fed the wiki's chapter filter row, which the
  faction split replaces.
