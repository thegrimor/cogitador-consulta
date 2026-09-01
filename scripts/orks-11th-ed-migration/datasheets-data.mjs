import { weapons, models, core, armyRule, ability, datasheet, kwb } from './build-phase2-datasheets.mjs'

export const datasheets = [

datasheet({
  name: 'Ghazghkull Thraka', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Adamantine 'Eadbutt; Gork's Klaw; Mork's Roar.`,
  models: models(`Ghazghkull Thraka|8"|10|2+|4+|16|6+|4|`),
  weapons: weapons(
    `Mork's Roar - Aimed [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 4]|36"|12|5+|6|-1|1`,
    `Mork's Roar - Point Blank [CLOSE-QUARTERS, TORRENT]|9"|2D6+2|-|6|-1|1`,
    `Adamantine 'Eadbutt [DEVASTATING WOUNDS, EXTRA ATTACKS, PRECISION]|Melee|1|2+|14|-2|D3+3`,
    `Gork's Klaw [CLEAVE 2, DEVASTATING WOUNDS]|Melee|7|2+|14|-3|4`,
  ),
  abilities: [
    armyRule('Da Boss'), armyRule('Waaagh!'),
    ability("Da Grand Warlord's Ladz", `While this unit is within 3" of another friendly ${kwb('ORKS INFANTRY')} unit, this unit has Lone Operative.`),
    ability("Makari, Hoist Dat Banner!", `(Once per battle, per army): In your Movement phase, you can select a number of friendly ${kwb('ORKS')} units equal to or less than the current battle round number. Those units are riled up until the start of your next turn.`),
    ability('Prophet of da Great Waaagh!', `(Aura): While a friendly ${kwb('ORKS')} unit is within 6" of this unit, that unit's melee attacks have +1 to hit rolls and +1 to wound rolls.`, { effects: { hitMod: 1, woundMod: 1 }, combatType: 'melee', appliesToNearby: true }),
    ability('Supreme Commander', `If this model is in your army, it must be your ${kwb('WARLORD')}.`),
  ],
  keywords: ['Infantry', 'Character', 'Epic Hero', 'Explosives', 'Warboss'],
  unitComposition: ['1 Ghazghkull Thraka'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: "adamantine 'eadbutt", count: 1 }, { name: "gork's klaw", count: 1 }, { name: "mork's roar", count: 1 }],
}),

datasheet({
  name: 'Nazdreg', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Kustom Blasta X; Moonchewa.`,
  models: models(`Nazdreg|5"|7|2+|5+|8|6+|1|`),
  weapons: weapons(
    `Kustom Blasta X - Gatler [HAZARDOUS]|24"|6|4+|9|-2|3`,
    `Kustom Blasta X - Shoota [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 2]|18"|4|4+|5|-1|1`,
    `Kustom Blasta X - Skorcha [BLAST 1, TORRENT]|12"|3|-|5|-1|1`,
    `Kustom Blasta X [CLEAVE 1, EXTRA ATTACKS]|Melee|6|2+|5|-1|1`,
    `Moonchewa [CLEAVE 1, TWIN-LINKED]|Melee|5|2+|12|-2|3`,
  ),
  abilities: [
    core('Deep Strike'), core('Leader'), armyRule('Da Boss'), armyRule('Waaagh!'),
    ability('Intimidating Motivation', `(Once per battle round, per army): In your Movement phase, at the start or end of this unit's move, you can select one friendly ${kwb('ORKS')} unit within 6" of this unit. That unit is no longer battle-shocked and is riled up until the start of your next turn.`),
    ability("Nazdreg's Know-wotz", `This unit has Deep Strike. This unit's ranged attacks have ${kwb('[IGNORES COVER]')}.`),
    ability("Supreme Kunnin'", `(Once per phase, per army): In your opponent's Movement phase, when an enemy unit ends a move within 8" of this unit, if this unit is unengaged, this unit can make a normal move of up to D6", or of up to 5" if this unit is riled up.`),
  ],
  keywords: ['Infantry', 'Character', 'Epic Hero', 'Mega Armour', 'Warboss'],
  unitComposition: ['1 Nazdreg'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'kustom blasta x', count: 1 }, { name: 'moonchewa', count: 1 }],
}),

