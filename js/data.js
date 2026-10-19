// Static reference data: muscles, equipment and the exercise library.

export const MUSCLES = {
  chest:      { name: 'Chest',      size: 'L', tau: 36 },
  shoulders:  { name: 'Shoulders',  size: 'M', tau: 30 },
  triceps:    { name: 'Triceps',    size: 'S', tau: 24 },
  biceps:     { name: 'Biceps',     size: 'S', tau: 24 },
  forearms:   { name: 'Forearms',   size: 'S', tau: 20 },
  abs:        { name: 'Abs',        size: 'S', tau: 20 },
  obliques:   { name: 'Obliques',   size: 'S', tau: 20 },
  lats:       { name: 'Lats',       size: 'L', tau: 34 },
  upperback:  { name: 'Upper Back', size: 'M', tau: 30 },
  traps:      { name: 'Traps',      size: 'S', tau: 26 },
  lowerback:  { name: 'Lower Back', size: 'M', tau: 36 },
  quads:      { name: 'Quads',      size: 'L', tau: 40 },
  hamstrings: { name: 'Hamstrings', size: 'L', tau: 40 },
  glutes:     { name: 'Glutes',     size: 'L', tau: 36 },
  adductors:  { name: 'Adductors',  size: 'M', tau: 30 },
  calves:     { name: 'Calves',     size: 'S', tau: 24 },
};

export const EQUIPMENT = {
  barbell:   'Barbell',
  dumbbell:  'Dumbbells',
  kettlebell:'Kettlebell',
  bench:     'Bench',
  cable:     'Cable machine',
  machine:   'Machines',
  pullupbar: 'Pull-up bar',
  bands:     'Resistance bands',
};

export const FOCUS = {
  auto:  { name: 'Smart',  muscles: null },
  full:  { name: 'Full Body', muscles: Object.keys(MUSCLES) },
  upper: { name: 'Upper',  muscles: ['chest', 'shoulders', 'triceps', 'biceps', 'lats', 'upperback', 'traps', 'forearms'] },
  lower: { name: 'Lower',  muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'lowerback'] },
  push:  { name: 'Push',   muscles: ['chest', 'shoulders', 'triceps'] },
  pull:  { name: 'Pull',   muscles: ['lats', 'upperback', 'biceps', 'traps', 'forearms'] },
  core:  { name: 'Core',   muscles: ['abs', 'obliques', 'lowerback'] },
};

// ratio: typical working load as a fraction of bodyweight for an intermediate lifter
//        (per hand for dumbbell/kettlebell exercises flagged perHand).
// bw: bodyweight exercise (load is added weight, default 0).
// timed: reps are seconds.
// cardio: logged as distance + duration instead of weight × reps; never auto-generated.
const E = (id, name, primary, secondary, equip, type, ratio, extra = {}) =>
  ({ id, name, primary, secondary, equip, type, ratio, ...extra });

