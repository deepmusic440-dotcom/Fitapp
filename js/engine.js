// Training logic: recovery model, workout generation, progressive overload, stats.
import { MUSCLES, EXERCISES, EX, FOCUS } from './data.js';

const HOUR = 3600e3;
const KG_PER_LB = 0.45359237;

// ---------- units ----------
export const toDisplay = (kg, unit) => unit === 'lb' ? kg / KG_PER_LB : kg;
export const fromDisplay = (v, unit) => unit === 'lb' ? v * KG_PER_LB : v;
export const fmtW = (kg, unit) => {
  const v = toDisplay(kg, unit);
  return (Math.round(v * 2) / 2).toString();
};

function increment(ex, unit) {
  // Smallest sensible jump, expressed in kg.
  if (unit === 'lb') return fromDisplay(ex.perHand || ex.type === 'isolation' ? 5 : (ex.bar ? 5 : 10), 'lb');
  if (ex.perHand) return 2;
  if (ex.type === 'isolation') return 2.5;
  return ex.bar ? 2.5 : 5;
}

function roundLoad(kg, ex, unit) {
  const step = unit === 'lb' ? fromDisplay(5, 'lb') : (ex.perHand ? 2 : 2.5);
  let r = Math.round(kg / step) * step;
  if (ex.bar) r = Math.max(r, unit === 'lb' ? fromDisplay(45, 'lb') : 20);
  return Math.max(r, step);
}

// ---------- history helpers ----------
export const workingSets = ex => ex.sets.filter(s => s.done && !s.warmup && s.reps > 0);

export function e1rm(w, r) {
  if (!w || !r) return 0;
  return r === 1 ? w : w * (1 + r / 30);
}

/** All completed instances of an exercise, newest first. */
export function exerciseHistory(state, exId) {
  const out = [];
  for (const w of state.workouts) {
    for (const ex of w.exercises) {
      if (ex.exId === exId) {
        const sets = workingSets(ex);
        if (sets.length) out.push({ date: w.end || w.start, sets });
      }
    }
  }
  return out.sort((a, b) => b.date - a.date);
}

// ---------- recovery ----------
/** Fatigue contribution per completed set: primary 1, secondary 0.5. */
export function muscleFatigue(state, now = Date.now()) {
  const f = Object.fromEntries(Object.keys(MUSCLES).map(m => [m, 0]));
  for (const w of state.workouts) {
    const t = w.end || w.start;
    const hrs = (now - t) / HOUR;
    if (hrs > 24 * 7) continue;
    const load = {};
    for (const ex of w.exercises) {
      const def = EX[ex.exId];
      if (!def) continue;
      const n = workingSets(ex).length;
      def.primary.forEach(m => load[m] = (load[m] || 0) + n);
      def.secondary.forEach(m => load[m] = (load[m] || 0) + n * 0.5);
    }
    for (const [m, l] of Object.entries(load)) {
      const tau = MUSCLES[m].tau;
      f[m] += Math.min(100, l * 11) * Math.exp(-Math.max(0, hrs) / tau);
    }
  }
  for (const m in f) f[m] = Math.min(100, f[m]);
  return f;
}

export function recovery(state, now) {
  const f = muscleFatigue(state, now);
  return Object.fromEntries(Object.entries(f).map(([m, v]) => [m, Math.round(100 - v)]));
}

// ---------- prescriptions ----------
const SCHEMES = {
  strength:    { compound: { sets: 5, lo: 3, hi: 6, pct: 0.85, rest: 180 }, isolation: { sets: 3, lo: 6, hi: 10, pct: 0.75, rest: 90 } },
  hypertrophy: { compound: { sets: 4, lo: 6, hi: 10, pct: 0.75, rest: 120 }, isolation: { sets: 3, lo: 10, hi: 15, pct: 0.65, rest: 75 } },
  endurance:   { compound: { sets: 3, lo: 12, hi: 20, pct: 0.6, rest: 60 }, isolation: { sets: 3, lo: 15, hi: 25, pct: 0.5, rest: 45 } },
};
const TIMED = { strength: [30, 45], hypertrophy: [30, 60], endurance: [45, 90] };
const LEVEL = { beginner: 0.6, intermediate: 1, advanced: 1.35 };