datasheet({
  name: 'Warboss', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Kustom Choppa; Kustom Shoota.`,
  models: models(`Warboss|6"|6|4+|5+|6|6+|1|40mm`),
  weapons: weapons(
    `Kombi-rokkit - Busta Rokkit|24"|1|5+|10|-2|3`,
    `Kombi-rokkit - Shoota [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 1]|18"|2|5+|4|0|1`,
    `Kombi-skorcha - Shoota [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 1]|18"|2|5+|4|0|1`,
    `Kombi-skorcha - Skorcha [BLAST 1, TORRENT]|12"|3|-|5|0|1`,
    `Kustom Shoota [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 2]|18"|4|5+|4|0|1`,
    `Kustom Choppa [CLEAVE 2]|Melee|6|2+|7|-2|2`,
    `Power Klaw|Melee|6|2+|12|-2|2`,
  ),
  options: [
    { button: '•', description: "This model's Kustom Choppa can be replaced with 1 Power Klaw." },
    { button: '•', description: "This model's Kustom Shoota can be replaced with one of the following: 1 Kombi-rokkit; 1 Kombi-skorcha." },
  ],
  abilities: [
    core('Leader'), armyRule('Da Boss'), armyRule('Waaagh!'),
    ability("Boss' Ammo Runt", `(Once per battle, per unit): In your Shooting phase, when this unit is selected to shoot, you can use this ability. If you do, this model's ranged attacks have +1 to hit rolls.`, { effects: { hitMod: 1 }, combatType: 'ranged', bearerOnly: true }),
    ability('Might Is Right', `If this unit made a charge move this turn, this model's melee attacks have +3 A and +2 S.`, { effects: { attacksMod: 3, strengthMod: 2 }, combatType: 'melee', bearerOnly: true }),
    ability('Intimidating Motivation', `(Once per battle round, per army): In your Movement phase, at the start or end of this unit's move, you can select one friendly ${kwb('ORKS')} unit within 6" of this unit. That unit is no longer battle-shocked and is riled up until the start of your next turn.`),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Warboss'],
  unitComposition: ['1 Warboss'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'kustom choppa', count: 1 }, { name: 'kustom shoota', count: 1 }],
}),

datasheet({
  name: 'Warboss in Mega Armour', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Big Shoota; 'Uge Choppa.`,
  models: models(`Warboss in Mega Armour|5"|7|2+|5+|7|6+|1|`),
  weapons: weapons(
    `Big Shoota [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 2]|36"|3|4+|5|0|1`,
    `'Uge Choppa [CLEAVE 2]|Melee|5|2+|12|-2|3`,
  ),
  abilities: [
    core('Leader'), armyRule('Da Boss'), armyRule('Waaagh!'),
    ability("Krushin' Impetus", `When this unit ends a charge move, select one enemy unit engaged with this unit and roll one D6 for each model engaged with that enemy unit: for each 3+, that enemy unit suffers 1 mortal wound.`),
    ability('Intimidating Motivation', `(Once per battle round, per army): In your Movement phase, at the start or end of this unit's move, you can select one friendly ${kwb('ORKS')} unit within 6" of this unit. That unit is no longer battle-shocked and is riled up until the start of your next turn.`),
  ],
  keywords: ['Infantry', 'Character', 'Mega Armour', 'Warboss'],
  unitComposition: ['1 Warboss in Mega Armour'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'big shoota', count: 1 }, { name: "'uge choppa", count: 1 }],
}),

datasheet({
  name: 'Big Mek', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Kustom Mega-blasta; Power Klaw.`,
  models: models(`Big Mek|6"|5|3+||6|7+|1|`),
  weapons: weapons(
    `Kustom Mega-blasta [HAZARDOUS]|24"|3|4+|9|-2|3`,
    `Traktor Blasta [ANTI-FLY 2+]|24"|3|4+|6|-2|D3+3`,
    `Drilla|Melee|3|3+|12|-3|3`,
    `Power Klaw|Melee|5|3+|10|-2|2`,
  ),
  options: [
    { button: '•', description: "This model's Power Klaw can be replaced with 1 Drilla." },
    { button: '•', description: "This model's Kustom Mega-blasta can be replaced with 1 Traktor Blasta." },
  ],
  abilities: [
    core('Leader'), armyRule('Waaagh!'),
    ability('More Dakka', `This model's ranged attacks have ${kwb('[IGNORES COVER]')}. While this unit is riled up, this model's ranged attacks also have ${kwb('[SUSTAINED HITS 1]')}.`, { effects: {}, combatType: 'ranged' }),
    ability('Shokk-boosta', `In your Movement phase, when this unit is selected to advance, this unit can change its advance roll to a 6 and can move through all types of model. When this unit ends that advance move, make a hazard roll for each model in this unit.`),
  ],
  keywords: ['Infantry', 'Character', 'Explosives'],
  unitComposition: ['1 Big Mek'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'kustom mega-blasta', count: 1 }, { name: 'power klaw', count: 1 }],
}),

