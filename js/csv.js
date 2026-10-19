// CSV export, plus import from Strong and Hevy exports (and from WeZza's own CSV).
import { EX, EXERCISES } from './data.js';

const KG_PER_LB = 0.45359237;
const KM_PER_MI = 1.609344;

// ---------- parsing ----------
export function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.slice(0, text.indexOf('\n') >>> 0);
  const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(f => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some(f => f !== '')) rows.push(row);
  const head = (rows.shift() || []).map(h => h.trim());
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const toCSV = rows => rows.map(r => r.map(v => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}).join(',')).join('\n');

// ---------- exercise name matching ----------
const norm = s => s.toLowerCase().replace(/[‐-―]/g, '-').replace(/[^a-z0-9()]+/g, ' ').replace(/\s+/g, ' ').trim();

// Names used by Strong and Hevy for the exercises WeZza already has.
const ALIASES = {
  'bench press (barbell)': 'bench', 'incline bench press (barbell)': 'incline_bench', 'bench press (dumbbell)': 'db_bench',
  'incline bench press (dumbbell)': 'incline_db', 'chest fly (dumbbell)': 'db_fly', 'cable crossover': 'cable_fly', 'cable fly crossovers': 'cable_fly',
  'chest press (machine)': 'machine_press', 'butterfly (pec deck)': 'pec_deck', 'chest fly (machine)': 'pec_deck', 'push up': 'pushup',
  'chest dip': 'dips', 'dips': 'dips', 'pull up': 'pullup', 'chin up': 'chinup', 'lat pulldown (cable)': 'lat_pulldown',
  'lat pulldown (machine)': 'machine_pulldown', 'straight arm pulldown (cable)': 'straight_pulldown', 'seated row (cable)': 'cable_row',
  'seated cable row v grip (cable)': 'cable_row', 'bent over row (barbell)': 'barbell_row', 'barbell row': 'barbell_row',
  'bent over one arm row (dumbbell)': 'db_row', 'dumbbell row': 'db_row', 'seated row (machine)': 'machine_row', 'inverted row': 'inverted_row',
  'face pull (cable)': 'face_pull', 'face pull': 'face_pull', 'overhead press (barbell)': 'ohp', 'shoulder press (barbell)': 'ohp',
  'overhead press (dumbbell)': 'db_shoulder', 'shoulder press (dumbbell)': 'db_shoulder', 'seated overhead press (dumbbell)': 'db_shoulder',
  'arnold press (dumbbell)': 'arnold', 'shoulder press (machine)': 'machine_shoulder', 'lateral raise (dumbbell)': 'lateral_raise',
  'lateral raise (cable)': 'cable_lateral', 'reverse fly (dumbbell)': 'rear_delt', 'rear delt reverse fly (dumbbell)': 'rear_delt',
  'shrug (dumbbell)': 'db_shrug', 'shrug (barbell)': 'bb_shrug', 'bicep curl (barbell)': 'bb_curl', 'bicep curl (dumbbell)': 'db_curl',
  'hammer curl (dumbbell)': 'hammer_curl', 'incline curl (dumbbell)': 'incline_curl', 'bicep curl (cable)': 'cable_curl',
  'triceps pushdown (cable straight bar)': 'pushdown', 'triceps pushdown': 'pushdown', 'triceps rope pushdown': 'rope_pushdown',
  'triceps extension (dumbbell)': 'oh_ext', 'overhead triceps extension (dumbbell)': 'oh_ext', 'skullcrusher (barbell)': 'skullcrusher',
  'skullcrusher (dumbbell)': 'db_skull', 'bench press close grip (barbell)': 'cg_bench', 'close grip bench press': 'cg_bench',
  'bench dip': 'bench_dip', 'diamond push up': 'diamond_pushup', 'wrist curl (dumbbell)': 'wrist_curl', 'farmers walk': 'farmer_carry',
  'squat (barbell)': 'squat', 'full squat': 'squat', 'front squat (barbell)': 'front_squat', 'goblet squat (kettlebell)': 'kb_goblet',
  'goblet squat (dumbbell)': 'goblet_squat', 'goblet squat': 'goblet_squat', 'leg press': 'leg_press', 'leg press (machine)': 'leg_press',
  'bulgarian split squat': 'bulgarian', 'bulgarian split squat (dumbbell)': 'bulgarian', 'lunge (dumbbell)': 'lunge',
  'walking lunge (dumbbell)': 'lunge', 'step up (dumbbell)': 'step_up', 'leg extension (machine)': 'leg_ext', 'squat (bodyweight)': 'bw_squat',
  'air squats': 'bw_squat', 'reverse lunge': 'bw_lunge', 'deadlift (barbell)': 'deadlift', 'romanian deadlift (barbell)': 'rdl',
  'romanian deadlift (dumbbell)': 'db_rdl', 'lying leg curl (machine)': 'leg_curl', 'seated leg curl (machine)': 'seated_leg_curl',
  'hip thrust (barbell)': 'hip_thrust', 'glute bridge': 'glute_bridge', 'kettlebell swing': 'kb_swing', 'good morning (barbell)': 'good_morning',
  'back extension': 'back_ext', 'back extension (hyperextension)': 'back_ext', 'hip adductor (machine)': 'adductor_machine',
  'standing calf raise (machine)': 'calf_raise', 'calf raise (machine)': 'calf_raise', 'seated calf raise (machine)': 'seated_calf',
  'standing calf raise (dumbbell)': 'db_calf', 'plank': 'plank', 'side plank': 'side_plank', 'crunch': 'crunch',
  'hanging leg raise': 'hanging_raise', 'cable crunch': 'cable_crunch', 'crunch (cable)': 'cable_crunch', 'russian twist': 'russian_twist',
  'bicycle crunch': 'bicycle', 'dead bug': 'dead_bug', 'ab wheel': 'ab_wheel', 'pallof press': 'pallof', 'wood chop (cable)': 'woodchop',
  'running': 'run', 'running (treadmill)': 'run', 'treadmill': 'run', 'walking': 'walk', 'cycling': 'bike', 'cycling (indoor)': 'bike',
  'rowing (machine)': 'row_erg', 'rowing machine': 'row_erg', 'elliptical trainer': 'elliptical', 'stair stepper': 'stairs',
  'stair machine': 'stairs', 'jump rope': 'jump_rope', 'swimming': 'swim',
  'triceps extension (cable)': 'cable_oh_ext', 'overhead triceps extension (cable)': 'cable_oh_ext', 'triceps extension (machine)': 'machine_tri_ext',
  'triceps extension (barbell)': 'ez_oh_ext', 'triceps kickback (dumbbell)': 'kickback', 'triceps kickback (cable)': 'cable_kickback',
  'triceps pushdown (cable v bar)': 'vbar_pushdown', 'triceps dip': 'triceps_dip', 'triceps dip (assisted)': 'machine_dip',
  'hack squat': 'hack_squat', 'hack squat (machine)': 'hack_squat', 'squat (smith machine)': 'smith_squat', 'belt squat (machine)': 'belt_squat',
  'pendulum squat (machine)': 'pendulum_squat', 'box squat (barbell)': 'box_squat', 'pause squat (barbell)': 'pause_squat', 'zercher squat (barbell)': 'zercher',
  'split squat (dumbbell)': 'split_squat', 'lunge (barbell)': 'bb_lunge', 'reverse lunge (dumbbell)': 'db_reverse_lunge', 'single leg press (machine)': 'single_leg_press',
  'sumo deadlift (barbell)': 'sumo_deadlift', 'trap bar deadlift': 'trap_bar_deadlift', 'deadlift (trap bar)': 'trap_bar_deadlift',
  'stiff leg deadlift (barbell)': 'stiff_leg', 'rack pull (barbell)': 'rack_pull', 'power clean': 'power_clean', 'push press': 'push_press',
  'hip thrust (machine)': 'machine_hip_thrust', 'hip thrust (smith machine)': 'smith_hip_thrust', 'hip abductor (machine)': 'abductor_machine',
  'glute kickback (machine)': 'machine_glute_kickback', 'glute kickback (cable)': 'cable_glute_kickback', 'nordic hamstring curl': 'nordic_curl',
  'decline bench press (barbell)': 'decline_bench', 'decline bench press (dumbbell)': 'decline_db', 'bench press (smith machine)': 'smith_bench',
  'incline bench press (smith machine)': 'smith_incline', 'incline chest press (machine)': 'incline_machine', 'incline chest fly (dumbbell)': 'incline_fly',
  'pullover (dumbbell)': 'db_pullover', 'floor press (dumbbell)': 'floor_press', 'landmine press': 'landmine_press',
  'pull up (assisted)': 'assisted_pullup', 't bar row': 'tbar_row', 'pendlay row (barbell)': 'pendlay_row', 'chest supported row (dumbbell)': 'chest_supported_row',
  'seal row (barbell)': 'seal_row', 'meadows rows (barbell)': 'meadows_row', 'single arm cable row': 'single_cable_row', 'high row (machine)': 'high_row',
  'front raise (dumbbell)': 'front_raise', 'front raise (cable)': 'cable_front_raise', 'front raise (plate)': 'plate_front_raise',
  'upright row (barbell)': 'upright_row', 'upright row (cable)': 'cable_upright_row', 'lateral raise (machine)': 'machine_lateral',
  'reverse fly (machine)': 'reverse_pec_deck', 'rear delt reverse fly (machine)': 'reverse_pec_deck', 'reverse fly (cable)': 'cable_rear_delt',
  'seated overhead press (barbell)': 'seated_ohp', 'shoulder press (smith machine)': 'smith_ohp', 'handstand push up': 'handstand_pushup',
  'shrug (cable)': 'cable_shrug', 'shrug (smith machine)': 'smith_shrug', 'ez bar biceps curl': 'ez_curl', 'bicep curl (ez bar)': 'ez_curl',
  'preacher curl (barbell)': 'preacher_curl', 'preacher curl (dumbbell)': 'db_preacher', 'preacher curl (machine)': 'machine_curl', 'bicep curl (machine)': 'machine_curl',
  'concentration curl': 'concentration_curl', 'concentration curl (dumbbell)': 'concentration_curl', 'spider curl (dumbbell)': 'spider_curl',
  'hammer curl (cable)': 'rope_hammer', 'reverse curl (barbell)': 'reverse_curl', 'zottman curl': 'zottman_curl',
  'calf press on leg press': 'leg_press_calf', 'calf raise (smith machine)': 'smith_calf', 'sit up': 'sit_up', 'lying leg raise': 'leg_raise',
  'reverse crunch': 'reverse_crunch', 'hanging knee raise': 'knee_raise', 'knee raise (captain s chair)': 'captains_chair', 'toes to bar': 'toes_to_bar',
  'crunch (machine)': 'machine_crunch', 'ab crunch machine': 'machine_crunch', 'hollow rock': 'hollow_hold', 'v up': 'v_up', 'mountain climber': 'mountain_climber',
  'side bend (dumbbell)': 'db_side_bend', 'burpee': 'burpee', 'box jump': 'box_jump', 'battle ropes': 'battle_ropes', 'sled push': 'sled_push',
  'thruster (dumbbell)': 'thruster', 'turkish get up': 'kb_get_up', 'ski erg': 'ski_erg', 'assault bike': 'air_bike', 'air bike': 'air_bike', 'hiking': 'hike',
};

