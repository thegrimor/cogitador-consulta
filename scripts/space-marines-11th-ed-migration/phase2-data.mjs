// Phase 2 content for the Space Marines 11th-ed core-codex migration: datasheets, transcribed
// from "Space Marine Codex - 11th Edition.pdf" pages 19-72 (printed 176-229), visually read
// page by page (not OCR alone -- weapon/model stat tables are unreliable under OCR on dense
// layouts, see ../pdf-codex-tools/README.md). Two datasheets share most pages (top half /
// bottom half), except squad datasheets with more wargear options, which take a full page.
//
// No points source for this printing (see README.md / phase1-data.mjs) -- every datasheet gets
// the datasheet() helper's 0-point placeholder, not a name-matched backfill.
import { weapons, models, core, armyRule, ability, datasheet } from './helpers.mjs'

export const newDatasheets = []

// ---------------------------------------------------------------------------
// Roboute Guilliman (pg 19 top / printed 176 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Roboute Guilliman',
  role: 'Characters',
  models: models('ROBOUTE GUILLIMAN|8"|10|2+|4|16|5+|4|'),
  weapons: weapons(
    "Hand of Dominion [RAPID FIRE 2, SUSTAINED HITS 1]|36|4|2+|6|-2|2",
    "Emperor's Sword [CLEAVE 2, DEVASTATING WOUNDS]|Melee|10|2+|10|-3|2",
    'Hand of Dominion [LETHAL HITS]|Melee|7|2+|14|-4|4',
  ),
  abilities: [
    core('Feel No Pain 5+'),
    armyRule('Combat Doctrines'),
    armyRule('Transhuman Strategist'),
    ability('Supreme Commander', 'If this model is in your army, it must be your <span class="kwb">WARLORD</span>.'),
  ],
  keywords: ['Monster', 'Character', 'Epic Hero', 'Imperium', 'Mobile', 'Primarch'],
  factionKeywords: ['Adeptus Astartes', 'Ultramarines'],
  unitComposition: ['1 Roboute Guilliman model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'hand of dominion', count: 1 }, { name: "emperor's sword", count: 1 }],
  loadout: "<b>This model is equipped with:</b> 1 Emperor's Sword; 1 Hand of Dominion.",
}))

// ---------------------------------------------------------------------------
// Marneus Calgar (pg 19 bottom / printed 176 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Marneus Calgar',
  role: 'Characters',
  models: models('MARNEUS CALGAR|6"|6|2+|4|6|6+|1|'),
  weapons: weapons(
    'Gauntlets of Ultramar [CLOSE-QUARTERS, TWIN-LINKED]|18|4|2+|5|-2|2',
    'Gauntlets of Ultramar [TWIN-LINKED]|Melee|6|2+|10|-3|3',
    'Gauntlets of Ultramar - Overhead Smash [EXTRA ATTACKS, TWIN-LINKED]|Melee|1|2+|14|-3|D3+3',
  ),
  abilities: [
    core('Deep Strike'), core('Leader'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Codex Adept', 'The assault doctrine, devastator doctrine and tactical doctrine are active for this unit.'),
    ability('Master Tactician', 'In your Movement phase, you can select one visible friendly <span class="kwb">ADEPTUS ASTARTES</span> unit within 9" of this model, and select one combat doctrine. That combat doctrine is active for that unit until the start of your next Command phase.'),
    ability('Thunderhawk Insertion', 'In the Declare Battle Formations step, you can select one friendly <b>GRAVIS</b>/<b>PHOBOS</b>/<b>TACTICUS</b> unit. That unit has Deep Strike.'),
  ],
  keywords: ['Infantry', 'Chapter Master', 'Character', 'Epic Hero', 'Imperium', 'Terminator'],
  factionKeywords: ['Adeptus Astartes', 'Ultramarines'],
  unitComposition: ['1 Marneus Calgar model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'gauntlets of ultramar', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Gauntlets of Ultramar.',
}))

// ---------------------------------------------------------------------------
// Chief Librarian Tigurius (pg 20 top / printed 177 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Chief Librarian Tigurius',
  role: 'Characters',
  models: models('CHIEF LIBRARIAN TIGURIUS|6"|5|3+|4|5|6+|1|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|2+|5|-1|1',
    "Storm of the Emperor's Wrath [BLAST 1, PSYCHIC]|18|D3+6|2+|6|-2|2",
    'Rod of Tigurius [PSYCHIC]|Melee|5|2+|7|-2|2',
  ),
  abilities: [
    core('Leader'),
    armyRule('Combat Doctrines'), armyRule('Librarius'), armyRule('Transhuman Strategist'),
    ability('Chief Librarian (psyker level 3)', 'This model has the psychic abilities listed in the Psychic Abilities section.'),
    ability('Hood of Hellfire (Psychic)', 'This unit has Feel No Pain 4+ against psychic attacks and mortal wounds.'),
    ability('Prescience (psychic level 2)', "In your Movement phase, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do:<ul><li>On a 1, this unit is battle-shocked.</li><li>This unit has +1 Sv until the start of your next turn.</li></ul>"),
    ability('Telepathic Assault (psychic level 1)', 'In your Shooting phase, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do:<ul><li>On a 1, this unit is battle-shocked.</li><li>Select one visible enemy unit within 24" of this unit. That enemy unit suffers 2D3 mortal wounds.</li></ul>'),
  ],
  keywords: ['Infantry', 'Character', 'Epic Hero', 'Explosives', 'Psyker', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes', 'Ultramarines'],
  unitComposition: ['1 Chief Librarian Tigurius model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 1 }, { name: 'rod of tigurius', count: 1 }, { name: "storm of the emperor's wrath", count: 1 }],
  loadout: "<b>This model is equipped with:</b> 1 Bolt Pistol; 1 Rod of Tigurius; 1 Storm of the Emperor's Wrath.",
}))

// ---------------------------------------------------------------------------
// Cato Sicarius (pg 20 bottom / printed 177 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Cato Sicarius',
  role: 'Characters',
  models: models('CATO SICARIUS|6"|5|2+|4|5|6+|1|'),
  weapons: weapons(
    'Artisan Plasma Pistol [CLOSE-QUARTERS]|12|1|2+|8|-3|2',
    'Talassarian Tempest Blade - Strike [DEVASTATING WOUNDS]|Melee|5|2+|6|-3|3',
    'Talassarian Tempest Blade - Coup de Grace [PRECISION]|Melee|7|2+|6|-2|2',
    'Talassarian Tempest Blade - Sweep [SUSTAINED HITS 1: INFANTRY]|Melee|9|2+|5|-2|1',
  ),
  abilities: [
    core('Leader'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Captain of the Honour Guard', 'If your army includes a <b>MARNEUS CALGAR</b> unit, replace this unit\'s Leader ability with the Support ability (this unit can still be attached to the same units).'),
    ability('Knight Champion of Macragge (Once per phase, per army)', 'In your opponent\'s Movement phase, when an enemy unit ends a move within 8" of this unit, if this unit is unengaged, this unit can make a normal move of up to 6".'),
    ability('Honour or Death', 'When you target this unit with the Heroic Intervention stratagem, that use is -1 CP.'),
  ],
  keywords: ['Infantry', 'Character', 'Epic Hero', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes', 'Ultramarines'],
  unitComposition: ['1 Cato Sicarius model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'artisan plasma pistol', count: 1 }, { name: 'talassarian tempest blade', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Artisan Plasma Pistol; 1 Talassarian Tempest Blade.',
}))

// ---------------------------------------------------------------------------
// Captain Titus (pg 21 / printed 178)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Captain Titus',
  role: 'Characters',
  models: models('CAPTAIN TITUS|6"|5|3+|4|6|6+|1|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|2+|5|-1|1',
    'Master-crafted Bolter [ASSAULT, HEAVY, RAPID FIRE 1]|24|2|2+|5|-1|2',
    'Master-crafted Chainsword [ANTI-non-MONSTER/VEHICLE 2+]|Melee|8|2+|5|-1|2',
  ),
  abilities: [
    core('Feel No Pain 5+'), core('Leader'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Press the Attack', 'This unit\'s melee attacks have:<ul><li>[SUSTAINED HITS 1: non-MONSTER/VEHICLE].</li><li><u>Or:</u> If the assault doctrine is active for this unit, [SUSTAINED HITS 1].</li></ul>'),
    ability('Righteous Fury (Once per battle, per army)', "In the Fight phase, you can use this ability. If you do, this unit's melee attacks have +1 S, and when this unit has fought:<ul><li>This unit heals D3 wounds.</li><li><u>Or:</u> If this unit destroyed an enemy model this phase, this unit heals 2D3 wounds.</li></ul>"),
    ability('Honour of Ultramar', 'In the Fight phase, when this model is destroyed, if this unit has not been selected to fight this phase, roll one D6:<ul><li>On a 2+, do not remove this model from the battlefield. When your unit has fought, or at the end of the phase (whichever comes first), this model is removed from the battlefield.</li></ul>'),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Epic Hero', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes', 'Ultramarines'],
  unitComposition: ['1 Captain Titus model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 1 }, { name: 'master-crafted bolter', count: 1 }, { name: 'master-crafted chainsword', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Bolt Pistol; 1 Master-crafted Bolter; 1 Master-crafted Chainsword.',
}))