datasheet({
  name: 'Big Mek in Mega Armour', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Kustom Shoota; Power Klaw.`,
  models: models(`Big Mek in Mega Armour|6"|6|2+||6|7+|1|`),
  weapons: weapons(
    `Kombi-weapon - Shoota [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 1]|18"|2|4+|4|0|1`,
    `Kombi-weapon - Kill Shot|24"|1|4+|10|-2|3`,
    `Kombi-weapon - Point Blank [BLAST 1, TORRENT]|12"|3|-|5|0|1`,
    `Kustom Mega-blasta [HAZARDOUS]|24"|3|4+|9|-2|3`,
    `Kustom Shoota - Aimed [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 2]|18"|4|4+|4|0|1`,
    `Kustom Shoota - Point Blank [CLOSE-QUARTERS, TORRENT]|6"|D3+3|-|4|0|1`,
    `Tellyport Blasta [BLAST 1]|12"|6|4+|9|-2|3`,
    `Killsaw|Melee|3|4+|10|-2|3`,
    `Power Klaw|Melee|3|3+|10|-2|2`,
  ),
  options: [
    { button: '•', description: 'This model can be equipped with one of the following: 1 Tellyport Blasta; 1 Kustom Force Field.' },
    { button: '•', description: "This model's Kustom Shoota can be replaced with one of the following: 1 Killsaw; 1 Kombi-weapon; 1 Kustom Mega-blasta." },
  ],
  abilities: [
    core('Leader'), armyRule('Waaagh!'),
    ability('Fix Dat Armour Up', `(Once per battle, per unit): In your Command phase, you can use this ability. If you do, this unit heals 3 wounds.`),
    ability('More Dakka', `This model's ranged attacks have ${kwb('[IGNORES COVER]')}. While this unit is riled up, this model's ranged attacks also have ${kwb('[SUSTAINED HITS 1]')}.`, { effects: {}, combatType: 'ranged' }),
    ability('Kustom Force Field', `(Wargear ability): This unit has a 4+ invulnerable save against ranged attacks.`, { effects: { saveMod: 1 }, combatType: 'ranged', target: 'defender' }),
  ],
  keywords: ['Infantry', 'Big Mek', 'Character', 'Explosives', 'Mega Armour'],
  unitComposition: ['1 Big Mek in Mega Armour'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'kustom shoota', count: 1 }, { name: 'power klaw', count: 1 }],
}),

datasheet({
  name: 'Big Mek with Shokk Attack Gun', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Big Mek's Toolz; Shokk Attack Gun.`,
  models: models(`Big Mek with Shokk Attack Gun|6"|5|4+||5|7+|1|`),
  weapons: weapons(
    `Shokk Attack Gun [BLAST 1, HEAVY]|60"|D3+3|5+|12|-4|D6+1`,
    `Big Mek's Toolz|Melee|4|3+|5|0|1`,
  ),
  abilities: [
    core('Leader'), armyRule('Waaagh!'),
    ability('More Dakka', `This model's ranged attacks have ${kwb('[IGNORES COVER]')}. While this unit is riled up, this model's ranged attacks also have ${kwb('[SUSTAINED HITS 1]')}.`, { effects: {}, combatType: 'ranged' }),
    ability('Support Shokka', `While this model is within 3" of a friendly ${kwb('ORKS INFANTRY')} unit (excluding ${kwb('BIG MEK WITH SHOKK ATTACK GUN')} units), this model has Lone Operative.`),
  ],
  keywords: ['Infantry', 'Big Mek', 'Character', 'Explosives'],
  unitComposition: ["1 Big Mek with Shokk Attack Gun"], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: "big mek's toolz", count: 1 }, { name: 'shokk attack gun', count: 1 }],
}),

