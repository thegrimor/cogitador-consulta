// Phase 1 content for the Space Marines 11th-ed core-codex migration: new army rules + the 15
// detachments this partial PDF covers (rules/enhancements/stratagems), transcribed from
// "Space Marine Codex - 11th Edition.pdf" pages 1, 3-18 (printed pages 156, 158-173) —
// visually verified against the rendered page PNGs, not just OCR (OCR undercounted the
// detachments 10 vs the real 15, missing several whose banner text it garbled).
//
// Convention: description text starts at the mechanical rule, no flavour-text sentence (see
// CODEX-MIGRATION-PROCESS.md §4). "Adeptus Astartes" is left as plain prose (or the
// two-span kwb form for exact precedent match) -- src/core/utils/ruleHtml.ts auto-links/colors
// it either way at render time, so pre-wrapping every keyword isn't required for correctness.
// [BRACKETED] ability terms are plain text too -- auto-badged at render.
//
// Points/DP/disposition: this PDF prints none (confirmed -- no "points value" text anywhere in
// the 72 pages), and per explicit user sign-off (2026-09-17) everything gets left at 0/blank
// placeholders rather than backfilling from the detachments this replaces.

const AA = '<span class="kwb">ADEPTUS</span> <span class="kwb">ASTARTES</span>'
const CHAPTERS_ALL = ['Space Marines', 'Black Templars', 'Blood Angels', 'Dark Angels', 'Deathwatch', 'Space Wolves']

export const newArmyRules = [
  {
    id: 'combat-doctrines',
    name: 'Combat Doctrines',
    description: `At the start of your Command phase, you can select one combat doctrine listed below. If you do, that combat doctrine is active for friendly ${AA} units with this ability until the start of your next Command phase.<br><br><b>ASSAULT DOCTRINE</b><br>When this unit is selected to make an advance move, that advance move does not prevent this unit from being eligible to declare a charge.<br><br><b>DEVASTATOR DOCTRINE</b><br>This unit's ranged attacks have [ASSAULT].<br><br><b>TACTICAL DOCTRINE</b><br>When this unit is selected to make a fall-back move, that fall-back move does not prevent this unit from being eligible to shoot and eligible to declare a charge.<br><br>Unless otherwise stated:<ul><li>You can only select each combat doctrine once per battle.</li><li>Only one combat doctrine can be active for each unit. If a rule makes a combat doctrine active for a unit, any combat doctrine previously active for that unit is no longer active for that unit.</li></ul>`,
  },
  {
    id: 'transhuman-strategist',
    name: 'Transhuman Strategist',
    description: `At the start of the battle round, if a model with this ability is your <span class="kwb">WARLORD</span>, gain 1CP.`,
  },
  {
    id: 'librarius',
    name: 'Librarius',
    description: `${AA} <span class="kwb">PSYKER</span> units with this ability have a psyker level of 1 or higher, specified in that unit's abilities. Each psychic ability has a psychic level of 1 or higher, specified in that ability's name.<br><br>In a battle round, a friendly ${AA} <span class="kwb">PSYKER</span> unit can use a number of psychic abilities whose total psychic level does not exceed that <span class="kwb">PSYKER</span> unit's psyker level.<br><br><i>Example: In a battle round, a psyker level 3 PSYKER unit could use three psychic level 1 abilities, or one psychic level 1 ability and one psychic level 2 ability, or one psychic level 3 ability.</i>`,
  },
]
// oath-of-moment is dropped (superseded by Combat Doctrines/Transhuman Strategist above) -- see
// classification.json / build-final.mjs for the drop list.

function stratagem(id, name, detachmentId, cpCost, category, phase, turn, description, options) {
  return { id, name, detachmentId, cpCost, type: `${detachmentId}::${category} Stratagem`, turn, phase, description, ...(options ? { options } : {}) }
}
function enhancement(id, name, detachmentId, description) {
  return { id, name, cost: 0, detachmentId, description }
}
function detachment(id, name, ruleId, ruleName, ruleDescription) {
  return {
    id, name, disposition: '', dp: 0, chapters: CHAPTERS_ALL,
    abilities: [{ id: ruleId, name: ruleName, description: ruleDescription }],
  }
}

// Shared stratagem reused verbatim across several detachments in this book.
const armourOfContempt = (detId) => stratagem('armour-of-contempt-' + detId, 'ARMOUR OF CONTEMPT', detId, 1, 'Battle Tactic', 'Your opponent’s Shooting phase or the Fight phase', 'Either player’s turn',
  `<b>WHEN:</b> Your opponent's Shooting phase or the Fight phase, when an enemy unit targets a friendly ${AA} unit.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> Attacks that target your unit have -1 AP until that enemy unit has attacked.`)

export const newDetachments = []
export const newEnhancements = []
export const newStratagems = []