// ---------------------------------------------------------------------------
// Wardens of Ultramar (pg 22 / printed 179) -- 6 named individuals, 3 distinct statlines
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Wardens of Ultramar',
  role: 'Characters',
  models: models(
    'GAIUS SILVA / AEMELIA MINERVAS / DAINAL KORNELIUS / LUCIA VESTHA|6"|3|4+|5|3|6+|1|',
    'VETERAN SERGEANT METAURUS|6"|5|3+|4|4|6+|1|',
    'ANCIENT GADRIEL|6"|5|3+|4|4|6+|2|',
  ),
  weapons: weapons(
    'Archeotech Laspistol [CLOSE-QUARTERS]|12|1|3+|4|-1|1',
    'Astropathic Blast [BLAST 1, PSYCHIC]|12|3|3+|4|-1|1',
    'Bolt Rifle - Focused Fire [HEAVY, RAPID FIRE 1]|24|1|3+|6|-1|2',
    'Bolt Rifle - Saturation [ASSAULT, RAPID FIRE 1]|24|2|3+|5|-1|1',
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-1|1',
    'Ceramite Fists|Melee|4|3+|5|0|1',
    'Force Stave [PSYCHIC]|Melee|1|2+|5|-2|2',
    'Master-crafted Power Weapon [PRECISION]|Melee|5|2+|5|-2|2',
    'Power Weapon|Melee|4|2+|4|-2|1',
    'Ultramarian Combat Weapons|Melee|4|3+|4|0|1',
  ),
  abilities: [
    core('Support'),
    armyRule('Combat Doctrines'),
    ability('Raise the Banner', 'At the end of your Movement phase, if this unit is controlling an objective, that objective is secured.'),
    ability('Strategium Command', 'When both players have deployed their armies, you can redeploy up to three friendly <span class="kwb">ADEPTUS ASTARTES</span> units. When doing so, you can set those units up in strategic reserves, regardless of how many units are already in strategic reserves.'),
  ],
  keywords: ['Infantry', 'Epic Hero', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes', 'Ultramarines'],
  unitComposition: [
    '1 Aemelia Minervas model', '1 Ancient Gadriel model', '1 Dainal Kornelius model',
    '1 Gaius Silva model', '1 Lucia Vestha model', '1 Veteran Sergeant Metaurus model',
  ],
  modelCountMin: 6, modelCountMax: 6,
  defaultWeaponNames: [
    { name: 'archeotech laspistol', count: 3 }, { name: 'astropathic blast', count: 1 },
    { name: 'bolt rifle', count: 1 }, { name: 'heavy bolt pistol', count: 1 },
    { name: 'ceramite fists', count: 1 }, { name: 'force stave', count: 1 },
    { name: 'master-crafted power weapon', count: 1 }, { name: 'power weapon', count: 2 },
    { name: 'ultramarian combat weapons', count: 1 },
  ],
  loadout: 'Aemelia Minervas is equipped with: 1 Archeotech Laspistol; 1 Power Weapon.<br>' +
    'Ancient Gadriel is equipped with: 1 Bolt Rifle; 1 Ceramite Fists.<br>' +
    'Dainal Kornelius is equipped with: 1 Astropathic Blast; 1 Force Stave.<br>' +
    'Gaius Silva is equipped with: 1 Archeotech Laspistol; 1 Power Weapon.<br>' +
    'Lucia Vestha is equipped with: 1 Archeotech Laspistol; 1 Ultramarian Combat Weapons.<br>' +
    'Veteran Sergeant Metaurus is equipped with: 1 Heavy Bolt Pistol; 1 Master-crafted Power Weapon.',
}))

// ---------------------------------------------------------------------------
// Victrix Honour Guard (pg 23 top / printed 180 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Victrix Honour Guard',
  role: 'Battleline',
  models: models('VICTRIX HONOUR GUARD|6"|5|2+||3|6+|2|'),
  weapons: weapons(
    'Master-crafted Bolt Carbine [ASSAULT, RAPID FIRE 1]|24|2|2+|5|-1|2',
    'Blades of Honour [PRECISION, TWIN-LINKED]|Melee|6|2+|6|-2|2',
    'Master-crafted Power Weapon|Melee|5|2+|5|-2|2',
  ),
  abilities: [
    armyRule('Combat Doctrines'),
    ability('Glory of Ultramar', "In your opponent's Shooting phase, when an enemy unit has shot, if a model in this unit was destroyed by those attacks, this unit can make a surge move of up to D6\"."),
    ability('Honour Guard of Macragge', 'Attacks that target this unit have -1 to wound rolls.'),
    ability('Banner of Macragge', "<ul><li>At the end of your Movement phase, if this unit is controlling an objective, that objective is secured.</li><li>(Once per battle, per army) When this unit is selected to fight, you can use this ability. If you do, this unit's melee attacks have +1 A and S.</li></ul>"),
  ],
  keywords: ['Infantry', 'Imperium', 'Tacticus', 'Ancient', 'Champion', 'Epic Hero'],
  factionKeywords: ['Adeptus Astartes', 'Ultramarines'],
  unitComposition: ['0-1 Chapter Ancient model', '0-1 Chapter Champion model', '1-6 Victrix Honour Guard models'],
  modelCountMin: 1, modelCountMax: 8,
  defaultWeaponNames: [{ name: 'master-crafted bolt carbine', count: 1 }, { name: 'master-crafted power weapon', count: 1 }],
  loadout: 'The Chapter Ancient is equipped with: Banner of Macragge; 1 Master-crafted Bolt Carbine; 1 Master-crafted Power Weapon.<br>' +
    'The Chapter Champion is equipped with: 1 Blades of Honour.<br>' +
    'Every Victrix Honour Guard is equipped with: 1 Master-crafted Bolt Carbine; 1 Master-crafted Power Weapon.',
}))

// ---------------------------------------------------------------------------
// Kaius Konorius (pg 23 bottom / printed 180 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Kaius Konorius',
  role: 'Characters',
  models: models('KAIUS KONORIUS|6"|5|2+|4|5|6+|1|'),
  weapons: weapons(
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|2+|5|-1|1',
    'Severance and Rebuke - Strike [PRECISION]|Melee|5|2+|10|-3|3',
    'Severance and Rebuke - Sweep [CLEAVE 2]|Melee|6|2+|6|-3|2',
  ),
  abilities: [
    core('Support'), armyRule('Combat Doctrines'),
    ability('Veteran Bodyguard', 'While this model is attached to a unit, other <span class="kwb">CHARACTER</span> models in this unit have Feel No Pain 4+.'),
    ability("Calgar's Champion", 'This model\'s attacks that target a <span class="kwb">CHARACTER</span> unit can:<ul><li>Re-roll hit rolls of 1.</li><li>Re-roll wound rolls of 1.</li></ul>'),
  ],
  keywords: ['Infantry', 'Character', 'Epic Hero', 'Explosives', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes', 'Ultramarines'],
  unitComposition: ['1 Kaius Konorius model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'heavy bolt pistol', count: 1 }, { name: 'severance and rebuke', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Heavy Bolt Pistol; 1 Severance and Rebuke.',
}))

// ---------------------------------------------------------------------------
// Darnath Lysander (pg 24 top / printed 181 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Darnath Lysander',
  role: 'Characters',
  models: models('DARNATH LYSANDER|5"|6|2+|4|7|6+|1|'),
  weapons: weapons(
    'Fist of Dorn [CLEAVE 1, DEVASTATING WOUNDS]|Melee|5|2+|10|-3|3',
  ),
  abilities: [
    core('Deep Strike'), core('Leader'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Rampart (Once per battle, per army)', 'At the start of any phase, you can use this ability. If you do, this model has 2+ InSv until the end of the phase.'),
    ability('Icon of Obstinacy', 'Attacks that target this unit have -1 to hit rolls.'),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Epic Hero', 'Imperium', 'Terminator'],
  factionKeywords: ['Adeptus Astartes', 'Imperial Fists'],
  unitComposition: ['1 Darnath Lysander model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'fist of dorn', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Fist of Dorn.',
}))

// ---------------------------------------------------------------------------
// Tor Garadon (pg 24 bottom / printed 181 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Tor Garadon',
  role: 'Characters',
  models: models('TOR GARADON|5"|6|3+|4|6|6+|1|'),
  weapons: weapons(
    'Artificer Grav-gun [ANTI-VEHICLE 2+]|18|3|2+|5|-1|2',
    'Hand of Defiance|Melee|5|2+|12|-2|2',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Siege Captain', "This model's attacks that target a <span class=\"kwb\">FORTIFICATION</span>/<span class=\"kwb\">MONSTER</span>/<span class=\"kwb\">VEHICLE</span> unit have +2 S, AP and D."),
    ability('Signum Array', 'In your Shooting phase, you can select one visible enemy unit within 18" of this unit. That enemy unit cannot have the benefit of cover.'),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Epic Hero', 'Gravis', 'Imperium'],
  factionKeywords: ['Adeptus Astartes', 'Imperial Fists'],
  unitComposition: ['1 Tor Garadon model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'artificer grav-gun', count: 1 }, { name: 'hand of defiance', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Artificer Grav-gun; 1 Hand of Defiance.',
}))

// ---------------------------------------------------------------------------
// Aethon Shaan (pg 25 top / printed 182 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Aethon Shaan',
  role: 'Characters',
  models: models('AETHON SHAAN|14"|5|3+|4|5|6+|1|'),
  weapons: weapons(
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|2+|5|-1|1',
    'Claws of Severax [SUSTAINED HITS 2: non-MONSTER/VEHICLE, TWIN-LINKED]|Melee|7|2+|5|-2|2',
  ),
  abilities: [
    core('Deep Strike'), core('Lone Operative'), core('Stealth'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Master of Shadows', 'In your Command phase, you can select one friendly <span class="kwb">ADEPTUS ASTARTES INFANTRY</span> unit. You can re-roll charge rolls for that unit until the start of your next Command phase.'),
    ability('Blackwing Mantle (Once per phase, per army)', 'You can target this unit with the Heroic Intervention stratagem, regardless of any other uses of that stratagem this phase. If you do:<ul><li>That use is -1 CP.</li><li>That use does not prevent any uses of that stratagem on other units this phase.</li></ul>'),
  ],
  keywords: ['Infantry', 'Chapter Master', 'Character', 'Epic Hero', 'Explosives', 'Fly', 'Imperium', 'Jump Pack', 'Smoke', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes', 'Raven Guard'],
  unitComposition: ['1 Aethon Shaan model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'claws of severax', count: 1 }, { name: 'heavy bolt pistol', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Claws of Severax; 1 Heavy Bolt Pistol.',
}))

