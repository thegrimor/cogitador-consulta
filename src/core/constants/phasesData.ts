export interface PhaseSubsection {
  ref: string;
  name: string;
  description: string;
}

export interface PhaseData {
  id: string;
  ref: string;
  name: string;
  group: string;
  summary: string;
  subsections: PhaseSubsection[];
}

export const PHASES: PhaseData[] = [
  // ── THE BATTLE ROUND ─────────────────────────────────────────────────────
  {
    id: 'battle-round',
    ref: '07',
    name: 'The Battle Round',
    group: 'The Battle Round',
    summary: 'Games are played in a series of battle rounds; each consists of two player turns.',
    subsections: [
      {
        ref: '07.01',
        name: 'Start of Battle Round',
        description:
          'At the start of the battle round, players resolve rules that are triggered at the start of the battle round, before progressing to player turns.',
      },
      {
        ref: '07.02',
        name: 'Player Turns',
        description:
          "Both players now take one turn each. The same player always takes the first turn in each battle round — the mission you are playing will tell you which player this is. Once that player's turn has ended, their opponent takes their turn.\n\nEach turn consists of seven parts: first the Start of Turn step, then a series of five phases resolved in order (Command, Movement, Shooting, Charge, Fight), then the End of Turn step.",
      },
      {
        ref: '07.03',
        name: 'End of Battle Round',
        description:
          'Rules that are triggered at the end of the battle round are resolved now, in the following order:\n1. First resolve rules triggered at this point other than mission rules.\n2. Both players then consult their mission; if one or both players have achieved any aspects of their mission that are triggered at this point, resolve them now.\n\nThe battle round then ends and, unless the battle ends, the next battle round starts. The mission you are playing will tell you how many battle rounds to resolve before the battle ends.',
      },
    ],
  },

  // ── COMMAND PHASE ──────────────────────────────────────────────────────────
  {
    id: 'command',
    ref: '08',
    name: 'Command Phase',
    group: 'The Battle Round',
    summary: 'Both players gain 1CP, battle-shock rolls are made, then command abilities are resolved.',
    subsections: [
      {
        ref: '08.01',
        name: 'Start of Command Phase',
        description:
          'Rules that are triggered at the start of the Command phase are resolved now.',
      },
      {
        ref: '08.02',
        name: 'Gain Core CP',
        description:
          'Both players gain 1 Command Point (CP).',
      },
      {
        ref: '08.03',
        name: 'Battle-shock',
        description:
          'The active player must now make one battle-shock roll (01.07) for each unit in their army that fulfils one or both of the following conditions:\n• That unit is currently battle-shocked.\n• That unit is at, or below, half-strength.\n\nIf a unit was battle-shocked at the start of this step and its battle-shock roll during this step succeeds, it is no longer battle-shocked.',
      },
      {
        ref: '08.04',
        name: 'Command Abilities',
        description:
          'Rules that are triggered in the Command phase (excluding those that are triggered at the start or end of this phase, when gaining Core CP, or by battle-shock rolls) are resolved now.',
      },
      {
        ref: '08.05',
        name: 'End of Command Phase',
        description:
          'Rules that are triggered at the end of the Command phase are resolved now, in the following order:\n1. First resolve rules triggered at this point other than mission rules.\n2. Both players then consult their mission; if one or both players have achieved any aspects of their mission that are triggered at this point, resolve them now.',
      },
    ],
  },

  // ── MOVEMENT PHASE ──────────────────────────────────────────────────────────
  {
    id: 'movement',
    ref: '09',
    name: 'Movement Phase',
    group: 'The Battle Round',
    summary: 'Move your units one at a time: Remain Stationary, Normal Move, Advance, or Fall Back.',
    subsections: [
      {
        ref: '09.01',
        name: 'Start of Movement Phase',
        description:
          'Rules that are triggered at the start of the Movement phase are resolved now.',
      },
      {
        ref: '09.02',
        name: 'Move Units',
        description:
          'The active player moves their units one at a time, using the sequence below, until all of their units have been selected to move and those moves have ended.\n\n1. Select Unit: Select one friendly unit that has not been selected to move this phase. You can select a unit on the battlefield, in strategic reserves, or embarked within a TRANSPORT. That unit is selected to move.\n\n2. Select Move Type: Select one move type that unit is eligible to make:\n• Remain stationary (09.04)\n• Normal move (09.05)\n• Advance move (09.06)\n• Fall-back move (09.07)\n• Disembark move (18.04)\n• Ingress move (20.04)',
      },
      {
        ref: '09.03',
        name: 'End of Movement Phase',
        description:
          'Rules that are triggered at the end of the Movement phase are resolved now.',
      },
      {
        ref: '09.04',
        name: 'Remain Stationary',
        description:
          'MAXIMUM DISTANCE: –\nELIGIBLE IF: Any unit.\nEFFECT: No models are moved (either in straight lines or rotated). Units that remain stationary do not trigger any rules that are triggered when a unit starts or ends a move.',
      },
      {
        ref: '09.05',
        name: 'Normal Move',
        description:
          'MAXIMUM DISTANCE: Your unit\'s M characteristic.\nELIGIBLE IF: Your unit is on the battlefield and unengaged.\nEFFECT: Your unit moves as described in Moving (03).\nAFTER MOVING: Your unit must be unengaged.',
      },
      {
        ref: '09.06',
        name: 'Advance Move',
        description:
          'MAXIMUM DISTANCE: Advance roll + your unit\'s M characteristic.\nELIGIBLE IF: Your unit is on the battlefield and unengaged.\nEFFECT: Your unit moves as described in Moving (03).\nBEFORE MOVING: Make an advance roll by rolling one D6.\nAFTER MOVING:\n• Your unit must be unengaged.\n• Until the end of the turn, unless otherwise stated, your unit is not eligible to declare a charge or start an action.',
      },
      {
        ref: '09.07',
        name: 'Fall-back Move',
        description:
          'MAXIMUM DISTANCE: Your unit\'s M characteristic.\nELIGIBLE IF: Your unit is engaged.\nEFFECT: Your unit moves as described in Moving (03).\nBEFORE MOVING: Select fall-back mode:\n• Ordered Retreat: If your unit is not battle-shocked, you can select this mode.\n• Desperate Escape: Otherwise, you must select this mode. Make a hazard roll for each model in your unit (06.03).\nWHILE MOVING:\n• Desperate Escape: Each model that is moved can be moved through enemy models.\nAFTER MOVING:\n• Your unit must be unengaged.\n• Until the end of the turn, unless otherwise stated, your unit is not eligible to shoot, declare a charge or start an action.\n• Desperate Escape: If your unit is not battle-shocked, you must make a battle-shock roll for your unit (01.07).',
      },
    ],
  },

  // ── SHOOTING PHASE ──────────────────────────────────────────────────────────
  {
    id: 'shooting',
    ref: '10',
    name: 'Shooting Phase',
    group: 'The Battle Round',
    summary: 'Shoot with eligible units using Normal, Assault, Close-quarters or Indirect shooting.',
    subsections: [
      {
        ref: '10.01',
        name: 'Start of Shooting Phase',
        description:
          'Rules that are triggered at the start of the Shooting phase are resolved now.',
      },
      {
        ref: '10.02',
        name: 'Shoot',
        description:
          'The active player shoots with their eligible units one at a time until all the units they choose to shoot with have been selected and their attacks resolved.\n\nA unit is eligible to shoot if it is on the battlefield and has not already been selected to shoot this phase.\n\n1. Select Unit: Select one friendly unit that is eligible to shoot; that unit is selected to shoot.\n\n2. Select Shooting Type: Select one shooting type that unit is eligible to make:\n• Normal shooting (10.04)\n• Assault shooting (10.05)\n• Close-quarters shooting (10.06)\n• Indirect shooting (10.07)',
      },
      {
        ref: '10.03',
        name: 'End of Shooting Phase',
        description:
          'Rules that are triggered at the end of the Shooting phase are resolved now.',
      },
      {
        ref: '10.04',
        name: 'Normal Shooting',
        description:
          'ELIGIBLE IF: Your unit is unengaged and did not make an advance move this turn.\nEFFECT: Your unit shoots as described in Making Attacks (04).\nAFTER SHOOTING: Until the end of the phase, your unit is not eligible to start an action.',
      },
      {
        ref: '10.05',
        name: 'Assault Shooting',
        description:
          'ELIGIBLE IF: All of the following apply to your unit:\n• Unengaged and made an advance move this turn.\n• Has one or more [ASSAULT] weapons.\nEFFECT: Your unit shoots as described in Making Attacks (04).\nWHILE SHOOTING: You can only select [ASSAULT] weapons to make attacks with.\nAFTER SHOOTING: Until the end of the phase, your unit is not eligible to start an action.',
      },
      {
        ref: '10.06',
        name: 'Close-quarters Shooting',
        description:
          'ELIGIBLE IF: All of the following apply to your unit:\n• Engaged and did not make an advance move this turn.\n• Has one or more [CLOSE-QUARTERS] weapons or is a MONSTER/VEHICLE unit.\nEFFECT: Your unit shoots as described in Making Attacks (04).\nWHILE SHOOTING: Models in your unit can target enemy units your unit is engaged with.\n• MONSTER/VEHICLE Models: Each time a MONSTER/VEHICLE model in your unit makes an attack: unless that attack is made with a [CLOSE-QUARTERS] weapon and targets a unit your unit is engaged with, subtract 1 from the hit roll. If that attack is made with a [BLAST] weapon, it still cannot target a unit your unit is engaged with.\n• Non-MONSTER/Non-VEHICLE Models: You can only select [CLOSE-QUARTERS] weapons to make attacks with and you can only select enemy units that are engaged with your unit as targets.\nAFTER SHOOTING: Until the end of the phase, your unit is not eligible to start an action.',
      },
      {
        ref: '10.07',
        name: 'Indirect Shooting',
        description:
          'ELIGIBLE IF: All of the following apply to your unit:\n• Unengaged and did not make an advance move this turn.\n• Has one or more [INDIRECT FIRE] weapons.\nEFFECT: Your unit shoots as described in Making Attacks (04).\nWHILE SHOOTING:\n• [INDIRECT FIRE] weapons in your unit can target units that are not visible to the attacking model.\n• Each time an [INDIRECT FIRE] weapon makes an attack: the target has the benefit of cover against that attack (13.08); you cannot reroll hit rolls; an unmodified hit roll of 1–5 fails, unless your unit remained stationary this turn and the target is visible to one or more friendly units, in which case an unmodified hit roll of 1–3 fails instead.\nAFTER SHOOTING: Until the end of the phase, your unit is not eligible to start an action.',
      },
    ],
  },

  // ── CHARGE PHASE ──────────────────────────────────────────────────────────
  {
    id: 'charge',
    ref: '11',
    name: 'Charge Phase',
    group: 'The Battle Round',
    summary: 'Declare charges and make Charge Moves to bring your units into combat.',
    subsections: [
      {
        ref: '11.01',
        name: 'Start of Charge Phase',
        description:
          'Rules that are triggered at the start of the Charge phase are resolved now.',
      },
      {
        ref: '11.02',
        name: 'Charge',
        description:
          'The active player resolves charges with their eligible units one at a time until all the units they choose to charge with have declared a charge and those charges have been resolved.\n\n1. Declare Charge: Select one friendly unit that has not declared a charge this phase and is eligible to declare a charge. A unit is eligible to declare a charge if it is on the battlefield, unless one or more of the following apply:\n• It is not within 12" of one or more enemy units.\n• It is engaged.\n• It made an advance or fall-back move this turn.\n\n2. Make Charge Roll: Roll 2D6 — the result is the maximum distance for the charge move.\n\n3. Attempt Charge: If it is possible to make a charge move, and if you still want to, make a charge move with that unit (11.04). Otherwise, your unit does not make a charge move. In either case, the charge is then resolved.',
      },
      {
        ref: '11.03',
        name: 'End of Charge Phase',
        description:
          'Rules that are triggered at the end of the Charge phase are resolved now.',
      },
      {
        ref: '11.04',
        name: 'Charge Move',
        description:
          'MAXIMUM DISTANCE: Charge roll.\nELIGIBLE IF: Your unit declared a charge this phase.\nEFFECT: Your unit moves as described in Moving (03).\nBEFORE MOVING: Select one or more enemy units that are within 12" of your unit and within the maximum distance; until the end of this move, each of those enemy units is a charge target.\nWHILE MOVING:\n• Each model must end its move closer to one or more charge targets.\n• Each model that can end its move within 1" of one or more charge targets must do so.\n• Each model that can end its move engaged with one or more charge targets must do so.\nAFTER MOVING:\n• Your unit must be engaged with all of the charge targets.\n• Your unit cannot be engaged with one or more enemy units that are not charge targets.\n• Until the end of the turn, each model in your unit has the Fights First ability (24.13).',
      },
    ],
  },

  // ── FIGHT PHASE ──────────────────────────────────────────────────────────
  {
    id: 'fight',
    ref: '12',
    name: 'Fight Phase',
    group: 'The Battle Round',
    summary: 'Both players pile in, fight with eligible units, then consolidate.',
    subsections: [
      {
        ref: '12.01',
        name: 'Start of Fight Phase',
        description:
          'Rules that are triggered at the start of the Fight phase are resolved now.',
      },
      {
        ref: '12.02',
        name: 'Pile In',
        description:
          'Both players make pile-in moves (12.03) with all of their eligible units they choose to move. The player whose turn it is resolves all of their moves first, followed by their opponent. Each unit cannot make more than one pile-in move during this step.',
      },
      {
        ref: '12.03',
        name: 'Pile-in Move',
        description:
          'MAXIMUM DISTANCE: 3"\nELIGIBLE IF: It is the Fight phase and one or more of the following apply to your unit:\n• It is engaged.\n• It made a charge move this turn.\n• It was selected to make an overrun fight this phase (12.06).\nEFFECT: Your unit moves as described in Moving (03).\nBEFORE MOVING: Select pile-in targets:\n• If your unit is engaged, select every enemy unit it is engaged with.\n• Otherwise, select one or more enemy units within 5" of your unit.\nWHILE MOVING:\n• Models in base-contact with one or more enemy models cannot be moved.\n• Each model that is moved must end its move closer to the closest pile-in target, and engaged with it if possible.\nAFTER MOVING:\n• Your unit must be engaged.\n• Each model that started this move engaged with an enemy unit must still be engaged with that enemy unit.',
      },
      {
        ref: '12.04',
        name: 'Fight',
        description:
          'A unit is eligible to fight if it has not already been selected to fight this phase and one or more of the following apply:\n• It is engaged, or it was engaged at the start of this step.\n• It made a charge move this turn.\n\nPlayers resolve the following sequence until all eligible units have been selected to fight:\n\n1. Resolve Fights First Combats: Starting with the player whose turn it is, players alternate selecting one friendly Fights First unit that is eligible to fight; that unit is selected to fight. If no Fights First units remain eligible to fight, move to step 2.\n\n2. Resolve Remaining Combats: Starting with the player who moved to this step, players alternate selecting one friendly unit that is eligible to fight. After resolving a fight in this step, if one or more Fights First units are now eligible to fight, return to step 1.\n\nWhen a unit is selected to fight, select one fight type: Normal Fight (12.05) or Overrun Fight (12.06).',
      },
      {
        ref: '12.05',
        name: 'Normal Fight',
        description:
          'ELIGIBLE IF: Your unit is engaged.\nEFFECT: Your unit fights as described in Making Attacks (04).',
      },
      {
        ref: '12.06',
        name: 'Overrun Fight',
        description:
          'ELIGIBLE IF: Your unit is unengaged, or was unengaged at the start of the Fight step but became engaged during the Fight phase.\nEFFECT: Your unit can make one additional pile-in move, then fights as described in Making Attacks (04).\n\nNote: When a unit makes an overrun fight, its models can be moved such that enemy units that were unengaged become engaged. Such enemy units become eligible to fight this phase (and may even be able to fight next if they are Fights First units).',
      },
      {
        ref: '12.07',
        name: 'Consolidate',
        description:
          'Both players make consolidation moves (12.08) with all of their eligible units they choose to move. The player whose turn it is resolves all of their moves first, followed by their opponent. Each unit cannot make more than one consolidation move during this step.',
      },
      {
        ref: '12.08',
        name: 'Consolidation Move',
        description:
          'MAXIMUM DISTANCE: 3"\nELIGIBLE IF: It is the Fight phase and your unit was eligible to fight this phase.\nEFFECT: Your unit moves as described in Moving (03).\nBEFORE MOVING: Select consolidation mode:\n• Ongoing Consolidation: If your unit is engaged, you must select this mode and select every enemy unit it is engaged with.\n• Engaging Consolidation: Otherwise, if your unit is within 3" of one or more enemy units, you must select this mode and select one or more of those enemy units.\n• Objective Consolidation: Otherwise, if your unit is within 3" of one or more objectives, you must select this mode and select one of those objectives.\nWHILE MOVING:\n• Ongoing Consolidation: Models in base-contact with one or more enemy models cannot be moved. Each model that is moved must end its move closer to the closest selected enemy unit, and engaged with it if possible.\n• Engaging Consolidation: Each model that is moved must end its move closer to the closest selected enemy unit, and engaged with it if possible.\n• Objective Consolidation: Each model that is moved must end its move within range of the selected objective if possible, or closer to it if not.\nAFTER MOVING:\n• Ongoing Consolidation: Each model that started this move engaged with an enemy unit must still be engaged with that enemy unit.\n• Engaging Consolidation: Your unit must be engaged with all of the selected enemy units. If one or more enemy units engaged with your unit have not been selected to fight this phase, your opponent must select each of those units, one at a time; when each is selected, it becomes eligible to fight and is selected to fight (12.04).\n• Objective Consolidation: Your unit must be within range of the selected objective.',
      },
      {
        ref: '12.09',
        name: 'End of Fight Phase',
        description:
          "Rules that are triggered at the end of the Fight phase are resolved now.",
      },
    ],
  },

  // ── TERRAIN ──────────────────────────────────────────────────────────────
  {
    id: 'terrain',
    ref: '13',
    name: 'Terrain',
    group: 'Battlefields and Tactics',
    summary: 'Terrain categories (Exposed, Light, Dense), movement, visibility and cover rules.',
    subsections: [
      {
        ref: '13.01',
        name: 'Placing Terrain',
        description:
          'Before the battle, place a selection of terrain features on the battlefield using one or more of the following methods:\n• Place a well-defined boundary (such as a base or mat) in each location you want to furnish with terrain, then place one or more terrain features wholly within that boundary.\n• Place one terrain feature directly on the battlefield.\n• Place two or more terrain features directly on the battlefield in such a way that together they define the boundary of an area.\n\nIn each case, the area of the battlefield occupied by that boundary or terrain feature is known as a terrain area. A mission\'s deployment map may define the location and dimensions of each terrain area. Otherwise, players must agree on this before the battle.',
      },
      {
        ref: '13.02',
        name: 'Terrain Categories',
        description:
          'Each terrain feature belongs to a terrain category, which can affect the movement and visibility of models.\n\nEXPOSED: Offers only scant protection. Examples: Craters, razorwire, scattered debris.\nLIGHT: Can provide cover but will not slow an enemy\'s advance. Examples: Barricades, low walls, statuary.\nDENSE: An obstacle to even the largest war machines, and can shelter entire squads from enemy sight. Examples: Buildings, ruins, armoured containers, woods.\n\nA mission\'s deployment map may define which terrain categories should be present within each terrain area.',
      },
      {
        ref: '13.03',
        name: 'Exposed',
        description:
          'Exposed terrain offers only scant protection to the most desperate troops, and can be traversed without hindrance.\nExamples: Craters, razorwire, scattered debris.',
      },
      {
        ref: '13.04',
        name: 'Light',
        description:
          'Light terrain can provide cover from incoming attacks, but will not slow an enemy\'s advance or offer lasting defence.\nExamples: Barricades, low walls, statuary.',
      },
      {
        ref: '13.05',
        name: 'Dense',
        description:
          'Dense terrain is an obstacle to even the largest war machines, and can shelter entire squads from enemy sight.\nExamples: Buildings, ruins, armoured containers, woods.',
      },
      {
        ref: '13.06',
        name: 'Terrain and Movement',
        description:
          'Models can move through different categories of terrain feature as follows:\n\n• Exposed/Light: All models can move horizontally and vertically through exposed and light terrain features.\n• Dense:\n  – INFANTRY/BEASTS/SWARM/MOBILE models can move horizontally through dense terrain features.\n  – INFANTRY/BEASTS/SWARM models can move vertically through dense terrain features.\n  – Other models can move horizontally through dense terrain features provided that all sections of that terrain feature that the moving model\'s base would move through are 2" or less in height. Otherwise, the moving model must move vertically to ascend or descend such sections. They cannot move through ceilings and floors while doing so, and they cannot end that move on any surface of that terrain feature that is not on ground level.\n\nMOVING VERTICALLY: Models can move vertically to ascend or descend terrain features. While doing so, that model must remain within ½" horizontally of that terrain feature. Add the distance moved vertically up, and the distance moved vertically down, to any other distance that model has moved since its unit began that move.\n\nSETTING UP OR ENDING A MOVE: Models can be set up or end a move on the ground level of terrain features. Models can also be set up or end a move on any surface of a terrain feature that is not on ground level, if: that model has one or more of the following keywords: INFANTRY/BEASTS/SWARM/FLY/MONSTER; and after ending that move, that model is stable and no part of its base overhangs the outer edge of that surface.',
      },
      {
        ref: '13.07',
        name: 'Terrain and Visibility',
        description:
          'Terrain can affect visibility, depending on whether the Benefit of Cover (13.08), Hidden (13.09), Obscuring (13.10) or Solid (13.11) rules apply.',
      },
      {
        ref: '13.08',
        name: 'Benefit of Cover',
        description:
          'Each time a ranged attack targets a unit, if every model in that unit meets one or more of the following conditions, that unit has the benefit of cover against that attack:\n• That model has the INFANTRY/BEASTS/SWARM keyword and is within a terrain area.\n• That model is not fully visible to the attacking model due to one or more intervening terrain features and/or one or more intervening obscuring terrain areas (13.10).\n\nEach time a ranged attack targets a unit that has the benefit of cover against it, worsen the BS characteristic of that attack by 1.',
      },
      {
        ref: '13.09',
        name: 'Hidden',
        description:
          'A model is hidden while all of the following apply to it:\n• That model has the INFANTRY/BEASTS/SWARM keyword and is within a terrain area that contains one or more dense terrain features.\n• That model\'s unit did not make one or more ranged attacks during this turn or during the previous turn.\n\nWhile a model is hidden, it can only be visible to enemy models that are within its detection range. Unless otherwise stated, a model\'s detection range is 15".',
      },
      {
        ref: '13.10',
        name: 'Obscuring',
        description:
          'Terrain areas containing one or more light or dense terrain features are obscuring terrain areas. If every line of sight drawn between two models crosses one or more obscuring terrain areas (excluding obscuring terrain areas that one or both of those models are within), those two models are not visible to each other.',
      },
      {
        ref: '13.11',
        name: 'Solid',
        description:
          'Dense terrain features have the Solid rule. Line of sight cannot be drawn across any enclosed gap in the surface of such a terrain feature that is 3" or less from ground level.\n\nDesigner\'s Note: This rule ensures that models are not visible while sheltering in ground-level terrain, irrespective of small openings such as doors, windows or bullet holes, or because of small gaps between adjacent terrain features. 3" is the height of the first floor of many terrain features, but some missions may adjust the height at which this rule takes effect.',
      },
    ],
  },

  // ── OBJECTIVES ──────────────────────────────────────────────────────────
  {
    id: 'objectives',
    ref: '14',
    name: 'Objectives',
    group: 'Battlefields and Tactics',
    summary: 'Terrain areas that players compete to control by having models with OC within them.',
    subsections: [
      {
        ref: '14.01',
        name: 'Terrain Objectives',
        description:
          'If a mission uses objectives, it will state where they are located on the battlefield. Typically, your mission will have a deployment map showing several points where objectives should be placed. The location of each point should coincide with a terrain area (13.01); that terrain area is the objective, and is called a terrain objective.\n\nWhen measuring distances to and from an objective, measure to and from the closest part of it.',
      },
      {
        ref: '14.02',
        name: 'Level of Control',
        description:
          'At the start of the battle, no objective on the battlefield is controlled by either player. To gain control of an objective, a player will need one or more models with an OC characteristic of 1 or more within range of it. A model is within range of a terrain objective while it is within that terrain area.\n\nAt the end of each phase and turn, to determine a player\'s level of control over an objective, add together the OC characteristics of all the models in that player\'s army that are within range of that objective:\n• The player who has the highest level of control controls that objective.\n• If both players have the same level of control, unless that objective is secured (14.03), that objective is not controlled by either player.\n\nWhile one or more units from a player\'s army are within range of an objective that player controls, for each of those units that contains one or more models with an OC characteristic of 1 or more, that unit is said to be controlling that objective.',
      },
      {
        ref: '14.03',
        name: 'Secured Objectives',
        description:
          "Some rules allow an objective to be secured by a player's army. When an objective is secured by a player's army, that objective remains under their control — even once they no longer have any units within range of it — until their opponent's level of control over that objective is greater than theirs at the end of a phase.",
      },
    ],
  },

  // ── STRATAGEMS ──────────────────────────────────────────────────────────
  {
    id: 'stratagems',
    ref: '15',
    name: 'Stratagems',
    group: 'Battlefields and Tactics',
    summary: 'Tactical abilities costing CP; each has a timing, target, and effect.',
    subsections: [
      {
        ref: '15.01',
        name: 'Using Stratagems',
        description:
          'During the battle, both players can use stratagems. Each stratagem states: how many CP it costs; WHEN it can be used; TARGET (which units); EFFECT (what happens); RESTRICTIONS (any additional restrictions).\n\nEach player can use the same stratagem multiple times during the battle, but:\n• Each player cannot use the same stratagem more than once in the same phase.\n• Unless otherwise stated, each player cannot target the same unit with more than one stratagem in the same phase.\n\nEach time you use a stratagem:\n1. Select targets as described in that stratagem.\n2. Reduce your CP total by the CP cost.\n   If that stratagem contains a section with an additional CP cost (e.g. +1CP), you can only use that section if you pay the additional cost. If you do not have enough CP, you cannot use that stratagem.\n3. Resolve the effects of that stratagem.',
      },
      {
        ref: '15.02',
        name: 'Command Re-roll',
        description:
          'Core – Battle Tactic Stratagem · 1CP\n\nWHEN: Any phase, just after you make one of the following rolls for a friendly unit or model: Advance roll, Charge roll, Damage roll, Hazard roll, Hit roll, Save roll, Wound roll, or a roll to determine the number of attacks generated with a weapon.\n\nTARGET: That unit or model.\n\nEFFECT: You reroll that roll. If you are rolling more than one dice together, select one of those dice to reroll (excluding charge rolls, which you must re-roll in full).',
      },
      {
        ref: '15.03',
        name: 'Epic Challenge',
        description:
          'Core – Epic Deed Stratagem · 1CP\n\nWHEN: Fight phase, just after a friendly CHARACTER unit is selected to fight.\n\nTARGET: That CHARACTER unit.\n\nEFFECT: Select one CHARACTER model in your unit. Until the end of the phase, that model\'s melee weapons have the [PRECISION] ability.',
      },
      {
        ref: '15.04',
        name: 'Insane Bravery',
        description:
          'Core – Epic Deed Stratagem · 1CP\n\nWHEN: Battle-shock step of your Command phase, just before you make a battle-shock roll for a friendly unit.\n\nTARGET: That unit.\n\nEFFECT: That battle-shock roll is automatically successful.\n\nRESTRICTIONS: You cannot use this stratagem more than once per battle.',
      },
      {
        ref: '15.05',
        name: 'Explosives',
        description:
          'Core – Wargear Stratagem · 1CP\n\nWHEN: Your Shooting phase.\n\nTARGET: One friendly unengaged EXPLOSIVES/GRENADES unit that is eligible to shoot and did not make an advance move this turn.\n\nEFFECT: Resolve the following sequence:\n1. Select one EXPLOSIVES/GRENADES model in your unit.\n2. Select one unengaged enemy unit within 8" of and visible to that model.\n3. Roll six D6: for each 4+, that enemy unit suffers 1 mortal wound (06.02).',
      },
      {
        ref: '15.06',
        name: 'Crushing Impact',
        description:
          'Core – Strategic Ploy Stratagem · 1CP\n\nWHEN: Your Charge phase, just after a friendly MONSTER/VEHICLE unit ends a charge move.\n\nTARGET: That MONSTER/VEHICLE unit.\n\nEFFECT: Resolve the following sequence:\n1. Select one enemy unit engaged with your unit.\n2. Select one model in your unit engaged with that enemy unit.\n3. Roll a number of D6 equal to the T characteristic of that model: for each 1, your unit suffers 1 mortal wound; for each 5+, that enemy unit suffers 1 mortal wound (to a maximum of 6 mortal wounds per unit).',
      },
      {
        ref: '15.07',
        name: 'Rapid Ingress',
        description:
          'Core – Strategic Ploy Stratagem · 1CP\n\nWHEN: End of your opponent\'s Movement phase.\n\nTARGET: One friendly unit that is in strategic reserves (excluding AIRCRAFT).\n\nEFFECT: Your unit makes an ingress move (20.04).\n\nRESTRICTIONS: You cannot use this stratagem during the first battle round.',
      },
      {
        ref: '15.08',
        name: 'Fire Overwatch',
        description:
          'Core – Strategic Ploy Stratagem · 1CP\n\nWHEN: End of your opponent\'s Movement phase.\n\nTARGET: One friendly unengaged unit (excluding TITANIC units).\n\nEFFECT: Your unit shoots using snap shooting (15.09).',
      },
      {
        ref: '15.09',
        name: 'Snap Shooting',
        description:
          'Snap shooting is a shooting type triggered by Fire Overwatch (15.08) and other rules.\n\nELIGIBLE IF: As stated in the rule allowing this shooting type.\n\nEFFECT: Your unit shoots as described in Making Attacks (04).\n\nWHILE SHOOTING:\n• You can only target one visible enemy unit within 24" of your unit (and only if it is an eligible target).\n• Each attack only hits on an unmodified hit roll of 6 (irrespective of the attacking weapon\'s BS characteristic or any modifiers).\n• You cannot reroll hit rolls.\n\nAFTER SHOOTING: Until the end of the phase, your unit is not eligible to start an action.',
      },
      {
        ref: '15.10',
        name: 'Smokescreen',
        description:
          'Core – Wargear Stratagem · 1CP\n\nWHEN: Start of your opponent\'s Shooting phase.\n\nTARGET: One friendly SMOKE unit.\n\nEFFECT: Until the end of the phase, each time an attack targets either your SMOKE unit, or a unit that is not fully visible to the attacking model because of one or more models in your SMOKE unit, the target has the benefit of cover against that attack (13.08).',
      },
      {
        ref: '15.11',
        name: 'Heroic Intervention',
        description:
          'Core – Strategic Ploy Stratagem · 1CP\n\nWHEN: End of your opponent\'s Charge phase.\n\nTARGET: One friendly unengaged unit within 12" of one or more enemy units. You can only select a VEHICLE unit if it is a CHARACTER/WALKER unit.\n\nEFFECT: Resolve a charge with your unit (11.02). While doing so, before making the charge roll, you must select one of the following modes:\n• Leap to Defend: When selecting charge targets, you can only select enemy units that made a charge move this phase and are within the maximum distance.\n• Into the Fray (+1CP): When making the charge roll, if the result is greater than 6 (after modifiers), change it to 6. When selecting charge targets, you can select any enemy units that are within 6" of your unit and within the maximum distance.',
      },
      {
        ref: '15.12',
        name: 'Counter-offensive',
        description:
          'Core – Strategic Ploy Stratagem · 2CP\n\nWHEN: Fight step of your opponent\'s Fight phase, just after an enemy unit has resolved its attacks.\n\nTARGET: One friendly unit that is eligible to fight.\n\nEFFECT: Until the end of the phase, your unit has the Fights First ability and it must be the next unit you select to fight (12.04).',
      },
    ],
  },

  // ── ACTIONS ──────────────────────────────────────────────────────────────
  {
    id: 'actions',
    ref: '16',
    name: 'Actions',
    group: 'Battlefields and Tactics',
    summary: 'Battlefield tasks units can perform to score mission objectives.',
    subsections: [
      {
        ref: '16.01',
        name: 'Performing Actions',
        description:
          'Some rules allow units to perform actions. Each action states:\n• STARTS: When it is started.\n• UNITS: Which friendly units can perform it.\n• USE LIMIT: How many times friendly units can start it.\n• COMPLETES: When it completes.\n• EFFECT: What the effects of completing it are.\n• Any additional restrictions that may apply.\n\nSTARTING AN ACTION\nA unit is eligible to start an action unless one or more of the following apply:\n• It is not on the battlefield.\n• It is an AIRCRAFT/FORTIFICATION unit.\n• It is battle-shocked.\n• It has an OC characteristic of 0 or "–".\n• It is engaged (unless it is a TITANIC unit).\n• It made an advance or fall-back move this turn.\n• It started another action this turn.\n\nIf a unit starts an action, until the end of the turn:\n• It is not eligible to shoot (excluding TITANIC units).\n• It is not eligible to declare a charge.\n\nCOMPLETING AN ACTION\nIf a unit performing an action makes a move (excluding pile-in and consolidation moves) or leaves the battlefield, that unit does not complete that action. Otherwise, when an action is completed, its Effect section is triggered.',
      },
    ],
  },

  // ── MONSTERS AND VEHICLES ────────────────────────────────────────────────
  {
    id: 'monsters-vehicles',
    ref: '17',
    name: 'Monsters and Vehicles',
    group: 'Advanced Rules',
    summary: 'MONSTER/VEHICLE models have special movement, shooting and targeting rules.',
    subsections: [
      {
        ref: '17.01',
        name: 'Moving Monsters and Vehicles',
        description:
          'Each time you make a normal or advance move with a unit, MONSTER/VEHICLE models in that unit can be moved through friendly and enemy models (excluding other MONSTER/VEHICLE models).',
      },
      {
        ref: '17.02',
        name: 'Frame',
        description:
          'Some models do not have a base; many of these are MONSTER/VEHICLE models. Such models have the FRAME keyword, as do some other large models. Whenever a rule refers to a model\'s position in relation to anything else on the battlefield (e.g. when measuring distances), if that model has the FRAME keyword, unless otherwise stated, measure to and from the closest point on that model (so not necessarily from its base, if it has one).\n\nWhen rotating a FRAME model as part of a move, if that model does not have a base, turn it any amount around its central axis, while keeping it upright.',
      },
      {
        ref: '17.03',
        name: 'Shooting at Engaged Monsters and Vehicles',
        description:
          'In your Shooting phase, enemy MONSTER/VEHICLE units that are engaged can be selected as targets of ranged attacks.\n\nEach time a model makes a ranged attack that targets such a unit, subtract 1 from the hit roll (excluding attacks made with [CLOSE-QUARTERS] weapons by models in a unit engaged with the target).',
      },
    ],
  },

  // ── TRANSPORTS ──────────────────────────────────────────────────────────
  {
    id: 'transports',
    ref: '18',
    name: 'Transports',
    group: 'Advanced Rules',
    summary: 'TRANSPORT models carry passengers; units can embark and disembark following specific rules.',
    subsections: [
      {
        ref: '18.01',
        name: 'Transport Capacity',
        description:
          'TRANSPORT models have a transport capacity listed on their datasheet. This determines the type and maximum number of friendly models that are eligible to embark within them. More than one unit can be embarked within the same TRANSPORT model at the same time, provided it has sufficient transport capacity.\n\nBefore the battle, in the Declare Battle Formations step, your units can start embarked within any friendly TRANSPORT model that has sufficient transport capacity remaining for the whole unit.',
      },
      {
        ref: '18.02',
        name: 'Embarking',
        description:
          'Once the first battle round has started, a friendly unit can embark within a friendly TRANSPORT model after making a normal, advance or fall-back move, if all of the following conditions apply:\n• Each model in that unit is within 3" of that TRANSPORT.\n• That unit was not set up on the battlefield this turn.\n• That unit is eligible to embark within that TRANSPORT, as described on that TRANSPORT\'s datasheet.\n• That TRANSPORT has sufficient remaining transport capacity for each model in that unit.\n\nWhen a unit embarks, the active player removes that unit from the battlefield — it is now embarked within that TRANSPORT and is not on the battlefield.',
      },
      {
        ref: '18.03',
        name: 'Disembarking',
        description:
          'In the active player\'s Movement phase, each friendly unit embarked within a TRANSPORT model can disembark from it by making a disembark move (18.04).\n\nIf a TRANSPORT model is destroyed, before removing it from the battlefield, the active player must make an emergency disembark move (18.05) with each unit embarked within it.',
      },
      {
        ref: '18.04',
        name: 'Disembark Move',
        description:
          'SET-UP DISTANCE:\n• Rapid/Tactical Disembark: 3"\n• Combat Disembark: 6"\n\nELIGIBLE IF: All of the following apply:\n• Embarked within a TRANSPORT model that is on the battlefield.\n• Did not embark within that TRANSPORT this phase.\n• That TRANSPORT has not made an advance or fall-back move this phase.\n\nEFFECT: Your unit is set up as described in Set Up (03.02).\n\nBEFORE MOVING: Select disembark mode:\n• Rapid Disembark: If that TRANSPORT made a normal or ingress move this phase, you must select this mode.\n• Tactical Disembark: Otherwise, if that TRANSPORT remained stationary or has not yet been selected to move this phase, and if you can set up your unit as described below, you must select this mode.\n• Combat Disembark: Otherwise, you must select this mode. Make a hazard roll for each model in your unit.\n\nWHILE MOVING: Set up each model in your unit wholly within the set-up distance of that TRANSPORT.\n• Rapid Disembark: If that TRANSPORT made an ingress move this turn, each model must follow the same rules that TRANSPORT had to follow while resolving that move.\n• Combat Disembark: Each model can be set up engaged with one or more enemy units that TRANSPORT is engaged with.\n\nAFTER MOVING:\n• Rapid Disembark: Until the end of the turn, your unit is not eligible to declare a charge.\n• Tactical Disembark: Select your unit to make a normal or advance move.\n• Combat Disembark: Your unit is battle-shocked and, until the end of the turn, it is not eligible to declare a charge.',
      },
      {
        ref: '18.05',
        name: 'Emergency Disembark Move',
        description:
          'SET-UP DISTANCE: 6"\n\nELIGIBLE IF: Your unit is embarked within a TRANSPORT model that was just destroyed.\n\nEFFECT: Your unit is set up as described in Set Up (03.02).\n\nBEFORE MOVING: Make a hazard roll for each model in your unit (06.03).\n\nWHILE MOVING: Set up each model in your unit wholly within the set-up distance of that TRANSPORT, and as close as possible to that TRANSPORT. Each model that cannot be set up in this way is destroyed.\n\nAFTER MOVING: Your unit is battle-shocked and, until the end of the turn, it is not eligible to declare a charge.',
      },
    ],
  },

  // ── ATTACHED UNITS ──────────────────────────────────────────────────────
  {
    id: 'attached-units',
    ref: '19',
    name: 'Attached Units',
    group: 'Advanced Rules',
    summary: 'Leader/Support units lead Bodyguard units; the attached unit acts as a single entity.',
    subsections: [
      {
        ref: '19.01',
        name: 'Forming Attached Units',
        description:
          'Some units have the Leader or Support ability listed on their datasheet. Such units are known as leader units and support units respectively. Both of these abilities allow such units to lead other friendly units (known as bodyguard units) to form attached units. An attached unit is a single unit for all rules purposes. Leader and support units can only lead specific bodyguard units, as listed in the Warhammer 40,000 app.\n\nBefore the battle, in the Muster Armies step, for each leader and support unit in your army, you can select one friendly bodyguard unit that unit can lead. That unit will then lead that bodyguard unit for the battle and form an attached unit with it.\n\nUnless otherwise stated, each bodyguard unit can only have one leader unit and one support unit attached to it.',
      },
      {
        ref: '19.02',
        name: 'Attacking Attached Units',
        description:
          'Each time an attack targets an attached unit, if that unit contains one or more bodyguard models, use the highest T characteristic of the bodyguard models in that unit while resolving that attack, even if a leader/support unit in that attached unit has a different T characteristic. If that unit only contains leader/support models, use the highest T characteristic of those models while resolving that attack instead.\n\nRules that are triggered when a unit is destroyed are only triggered when the last model that started the battle in an attached unit is destroyed.',
      },
      {
        ref: '19.03',
        name: 'Keywords in Attached Units',
        description:
          'An attached unit has all of the keywords of all of its component units. As such, an attached unit is affected by any rule that applies to units with any of those keywords. Note that models in an attached unit do not gain the keywords of other models in that unit that they do not already have. Remember that attacks target units, not models.',
      },
      {
        ref: '19.04',
        name: 'Abilities in Attached Units',
        description:
          'Abilities/rules that affect a single specified model (e.g. from an enhancement or an item of wargear) only ever apply to that model, even while part of an attached unit.\n\nOtherwise, abilities/rules that affect a unit (or models in it) apply to every model in an attached unit, until the source of that ability/rule is destroyed:\n• Leader/support unit ability: applies until the last model in that leader/support unit is destroyed.\n• Bodyguard unit ability: applies until the last model in that bodyguard unit is destroyed.\n• A specific model (bearer of an enhancement or wargear): applies until that model is destroyed.\n\nNote: leader/support units continue to benefit from their own "while this model is leading a unit" abilities even after their bodyguard unit is destroyed, provided they started the battle in an attached unit.',
      },
    ],
  },

  // ── STRATEGIC RESERVES ──────────────────────────────────────────────────
  {
    id: 'strategic-reserves',
    ref: '20',
    name: 'Strategic Reserves',
    group: 'Advanced Rules',
    summary: 'Hold units off the board and bring them on via Ingress moves from Round 2 onwards.',
    subsections: [
      {
        ref: '20.01',
        name: 'Placing Units in Strategic Reserves',
        description:
          'Before the battle, in the Declare Battle Formations step, you can select one or more friendly units (excluding FORTIFICATIONS) to place in strategic reserves. Instead of setting up these units on the battlefield during deployment, place them to one side; they are strategic reserves units, and will arrive later in the battle.\n\nUnless otherwise stated, the combined points value of all of your strategic reserves units (including those embarked within TRANSPORTS that are themselves placed in strategic reserves) cannot exceed 50% of your points limit for your battle size.',
      },
      {
        ref: '20.02',
        name: 'Repositioned Units',
        description:
          'Some rules allow units to be removed from the battlefield and placed in strategic reserves during the battle. Units that use such rules are known as repositioned units. In addition to any other rules that apply to such units, all of the following rules apply to them:\n• If used in the Movement phase, such rules can be used on units that have already moved that phase.\n• A repositioned unit that is set up in the same turn in which it made an advance, fall-back or disembark move has still made such a move that turn.\n• When they are removed from the battlefield, any rules that are affecting such units for a specified duration continue to affect them while that duration applies.',
      },
      {
        ref: '20.03',
        name: 'Arriving from Strategic Reserves',
        description:
          'To arrive on the battlefield, each strategic reserves unit must make an ingress move (20.04). Unless otherwise stated, they can only do so from the second battle round onwards.\n\nAt the end of the third battle round, unless otherwise stated, all strategic reserves units that have not made one or more ingress moves are destroyed, with the following exceptions:\n• Units embarked within TRANSPORTS that have made an ingress move during the battle.\n• Repositioned units (20.02).',
      },
      {
        ref: '20.04',
        name: 'Ingress Move',
        description:
          'SET-UP DISTANCE: 6"\n\nELIGIBLE IF: Your unit is in strategic reserves (excluding units that are embarked within TRANSPORTS that are themselves in strategic reserves).\n\nEFFECT: Your unit is set up as described in Set Up (03.02).\n\nWHILE MOVING: Set up your unit wholly within the set-up distance of one or more battlefield edges and more than 8" horizontally from all enemy units.\n• Before the Third Battle Round: While doing so, no models can be set up within your opponent\'s deployment zone.\n\nAFTER MOVING: Unless otherwise stated, until the start of the next Charge phase, your unit is not eligible to make any other type of move.',
      },
    ],
  },

  // ── FLYING AND SURGING ──────────────────────────────────────────────────
  {
    id: 'flying-surging',
    ref: '21',
    name: 'Flying and Surging',
    group: 'Advanced Rules',
    summary: 'FLY units can take to the skies; some units can make Surge Moves towards a target.',
    subsections: [
      {
        ref: '21.01',
        name: 'Surge Moves',
        description:
          'Some rules allow a unit to make a surge move, as described in 21.02.',
      },
      {
        ref: '21.02',
        name: 'Surge Move',
        description:
          'MAXIMUM DISTANCE: As stated in the rule allowing this move type.\nELIGIBLE IF: All of the following apply:\n• The rule allowing this move type has been triggered.\n• Your unit is not battle-shocked.\n• Your unit is unengaged.\n• Your unit has not moved this phase.\nEFFECT: Your unit moves as described in Moving (03).\nBEFORE MOVING: Select the closest enemy unit to be the surge target.\nWHILE MOVING:\n• Each model must end its move engaged with the surge target if possible.\n• Each model that cannot end its move engaged with the surge target must end its move as close as possible to the surge target.\nAFTER MOVING:\n• Your unit cannot be engaged with one or more enemy units that were not the surge target.\n• Your unit cannot move again this phase.',
      },
      {
        ref: '21.03',
        name: 'Flying Models',
        description:
          'Models with the FLY keyword, and units such models are part of, are said to be able to FLY.\n\nEach time a FLYING unit is selected to make a normal, advance, fall-back or charge move, before moving any models in that unit, the active player can declare that it will take to the skies. If it does, while resolving that move:\n• Subtract 2" from the maximum distance.\n• Each time a FLYING model moves: ignore all vertical distance for the purposes of how far it has moved; it can move through all types of model (including enemy models and MONSTER/VEHICLE models); it can move horizontally and vertically through all categories of terrain feature.',
      },
    ],
  },

  // ── OTHER RULES AND ABILITIES ────────────────────────────────────────────
  {
    id: 'other-rules',
    ref: '22',
    name: 'Other Rules and Abilities',
    group: 'Advanced Rules',
    summary: 'Aura abilities, Faction abilities, Psychic abilities, Wargear abilities, and Plunging Fire.',
    subsections: [
      {
        ref: '22.01',
        name: 'Aura Abilities',
        description:
          'Abilities that affect models or units within a stated range are aura abilities, and are tagged with the word "Aura".\n\nWhile a model with an aura ability is on the battlefield, it is always within range of its own aura ability.\n\nA unit can be affected by more than one aura ability at a time, but if a unit is within range of the same aura ability more than once, that aura ability only applies to that unit once.',
      },
      {
        ref: '22.02',
        name: 'Faction Abilities',
        description:
          'Some abilities are common to each unit that belongs to a particular faction — these are faction abilities (also known as army rules), and are listed in the Faction Abilities section of a datasheet.\n\nUnless otherwise stated, a unit\'s faction abilities only apply if the army faction you selected while mustering your army matches a faction keyword listed on that unit\'s datasheet.',
      },
      {
        ref: '22.03',
        name: 'Psychic Abilities',
        description:
          'Abilities tagged with the word "Psychic" are psychic abilities. If a psychic ability causes a model to lose one or more wounds, each of those wounds is said to be inflicted by a psychic attack (this can be important for the triggering of other rules).',
      },
      {
        ref: '22.04',
        name: 'Wargear Abilities',
        description:
          'Abilities that are gained when a unit (or one of its models) has a particular item of wargear are wargear abilities, and are listed in the Wargear Abilities section of a datasheet.\n\nIf a unit has an item of wargear that has a wargear ability, that ability applies to that unit. If a model within a unit has an item of wargear that has a wargear ability, that model is the "bearer" of that item of wargear and that ability applies until that model is destroyed.',
      },
      {
        ref: '22.05',
        name: 'Plunging Fire',
        description:
          'Each time a model makes a ranged attack that targets a visible unit containing one or more models on ground level, if one or more of the following conditions apply, improve the BS characteristic of that attack by 1:\n• The attacking model is on a section of a terrain feature that is 3" or more in height.\n• The attacking model has the TOWERING keyword and the target unit is within 12".',
      },
    ],
  },

  // ── AIRCRAFT ──────────────────────────────────────────────────────────────
  {
    id: 'aircraft',
    ref: '23',
    name: 'Aircraft',
    group: 'Advanced Rules',
    summary: 'AIRCRAFT deploy in Strategic Reserves and follow special movement and combat rules.',
    subsections: [
      {
        ref: '23.01',
        name: 'Deployment',
        description:
          'In the Declare Battle Formations step, all AIRCRAFT units must be placed in strategic reserves (20.01).',
      },
      {
        ref: '23.02',
        name: 'Movement',
        description:
          '• AIRCRAFT units are only eligible to make an ingress move (20.04); they are not eligible to make any other type of move.\n• At the end of your opponent\'s turn, all AIRCRAFT units in your army that are on the battlefield must be placed in strategic reserves.\n• Each time a unit makes any type of move, its models can be moved through AIRCRAFT models.\n• Each time a unit makes a pile-in, consolidation or surge move, unless that unit can FLY, while making that move, ignore AIRCRAFT units for the purposes of selecting enemy units and determining the closest enemy unit.\n• Being engaged solely with one or more AIRCRAFT units does not prevent a unit from being eligible to make a normal or advance move.',
      },
      {
        ref: '23.03',
        name: 'Shooting',
        description:
          'The Plunging Fire rule (22.05) has no effect on attacks made by, or targeting, AIRCRAFT units.',
      },
      {
        ref: '23.04',
        name: 'Charging and Fighting',
        description:
          '• AIRCRAFT units are not eligible to declare a charge, and can only make melee attacks that target FLYING units.\n• Only FLYING units can select AIRCRAFT units as a charge target, and only FLYING models can make melee attacks that target AIRCRAFT units.',
      },
    ],
  },
];

export const PHASE_GROUPS = ['The Battle Round', 'Battlefields and Tactics', 'Advanced Rules'] as const;
export type PhaseGroup = (typeof PHASE_GROUPS)[number];
