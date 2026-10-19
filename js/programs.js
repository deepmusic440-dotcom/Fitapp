// Built-in multi-day training programs (Boostcamp / JEFIT style).
// Each day lists exercises as [exId, sets, repsLow, repsHigh, restSeconds].
// Weights still come from your history, so every program progresses automatically.

const day = (name, ex) => ({ name, ex: ex.map(([id, sets, lo, hi, rest]) => ({ id, sets, lo, hi, rest })) });

export const PROGRAMS = [
  {
    id: 'sl5x5', name: 'StrongLifts 5×5', level: 'Beginner', goal: 'Strength', perWeek: 3,
    desc: 'Two alternating full-body days built on the big barbell lifts. Finish all 5×5 and the bar goes up next time.',
    days: [
      day('Workout A', [['squat', 5, 5, 5, 180], ['bench', 5, 5, 5, 180], ['barbell_row', 5, 5, 5, 180]]),
      day('Workout B', [['squat', 5, 5, 5, 180], ['ohp', 5, 5, 5, 180], ['deadlift', 1, 5, 5, 180]]),
    ],
  },
  {
    id: 'fb3', name: 'Full Body Foundations', level: 'Beginner', goal: 'Muscle', perWeek: 3,
    desc: 'Three different full-body days. Moderate volume and simple lifts, so it suits a first program.',
    days: [
      day('Day A', [['goblet_squat', 3, 8, 12, 120], ['db_bench', 3, 8, 12, 120], ['lat_pulldown', 3, 8, 12, 90], ['db_rdl', 3, 8, 12, 90], ['plank', 3, 30, 45, 60]]),
      day('Day B', [['leg_press', 3, 10, 15, 120], ['db_shoulder', 3, 8, 12, 90], ['cable_row', 3, 8, 12, 90], ['leg_curl', 3, 10, 15, 75], ['db_curl', 2, 10, 15, 60]]),
      day('Day C', [['bulgarian', 3, 8, 12, 90], ['incline_db', 3, 8, 12, 90], ['db_row', 3, 8, 12, 90], ['glute_bridge', 3, 12, 20, 60], ['pushdown', 2, 10, 15, 60]]),
    ],
  },
  {
    id: 'ppl', name: 'Push / Pull / Legs', level: 'Intermediate', goal: 'Muscle', perWeek: 6,
    desc: 'The classic bodybuilding split. Run it 3 days a week, or twice through for 6.',
    days: [
      day('Push', [['bench', 4, 6, 10, 150], ['db_shoulder', 3, 8, 12, 120], ['incline_db', 3, 8, 12, 90], ['lateral_raise', 3, 12, 20, 60], ['pushdown', 3, 10, 15, 60], ['oh_ext', 2, 10, 15, 60]]),
      day('Pull', [['barbell_row', 4, 6, 10, 150], ['pullup', 3, 6, 12, 120], ['cable_row', 3, 8, 12, 90], ['face_pull', 3, 12, 20, 60], ['db_curl', 3, 10, 15, 60], ['hammer_curl', 2, 10, 15, 60]]),
      day('Legs', [['squat', 4, 6, 10, 180], ['rdl', 3, 8, 12, 150], ['leg_press', 3, 10, 15, 120], ['leg_curl', 3, 10, 15, 75], ['calf_raise', 4, 10, 20, 60], ['hanging_raise', 3, 10, 15, 60]]),
    ],
  },
  {
    id: 'ul4', name: 'Upper / Lower', level: 'Intermediate', goal: 'Strength & size', perWeek: 4,
    desc: 'Four days a week: a heavy day and a volume day for each half of the body.',
    days: [
      day('Upper · Heavy', [['bench', 4, 4, 6, 180], ['barbell_row', 4, 4, 6, 180], ['ohp', 3, 6, 8, 150], ['chinup', 3, 6, 10, 120], ['skullcrusher', 2, 8, 12, 90]]),
      day('Lower · Heavy', [['squat', 4, 4, 6, 180], ['rdl', 3, 6, 8, 150], ['leg_press', 3, 8, 10, 120], ['calf_raise', 3, 8, 12, 75], ['plank', 3, 30, 60, 60]]),
      day('Upper · Volume', [['incline_db', 4, 8, 12, 120], ['lat_pulldown', 4, 8, 12, 120], ['db_shoulder', 3, 10, 12, 90], ['cable_row', 3, 10, 12, 90], ['lateral_raise', 3, 12, 20, 60], ['db_curl', 3, 10, 15, 60]]),
      day('Lower · Volume', [['front_squat', 3, 8, 10, 150], ['hip_thrust', 3, 8, 12, 120], ['bulgarian', 3, 10, 12, 90], ['leg_curl', 3, 10, 15, 75], ['leg_ext', 3, 12, 15, 60], ['seated_calf', 3, 12, 20, 60]]),
    ],
  },
  {
    id: 'db_only', name: 'Dumbbell Only', level: 'All levels', goal: 'Muscle', perWeek: 3,
    desc: 'A home-gym program that needs only a pair of dumbbells and a bench.',
    days: [
      day('Upper', [['db_bench', 4, 8, 12, 120], ['db_row', 4, 8, 12, 90], ['db_shoulder', 3, 8, 12, 90], ['lateral_raise', 3, 12, 20, 60], ['hammer_curl', 3, 10, 15, 60], ['oh_ext', 3, 10, 15, 60]]),
      day('Lower', [['goblet_squat', 4, 8, 15, 120], ['db_rdl', 4, 8, 12, 120], ['bulgarian', 3, 8, 12, 90], ['step_up', 3, 10, 12, 75], ['db_calf', 3, 12, 20, 60], ['dead_bug', 3, 10, 15, 45]]),
      day('Full Body', [['incline_db', 3, 8, 12, 90], ['lunge', 3, 10, 12, 90], ['db_row', 3, 10, 12, 90], ['arnold', 3, 10, 12, 75], ['db_curl', 2, 12, 15, 60], ['russian_twist', 3, 12, 20, 45]]),
    ],
  },
  {
    id: 'bw', name: 'Bodyweight Basics', level: 'Beginner', goal: 'Endurance & tone', perWeek: 3,
    desc: 'No equipment at all. Add reps each session; once they get easy, slow the tempo down.',
    days: [
      day('Day A', [['pushup', 3, 8, 20, 75], ['bw_squat', 3, 15, 25, 60], ['pike_pushup', 3, 6, 12, 75], ['glute_bridge', 3, 12, 20, 45], ['plank', 3, 30, 60, 45]]),
      day('Day B', [['bw_lunge', 3, 10, 16, 60], ['diamond_pushup', 3, 6, 15, 75], ['single_leg_rdl', 3, 8, 12, 45], ['bw_calf', 3, 12, 20, 45], ['bicycle', 3, 15, 25, 45], ['side_plank', 2, 20, 45, 45]]),
    ],
  },
];

export const PROGRAM = Object.fromEntries(PROGRAMS.map(p => [p.id, p]));