// ---------------------------------------------------------------------------
// Kayvaan Shrike (pg 25 bottom / printed 182 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Kayvaan Shrike',
  role: 'Characters',
  models: models('KAYVAAN SHRIKE|12"|4|3+|4|5|6+|1|'),
  weapons: weapons(
    'Blackout [CLOSE-QUARTERS, PRECISION]|18|1|2+|5|-1|2',
    "Raven's Talons [PRECISION, TWIN-LINKED]|Melee|7|2+|5|-2|2",
  ),
  abilities: [
    core('Deep Strike'), core('Leader'), core('Lone Operative'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Trifold Path of Shadow', 'This unit has:<ul><li>Stealth.</li><li>-3" detection range.</li></ul>'),
    ability('Echo of the Ravenspire', "At the end of your opponent's Fight phase, if this unit is unengaged, you can place this unit in strategic reserves."),
  ],
  keywords: ['Infantry', 'Captain', 'Explosives', 'Fly', 'Imperium', 'Jump Pack', 'Phobos', 'Smoke'],
  factionKeywords: ['Adeptus Astartes', 'Raven Guard'],
  unitComposition: ['1 Kayvaan Shrike model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'blackout', count: 1 }, { name: "raven's talons", count: 1 }],
  loadout: "<b>This model is equipped with:</b> 1 Blackout; 1 Raven's Talons.",
}))

// ---------------------------------------------------------------------------
// Vulkan He'stan (pg 26 top / printed 183 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: "Vulkan He'stan",
  role: 'Characters',
  models: models('VULKAN HE\'STAN|6"|5|2+|4|5|6+|1|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|2+|5|-1|1',
    'Gauntlet of the Forge [CLOSE-QUARTERS, TORRENT]|12|D6+3|-|6|-1|1',
    'Spear of Vulkan [DEVASTATING WOUNDS]|Melee|6|2+|7|-2|2',
  ),
  abilities: [
    core('Feel No Pain 6+'), core('Leader'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Seeker of the Unfound', 'The first time this model is set up on the battlefield, select one objective on the battlefield. While this model is within range of that objective, this model has:<ul><li>10 OC.</li><li>5+ Ld.</li><li>Feel No Pain 4+.</li></ul>'),
    ability('Forgefather', "In your Shooting phase, select one visible enemy unit within 24\" of this model. Friendly <span class=\"kwb\">ADEPTUS ASTARTES</span> units' [MELTA]/[TORRENT] attacks that target that enemy unit have +2 S."),
  ],
  keywords: ['Infantry', 'Character', 'Epic Hero', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes', 'Salamanders'],
  unitComposition: ["1 Vulkan He'stan model"],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 1 }, { name: 'gauntlet of the forge', count: 1 }, { name: 'spear of vulkan', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Bolt Pistol; 1 Gauntlet of the Forge; 1 Spear of Vulkan.',
}))

// ---------------------------------------------------------------------------
// Adrax Agatone (pg 26 bottom / printed 183 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Adrax Agatone',
  role: 'Characters',
  models: models('ADRAX AGATONE|6"|5|2+|4|5|6+|1|'),
  weapons: weapons(
    'Drakkis [CLOSE-QUARTERS, TORRENT]|12|D6+3|-|5|-1|1',
    'Malleus Noctum [DEVASTATING WOUNDS]|Melee|5|2+|10|-2|3',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Lord of the Pyroclasts', 'While an enemy unit is engaged with this unit, that enemy unit has -1 OC.'),
    ability('Unto the Anvil', "This unit's melee attacks can:<ul><li>Re-roll wound rolls of 1.</li><li><u>Or:</u> If the assault doctrine is active for this unit, re-roll wound rolls.</li></ul>"),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Epic Hero', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes', 'Salamanders'],
  unitComposition: ['1 Adrax Agatone model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'drakkis', count: 1 }, { name: 'malleus noctum', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Drakkis; 1 Malleus Noctum.',
}))

// ---------------------------------------------------------------------------
// Caanok Var (pg 27 top / printed 184 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Caanok Var',
  role: 'Characters',
  models: models('CAANOK VAR|5"|6|2+|4|6|6+|1|'),
  weapons: weapons(
    'Storm Bolter [RAPID FIRE 2]|24|2|2+|5|-1|1',
    'Axiom [CLEAVE 1]|Melee|5|2+|8|-3|2',
  ),
  abilities: [
    core('Deep Strike'), core('Feel No Pain 5+'), core('Leader'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Cold and Calculating', "In your Shooting phase or the Fight phase, when this unit is selected to attack, you can select one of the following for this unit's attacks to have:<ul><li>[LETHAL HITS: MONSTER/VEHICLE].</li><li><u>Or:</u> [SUSTAINED HITS 1: non-MONSTER/VEHICLE].</li><li><u>Or:</u> If the tactical doctrine is active for this unit, [LETHAL HITS: MONSTER/VEHICLE] and [SUSTAINED HITS 1: non-MONSTER/VEHICLE].</li></ul>"),
    ability('Cerebrex Logic Engine', 'In the Declare Battle Formations step, you can select one friendly <span class="kwb">ADEPTUS ASTARTES INFANTRY</span> unit. That unit has Scouts 6".'),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Epic Hero', 'Imperium', 'Terminator'],
  factionKeywords: ['Adeptus Astartes', 'Iron Hands'],
  unitComposition: ['1 Caanok Var model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'axiom', count: 1 }, { name: 'storm bolter', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Axiom; 1 Storm Bolter.',
}))

// ---------------------------------------------------------------------------
// Iron Father Feirros (pg 27 bottom / printed 184 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Iron Father Feirros',
  role: 'Characters',
  models: models('IRON FATHER FEIRROS|5"|6|2+|4|6|6+|1|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|2+|5|-1|1',
    "Gorgon's Wrath [RAPID FIRE 2, SUSTAINED HITS 2]|36|3|2+|6|-1|2",
    'Harrowhand|Melee|6|3+|7|-2|2',
    'Medusan Manipuli [EXTRA ATTACKS]|Melee|2|3+|10|-2|3',
  ),
  abilities: [
    core('Feel No Pain 5+'), core('Leader'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Master of the Forge', 'In your Movement phase, at the start or end of this unit\'s move, you can select one friendly <span class="kwb">ADEPTUS ASTARTES VEHICLE</span> model within 3" of this model:<ul><li>That <span class="kwb">VEHICLE</span> model heals 3 wounds.</li><li>That <span class="kwb">VEHICLE</span> model\'s attacks can ignore modifiers to the following until the start of your next Movement phase:<ul><li>BS.</li><li>Hit rolls and wound rolls.</li></ul></li></ul>'),
    ability('Rites of Tempering', "Attacks that target this unit with a S greater than this unit's T have -1 to wound rolls."),
    ability('Iron Father', 'While this model is within 3" of a friendly <span class="kwb">ADEPTUS ASTARTES VEHICLE</span> unit, this unit has Lone Operative.'),
  ],
  keywords: ['Infantry', 'Character', 'Epic Hero', 'Gravis', 'Imperium'],
  factionKeywords: ['Adeptus Astartes', 'Iron Hands'],
  unitComposition: ['1 Iron Father Feirros model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 1 }, { name: "gorgon's wrath", count: 1 }, { name: 'harrowhand', count: 1 }, { name: 'medusan manipuli', count: 1 }],
  loadout: "<b>This model is equipped with:</b> 1 Bolt Pistol; 1 Gorgon's Wrath; 1 Harrowhand; 1 Medusan Manipuli.",
}))

// ---------------------------------------------------------------------------
// Kor'sarro Khan (pg 28 top / printed 185 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: "Kor'sarro Khan",
  role: 'Characters',
  models: models("KOR'SARRO KHAN|6\"|5|3+|4|5|6+|1|"),
  weapons: weapons(
    'Anzuq [ANTI-INFANTRY 4+, CLOSE-QUARTERS, DEVASTATING WOUNDS: INFANTRY]|18|2|3+|4|-1|2',
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|2+|5|-1|1',
    'Moonfang [ANTI-CHARACTER 5+, DEVASTATING WOUNDS, PRECISION]|Melee|6|2+|6|-3|2',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Trophy Taker', 'This unit\'s attacks that target a <span class="kwb">CHARACTER</span> unit can:<ul><li>Re-roll hit rolls of 1.</li><li>Re-roll wound rolls of 1.</li></ul>'),
    ability('For the Khan!', "<ul><li>This unit's ranged attacks have [ASSAULT].</li><li>This unit's melee attacks have [LANCE].</li></ul>"),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Epic Hero', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes', 'White Scars'],
  unitComposition: ["1 Kor'sarro Khan model"],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'anzuq', count: 1 }, { name: 'bolt pistol', count: 1 }, { name: 'moonfang', count: 1 }],
  loadout: "<b>This model is equipped with:</b> 1 Anzuq; 1 Bolt Pistol; 1 Moonfang.",
}))