export function scheme(profile, ex) {
  const s = { ...SCHEMES[profile.goal][ex.type] };
  if (ex.timed) [s.lo, s.hi] = TIMED[profile.goal];
  else if (ex.bw && !ex.timed) { s.lo = Math.max(s.lo, 8); s.hi = Math.max(s.hi, 15); }
  if (profile.restOverride) s.rest = profile.restOverride;
  return s;
}

/** Target weight (kg) and reps for an exercise based on its history. */
export function prescribe(state, exId) {
  const { profile } = state;
  const ex = EX[exId];
  const s = scheme(profile, ex);
  const hist = exerciseHistory(state, exId);
  const unit = profile.unit;
  let weight, reps = s.lo, note = '';

  if (hist.length) {
    const last = hist[0].sets.filter(x => x.kind !== 'drop').length ? hist[0].sets.filter(x => x.kind !== 'drop') : hist[0].sets;
    const topW = Math.max(...last.map(x => x.weight || 0));
    const atTop = last.filter(x => (x.weight || 0) >= topW);
    const allHit = atTop.every(x => x.reps >= s.hi);
    const missed = atTop.some(x => x.reps < s.lo);
    const best = Math.max(...atTop.map(x => x.reps));
    if (ex.bw && !topW) {
      weight = 0;
      reps = Math.min(best + 1, ex.timed ? s.hi + 30 : s.hi + 10);
      note = best + 1 > s.hi ? 'Add reps or load' : 'Beat last time by 1';
    } else if (allHit) {
      weight = topW + increment(ex, unit);
      reps = s.lo;
      note = `+${fmtW(increment(ex, unit), unit)} ${unit} — you earned it`;
    } else if (missed) {
      const prev = hist[1]?.sets;
      const missedTwice = prev && prev.some(x => x.reps < s.lo && (x.weight || 0) >= topW);
      weight = missedTwice ? roundLoad(topW * 0.9, ex, unit) : topW;
      reps = s.lo;
      note = missedTwice ? 'Deload 10% to rebuild' : 'Same weight, hit the target';
    } else {
      weight = topW;
      reps = Math.min(s.hi, best + 1);
      note = `Aim for ${reps} reps`;
    }
  } else if (!ex.bw && !ex.ratio) {
    weight = 0;
    note = 'Enter your starting weight';
  } else if (ex.bw) {
    weight = 0;
    reps = ex.timed ? s.lo : Math.round((s.lo + s.hi) / 2 * LEVEL[profile.level]);
    note = 'First time — find your baseline';
  } else {
    const sex = profile.sex === 'female' ? 0.7 : 1;
    const base = profile.bodyweight * ex.ratio * LEVEL[profile.level] * sex;
    weight = roundLoad(base * (s.pct / 0.75), ex, unit);
    note = 'Starting estimate — adjust freely';
  }
  return { weight, reps, sets: s.sets, rest: s.rest, lo: s.lo, hi: s.hi, note };
}

function warmups(target, ex, unit) {
  if (ex.type !== 'compound') return [];
  if (target < (unit === 'lb' ? fromDisplay(95, 'lb') : 40)) return [];
  const pts = ex.bar ? [[0, 10], [0.5, 5], [0.75, 3]] : [[0.5, 8], [0.75, 4]];
  return pts.map(([p, r]) => ({
    weight: p === 0 ? roundLoad(0, ex, unit) : roundLoad(target * p, ex, unit),
    reps: r, warmup: true, done: false,
  }));
}

export function buildExercise(state, exId, setsOverride) {
  const p = prescribe(state, exId);
  const n = setsOverride ?? p.sets;
  const sets = Array.from({ length: n }, () => ({ weight: p.weight, reps: p.reps, done: false }));
  const pre = state.profile.warmups ? warmups(p.weight, EX[exId], state.profile.unit) : [];
  return { exId, sets: [...pre, ...sets], rest: p.rest, target: { lo: p.lo, hi: p.hi }, note: p.note };
}

// ---------- generator ----------
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export const available = (state, ex) =>
  ex.equip.every(e => state.profile.equipment.includes(e)) && !state.profile.excluded.includes(ex.id);

function recentIds(state, n = 2) {
  const ids = new Set();
  [...state.workouts].sort((a, b) => b.start - a.start).slice(0, n)
    .forEach(w => w.exercises.forEach(e => ids.add(e.exId)));
  return ids;
}

/**
 * Generate a workout. focus: key of FOCUS or 'custom' with customMuscles.
 * Returns { exercises, targets }.
 */
