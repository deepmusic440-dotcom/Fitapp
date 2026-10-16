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
];

export const EX = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