datasheet({
  name: 'Big Mek Dakkarig', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Blitzkannon; Multi-busta Launcha; Stompy Feet.`,
  models: models(`Big Mek Dakkarig|8"|8|3+|5+|11|7+|3|`),
  weapons: weapons(
    `Blitzkannon [IGNORES COVER, LETHAL HITS: non-MONSTER/VEHICLE]|24"|8|4+|7|-2|2`,
    `Multi-busta Launcha [IGNORES COVER, LETHAL HITS]|24"|6|5+|10|-2|3`,
    `Stompy Feet|Melee|4|3+|6|-1|1`,
  ),
  abilities: [
    core('Deadly Demise 1'), armyRule('Waaagh!'),
    ability('Even More Dakka', `While this unit is riled up, this unit's ranged attacks have ${kwb('[SUSTAINED HITS 1]')}.`, { effects: { sustainedHitsBonus: 1 }, combatType: 'ranged' }),
    ability('Blitz Dem Gitz!', `In your Shooting phase, if this model's Blitzkannon targets a unit (excluding ${kwb('MONSTER')} and ${kwb('VEHICLE')} units), that weapon has +6 A.`),
  ],
  keywords: ['Vehicle', 'Big Mek', 'Character', 'Walker'],
  unitComposition: ['1 Big Mek Dakkarig'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'blitzkannon', count: 1 }, { name: 'multi-busta launcha', count: 1 }, { name: 'stompy feet', count: 1 }],
}),

datasheet({
  name: 'Mek', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Kustom Mega-slugga; Mek's Toolz.`,
  models: models(`Mek|6"|5|5+||4|7+|1|`),
  weapons: weapons(
    `Kustom Mega-slugga [CLOSE-QUARTERS, HAZARDOUS]|12"|3|4+|8|-2|3`,
    `Mek's Toolz|Melee|3|3+|5|0|1`,
  ),
  abilities: [
    core('Support'), armyRule('Waaagh!'),
    ability('Kustom Dakka', `This model's ranged attacks have ${kwb('[IGNORES COVER]')}.`, { effects: {}, combatType: 'ranged' }),
    ability("Clever Know-wotz", `In your Movement phase, at the start or end of this unit's move, you can select one friendly ${kwb('ORKS VEHICLE')} model (excluding ${kwb('AIRCRAFT')} and ${kwb('TITANIC')} models) within 3" of this unit. That model heals D3 wounds and that model's attacks have +1 to hit rolls until the start of your next Movement phase.`),
  ],
  keywords: ['Infantry', 'Character', 'Explosives'],
  unitComposition: ['1 Mek'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'kustom mega-slugga', count: 1 }, { name: "mek's toolz", count: 1 }],
}),

datasheet({
  name: 'Deffkilla Wartrike', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Boomstikks; Killa Jet; Snagga Klaw.`,
  models: models(`Deffkilla Wartrike|12"|6|4+|5+|9|6+|3|`),
  weapons: weapons(
    `Boomstikks [ASSAULT, LETHAL HITS: non-MONSTER/VEHICLE]|12"|6|5+|5|0|1`,
    `Snagga Klaw [ASSAULT, PRECISION]|12"|1|5+|7|-2|2`,
    `Killa Jet - Burna [CLEAVE 1, EXTRA ATTACKS]|Melee|3|3+|5|-1|1`,
    `Killa Jet - Cutta [EXTRA ATTACKS]|Melee|1|3+|10|-3|D6+2`,
    `Snagga Klaw [CLEAVE 2]|Melee|5|2+|7|-2|2`,
  ),
  abilities: [
    core('Deadly Demise 1'), core('Leader'), armyRule('Da Boss'), armyRule('Waaagh!'),
    ability('Get Back in da Race!', `(Once per battle round, per army): In your Movement phase, at the start or end of this unit's move, you can select one friendly ${kwb('SPEED FREEKS')} unit within 6" of this unit (and any units embarked within it). That unit is no longer battle-shocked and is riled up until the start of your next turn.`),
    ability('Fuel-mixa Grot', `This unit has +1 to advance rolls.`),
  ],
  keywords: ['Mounted', 'Character', 'Speed Freeks', 'Warboss'],
  unitComposition: ['1 Deffkilla Wartrike'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'boomstikks', count: 1 }, { name: 'killa jet', count: 1 }, { name: 'snagga klaw', count: 1 }],
}),

