// Provisional Leader/Support attachment list, given directly by the user (2026-09-01),
// written leader-side (matching how they gave it) and inverted below into the bodyguard-side
// `canBeLedBy` shape the schema actually needs.
//
// Two things are inferred, not given directly -- flagged below:
//  - "Wrekas" (recurring in the user's list) matched to Breaka Boyz: it's paired every time
//    alongside Tankbustas/Flash Gitz, the other two units in the Wreckas detachment's target
//    trio (BREAKA BOYZ/FLASH GITZ/TANKBUSTAS) -- Breaka Boyz is the one of the three not
//    otherwise named in the list, so it's the natural match, but not confirmed by name.
//  - "Kaudillo Snagga" applied to BOTH Beast Snagga warboss-type characters (Beastboss,
//    Beastboss on Squigosaur) since the user only named one generic term for what could be
//    either -- low-risk over-inclusion.
// "Estandarte" (Bannernob) was explicitly called out by the user as "no se sabe" -- omitted.
const leaderTargets = {
  'nazdreg': ['meganobz'],
  'warboss-in-mega-armour': ['meganobz'],
  'big-mek-in-mega-armour': ['meganobz', 'mek-gunz'],
  'warboss': ['boyz', 'breaka-boyz', 'nobz'],
  'big-mek-with-shokk-attack-gun': ['boyz', 'nobz', 'tankbustas', 'mek-gunz'],
  'big-mek': ['boyz', 'nobz', 'mek-gunz', 'flash-gitz', 'breaka-boyz', 'tankbustas'],
  'zodgrod-wortsnagga': ['gretchin'],
  'boss-snikrot': ['kommandos'],
  'beastboss': ['beast-snagga-boyz'],
  'beastboss-on-squigosaur': ['beast-snagga-boyz'],
  'deffkilla-wartrike': ['warbikers'],
  // Apoyos (Support ability -- same attachment mechanic, second slot alongside a Leader)
  'weirdboy': ['boyz', 'beast-snagga-boyz'],
  'bigboss': ['boyz', 'breaka-boyz', 'nobz'],
  'painboy': ['boyz', 'breaka-boyz', 'tankbustas', 'flash-gitz', 'nobz'],
  'mek': ['boyz', 'nobz', 'flash-gitz', 'mek-gunz', 'tankbustas'],
  'runtherd': ['gretchin'],
  'painboss': ['beast-snagga-boyz', 'squighog-boyz'],
}

export const leaderOverrides = {}
for (const [leaderId, targets] of Object.entries(leaderTargets)) {
  for (const targetId of targets) {
    if (!leaderOverrides[targetId]) leaderOverrides[targetId] = []
    leaderOverrides[targetId].push(leaderId)
  }
}