export function generate(state, { focus = 'auto', customMuscles = [], seed = Date.now() } = {}) {
  const rand = rng(seed);
  const rec = recovery(state);
  const minutes = state.profile.minutes;
  const nEx = Math.max(3, Math.min(8, Math.round(minutes / 10)));
  const pool = focus === 'custom' && customMuscles.length ? customMuscles
    : (FOCUS[focus]?.muscles || Object.keys(MUSCLES));

  const sizeBonus = { L: 12, M: 6, S: 0 };
  let ranked = pool
    .map(m => ({ m, score: rec[m] + sizeBonus[MUSCLES[m].size] + rand() * 14 }))
    .sort((a, b) => b.score - a.score);
  const fresh = ranked.filter(r => rec[r.m] >= 65);
  if (fresh.length >= 2 || focus !== 'auto') ranked = focus === 'auto' ? fresh : ranked;

  const nTargets = focus === 'custom' ? pool.length : Math.min(ranked.length, Math.max(2, Math.ceil(nEx * 0.65)));
  let targets = ranked.slice(0, nTargets).map(r => r.m);
  // Core is a finisher in smart mode, not a headline target.
  if (focus === 'auto') targets = targets.filter(m => !['abs', 'obliques'].includes(m)).slice(0, nTargets);
  const wantCore = state.profile.core && minutes >= 40 && !targets.includes('abs') && rec.abs >= 60
    && (focus === 'auto' || focus === 'full');

  const recent = recentIds(state);
  const histIds = new Set(state.workouts.flatMap(w => w.exercises.map(e => e.exId)));
  const chosen = [];

  const pick = (muscle, preferCompound) => {
    const cands = EXERCISES.filter(e => e.primary.includes(muscle) && available(state, e) && !chosen.includes(e.id));
    if (!cands.length) return null;
    const score = e =>
      (preferCompound && e.type === 'compound' ? 4 : 0) +
      (!preferCompound && e.type === 'isolation' ? 2 : 0) +
      (histIds.has(e.id) ? 1.5 : 0) -
      (recent.has(e.id) ? 2.5 : 0) +
      (state.profile.favorites.includes(e.id) ? 3 : 0) -
      // avoid hammering muscles that are already fatigued as secondaries
      e.secondary.reduce((a, m) => a + (rec[m] < 50 ? 1 : 0), 0) +
      rand() * 3;
    return cands.sort((a, b) => score(b) - score(a))[0].id;
  };

  for (const m of targets) {
    if (chosen.length >= nEx) break;
    const id = pick(m, MUSCLES[m].size !== 'S');
    if (id) chosen.push(id);
  }
  // Extra volume for the freshest large muscles.
  for (const m of targets.filter(m => MUSCLES[m].size === 'L')) {
    if (chosen.length >= nEx - (wantCore ? 1 : 0)) break;
    const id = pick(m, false);
    if (id) chosen.push(id);
  }
  // Fill any remaining slots round-robin.
  for (let i = 0; chosen.length < nEx - (wantCore ? 1 : 0) && i < targets.length * 2; i++) {
    const id = pick(targets[i % targets.length], false);
    if (id) chosen.push(id);
  }
  if (wantCore) { const id = pick(rand() < 0.65 ? 'abs' : 'obliques', false); if (id) chosen.push(id); }

  // Compounds first, then isolation, core last.
  const order = id => {
    const e = EX[id];
    if (e.primary.some(m => m === 'abs' || m === 'obliques')) return 3;
    return e.type === 'compound' ? (e.bar ? 0 : 1) : 2;
  };
  chosen.sort((a, b) => order(a) - order(b));

  let exercises = chosen.map(id => buildExercise(state, id));
  exercises = fitToTime(exercises, minutes);
  return { exercises, targets };
}

export function estimateMinutes(exercises) {
  let sec = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) sec += (EX[ex.exId].timed ? s.reps : 40) + (s.warmup ? 45 : ex.rest);
    sec += 60; // setup / transition
  }
  return Math.round(sec / 60);
}

function fitToTime(exercises, minutes) {
  let guard = 50;
  while (estimateMinutes(exercises) > minutes * 1.1 && guard--) {
    // trim a working set from the exercise with the most, isolation first
    const cands = exercises
      .map((e, i) => ({ i, n: e.sets.filter(s => !s.warmup).length, iso: EX[e.exId].type === 'isolation' }))
      .filter(c => c.n > 2)
      .sort((a, b) => (b.iso - a.iso) || (b.n - a.n));
    if (!cands.length) { if (exercises.length > 3) { exercises.pop(); continue; } break; }
    exercises[cands[0].i].sets.pop();
  }
  return exercises;
}