// Rough muscle guesses for exercises WeZza doesn't know, so recovery still works.
const GUESS = [
  [/squat|leg press|lunge|leg extension|step up/, ['quads', 'glutes']], [/deadlift|rdl|leg curl|hamstring|good morning/, ['hamstrings', 'glutes']],
  [/hip thrust|glute|kickback|abduct/, ['glutes']], [/adduct/, ['adductors']], [/calf/, ['calves']],
  [/bench|chest|fly|pec|push up|dip/, ['chest']], [/pulldown|pull up|chin up|pullover|lat /, ['lats']], [/row/, ['upperback', 'lats']],
  [/shrug/, ['traps']], [/lateral|shoulder|overhead press|military|delt|arnold|upright/, ['shoulders']],
  [/curl/, ['biceps']], [/tricep|skull|pushdown|extension/, ['triceps']], [/wrist|grip|carry/, ['forearms']],
  [/crunch|plank|sit up|leg raise|ab |abs|core|hollow/, ['abs']], [/twist|oblique|woodchop/, ['obliques']], [/back extension|hyper/, ['lowerback']],
  [/run|walk|cycl|bike|row|ellip|stair|swim|rope|cardio|hiit/, ['quads']],
];
const CARDIO_RX = /\b(run|running|walk|walking|cycl|cycling|bike|elliptical|stair|swim|jump rope|treadmill|hike|hiking|spin)\b/;

