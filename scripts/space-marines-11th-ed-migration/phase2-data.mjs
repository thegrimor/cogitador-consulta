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
