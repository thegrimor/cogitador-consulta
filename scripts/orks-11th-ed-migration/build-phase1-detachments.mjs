// Builds Phase 1 (armyRules + detachments + stratagems + enhancements) of the new
// 11th-ed Orks codex JSON, transcribed from public/pdf/11th Codex Orks.pdf pages 118-137
// (printed page numbers) / 122-141 (PDF page numbers).
//
// NOTE ON POINTS: the codex explicitly states it does NOT include points values, Detachment
// Points (DP) or army-list disposition tags -- those live in Warhammer 40,000: The App /
// a future Faction Pack (pg 118: "we have not included points values ... points values are
// reviewed on a regular basis"). So `cost` (enhancements), `dp` and `disposition` (detachments)
// are left as 0 / "" placeholders here, pending that separate source. Flagged for the user.
import fs from 'fs'

const kwb = (s) => `<span class="kwb">${s}</span>`
const slug = (s) => s.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

let stratagemCounter = 0

function detachment(name, tagline, { rules, enhancements, stratagems }) {
  const id = slug(name)
  return {
    id, name, tagline,
    disposition: '',
    dp: 0,
    chapters: [],
    abilities: rules.map(r => ({
      id: slug(r.name),
      name: r.name,
      description: r.description,
      ...(r.effect ? { effect: r.effect } : {}),
      ...(r.options ? { options: r.options } : {}),
    })),
    enhancements: enhancements.map(e => ({
      id: slug(e.name),
      name: e.name,
      cost: 0,
      detachmentId: id,
      detachmentName: name,
      description: e.description,
      ...(e.effect ? { effect: e.effect } : {}),
    })),
    stratagems: stratagems.map(s => ({
      id: slug(s.name),
      name: s.name.toUpperCase(),
      detachmentId: id,
      cpCost: s.cpCost ?? 1,
      type: `${name} – ${s.type || 'Battle Tactic Stratagem'}`,
      turn: s.turn,
      phase: s.phase,
      description: s.description,
      ...(s.effect ? { effect: { ...s.effect, isStratagem: true, cpCost: s.cpCost ?? 1 } } : {}),
    })),
  }
}

const whenTargetEffect = (when, target, effect) =>
  `<b>WHEN:</b> ${when}<br><br><b>TARGET:</b> ${target}<br><br><b>EFFECT:</b> ${effect}`

const armyRules = [
  {
    id: 'waaagh', name: 'Waaagh!',
    description: `The infamous war cry of the Orks is known and feared throughout the galaxy. Friendly ${kwb('ORKS')} units with this ability can:<ul><li>Re-roll advance rolls.</li><li>Become <b>riled up</b>, as stated in other rules. While a unit is riled up: it has 5+ invulnerable save; its ranged attacks have ${kwb('[ASSAULT]')}; when it is selected to make an advance move, that advance move does not prevent it from being eligible to declare a charge.</li></ul><b>War Cry</b> (Once per battle, per army): At the start of the Command phase, you can use this ability. If you do, friendly ${kwb('ORKS')} units with the Waaagh! ability are riled up until the end of the next turn.`,
    options: [
      { name: 'Riled Up (5+ Invulnerable Save)', effect: { effects: { saveMod: 1 }, target: 'defender' } },
      { name: 'Riled Up (Ranged attacks have Assault)', effect: { effects: {}, combatType: 'ranged' } },
    ],
  },
  {
    id: 'da-boss', name: 'Da Boss',
    description: `Whether capable of kunnin' strategy or favouring something far less complicated, the biggest Ork tends to have a voice as aggressive and brutal as the rest of him. At the start of the battle round, if a model with this ability is your ${kwb('WARLORD')}, gain 1CP.`,
  },
  {
    id: 'unstable-energies', name: 'Unstable Energies',
    description: `Ork psykers – Weirdboyz and their unsavoury ilk – release the painful build-up of Waaagh! energy in sudden discharges of power, usually with spectacularly lethal results. ${kwb('ORKS PSYKER')} units with this ability have a psyker level of 1 or higher, specified in that unit's abilities. Each psychic ability has a psychic level of 1 or higher, specified in that ability's name. In a battle round, a friendly ${kwb('ORKS PSYKER')} unit can use a number of psychic abilities whose total psychic level does not exceed that ${kwb('PSYKER')} unit's psyker level.`,
  },
]