datasheet({
  name: 'Beastboss', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Shoota; Beast Snagga Klaw and Beastchoppa.`,
  models: models(`Beastboss|6"|6|4+|5+|6|6+|1|`),
  weapons: weapons(
    `Shoota [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 1]|18"|2|4+|4|0|1`,
    `Beast Snagga Klaw and Beastchoppa [SUSTAINED HITS 2: MONSTER/VEHICLE]|Melee|6|2+|12|-2|2`,
  ),
  abilities: [
    core('Feel No Pain 6+'), core('Leader'), armyRule('Da Boss'), armyRule('Waaagh!'),
    ability("Keep Huntin'!", `(Once per battle round, per army): In your Movement phase, at the start or end of this unit's move, you can select one friendly ${kwb('BEAST SNAGGA')} unit within 6" of this unit. That unit is no longer battle-shocked and is riled up until the start of your next turn.`),
    ability('Dodge Dis!', `This model's attacks have +1 to hit rolls.`),
  ],
  keywords: ['Infantry', 'Beast Snagga', 'Character', 'Warboss'],
  unitComposition: ['1 Beastboss'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'shoota', count: 1 }, { name: 'beast snagga klaw and beastchoppa', count: 1 }],
}),

datasheet({
  name: 'Zodgrod Wortsnagga', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Da Grabzappa; Squigstoppa.`,
  models: models(`Zodgrod Wortsnagga|6"|5|5+|6+|5|7+|1|`),
  weapons: weapons(
    `Squigstoppa [ANTI-MONSTER/VEHICLE 4+, CLOSE-QUARTERS, DEVASTATING WOUNDS: MONSTER/VEHICLE]|12"|1|5+|4|-1|1`,
    `Da Grabzappa|Melee|5|2+|7|-2|2`,
  ),
  abilities: [
    core('Leader'), armyRule('Waaagh!'),
    ability('Super Runts', `This unit is riled up. Friendly ${kwb('GRETCHIN')} units' Scavenged Shivs weapons have +1 A, +1 to WS rolls and +1 S while this model is leading them.`),
  ],
  keywords: ['Infantry', 'Character', 'Epic Hero', 'Runtherd'],
  unitComposition: ['1 Zodgrod Wortsnagga'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'da grabzappa', count: 1 }, { name: 'squigstoppa', count: 1 }],
}),

datasheet({
  name: 'Wazdakka Gutsmek', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Speeding Bulk and Flaming Exhaust; Fixit's Wrench; Grabba Dragga; Psyko-gatler.`,
  models: models(`Wazdakka Gutsmek|14"|8|3+|4+|10|6+|3|`),
  weapons: weapons(
    `Grabba Dragga [ASSAULT, PRECISION]|12"|1|2+|10|-2|3`,
    `Psyko-gatler [ASSAULT, LETHAL HITS: non-MONSTER/VEHICLE, SUSTAINED HITS 1]|24"|12|4+|6|-2|2`,
    `Speeding Bulk and Flaming Exhaust [CLEAVE 1, EXTRA ATTACKS]|Melee|3|2+|5|-1|1`,
    `Fixit's Wrench [EXTRA ATTACKS]|Melee|1|4+|3|0|1`,
    `Grabba Dragga [CLEAVE 2, LANCE]|Melee|6|2+|10|-2|3`,
  ),
  abilities: [
    core('Deadly Demise D3'), core('Deep Strike'), core('Lone Operative'), armyRule('Waaagh!'),
    ability('Full Throttle', `(Once per battle round, in your Command phase): select one of this unit's Throttlerokkit Shokka Engine abilities below. This unit has that ability until the start of your next Command phase.<br><br><b>Turbo Engine:</b> When this unit is selected to make an advance or fall-back move, that move does not prevent this unit from being eligible to declare a charge.<br><br><b>Shokk Attack Engine:</b> In your Command phase, if this unit is unengaged, you can place this unit into strategic reserves.<br><br><b>Pulse Jet:</b> In your Movement phase, when this unit is selected to move, if this unit is unengaged, this unit can make a pulse jet move.`),
  ],
  keywords: ['Mounted', 'Vehicle', 'Character', 'Epic Hero', 'Smoke', 'Speed Freeks'],
  unitComposition: ['1 Wazdakka Gutsmek'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'speeding bulk and flaming exhaust', count: 1 }, { name: "fixit's wrench", count: 1 }, { name: 'grabba dragga', count: 1 }, { name: 'psyko-gatler', count: 1 }],
}),