// ---------------------------------------------------------------------------
// Suboden Khan (pg 28 bottom / printed 185 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Suboden Khan',
  role: 'Characters',
  models: models('SUBODEN KHAN|12"|6|3+|4|8|6+|2|'),
  weapons: weapons(
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|2+|5|-1|1',
    'Onslaught Gatling Cannon [DEVASTATING WOUNDS: non-MONSTER/VEHICLE]|24|8|2+|5|-1|1',
    'Power Sword [EXTRA ATTACKS, SUSTAINED HITS 1: non-MONSTER/VEHICLE]|Melee|3|2+|5|-2|1',
    'Stormtooth [ANTI-MONSTER/VEHICLE 4+, LANCE]|Melee|6|2+|7|-3|2',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Spear of Chogoris', "<ul><li>This unit's ranged attacks have [ASSAULT].</li><li>When this unit is selected to make an advance move, that advance move does not prevent this unit from being eligible to declare a charge.</li><li>If the assault doctrine is active for this unit, this unit has +1 to advance rolls and charge rolls.</li></ul>"),
    ability('Skilled Riders', 'This unit has MOBILE.'),
  ],
  keywords: ['Mounted', 'Captain', 'Character', 'Epic Hero', 'Explosives', 'Imperium'],
  factionKeywords: ['Adeptus Astartes', 'White Scars'],
  unitComposition: ['1 Suboden Khan model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'heavy bolt pistol', count: 1 }, { name: 'onslaught gatling cannon', count: 1 }, { name: 'power sword', count: 1 }, { name: 'stormtooth', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Heavy Bolt Pistol; 1 Onslaught Gatling Cannon; 1 Power Sword; 1 Stormtooth.',
}))

// ---------------------------------------------------------------------------
// Captain (pg 29 / printed 186) -- generic, buildable
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Captain',
  role: 'Characters',
  models: models('CAPTAIN|6"|5|3+|4|5|6+|1|'),
  weapons: weapons(
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|2+|5|-1|1',
    'Master-crafted Bolter [ASSAULT, RAPID FIRE 1]|24|2|2+|5|-1|2',
    'Neo-volkite Pistol [CLOSE-QUARTERS, DEVASTATING WOUNDS]|12|1|2+|5|0|2',
    'Plasma Pistol - Standard [CLOSE-QUARTERS]|12|1|2+|7|-2|1',
    'Plasma Pistol - Supercharge [CLOSE-QUARTERS, HAZARDOUS]|12|1|2+|8|-3|2',
    'Master-crafted Power Weapon|Melee|6|2+|6|-2|2',
    'Power Fist|Melee|5|2+|8|-2|2',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Strategic Acumen', 'In your Command phase, you can use this ability. If you do, select one combat doctrine to be active for this unit until the start of your next Command phase.'),
    ability('Finest Hour (Once per battle, per unit)', 'In the Fight phase, when this unit is selected to fight, you can use this ability. If you do, this unit\'s melee attacks have:<ul><li>+3 A.</li><li>[DEVASTATING WOUNDS].</li></ul>'),
    ability('Relic Shield', 'This model has +1 W.'),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Captain model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'heavy bolt pistol', count: 1 }, { name: 'master-crafted bolter', count: 1 }, { name: 'master-crafted power weapon', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Heavy Bolt Pistol; 1 Master-crafted Bolter; 1 Master-crafted Power Weapon.',
  options: [
    { button: '•', description: "This model's Master-crafted Bolter and Heavy Bolt Pistol can be replaced with one of the following: <ul style=\"list-style-type:circle\"><li>1 Neo-volkite Pistol</li><li>1 Plasma Pistol</li></ul>" },
    { button: '•', description: "This model's Master-crafted Bolter can be replaced with 1 Relic Shield (this model's Master-crafted Power Weapon cannot be replaced)." },
    { button: '•', description: "This model's Master-crafted Power Weapon can be replaced with 1 Power Fist." },
  ],
}))

// ---------------------------------------------------------------------------
// Captain with Jump Pack (pg 30 / printed 187) -- generic, buildable
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Captain with Jump Pack',
  role: 'Characters',
  models: models('CAPTAIN WITH JUMP PACK|12"|5|3+|4|5|6+|1|'),
  weapons: weapons(
    'Hand Flamer [CLOSE-QUARTERS, TORRENT]|9|3|-|4|0|1',
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|2+|5|-1|1',
    'Plasma Pistol - Standard [CLOSE-QUARTERS]|12|1|2+|7|-2|1',
    'Plasma Pistol - Supercharge [CLOSE-QUARTERS, HAZARDOUS]|12|1|2+|8|-3|2',
    'Chainsword [SUSTAINED HITS 1]|Melee|8|2+|5|-1|1',
    'Power Fist|Melee|5|2+|8|-2|2',
    'Relic Weapon|Melee|6|2+|6|-2|2',
    'Thunder Hammer [DEVASTATING WOUNDS]|Melee|5|3+|8|-2|3',
  ),
  abilities: [
    core('Deep Strike'), core('Leader'), armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Strategic Acumen', 'In your Command phase, you can use this ability. If you do, select one combat doctrine to be active for this unit until the start of your next Command phase.'),
    ability("Angel's Wrath", 'This unit has +1 to advance rolls and charge rolls.'),
    ability('Relic Shield', 'This model has +1 W.'),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Explosives', 'Fly', 'Imperium', 'Jump Pack', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Captain with Jump Pack model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'chainsword', count: 1 }, { name: 'heavy bolt pistol', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Chainsword; 1 Heavy Bolt Pistol.',
  options: [
    { button: '•', description: "This model's Heavy Bolt Pistol can be replaced with one of the following: <ul style=\"list-style-type:circle\"><li>1 Hand Flamer</li><li>1 Plasma Pistol</li></ul>" },
    { button: '•', description: "This model's Chainsword can be replaced with one of the following: <ul style=\"list-style-type:circle\"><li>1 Power Fist</li><li>1 Relic Weapon</li></ul>" },
    { button: '•', description: "This model's Heavy Bolt Pistol and Chainsword can be replaced with one of the following: <ul style=\"list-style-type:circle\"><li>1 Thunder Hammer and 1 Relic Shield</li><li>1 Chainsword and 1 Relic Shield</li></ul>" },
  ],
}))

// ---------------------------------------------------------------------------
// Captain in Phobos Armour (pg 31 top / printed 188 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Captain in Phobos Armour',
  role: 'Characters',
  models: models('CAPTAIN IN PHOBOS ARMOUR|8"|4|3+|4|5|6+|1|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|2+|5|-1|1',
    'Instigator Bolt Carbine [ASSAULT, PRECISION, RAPID FIRE 1]|24|2|2+|5|-2|2',
    'Combat Knife [PRECISION, SUSTAINED HITS 1]|Melee|6|2+|5|-1|1',
  ),
  abilities: [
    core('Deep Strike'), core('Infiltrators'), core('Leader'), core('Scouts 6"'), core('Stealth'),
    armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Strategic Acumen', 'In your Command phase, you can use this ability. If you do, select one combat doctrine to be active for this unit until the start of your next Command phase.'),
    ability('Tactical Fluidity (Once per battle round, per unit)', 'In your Shooting phase, when this unit has shot, if this unit is unengaged, this unit can make a normal move of up to D6":<ul><li><u>Or:</u> At the end of your opponent\'s Fight phase, if this unit is engaged, this unit can make a fall-back move of up to 6".</li></ul>'),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Explosives', 'Imperium', 'Phobos'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Captain in Phobos Armour model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 1 }, { name: 'combat knife', count: 1 }, { name: 'instigator bolt carbine', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Bolt Pistol; 1 Combat Knife; 1 Instigator Bolt Carbine.',
}))

// ---------------------------------------------------------------------------
// Captain in Terminator Armour (pg 31 bottom / printed 188 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Captain in Terminator Armour',
  role: 'Characters',
  models: models('CAPTAIN IN TERMINATOR ARMOUR|5"|6|2+|4|6|6+|1|'),
  weapons: weapons(
    'Combi-weapon - Infernus [BLAST 1, TORRENT]|12|3|-|4|0|1',
    'Combi-weapon - Purgatus|24|2|2+|7|-2|2',
    'Combi-weapon - Damnatus [MELTA 2]|12|1|2+|9|-3|D3+2',
    'Storm Bolter [RAPID FIRE 2]|24|2|2+|5|-1|1',
    'Relic Fist|Melee|5|2+|8|-2|2',
    'Relic Weapon|Melee|6|2+|6|-2|2',
  ),
  abilities: [
    core('Deep Strike'), core('Leader'), armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Strategic Acumen', 'In your Command phase, you can use this ability. If you do, select one combat doctrine to be active for this unit until the start of your next Command phase.'),
    ability('Unstoppable Valour', 'You can re-roll charge rolls for this unit.'),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Imperium', 'Terminator'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Captain in Terminator Armour model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'relic weapon', count: 1 }, { name: 'storm bolter', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Relic Weapon; 1 Storm Bolter.',
  options: [
    { button: '•', description: "This model's Relic Weapon can be replaced with 1 Relic Fist." },
    { button: '•', description: "This model's Storm Bolter can be replaced with 1 Combi-weapon." },
  ],
}))

// ---------------------------------------------------------------------------
// Captain in Gravis Armour (pg 32 / printed 189)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Captain in Gravis Armour',
  role: 'Characters',
  models: models('CAPTAIN IN GRAVIS ARMOUR|5"|6|3+|4|6|6+|1|'),
  weapons: weapons(
    'Boltstorm Gauntlet [CLOSE-QUARTERS]|12|3|2+|5|-1|1',
    'Master-crafted Heavy Bolt Rifle [ASSAULT, HEAVY, RAPID FIRE 1]|30|2|2+|6|-1|3',
    'Boltstorm Gauntlet|Melee|5|2+|8|-2|2',
    'Master-crafted Power Weapon|Melee|6|2+|6|-2|2',
    'Relic Blade [EXTRA ATTACKS]|Melee|2|2+|6|-2|2',
    'Relic Chainsword [EXTRA ATTACKS]|Melee|3|2+|5|-1|2',
    'Relic Power Fist [EXTRA ATTACKS]|Melee|1|2+|8|-2|2',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Strategic Acumen', 'In your Command phase, you can use this ability. If you do, select one combat doctrine to be active for this unit until the start of your next Command phase.'),
    ability('Refuse to Yield', 'Attacks allocated to this model have -1 D.'),
  ],
  keywords: ['Infantry', 'Captain', 'Character', 'Explosives', 'Gravis', 'Imperium'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Captain in Gravis Armour model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'master-crafted heavy bolt rifle', count: 1 }, { name: 'master-crafted power weapon', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Master-crafted Heavy Bolt Rifle; 1 Master-crafted Power Weapon.',
  options: [
    { button: '•', description: "This model's Master-crafted Heavy Bolt Rifle and Master-crafted Power Weapon can be replaced with one of the following: <ul style=\"list-style-type:circle\"><li>1 Boltstorm Gauntlet and 1 Relic Blade</li><li>1 Boltstorm Gauntlet and 1 Relic Chainsword</li><li>1 Boltstorm Gauntlet and 1 Relic Power Fist</li></ul>" },
  ],
}))