export function alternatives(state, exId, exclude = []) {
  const ex = EX[exId];
  return EXERCISES
    .filter(e => e.id !== exId && !exclude.includes(e.id) && available(state, e) && e.primary.some(m => ex.primary.includes(m)))
    .sort((a, b) => (b.primary[0] === ex.primary[0]) - (a.primary[0] === ex.primary[0]) || (b.type === ex.type) - (a.type === ex.type));
}

// ---------- stats ----------
export function workoutVolume(w) {
  return w.exercises.reduce((a, ex) => a + workingSets(ex).reduce((b, s) => b + (s.weight || 0) * (EX[ex.exId]?.timed ? 0 : s.reps), 0), 0);
}

export function personalBests(state, exId, before = Infinity) {
  let best1rm = 0, bestW = 0, bestReps = 0;
  for (const h of exerciseHistory(state, exId)) {
    if (h.date >= before) continue;
    for (const s of h.sets) {
      best1rm = Math.max(best1rm, e1rm(s.weight, s.reps));
      bestW = Math.max(bestW, s.weight || 0);
      bestReps = Math.max(bestReps, s.reps);
    }
  }
  return { best1rm, bestW, bestReps };
}

/** PRs achieved in a workout, compared to everything before it. */
export function workoutPRs(state, w) {
  const prs = [];
  for (const ex of w.exercises) {
    const sets = workingSets(ex);
    if (!sets.length) continue;
    const def = EX[ex.exId];
    const prev = personalBests(state, ex.exId, w.start);
    const hadHistory = exerciseHistory(state, ex.exId).some(h => h.date < w.start);
    if (!hadHistory) continue;
    const b1 = Math.max(...sets.map(s => e1rm(s.weight, s.reps)));
    const bw = Math.max(...sets.map(s => s.weight || 0));
    const br = Math.max(...sets.map(s => s.reps));
    if (def.bw && !bw) { if (br > prev.bestReps) prs.push({ exId: ex.exId, kind: def.timed ? 'Longest hold' : 'Most reps', value: br }); }
    else if (bw > prev.bestW) prs.push({ exId: ex.exId, kind: 'Heaviest weight', value: bw, w: true });
    else if (b1 > prev.best1rm * 1.001) prs.push({ exId: ex.exId, kind: 'Est. 1RM', value: b1, w: true });
  }
  return prs;
}

export function streakWeeks(state) {
  if (!state.workouts.length) return 0;
  const weekOf = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const weeks = new Set(state.workouts.map(w => weekOf(w.start)));
  let cur = weekOf(Date.now()), n = 0;
  if (!weeks.has(cur)) cur -= 7 * 24 * HOUR; // this week isn't over yet
  while (weeks.has(cur)) { n++; cur = weekOf(cur - 3 * 24 * HOUR); }
  return n;
}

export function weeklyVolume(state, weeks = 8) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = now.getTime() - i * 7 * 24 * HOUR, end = start + 7 * 24 * HOUR;
    const ws = state.workouts.filter(w => w.start >= start && w.start < end);
    out.push({ start, volume: ws.reduce((a, w) => a + workoutVolume(w), 0), count: ws.length });
  }
  return out;
}

export function setsPerMuscle(state, days = 7) {
  const since = Date.now() - days * 24 * HOUR;
  const out = Object.fromEntries(Object.keys(MUSCLES).map(m => [m, 0]));
  for (const w of state.workouts) {
    if (w.start < since) continue;
    for (const ex of w.exercises) {
      const n = workingSets(ex).length;
      EX[ex.exId]?.primary.forEach(m => out[m] += n);
      EX[ex.exId]?.secondary.forEach(m => out[m] += n * 0.5);
    }
  }
  return out;
}

/** Plates per side for a barbell load (kg in, display unit plates out). */
export function plates(totalKg, unit) {
  const bar = unit === 'lb' ? 45 : 20;
  const avail = unit === 'lb' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25];
  let side = (toDisplay(totalKg, unit) - bar) / 2;
  const out = [];
  if (side < 0) return { bar, plates: [], remainder: 0 };
  for (const p of avail) while (side >= p - 1e-6) { out.push(p); side -= p; }
  return { bar, plates: out, remainder: Math.round(side * 100) / 100 };
}