const detachments = [
  detachment('War Horde', 'Riotous multitudes of Orks and ramshackle vehicles hit the foe with disordered brutality', {
    rules: [{
      name: 'Get Stuck In',
      description: `Joyously anarchic and recklessly destructive, all Orks eagerly get stuck in to every fight. Friendly ${kwb('ORKS')} units' melee attacks have ${kwb('[SUSTAINED HITS 1]')}.`,
      effect: { effects: { sustainedHitsBonus: 1 }, combatType: 'melee' },
    }],
    enhancements: [
      {
        name: "Headwoppa's Killchoppa",
        description: `Tribal legend speaks of a blood-slick choppa once owned by Grand Warboss Headwoppa. ${kwb('ORKS')} model only. If this unit made a charge move this turn, this model's melee attacks have +1 AP.`,
        effect: { effects: { apMod: 1 }, combatType: 'melee', bearerOnly: true },
      },
      {
        name: "Da Boss is Watchin'",
        description: `This war leader is a glowering incarnation of violence. ${kwb('ORKS')} model only (Once per battle, per army). In your Movement phase, you can use this ability. If you do, this unit is riled up until the start of your next turn.`,
      },
      {
        name: "Kunnin' but Brutal",
        description: `Feigning weakness, this Ork allows his foes to think he's legging it before suddenly piling back into the fight. ${kwb('ORKS')} model only. When this unit is selected to make a fall-back move, that fall-back move does not prevent this unit from being eligible to shoot/declare a charge.`,
      },
      {
        name: 'Follow Me Ladz',
        description: `Always found at the forefront of an assault, this Ork likes to be the first into the fray. ${kwb('ORKS')} model only. This unit has +2" M.`,
      },
    ],
    stratagems: [
      {
        name: "Breakin' Heads", cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Any phase',
        description: whenTargetEffect(
          `Any phase, when a friendly attached ${kwb('ORKS INFANTRY')} unit becomes battle-shocked.`,
          `That ${kwb('ORKS INFANTRY')} unit. You can target that unit with this stratagem even though it is battle-shocked.`,
          `Roll one D3: your unit suffers a number of mortal wounds equal to the result, or: your unit is no longer battle-shocked.`),
      },
      {
        name: "Mow 'Em Down", cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Fight phase',
        description: whenTargetEffect(
          `Fight phase, when a friendly ${kwb('ORKS VEHICLE')} unit (excluding ${kwb('WALKER')} units) that made a charge move this turn is selected to fight.`,
          `That ${kwb('ORKS VEHICLE')} unit.`,
          `Your unit's melee attacks have ${kwb('[CLEAVE 1]')}, or: if that attack already has ${kwb('[CLEAVE]')}, +1 to the value of that ${kwb('[CLEAVE]')} (e.g. ${kwb('[CLEAVE 1]')} becomes ${kwb('[CLEAVE 2]')}).`),
        effect: { effects: { cleaveBonus: 1 }, combatType: 'melee' },
      },
      {
        name: "Hit 'Em Harder", cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Fight phase',
        description: whenTargetEffect(`Fight phase, when a friendly ${kwb('ORKS')} unit is selected to fight.`, `That ${kwb('ORKS')} unit.`, `Your unit's melee attacks have ${kwb('[LETHAL HITS]')}.`),
        effect: { effects: { lethalHitsBonus: true }, combatType: 'melee' },
      },
      {
        name: 'Fungus-Fuel Injection', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Movement phase',
        description: whenTargetEffect(`Your Movement phase, when a friendly ${kwb('ORKS MOUNTED/VEHICLE')} unit is selected to move.`, `That ${kwb('ORKS MOUNTED/VEHICLE')} unit.`, `Your unit has +2" M.`),
      },
      {
        name: 'Orks is Never Beaten', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Fight phase',
        description: whenTargetEffect(
          `Fight phase, when an enemy unit targets a friendly ${kwb('ORKS')} unit (excluding ${kwb('TITANIC')} units).`,
          `That ${kwb('ORKS')} unit.`,
          `When a model in your unit is destroyed, if your unit has not been selected to fight this phase, roll one D6, with +1 to that roll if your unit is riled up: on a 4+, do not remove that model from the battlefield. When your unit has fought, or at the end of the phase (whichever comes first), that model is removed from the battlefield.`),
      },
      {
        name: 'Close-Range Dakka', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting phase',
        description: whenTargetEffect(`Your Shooting phase, when a friendly ${kwb('ORKS')} unit is selected to shoot.`, `That ${kwb('ORKS')} unit.`, `Your unit's ranged attacks have ${kwb('[RAPID FIRE 1]')}, or: if that attack already has ${kwb('[RAPID FIRE]')}, +1 to the value of that ${kwb('[RAPID FIRE]')} (e.g. ${kwb('[RAPID FIRE 1]')} becomes ${kwb('[RAPID FIRE 2]')}).`),
      },
    ],
  }),

  detachment('Green Tide', 'Bellowing Ork infantry in unruly mobs hit like an avalanche of muscle', {
    rules: [{
      name: 'Mob-Handed Brutality',
      description: `In the massive fights that Orks enjoy, the only way to ensure a slice of the action is to fight harder.<ul><li>Friendly ${kwb('BOYZ')} units' melee attacks have ${kwb('[SUSTAINED HITS 1]')}.</li><li>If a friendly ${kwb('ORKS INFANTRY')} unit made a charge move this turn, that unit's melee attacks have ${kwb('[LETHAL HITS: non-MONSTER/VEHICLE]')}.</li></ul>`,
      effect: { effects: { sustainedHitsBonus: 1 }, combatType: 'melee' },
    }],
    enhancements: [
      {
        name: 'Ferocious Show-Off',
        description: `This brutal fighter is even more dangerous with a raucous audience of chanting Orks. ${kwb('ORKS INFANTRY')} model only. This model's melee attacks have +1 A, or: if this unit has 11+ models, +2 A.`,
        effect: { effects: { attacksMod: 1 }, combatType: 'melee', bearerOnly: true },
      },
      {
        name: "'Ardboyz", description: `Orks with enough teef acquire extra scrap iron plates collectively referred to as 'eavy armour. ${kwb('BOYZ')} unit only. This unit has 4+ Sv. (Upgrade – can be taken more than once per army.)`,
      },
    ],
    stratagems: [
      {
        name: 'Unbridled Carnage', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Fight phase',
        description: whenTargetEffect(`Fight phase, when a friendly ${kwb('BOYZ')} unit that made a charge move this turn is selected to fight.`, `That ${kwb('BOYZ')} unit.`, `Your unit's melee attacks have +1 A.`),
        effect: { effects: { attacksMod: 1 }, combatType: 'melee' },
      },
      {
        name: 'Mob Mentality', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Command phase',
        description: whenTargetEffect(`Start of the Battle-shock step of your Command phase.`, `One friendly ${kwb('ORKS INFANTRY')} unit of 13+ models.`, `Select one visible friendly ${kwb('ORKS')} unit within 12" of your unit. That unit's battle-shock rolls are automatically successful.`),
      },
      {
        name: "'Ere We Go", cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Movement phase',
        description: whenTargetEffect(`Your Movement phase, when a friendly ${kwb('BEAST SNAGGA BOYZ/BOYZ')} unit is selected to move.`, `That ${kwb('BEAST SNAGGA BOYZ/BOYZ')} unit.`, `Your unit has +2 to advance rolls.`),
      },
    ],
  }),

  detachment('Bully Boyz', 'With huge muscles, weapons and egos, Orkish veterans can krump anyone', {
    rules: [{
      name: 'Displays of Savagery',
      description: `Nobz have a position of dominance to maintain, and do so in vicious eruptions of violence. Friendly ${kwb('MEGANOBZ/NOBZ')} units' melee attacks have ${kwb('[SUSTAINED HITS 1]')}.`,
      effect: { effects: { sustainedHitsBonus: 1 }, combatType: 'melee' },
    }],
    enhancements: [
      {
        name: 'Wimp-Kickaz', description: `Any snivelling gitz attempting to back away from a good fight with these arrogant Nobz get a good kicking. ${kwb('NOBZ')} unit only. When an enemy unit engaged with this unit is selected to make a fall-back move: that enemy unit must select the desperate escape mode; if this unit is riled up, that enemy unit has -1 to the hazard rolls made for that desperate escape. (Upgrade.)`,
      },
      {
        name: 'Tellyporta Boss', description: `This Ork has bullied his way into possession of a mostly functional tellyporta pad. ${kwb('MEGA ARMOUR')} model only. This unit (excluding ${kwb('VEHICLE')} units) has Deep Strike.`,
      },
    ],
    stratagems: [
      {
        name: 'Too Arrogant to Die', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Fight phase',
        description: whenTargetEffect(`Fight phase, when an enemy unit targets a friendly ${kwb('MEGANOBZ/NOBZ')} unit.`, `That ${kwb('MEGANOBZ/NOBZ')} unit.`, `When a model in your unit is destroyed, if your unit has not been selected to fight this phase, roll one D6, with +1 to that roll if your unit is riled up: on a 4+, do not remove that model from the battlefield. When your unit has fought, or at the end of the phase (whichever comes first), that model is removed from the battlefield.`),
      },
      {
        name: 'Armed to da Teef', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting or Fight phase',
        description: whenTargetEffect(`Your Shooting phase or the Fight phase, when a friendly ${kwb('MEGANOBZ/NOBZ')} unit is selected to attack.`, `That ${kwb('MEGANOBZ/NOBZ')} unit.`, `Your unit's attacks can re-roll hit rolls of 1, or: if your unit is riled up, re-roll hit rolls.`),
        effect: { effects: { rerollHitsOf1: true } },
      },
      {
        name: 'Hulking Brutes', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Shooting phase',
        description: whenTargetEffect(`Your opponent's Shooting phase, when an enemy unit targets a friendly ${kwb('MEGANOBZ/NOBZ')} unit.`, `That ${kwb('MEGANOBZ/NOBZ')} unit.`, `Ranged attacks that target your unit with a S greater than your unit's T have -1 to wound rolls, or (+1CP): ranged attacks that target your unit have -1 to wound rolls.`),
        effect: { effects: { woundMod: -1 }, combatType: 'ranged', target: 'defender' },
      },
    ],
  }),

  detachment('Runt Swarm', 'Sneaky and gittish Gretchin are surprisingly effective in large numbers', {
    rules: [{
      name: 'Sneaky Little Gitz',
      description: `Given no position of importance, Grots find their niche as sneaks, thieves and mischief-makers.<ul><li>Friendly ${kwb('GRETCHIN')} units have ${kwb('BATTLELINE')}.</li><li>When a friendly ${kwb('GRETCHIN')} unit is selected to make an advance/fall-back move, that move does not prevent this unit from being eligible to start an action.</li></ul>`,
    }],
    enhancements: [
      { name: 'Extra Sneaky', description: `A lifetime of evading the attentions of Orks and even other runts has honed these Grots' sneakiness. ${kwb('GRETCHIN')} unit only. This unit has -3" detection range. (Upgrade.)` },
      { name: 'Minefield Detail', description: `Rebellious, lazy or just plain unlucky Gretchin are driven into dangerous vanguard duties. ${kwb('GRETCHIN')} unit only. While this unit is not embarked, this unit has Scouts 6". (Upgrade.)` },
    ],
    stratagems: [
      {
        name: 'Infested War Zone', cpCost: 2, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Any phase',
        description: whenTargetEffect(`Any phase, when an enemy unit has attacked.`, `One friendly ${kwb('GRETCHIN')} unit that was just destroyed. You can target that unit with this stratagem even though that unit was just destroyed.`, `Add a new ${kwb('GRETCHIN')} unit to your army identical to your destroyed unit, in strategic reserves, at its starting strength, with its full wounds remaining.`),
      },
      {
        name: 'Scarper!', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Movement phase',
        description: whenTargetEffect(`Your opponent's Movement phase, when an enemy unit ends a move within 8" of a friendly unengaged ${kwb('GRETCHIN')} unit.`, `That ${kwb('GRETCHIN')} unit.`, `Your unit can make a normal move of up to D6", or: up to 6" instead if your unit is an attached unit.`),
      },
      {
        name: 'Grot Shields', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Shooting phase',
        description: whenTargetEffect(`Your opponent's Shooting phase, when an enemy unit targets a friendly ${kwb('ORKS INFANTRY')} unit (excluding ${kwb('GRETCHIN')} units).`, `One friendly ${kwb('GRETCHIN')} unit within 3" of that ${kwb('ORKS INFANTRY')} unit.`, `When a hit roll for that enemy unit's ranged attacks that target that ${kwb('ORKS')} unit results in a hit, if a model in your ${kwb('GRETCHIN')} unit is on the battlefield, end the attack sequence for that attack and your ${kwb('GRETCHIN')} unit suffers 1 mortal wound.`),
      },
    ],
  }),

  detachment('Shoota Boyz', 'Dakka-addicts gleefully unleash ear-splitting fusilades of firepower', {
    rules: [{
      name: 'Dakka! Dakka! Dakka!',
      description: `Always hunting for something to kill, when Orks spot a target they saturate it with dakka. Friendly ${kwb('ORKS INFANTRY')} units' ranged attacks have ${kwb('[ASSAULT]')}. While this unit is riled up, +3" R.`,
      effect: { effects: {}, combatType: 'ranged' },
    }],
    enhancements: [
      {
        name: 'Supa-Glowy Fing',
        description: `The Mek who cobbled together this strange dakka accelerator isn't sure exactly what it does. ${kwb('ORKS INFANTRY')} model only (excluding ${kwb('WEIRDBOY')} models). This model's ranged attacks have ${kwb('[ANTI-INFANTRY 4+]')}, ${kwb('[DEVASTATING WOUNDS]')} and ${kwb('[SUPA-HAZARDOUS]')}.`,
        effect: { effects: { devastatingWoundsBonus: true }, combatType: 'ranged', bearerOnly: true },
      },
      { name: "Targetin' Squigs", description: `With a couple of these boggle-eyed varieties of Squigs on hand, even Ork shooting has a chance of hitting distant targets. ${kwb('BIG MEK/BIGBOSS/WARBOSS')} model only. This unit's ranged attacks (excluding ${kwb('[TORRENT]')} attacks) have +3" R.` },
    ],
    stratagems: [
      {
        name: 'Kustom Dakka', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting phase',
        description: whenTargetEffect(`Your Shooting phase, when a friendly ${kwb('ORKS INFANTRY')} unit is selected to shoot.`, `That ${kwb('ORKS INFANTRY')} unit.`, `Your unit's ranged attacks that target a unit (excluding ${kwb('MONSTER/VEHICLE')} units) have +1 to wound rolls.`),
        effect: { effects: { woundMod: 1 }, combatType: 'ranged' },
      },
      {
        name: "Glowin' Dakka", cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting phase',
        description: whenTargetEffect(`Your Shooting phase, when a friendly ${kwb('ORKS INFANTRY')} unit is selected to shoot.`, `That ${kwb('ORKS INFANTRY')} unit.`, `Your unit's ranged attacks that target a unit within 9" have +1 AP.`),
        effect: { effects: { apMod: 1 }, combatType: 'ranged' },
      },
      {
        name: 'Never Enough Dakka', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting phase',
        description: whenTargetEffect(`Your Shooting phase, when a friendly ${kwb('ORKS INFANTRY')} unit is selected to shoot.`, `That ${kwb('ORKS INFANTRY')} unit.`, `Your unit's ranged attacks have ${kwb('[SUSTAINED HITS 1]')}.`),
        effect: { effects: { sustainedHitsBonus: 1 }, combatType: 'ranged' },
      },
    ],
  }),

  detachment('Taktikal Brigade', 'Backstabbers and rokkiteers spring dubious but violently effective strategies', {
    rules: [{
      name: 'Suspiciously Well Organised',
      description: `An un-Orky compulsion for discipline can wrongfoot enemies expecting anarchic disorder.<ul><li>Friendly ${kwb('STORMBOYZ')} units have ${kwb('BATTLELINE')}.</li><li>When a friendly ${kwb('BOYZ/KOMMANDOS/STORMBOYZ')} unit is selected to make a fall-back move, that fall-back move does not prevent that unit from being eligible to declare a charge.</li></ul>`,
    }],
    enhancements: [
      { name: 'Kill Kommanda', description: `Possessed of exceptional kunnin' and a weird obsession with sneakin' about. ${kwb('BIG MEK/WARBOSS INFANTRY')} model only. While this model is part of an attached unit, this model has Infiltrators and Stealth.` },
      { name: 'Throat-Slittas', description: `Veterans of the relatively organised butchery of well-protected targets. ${kwb('KOMMANDOS/STORMBOYZ')} unit only. This unit's melee attacks have ${kwb('[LETHAL HITS: non-MONSTER/VEHICLE]')}. (Upgrade.)`, effect: { effects: { lethalHitsBonus: true }, combatType: 'melee' } },
    ],
    stratagems: [
      {
        name: 'Dubious Restraint', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Movement phase',
        description: whenTargetEffect(`Start/end of your Movement phase.`, `One friendly ${kwb('BOYZ/KOMMANDOS/STORMBOYZ')} unit.`, `Select one objective your unit is controlling. That objective is secured.`),
      },
      {
        name: 'Mind Mostly on the Mission', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Movement phase',
        description: whenTargetEffect(`Your Movement phase, when a friendly ${kwb('BOYZ/KOMMANDOS/STORMBOYZ')} unit is selected to make an advance/fall-back move.`, `That ${kwb('BOYZ/KOMMANDOS/STORMBOYZ')} unit.`, `That move does not prevent your unit from being eligible to start an action.`),
      },
      {
        name: 'While Their Backs Are Turned', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: "Opponent's turn", phase: 'Movement phase',
        description: whenTargetEffect(`End of your opponent's Movement phase.`, `One friendly unengaged ${kwb('BOYZ/KOMMANDOS/STORMBOYZ')} unit that was engaged at the start of the phase.`, `Your unit can make a normal move of up to 6".`),
      },
    ],
  }),

  detachment('Wreckas', 'Destructive loot-grabbas descend on prized targets with vicious grins', {
    rules: [{
      name: "Wreckin' and Lootin'",
      description: `Whether piratical or merely larcenous, Orks with an eye for loot react forcefully to rival claims. In your Shooting phase, when a friendly ${kwb('BREAKA BOYZ/FLASH GITZ/TANKBUSTAS')} unit is selected to shoot, if that unit or its target is within range of an objective, that unit's attacks can re-roll hit rolls of 1.`,
      effect: { effects: { rerollHitsOf1: true }, combatType: 'ranged' },
    }],
    enhancements: [
      { name: "Kaptin's Hat", description: `This impressively ostentatious piece of headgear signifies that whoever nicked it last controls a fleet of kroozers. ${kwb('BIG MEK/WARBOSS INFANTRY')} model only. When both players have deployed their armies, you can redeploy up to three friendly ${kwb('ORKS INFANTRY')} units into strategic reserves, regardless of how many units are already in strategic reserves.` },
      { name: 'Supa-Snazz Dakka', description: `Coils of sparking wires, unstable propellant and throbbing power cells. ${kwb('FLASH GITZ')} unit only. This unit's Snazzgun weapons have ${kwb('[RAPID FIRE 1]')}. (Upgrade.)` },
    ],
    stratagems: [
      {
        name: "Drive-By Bustin'", cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting phase',
        description: whenTargetEffect(`Your Shooting phase, when a friendly ${kwb('ORKS TRANSPORT')} unit is selected to shoot.`, `That ${kwb('ORKS TRANSPORT')} unit.`, `Your unit's ranged attacks with weapons selected for the Firing Deck ability have +1 to hit rolls.`),
        effect: { effects: { hitMod: 1 }, combatType: 'ranged' },
      },
      {
        name: 'Grab It', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting phase',
        description: whenTargetEffect(`Your Shooting phase, when a friendly unengaged ${kwb('BREAKA BOYZ/FLASH GITZ/TANKBUSTAS')} unit has shot.`, `That ${kwb('BREAKA BOYZ/FLASH GITZ/TANKBUSTAS')} unit.`, `Your unit can make a normal move of up to 6", and must end that move within range of an objective. Your unit is not eligible to declare a charge until the end of the turn.`),
      },
      {
        name: 'Gun-Crazy Show-Offs', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Shooting phase',
        description: whenTargetEffect(`Your opponent's Shooting phase, when an enemy unit has shot.`, `One friendly ${kwb('FLASH GITZ/TANKBUSTAS')} unit hit by those attacks.`, `Your unit shoots using normal shooting, but while doing so your unit can only target that enemy unit.`),
      },
    ],
  }),

  detachment('Da Big Hunt', 'The ground trembles when stampeding Beast Snaggas converge on their prey', {
    rules: [{
      name: 'Da Hunt is On',
      description: `Beast Snaggas fanatically hunt the biggest targets and are experts in finding their weak spots. Friendly ${kwb('BEAST SNAGGA')} units' attacks that target a ${kwb('MONSTER/VEHICLE')} unit have +1 AP.`,
      effect: { effects: { apMod: 1 }, requiresTargetKeyword: 'MONSTER' },
    }],
    enhancements: [
      { name: 'Glory Hog', description: `When bigger prey is sighted, nothing can keep this hunter from it. ${kwb('BEAST SNAGGA')} model only. When this unit is selected to make a fall-back move, that fall-back move does not prevent this unit from being eligible to declare a charge.` },
      { name: 'It Came from da Drops', description: `The monstrous resilience of this Beastboss' hulking mount has inspired many lurid tales. ${kwb('BEASTBOSS ON SQUIGOSAUR')} model only. This model has +1 T.` },
    ],
    stratagems: [
      {
        name: "Where D'ya Fink You're Going?", cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: "Opponent's turn", phase: 'Movement phase',
        description: whenTargetEffect(`Your opponent's Movement phase, when an enemy unit is selected to make a fall-back move, if that enemy unit is engaged with a friendly ${kwb('BEAST SNAGGA')} unit.`, `That ${kwb('BEAST SNAGGA')} unit.`, `When an enemy unit engaged with your unit is selected to make a fall-back move, that enemy unit must use the desperate escape mode. If that enemy unit is a ${kwb('MONSTER/VEHICLE')} unit, it makes three additional hazard rolls for each ${kwb('BEAST SNAGGA')} unit it is engaged with, with -1 from those hazard rolls if that enemy unit is battle-shocked.`),
      },
      {
        name: 'Goaded into Action', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Shooting phase',
        description: whenTargetEffect(`Your opponent's Shooting phase, when an enemy unit has shot.`, `One friendly unengaged ${kwb('BEAST SNAGGA')} unit that lost a wound as a result of those attacks.`, `Your unit can make a surge move of up to D6". If your unit is riled up, it can re-roll that D6.`),
      },
      {
        name: 'Instinctive Hunters', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Fight phase',
        description: whenTargetEffect(`End of your opponent's Fight phase.`, `One friendly unengaged ${kwb('BEAST SNAGGA')} unit within 6" of a battlefield edge.`, `Place your unit in strategic reserves.`),
      },
    ],
  }),

  detachment('Madcap Meks', 'Tech-savvy tinkerers unleash insane contraptions and anarchic gubbinz', {
    rules: [{
      name: 'Unpredictable Genius',
      description: `Meks haul all manner of weird bullets, unstable power cells and kustomised extras to battle. In your Shooting phase, when all of a friendly ${kwb('BIG MEK/MEK GUNZ/MORKANAUT/WAZBOM BLASTAJET')} unit's ranged attacks target a single enemy unit, roll one D6: on a 1 ("Dat's Weird"), the target unit has 4+ InSv until your unit has shot; on a 2-3 ("Hop Splat"), select one other enemy unit within 3" of the target – that unit suffers D3 mortal wounds; on a 4 ("Seekerz"), those attacks have +1 to hit rolls; on a 5 ("Lifted"), the target unit has FLY and cannot have the benefit of cover until your unit has shot; on a 6 ("Runtified"), the target unit has -1 T until your unit has shot.`,
    }],
    enhancements: [
      { name: 'Mekwaaagh! Mastermind', description: `This Big Mek's obsession with feverish inventing inspires other Orks to excitable aggression. ${kwb('BIG MEK')} model only. This unit is riled up.` },
      {
        name: 'Temperamental Shokka', description: `Shokk attack guns are notoriously unreliable, and even with a supposedly enhanced set of worky bits. ${kwb('BIG MEK WITH SHOKK ATTACK GUN')} model only. In your Shooting phase, when this unit is selected to shoot, you can roll one D6: on a 1, this model's Shokk Attack Gun weapon has ${kwb('[TORRENT]')}, and when this unit has shot, this model is destroyed; on a 2-5, this model's Shokk Attack Gun weapon has +1 A; on a 6, this model's Shokk Attack Gun weapon has ${kwb('[SUSTAINED HITS 2]')}. (Upgrade.)`,
      },
      { name: 'Enhanced Runt-Maw', description: `These kustom jobs incorporate an oversized suction device, drawing in nearby runts, Squigs and scrap. ${kwb('BIG MEK WITH SHOKK ATTACK GUN')} model only. When this unit has shot, select one enemy unit hit by those attacks – that unit is infested with Snotlings until the start of your next turn. While an enemy unit is infested with Snotlings, that unit has -1 to leadership rolls. (Upgrade.)` },
    ],
    stratagems: [
      {
        name: 'Vindictive Artillerists', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting phase',
        description: whenTargetEffect(`Your Shooting phase, when a friendly ${kwb('MEK GUNZ')} unit is selected to shoot.`, `That ${kwb('MEK GUNZ')} unit.`, `Your unit's ranged attacks have ${kwb('[LETHAL HITS]')}, or: ${kwb('[SUSTAINED HITS 1]')}, or: ${kwb('[HAZARDOUS]')}, ${kwb('[LETHAL HITS]')} and ${kwb('[SUSTAINED HITS 1]')}.`),
        effect: { effects: { lethalHitsBonus: true }, combatType: 'ranged' },
      },
    ],
  }),

  detachment('Dread Mob', 'Ramshackle walkers stomp into the foe in a clanking knot of guns and klaws', {
    rules: [{
      name: 'Try Dat Button!',
      description: `Inviting Mek-wired buttons offer varied and erratic lethality. In your Shooting phase or the Fight phase, when a friendly ${kwb('ORKS WALKER')} unit (excluding ${kwb('TITANIC')} units) is selected to attack, you can roll either one D6 or two D6 (keep re-rolling duplicate results). This unit's attacks have the relevant rule(s): 1-2, +1 A; 3-4, +2 S; 5-6, +1 AP. If you rolled two D6, when this unit has attacked, this unit makes one hazard roll.`,
    }],
    enhancements: [
      { name: 'Cybork Boosta', description: `This Mek's extra bioniks help him keep up with his Kans. ${kwb('BIG MEK/MEK')} model only. This model has +2" M.` },
      { name: 'Dreadherder', description: `This Mek is deft at avoiding his creations' feet and klaws. ${kwb('BIG MEK')} model only. While this model is within 3" of a friendly ${kwb('ORKS WALKER')} unit (excluding ${kwb('BIG MEK')} units): this model has Lone Operative; in your Shooting phase, you can select one friendly ${kwb('ORKS WALKER')} unit within 3" of this model – that unit's attacks can re-roll hit rolls of 1 until the end of the turn.` },
    ],
    stratagems: [
      {
        name: 'Crazed Rampage', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Fight phase',
        description: whenTargetEffect(`Fight phase, when an enemy unit targets a friendly ${kwb('ORKS WALKER')} unit (excluding ${kwb('TITANIC')} units).`, `That ${kwb('ORKS WALKER')} unit.`, `When a model in your unit is destroyed, if your unit has not been selected to fight this phase, roll one D6, with +3 to the result if your unit has ${kwb('DEFF DREAD')}: on a 4+, do not remove that model from the battlefield. When your unit has fought, or at the end of the phase (whichever comes first), that model is removed from the battlefield.`),
      },
      {
        name: 'Dread Power', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Movement phase',
        description: whenTargetEffect(`Your Movement phase.`, `One friendly ${kwb('ORKS WALKER')} unit.`, `Your unit is riled up until the start of your next turn.`),
      },
      {
        name: 'Stomping Juggernaut', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Movement or Charge phase',
        description: whenTargetEffect(`Your Movement/Charge phase, when a friendly ${kwb('ORKS WALKER')} unit is selected to move or declares a charge.`, `That ${kwb('ORKS WALKER')} unit.`, `Your unit has MOBILE.`),
      },
    ],
  }),

  detachment('Blitz Brigade', 'In a thundering mass, heavily armed tanks and rigs plough towards the foe', {
    rules: [{
      name: 'Unstoppable Momentum',
      description: `Like mobile armoured fortresses, little can stop the crushing impetus of the Orks' hulking wagons.<ul><li>Friendly ${kwb('WAGON')} units can re-roll charge rolls.</li><li>When a friendly ${kwb('WAGON')} unit is selected to make an advance move, that unit can change advance rolls to a 6.</li></ul>`,
    }],
    enhancements: [
      { name: "Targetin' Gizmos", description: `These sparkly optiks and other elaborate gitfindas help focus a wagon's dakka. ${kwb('WAGON')} unit only. While a ${kwb('BIG MEK')} model is embarked within this unit: this unit's ranged attacks have ${kwb('[IGNORES COVER]')}; if this unit is riled up, this unit's ranged attacks have ${kwb('[SUSTAINED HITS 1]')}. (Upgrade.)` },
      { name: 'Boss Boomer', description: `Fitted with speakin' tubes linked to deafening projectors. ${kwb('WAGON')} unit only. While a ${kwb('WARBOSS')} model is embarked within this unit, this unit has that ${kwb('WARBOSS')} model's Intimidating Motivation/Keep Huntin' ability. (Upgrade.)` },
    ],
    stratagems: [
      {
        name: "Keep It Runnin'", cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Fight phase',
        description: whenTargetEffect(`End of the Fight phase.`, `One friendly unengaged ${kwb('ORKS INFANTRY')} unit that was eligible to fight this phase and is wholly within 6" of a friendly ${kwb('TRANSPORT')} unit that ${kwb('INFANTRY')} unit is able to embark within.`, `Your ${kwb('INFANTRY')} unit embarks within that ${kwb('TRANSPORT')} unit.`),
      },
      {
        name: 'Readied Brawlers', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Movement phase',
        description: whenTargetEffect(`Your Movement phase, when a friendly ${kwb('WAGON')} unit ends a normal move.`, `That ${kwb('WAGON')} unit.`, `Units embarked within your unit can make an assault disembark move.`),
      },
      {
        name: 'Impending Krunch', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Charge phase',
        description: whenTargetEffect(`Your Charge phase, when a friendly ${kwb('WAGON')} unit ends a charge move.`, `That ${kwb('WAGON')} unit.`, `Each enemy unit engaged with your unit makes a battle-shock roll, with -1 to that battle-shock roll.`),
      },
    ],
  }),

  detachment('Kult of Speed', 'Speed-addled loons hurtle into battle in an exhaust-choked death race', {
    rules: [{
      name: 'Adrenaline Junkies',
      description: `After smashing into the foe at full tilt, a Speed Freek will pull hairpin turns to do it all again.<ul><li>Friendly ${kwb('WARBIKERS')} units have ${kwb('BATTLELINE')}.</li><li>When a friendly ${kwb('SPEED FREEKS')} unit is selected to make an advance/fall-back move: that unit's ranged attacks have ${kwb('[ASSAULT]')} until the end of the turn; that move does not prevent that unit from being eligible to declare a charge.</li></ul>`,
    }],
    enhancements: [
      { name: 'Smoky Gubbinz', description: `These loud, fume-belching devices wreathe those in the Speed Freeks' wake in a thick bank of obscuring smoke. ${kwb('SPEED FREEKS')} unit only (excluding ${kwb('AIRCRAFT')} units). When an attack targets a unit that is not fully visible to the attacking model because of a model in this unit, the target has the benefit of cover against that attack. (Upgrade.)` },
      { name: 'Competitive Streak', description: `This Speedboss despises the thought of coming anything less than first in a race to reach the biggest fights. ${kwb('DEFFKILLA WARTRIKE')} model only. This unit can re-roll charge rolls.` },
    ],
    stratagems: [
      {
        name: 'Delicious Eating Squigs', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: 'Your turn', phase: 'Movement phase',
        description: whenTargetEffect(`Your Movement phase.`, `One friendly ${kwb('RUKKATRUKK SQUIGBUGGIES')} unit.`, `Select any number of friendly ${kwb('ORKS INFANTRY')} units within 3" of your unit. Each selected unit heals 3 wounds.`),
      },
      {
        name: 'Dakkastorm', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting phase',
        description: whenTargetEffect(`Your Shooting phase, when a friendly ${kwb('SPEED FREEKS')} unit is selected to shoot.`, `That ${kwb('SPEED FREEKS')} unit.`, `Your unit's ranged attacks have ${kwb('[SUSTAINED HITS 1]')}.`),
        effect: { effects: { sustainedHitsBonus: 1 }, combatType: 'ranged' },
      },
      {
        name: 'Speediest Freeks', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: "Opponent's turn", phase: 'Shooting phase',
        description: whenTargetEffect(`Your opponent's Shooting phase, when an enemy unit targets a friendly ${kwb('SPEED FREEKS')} unit.`, `That ${kwb('SPEED FREEKS')} unit.`, `Ranged attacks that target your unit fail on an unmodified hit roll of 1-3.`),
      },
    ],
  }),

  detachment('Flyboyz', 'Trigger-happy Ork pilots attack from the skies in blitzing aerial assaults', {
    rules: [{
      name: 'Skyborne Loons',
      description: `When attacking en masse, crazed and excitable Flyboyz unleash torrential quantities of dakka.<ul><li>Friendly ${kwb('ORKS AIRCRAFT')} units do not count towards the combined points value of your strategic reserves units.</li><li>While a friendly ${kwb('ORKS AIRCRAFT/DEFFKOPTAS')} unit is riled up, this unit's ranged attacks have +1 to hit rolls.</li></ul>`,
      effect: { effects: { hitMod: 1 }, combatType: 'ranged' },
    }],
    enhancements: [
      { name: 'Flyboss', description: `Brutish aces who have survived enough dogfights to rise to positions of superiority. ${kwb('ORKS AIRCRAFT')} unit only. This unit has CHARACTER. When this unit ends an ingress move, each friendly ${kwb('ORKS AIRCRAFT/DEFFKOPTAS')} unit within 6" of this unit is riled up until the start of your next turn. (Upgrade.)` },
      { name: 'Impulsive Recon', description: `Despite claims of scoutin', this aircraft's screaming dive ahead of its pilot's mates is purely for the thrill of attacking first. ${kwb('ORKS AIRCRAFT')} unit only. In your first Movement phase, this unit can make an ingress move. (Upgrade.)` },
    ],
    stratagems: [
      {
        name: "Flyin' Headbutt", cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Any phase',
        description: whenTargetEffect(`Any phase, when a friendly ${kwb('ORKS AIRCRAFT')} unit is destroyed, before rolling for any Deadly Demise.`, `That ${kwb('ORKS')} unit.`, `Your unit does not have the Deadly Demise ability. Select one enemy unit within 12" of your unit and roll eight D6: for each 4+, that enemy unit suffers 1 mortal wound. Then remove your unit from the battlefield.`),
      },
      {
        name: 'Long, Uncontrolled Bursts', cpCost: 1, type: 'Battle Tactic Stratagem',
        turn: 'Your turn', phase: 'Shooting phase',
        description: whenTargetEffect(`Your Shooting phase, when a friendly ${kwb('ORKS AIRCRAFT/DEFFKOPTAS')} unit is selected to shoot.`, `That ${kwb('ORKS AIRCRAFT/DEFFKOPTAS')} unit.`, `When your unit's ranged attacks target a ${kwb('FLY')} unit, those attacks can re-roll hit rolls.`),
      },
      {
        name: 'Whirligig Evasion', cpCost: 1, type: 'Strategic Ploy Stratagem',
        turn: "Opponent's turn", phase: 'Movement phase',
        description: whenTargetEffect(`Your opponent's Movement phase, when an enemy unit ends a move.`, `One friendly unengaged ${kwb('DEFFKOPTAS')} unit within 8" of that enemy unit.`, `Your unit can make a normal move of up to D6", or: up to 6" if your unit is riled up.`),
      },
    ],
  }),

  detachment('Brute Bosses', 'Belligerent generals and living embodiments of Orkdom lead the rampage', {
    rules: [{
      name: "'Ard as Nails",
      description: `The largest Orks have risen to their position through strength, savagery and being harder than anyone else. When a friendly ${kwb('WARBOSS')} model is destroyed, if this unit has not been selected to fight this phase, roll one D6, with +1 to the roll if your unit is riled up: on a 3+, do not remove this ${kwb('WARBOSS')} model from the battlefield. When this unit has fought, or at the end of the phase (whichever comes first), this ${kwb('WARBOSS')} model is removed from the battlefield.`,
    }],
    enhancements: [
      { name: 'Blitzboss', description: `It is said this Ork bleeds Squig oil and his growl is that of a revving engine. ${kwb('WARBOSS')} model only. A ${kwb('TRANSPORT')} unit (excluding ${kwb('WALKER')} units) this unit is embarked within has +2" M and 5+ InSv.` },
      {
        name: 'Proper Killy', description: `This unstoppable brute is an engine of destruction whose welts of scars have been won in countless victories. ${kwb('WARBOSS')} model only. This model can re-roll hit rolls of 1.`,
        effect: { effects: { rerollHitsOf1: true }, bearerOnly: true },
      },
      { name: "Morgog's Finkin' Cap", description: `Thanks to the tangle of stolen empyric electrodes wired into this helmet. ${kwb('WARBOSS')} model only (Once per battle, per army). At the end of your opponent's Movement phase, if this unit is unengaged, this unit can make a normal move of up to D6". If this unit is riled up, you can re-roll that D6.` },
      {
        name: 'Da Gobshot Thunderbuss', description: `Firing gold-plated teef as its unconventional ammunition. ${kwb('WARBOSS')} model only. This model has the following weapon – Da Gobshot Thunderbuss ${kwb('[LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 6]')}: Range 24", A6, BS4+, S7, AP-2, D2.`,
      },
      {
        name: 'Surly as a Squiggoth', description: `With a lifetime of picking fights with the galaxy's most lethal fighters behind him. ${kwb('INFANTRY WARBOSS')} model only (Once per battle, per army). At the end of a phase in which this model is destroyed, roll one D6: on a 2+, set this model back up on the battlefield as close as possible to where it was destroyed, unengaged, with 3 wounds remaining.`,
      },
      {
        name: 'Brutal but Kunnin\'', description: `What tactics occasionally pop into this Ork's head revolve purely around how hard he needs to wallop his enemies. ${kwb('WARBOSS')} model only. This model's melee attacks have +1 D.`,
        effect: { effects: { damageMod: 1 }, combatType: 'melee', bearerOnly: true },
      },
    ],
    stratagems: [],
  }),

  detachment('Wurrband', 'Weirdboyz vent supernatural energies in a storm of primitive Waaagh! power', {
    rules: [{
      name: 'Powers of da Waaagh!',
      description: `Surrounded by mobs of excitable Orks, Weirdboyz' shamanic powers build to spectacular phenomena.<ul><li>Friendly ${kwb('ORKS PSYKER')} models' ${kwb('[PSYCHIC]')} attacks have +1 S, and +1 S for every 5 models in this unit (or embarked within this model).</li></ul>Friendly ${kwb('ORKS PSYKER')} models have the following psychic abilities: <b>Roar of Mork</b> (psychic level 1) and <b>Visions of Violence</b> (psychic level 1, grants Fights First on a successful psychic roll).`,
      effect: { effects: { strengthMod: 1 } },
    }],
    enhancements: [
      {
        name: 'Da Krunch', description: `Roiling energies frequently erupt from this Weirdboy's eyes, solidifying above the enemy into the huge green foot of Gork (or Mork) himself. ${kwb('ORKS PSYKER')} model only. This model has the following weapon – Da Krunch ${kwb('[BLAST 3, HAZARDOUS, LETHAL HITS, PSYCHIC]')}: Range 24", A3, BS4+, S5, AP-1, D1.`,
      },
      {
        name: "'Eadbanger", description: `Known for yelling 'Kop dis, ya zogger!' at his chosen target beforehand. ${kwb('ORKS PSYKER')} model only. This model has the following weapon – 'Eadbanger ${kwb('[HAZARDOUS, PRECISION, PSYCHIC]')}: Range 24", A2, BS4+, S6, AP-3, D3.`,
      },
      {
        name: 'Warphead', description: `Where most Weirdboyz would quite like to be left alone, so-called Warpheads become addicted to the danger. ${kwb('ORKS PSYKER')} model only. This model has psyker level 2, has Deadly Demise D6 and can re-roll psychic rolls.`,
      },
    ],
    stratagems: [],
  }),
]

// Flatten to match the established per-faction JSON shape: enhancements/stratagems are
// top-level arrays (each carrying detachmentId), detachments keep only id/name/disposition/dp/
// chapters/abilities.
const flatEnhancements = []
const flatStratagems = []
const flatDetachments = detachments.map(d => {
  flatEnhancements.push(...d.enhancements)
  flatStratagems.push(...d.stratagems)
  return { id: d.id, name: d.name, disposition: d.disposition, dp: d.dp, chapters: d.chapters, abilities: d.abilities }
})

const output = { armyRules, detachments: flatDetachments, stratagems: flatStratagems, enhancements: flatEnhancements }
fs.writeFileSync(process.argv[2], JSON.stringify(output, null, 2))
console.log('wrote', process.argv[2])
console.log('detachments:', flatDetachments.length)
console.log('enhancements total:', flatEnhancements.length)
console.log('stratagems total:', flatStratagems.length)