// ---------------------------------------------------------------------------
// Captain on Bike (pg 33 / printed 190)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Captain on Bike',
  role: 'Characters',
  models: models('CAPTAIN ON BIKE|12"|6|3+|4|6|6+|2|'),
  weapons: weapons(
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|2+|5|-1|1',
    'Plasma Pistol - Standard [CLOSE-QUARTERS]|12|1|2+|7|-2|1',
    'Plasma Pistol - Supercharge [CLOSE-QUARTERS, HAZARDOUS]|12|1|2+|8|-3|2',
    'Twin Bolt Rifle [ASSAULT, RAPID FIRE 2, TWIN-LINKED]|24|2|2+|5|-1|1',
    'Master-crafted Power Weapon|Melee|6|2+|6|-2|2',
    'Thunder Hammer [DEVASTATING WOUNDS]|Melee|5|3+|8|-2|3',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'), armyRule('Transhuman Strategist'),
    ability('Strategic Acumen', 'In your Command phase, you can use this ability. If you do, select one combat doctrine to be active for this unit until the start of your next Command phase.'),
    ability('Into the Fray', "If this unit made a charge move this turn, this unit's melee attacks have [CLEAVE 1]."),
  ],
  keywords: ['Mounted', 'Captain', 'Character', 'Explosives', 'Imperium'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Captain on Bike model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'heavy bolt pistol', count: 1 }, { name: 'master-crafted power weapon', count: 1 }, { name: 'twin bolt rifle', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Heavy Bolt Pistol; 1 Master-crafted Power Weapon; 1 Twin Bolt Rifle.',
  options: [
    { button: '•', description: "This model's Heavy Bolt Pistol can be replaced with 1 Plasma Pistol." },
    { button: '•', description: "This model's Master-crafted Power Weapon can be replaced with 1 Thunder Hammer." },
  ],
}))

// ---------------------------------------------------------------------------
// Lieutenant (pg 34 / printed 191)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Lieutenant',
  role: 'Characters',
  models: models('LIEUTENANT|6"|5|3+|4|4|6+|1|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|2+|5|-1|1',
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|2+|5|-1|1',
    'Master-crafted Bolter|24|2|2+|5|-1|2',
    'Neo-volkite Pistol [CLOSE-QUARTERS, DEVASTATING WOUNDS]|12|1|2+|5|0|2',
    'Plasma Pistol - Standard [CLOSE-QUARTERS]|12|1|2+|7|-2|1',
    'Plasma Pistol - Supercharge [CLOSE-QUARTERS, HAZARDOUS]|12|1|2+|8|-3|2',
    'Ceramite Fists|Melee|5|2+|5|0|1',
    'Master-crafted Power Weapon|Melee|5|2+|6|-2|2',
    'Power Fist|Melee|4|2+|8|-2|2',
  ),
  abilities: [
    core('Support'), armyRule('Combat Doctrines'),
    ability('Demi-company Commander (Once per turn, per unit)', "When a friendly <span class=\"kwb\">CAPTAIN</span> unit uses its Strategic Acumen ability, you can use this ability. If you do, the selected combat doctrine is active for this unit until the start of your next Command phase."),
    ability('Tactical Precision', "This unit's attacks have [LETHAL HITS: non-MONSTER/VEHICLE]."),
    ability('Storm Shield', 'This model has 4+ InSv.'),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Lieutenant model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 1 }, { name: 'ceramite fists', count: 1 }, { name: 'master-crafted bolter', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Bolt Pistol; 1 Ceramite Fists; 1 Master-crafted Bolter.',
  options: [
    { button: '•', description: "This model's Master-crafted Bolter and Bolt Pistol can be replaced with 1 Neo-volkite Pistol and 1 Master-crafted Power Weapon." },
    { button: '•', description: "If this model is equipped with 1 Neo-volkite Pistol, it can be equipped with 1 Storm Shield (this model's 1 Neo-volkite Pistol cannot be replaced)." },
    { button: '•', description: "This model's Bolt Pistol can be replaced with 1 Heavy Bolt Pistol." },
    { button: '•', description: "This model's Master-crafted Bolter can be replaced with one of the following: <ul style=\"list-style-type:circle\"><li>1 Master-crafted Power Weapon</li><li>1 Plasma Pistol</li><li>1 Power Fist</li></ul>" },
    { button: '•', description: "This model's Ceramite Fists can be replaced with one of the following: <ul style=\"list-style-type:circle\"><li>1 Master-crafted Power Weapon</li><li>1 Power Fist</li></ul>" },
  ],
}))

// ---------------------------------------------------------------------------
// Lieutenant in Phobos Armour (pg 35 top / printed 192 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Lieutenant in Phobos Armour',
  role: 'Characters',
  models: models('LIEUTENANT IN PHOBOS ARMOUR|8"|4|3+|4|4|6+|1|'),
  weapons: weapons(
    'Master-crafted Bolt Carbine [ASSAULT, RAPID FIRE 1]|24|2|2+|5|-1|2',
    'Special-issue Bolt Pistol [CLOSE-QUARTERS, PRECISION]|12|1|2+|5|-2|2',
    'Monomolecular Combat Blades [PRECISION, SUSTAINED HITS 1]|Melee|6|2+|5|-1|1',
  ),
  abilities: [
    core('Deep Strike'), core('Infiltrators'), core('Scouts 6"'), core('Support'),
    armyRule('Combat Doctrines'),
    ability('Demi-company Commander (Once per turn, per unit)', "When a friendly <span class=\"kwb\">CAPTAIN</span> unit uses its Strategic Acumen ability, you can use this ability. If you do, the selected combat doctrine is active for this unit until the start of your next Command phase."),
    ability('Tactical Precision', "This unit's attacks have [LETHAL HITS: non-MONSTER/VEHICLE]."),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Imperium', 'Phobos', 'Smoke'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Lieutenant in Phobos Armour model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'monomolecular combat blades', count: 1 }, { name: 'special-issue bolt pistol', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Monomolecular Combat Blades; 1 Special-issue Bolt Pistol.',
  options: [
    { button: '•', description: "This model's Special-issue Bolt Pistol can be replaced with 1 Master-crafted Bolt Carbine." },
  ],
}))

// ---------------------------------------------------------------------------
// Lieutenant with Combi-weapon (pg 35 bottom / printed 192 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Lieutenant with Combi-weapon',
  role: 'Characters',
  models: models('LIEUTENANT WITH COMBI-WEAPON|8"|4|3+|4|4|6+|1|'),
  weapons: weapons(
    'Combi-weapon - Bolter [ASSAULT, RAPID FIRE 1]|24|2|2+|5|-1|2',
    'Combi-weapon - Flamer [ASSAULT, BLAST 1, TORRENT]|12|3|-|5|-1|1',
    'Paired Combat Blades [SUSTAINED HITS 1]|Melee|6|2+|5|-1|1',
  ),
  abilities: [
    core('Feel No Pain 5+'), core('Infiltrators'), core('Lone Operative'), core('Stealth'),
    armyRule('Combat Doctrines'),
    ability('Priority Target Identified (Once per battle, per unit)', 'In your Command phase, you can use this ability. If you do, select one visible terrain feature. That terrain feature is identified until the end of the turn.<ul><li>While an enemy unit is within an identified terrain feature, that enemy unit has +3" detection range.</li></ul>'),
    ability('Evade and Survive (Once per phase, per unit)', 'In your opponent\'s Movement phase, when an enemy unit ends a move within 8" of this unit, if this unit is unengaged, this unit can make a normal move of up to D3+3".'),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Imperium', 'Phobos', 'Smoke'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Lieutenant with Combi-weapon model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'combi-weapon', count: 1 }, { name: 'paired combat blades', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Combi-weapon; 1 Paired Combat Blades.',
}))

// ---------------------------------------------------------------------------
// Chaplain (pg 36 top / printed 193 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Chaplain',
  role: 'Characters',
  models: models('CHAPLAIN|6"|5|3+|4|4|5+|1|'),
  weapons: weapons(
    'Absolvor Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-2|2',
    'Crozius Arcanum [CLEAVE 1]|Melee|5|2+|6|-1|2',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'),
    ability('Litany of Hate', "This unit's melee attacks have [LANCE]."),
    ability('Spiritual Leader (Once per battle round, per unit)', 'At the start of any phase, you can select one friendly battle-shocked <span class="kwb">ADEPTUS ASTARTES</span> unit within 6" of this model. That unit is no longer battle-shocked.'),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Chaplain model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'absolvor bolt pistol', count: 1 }, { name: 'crozius arcanum', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Absolvor Bolt Pistol; 1 Crozius Arcanum.',
}))

// ---------------------------------------------------------------------------
// Chaplain with Jump Pack (pg 36 bottom / printed 193 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Chaplain with Jump Pack',
  role: 'Characters',
  models: models('CHAPLAIN WITH JUMP PACK|12"|5|3+|4|4|5+|1|'),
  weapons: weapons(
    'Absolvor Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-2|2',
    'Crozius Arcanum [CLEAVE 1]|Melee|5|2+|6|-1|2',
  ),
  abilities: [
    core('Deep Strike'), core('Leader'), armyRule('Combat Doctrines'),
    ability('Litany of Hate', "This unit's melee attacks have [LANCE]."),
    ability('Exhortation of Rage', "While this unit is at or below half-strength, this unit's melee attacks can re-roll wound rolls."),
  ],
  keywords: ['Infantry', 'Chaplain', 'Character', 'Explosives', 'Fly', 'Imperium', 'Jump Pack', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Chaplain with Jump Pack model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'absolvor bolt pistol', count: 1 }, { name: 'crozius arcanum', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Absolvor Bolt Pistol; 1 Crozius Arcanum.',
}))