function matcher(custom) {
  const byName = new Map(EXERCISES.map(e => [norm(e.name), e.id]));
  return (name, created) => {
    const n = norm(name);
    if (ALIASES[n]) return ALIASES[n];
    if (byName.has(n)) return byName.get(n);
    const base = n.replace(/\s*\(.*\)$/, '');
    if (ALIASES[base]) return ALIASES[base];
    if (byName.has(base)) return byName.get(base);
    // Create a custom exercise, reusing one made earlier in this import.
    const existing = custom.find(c => norm(c.name) === n);
    if (existing) return existing.id;
    const primary = (GUESS.find(([rx]) => rx.test(n + ' ')) || [null, ['abs']])[1];
    const equipText = (name.match(/\((.*)\)/)?.[1] || '').toLowerCase();
    const cardio = CARDIO_RX.test(n);
    const ex = {
      id: 'c_' + Math.random().toString(36).slice(2, 10), name: name.slice(0, 40), primary, secondary: [],
      equip: [], type: 'compound', ratio: 0, custom: true, imported: true,
      ...(cardio ? { cardio: true } : {}), ...(/bodyweight|^push up|^pull up/.test(equipText + n) ? { bw: true } : {}),
      ...(/barbell/.test(equipText) ? { bar: true } : {}), ...(/dumbbell|kettlebell/.test(equipText) ? { perHand: true } : {}),
    };
    custom.push(ex); created.push(ex);
    return ex.id;
  };
}