datasheet({
  name: 'Mozrog Skragbad', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Big Chompa's Jaws; Gutrippa; Thump Gun.`,
  models: models(`Mozrog Skragbad|10"|9|3+|4+|10|6+|3|`),
  weapons: weapons(
    `Thump Gun [ANTI-MONSTER/VEHICLE 4+]|18"|3|5+|6|0|2`,
    `Big Chompa's Jaws [ANTI-MONSTER/VEHICLE 3+, EXTRA ATTACKS]|Melee|3|3+|7|-2|4`,
    `Gutrippa - Standard [CLEAVE 1]|Melee|6|2+|9|-2|2`,
    `Gutrippa - Hunter [LETHAL HITS]|Melee|6|2+|12|-2|D6+1`,
  ),
  abilities: [
    core('Feel No Pain 5+'), armyRule('Waaagh!'),
    ability('One Last Kill', `In the Fight phase, when this unit is destroyed, if it has not been selected to fight this phase, roll one D6: on a 2+, do not remove this unit from the battlefield. When this unit has fought, or at the end of the phase (whichever comes first), this unit is removed from the battlefield.`),
    ability('Da Bigger Dey Iz...', `This model's melee attacks that target a ${kwb('MONSTER')} or ${kwb('VEHICLE')} unit can re-roll wound rolls.`, { effects: { rerollAllWounds: true }, combatType: 'melee', requiresTargetKeyword: 'MONSTER' }),
    ability('Beast Snagga Following', `While this model is within 3" of a friendly ${kwb('BEAST SNAGGA')} unit (excluding ${kwb('MONSTER CHARACTER')} units), this model has Lone Operative.`),
  ],
  keywords: ['Monster', 'Beast Snagga', 'Character', 'Epic Hero'],
  unitComposition: ['1 Mozrog Skragbad'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: "big chompa's jaws", count: 1 }, { name: 'gutrippa', count: 1 }, { name: 'thump gun', count: 1 }],
}),

datasheet({
  name: 'Beastboss on Squigosaur', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Beastchoppa; Slugga; Squigosaur's Jaws.`,
  models: models(`Beastboss on Squigosaur|10"|9|3+|5+|10|6+|3|`),
  weapons: weapons(
    `Slugga [CLOSE-QUARTERS, LETHAL HITS: non-MONSTER/VEHICLE]|12"|1|5+|4|0|1`,
    `Thump Gun [ANTI-MONSTER/VEHICLE 4+]|18"|3|5+|6|0|2`,
    `Beastchoppa - Standard [CLEAVE 1]|Melee|6|2+|6|-2|2`,
    `Beastchoppa - Hunter|Melee|6|2+|12|-2|6`,
    `Squigosaur's Jaws [ANTI-MONSTER/VEHICLE 3+, EXTRA ATTACKS]|Melee|3|3+|7|-2|3`,
  ),
  options: [{ button: '•', description: 'This model can be equipped with 1 Thump Gun.' }],
  abilities: [
    core('Feel No Pain 5+'), armyRule('Da Boss'), armyRule('Waaagh!'),
    ability('Thundering Stampede', `(Aura): While a friendly ${kwb('BEAST SNAGGA')} unit is within 6" of this unit, that unit has +1 to charge rolls.`, { appliesToNearby: true }),
    ability("Keep Huntin'!", `(Once per battle round, per army): In your Movement phase, at the start or end of this unit's move, you can select one friendly ${kwb('BEAST SNAGGA')} unit within 6" of this unit. That unit is no longer battle-shocked and is riled up until the start of your next turn.`),
    ability('Boss of da Hunt', `While this model is within 3" of a friendly ${kwb('BEAST SNAGGA')} unit (excluding ${kwb('MONSTER CHARACTER')} units), this model has Lone Operative.`),
  ],
  keywords: ['Monster', 'Beast Snagga', 'Character', 'Warboss'],
  unitComposition: ['1 Beastboss on Squigosaur'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'beastchoppa', count: 1 }, { name: 'slugga', count: 1 }, { name: "squigosaur's jaws", count: 1 }],
}),