// ---------------------------------------------------------------------------
// Chaplain in Terminator Armour (pg 37 top / printed 194 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Chaplain in Terminator Armour',
  role: 'Characters',
  models: models('CHAPLAIN IN TERMINATOR ARMOUR|5"|6|2+|4|5|5+|1|'),
  weapons: weapons(
    'Storm Bolter [RAPID FIRE 2]|24|2|3+|5|-1|1',
    'Crozius Arcanum [CLEAVE 1]|Melee|5|2+|6|-1|2',
  ),
  abilities: [
    core('Deep Strike'), core('Leader'), armyRule('Combat Doctrines'),
    ability('Litany of Hate', "This unit's melee attacks have [LANCE]."),
    ability('Zealous Fortitude', 'This unit has Feel No Pain 4+ against mortal wounds.'),
    ability('Relic Shield', 'This model has +1 W.'),
  ],
  keywords: ['Infantry', 'Chaplain', 'Character', 'Imperium', 'Terminator'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Chaplain in Terminator Armour model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'crozius arcanum', count: 1 }, { name: 'storm bolter', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Crozius Arcanum; 1 Storm Bolter.',
  options: [
    { button: '•', description: "This model's Storm Bolter can be replaced with 1 Relic Shield." },
  ],
}))

// ---------------------------------------------------------------------------
// Chaplain on Bike (pg 37 bottom / printed 194 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Chaplain on Bike',
  role: 'Characters',
  models: models('CHAPLAIN ON BIKE|12"|6|3+|4|5|5+|2|'),
  weapons: weapons(
    'Absolvor Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-2|2',
    'Twin Bolt Rifle [RAPID FIRE 2, TWIN-LINKED]|24|2|3+|5|-1|1',
    'Crozius Arcanum [CLEAVE 1]|Melee|5|2+|6|-1|2',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'),
    ability('Litany of Hate', "This unit's melee attacks have [LANCE]."),
    ability('Catechism of Fire', "In your Shooting phase, when this unit is selected to shoot, you can select one visible enemy unit. This unit's ranged attacks that target that unit have [DEVASTATING WOUNDS]."),
  ],
  keywords: ['Mounted', 'Chaplain', 'Character', 'Explosives', 'Imperium'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Chaplain on Bike model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'absolvor bolt pistol', count: 1 }, { name: 'crozius arcanum', count: 1 }, { name: 'twin bolt rifle', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Absolvor Bolt Pistol; 1 Crozius Arcanum; 1 Twin Bolt Rifle.',
}))

// ---------------------------------------------------------------------------
// Judiciar (pg 38 top / printed 195 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Judiciar',
  role: 'Characters',
  models: models('JUDICIAR|6"|5|3+|4|4|6+|1|'),
  weapons: weapons(
    'Absolvor Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-2|2',
    'Executioner Relic Blade [DEVASTATING WOUNDS, PRECISION]|Melee|5|2+|7|-2|2',
  ),
  abilities: [
    core('Fights First'), core('Support'), armyRule('Combat Doctrines'),
    ability('Tempormortis', 'This unit has Fights First.'),
  ],
  keywords: ['Infantry', 'Character', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Judiciar model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'absolvor bolt pistol', count: 1 }, { name: 'executioner relic blade', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Absolvor Bolt Pistol; 1 Executioner Relic Blade.',
}))

// ---------------------------------------------------------------------------
// Librarian (pg 38 bottom / printed 195 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Librarian',
  role: 'Characters',
  models: models('LIBRARIAN|6"|5|3+|4|6|6+|1|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|3+|5|-1|1',
    'Smite - Focused Witchfire [DEVASTATING WOUNDS, HAZARDOUS, PSYCHIC]|24|D3+3|3+|6|-1|2',
    'Smite - Witchfire [PSYCHIC]|24|D6|3+|6|-1|2',
    'Force Weapon [PSYCHIC]|Melee|4|3+|6|-2|2',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'), armyRule('Librarius'),
    ability('Librarian (psyker level 1)', 'This model has the psychic abilities listed in the Psychic Abilities section.'),
    ability('Psychic Hood (Psychic)', 'This unit has Feel No Pain 4+ against psychic attacks.'),
    ability('Veil of Time (psychic level 1)', 'When this unit is selected to make an advance move, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do:<ul><li>On a 1, this unit is battle-shocked.</li><li>This unit can change that advance roll to a 6.</li></ul>'),
    ability('Force Dome (psychic level 1)', 'In your Movement phase, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do:<ul><li>On a 1, this unit is battle-shocked.</li><li>This unit has 4+ InSv until the start of your next turn.</li></ul>'),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Imperium', 'Psyker', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Librarian model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 1 }, { name: 'force weapon', count: 1 }, { name: 'smite', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Bolt Pistol; 1 Force Weapon; 1 Smite.',
}))

// ---------------------------------------------------------------------------
// Librarian in Phobos Armour (pg 39 top / printed 196 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Librarian in Phobos Armour',
  role: 'Characters',
  models: models('LIBRARIAN IN PHOBOS ARMOUR|8"|4|3+|4|6|6+|1|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|3+|5|-1|1',
    'Smite - Focused Witchfire [DEVASTATING WOUNDS, HAZARDOUS, PSYCHIC]|24|D3+3|3+|6|-2|2',
    'Smite - Witchfire [PSYCHIC]|24|D6|3+|6|-1|2',
    'Force Weapon [PSYCHIC]|Melee|4|3+|6|-2|2',
  ),
  abilities: [
    core('Deep Strike'), core('Infiltrators'), core('Leader'), core('Scouts 6"'), core('Stealth'),
    armyRule('Combat Doctrines'), armyRule('Librarius'),
    ability('Librarian (psyker level 1)', 'This model has the psychic abilities listed in the Psychic Abilities section.'),
    ability('Psychic Hood (Psychic)', 'This unit has Feel No Pain 4+ against psychic attacks.'),
    ability('Shrouding (psychic level 1)', 'When an enemy unit targets this unit, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do:<ul><li>On a 1, this unit is battle-shocked.</li><li>Attacks that target this unit have -1 to hit rolls until the end of the phase.</li></ul>'),
    ability('Soul Sight (psychic level 1)', 'In your Shooting phase, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do:<ul><li>On a 1, this unit is battle-shocked.</li><li>Select one visible enemy unit. Ranged attacks that target that enemy unit have [IGNORES COVER].</li></ul>'),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Imperium', 'Phobos', 'Psyker'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Librarian in Phobos Armour model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 1 }, { name: 'force weapon', count: 1 }, { name: 'smite', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Bolt Pistol; 1 Force Weapon; 1 Smite.',
}))

// ---------------------------------------------------------------------------
// Librarian in Terminator Armour (pg 39 bottom / printed 196 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Librarian in Terminator Armour',
  role: 'Characters',
  models: models('LIBRARIAN IN TERMINATOR ARMOUR|5"|6|2+|4|5|6+|1|'),
  weapons: weapons(
    'Smite - Focused Witchfire [DEVASTATING WOUNDS, HAZARDOUS, PSYCHIC]|24|D3+3|3+|6|-2|2',
    'Smite - Witchfire [PSYCHIC]|24|D6|3+|6|-1|2',
    'Storm Bolter [RAPID FIRE 2]|24|2|3+|5|-1|1',
    'Force Weapon [PSYCHIC]|Melee|4|3+|6|-2|2',
  ),
  abilities: [
    core('Deep Strike'), core('Leader'), armyRule('Combat Doctrines'), armyRule('Librarius'),
    ability('Librarian (psyker level 1)', 'This model has the psychic abilities listed in the Psychic Abilities section.'),
    ability('Psychic Hood (Psychic)', 'This unit has Feel No Pain 4+ against psychic attacks.'),
    ability('Might of Heroes (psychic level 1)', "In the Fight phase, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do:<ul><li>On a 1, this unit is battle-shocked.</li><li>This unit's melee attacks have +2 S.</li></ul>"),
    ability('Thunderous Force (psychic level 1)', "In your Shooting phase, if this unit is not battle-shocked, you can make a psychic roll for this unit by rolling one D6. If you do:<ul><li>On a 1, this unit is battle-shocked.</li><li>This unit's ranged attacks have +6\" R.</li></ul>"),
  ],
  keywords: ['Infantry', 'Imperium', 'Psyker', 'Terminator'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Librarian in Terminator Armour model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'force weapon', count: 1 }, { name: 'smite', count: 1 }, { name: 'storm bolter', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Force Weapon; 1 Smite; 1 Storm Bolter.',
}))

// ---------------------------------------------------------------------------
// Ancient (pg 40 top / printed 197 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Ancient',
  role: 'Characters',
  models: models('ANCIENT|6"|5|3+||4|6+|2|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|3+|5|-1|1',
    'Bolt Rifle - Focused Fire [HEAVY, RAPID FIRE 1]|24|1|3+|6|-1|2',
    'Bolt Rifle - Saturation [ASSAULT, RAPID FIRE 1]|24|2|3+|5|-1|1',
    'Ceramite Fists|Melee|4|3+|5|0|1',
    'Power Weapon|Melee|5|3+|5|-2|1',
  ),
  abilities: [
    core('Support'), armyRule('Combat Doctrines'),
    ability('Raise the Banner', 'At the end of your Movement phase, if this unit is controlling an objective, that objective is secured.'),
    ability('Honour of the Company', 'This unit has +1 OC.'),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Ancient model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 1 }, { name: 'bolt rifle', count: 1 }, { name: 'ceramite fists', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Bolt Pistol; 1 Bolt Rifle; 1 Ceramite Fists.',
  options: [
    { button: '•', description: "This model's Bolt Rifle can be replaced with 1 Power Weapon." },
  ],
}))