// ---------- custom exercises ----------
export function registerCustom(list) {
  for (const e of list) {
    if (EX[e.id]) Object.assign(EX[e.id], e);
    else { EXERCISES.push(e); EX[e.id] = e; }
  }
}

// ---------- achievements ----------
export function longestStreak(state) {
  const weekOf = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const weeks = [...new Set(state.workouts.map(w => weekOf(w.start)))].sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const wk of weeks) {
    run = prev !== null && Math.round((wk - prev) / (7 * 24 * HOUR)) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = wk;
  }
  return best;
}

const ratioLift = (state, id, ratio) => {
  const bw = state.profile.bodyweight;
  return exerciseHistory(state, id).some(h => h.sets.some(s => s.weight >= bw * ratio && s.reps >= 1));
};

export const BADGES = [
  { id: 'first', icon: '🎯', name: 'First Rep', desc: 'Finish your first workout', goal: 1, get: c => c.n },
  { id: 'w10', icon: '💪', name: 'Committed', desc: 'Finish 10 workouts', goal: 10, get: c => c.n },
  { id: 'w50', icon: '🏋️', name: 'Dedicated', desc: 'Finish 50 workouts', goal: 50, get: c => c.n },
  { id: 'w100', icon: '💯', name: 'Centurion', desc: 'Finish 100 workouts', goal: 100, get: c => c.n },
  { id: 'streak4', icon: '🔥', name: 'On a Roll', desc: 'Train 4 weeks in a row', goal: 4, get: c => c.streak },
  { id: 'streak12', icon: '☄️', name: 'Unstoppable', desc: 'Train 12 weeks in a row', goal: 12, get: c => c.streak },
  { id: 'vol10k', icon: '🧱', name: '10 Tonnes', desc: 'Lift 10,000 kg total', goal: 1e4, get: c => c.vol },
  { id: 'vol100k', icon: '🏗️', name: '100 Tonnes', desc: 'Lift 100,000 kg total', goal: 1e5, get: c => c.vol },
  { id: 'vol1m', icon: '🌋', name: 'Million Club', desc: 'Lift 1,000,000 kg total', goal: 1e6, get: c => c.vol },
  { id: 'pr1', icon: '🏆', name: 'Record Breaker', desc: 'Set your first PR', goal: 1, get: c => c.prs },
  { id: 'pr25', icon: '👑', name: 'PR Machine', desc: 'Set 25 PRs', goal: 25, get: c => c.prs },
  { id: 'explorer', icon: '🧭', name: 'Explorer', desc: 'Try 25 different exercises', goal: 25, get: c => c.variety },
  { id: 'early', icon: '🌅', name: 'Early Bird', desc: 'Start a workout before 7am', goal: 1, get: c => c.early },
  { id: 'night', icon: '🌙', name: 'Night Owl', desc: 'Start a workout after 9pm', goal: 1, get: c => c.night },
  { id: 'bwbench', icon: '🛡️', name: 'Bodyweight Bench', desc: 'Bench press your bodyweight', goal: 1, get: c => c.bwbench },
  { id: 'squat15', icon: '🦵', name: 'Big Squat', desc: 'Squat 1.5× bodyweight', goal: 1, get: c => c.squat15 },
  { id: 'dl2', icon: '⚡', name: 'Double Pull', desc: 'Deadlift 2× bodyweight', goal: 1, get: c => c.dl2 },
];

export function achievements(state) {
  const ws = state.workouts;
  const c = {
    n: ws.length,
    streak: longestStreak(state),
    vol: ws.reduce((a, w) => a + workoutVolume(w), 0),
    prs: ws.reduce((a, w) => a + (w.prs?.length || 0), 0),
    variety: new Set(ws.flatMap(w => w.exercises.map(e => e.exId))).size,
    early: +ws.some(w => new Date(w.start).getHours() < 7),
    night: +ws.some(w => new Date(w.start).getHours() >= 21),
    bwbench: +ratioLift(state, 'bench', 1),
    squat15: +ratioLift(state, 'squat', 1.5),
    dl2: +ratioLift(state, 'deadlift', 2),
  };
  return BADGES.map(b => { const v = b.get(c); return { ...b, value: v, earned: v >= b.goal, pct: Math.min(1, v / b.goal) }; });
}

/** Reps achievable at a given fraction of 1RM (inverse Epley). */
export const repsAtPct = p => p >= 1 ? 1 : Math.max(1, Math.round(30 * (1 / p - 1)));