export const EXERCISES = [
  // Chest
  E('bench', 'Barbell Bench Press', ['chest'], ['triceps', 'shoulders'], ['barbell', 'bench'], 'compound', 0.75, { bar: true }),
  E('incline_bench', 'Incline Barbell Bench Press', ['chest'], ['shoulders', 'triceps'], ['barbell', 'bench'], 'compound', 0.6, { bar: true }),
  E('db_bench', 'Dumbbell Bench Press', ['chest'], ['triceps', 'shoulders'], ['dumbbell', 'bench'], 'compound', 0.3, { perHand: true }),
  E('incline_db', 'Incline Dumbbell Press', ['chest'], ['shoulders', 'triceps'], ['dumbbell', 'bench'], 'compound', 0.25, { perHand: true }),
  E('db_fly', 'Dumbbell Fly', ['chest'], ['shoulders'], ['dumbbell', 'bench'], 'isolation', 0.12, { perHand: true }),
  E('cable_fly', 'Cable Crossover', ['chest'], ['shoulders'], ['cable'], 'isolation', 0.15),
  E('machine_press', 'Machine Chest Press', ['chest'], ['triceps', 'shoulders'], ['machine'], 'compound', 0.6),
  E('pec_deck', 'Pec Deck', ['chest'], [], ['machine'], 'isolation', 0.45),
  E('pushup', 'Push-Up', ['chest'], ['triceps', 'shoulders', 'abs'], [], 'compound', 0, { bw: true }),
  E('dips', 'Chest Dip', ['chest', 'triceps'], ['shoulders'], [], 'compound', 0, { bw: true }),
  E('band_press', 'Banded Chest Press', ['chest'], ['triceps'], ['bands'], 'compound', 0, { bw: true }),

  // Back
  E('pullup', 'Pull-Up', ['lats'], ['biceps', 'upperback', 'forearms'], ['pullupbar'], 'compound', 0, { bw: true }),
  E('chinup', 'Chin-Up', ['lats', 'biceps'], ['upperback'], ['pullupbar'], 'compound', 0, { bw: true }),
  E('lat_pulldown', 'Lat Pulldown', ['lats'], ['biceps', 'upperback'], ['cable'], 'compound', 0.6),
  E('straight_pulldown', 'Straight-Arm Pulldown', ['lats'], ['triceps'], ['cable'], 'isolation', 0.25),
  E('cable_row', 'Seated Cable Row', ['upperback', 'lats'], ['biceps', 'forearms'], ['cable'], 'compound', 0.6),
  E('barbell_row', 'Barbell Row', ['upperback', 'lats'], ['biceps', 'lowerback', 'forearms'], ['barbell'], 'compound', 0.6, { bar: true }),
  E('db_row', 'One-Arm Dumbbell Row', ['lats', 'upperback'], ['biceps'], ['dumbbell', 'bench'], 'compound', 0.3, { perHand: true }),
  E('machine_row', 'Machine Row', ['upperback', 'lats'], ['biceps'], ['machine'], 'compound', 0.55),
  E('inverted_row', 'Inverted Row', ['upperback', 'lats'], ['biceps'], ['pullupbar'], 'compound', 0, { bw: true }),
  E('face_pull', 'Face Pull', ['upperback', 'shoulders'], ['traps'], ['cable'], 'isolation', 0.22),
  E('band_pullapart', 'Band Pull-Apart', ['upperback'], ['shoulders'], ['bands'], 'isolation', 0, { bw: true }),
  E('kb_row', 'Kettlebell Row', ['lats', 'upperback'], ['biceps'], ['kettlebell'], 'compound', 0.25, { perHand: true }),

  // Shoulders
  E('ohp', 'Overhead Press', ['shoulders'], ['triceps', 'traps', 'abs'], ['barbell'], 'compound', 0.45, { bar: true }),
  E('db_shoulder', 'Dumbbell Shoulder Press', ['shoulders'], ['triceps'], ['dumbbell'], 'compound', 0.2, { perHand: true }),
  E('arnold', 'Arnold Press', ['shoulders'], ['triceps'], ['dumbbell'], 'compound', 0.17, { perHand: true }),
  E('machine_shoulder', 'Machine Shoulder Press', ['shoulders'], ['triceps'], ['machine'], 'compound', 0.4),
  E('lateral_raise', 'Lateral Raise', ['shoulders'], ['traps'], ['dumbbell'], 'isolation', 0.08, { perHand: true }),
  E('cable_lateral', 'Cable Lateral Raise', ['shoulders'], [], ['cable'], 'isolation', 0.06),
  E('rear_delt', 'Rear Delt Fly', ['shoulders', 'upperback'], [], ['dumbbell'], 'isolation', 0.07, { perHand: true }),
  E('pike_pushup', 'Pike Push-Up', ['shoulders'], ['triceps'], [], 'compound', 0, { bw: true }),
  E('kb_press', 'Kettlebell Press', ['shoulders'], ['triceps', 'abs'], ['kettlebell'], 'compound', 0.18, { perHand: true }),
  E('band_lateral', 'Banded Lateral Raise', ['shoulders'], [], ['bands'], 'isolation', 0, { bw: true }),

  // Traps
  E('db_shrug', 'Dumbbell Shrug', ['traps'], ['forearms'], ['dumbbell'], 'isolation', 0.35, { perHand: true }),
  E('bb_shrug', 'Barbell Shrug', ['traps'], ['forearms'], ['barbell'], 'isolation', 0.9, { bar: true }),

  // Biceps
  E('bb_curl', 'Barbell Curl', ['biceps'], ['forearms'], ['barbell'], 'isolation', 0.3, { bar: true }),
  E('db_curl', 'Dumbbell Curl', ['biceps'], ['forearms'], ['dumbbell'], 'isolation', 0.12, { perHand: true }),
  E('hammer_curl', 'Hammer Curl', ['biceps', 'forearms'], [], ['dumbbell'], 'isolation', 0.13, { perHand: true }),
  E('incline_curl', 'Incline Dumbbell Curl', ['biceps'], [], ['dumbbell', 'bench'], 'isolation', 0.1, { perHand: true }),
  E('cable_curl', 'Cable Curl', ['biceps'], ['forearms'], ['cable'], 'isolation', 0.25),
  E('band_curl', 'Band Curl', ['biceps'], [], ['bands'], 'isolation', 0, { bw: true }),

  // Triceps
  E('pushdown', 'Triceps Pushdown', ['triceps'], [], ['cable'], 'isolation', 0.3),
  E('oh_ext', 'Overhead Dumbbell Extension', ['triceps'], [], ['dumbbell'], 'isolation', 0.2),
  E('skullcrusher', 'Skull Crusher', ['triceps'], [], ['barbell', 'bench'], 'isolation', 0.25, { bar: true }),
  E('cg_bench', 'Close-Grip Bench Press', ['triceps', 'chest'], ['shoulders'], ['barbell', 'bench'], 'compound', 0.6, { bar: true }),
  E('bench_dip', 'Bench Dip', ['triceps'], ['chest', 'shoulders'], ['bench'], 'compound', 0, { bw: true }),
  E('diamond_pushup', 'Diamond Push-Up', ['triceps'], ['chest'], [], 'compound', 0, { bw: true }),
  E('band_pushdown', 'Band Pushdown', ['triceps'], [], ['bands'], 'isolation', 0, { bw: true }),

  // Forearms
  E('wrist_curl', 'Wrist Curl', ['forearms'], [], ['dumbbell'], 'isolation', 0.08, { perHand: true }),
  E('farmer_carry', "Farmer's Carry", ['forearms', 'traps'], ['abs', 'glutes'], ['dumbbell'], 'compound', 0.4, { perHand: true, timed: true }),
  E('dead_hang', 'Dead Hang', ['forearms'], ['lats'], ['pullupbar'], 'isolation', 0, { bw: true, timed: true }),

  // Quads
  E('squat', 'Back Squat', ['quads', 'glutes'], ['adductors', 'lowerback', 'hamstrings'], ['barbell'], 'compound', 1.0, { bar: true }),
  E('front_squat', 'Front Squat', ['quads'], ['glutes', 'abs', 'upperback'], ['barbell'], 'compound', 0.8, { bar: true }),
  E('goblet_squat', 'Goblet Squat', ['quads', 'glutes'], ['adductors', 'abs'], ['dumbbell'], 'compound', 0.3),
  E('kb_goblet', 'Kettlebell Goblet Squat', ['quads', 'glutes'], ['adductors', 'abs'], ['kettlebell'], 'compound', 0.28),
  E('leg_press', 'Leg Press', ['quads', 'glutes'], ['adductors', 'hamstrings'], ['machine'], 'compound', 1.6),
  E('bulgarian', 'Bulgarian Split Squat', ['quads', 'glutes'], ['adductors', 'hamstrings'], ['dumbbell', 'bench'], 'compound', 0.15, { perHand: true }),
  E('lunge', 'Walking Lunge', ['quads', 'glutes'], ['hamstrings', 'adductors'], ['dumbbell'], 'compound', 0.15, { perHand: true }),
  E('step_up', 'Dumbbell Step-Up', ['quads', 'glutes'], ['hamstrings'], ['dumbbell', 'bench'], 'compound', 0.15, { perHand: true }),
  E('leg_ext', 'Leg Extension', ['quads'], [], ['machine'], 'isolation', 0.45),
  E('bw_squat', 'Bodyweight Squat', ['quads', 'glutes'], ['adductors'], [], 'compound', 0, { bw: true }),
  E('bw_lunge', 'Reverse Lunge', ['quads', 'glutes'], ['hamstrings'], [], 'compound', 0, { bw: true }),

  // Posterior chain
  E('deadlift', 'Deadlift', ['hamstrings', 'glutes', 'lowerback'], ['traps', 'forearms', 'quads', 'upperback'], ['barbell'], 'compound', 1.25, { bar: true }),
  E('rdl', 'Romanian Deadlift', ['hamstrings', 'glutes'], ['lowerback', 'forearms'], ['barbell'], 'compound', 0.8, { bar: true }),
  E('db_rdl', 'Dumbbell Romanian Deadlift', ['hamstrings', 'glutes'], ['lowerback'], ['dumbbell'], 'compound', 0.3, { perHand: true }),
  E('leg_curl', 'Lying Leg Curl', ['hamstrings'], ['calves'], ['machine'], 'isolation', 0.35),
  E('hip_thrust', 'Barbell Hip Thrust', ['glutes'], ['hamstrings'], ['barbell', 'bench'], 'compound', 1.0, { bar: true }),
  E('glute_bridge', 'Glute Bridge', ['glutes'], ['hamstrings'], [], 'isolation', 0, { bw: true }),
  E('kb_swing', 'Kettlebell Swing', ['glutes', 'hamstrings'], ['lowerback', 'abs'], ['kettlebell'], 'compound', 0.25),
  E('good_morning', 'Good Morning', ['hamstrings', 'lowerback'], ['glutes'], ['barbell'], 'compound', 0.4, { bar: true }),
  E('back_ext', 'Back Extension', ['lowerback'], ['glutes', 'hamstrings'], [], 'isolation', 0, { bw: true }),
  E('cable_pullthrough', 'Cable Pull-Through', ['glutes'], ['hamstrings'], ['cable'], 'isolation', 0.35),
  E('single_leg_rdl', 'Single-Leg RDL', ['hamstrings', 'glutes'], ['lowerback'], [], 'isolation', 0, { bw: true }),

  // Adductors / calves
  E('adductor_machine', 'Hip Adduction Machine', ['adductors'], [], ['machine'], 'isolation', 0.5),
  E('sumo_squat', 'Dumbbell Sumo Squat', ['adductors', 'glutes'], ['quads'], ['dumbbell'], 'compound', 0.35),
  E('copenhagen', 'Copenhagen Plank', ['adductors'], ['obliques'], ['bench'], 'isolation', 0, { bw: true, timed: true }),
  E('calf_raise', 'Standing Calf Raise', ['calves'], [], ['machine'], 'isolation', 0.8),
  E('seated_calf', 'Seated Calf Raise', ['calves'], [], ['machine'], 'isolation', 0.5),
  E('db_calf', 'Dumbbell Calf Raise', ['calves'], [], ['dumbbell'], 'isolation', 0.2, { perHand: true }),
  E('bw_calf', 'Single-Leg Calf Raise', ['calves'], [], [], 'isolation', 0, { bw: true }),

  // Core
  E('plank', 'Plank', ['abs'], ['obliques', 'shoulders'], [], 'isolation', 0, { bw: true, timed: true }),
  E('side_plank', 'Side Plank', ['obliques'], ['abs'], [], 'isolation', 0, { bw: true, timed: true }),
  E('crunch', 'Crunch', ['abs'], [], [], 'isolation', 0, { bw: true }),
  E('hanging_raise', 'Hanging Leg Raise', ['abs'], ['obliques', 'forearms'], ['pullupbar'], 'isolation', 0, { bw: true }),
  E('cable_crunch', 'Cable Crunch', ['abs'], [], ['cable'], 'isolation', 0.4),
  E('russian_twist', 'Russian Twist', ['obliques'], ['abs'], [], 'isolation', 0, { bw: true }),
  E('bicycle', 'Bicycle Crunch', ['obliques', 'abs'], [], [], 'isolation', 0, { bw: true }),
  E('dead_bug', 'Dead Bug', ['abs'], [], [], 'isolation', 0, { bw: true }),
  E('ab_wheel', 'Ab Wheel Rollout', ['abs'], ['lats', 'obliques'], [], 'isolation', 0, { bw: true }),
  E('pallof', 'Pallof Press', ['obliques'], ['abs'], ['cable'], 'isolation', 0.12),
  E('woodchop', 'Cable Woodchop', ['obliques'], ['abs', 'shoulders'], ['cable'], 'isolation', 0.15),

  // Cardio
  E('run', 'Running', ['quads', 'hamstrings', 'calves'], ['glutes'], [], 'compound', 0, { cardio: true }),
  E('walk', 'Walking', ['calves'], ['quads', 'glutes'], [], 'compound', 0, { cardio: true }),
  E('bike', 'Cycling', ['quads'], ['glutes', 'hamstrings', 'calves'], [], 'compound', 0, { cardio: true }),
  E('row_erg', 'Rowing Machine', ['upperback', 'lats', 'quads'], ['hamstrings', 'glutes', 'biceps'], [], 'compound', 0, { cardio: true }),
  E('elliptical', 'Elliptical', ['quads', 'glutes'], ['hamstrings', 'calves'], [], 'compound', 0, { cardio: true }),
  E('stairs', 'Stair Climber', ['glutes', 'quads'], ['calves', 'hamstrings'], [], 'compound', 0, { cardio: true }),
  E('jump_rope', 'Jump Rope', ['calves'], ['shoulders', 'forearms'], [], 'compound', 0, { cardio: true }),
  E('swim', 'Swimming', ['lats', 'shoulders'], ['upperback', 'triceps'], [], 'compound', 0, { cardio: true }),
  // ---- Expanded library: variations on every machine, cable, free weight and bodyweight station ----
  // noGen: available to add, swap and plan, but left out of auto-generated Smart workouts
  //        (skill lifts, conditioning drills and prehab work).

  // Chest
  E('decline_bench', 'Decline Barbell Bench Press', ['chest'], ['triceps', 'shoulders'], ['barbell', 'bench'], 'compound', 0.75, { bar: true }),
  E('decline_db', 'Decline Dumbbell Press', ['chest'], ['triceps'], ['dumbbell', 'bench'], 'compound', 0.3, { perHand: true }),
  E('smith_bench', 'Smith Machine Bench Press', ['chest'], ['triceps', 'shoulders'], ['machine', 'bench'], 'compound', 0.65),
  E('smith_incline', 'Smith Machine Incline Press', ['chest'], ['shoulders', 'triceps'], ['machine', 'bench'], 'compound', 0.55),
  E('incline_machine', 'Incline Machine Press', ['chest'], ['shoulders', 'triceps'], ['machine'], 'compound', 0.5),
  E('incline_fly', 'Incline Dumbbell Fly', ['chest'], ['shoulders'], ['dumbbell', 'bench'], 'isolation', 0.1, { perHand: true }),
  E('low_cable_fly', 'Low-to-High Cable Fly', ['chest'], ['shoulders'], ['cable'], 'isolation', 0.12),
  E('high_cable_fly', 'High-to-Low Cable Fly', ['chest'], ['shoulders'], ['cable'], 'isolation', 0.15),
  E('cable_press', 'Standing Cable Chest Press', ['chest'], ['triceps', 'shoulders'], ['cable'], 'compound', 0.3),
  E('floor_press', 'Dumbbell Floor Press', ['chest'], ['triceps'], ['dumbbell'], 'compound', 0.28, { perHand: true }),
  E('landmine_press', 'Landmine Press', ['chest', 'shoulders'], ['triceps'], ['barbell'], 'compound', 0.3),
  E('db_pullover', 'Dumbbell Pullover', ['chest', 'lats'], ['triceps'], ['dumbbell', 'bench'], 'isolation', 0.25),
  E('svend_press', 'Svend Press', ['chest'], ['shoulders'], ['dumbbell'], 'isolation', 0.1, { noGen: true }),
  E('incline_pushup', 'Incline Push-Up', ['chest'], ['triceps', 'shoulders'], [], 'compound', 0, { bw: true }),
  E('decline_pushup', 'Decline Push-Up', ['chest'], ['shoulders', 'triceps'], [], 'compound', 0, { bw: true }),
  E('machine_fly', 'Machine Chest Fly', ['chest'], ['shoulders'], ['machine'], 'isolation', 0.4),

  // Back
  E('wide_pulldown', 'Wide-Grip Lat Pulldown', ['lats'], ['biceps', 'upperback'], ['cable'], 'compound', 0.6),
  E('cg_pulldown', 'Close-Grip Lat Pulldown', ['lats'], ['biceps', 'upperback'], ['cable'], 'compound', 0.6),
  E('single_pulldown', 'Single-Arm Cable Pulldown', ['lats'], ['biceps'], ['cable'], 'compound', 0.25),
  E('machine_pulldown', 'Machine Lat Pulldown', ['lats'], ['biceps', 'upperback'], ['machine'], 'compound', 0.6),
  E('neutral_pullup', 'Neutral-Grip Pull-Up', ['lats'], ['biceps', 'upperback', 'forearms'], ['pullupbar'], 'compound', 0, { bw: true }),
  E('assisted_pullup', 'Assisted Pull-Up (Machine)', ['lats'], ['biceps', 'upperback'], ['machine'], 'compound', 0, { bw: true }),
  E('pendlay_row', 'Pendlay Row', ['upperback', 'lats'], ['biceps', 'lowerback'], ['barbell'], 'compound', 0.55, { bar: true }),
  E('tbar_row', 'T-Bar Row', ['upperback', 'lats'], ['biceps', 'lowerback'], ['barbell'], 'compound', 0.6),
  E('chest_supported_row', 'Chest-Supported Dumbbell Row', ['upperback', 'lats'], ['biceps'], ['dumbbell', 'bench'], 'compound', 0.25, { perHand: true }),
  E('seal_row', 'Seal Row', ['upperback', 'lats'], ['biceps'], ['barbell', 'bench'], 'compound', 0.45, { bar: true }),
  E('meadows_row', 'Meadows Row', ['lats', 'upperback'], ['biceps', 'forearms'], ['barbell'], 'compound', 0.3),
  E('single_cable_row', 'Single-Arm Cable Row', ['lats', 'upperback'], ['biceps'], ['cable'], 'compound', 0.25),
  E('high_row', 'Machine High Row', ['upperback', 'lats'], ['biceps'], ['machine'], 'compound', 0.5),
  E('rack_pull', 'Rack Pull', ['upperback', 'lowerback'], ['traps', 'glutes', 'hamstrings', 'forearms'], ['barbell'], 'compound', 1.3, { bar: true }),
  E('cable_pullover', 'Cable Rope Pullover', ['lats'], ['triceps'], ['cable'], 'isolation', 0.25),
  E('band_row', 'Banded Row', ['upperback', 'lats'], ['biceps'], ['bands'], 'compound', 0, { bw: true }),
  E('superman', 'Superman Hold', ['lowerback'], ['glutes'], [], 'isolation', 0, { bw: true, timed: true }),

  // Shoulders
  E('seated_ohp', 'Seated Barbell Overhead Press', ['shoulders'], ['triceps'], ['barbell', 'bench'], 'compound', 0.4, { bar: true }),
  E('push_press', 'Push Press', ['shoulders'], ['triceps', 'quads', 'traps'], ['barbell'], 'compound', 0.55, { bar: true, noGen: true }),
  E('smith_ohp', 'Smith Machine Shoulder Press', ['shoulders'], ['triceps'], ['machine'], 'compound', 0.4),
  E('front_raise', 'Dumbbell Front Raise', ['shoulders'], ['chest'], ['dumbbell'], 'isolation', 0.08, { perHand: true }),
  E('cable_front_raise', 'Cable Front Raise', ['shoulders'], [], ['cable'], 'isolation', 0.08),
  E('plate_front_raise', 'Plate Front Raise', ['shoulders'], ['traps'], ['barbell'], 'isolation', 0.15),
  E('upright_row', 'Barbell Upright Row', ['shoulders', 'traps'], ['biceps'], ['barbell'], 'compound', 0.3, { bar: true }),
  E('cable_upright_row', 'Cable Upright Row', ['shoulders', 'traps'], ['biceps'], ['cable'], 'compound', 0.3),
  E('machine_lateral', 'Machine Lateral Raise', ['shoulders'], [], ['machine'], 'isolation', 0.15),
  E('reverse_pec_deck', 'Reverse Pec Deck', ['shoulders', 'upperback'], ['traps'], ['machine'], 'isolation', 0.3),
  E('cable_rear_delt', 'Cable Rear Delt Fly', ['shoulders', 'upperback'], [], ['cable'], 'isolation', 0.08),
  E('y_raise', 'Incline Y-Raise', ['shoulders', 'upperback'], ['traps'], ['dumbbell', 'bench'], 'isolation', 0.04, { perHand: true }),
  E('external_rotation', 'Cable External Rotation', ['shoulders'], ['upperback'], ['cable'], 'isolation', 0.05, { noGen: true }),
  E('handstand_pushup', 'Handstand Push-Up', ['shoulders'], ['triceps', 'traps'], [], 'compound', 0, { bw: true, noGen: true }),

  // Traps
  E('cable_shrug', 'Cable Shrug', ['traps'], ['forearms'], ['cable'], 'isolation', 0.6),
  E('smith_shrug', 'Smith Machine Shrug', ['traps'], ['forearms'], ['machine'], 'isolation', 0.8),

  // Biceps
  E('ez_curl', 'EZ-Bar Curl', ['biceps'], ['forearms'], ['barbell'], 'isolation', 0.28),
  E('preacher_curl', 'EZ-Bar Preacher Curl', ['biceps'], [], ['barbell', 'bench'], 'isolation', 0.22),
  E('db_preacher', 'Dumbbell Preacher Curl', ['biceps'], [], ['dumbbell', 'bench'], 'isolation', 0.09, { perHand: true }),
  E('machine_curl', 'Machine Bicep Curl', ['biceps'], [], ['machine'], 'isolation', 0.25),
  E('concentration_curl', 'Concentration Curl', ['biceps'], [], ['dumbbell', 'bench'], 'isolation', 0.09, { perHand: true }),
  E('spider_curl', 'Spider Curl', ['biceps'], [], ['dumbbell', 'bench'], 'isolation', 0.08, { perHand: true }),
  E('rope_hammer', 'Cable Rope Hammer Curl', ['biceps', 'forearms'], [], ['cable'], 'isolation', 0.25),
  E('bayesian_curl', 'Bayesian Cable Curl', ['biceps'], [], ['cable'], 'isolation', 0.1),
  E('reverse_curl', 'Reverse Barbell Curl', ['forearms', 'biceps'], [], ['barbell'], 'isolation', 0.2, { bar: true }),
  E('zottman_curl', 'Zottman Curl', ['biceps', 'forearms'], [], ['dumbbell'], 'isolation', 0.09, { perHand: true }),

  // Triceps
  E('rope_pushdown', 'Rope Triceps Pushdown', ['triceps'], [], ['cable'], 'isolation', 0.25),
  E('vbar_pushdown', 'V-Bar Triceps Pushdown', ['triceps'], [], ['cable'], 'isolation', 0.3),
  E('single_pushdown', 'Single-Arm Cable Pushdown', ['triceps'], [], ['cable'], 'isolation', 0.12),
  E('reverse_pushdown', 'Reverse-Grip Triceps Pushdown', ['triceps'], ['forearms'], ['cable'], 'isolation', 0.2),
  E('cable_oh_ext', 'Overhead Cable Triceps Extension', ['triceps'], [], ['cable'], 'isolation', 0.25),
  E('single_cable_oh_ext', 'Single-Arm Overhead Cable Extension', ['triceps'], [], ['cable'], 'isolation', 0.1),
  E('db_skull', 'Dumbbell Skull Crusher', ['triceps'], [], ['dumbbell', 'bench'], 'isolation', 0.1, { perHand: true }),
  E('ez_oh_ext', 'EZ-Bar Overhead Triceps Extension', ['triceps'], [], ['barbell'], 'isolation', 0.2),
  E('kickback', 'Dumbbell Triceps Kickback', ['triceps'], [], ['dumbbell'], 'isolation', 0.06, { perHand: true }),
  E('cable_kickback', 'Cable Triceps Kickback', ['triceps'], [], ['cable'], 'isolation', 0.06),
  E('jm_press', 'JM Press', ['triceps'], ['chest'], ['barbell', 'bench'], 'compound', 0.45, { bar: true, noGen: true }),
  E('machine_dip', 'Machine Triceps Dip', ['triceps'], ['chest'], ['machine'], 'compound', 0.6),
  E('machine_tri_ext', 'Machine Triceps Extension', ['triceps'], [], ['machine'], 'isolation', 0.3),
  E('triceps_dip', 'Triceps Dip (Parallel Bars)', ['triceps'], ['chest', 'shoulders'], [], 'compound', 0, { bw: true }),

  // Forearms
  E('reverse_wrist_curl', 'Reverse Wrist Curl', ['forearms'], [], ['dumbbell'], 'isolation', 0.05, { perHand: true }),
  E('bb_wrist_curl', 'Barbell Wrist Curl', ['forearms'], [], ['barbell'], 'isolation', 0.2),

  // Quads
  E('hack_squat', 'Hack Squat (Machine)', ['quads', 'glutes'], ['adductors'], ['machine'], 'compound', 1.2),
  E('smith_squat', 'Smith Machine Squat', ['quads', 'glutes'], ['adductors', 'hamstrings'], ['machine'], 'compound', 0.9),
  E('pendulum_squat', 'Pendulum Squat', ['quads'], ['glutes'], ['machine'], 'compound', 0.9),
  E('belt_squat', 'Belt Squat', ['quads', 'glutes'], ['adductors'], ['machine'], 'compound', 0.9),
  E('box_squat', 'Box Squat', ['quads', 'glutes'], ['hamstrings', 'lowerback'], ['barbell', 'bench'], 'compound', 0.9, { bar: true }),
  E('pause_squat', 'Paused Back Squat', ['quads', 'glutes'], ['adductors', 'lowerback'], ['barbell'], 'compound', 0.85, { bar: true }),
  E('zercher', 'Zercher Squat', ['quads', 'glutes'], ['upperback', 'abs'], ['barbell'], 'compound', 0.7, { bar: true, noGen: true }),
  E('single_leg_press', 'Single-Leg Leg Press', ['quads', 'glutes'], ['hamstrings'], ['machine'], 'compound', 0.7),
  E('db_squat', 'Dumbbell Squat', ['quads', 'glutes'], ['adductors'], ['dumbbell'], 'compound', 0.25, { perHand: true }),
  E('db_reverse_lunge', 'Dumbbell Reverse Lunge', ['quads', 'glutes'], ['hamstrings'], ['dumbbell'], 'compound', 0.15, { perHand: true }),
  E('bb_lunge', 'Barbell Lunge', ['quads', 'glutes'], ['hamstrings', 'adductors'], ['barbell'], 'compound', 0.4, { bar: true }),
  E('split_squat', 'Dumbbell Split Squat', ['quads', 'glutes'], ['adductors'], ['dumbbell'], 'compound', 0.15, { perHand: true }),
  E('single_leg_ext', 'Single-Leg Extension', ['quads'], [], ['machine'], 'isolation', 0.2),
  E('sissy_squat', 'Sissy Squat', ['quads'], [], [], 'isolation', 0, { bw: true, noGen: true }),
  E('wall_sit', 'Wall Sit', ['quads'], ['glutes'], [], 'isolation', 0, { bw: true, timed: true }),
  E('jump_squat', 'Jump Squat', ['quads', 'glutes'], ['calves'], [], 'compound', 0, { bw: true, noGen: true }),
  E('cossack', 'Cossack Squat', ['adductors', 'quads'], ['glutes'], [], 'compound', 0, { bw: true }),
  E('lateral_lunge', 'Lateral Lunge', ['adductors', 'quads'], ['glutes'], [], 'compound', 0, { bw: true }),
  E('pistol_squat', 'Pistol Squat', ['quads', 'glutes'], ['abs'], [], 'compound', 0, { bw: true, noGen: true }),

  // Posterior chain
  E('sumo_deadlift', 'Sumo Deadlift', ['glutes', 'hamstrings', 'adductors'], ['quads', 'lowerback', 'traps', 'forearms'], ['barbell'], 'compound', 1.2, { bar: true }),
  E('trap_bar_deadlift', 'Trap Bar Deadlift', ['quads', 'glutes', 'hamstrings'], ['lowerback', 'traps', 'forearms'], ['barbell'], 'compound', 1.3, { bar: true }),
  E('stiff_leg', 'Stiff-Leg Deadlift', ['hamstrings'], ['glutes', 'lowerback'], ['barbell'], 'compound', 0.75, { bar: true }),
  E('kb_deadlift', 'Kettlebell Deadlift', ['glutes', 'hamstrings'], ['lowerback', 'quads'], ['kettlebell'], 'compound', 0.4),
  E('single_leg_rdl_db', 'Single-Leg Dumbbell RDL', ['hamstrings', 'glutes'], ['lowerback'], ['dumbbell'], 'compound', 0.15, { perHand: true }),
  E('seated_leg_curl', 'Seated Leg Curl', ['hamstrings'], ['calves'], ['machine'], 'isolation', 0.4),
  E('standing_leg_curl', 'Standing Single-Leg Curl', ['hamstrings'], [], ['machine'], 'isolation', 0.15),
  E('nordic_curl', 'Nordic Hamstring Curl', ['hamstrings'], ['glutes'], [], 'isolation', 0, { bw: true, noGen: true }),
  E('glute_ham_raise', 'Glute-Ham Raise', ['hamstrings', 'glutes'], ['lowerback'], ['machine'], 'compound', 0, { bw: true }),
  E('smith_hip_thrust', 'Smith Machine Hip Thrust', ['glutes'], ['hamstrings'], ['machine', 'bench'], 'compound', 0.9),
  E('machine_hip_thrust', 'Hip Thrust Machine', ['glutes'], ['hamstrings'], ['machine'], 'compound', 0.9),
  E('db_hip_thrust', 'Dumbbell Hip Thrust', ['glutes'], ['hamstrings'], ['dumbbell', 'bench'], 'compound', 0.3),
  E('single_leg_hip_thrust', 'Single-Leg Hip Thrust', ['glutes'], ['hamstrings'], ['bench'], 'isolation', 0, { bw: true }),
  E('cable_glute_kickback', 'Cable Glute Kickback', ['glutes'], ['hamstrings'], ['cable'], 'isolation', 0.1),
  E('machine_glute_kickback', 'Glute Kickback Machine', ['glutes'], ['hamstrings'], ['machine'], 'isolation', 0.3),
  E('abductor_machine', 'Hip Abduction Machine', ['glutes'], [], ['machine'], 'isolation', 0.5),
  E('band_walk', 'Banded Lateral Walk', ['glutes'], [], ['bands'], 'isolation', 0, { bw: true }),
  E('reverse_hyper', 'Reverse Hyperextension', ['glutes', 'lowerback'], ['hamstrings'], ['machine'], 'isolation', 0.3),
  E('power_clean', 'Power Clean', ['hamstrings', 'glutes', 'traps'], ['quads', 'shoulders', 'upperback', 'forearms'], ['barbell'], 'compound', 0.6, { bar: true, noGen: true }),

  // Adductors / calves
  E('cable_adduction', 'Cable Hip Adduction', ['adductors'], [], ['cable'], 'isolation', 0.1),
  E('leg_press_calf', 'Leg Press Calf Raise', ['calves'], [], ['machine'], 'isolation', 1.0),
  E('smith_calf', 'Smith Machine Calf Raise', ['calves'], [], ['machine'], 'isolation', 0.8),
  E('donkey_calf', 'Donkey Calf Raise', ['calves'], [], ['machine'], 'isolation', 0.8),
  E('tib_raise', 'Tibialis Raise', ['calves'], [], [], 'isolation', 0, { bw: true, noGen: true }),

  // Core
  E('decline_crunch', 'Decline Crunch', ['abs'], [], ['bench'], 'isolation', 0, { bw: true }),
  E('sit_up', 'Sit-Up', ['abs'], ['obliques'], [], 'isolation', 0, { bw: true }),
  E('leg_raise', 'Lying Leg Raise', ['abs'], [], [], 'isolation', 0, { bw: true }),
  E('reverse_crunch', 'Reverse Crunch', ['abs'], [], [], 'isolation', 0, { bw: true }),
  E('knee_raise', 'Hanging Knee Raise', ['abs'], ['obliques'], ['pullupbar'], 'isolation', 0, { bw: true }),
  E('captains_chair', "Captain's Chair Leg Raise", ['abs'], ['obliques'], ['machine'], 'isolation', 0, { bw: true }),
  E('toes_to_bar', 'Toes-to-Bar', ['abs'], ['lats', 'forearms'], ['pullupbar'], 'isolation', 0, { bw: true, noGen: true }),
  E('machine_crunch', 'Ab Crunch Machine', ['abs'], [], ['machine'], 'isolation', 0.4),
  E('hollow_hold', 'Hollow Body Hold', ['abs'], [], [], 'isolation', 0, { bw: true, timed: true }),
  E('v_up', 'V-Up', ['abs'], [], [], 'isolation', 0, { bw: true }),
  E('mountain_climber', 'Mountain Climbers', ['abs'], ['shoulders', 'quads'], [], 'isolation', 0, { bw: true, noGen: true }),
  E('flutter_kicks', 'Flutter Kicks', ['abs'], [], [], 'isolation', 0, { bw: true, timed: true }),
  E('bird_dog', 'Bird Dog', ['lowerback', 'abs'], ['glutes'], [], 'isolation', 0, { bw: true }),
  E('cable_side_bend', 'Cable Side Bend', ['obliques'], [], ['cable'], 'isolation', 0.15),
  E('db_side_bend', 'Dumbbell Side Bend', ['obliques'], [], ['dumbbell'], 'isolation', 0.2, { perHand: true }),
  E('landmine_rotation', 'Landmine Rotation', ['obliques'], ['abs', 'shoulders'], ['barbell'], 'isolation', 0.15),
  E('suitcase_carry', 'Suitcase Carry', ['obliques', 'forearms'], ['abs', 'traps'], ['dumbbell'], 'compound', 0.3, { perHand: true, timed: true }),
  E('weighted_plank', 'Weighted Plank', ['abs'], ['obliques', 'shoulders'], ['barbell'], 'isolation', 0.2, { timed: true }),

  // Full body & conditioning
  E('thruster', 'Dumbbell Thruster', ['quads', 'shoulders'], ['glutes', 'triceps'], ['dumbbell'], 'compound', 0.15, { perHand: true, noGen: true }),
  E('kb_get_up', 'Turkish Get-Up', ['shoulders', 'abs'], ['glutes', 'obliques'], ['kettlebell'], 'compound', 0.15, { noGen: true }),
  E('kb_clean_press', 'Kettlebell Clean and Press', ['shoulders', 'glutes'], ['hamstrings', 'triceps'], ['kettlebell'], 'compound', 0.18, { perHand: true, noGen: true }),
  E('burpee', 'Burpee', ['quads', 'chest'], ['shoulders', 'abs'], [], 'compound', 0, { bw: true, noGen: true }),
  E('box_jump', 'Box Jump', ['quads', 'glutes'], ['calves'], ['bench'], 'compound', 0, { bw: true, noGen: true }),
  E('battle_ropes', 'Battle Ropes', ['shoulders'], ['abs', 'forearms'], [], 'compound', 0, { bw: true, timed: true, noGen: true }),
  E('sled_push', 'Sled Push', ['quads', 'glutes'], ['calves'], ['machine'], 'compound', 1.0, { noGen: true }),

  // More cardio
  E('incline_walk', 'Incline Treadmill Walk', ['calves', 'glutes'], ['hamstrings'], [], 'compound', 0, { cardio: true }),
  E('hike', 'Hiking', ['quads', 'glutes'], ['calves'], [], 'compound', 0, { cardio: true }),
  E('ski_erg', 'SkiErg', ['lats', 'shoulders'], ['abs', 'triceps'], [], 'compound', 0, { cardio: true }),
  E('air_bike', 'Assault Bike', ['quads'], ['shoulders', 'glutes'], [], 'compound', 0, { cardio: true }),
  E('sprints', 'Sprints', ['quads', 'hamstrings', 'glutes'], ['calves'], [], 'compound', 0, { cardio: true }),
];

export const EX = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
