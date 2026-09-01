// Temporary points, provided directly by the user (2026-09-01) -- these are real numbers from
// them, not a scrape, but still explicitly "temporary" pending an official points release for
// this codex printing. Overrides whatever the old-codex name-match backfill put in place.
//
// Rule (per the user): a single value is the base composition's cost. Two values on a datasheet
// with NO model-count range (fixed/character units) are 1st-3rd-unit / 4th+-unit repeat-copy
// pricing. Two (or more) values on a datasheet WITH a model-count range are one value per
// model-count tier (matching modelCountMin/modelCountMax) -- confirmed by every such pair
// being consistent with doubling the model count (10->20, 5->10, 3->6, 1->2, etc).
//
// Entries marked INFERRED were not given directly -- derived from the near-universal "doubling
// the model count doubles the cost" pattern seen everywhere else in this list. Flagged so
// they're easy to find and correct.
export const pointsOverrides = {
  'Ghazghkull Thraka': [{ description: '1 model', points: 300 }],
  'Nazdreg': [{ description: '1 model', points: 175 }],
  'Warboss': [{ description: '1 model', points: 100 }],
  'Warboss in Mega Armour': [{ description: '1 model', points: 125 }],
  'Big Mek': [{ description: '1 model', points: 85 }],
  'Big Mek in Mega Armour': [{ description: '1 model', points: 90 }],
  'Big Mek with Shokk Attack Gun': [
    { description: '1 model (1st-3rd units)', points: 95 },
    { description: '1 model (4th+ unit)', points: 105 },
  ],
  'Big Mek Dakkarig': [{ description: '1 model', points: 135 }],
  'Mek': [{ description: '1 model', points: 45 }],
  'Deffkilla Wartrike': [{ description: '1 model', points: 80 }],
  'Beastboss': [{ description: '1 model', points: 85 }],
  'Zodgrod Wortsnagga': [{ description: '1 model', points: 50 }],
  'Wazdakka Gutsmek': [{ description: '1 model', points: 200 }],
  'Mozrog Skragbad': [{ description: '1 model', points: 170 }],
  'Beastboss on Squigosaur': [{ description: '1 model', points: 140 }],
  'Weirdboy': [{ description: '1 model', points: 65 }],
  'Boss Snikrot': [{ description: '1 model', points: 80 }],
  'Bannernob': [{ description: '1 model', points: 35 }],
  'Bigboss': [{ description: '1 model', points: 50 }],
  'Painboy': [{ description: '1 model', points: 45 }],
  'Painboss': [], // N/A -- explicitly no cost given yet
  'Gretchin': [{ description: '10 models', points: 45 }, { description: '20 models', points: 80 }],
  'Runtherd': [{ description: '1 model', points: 10 }],
  'Boyz': [{ description: '10 models', points: 90 }, { description: '20 models', points: 180 }],
  'Beast Snagga Boyz': [{ description: '10 models', points: 85 }, { description: '20 models', points: 170 }],
  // Meganobz: ASSUMED, not confirmed -- the user's 4 values were never mapped to a specific
  // model count. The OLD codex's own Meganobz points table (still sitting in the stale
  // pre-backfill data this replaces) prices exactly the sizes 2/3/5/6 (skipping 4), and
  // squad-box quantities rarely change edition to edition, so this maps the 4 given values to
  // those same 4 sizes in ascending order, with no repeat-unit tax split (unlike Big Mek w/
  // SAG) since a real size axis already accounts for all 4 numbers. VERIFY before trusting:
  // this drops the (old) 1st-2nd/3rd+ tax dimension entirely, and there's still no price for
  // a legal 4-model composition (the datasheet's real range, 2-6, allows it) if 4 turns out to
  // still be a valid/priced size in this codex.
  'Meganobz': [
    { description: '2 models (ASSUMED)', points: 75 },
    { description: '3 models (ASSUMED)', points: 110 },
    { description: '5 models (ASSUMED)', points: 185 },
    { description: '6 models (ASSUMED)', points: 225 },
  ],
  'Nobz': [{ description: '5 models', points: 125 }, { description: '10 models', points: 250 }],
  'Kommandos': [{ description: '10 models', points: 125 }],
  'Flash Gitz': [{ description: '5 models', points: 105 }, { description: '10 models', points: 210 }],
  // Stormboyz: composition corrected from fixed-10 to 5-10 (Nob + 4-9 Stormboyz) -- see
  // datasheets-data.mjs edit. 70/140 is an exact doubling, matching every other 5<->10 unit.
  'Stormboyz': [{ description: '5 models', points: 70 }, { description: '10 models', points: 140 }],
  'Breaka Boyz': [{ description: '6 models', points: 135 }],
  'Tankbustas': [{ description: '6 models', points: 145 }],
  'Mek Gunz': [{ description: '1 model', points: 55 }, { description: '2 models', points: 110 }, { description: '3 models', points: 165 }],
  'Warbikers': [{ description: '3 models', points: 75 }, { description: '6 models', points: 140 }],
  // Wartrakks: only "70" was given for a 1-2 model range. INFERRED the 2-model tier by doubling
  // (matches every other 1<->2 unit exactly: Rukkatrukk Squigbuggies, Warbuggies).
  'Wartrakks': [{ description: '1 model', points: 70 }, { description: '2 models (INFERRED, not given)', points: 140 }],
  'Deffkoptas': [{ description: '3 models', points: 80 }, { description: '6 models', points: 160 }],
  'Rukkatrukk Squigbuggies': [{ description: '1 model', points: 80 }, { description: '2 models', points: 160 }],
  'Warbuggies': [{ description: '1 model', points: 70 }, { description: '2 models', points: 140 }],
  // Squighog Boyz: only "140" was given for a 4-8 model range. 140 sits in the same magnitude
  // as other units' MAX tier, so treated as the 8-model tier; INFERRED the 4-model tier by
  // halving (the 4<->8 relationship is an exact doubling like every other range here).
  'Squighog Boyz': [{ description: '4 models (INFERRED, not given)', points: 70 }, { description: '8 models', points: 140 }],
  'Trukk': [{ description: '1 model', points: 60 }],
  'Battlewagon': [{ description: '1 model', points: 150 }],
  'Gunwagon': [{ description: '1 model', points: 150 }],
  'Hunta Rig': [{ description: '1 model', points: 165 }],
  'Kill Rig': [{ description: '1 model', points: 175 }],
  'Killa Kans': [{ description: '3 models', points: 130 }, { description: '6 models', points: 260 }],
  'Deff Dread': [{ description: '1 model', points: 130 }],
  'Gorkanaut': [{ description: '1 model', points: 325 }],
  'Morkanaut': [{ description: '1 model', points: 345 }],
  'Stompa': [{ description: '1 model', points: 700 }],
  "Big'ed Bossbunka": [{ description: '1 model', points: 145 }],
  'Blitza-bommer': [{ description: '1 model', points: 115 }],
  'Dakkajet': [{ description: '1 model', points: 125 }],
  'Burna-bommer': [{ description: '1 model', points: 125 }],
  'Wazbom Blastajet': [{ description: '1 model', points: 175 }],
}

// Wargear cost surcharges given alongside the points list (also user-supplied, same
// "temporary" caveat). Everything else's wargearCosts is cleared to [] -- the old stale
// backfilled wargear costs don't belong sitting next to freshly-supplied base costs.
export const wargearCostOverrides = {
  'Meganobz': [{ name: 'Killsaw', points: 5 }],
}