// ---------- dates & numbers ----------
const num = v => { const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : 0; };
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

function parseDate(s) {
  s = String(s || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime();
  // Hevy: "15 Jan 2024, 08:30"
  m = s.match(/^(\d{1,2}) (\w{3})\w* (\d{4}),? (\d{1,2}):(\d{2})/);
  if (m && MONTHS[m[2].toLowerCase()] != null) return new Date(+m[3], MONTHS[m[2].toLowerCase()], +m[1], +m[4], +m[5]).getTime();
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

// Strong: "1h 5m", "45m", "50s"
function parseDuration(s) {
  s = String(s || '');
  const h = +(s.match(/(\d+)\s*h/)?.[1] || 0), m = +(s.match(/(\d+)\s*m(?!s)/)?.[1] || 0), sec = +(s.match(/(\d+)\s*s/)?.[1] || 0);
  return (h * 3600 + m * 60 + sec) * 1000;
}

/**
 * Turn a Strong, Hevy or WeZza CSV export into workouts.
 * Returns { workouts, created, source } (created = new custom exercises).
 */
export function importCSV(text, state) {
  const rows = parseCSV(text);
  if (!rows.length) throw new Error('empty');
  const cols = Object.keys(rows[0]);
  const has = c => cols.includes(c);
  const custom = [...state.custom], created = [];
  const match = matcher(custom);
  const byKey = new Map();
  let source;

  const add = (key, start, end, title, notes, exName, exNotes, superset, set) => {
    if (!start) return;
    let w = byKey.get(key);
    if (!w) {
      w = { id: Math.random().toString(36).slice(2, 10), start, end: end || start + 3600e3, title: title || 'Workout', notes: notes || '', exercises: [], imported: true };
      byKey.set(key, w);
    }
    const exId = match(exName, created);
    let ex = w.exercises.at(-1);
    if (!ex || ex.exId !== exId) { ex = { exId, sets: [], superset: superset || null, notes: exNotes || '' }; w.exercises.push(ex); }
    ex.sets.push({ done: true, ...set });
  };

  if (has('exercise_title')) {
    // Hevy
    source = 'Hevy';
    const lb = has('weight_lbs'), mi = has('distance_miles');
    for (const r of rows) {
      const type = (r.set_type || '').toLowerCase();
      const set = {
        weight: lb ? num(r.weight_lbs) * KG_PER_LB : num(r.weight_kg), reps: Math.round(num(r.reps)),
        ...(num(r.distance_km || r.distance_miles) ? { dist: mi ? num(r.distance_miles) * KM_PER_MI : num(r.distance_km) } : {}),
        ...(num(r.duration_seconds) ? { time: num(r.duration_seconds) } : {}),
        ...(num(r.rpe) ? { rpe: num(r.rpe) } : {}),
      };
      if (type === 'warmup') set.warmup = true;
      else if (type === 'dropset') set.kind = 'drop';
      else if (type === 'failure') set.kind = 'failure';
      const start = parseDate(r.start_time);
      const ss = r.superset_id ? 'ABCDEFGHIJ'[num(r.superset_id) % 10] : null;
      add(r.start_time + r.title, start, parseDate(r.end_time), r.title, r.description, r.exercise_title, r.exercise_notes, ss, set);
    }
  } else if (has('Exercise Name')) {
    // Strong (and WeZza's own export, which uses the same layout)
    source = has('WeZza') ? 'WeZza' : 'Strong';
    const wCol = cols.find(c => /^weight/i.test(c)), dCol = cols.find(c => /^distance/i.test(c));
    const lb = /lb/i.test(wCol || '') || (!/kg/i.test(wCol || '') && state.profile.unit === 'lb');
    const mi = /mi/i.test(dCol || '') || (!/km/i.test(dCol || '') && state.profile.unit === 'lb');
    for (const r of rows) {
      const order = String(r['Set Order'] || '');
      if (/rest/i.test(order)) continue;
      const time = num(r.Seconds);
      const set = {
        weight: num(r[wCol]) * (lb ? KG_PER_LB : 1), reps: Math.round(num(r.Reps)),
        ...(num(r[dCol]) ? { dist: num(r[dCol]) * (mi ? KM_PER_MI : 1) } : {}),
        ...(time ? { time } : {}), ...(num(r.RPE) ? { rpe: num(r.RPE) } : {}),
      };
      if (/^w/i.test(order)) set.warmup = true;
      else if (/^d/i.test(order)) set.kind = 'drop';
      else if (/^f/i.test(order)) set.kind = 'failure';
      const start = parseDate(r.Date);
      const dur = parseDuration(r.Duration);
      add(r.Date + r['Workout Name'], start, dur ? start + dur : 0, r['Workout Name'], r['Workout Notes'], r['Exercise Name'], r.Notes, r.Superset || null, set);
    }
  } else throw new Error('unknown format');

  // Timed holds (e.g. planks) come through as seconds with no reps.
  const workouts = [...byKey.values()];
  for (const w of workouts) for (const ex of w.exercises) {
    const d = EX[ex.exId] || custom.find(c => c.id === ex.exId);
    for (const s of ex.sets) if (!d?.cardio && !s.reps && s.time) { s.reps = Math.round(s.time); delete s.time; if (d?.imported) d.timed = true; }
    if (d?.imported && !d.cardio && ex.sets.every(s => !s.weight)) d.bw = true;
  }
  return { workouts, created, source };
}

/** Export every logged set in a Strong-compatible layout. */
export function exportCSV(state) {
  const lb = state.profile.unit === 'lb';
  const rows = [['Date', 'Workout Name', 'Duration', 'Exercise Name', 'Set Order', lb ? 'Weight (lbs)' : 'Weight (kg)', 'Reps',
    lb ? 'Distance (mi)' : 'Distance (km)', 'Seconds', 'Notes', 'Workout Notes', 'RPE', 'Superset', 'WeZza']];
  const pad = n => String(n).padStart(2, '0');
  const fmt = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  for (const w of [...state.workouts].sort((a, b) => a.start - b.start)) {
    const mins = Math.round(((w.end || w.start) - w.start) / 60000);
    const dur = `${Math.floor(mins / 60) ? Math.floor(mins / 60) + 'h ' : ''}${mins % 60}m`;
    for (const ex of w.exercises) {
      const d = EX[ex.exId];
      let n = 0;
      for (const s of ex.sets.filter(x => x.done !== false)) {
        const order = s.warmup ? 'W' : s.kind === 'drop' ? 'D' : s.kind === 'failure' ? 'F' : ++n;
        const secs = s.time || (d?.timed ? s.reps : '');
        rows.push([fmt(w.start), w.title || 'Workout', dur, d?.name || ex.exId, order,
          s.weight ? +(s.weight / (lb ? KG_PER_LB : 1)).toFixed(2) : 0, d?.timed ? 0 : s.reps || 0,
          s.dist ? +(s.dist / (lb ? KM_PER_MI : 1)).toFixed(3) : '', secs, ex.notes || '', w.notes || '', s.rpe || '', ex.superset || '', 1]);
      }
    }
  }
  return toCSV(rows);
}