// ---------------------------------------------------------------------------
// Bladeguard Ancient (pg 40 bottom / printed 197 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Bladeguard Ancient',
  role: 'Characters',
  models: models('BLADEGUARD ANCIENT|6"|5|3+|4|4|6+|3|'),
  weapons: weapons(
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-1|1',
    'Relics of Battle|Melee|4|3+|5|-2|2',
  ),
  abilities: [
    core('Support'), armyRule('Combat Doctrines'),
    ability('Raise the Banner', 'At the end of your Movement phase, if this unit is controlling an objective, that objective is secured.'),
    ability('Deeds of Legend', "While this unit is within range of an objective, this unit's melee attacks have +1 A."),
  ],
  keywords: ['Infantry', 'Ancient', 'Character', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Bladeguard Ancient model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'heavy bolt pistol', count: 1 }, { name: 'relics of battle', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Heavy Bolt Pistol; 1 Relics of Battle.',
}))

// ---------------------------------------------------------------------------
// Ancient in Terminator Armour (pg 41 top / printed 198 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Ancient in Terminator Armour',
  role: 'Characters',
  models: models('ANCIENT IN TERMINATOR ARMOUR|5"|6|2+|4|5|6+|2|'),
  weapons: weapons(
    'Storm Bolter [RAPID FIRE 2]|24|2|3+|5|-1|1',
    'Master-crafted Power Weapon|Melee|5|3+|5|-2|2',
  ),
  abilities: [
    core('Deep Strike'), core('Support'), armyRule('Combat Doctrines'),
    ability('Raise the Banner', 'At the end of your Movement phase, if this unit is controlling an objective, that objective is secured.'),
    ability('Never Shall the Standard Fall', "While this unit is within range of an objective, attacks that target this unit with a S greater than this unit's T have -1 to wound rolls."),
  ],
  keywords: ['Infantry', 'Ancient', 'Character', 'Imperium', 'Terminator'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Ancient in Terminator Armour model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'master-crafted power weapon', count: 1 }, { name: 'storm bolter', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Master-crafted Power Weapon; 1 Storm Bolter.',
}))

// ---------------------------------------------------------------------------
// Techmarine (pg 41 bottom / printed 198 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Techmarine',
  role: 'Characters',
  models: models('TECHMARINE|6"|5|2+||4|6+|1|'),
  weapons: weapons(
    'Forge Bolter [SUSTAINED HITS 1]|24|3|2+|5|-1|2',
    'Grav-pistol [ANTI-VEHICLE 2+, CLOSE-QUARTERS]|12|2|2+|2|-1|3',
    'Omnissian Power Axe and Servo-arm|Melee|5|3+|6|-2|2',
  ),
  abilities: [
    core('Leader'), armyRule('Combat Doctrines'),
    ability('Techmarine', 'While this model is within 3" of a friendly <span class="kwb">ADEPTUS ASTARTES VEHICLE</span> unit, this unit has Lone Operative.'),
    ability('Blessings of the Omnissiah', 'In your Movement phase, at the start or end of this unit\'s move, you can select one friendly <span class="kwb">ADEPTUS ASTARTES VEHICLE</span> model within 3" of this model:<ul><li>That <span class="kwb">VEHICLE</span> model heals D3 wounds.</li><li>That <span class="kwb">VEHICLE</span> model\'s attacks can ignore modifiers to hit rolls and wound rolls until the start of your next Movement phase.</li></ul>'),
  ],
  keywords: ['Infantry', 'Character', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Techmarine model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'forge bolter', count: 1 }, { name: 'grav-pistol', count: 1 }, { name: 'omnissian power axe and servo-arm', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Forge Bolter; 1 Grav-pistol; 1 Omnissian Power Axe and Servo-arm.',
}))

// ---------------------------------------------------------------------------
// Apothecary (pg 42 top / printed 199 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Apothecary',
  role: 'Characters',
  models: models('APOTHECARY|6"|5|3+||4|6+|1|'),
  weapons: weapons(
    'Absolvor Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-2|2',
    'Reductor Pistol [EXTRA ATTACKS]|Melee|1|3+|5|-4|2',
    'Servo-armature|Melee|4|3+|5|0|1',
  ),
  abilities: [
    core('Support'), armyRule('Combat Doctrines'),
    ability('Narthecium', 'In your Command phase, this unit heals D3+1 wounds.'),
  ],
  keywords: ['Infantry', 'Character', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Apothecary model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'absolvor bolt pistol', count: 1 }, { name: 'reductor pistol', count: 1 }, { name: 'servo-armature', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Absolvor Bolt Pistol; 1 Reductor Pistol; 1 Servo-armature.',
}))

// ---------------------------------------------------------------------------
// Apothecary Biologis (pg 42 bottom / printed 199 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Apothecary Biologis',
  role: 'Characters',
  models: models('APOTHECARY BIOLOGIS|5"|6|3+||5|6+|1|'),
  weapons: weapons(
    'Absolvor Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-2|2',
    'Servo-armature|Melee|4|3+|5|0|1',
  ),
  abilities: [
    core('Support'), armyRule('Combat Doctrines'),
    ability('Vivispectral Analysis Targeting', "This unit's attacks have [LETHAL HITS: non-VEHICLE]."),
  ],
  keywords: ['Infantry', 'Apothecary', 'Character', 'Gravis', 'Imperium'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Apothecary Biologis model'],
  modelCountMin: 1, modelCountMax: 1,
  defaultWeaponNames: [{ name: 'absolvor bolt pistol', count: 1 }, { name: 'servo-armature', count: 1 }],
  loadout: '<b>This model is equipped with:</b> 1 Absolvor Bolt Pistol; 1 Servo-armature.',
}))

// ---------------------------------------------------------------------------
// Company Heroes (pg 43 / printed 200) -- 4 named roles, one shared statline
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Company Heroes',
  role: 'Characters',
  models: models('COMPANY HEROES|6"|5|3+||4|6+|2|'),
  weapons: weapons(
    'Master-crafted Bolt Pistol [CLOSE-QUARTERS]|12|1|3+|5|-1|2',
    'Master-crafted Bolt Rifle [ASSAULT, RAPID FIRE 1]|24|2|3+|5|-1|2',
    'Master-crafted Heavy Bolter [ASSAULT, HEAVY, RAPID FIRE 2, SUSTAINED HITS 1]|36|4|3+|6|-1|2',
    'Combat Knife|Melee|5|3+|5|-1|1',
    'Master-crafted Power Weapon [PRECISION]|Melee|6|2+|6|-2|2',
  ),
  abilities: [
    armyRule('Combat Doctrines'),
    ability('Raise the Banner', 'At the end of your Movement phase, if this unit is controlling an objective, that objective is secured.'),
    ability('Command Squad', 'Attacks that target this unit have -1 to wound rolls.'),
  ],
  keywords: ['Infantry', 'Explosives', 'Imperium', 'Tacticus', 'Ancient', 'Champion'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Ancient model', '1 Company Champion model', '1 Company Veteran with Bolt Rifle model', '1 Company Veteran with Heavy Bolter model'],
  modelCountMin: 4, modelCountMax: 4,
  defaultWeaponNames: [
    { name: 'combat knife', count: 3 }, { name: 'master-crafted bolt pistol', count: 3 },
    { name: 'master-crafted bolt rifle', count: 1 }, { name: 'master-crafted heavy bolter', count: 1 },
    { name: 'master-crafted power weapon', count: 1 },
  ],
  loadout: 'The Ancient is equipped with: 1 Combat Knife; 1 Master-crafted Bolt Pistol; 1 Master-crafted Bolt Rifle.<br>' +
    'The Company Champion is equipped with: 1 Master-crafted Bolt Pistol; 1 Master-crafted Power Weapon.<br>' +
    'The Company Veteran with Bolt Rifle is equipped with: 1 Combat Knife; 1 Master-crafted Bolt Pistol; 1 Master-crafted Bolt Rifle.<br>' +
    'The Company Veteran with Heavy Bolter is equipped with: 1 Combat Knife; 1 Master-crafted Bolt Pistol; 1 Master-crafted Heavy Bolter.',
}))

