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
    summary: 'How a battle round is structured: both players take turns, then the round ends.',
    subsections: [
      {
        ref: '07.01',
        name: 'Start of Battle Round',
        description:
          'Some rules specify effects that happen at the start of a battle round. Resolve these effects in the order specified by the mission rules, then move to the Command phase of the first player.',
      },
      {
        ref: '07.02',
        name: 'Player Turns',
        description:
          "Each battle round consists of two player turns — one for each player. During a player's turn, the active player completes each of the four phases (Command, Movement, Shooting, and Fight) in order before the opposing player takes their turn.",
      },
      {
        ref: '07.03',
        name: 'End of Battle Round',
        description:
          'Some rules specify effects that happen at the end of a battle round. Resolve these effects in the order specified by the mission rules. After the last battle round, the game ends.',
      },
    ],
  },

  // ── COMMAND PHASE ──────────────────────────────────────────────────────────
  {
    id: 'command',
    ref: '08',
    name: 'Command Phase',
    group: 'The Battle Round',
    summary: 'Gain CP, resolve battle-shock, and use command abilities.',
    subsections: [
      {
        ref: '08.01',
        name: 'Start of Command Phase',
        description:
          'Some rules specify effects that happen at the start of the Command phase. Resolve these before moving on.',
      },
      {
        ref: '08.02',
        name: 'Gain Core CP',
        description:
          'Both players gain 1 Command Point (CP). This CP is added immediately and can be spent later in the turn.',
      },
      {
        ref: '08.03',
        name: 'Battle-shock',
        description:
          'The active player must make a Battle-shock roll for each of their units that is Below Half-strength. Roll 2D6. If the result equals or exceeds the highest Ld in the unit, the roll succeeds and the unit is not Battle-shocked. If the roll fails, the unit becomes Battle-shocked until the start of the active player\'s next Command phase. While Battle-shocked: the OC of all its models is modified to \'–\'; its controlling player cannot use stratagems to affect it; and it cannot start or complete actions.',
      },
      {
        ref: '08.04',
        name: 'Command Abilities',
        description:
          'The active player can use any number of command abilities that specify \'your Command phase\' as their timing. Each ability will have a cost in CP and other conditions. Abilities are resolved one at a time.',
      },
      {
        ref: '08.05',
        name: 'End of Command Phase',
        description:
          'Some rules specify effects that happen at the end of the Command phase. Resolve these effects before moving to the Movement phase.',
      },
    ],
  },

  // ── MOVEMENT PHASE ──────────────────────────────────────────────────────────
  {
    id: 'movement',
    ref: '09',
    name: 'Movement Phase',
    group: 'The Battle Round',
    summary: 'Move your units: Remain Stationary, Normal Move, Advance, or Fall Back.',
    subsections: [
      {
        ref: '09.01',
        name: 'Start of Movement Phase',
        description:
          'Some rules specify effects that happen at the start of the Movement phase. Resolve these before selecting units to move.',
      },
      {
        ref: '09.02',
        name: 'Move Units',
        description:
          'The active player selects units one at a time and moves each. Each unit must Remain Stationary, make a Normal Move, Advance, or Fall Back. A unit cannot be selected to move more than once per phase.',
      },
      {
        ref: '09.03',
        name: 'End of Movement Phase',
        description:
          'Some rules specify effects that happen at the end of the Movement phase. Resolve these before moving to the Shooting phase.',
      },
      {
        ref: '09.04',
        name: 'Remain Stationary',
        description:
          'The unit does not move. Units that Remain Stationary are still considered to have made a move this turn for the purposes of rules that refer to a unit making a move.',
      },
      {
        ref: '09.05',
        name: 'Normal Move',
        description:
          'Each model in the unit can move up to a distance in inches equal to its Move (M) characteristic. Models cannot move within Engagement Range of any enemy models. If a model cannot end its move maintaining Unit Coherency, it cannot move at all.',
      },
      {
        ref: '09.06',
        name: 'Advance Move',
        description:
          'Roll 1D6 before moving any models; add the result to the M characteristic of each model in the unit for this move. A unit that Advances cannot shoot (unless it has [ASSAULT] weapons), declare a Charge, or start an Action in the same turn.',
      },
      {
        ref: '09.07',
        name: 'Fall-back Move',
        description:
          'A unit that is Engaged with an enemy unit can Fall Back. Models can move through Engagement Range of enemy models but cannot end within Engagement Range. The unit can move using Ordered Retreat (for non-Battle-shocked units) or Desperate Escape (for Battle-shocked units or voluntarily). A unit that Falls Back cannot shoot (unless it has [ASSAULT] weapons), declare a Charge, or start an Action in the same turn.',
      },
    ],
  },

  // ── SHOOTING PHASE ──────────────────────────────────────────────────────────
  {
    id: 'shooting',
    ref: '10',
    name: 'Shooting Phase',
    group: 'The Battle Round',
    summary: 'Shoot with your units using Normal, Assault, Close-quarters or Indirect attacks.',
    subsections: [
      {
        ref: '10.01',
        name: 'Start of Shooting Phase',
        description:
          'Some rules specify effects that happen at the start of the Shooting phase. Resolve these before selecting units to shoot with.',
      },
      {
        ref: '10.02',
        name: 'Shoot',
        description:
          "The active player selects eligible units one at a time to shoot with. A unit is eligible to shoot if it: is on the battlefield; has not Fallen Back this turn; is not Battle-shocked; has not started an Action (unless TITANIC); and has at least one ranged weapon. A unit can only be selected to shoot once per phase.",
      },
      {
        ref: '10.03',
        name: 'End of Shooting Phase',
        description:
          'Some rules specify effects that happen at the end of the Shooting phase. Resolve these before moving to the Charge phase.',
      },
      {
        ref: '10.04',
        name: 'Normal Shooting',
        description:
          'The standard type of ranged attack. The attacker must have line of sight to the target unit. The target unit must be within the weapon\'s range. Cannot target units within Engagement Range of friendly units (unless [CLOSE-QUARTERS]).',
      },
      {
        ref: '10.05',
        name: 'Assault Shooting',
        description:
          '[ASSAULT] weapon attacks made by a unit that Advance or Fall Back. These attacks still count as normal shooting but the unit may fire even after Advancing or Falling Back, though still subject to all other shooting restrictions.',
      },
      {
        ref: '10.06',
        name: 'Close-quarters Shooting',
        description:
          'Attacks made with [CLOSE-QUARTERS] weapons. A unit can make close-quarters shooting attacks even while Engaged with enemy units. The attacks still need line of sight but can target enemy units within the attacker\'s Engagement Range.',
      },
      {
        ref: '10.07',
        name: 'Indirect Shooting',
        description:
          '[INDIRECT FIRE] weapon attacks. The target does not need to be visible to the attacking model. Models using indirect fire subtract 1 from the Hit roll. If the target is not visible to any model in the attacking unit, models also subtract 1 from the Wound roll.',
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
          'Some rules specify effects that happen at the start of the Charge phase. Resolve these before declaring charges.',
      },
      {
        ref: '11.02',
        name: 'Charge',
        description:
          'The active player can select eligible units one at a time to declare charges. A unit is eligible to charge if it is on the battlefield, is not Battle-shocked, did not Advance or Fall Back this turn, and has not started or completed an Action. A unit cannot declare a Charge against a unit it is already Engaged with.',
      },
      {
        ref: '11.03',
        name: 'End of Charge Phase',
        description:
          'Some rules specify effects that happen at the end of the Charge phase. Resolve these before moving to the Fight phase.',
      },
      {
        ref: '11.04',
        name: 'Charge Move',
        description:
          'When a unit declares a Charge, select one or more target units that are within 12" of the charging unit and visible to it. Roll 2D6 — the result is the maximum distance each model can move. At least one model must end its move within Engagement Range of an enemy target unit. If the roll is insufficient to do so, the Charge fails and no models move. A charging unit cannot end its move within Engagement Range of units that were not declared as targets.',
      },
    ],
  },

  // ── FIGHT PHASE ──────────────────────────────────────────────────────────
  {
    id: 'fight',
    ref: '12',
    name: 'Fight Phase',
    group: 'The Battle Round',
    summary: 'Pile in, fight with engaged units, and consolidate — both players alternate.',
    subsections: [
      {
        ref: '12.01',
        name: 'Start of Fight Phase',
        description:
          'Some rules specify effects that happen at the start of the Fight phase. Resolve these before selecting units to fight with.',
      },
      {
        ref: '12.02',
        name: 'Pile-in',
        description:
          'Before a unit fights, models in that unit can make a Pile-in move. Each model moves up to 3" and must end closer to the closest enemy model than it started, or must end within Engagement Range of an enemy model.',
      },
      {
        ref: '12.03',
        name: 'Pile-in Move',
        description:
          "Each model making a Pile-in move can move up to 3\". Each model must end its move closer to the nearest visible enemy model than it was at the start of the move. If a model is already as close as possible to the nearest enemy (or cannot move closer), it can still move up to 3\" to maintain Unit Coherency.",
      },
      {
        ref: '12.04',
        name: 'Fight',
        description:
          "Units fight in the following order: first, units that made a Charge move this turn fight; then, the active player and the opposing player alternate selecting units to fight with — starting with the active player. A unit cannot be selected to fight more than once per phase.",
      },
      {
        ref: '12.05',
        name: 'Normal Fight',
        description:
          'The standard way of fighting. The fighting unit can attack with any melee weapons its models are equipped with. Attacks are resolved against enemy units within Engagement Range using the standard attack sequence (hit, wound, save, damage).',
      },
      {
        ref: '12.06',
        name: 'Overrun Fight',
        description:
          'If a unit that fought destroyed all enemy units it was Engaged with, it can make an Overrun fight — a second fight against the same (or different) enemy units now in Engagement Range. Overrun fights occur after all normal fights are resolved.',
      },
      {
        ref: '12.07',
        name: 'Consolidate',
        description:
          'After a unit has fought, models can make a Consolidation move. Each model can move up to 3" and must end closer to the closest enemy model, or already be in Engagement Range of an enemy model.',
      },
      {
        ref: '12.08',
        name: 'Consolidation Move',
        description:
          "Each model making a Consolidation move can move up to 3\". Each model must end closer to the nearest visible enemy model than it was at the start of the move. If a model is already as close as possible (or cannot move closer), it can still move up to 3\" to maintain Unit Coherency.",
      },
      {
        ref: '12.09',
        name: 'End of Fight Phase',
        description:
          'Some rules specify effects that happen at the end of the Fight phase. Resolve these effects, then the active player\'s turn ends and the opposing player begins their turn.',
      },
    ],
  },

  // ── TERRAIN ──────────────────────────────────────────────────────────────
  {
    id: 'terrain',
    ref: '13',
    name: 'Terrain',
    group: 'Battlefields and Tactics',
    summary: 'Rules for terrain categories, movement through terrain, and terrain cover.',
    subsections: [
      {
        ref: '13.01',
        name: 'Placing Terrain',
        description:
          'Before the battle, terrain features are placed on the battlefield according to the mission rules or by mutual agreement. Each terrain feature is given one or more terrain categories that define how models interact with it.',
      },
      {
        ref: '13.02',
        name: 'Terrain Categories',
        description:
          'Every terrain feature belongs to one or more of the following categories: Exposed, Light, and Dense. Each category has specific rules for movement, visibility, and cover.',
      },
      {
        ref: '13.03',
        name: 'Exposed',
        description:
          'Exposed terrain features provide little protection. Models can move through them freely and they do not block line of sight. Examples: craters, razorwire, scattered debris.',
      },
      {
        ref: '13.04',
        name: 'Light',
        description:
          'Light terrain features can obstruct the path of large models and provide cover. INFANTRY, BEASTS, and SWARM models can move through light terrain freely. Other models must go around. Light terrain may grant the Benefit of Cover to units within it.',
      },
      {
        ref: '13.05',
        name: 'Dense',
        description:
          'Dense terrain features are significant obstacles. Only INFANTRY, BEASTS, and SWARM models can move through dense terrain. All other models must go around. Dense terrain blocks line of sight and can have additional rules: Hidden, Obscuring, and/or Solid.',
      },
      {
        ref: '13.06',
        name: 'Terrain and Movement',
        description:
          'Models moving through terrain features spend additional movement. INFANTRY, BEASTS, and SWARM models can move through light and dense terrain areas, but only INFANTRY, BEASTS, and SWARM can move through dense terrain. Other models treat dense terrain as impassable and must go around. Models can climb up and down terrain features — vertical distance counts toward their movement.',
      },
      {
        ref: '13.07',
        name: 'Terrain and Visibility',
        description:
          "Light terrain features do not block line of sight on their own. Dense terrain features block line of sight: if a line drawn between two models passes through a dense terrain area, the model on one side cannot see the model on the other side. Models within dense terrain can see out and be seen from within range (see Hidden, 13.09).",
      },
      {
        ref: '13.08',
        name: 'Benefit of Cover',
        description:
          'A unit has the Benefit of Cover against a ranged attack if all models are INFANTRY, BEASTS, or SWARM wholly within a terrain feature\'s area; or if the unit is not fully visible to the attacking model due to terrain. The Benefit of Cover worsens the attacker\'s BS by 1. Cannot be gained against [IGNORES COVER] weapons.',
      },
      {
        ref: '13.09',
        name: 'Hidden',
        description:
          "A unit is Hidden if all its models are INFANTRY, BEASTS, or SWARM models wholly within a dense terrain feature's area AND the unit did not shoot in this turn or the previous turn. Hidden models are only visible to enemy models within 15\" (the detection range).",
      },
      {
        ref: '13.10',
        name: 'Obscuring',
        description:
          'Some dense terrain features have the Obscuring rule. Every line of sight drawn between two models on opposite sides of an Obscuring area is blocked, even if neither model is within the terrain feature.',
      },
      {
        ref: '13.11',
        name: 'Solid',
        description:
          'Some dense terrain features have the Solid rule. Lines of sight cannot be drawn through enclosed gaps that are 3" or less above ground level in a Solid terrain feature. This represents the solid walls of buildings and similar structures.',
      },
    ],
  },

  // ── OBJECTIVES ──────────────────────────────────────────────────────────
  {
    id: 'objectives',
    ref: '14',
    name: 'Objectives',
    group: 'Battlefields and Tactics',
    summary: 'Rules for placing, contesting, and controlling objective markers.',
    subsections: [
      {
        ref: '14.01',
        name: 'Terrain Objectives',
        description:
          'Many missions use objective markers placed on the battlefield. Each objective marker is a location that players compete to control. Objectives are typically 40mm round markers. A model is within range of an objective marker if any part of its base is within 3" of the marker (or within 3" of the closest point of its hull, for models without a base).',
      },
      {
        ref: '14.02',
        name: 'Level of Control',
        description:
          "A player's level of control over an objective marker equals the sum of the OC characteristics of their models within range of that marker. At the end of each phase and each player's turn, compare the two players' levels of control. The player with the higher level controls the objective. If the levels are equal (including both being zero), neither player controls it, unless one player has Secured the objective.",
      },
      {
        ref: '14.03',
        name: 'Secured Objectives',
        description:
          "Some rules allow players to Secure an objective. When an objective is Secured, it remains under that player's control even if they have no models within range, until the opposing player achieves a higher level of control over it. An objective can only be Secured by one player at a time.",
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
          'To use a Stratagem, pay its CP cost and meet all conditions. Each Stratagem specifies: WHEN (the timing window), TARGET (which units), EFFECT (what happens), and any RESTRICTIONS. You cannot use the same Stratagem more than once per phase, or target the same unit with more than one Stratagem per phase.',
      },
      {
        ref: '15.02',
        name: 'Command Re-roll',
        description:
          '1CP. WHEN: In any phase, just after making a dice roll. EFFECT: Re-roll that test. RESTRICTIONS: Cannot be used to re-roll a roll that was already re-rolled.',
      },
      {
        ref: '15.03',
        name: 'Epic Challenge',
        description:
          '1CP. WHEN: Fight phase, when one of your CHARACTER units is selected to fight. EFFECT: Select one enemy CHARACTER unit that your unit is Engaged with. Until the end of the phase, each time a model in your unit makes an attack that targets that CHARACTER unit, add 1 to the Hit roll and 1 to the Wound roll.',
      },
      {
        ref: '15.04',
        name: 'Insane Bravery',
        description:
          '2CP. WHEN: Your Command phase, just before making a Battle-shock roll for a unit. EFFECT: That unit automatically passes the Battle-shock test.',
      },
      {
        ref: '15.05',
        name: 'Explosives',
        description:
          '1CP. WHEN: Any phase, just after an enemy unit ends a move within 9" of one of your units. EFFECT: Roll 1D6: on a 4+, the enemy unit suffers 1 mortal wound.',
      },
      {
        ref: '15.06',
        name: 'Crushing Impact',
        description:
          '1CP. WHEN: Fight phase, when one of your MONSTER or VEHICLE units is selected to fight. EFFECT: Until the end of the phase, each time that unit makes an attack, improve the AP by 1.',
      },
      {
        ref: '15.07',
        name: 'Rapid Ingress',
        description:
          "1CP. WHEN: Your opponent's Movement phase, just after they end a move with a unit. EFFECT: One of your units currently in Strategic Reserves can make an Ingress move.",
      },
      {
        ref: '15.08',
        name: 'Fire Overwatch',
        description:
          "1CP. WHEN: Your opponent's Movement or Charge phase, just after an enemy unit is set up or ends a move within 24\" of one of your eligible units. EFFECT: Your unit can shoot that enemy unit as if it were your Shooting phase. Models can only shoot weapons with a range of 24\" or less.",
      },
      {
        ref: '15.09',
        name: 'Snap Shooting',
        description:
          '2CP. WHEN: Your Shooting phase, when you select one of your units to shoot. EFFECT: That unit can shoot even if it Advanced this turn (still cannot use [HEAVY] weapons without penalty).',
      },
      {
        ref: '15.10',
        name: 'Smokescreen',
        description:
          "1CP. WHEN: Your opponent's Shooting phase, just before an enemy unit shoots. EFFECT: Select one of your SMOKE units within 18\" of the enemy unit. Until the end of the phase, that unit has the Benefit of Cover against all attacks.",
      },
      {
        ref: '15.11',
        name: 'Heroic Intervention',
        description:
          "2CP. WHEN: Your opponent's Charge phase, just after an enemy unit ends a Charge move. EFFECT: One of your units can make a Heroic Intervention: move each model up to 3\". Each model must end closer to the nearest enemy model.",
      },
      {
        ref: '15.12',
        name: 'Counteroffensive',
        description:
          '2CP. WHEN: Fight phase, just after an enemy unit has fought. EFFECT: Select one of your units within Engagement Range of that enemy unit. That unit can fight next.',
      },
    ],
  },

  // ── ACTIONS ──────────────────────────────────────────────────────────────
  {
    id: 'actions',
    ref: '16',
    name: 'Actions',
    group: 'Battlefields and Tactics',
    summary: 'Battlefield tasks that units can perform to score mission objectives.',
    subsections: [
      {
        ref: '16.01',
        name: 'Performing Actions',
        description:
          'Actions are battlefield tasks listed in missions and other rules. Each Action states: WHEN it starts; which UNITS can start it; USE LIMIT per phase; when it COMPLETES; and its EFFECT. A unit is not eligible to start an Action if it is not on the battlefield, is AIRCRAFT/FORTIFICATION, is Battle-shocked, has OC 0 or \'–\', is Engaged (unless TITANIC), made an Advance or Fall-back move this turn, or has already started another Action this turn. A unit performing an Action cannot shoot (unless TITANIC) or declare Charges.',
      },
    ],
  },

  // ── MONSTERS AND VEHICLES ────────────────────────────────────────────────
  {
    id: 'monsters-vehicles',
    ref: '17',
    name: 'Monsters and Vehicles',
    group: 'Advanced Rules',
    summary: 'Special rules for large MONSTER and VEHICLE models on the battlefield.',
    subsections: [
      {
        ref: '17.01',
        name: 'Moving Monsters and Vehicles',
        description:
          'During Normal and Advance moves, MONSTER and VEHICLE models can be moved through the spaces of friendly and enemy models, but cannot be moved through other MONSTER or VEHICLE models. They are still subject to all other movement rules regarding ending positions and Unit Coherency.',
      },
      {
        ref: '17.02',
        name: 'Frame',
        description:
          'Models with the FRAME keyword do not have a standard base. Whenever a rule refers to a FRAME model\'s position or requires measuring distances, measure to and from the closest point on the model itself (not a base). When rotating during a move, a FRAME model turns around its central axis while remaining upright.',
      },
      {
        ref: '17.03',
        name: 'Shooting at Engaged Monsters/Vehicles',
        description:
          'Enemy MONSTER or VEHICLE units that are Engaged with friendly units can still be selected as targets of your ranged attacks. Subtract 1 from the Hit roll for each attack made against an Engaged MONSTER or VEHICLE, except for [CLOSE-QUARTERS] weapon attacks made by models that are themselves Engaged with the target.',
      },
    ],
  },

  // ── TRANSPORTS ──────────────────────────────────────────────────────────
  {
    id: 'transports',
    ref: '18',
    name: 'Transports',
    group: 'Advanced Rules',
    summary: 'Rules for embarking, disembarking, and emergency disembark from TRANSPORT models.',
    subsections: [
      {
        ref: '18.01',
        name: 'Transport Capacity',
        description:
          "TRANSPORT models have a transport capacity listed on their datasheet, specifying the types and maximum number of friendly models that can embark. Units can start the battle already embarked — declare this during the Muster Armies step. More than one unit can embark simultaneously if sufficient capacity remains.",
      },
      {
        ref: '18.02',
        name: 'Embarking',
        description:
          "Once the first battle round has started, a friendly unit can embark within a friendly TRANSPORT after making a Normal, Advance, or Fall-back move if: all models end their move within 3\" of the TRANSPORT; the unit was not set up this turn; the unit is eligible per the TRANSPORT's datasheet; and the TRANSPORT has sufficient capacity. Remove the embarked unit from the battlefield.",
      },
      {
        ref: '18.03',
        name: 'Disembarking',
        description:
          'In the active player\'s Movement phase, each unit embarked in a TRANSPORT can disembark using one of three modes: Rapid Disembark (after a Normal or Ingress move; unit cannot Charge until end of turn); Tactical Disembark (TRANSPORT Remains Stationary; unit can then make a Normal or Advance move); Combat Disembark (any other case; hazard roll per model; unit is Battle-shocked; cannot Charge).',
      },
      {
        ref: '18.04',
        name: 'Disembark Move',
        description:
          "When a unit disembarks, set up all its models within 3\" of the TRANSPORT and not within Engagement Range of any enemy units. If a model cannot be set up in this manner, it is not set up and is destroyed after all other models in the unit have been set up.",
      },
      {
        ref: '18.05',
        name: 'Emergency Disembark Move',
        description:
          "When a TRANSPORT is destroyed, all embarked units immediately make Emergency Disembark moves. Set up all models within 6\" of the TRANSPORT's final position, not within Engagement Range of any enemy. Make a Hazard roll for each model. Each unit is Battle-shocked and cannot Charge until the end of the turn. Models that cannot be set up are destroyed.",
      },
    ],
  },

  // ── ATTACHED UNITS ──────────────────────────────────────────────────────
  {
    id: 'attached-units',
    ref: '19',
    name: 'Attached Units',
    group: 'Advanced Rules',
    summary: 'Leaders and Supports join Bodyguard units; CHARACTER models are protected while Bodyguards remain.',
    subsections: [
      {
        ref: '19.01',
        name: 'Forming Attached Units',
        description:
          "Before the battle, during the Declare Battle Formations step, you can attach Leader and Support units to eligible Bodyguard units. A Bodyguard unit can have one Leader and one Support attached. The Leader's datasheet lists which Bodyguard units it can attach to. Once attached, the units form one combined Attached Unit for all purposes.",
      },
      {
        ref: '19.02',
        name: 'Attacking Attached Units',
        description:
          "While Bodyguard models remain in an Attached Unit, attacks cannot be allocated to CHARACTER models in that unit — they must be allocated to Bodyguard models. If all Bodyguard models in an Attached Unit are destroyed, the CHARACTER unit(s) immediately split off and become independent units.",
      },
      {
        ref: '19.03',
        name: 'Keywords in Attached Units',
        description:
          'While a unit is attached, each model in the combined Attached Unit has all the keywords of every unit in the Attached Unit, in addition to their own keywords.',
      },
      {
        ref: '19.04',
        name: 'Abilities in Attached Units',
        description:
          'The abilities of units in an Attached Unit that affect their own unit affect the entire Attached Unit. Abilities that affect a unit within a certain range can also affect the Attached Unit if the model with the ability is part of that Attached Unit.',
      },
    ],
  },

  // ── STRATEGIC RESERVES ──────────────────────────────────────────────────
  {
    id: 'strategic-reserves',
    ref: '20',
    name: 'Strategic Reserves',
    group: 'Advanced Rules',
    summary: 'Hold units off the board and bring them on via Ingress moves from Round 2 onward.',
    subsections: [
      {
        ref: '20.01',
        name: 'Placing Units in Strategic Reserves',
        description:
          "During deployment, you can place friendly units in Strategic Reserves instead of on the battlefield. The combined points value of units in Strategic Reserves cannot exceed 50% of your army's total points limit. AIRCRAFT units must be placed in Strategic Reserves.",
      },
      {
        ref: '20.02',
        name: 'Repositioned Units',
        description:
          "Some rules allow units to be removed from the battlefield and placed in Strategic Reserves during the battle. Such units are treated as Strategic Reserves units and arrive via Ingress moves. They count toward the 50% limit only if placed before the battle.",
      },
      {
        ref: '20.03',
        name: 'Arriving from Strategic Reserves',
        description:
          'Units in Strategic Reserves arrive via Ingress moves. They can arrive from Round 2 onwards. At the end of Round 3, any units still in Strategic Reserves are destroyed (unless a mission rule states otherwise). Units cannot arrive in the same round they were placed in Strategic Reserves during the battle.',
      },
      {
        ref: '20.04',
        name: 'Ingress Move',
        description:
          "Set up the unit wholly within 6\" of one or more battlefield edges (as specified by any relevant rules) and more than 8\" horizontally from all enemy units. Before Round 3, models cannot be set up in the enemy's deployment zone. After arriving, the unit cannot make any other type of move until the start of the next Charge phase.",
      },
    ],
  },

  // ── FLYING AND SURGING ──────────────────────────────────────────────────
  {
    id: 'flying-surging',
    ref: '21',
    name: 'Flying and Surging',
    group: 'Advanced Rules',
    summary: 'FLY units can take to the skies; some units can make additional Surge Moves.',
    subsections: [
      {
        ref: '21.01',
        name: 'Surge Moves',
        description:
          'Some abilities trigger Surge Moves for units. When triggered, the unit makes a move toward a specified target: each model moves up to the stated distance; models must end Engaged with the target if possible, or as close as possible if not. The unit cannot end Engaged with units other than the target, and cannot move again this phase.',
      },
      {
        ref: '21.02',
        name: 'Surge Move',
        description:
          'When a unit makes a Surge Move, move each model up to the distance specified. Each model must end Engaged with the designated target unit if possible. If it is not possible, each model must end as close to the target as possible, maintaining Unit Coherency. No model can be placed within Engagement Range of an enemy unit other than the Surge target.',
      },
      {
        ref: '21.03',
        name: 'Flying Models',
        description:
          'When a FLYING unit is selected to make a Normal, Advance, Fall-back, or Charge move, the active player can declare it will Take to the Skies. If it does: subtract 2" from the maximum distance for that move; the unit ignores all vertical distances when moving; and the unit can move through all types of model and terrain features.',
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
          "Abilities tagged 'Aura' affect models or units within a stated range. The model with the aura ability is always within range of its own aura. A unit can be affected by multiple different aura abilities simultaneously, but each specific aura can only affect a given unit once, even if multiple friendly sources are nearby.",
      },
      {
        ref: '22.02',
        name: 'Faction Abilities',
        description:
          "Faction abilities (also called Army Rules) are common to units sharing a particular faction keyword. A unit's faction abilities only apply if the army faction you selected while mustering your army matches a faction keyword on that unit's datasheet.",
      },
      {
        ref: '22.03',
        name: 'Psychic Abilities',
        description:
          "Abilities tagged with 'Psychic' are psychic abilities. If a psychic ability causes a model to lose one or more wounds, each of those wounds is said to be inflicted by a psychic attack. This distinction can trigger other rules that specifically reference psychic attacks.",
      },
      {
        ref: '22.04',
        name: 'Wargear Abilities',
        description:
          "Wargear abilities are granted by specific items of wargear. If a unit has an item with a wargear ability that affects the whole unit, it applies to all models in that unit. If only one model has the item, that model is the 'bearer' and the ability applies until the bearer is destroyed.",
      },
      {
        ref: '22.05',
        name: 'Plunging Fire',
        description:
          'Each time a model makes a ranged attack targeting a visible unit with models on ground level, improve the Hit roll by 1 (i.e., improve the attacker\'s BS by 1) if: the attacking model is on a terrain section 3" or more in height; or the attacking model has the TOWERING keyword and the target unit is within 12".',
      },
    ],
  },

  // ── AIRCRAFT ──────────────────────────────────────────────────────────────
  {
    id: 'aircraft',
    ref: '23',
    name: 'Aircraft',
    group: 'Advanced Rules',
    summary: 'AIRCRAFT deploy in Strategic Reserves and follow special movement, deployment, and combat rules.',
    subsections: [
      {
        ref: '23.01',
        name: 'Deployment',
        description:
          'All AIRCRAFT units must be placed in Strategic Reserves during deployment — they cannot be set up on the battlefield at the start of the game.',
      },
      {
        ref: '23.02',
        name: 'Movement',
        description:
          'AIRCRAFT can only make Ingress moves — they cannot make Normal, Advance, or Fall-back moves. At the end of your opponent\'s turn, all of your AIRCRAFT on the battlefield return to Strategic Reserves.',
      },
      {
        ref: '23.03',
        name: 'Shooting',
        description:
          'AIRCRAFT can shoot with any ranged weapons on their datasheet. They follow all standard shooting rules except as modified by their special rules or weapon keywords.',
      },
      {
        ref: '23.04',
        name: 'Charging and Fighting',
        description:
          'AIRCRAFT cannot declare Charges and can only make melee attacks against other FLYING units. Only FLYING units can declare Charges against AIRCRAFT. AIRCRAFT can still fight back in the Fight phase if charged by a FLYING unit.',
      },
    ],
  },
];

export const PHASE_GROUPS = ['The Battle Round', 'Battlefields and Tactics', 'Advanced Rules'] as const;
export type PhaseGroup = (typeof PHASE_GROUPS)[number];