datasheet({
  name: 'Weirdboy', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Power Vomit; Copper Staff.`,
  models: models(`Weirdboy|6"|5|5+||4|7+|1|`),
  weapons: weapons(
    `Power Vomit [BLAST 1, HAZARDOUS, PSYCHIC, TORRENT]|12"|3|-|5|-3|2`,
    `Copper Staff [PSYCHIC]|Melee|3|3+|8|-1|2`,
  ),
  abilities: [
    core('Deadly Demise D3'), core('Support'), armyRule('Unstable Energies'), armyRule('Waaagh!'),
    ability('Waaagh! Energy', `(Psyker level 1): This model has the following psychic abilities.<br><br><b>Da Jump</b> (psychic level 1, once per army, per battle round): In your Movement phase, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do, on a 1 this unit is battle-shocked; otherwise, select one other friendly ${kwb('ORKS')} unit and place it into strategic reserves, and it can then be set up on the battlefield using Deep Strike.<br><br><b>Warpath</b> (psychic level 1): In the Fight phase, when this unit is selected to fight, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do, on a 1 this unit is battle-shocked; otherwise this unit's melee attacks can re-roll wound rolls of 1 and have ${kwb('[PSYCHIC]')}.`),
  ],
  keywords: ['Infantry', 'Character', 'Psyker'],
  unitComposition: ['1 Weirdboy'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'power vomit', count: 1 }, { name: 'copper staff', count: 1 }],
}),

datasheet({
  name: 'Boss Snikrot', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Mork's Teef; Slugga.`,
  models: models(`Boss Snikrot|6"|5|5+|5+|6|6+|1|`),
  weapons: weapons(
    `Slugga [CLOSE-QUARTERS, LETHAL HITS: non-MONSTER/VEHICLE, PRECISION]|12"|1|5+|4|0|1`,
    `Mork's Teef [ANTI-INFANTRY 2+, PRECISION]|Melee|6|2+|6|-2|2`,
  ),
  abilities: [
    core('Infiltrators'), core('Leader'), core('Lone Operative'), core('Stealth'), armyRule('Waaagh!'),
    ability("Kunnin' Infiltrator", `At the end of your opponent's Fight phase, if every model in this unit is hidden and this unit is unengaged, you can place this unit into strategic reserves.`),
    ability('Deff from the Shadows', `(From the first battle round onwards): At the end of your opponent's Movement phase, if this unit is in strategic reserves, this unit can made an ingress move.`),
  ],
  keywords: ['Infantry', 'Character', 'Epic Hero', 'Explosives', 'Smoke'],
  unitComposition: ['1 Boss Snikrot'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: "mork's teef", count: 1 }, { name: 'slugga', count: 1 }],
}),

datasheet({
  name: 'Bannernob', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Kustom Choppa; Shoota.`,
  models: models(`Bannernob|6"|5|4+||4|7+|3|`),
  weapons: weapons(
    `Shoota [LETHAL HITS: non-MONSTER/VEHICLE, RAPID FIRE 1]|18"|2|5+|4|0|1`,
    `Kustom Choppa|Melee|4|3+|5|-2|2`,
  ),
  abilities: [
    core('Support'), armyRule('Waaagh!'),
    ability("Waaagh! Banner", `This unit has +1 to charge rolls.`),
  ],
  keywords: ['Infantry', 'Character'],
  unitComposition: ['1 Bannernob'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'kustom choppa', count: 1 }, { name: 'shoota', count: 1 }],
}),

datasheet({
  name: 'Bigboss', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Big Choppa; Slugga.`,
  models: models(`Bigboss|6"|5|4+||5|7+|1|`),
  weapons: weapons(
    `Slugga [CLOSE-QUARTERS, LETHAL HITS: non-MONSTER/VEHICLE]|12"|1|5+|4|0|1`,
    `Big Choppa [PRECISION]|Melee|5|3+|7|-2|2`,
  ),
  abilities: [
    core('Support'), armyRule('Waaagh!'),
    ability("Sumfin' to Prove", `This model's melee attacks have +1 to hit rolls.`, { effects: { hitMod: 1 }, combatType: 'melee', bearerOnly: true }),
  ],
  keywords: ['Infantry', 'Character'],
  unitComposition: ['1 Bigboss'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'big choppa', count: 1 }, { name: 'slugga', count: 1 }],
}),