// ---------------------------------------------------------------------------
// 1. GLADIUS TASK FORCE (pg 3-4 / printed 158-159)
// ---------------------------------------------------------------------------
{
  const id = 'gladius-task-force'
  newDetachments.push(detachment(id, 'Gladius Task Force', 'codex-discipline', 'Codex Discipline',
    'You can select one combat doctrine one additional time per battle.'))
  newEnhancements.push(
    enhancement('standard-of-the-emperor-ascendant', 'Standard of the Emperor Ascendant', id,
      `<span class="kwb">ANCIENT</span> model only. This model has:<ul><li>+1 OC and Ld.</li><li>Feel No Pain 5+.</li><li>The following ability:<br><b>Ancient Exhortation (Once per battle, per army):</b> When this unit is selected to fight, you can use this ability. If you do, this unit's melee attacks have +1 A until the end of the phase.</li></ul>`),
    enhancement('laurels-of-triumph', 'Laurels of Triumph', id,
      `${AA} model only. This model's melee attacks have:<ul><li>+1 S and AP.</li><li><u>Or:</u> If the assault doctrine is active for this unit, +2 S and AP.</li></ul>`),
    enhancement('adept-of-the-codex', 'Adept of the Codex', id,
      `<span class="kwb">CAPTAIN</span> model only. The tactical doctrine is active for this unit in addition to any other combat doctrine.`),
    enhancement('artificer-armour', 'Artificer Armour', id,
      `${AA} model only. This model has:<ul><li>2+ Sv.</li><li>Feel No Pain 5+.</li></ul>`),
  )
  newStratagems.push(
    stratagem('armour-of-contempt-gladius-task-force', 'ARMOUR OF CONTEMPT', id, 1, 'Battle Tactic', 'Your opponent’s Shooting phase or the Fight phase', 'Either player’s turn',
      `<b>WHEN:</b> Your opponent's Shooting phase or the Fight phase, when an enemy unit targets a friendly ${AA} unit.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> Attacks that target your unit have -1 AP until that enemy unit has attacked.`),
    stratagem('a-worthy-death', 'A WORTHY DEATH', id, 1, 'Battle Tactic', 'Fight phase', 'Your turn',
      `<b>WHEN:</b> Fight phase, when an enemy unit targets a friendly ${AA} unit.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> When a model in your unit is destroyed, if your unit has not been selected to fight this phase, roll one D6:<ul><li>On a 4+, do not remove that model from the battlefield. When your unit has fought, or at the end of the phase (whichever comes first), that model is removed from the battlefield.</li></ul>`),
    stratagem('might-of-angels', 'MIGHT OF ANGELS', id, 1, 'Battle Tactic', 'Fight phase', 'Your turn',
      `<b>WHEN:</b> Fight phase, when a friendly ${AA} unit is selected to fight.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> Your unit's melee attacks have [LANCE].`),
    stratagem('adaptive-strategy', 'ADAPTIVE STRATEGY', id, 1, 'Strategic Ploy', 'Command phase', 'Your turn',
      `<b>WHEN:</b> Your Command phase.<br><br><b>TARGET:</b> One friendly ${AA} unit.<br><br><b>EFFECT:</b> Select one combat doctrine. That combat doctrine is active for your unit until the start of your next Command phase.`),
    stratagem('storm-of-devastation', 'STORM OF DEVASTATION', id, 1, 'Strategic Ploy', 'Shooting phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase, when a friendly ${AA} unit is selected to shoot.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> Your unit's ranged attacks have [IGNORES COVER].`),
    stratagem('responsive-tactics', 'RESPONSIVE TACTICS', id, 1, 'Wargear', 'Your opponent’s Movement phase', 'Opponent’s turn',
      `<b>WHEN:</b> Your opponent's Movement phase, when an enemy unit ends a move within 8" of a friendly unengaged <span class="kwb">ADEPTUS ASTARTES INFANTRY</span>/<span class="kwb">MOUNTED</span> unit.<br><br><b>TARGET:</b> That ${AA} <span class="kwb">INFANTRY</span>/<span class="kwb">MOUNTED</span> unit.<br><br><b>EFFECT:</b> Your unit can make a normal move of up to D6".`),
  )
}

// ---------------------------------------------------------------------------
// 2. ASSAULT BRETHREN (pg 5 / printed 160)
// ---------------------------------------------------------------------------
{
  const id = 'assault-brethren'
  newDetachments.push(detachment(id, 'Assault Brethren', 'assault-mastery', 'Assault Mastery',
    'You can select the assault doctrine one additional time per battle.'))
  newEnhancements.push(
    enhancement('imperiums-sword', "Imperium's Sword", id,
      `${AA} model only. This model has the following weapon:<table><tr><th>Imperium's Sword</th><th>RANGE</th><th>A</th><th>WS</th><th>S</th><th>AP</th><th>D</th></tr><tr><td></td><td>Melee</td><td>6</td><td>2+</td><td>7</td><td>-3</td><td>3</td></tr></table>`),
    enhancement('furious-assault', 'Furious Assault', id,
      `${AA} <span class="kwb">INFANTRY</span> unit only. This unit's melee attacks have [SUSTAINED HITS 1: non-MONSTER/VEHICLE].`),
  )
  newStratagems.push(
    armourOfContempt(id),
    stratagem('gene-wrought-might', 'GENE-WROUGHT MIGHT', id, 1, 'Battle Tactic', 'Fight phase', 'Your turn',
      `<b>WHEN:</b> Fight phase, when a friendly ${AA} unit is selected to fight.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> Your unit's melee attacks have:<ul><li>[LANCE].</li><li><u>Or:</u> If the assault doctrine is active for your unit, [LANCE] and +1 AP.</li></ul>`),
    stratagem('duty-in-death', 'DUTY IN DEATH', id, 1, 'Battle Tactic', 'Fight phase', 'Your turn',
      `<b>WHEN:</b> Fight phase, when an enemy unit targets a friendly ${AA} unit.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> When a model in your unit is destroyed, if your unit has not been selected to fight this phase, roll one D6, with +1 to that roll if the assault doctrine is active for your unit:<ul><li>On a 4+, do not remove that model from the battlefield. When your unit has fought, or at the end of the phase (whichever comes first), that model is removed from the battlefield.</li></ul>`),
  )
}

// ---------------------------------------------------------------------------
// 3. TACTICAL BRETHREN (pg 6 / printed 161)
// ---------------------------------------------------------------------------
{
  const id = 'tactical-brethren'
  newDetachments.push(detachment(id, 'Tactical Brethren', 'tactical-mastery', 'Tactical Mastery',
    'You can select the tactical doctrine one additional time per battle.'))
  newEnhancements.push(
    enhancement('laurels-of-vigilance', 'Laurels of Vigilance', id,
      `${AA} model only. (Once per battle round, per army) When you use the Fire Overwatch/Heroic Intervention stratagem, if you target a friendly ${AA} <span class="kwb">BATTLELINE</span> unit within 12" of this model with that stratagem, that use is -1 CP.`),
    enhancement('tactical-insight', 'Tactical Insight', id,
      `<span class="kwb">CAPTAIN</span> model only. The tactical doctrine is active for this unit <u>in addition</u> to any other combat doctrine.`),
  )
  newStratagems.push(
    armourOfContempt(id),
    stratagem('domination-fire', 'DOMINATION FIRE', id, 1, 'Battle Tactic', 'Shooting phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase, when a friendly ${AA} unit has shot.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> Select one enemy unit hit by those attacks. That enemy unit is suppressed until the start of your next turn:<ul><li>While a unit is suppressed, that unit's attacks have -1 to hit rolls.</li></ul>`),
    stratagem('masterful-tactics', 'MASTERFUL TACTICS', id, 1, 'Wargear', 'Your opponent’s Movement phase', 'Opponent’s turn',
      `<b>WHEN:</b> Your opponent's Movement phase, when an enemy unit ends a move within 8" of a friendly unengaged ${AA} <span class="kwb">INFANTRY</span>/<span class="kwb">MOUNTED</span> unit.<br><br><b>TARGET:</b> That ${AA} <span class="kwb">INFANTRY</span>/<span class="kwb">MOUNTED</span> unit.<br><br><b>EFFECT:</b> Your unit can make a normal move of:<ul><li>Up to D6".</li><li><u>Or:</u> If the tactical doctrine is active for your unit, up to 6".</li></ul>`),
  )
}

// ---------------------------------------------------------------------------
// 4. DEVASTATOR BRETHREN (pg 7 / printed 162)
// ---------------------------------------------------------------------------
{
  const id = 'devastator-brethren'
  newDetachments.push(detachment(id, 'Devastator Brethren', 'devastator-mastery', 'Devastator Mastery',
    'You can select the devastator doctrine one additional time per battle.'))
  newEnhancements.push(
    enhancement('master-forged-firearms', 'Master-forged Firearms', id,
      `${AA} <span class="kwb">INFANTRY</span>/<span class="kwb">MOUNTED</span> model only. This model's ranged attacks (excluding [PSYCHIC] attacks) have +1 A, S, AP and D.`),
    enhancement('honour-of-vigilance', 'Honour of Vigilance', id,
      `${AA} model only.<ul><li>This unit's ranged attacks have [LETHAL HITS].</li><li>If the devastator doctrine is active for this unit, this unit can re-roll advance rolls.</li></ul>`),
  )
  newStratagems.push(
    armourOfContempt(id),
    stratagem('storm-of-fire', 'STORM OF FIRE', id, 1, 'Battle Tactic', 'Shooting phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase, when a friendly ${AA} unit is selected to shoot.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> Your unit's ranged attacks have:<ul><li>[IGNORES COVER].</li><li><u>Or:</u> If the devastator doctrine is active for your unit, [IGNORES COVER] and +1 AP.</li></ul>`),
    stratagem('hail-of-vengeance', 'HAIL OF VENGEANCE', id, 2, 'Battle Tactic', 'Your opponent’s Shooting phase', 'Opponent’s turn',
      `<b>WHEN:</b> Your opponent's Shooting phase, when an enemy unit has shot, if those attacks destroyed a model in a friendly ${AA} unit.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> Your unit shoots using normal shooting, but while doing so your unit can only target that enemy unit.`),
  )
}

// ---------------------------------------------------------------------------
// 5. TERMINATOR STORM FORCE (pg 8 / printed 163)
// ---------------------------------------------------------------------------
{
  const id = 'terminator-storm-force'
  newDetachments.push(detachment(id, 'Terminator Storm Force', 'death-blow', 'Death Blow',
    `Friendly ${AA} <span class="kwb">TERMINATOR</span> units have +1 to charge rolls.`))
  newEnhancements.push(
    enhancement('champion-of-the-first-company', 'Champion of the First Company', id,
      `${AA} <span class="kwb">TERMINATOR</span> model only. This unit's melee attacks have [LETHAL HITS].`),
    enhancement('corporeum-reliquary', 'Corporeum Reliquary', id,
      `${AA} <span class="kwb">TERMINATOR</span> model only. In your first Movement phase, this unit can make an ingress move.`),
  )
  newStratagems.push(
    stratagem('tactical-dreadnought-fortitude', 'TACTICAL DREADNOUGHT FORTITUDE', id, 2, 'Battle Tactic', 'Your opponent’s Shooting phase or the Fight phase', 'Either player’s turn',
      `<b>WHEN:</b> Your opponent's Shooting phase or the Fight phase, when an enemy unit targets a friendly ${AA} <span class="kwb">TERMINATOR</span> unit.<br><br><b>TARGET:</b> That ${AA} <span class="kwb">TERMINATOR</span> unit.<br><br><b>EFFECT:</b> Attacks that target your unit have -1 D until that enemy unit has attacked.`),
    stratagem('merciless-veterans', 'MERCILESS VETERANS', id, 1, 'Battle Tactic', 'Shooting phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase, when a friendly ${AA} <span class="kwb">TERMINATOR</span> unit is selected to shoot.<br><br><b>TARGET:</b> That ${AA} <span class="kwb">TERMINATOR</span> unit.<br><br><b>EFFECT:</b> Your unit's ranged attacks have:<ul><li>[LETHAL HITS].</li><li>[SUSTAINED HITS 1].</li></ul>`),
    stratagem('gunship-extraction', 'GUNSHIP EXTRACTION', id, 1, 'Strategic Ploy', 'End of your opponent’s Fight phase', 'Opponent’s turn',
      `<b>WHEN:</b> End of your opponent's Fight phase.<br><br><b>TARGET:</b> One friendly unengaged ${AA} <span class="kwb">TERMINATOR</span> unit.<br><br><b>EFFECT:</b> Place your unit in strategic reserves.`),
  )
}

// ---------------------------------------------------------------------------
// 6. TACTICUS ATTACK FORCE (pg 9 / printed 164)
// ---------------------------------------------------------------------------
{
  const id = 'tacticus-attack-force'
  newDetachments.push(detachment(id, 'Tacticus Attack Force', 'wrath-of-the-chapter', 'Wrath of the Chapter',
    'Friendly <b>TACTICUS</b> units can re-roll advance rolls.'))
  newEnhancements.push(
    enhancement('martial-paragon', 'Martial Paragon', id,
      `<b>TACTICUS</b> model only. This unit's attacks can:<ul><li>Re-roll one hit roll.</li><li>Re-roll one wound roll.</li></ul>`),
    enhancement('spearpoint-war-leader', 'Spearpoint War Leader', id,
      `<b>TACTICUS</b> model only. This unit has Scouts 6".`),
  )
  newStratagems.push(
    stratagem('relentless-assault-tacticus-attack-force', 'RELENTLESS ASSAULT', id, 1, 'Battle Tactic', 'Your Shooting phase or the Fight phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase or the Fight phase, when a friendly <b>TACTICUS</b> unit is selected to attack.<br><br><b>TARGET:</b> That <b>TACTICUS</b> unit.<br><br><b>EFFECT:</b> Your unit's attacks have:<ul><li>[SUSTAINED HITS 1: non-MONSTER/VEHICLE].</li><li><u>Or:</u> [LETHAL HITS: MONSTER/VEHICLE].</li></ul>`),
    stratagem('transhuman-swiftness', 'TRANSHUMAN SWIFTNESS', id, 1, 'Battle Tactic', 'Fight phase', 'Your turn',
      `<b>WHEN:</b> Fight phase, when an enemy unit has fought.<br><br><b>TARGET:</b> One friendly <b>TACTICUS</b> unit that is within range of an objective and is eligible to fight.<br><br><b>EFFECT:</b> Your unit has Fights First and must be the next unit you select to fight.`),
    stratagem('tactical-focus', 'TACTICAL FOCUS', id, 1, 'Battle Tactic', 'Fight phase', 'Your turn',
      `<b>WHEN:</b> Fight phase, when a friendly <b>TACTICUS</b> unit is selected to make a consolidation move.<br><br><b>TARGET:</b> That <b>TACTICUS</b> unit.<br><br><b>EFFECT:</b> When making that consolidation move, your unit can move up to D3+3".`),
  )
}

// ---------------------------------------------------------------------------
// 7. TACTICUS FIRESTORM FORCE (pg 10 / printed 165)
// ---------------------------------------------------------------------------
{
  const id = 'tacticus-firestorm-force'
  newDetachments.push(detachment(id, 'Tacticus Firestorm Force', 'codex-fire-patterns', 'Codex Fire-Patterns',
    "Friendly <b>TACTICUS</b> units' [RAPID FIRE] attacks benefit from [RAPID FIRE] when targeting units up to that attack's maximum range."))
  newEnhancements.push(
    enhancement('cyber-familiar', 'Cyber-Familiar', id,
      `<b>TACTICUS</b> model only. When both players have deployed their armies, you can redeploy up to three friendly ${AA} <span class="kwb">INFANTRY</span> units. When doing so, you can set those units up in strategic reserves, regardless of how many units are already in strategic reserves.`),
    enhancement('tempered-in-battle', 'Tempered in Battle (Aura)', id,
      `<b>TACTICUS</b> model only. Friendly ${AA} units within 6" of this model can re-roll leadership rolls.`),
  )
  newStratagems.push(
    stratagem('for-the-emperor', 'FOR THE EMPEROR!', id, 1, 'Battle Tactic', 'Command phase', 'Your turn',
      `<b>WHEN:</b> Command phase.<br><br><b>TARGET:</b> One friendly <b>TACTICUS</b> unit that is within range of an objective.<br><br><b>EFFECT:</b> Your unit has +1 OC until the end of the turn.`),
    stratagem('relentless-assault-tacticus-firestorm-force', 'RELENTLESS ASSAULT', id, 1, 'Battle Tactic', 'Your Shooting phase or the Fight phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase or the Fight phase, when a friendly <b>TACTICUS</b> unit is selected to attack.<br><br><b>TARGET:</b> That <b>TACTICUS</b> unit.<br><br><b>EFFECT:</b> Your unit's attacks have:<ul><li>[SUSTAINED HITS 1: non-MONSTER/VEHICLE].</li><li><u>Or:</u> [LETHAL HITS: MONSTER/VEHICLE].</li></ul>`),
    stratagem('point-blank-brutality', 'POINT-BLANK BRUTALITY', id, 1, 'Battle Tactic', 'Shooting phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase, when a friendly engaged <b>TACTICUS</b> unit is selected to shoot.<br><br><b>TARGET:</b> That <b>TACTICUS</b> unit.<br><br><b>EFFECT:</b> Your unit's ranged attacks (excluding [BLAST] attacks) have:<ul><li>[CLOSE-QUARTERS].</li><li>[IGNORES COVER].</li></ul>`),
  )
}

// ---------------------------------------------------------------------------
// 8. PHOBOS SHADOW FORCE (pg 11 / printed 166)
// ---------------------------------------------------------------------------
{
  const id = 'phobos-shadow-force'
  newDetachments.push(detachment(id, 'Phobos Shadow Force', 'shadow-masters', 'Shadow Masters',
    `When a friendly <b>PHOBOS</b> or <b>SCOUT SQUAD</b> unit has shot:<ul><li>Those attacks do not prevent that unit from being hidden.</li><li><u>Or:</u> That unit can make a normal move of up to D6". That unit is not eligible to declare a charge until the end of the turn.</li></ul>`))
  newEnhancements.push(
    enhancement('venator-omni-auspex-shadow', 'Venator Omni-Auspex', id,
      `<b>PHOBOS</b> model only. This unit's attacks that target a hidden unit can:<ul><li>Re-roll wound rolls of 1.</li><li><u>Or:</u> If the assault doctrine is active for this unit, re-roll wound rolls of 1 and 2.</li></ul>`),
    enhancement('execute-and-redeploy', 'Execute and Redeploy', id,
      `<b>PHOBOS</b> model only. In your Shooting phase, after this unit has shot, if this unit is unengaged, this unit can make a normal move of up to 6". If it does, this unit is not eligible to declare a charge until the end of the turn.`),
  )
  newStratagems.push(
    stratagem('strike-from-the-shadows-phobos-shadow-force', 'STRIKE FROM THE SHADOWS', id, 1, 'Battle Tactic', 'Your Shooting phase or the Fight phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase or the Fight phase, when a friendly hidden <b>PHOBOS</b> unit is selected to attack.<br><br><b>TARGET:</b> That <b>PHOBOS</b> unit.<br><br><b>EFFECT:</b> Your unit's attacks have:<ul><li>+1 S.</li><li>[LETHAL HITS].</li></ul>`),
    stratagem('mortis-snares', 'MORTIS SNARES', id, 1, 'Wargear', 'End of your Movement phase', 'Your turn',
      `<b>WHEN:</b> End of your Movement phase.<br><br><b>TARGET:</b> One friendly unengaged <b>PHOBOS</b>/<b>SCOUT SQUAD</b> unit.<br><br><b>EFFECT:</b> If your unit is controlling an objective, that objective is snared. While an objective is snared, when an enemy unit ends a move within range of that objective, roll one D6:<ul><li>On a 2+, that enemy unit suffers D6 mortal wounds.</li><li>That objective is no longer snared.</li></ul>`),
    stratagem('tactical-withdrawal', 'TACTICAL WITHDRAWAL', id, 1, 'Strategic Ploy', 'End of your opponent’s Fight phase', 'Opponent’s turn',
      `<b>WHEN:</b> End of your opponent's Fight phase.<br><br><b>TARGET:</b> One friendly unengaged <b>PHOBOS</b>/<b>SCOUT SQUAD</b> unit.<br><br><b>EFFECT:</b> Place your unit in strategic reserves.`),
  )
}

// ---------------------------------------------------------------------------
// 9. PHOBOS SHOCK FORCE (pg 12 / printed 167)
// ---------------------------------------------------------------------------
{
  const id = 'phobos-shock-force'
  newDetachments.push(detachment(id, 'Phobos Shock Force', 'vanguard-ambushers', 'Vanguard Ambushers',
    `At the end of your Movement phase, if a friendly <b>PHOBOS</b> unit is hidden, that unit's attacks can re-roll wound rolls of 1 until the end of the turn.`))
  newEnhancements.push(
    enhancement('seal-of-shrouding', 'Seal of Shrouding', id,
      `<b>PHOBOS</b> model only. Enemy units cannot target this unit with snap shooting attacks.`),
    enhancement('venator-omni-auspex-shock', 'Venator Omni-Auspex', id,
      `<b>PHOBOS</b> model only. This unit's attacks that target a hidden unit can:<ul><li>Re-roll wound rolls of 1.</li><li><u>Or:</u> If the assault doctrine is active for this unit, re-roll wound rolls of 1 and 2.</li></ul>`),
  )
  newStratagems.push(
    stratagem('strike-from-the-shadows-phobos-shock-force', 'STRIKE FROM THE SHADOWS', id, 1, 'Battle Tactic', 'Your Shooting phase or the Fight phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase or the Fight phase, when a friendly hidden <b>PHOBOS</b> unit is selected to attack.<br><br><b>TARGET:</b> That <b>PHOBOS</b> unit.<br><br><b>EFFECT:</b> Your unit's attacks have:<ul><li>+1 S.</li><li>[LETHAL HITS].</li></ul>`),
    stratagem('transhuman-reactions', 'TRANSHUMAN REACTIONS', id, 1, 'Wargear', 'Your opponent’s Movement phase', 'Opponent’s turn',
      `<b>WHEN:</b> Your opponent's Movement phase, when an enemy unit ends a move within 8" of a friendly unengaged <b>PHOBOS</b> unit.<br><br><b>TARGET:</b> That <b>PHOBOS</b> unit.<br><br><b>EFFECT:</b> Your unit can make a normal move of:<ul><li>Up to D6".</li><li><u>Or:</u> If the tactical doctrine is active for your unit, up to 6".</li></ul>`),
    stratagem('umbral-evasion', 'UMBRAL EVASION', id, 1, 'Battle Tactic', 'Your opponent’s Shooting phase', 'Opponent’s turn',
      `<b>WHEN:</b> Your opponent's Shooting phase, when an enemy unit targets a friendly <b>PHOBOS</b> unit.<br><br><b>TARGET:</b> That <b>PHOBOS</b> unit.<br><br><b>EFFECT:</b> Ranged attacks that target your unit have -1 to hit rolls.`),
  )
}

// ---------------------------------------------------------------------------
// 10. GRAVIS LINEBREAKER FORCE (pg 13 / printed 168)
// ---------------------------------------------------------------------------
{
  const id = 'gravis-linebreaker-force'
  newDetachments.push(detachment(id, 'Gravis Linebreaker Force', 'walking-fortress', 'Walking Fortress',
    `In a turn a friendly <b>GRAVIS</b> unit made a normal move, that unit's ranged attacks:<ul><li>Do not have [HEAVY].</li><li>Have +1 to hit rolls.</li></ul>`))
  newEnhancements.push(
    enhancement('indefatigable-fortitude', 'Indefatigable Fortitude', id,
      `<b>GRAVIS</b> model only. Attacks that target this unit with a S greater than this unit's T have -1 to wound rolls.`),
    enhancement('relentless-advance', 'Relentless Advance', id,
      `<b>GRAVIS</b> model only. This unit has Scouts 5".`),
  )
  newStratagems.push(
    stratagem('annihilating-force-gravis-linebreaker-force', 'ANNIHILATING FORCE', id, 1, 'Battle Tactic', 'Your Shooting phase or the Fight phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase or the Fight phase, when a friendly <b>GRAVIS</b> unit is selected to attack.<br><br><b>TARGET:</b> That <b>GRAVIS</b> unit.<br><br><b>EFFECT:</b> Your unit's attacks have [LETHAL HITS].`),
    stratagem('purgation-push', 'PURGATION PUSH', id, 1, 'Battle Tactic', 'Shooting phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase, when a friendly <b>GRAVIS</b> unit has shot.<br><br><b>TARGET:</b> That <b>GRAVIS</b> unit.<br><br><b>EFFECT:</b><ul><li>If your unit is unengaged, your unit can make a normal move of up to 5", and must end that move within range of an objective.</li><li>Your unit is not eligible to declare a charge or embark within a <span class="kwb">TRANSPORT</span> until the end of the turn.</li></ul>`),
    stratagem('armoured-impact', 'ARMOURED IMPACT', id, 1, 'Wargear', 'Charge phase', 'Your turn',
      `<b>WHEN:</b> Your Charge phase, when a friendly <b>GRAVIS</b> unit ends a charge move.<br><br><b>TARGET:</b> That <b>GRAVIS</b> unit.<br><br><b>EFFECT:</b> When your unit ends a charge move, you can select one enemy unit engaged with your unit. If you do, roll one D6 for each model in your unit engaged with that enemy unit:<ul><li>For each 3+, that enemy unit suffers 1 mortal wound.</li></ul>`),
  )
}

// ---------------------------------------------------------------------------
// 11. GRAVIS SIEGE FORCE (pg 14 / printed 169)
// ---------------------------------------------------------------------------
{
  const id = 'gravis-siege-force'
  newDetachments.push(detachment(id, 'Gravis Siege Force', 'indomitable-defence', 'Indomitable Defence',
    `While a friendly <b>GRAVIS</b> unit is within range of an objective, attacks that target that unit with a S greater than that unit's T have -1 to wound rolls.`))
  newEnhancements.push(
    enhancement('immovable-conquerors', 'Immovable Conquerors', id,
      `<b>GRAVIS</b> unit only. This unit has +1 OC.`),
    enhancement('narthecis-gauntlet', 'Narthecis Gauntlet', id,
      `<b>APOTHECARY BIOLOGIS</b> model only. In your Command phase, this unit heals D3+1 wounds.`),
  )
  newStratagems.push(
    stratagem('annihilating-force-gravis-siege-force', 'ANNIHILATING FORCE', id, 1, 'Battle Tactic', 'Your Shooting phase or the Fight phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase or the Fight phase, when a friendly <b>GRAVIS</b> unit is selected to attack.<br><br><b>TARGET:</b> That <b>GRAVIS</b> unit.<br><br><b>EFFECT:</b> Your unit's attacks have [LETHAL HITS].`),
    stratagem('stand-unyielding', 'STAND UNYIELDING', id, 1, 'Wargear', 'End of your Movement phase', 'Your turn',
      `<b>WHEN:</b> End of your Movement phase.<br><br><b>TARGET:</b> One friendly <b>GRAVIS</b> unit.<br><br><b>EFFECT:</b> Select one objective your unit is controlling. That objective is secured.`),
    stratagem('suppression-volleys', 'SUPPRESSION VOLLEYS', id, 1, 'Battle Tactic', 'Shooting phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase, when a friendly <b>GRAVIS</b> unit has shot.<br><br><b>TARGET:</b> That <b>GRAVIS</b> unit.<br><br><b>EFFECT:</b> Select one enemy unit hit by those attacks. That enemy unit makes a battle-shock roll, with -1 to that battle-shock roll.`),
  )
}

// ---------------------------------------------------------------------------
// 12. STORMLANCE TASK FORCE (pg 15 / printed 170)
// ---------------------------------------------------------------------------
{
  const id = 'stormlance-task-force'
  newDetachments.push(detachment(id, 'Stormlance Task Force', 'lightning-fast-strike', 'Lightning-fast Strike',
    `Friendly ${AA} <span class="kwb">MOUNTED</span>/<b>SPEEDER</b> units have +2" M.`))
  newEnhancements.push(
    enhancement('supercharged-engines', 'Supercharged Engines', id,
      `${AA} <span class="kwb">MOUNTED</span> unit only. This unit can re-roll advance rolls.`),
    enhancement('auspex-triangulation-shrines', 'Auspex Triangulation Shrines', id,
      `${AA} <b>SPEEDER</b> unit only. At the start of your Shooting phase, select one visible enemy unit within 12" of this unit. That enemy unit is spotted:<ul><li>While a unit is spotted, that unit has +3" detection range.</li></ul>`),
  )
  newStratagems.push(
    stratagem('wind-swift-evasion', 'WIND-SWIFT EVASION', id, 1, 'Strategic Ploy', 'End of the Fight phase', 'Either player’s turn',
      `<b>WHEN:</b> End of the Fight phase.<br><br><b>TARGET:</b> One friendly ${AA} <span class="kwb">MOUNTED</span> unit that was eligible to fight this phase.<br><br><b>EFFECT:</b><ul><li>If your unit is unengaged, your unit can make a normal move.</li><li><u>Or:</u> If your unit is engaged, your unit can make a fall-back move.</li></ul>`),
    stratagem('sudden-onslaught', 'SUDDEN ONSLAUGHT', id, 1, 'Wargear', 'Movement phase', 'Your turn',
      `<b>WHEN:</b> Your Movement phase, when a friendly ${AA} <span class="kwb">MOUNTED</span>/<b>SPEEDER</b> unit is selected to make an advance move.<br><br><b>TARGET:</b> That ${AA} <span class="kwb">MOUNTED</span>/<b>SPEEDER</b> unit.<br><br><b>EFFECT:</b> Your unit can change its advance rolls to a 6.`),
    stratagem('hurtling-targets', 'HURTLING TARGETS', id, 1, 'Battle Tactic', 'Your opponent’s Shooting phase', 'Opponent’s turn',
      `<b>WHEN:</b> Your opponent's Shooting phase, when an enemy unit targets a friendly ${AA} <span class="kwb">MOUNTED</span>/<b>SPEEDER</b> unit.<br><br><b>TARGET:</b> That ${AA} <span class="kwb">MOUNTED</span>/<b>SPEEDER</b> unit.<br><br><b>EFFECT:</b> Ranged attacks that target your unit have -1 to hit rolls.`),
  )
}

// ---------------------------------------------------------------------------
// 13. IRONCLAD CHAMPIONS (pg 16 / printed 171)
// ---------------------------------------------------------------------------
{
  const id = 'ironclad-champions'
  newDetachments.push(detachment(id, 'Ironclad Champions', 'enduring-vengeance', 'Enduring Vengeance',
    `Friendly ${AA} <span class="kwb">DREADNOUGHT</span> units can re-roll hit rolls of 1.`))
  newEnhancements.push(
    enhancement('artificer-sarcophagus', 'Artificer Sarcophagus', id,
      `<span class="kwb">DREADNOUGHT</span> unit only. Attacks that target this unit have -1 D.`),
    enhancement('venerable-champion', 'Venerable Champion (Aura)', id,
      `<span class="kwb">DREADNOUGHT</span> unit only. While a friendly ${AA} <span class="kwb">INFANTRY</span>/<span class="kwb">MOUNTED</span> unit is within 6" of this unit, that unit's attacks can re-roll hit rolls of 1.`),
  )
  newStratagems.push(
    stratagem('adamantine-terror', 'ADAMANTINE TERROR', id, 1, 'Battle Tactic', 'Start of the Fight phase', 'Either player’s turn',
      `<b>WHEN:</b> Start of the Fight phase.<br><br><b>TARGET:</b> One friendly <span class="kwb">DREADNOUGHT</span> unit.<br><br><b>EFFECT:</b> Each enemy unit engaged with your unit makes a battle-shock roll, with -1 to that battle-shock roll.`),
    stratagem('mercy-is-weakness', 'MERCY IS WEAKNESS', id, 1, 'Battle Tactic', 'Your Shooting phase or the Fight phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase or the Fight phase, when a friendly <span class="kwb">DREADNOUGHT</span> unit is selected to attack.<br><br><b>TARGET:</b> That <span class="kwb">DREADNOUGHT</span> unit.<br><br><b>EFFECT:</b> Your unit's attacks have:<ul><li>[LETHAL HITS].</li><li><u>Or:</u> [SUSTAINED HITS 1].</li></ul>`),
    stratagem('unstoppable-advance', 'UNSTOPPABLE ADVANCE', id, 1, 'Wargear', 'Your Movement/Charge phase', 'Your turn',
      `<b>WHEN:</b> Your Movement/Charge phase, when a friendly <span class="kwb">DREADNOUGHT</span> unit is selected to move or declares a charge.<br><br><b>TARGET:</b> That <span class="kwb">DREADNOUGHT</span> unit.<br><br><b>EFFECT:</b> Your unit has MOBILE.`),
  )
}

// ---------------------------------------------------------------------------
// 14. GAUNTLET TASK FORCE (pg 17 / printed 172)
// ---------------------------------------------------------------------------
{
  const id = 'gauntlet-task-force'
  newDetachments.push(detachment(id, 'Gauntlet Task Force', 'combined-deployment', 'Combined Deployment',
    `In your Shooting phase, when a friendly ${AA} <span class="kwb">TRANSPORT</span> unit has shot, you can select one enemy unit hit by those attacks. That enemy unit is assailed until the end of the turn:<ul><li>While a unit is assailed, when an ${AA} unit that disembarked this turn targets that unit, those attacks have [SUSTAINED HITS 1].</li></ul>`))
  newEnhancements.push(
    enhancement('linebreaker-onslaught', 'Linebreaker Onslaught', id,
      `${AA} <span class="kwb">INFANTRY</span> model only. If this unit disembarked this turn:<ul><li>This unit can re-roll charge rolls.</li><li>Enemy units cannot target this unit with snap shooting attacks.</li></ul>`),
    enhancement('damocles-class-uplink', 'Damocles-class Uplink', id,
      `<span class="kwb">CAPTAIN</span> model only. In your Movement phase, if this unit is embarked within a <span class="kwb">TRANSPORT</span> unit, you can select one friendly ${AA} <span class="kwb">INFANTRY</span> unit within 6" of that <span class="kwb">TRANSPORT</span> unit and select one combat doctrine. That combat doctrine is active for that <span class="kwb">INFANTRY</span> unit.`),
  )
  newStratagems.push(
    stratagem('aggressive-disembarkation', 'AGGRESSIVE DISEMBARKATION', id, 1, 'Wargear', 'Any phase', 'Your turn',
      `<b>WHEN:</b> Any phase, when a friendly ${AA} unit embarked within a <span class="kwb">TRANSPORT</span> is selected to move.<br><br><b>TARGET:</b> That ${AA} unit.<br><br><b>EFFECT:</b> While making that move, each model in your unit can be set up within the set-up distance of that <span class="kwb">TRANSPORT</span>.<br><br><i>This allows you to set up your unit within the set-up distance of your TRANSPORT, instead of wholly within that distance.</i>`),
    stratagem('duty-is-never-done', 'DUTY IS NEVER DONE', id, 1, 'Battle Tactic', 'End of the Fight phase', 'Either player’s turn',
      `<b>WHEN:</b> End of the Fight phase.<br><br><b>TARGET:</b> One friendly unengaged ${AA} <span class="kwb">INFANTRY</span> unit that was eligible to fight this phase, is wholly within 6" of a friendly <span class="kwb">TRANSPORT</span> unit, and is eligible to embark within that <span class="kwb">TRANSPORT</span> unit.<br><br><b>EFFECT:</b> Your unit embarks within that <span class="kwb">TRANSPORT</span> unit.`),
    stratagem('storm-and-secure', 'STORM AND SECURE', id, 1, 'Wargear', 'End of your Movement phase', 'Your turn',
      `<b>WHEN:</b> End of your Movement phase.<br><br><b>TARGET:</b> One friendly ${AA} <span class="kwb">TRANSPORT</span> unit that has an ${AA} <span class="kwb">BATTLELINE</span> unit embarked within it.<br><br><b>EFFECT:</b> Select one objective your unit is controlling. That objective is secured.`),
  )
}

// ---------------------------------------------------------------------------
// 15. IRONSTORM SPEARHEAD (pg 18 / printed 173)
// ---------------------------------------------------------------------------
{
  const id = 'ironstorm-spearhead'
  newDetachments.push(detachment(id, 'Ironstorm Spearhead', 'ironstorm-auto-targeters', 'Ironstorm Auto-Targeters',
    `Friendly ${AA} <span class="kwb">VEHICLE</span> units' (excluding <span class="kwb">WALKER</span> units) ranged attacks can:<ul><li>Re-roll one hit roll.</li><li>Re-roll one wound roll.</li></ul>`))
  newEnhancements.push(
    enhancement('redoubtable-machine-spirit', 'Redoubtable Machine Spirit', id,
      `${AA} <span class="kwb">VEHICLE</span> unit only (excluding <span class="kwb">DEDICATED TRANSPORT</span>/<span class="kwb">FLY</span>/<span class="kwb">WALKER</span> units). This unit:<ul><li>Has 5+ InSv.</li><li>At the end of your Command phase, heals 1 wound.</li></ul>`),
    enhancement('gunnery-honours', 'Gunnery Honours', id,
      `${AA} <span class="kwb">VEHICLE</span> unit only (excluding <span class="kwb">DEDICATED TRANSPORT</span>/<span class="kwb">FLY</span>/<span class="kwb">WALKER</span> units). This unit's ranged attacks have [HEAVY].`),
  )
  newStratagems.push(
    stratagem('layered-ceramite', 'LAYERED CERAMITE', id, 1, 'Wargear', 'Any phase', 'Either player’s turn',
      `<b>WHEN:</b> Any phase, when a friendly ${AA} <span class="kwb">VEHICLE</span> unit suffers a mortal wound.<br><br><b>TARGET:</b> That ${AA} <span class="kwb">VEHICLE</span> unit.<br><br><b>EFFECT:</b> Your unit has Feel No Pain 5+ against mortal wounds.`),
    stratagem('might-of-the-machine-spirit', 'MIGHT OF THE MACHINE SPIRIT', id, 1, 'Strategic Ploy', 'Command phase', 'Your turn',
      `<b>WHEN:</b> Your Command phase.<br><br><b>TARGET:</b> One friendly ${AA} <span class="kwb">VEHICLE</span> unit (excluding <span class="kwb">DEDICATED TRANSPORT</span>/<span class="kwb">FLY</span>/<span class="kwb">WALKER</span> units).<br><br><b>EFFECT:</b> Until the start of your next Command phase, your unit can ignore modifiers to your unit's:<ul><li>M.</li><li>BS.</li><li>Hit rolls and wound rolls.</li></ul>`),
    stratagem('headhunter-doctrine', 'HEADHUNTER DOCTRINE', id, 1, 'Battle Tactic', 'Shooting phase', 'Your turn',
      `<b>WHEN:</b> Your Shooting phase, when a friendly ${AA} <span class="kwb">VEHICLE</span> unit (excluding <span class="kwb">DEDICATED TRANSPORT</span>/<span class="kwb">FLY</span>/<span class="kwb">WALKER</span> units) is selected to shoot.<br><br><b>TARGET:</b> That ${AA} <span class="kwb">VEHICLE</span> unit.<br><br><b>EFFECT:</b> Your unit's ranged attacks have [LETHAL HITS: MONSTER/VEHICLE].`),
  )
}