// ---------------------------------------------------------------------------
// Intercessor Squad (pg 44 / printed 201) -- Battleline, 5-10 models
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Intercessor Squad',
  role: 'Battleline',
  models: models('INTERCESSOR SQUAD|6"|5|3+||2|6+|2|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|3+|5|-1|1',
    'Bolt Rifle - Focused Fire [HEAVY, RAPID FIRE 1]|24|1|3+|6|-1|2',
    'Bolt Rifle - Saturation [ASSAULT, RAPID FIRE 1]|24|2|3+|5|-1|1',
    'Grenade Launcher - Frag [BLAST 1]|24|4|3+|4|-1|1',
    'Grenade Launcher - Krak [RAPID FIRE 1]|24|1|3+|10|-2|3',
    'Hand Flamer [CLOSE-QUARTERS, TORRENT]|9|3|-|4|0|1',
    'Plasma Pistol - Standard [CLOSE-QUARTERS]|12|1|3+|7|-2|1',
    'Plasma Pistol - Supercharge [CLOSE-QUARTERS, HAZARDOUS]|12|1|3+|8|-3|2',
    'Chainsword|Melee|5|3+|5|-1|1',
    'Knives and Fists|Melee|3|3+|5|0|1',
    'Power Fist|Melee|3|3+|8|-2|2',
    'Power Weapon|Melee|4|3+|5|-2|1',
    'Thunder Hammer [DEVASTATING WOUNDS]|Melee|3|4+|8|-2|3',
  ),
  abilities: [
    armyRule('Combat Doctrines'),
    ability('Bolter Discipline', "In your Shooting phase, if any of the following apply, this unit's ranged attacks have +1 to hit rolls:<ul><li>This unit is within range of an objective.</li><li>The target of that attack is within range of an objective.</li></ul>"),
    ability('Tactical Mainstay', 'Being engaged/battle-shocked does not prevent this unit from being eligible to start an action.<ul><li>When this unit starts an action, that action does not prevent this unit from being eligible to shoot.</li></ul>'),
  ],
  keywords: ['Infantry', 'Battleline', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Intercessor Sergeant model', '4-9 Intercessor models'],
  modelCountMin: 5, modelCountMax: 10,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 10 }, { name: 'bolt rifle', count: 10 }, { name: 'knives and fists', count: 10 }],
  loadout: 'Every model is equipped with: 1 Bolt Pistol; 1 Bolt Rifle; 1 Knives and Fists.',
  options: [
    { button: '•', description: 'The Intercessor Sergeant can have their Knives and Fists replaced with one of the following: <ul style="list-style-type:circle"><li>1 Chainsword</li><li>1 Power Fist</li><li>1 Power Weapon</li><li>1 Thunder Hammer</li></ul>' },
    { button: '•', description: 'The Intercessor Sergeant can have their Bolt Rifle replaced with one of the following: <ul style="list-style-type:circle"><li>1 Chainsword</li><li>1 Hand Flamer</li><li>1 Plasma Pistol</li><li>1 Power Weapon</li></ul>' },
    { button: '•', description: 'For every 5 models in this unit, 1 Intercessor model can be equipped with 1 Grenade Launcher.' },
  ],
}))

// ---------------------------------------------------------------------------
// Assault Intercessor Squad (pg 45 / printed 202)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Assault Intercessor Squad',
  role: 'Battleline',
  models: models('ASSAULT INTERCESSOR SQUAD|6"|5|3+||2|6+|2|'),
  weapons: weapons(
    'Hand Flamer [CLOSE-QUARTERS, TORRENT]|9|3|-|4|0|1',
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-1|1',
    'Plasma Pistol - Standard [CLOSE-QUARTERS]|12|1|3+|7|-2|1',
    'Plasma Pistol - Supercharge [CLOSE-QUARTERS, HAZARDOUS]|12|1|3+|8|-3|2',
    'Chainsword|Melee|4|3+|5|-1|1',
    'Power Fist|Melee|3|3+|8|-2|2',
    'Power Weapon|Melee|4|3+|5|-2|1',
    'Thunder Hammer [DEVASTATING WOUNDS]|Melee|3|4+|8|-2|3',
  ),
  abilities: [
    armyRule('Combat Doctrines'),
    ability('Targeted Intercession', "If this unit made a charge move this turn, this unit's melee attacks have +1 S and AP."),
  ],
  keywords: ['Infantry', 'Battleline', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Assault Intercessor Sergeant model', '4-9 Assault Intercessor models'],
  modelCountMin: 5, modelCountMax: 10,
  defaultWeaponNames: [{ name: 'chainsword', count: 10 }, { name: 'heavy bolt pistol', count: 10 }],
  loadout: 'Every model is equipped with: 1 Chainsword; 1 Heavy Bolt Pistol.',
  options: [
    { button: '•', description: 'The Assault Intercessor Sergeant can have their Heavy Bolt Pistol replaced with one of the following: <ul style="list-style-type:circle"><li>1 Hand Flamer</li><li>1 Plasma Pistol</li></ul>' },
    { button: '•', description: 'The Assault Intercessor Sergeant can have their Chainsword replaced with one of the following: <ul style="list-style-type:circle"><li>1 Power Fist</li><li>1 Power Weapon</li><li>1 Thunder Hammer</li></ul>' },
  ],
}))

// ---------------------------------------------------------------------------
// Assault Intercessors with Jump Packs (pg 46 / printed 203)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Assault Intercessors with Jump Packs',
  role: 'Battleline',
  models: models('ASSAULT INTERCESSORS WITH JUMP PACKS|12"|5|3+||2|6+|1|'),
  weapons: weapons(
    'Hand Flamer [CLOSE-QUARTERS, TORRENT]|9|3|-|4|0|1',
    'Heavy Bolt Pistol [CLOSE-QUARTERS]|18|1|3+|5|-1|1',
    'Plasma Pistol - Standard [CLOSE-QUARTERS]|12|1|3+|7|-2|1',
    'Plasma Pistol - Supercharge [CLOSE-QUARTERS, HAZARDOUS]|12|1|3+|8|-3|2',
    'Chainsword|Melee|4|3+|5|-1|1',
    'Power Fist|Melee|3|3+|8|-2|2',
    'Power Weapon|Melee|4|3+|5|-2|1',
  ),
  abilities: [
    core('Deep Strike'), armyRule('Combat Doctrines'),
    ability('Hammer of Wrath', 'When this unit ends a charge move, you can select one enemy unit engaged with this unit. For each model in this unit engaged with that enemy unit, roll one D6:<ul><li>On a 4+, that enemy unit suffers 1 mortal wound.</li></ul>'),
  ],
  keywords: ['Infantry', 'Explosives', 'Fly', 'Imperium', 'Jump Pack', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Assault Intercessor Sergeant with Jump Pack model', '4-9 Assault Intercessor with Jump Pack models'],
  modelCountMin: 5, modelCountMax: 10,
  defaultWeaponNames: [{ name: 'chainsword', count: 10 }, { name: 'heavy bolt pistol', count: 10 }],
  loadout: 'Every model is equipped with: 1 Chainsword; 1 Heavy Bolt Pistol.',
  options: [
    { button: '•', description: 'The Assault Intercessor Sergeant with Jump Pack can have their Heavy Bolt Pistol replaced with one of the following: <ul style="list-style-type:circle"><li>1 Hand Flamer</li><li>1 Plasma Pistol</li></ul>' },
    { button: '•', description: 'The Assault Intercessor Sergeant with Jump Pack can have their Chainsword replaced with one of the following: <ul style="list-style-type:circle"><li>1 Power Fist</li><li>1 Power Weapon</li></ul>' },
    { button: '•', description: 'For every 5 models in this unit, 1 Assault Intercessor with Jump Pack model can have their Heavy Bolt Pistol replaced with 1 Plasma Pistol.' },
  ],
}))

// ---------------------------------------------------------------------------
// Heavy Intercessor Squad (pg 47 top / printed 204 top)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Heavy Intercessor Squad',
  role: 'Battleline',
  models: models('HEAVY INTERCESSOR SQUAD|5"|6|3+||3|6+|2|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|3+|5|-1|1',
    'Heavy Bolt Rifle [HEAVY, RAPID FIRE 1]|30|2|3+|5|-1|2',
    'Heavy Bolter [HEAVY, RAPID FIRE 2, SUSTAINED HITS 1]|36|3|3+|5|-1|2',
    'Ceramite Fists|Melee|3|3+|5|0|1',
  ),
  abilities: [
    armyRule('Combat Doctrines'),
    ability('Unyielding in the Face of the Foe', 'While this unit is controlling an objective, this unit has +1 to save rolls.'),
  ],
  keywords: ['Infantry', 'Battleline', 'Explosives', 'Gravis', 'Imperium'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Heavy Intercessor Sergeant model', '4-9 Heavy Intercessor models'],
  modelCountMin: 5, modelCountMax: 10,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 10 }, { name: 'ceramite fists', count: 10 }, { name: 'heavy bolt rifle', count: 10 }],
  loadout: 'Every model is equipped with: 1 Bolt Pistol; 1 Ceramite Fists; 1 Heavy Bolt Rifle.',
  options: [
    { button: '•', description: 'For every 5 models in this unit, 1 Heavy Intercessor model can have their Heavy Bolt Rifle replaced with 1 Heavy Bolter.' },
  ],
}))

// ---------------------------------------------------------------------------
// Hellblaster Squad (pg 47 bottom / printed 204 bottom)
// ---------------------------------------------------------------------------
newDatasheets.push(datasheet({
  name: 'Hellblaster Squad',
  role: 'Battleline',
  models: models('HELLBLASTER SQUAD|6"|5|3+||2|6+|1|'),
  weapons: weapons(
    'Bolt Pistol [CLOSE-QUARTERS]|12|1|3+|5|-1|1',
    'Plasma Incinerator - Standard [ASSAULT, RAPID FIRE 1]|24|2|3+|7|-2|2',
    'Plasma Incinerator - Supercharge [ASSAULT, HAZARDOUS, RAPID FIRE 1]|24|2|3+|8|-3|2',
    'Plasma Pistol - Standard [CLOSE-QUARTERS]|12|1|3+|7|-2|1',
    'Plasma Pistol - Supercharge [CLOSE-QUARTERS, HAZARDOUS]|12|1|3+|8|-3|2',
    'Ceramite Fists|Melee|3|3+|5|0|1',
  ),
  abilities: [
    armyRule('Combat Doctrines'),
    ability('Rites of Thermal Appeasement', 'This unit has +1 to hazard rolls made for its Plasma Incinerator and Plasma Pistol weapons.'),
  ],
  keywords: ['Infantry', 'Explosives', 'Imperium', 'Tacticus'],
  factionKeywords: ['Adeptus Astartes'],
  unitComposition: ['1 Hellblaster Sergeant model', '4-9 Hellblaster models'],
  modelCountMin: 5, modelCountMax: 10,
  defaultWeaponNames: [{ name: 'bolt pistol', count: 10 }, { name: 'ceramite fists', count: 10 }, { name: 'plasma incinerator', count: 10 }],
  loadout: 'Every model is equipped with: 1 Bolt Pistol; 1 Ceramite Fists; 1 Plasma Incinerator.',
  options: [
    { button: '•', description: 'The Hellblaster Sergeant can have their Bolt Pistol replaced with 1 Plasma Pistol.' },
  ],
}))
