/**
 * Enhancements that let their bearer join a unit it couldn't otherwise attach to
 * (per the enhancement's own "Declare Battle Formations" clause, or a "LEADER: X"
 * tag in the Munitorum Field Manual not reflected in the enhancement's prose).
 * Maps enhancement id -> datasheet ids of the units it unlocks attachment to.
 */
export const ENHANCEMENT_ATTACHMENTS: Record<string, string[]> = {
  // CSM - Murdertalon Raiders - Pact of Cursed Pinions -> Warp Talons
  '000011228003': ['000000959'],
  // CSM - Nightmare Hunt - Sorrowscent Vulture -> Warp Talons
  '000010641005': ['000000959'],
  // AM - Grizzled Company - Abhuman Detail -> Ogryn Squad or Bullgryn Squad
  '000010637002': ['000000722', '000000723'],
  // AS - Penitent Host - Catechism of Divine Penitence -> Repentia Squad
  '000009029005': ['000000907'],
  // EC - Court of the Phoenician - Exalted Patron -> Flawless Blades
  '000010654003': ['000004089'],
  // NEC - Cursed Legion - Murdermind -> Destroyer Cult units (excluding Characters)
  '000010668003': ['000002110', '000002116', '000002358', '000002359'],
  // ORK - Taktikal Brigade - Skwad Leader -> Kommandos
  '000009795002': ['000000025'],
  // ORK - Taktikal Brigade - Mek Kaptin -> Flash Gitz
  '000009795003': ['000000045'],
  // SM - Saga of the Beastslayer - Wolf-touched -> Wulfen Infantry
  '000010269002': ['000000311', '000004132'],
  // SM - Saga of the Great Wolf - Grimnar's Mark -> Wolf Guard Terminators
  '000010660002': ['000000318'],
  // TS - Warpmeld Pact - Bray Lord -> Tzaangors
  '000010201004': ['000001034'],
  // TYR - Synaptic Tyrant -> Tyranid Warriors
  '000009737002': ['000002691', '000002692'],
  // WE - Cult of Blood - Butcher Lord -> Jakhals or Goremongers
  '000010074003': ['000002628', '000004076'],
  // WE - Khorne Daemonkin - Disciple of Khorne -> Bloodcrushers or Flesh Hounds
  '000010078004': ['000004107', '000004108'],
}