datasheet({
  name: 'Painboy', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Dok's Toolz; 'Urty Syringe.`,
  models: models(`Painboy|6"|5|5+||3|7+|1|`),
  weapons: weapons(
    `'Urty Syringe [ANTI-INFANTRY 4+, DEVASTATING WOUNDS: INFANTRY, EXTRA ATTACKS]|Melee|1|3+|2|0|6`,
    `Dok's Toolz|Melee|3|3+|10|-2|2`,
  ),
  abilities: [
    core('Support'), armyRule('Waaagh!'),
    ability('Crude Surgery', `In your Command phase, this unit heals 3 wounds.`),
    ability('Catch Dat Red Bit', `(Once per battle, per unit): when this model uses its Crude Surgery ability, you can add D3 to the number of wounds healed.`),
  ],
  keywords: ['Infantry', 'Character'],
  unitComposition: ['1 Painboy'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: "dok's toolz", count: 1 }, { name: "'urty syringe", count: 1 }],
}),

datasheet({
  name: 'Painboss', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Beast Snagga Klaw.`,
  models: models(`Painboss|6"|5|4+|6+|4|7+|1|`),
  weapons: weapons(
    `Beast Snagga Klaw [ANTI-MONSTER/VEHICLE 4+]|Melee|3|3+|10|-2|2`,
  ),
  abilities: [
    core('Support'), armyRule('Waaagh!'),
    ability('Push Dat Bit Back In', `(Once per battle, per unit): In your Command phase, select one friendly ${kwb('BEAST SNAGGA')} unit within 6" of this unit. That unit heals 3 wounds.`),
    ability('Hardy Bioniks', `Attacks that target this unit with a Strength characteristic greater than this unit's Toughness characteristic have -1 to wound rolls.`, { effects: { woundMod: -1 }, target: 'defender', requiresAttackerKeyword: '' }),
    ability("Runnin' wiv da Herd", `While this model is attached to a ${kwb('MOUNTED')} unit, this model does not have the ${kwb('INFANTRY')} keyword, has the ${kwb('MOBILE')} and ${kwb('MOUNTED')} keywords, and has +4" M.`),
  ],
  keywords: ['Infantry', 'Beast Snagga', 'Character'],
  unitComposition: ['1 Painboss'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'beast snagga klaw', count: 1 }],
}),

datasheet({
  name: 'Gretchin', role: 'Battleline',
  loadout: `<b>Every model is equipped with:</b> Scavenged Shivs; Grot Blasta.`,
  models: models(`Gretchin|6"|2|6+||1|8+|1|`),
  weapons: weapons(
    `Grot Blasta [CLOSE-QUARTERS]|12"|1|4+|3|0|1`,
    `Scavenged Shivs|Melee|1|5+|2|0|1`,
  ),
  abilities: [
    armyRule('Waaagh!'),
    ability('Downtrodden', `Each Grot Oiler-like transport capacity calculation for this unit treats every 2 ${kwb('GRETCHIN')} models (rounding up) as 1 model.`),
    ability('Thievin' + " Scavengers", `At the end of your Movement phase, if this unit is controlling an objective marker, that objective marker is secured.`),
  ],
  keywords: ['Infantry', 'Grots'],
  unitComposition: ['10-20 Gretchin'], modelCountMin: 10, modelCountMax: 20,
  defaultWeaponNames: [{ name: 'scavenged shivs', count: 20 }, { name: 'grot blasta', count: 20 }],
}),

datasheet({
  name: 'Runtherd', role: 'Characters',
  loadout: `<b>This model is equipped with:</b> Runtherd's Toolz; Slugga.`,
  models: models(`Runtherd|6"|5|5+||3|7+|1|`),
  weapons: weapons(
    `Slugga [CLOSE-QUARTERS, LETHAL HITS: non-MONSTER/VEHICLE]|12"|1|5+|4|0|1`,
    `Runtherd's Toolz|Melee|3|3+|5|0|1`,
  ),
  abilities: [
    core('Support'), armyRule('Waaagh!'),
    ability("That'll Learn Ya", `(Once per battle round, per unit): When this unit becomes battle-shocked, if it has 4+ ${kwb('GRETCHIN')} models, you can select one of the following: any number of Gretchin models in this unit are destroyed; or this unit is no longer battle-shocked.`),
  ],
  keywords: ['Infantry', 'Character'],
  unitComposition: ['1 Runtherd'], modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: "runtherd's toolz", count: 1 }, { name: 'slugga', count: 1 }],
}),

]
