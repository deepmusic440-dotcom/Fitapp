import { MUSCLES, EQUIPMENT, FOCUS, EXERCISES, EX } from './data.js';
import * as G from './engine.js';
import { bodyMap, heatColor } from './body.js';
import { CUES } from './cues.js';
import { PROGRAMS, PROGRAM } from './programs.js';
import { importCSV, exportCSV } from './csv.js';

const KEY = 'wezza.v1';
const LEGACY_KEYS = ['forge.v1'];
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT = {
  profile: {
    onboarded: false, name: '', goal: 'hypertrophy', level: 'intermediate', sex: 'male',
    bodyweight: 75, unit: 'kg', minutes: 45, equipment: Object.keys(EQUIPMENT),
    excluded: [], favorites: [], warmups: true, core: true, restOverride: 0, sound: true, weeklyGoal: 3, rpe: false,
  },
  workouts: [],
  routines: [],
  custom: [],
  body: [],
  active: null,
  plan: null,
  program: null, // { id, day, done, started }
  ui: { tab: 'train', focus: 'auto', custom: [], progressEx: null, calMonth: null, histN: 30 },
};

let state = load();
function load() {
  try {
    let raw = localStorage.getItem(KEY);
    for (const k of LEGACY_KEYS) if (!raw) raw = localStorage.getItem(k);
    const s = JSON.parse(raw);
    if (s) return { ...DEFAULT, ...s, profile: { ...DEFAULT.profile, ...s.profile }, ui: { ...DEFAULT.ui, ...s.ui } };
  } catch {}
  return structuredClone(DEFAULT);
}
G.registerCustom(state.custom);
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

const unit = () => state.profile.unit;
const W = kg => G.fmtW(kg, unit());

// Distances are stored in km and shown in mi for imperial users.
const KM_PER_MI = 1.609344;
const distUnit = () => unit() === 'lb' ? 'mi' : 'km';
const toDist = km => unit() === 'lb' ? km / KM_PER_MI : km;
const fromDist = v => unit() === 'lb' ? v * KM_PER_MI : v;
const D = km => +toDist(km).toFixed(2);
const fmtPace = s => { const p = G.pace(s) * (unit() === 'lb' ? KM_PER_MI : 1); return p ? `${fmtDur(p * 1000)}/${distUnit()}` : ''; };

/** One set as short text, e.g. "100×5 @8", "12 reps", "5 km · 25:00". */
function setText(d, s) {
  if (d?.cardio) return [s.dist ? `${D(s.dist)} ${distUnit()}` : '', s.time ? fmtDur(s.time * 1000) : ''].filter(Boolean).join(' · ') || '—';
  const base = d?.bw && !s.weight ? `${s.reps}${d.timed ? 's' : ''}` : `${W(s.weight)}×${s.reps}`;
  return (s.kind ? s.kind[0].toUpperCase() + ':' : '') + base + (s.rpe ? ` @${s.rpe}` : '');
}
const prText = p => p.w ? `${W(p.value)} ${unit()}` : p.dist ? `${D(p.value)} ${distUnit()}` : p.time ? fmtDur(p.value * 1000) : p.value;
const workoutDist = w => G.totalDistance([w]);

// ---------- small UI helpers ----------
const chip = (act, val, label, on, extra = '') =>
  `<button class="chip${on ? ' on' : ''}" data-act="${act}" data-val="${esc(val)}" ${extra}>${label}</button>`;

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}

function fmtDur(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}
const fmtDate = t => new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const fmtBig = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'k' : Math.round(n).toLocaleString();
const musclesOf = e => [...e.primary, ...e.secondary].map(m => MUSCLES[m].name);

function icon(name) {
  const p = {
    train: 'M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11',
    progress: 'M3 20h18M6 16l4-5 3 3 6-8',
    history: 'M12 7v5l3 2M3.05 11a9 9 0 1 1 .5 4M3 4v5h5',
    profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    swap: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
    x: 'M6 6l12 12M18 6 6 18',
    plus: 'M12 5v14M5 12h14',
    check: 'M5 12l5 5L20 7',
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
    info: 'M12 16v-5M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    plate: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    flame: 'M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7z',
    trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    note: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
    share: 'M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
    timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6',
    calc: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
    save: 'M5 3h11l3 3v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 3v5h7M8 21v-7h8v7',
    scale: 'M5 21h14a1 1 0 0 0 1-1l-1-14a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1L4 20a1 1 0 0 0 1 1zM12 9l2-2',
    play: 'M7 4l13 8-13 8z',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    upload: 'M12 15V3M7 8l5-5 5 5M5 21h14',
    edit: 'M4 20h4L19 9l-4-4L4 16v4z',
  }[name];
  return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`;
}

// ---------- rendering ----------
const app = $('#app');

function render() {
  if (!state.profile.onboarded) { app.innerHTML = onboardingView(); return; }
  if (state.active) { app.innerHTML = activeView(); updateTimers(); return; }
  const views = { train: trainView, progress: progressView, history: historyView, profile: profileView };
  app.innerHTML = `<main class="view">${views[state.ui.tab]()}</main>${navView()}`;
}

function navView() {
  const tabs = [['train', 'Train'], ['progress', 'Progress'], ['history', 'History'], ['profile', 'Profile']];
  return `<nav class="tabbar">${tabs.map(([k, l]) =>
    `<button data-act="tab" data-val="${k}" class="${state.ui.tab === k ? 'on' : ''}">${icon(k)}<span>${l}</span></button>`).join('')}</nav>`;
}

// ----- onboarding -----
function onboardingView() {
  const p = state.profile;
  return `<main class="view onboard">
    <div class="brand"><img class="logo" src="icons/icon.svg" alt=""><h1>WeZza</h1></div>
    <p class="lede">Workouts that adapt to how recovered each muscle is, and get a little harder every time you beat them.</p>

    <section class="card">
      <h3>Your goal</h3>
      <div class="chips">
        ${chip('p-goal', 'strength', 'Get stronger', p.goal === 'strength')}
        ${chip('p-goal', 'hypertrophy', 'Build muscle', p.goal === 'hypertrophy')}
        ${chip('p-goal', 'endurance', 'Endurance & tone', p.goal === 'endurance')}
      </div>
      <h3>Experience</h3>
      <div class="chips">
        ${chip('p-level', 'beginner', 'New to lifting', p.level === 'beginner')}
        ${chip('p-level', 'intermediate', '1–3 years', p.level === 'intermediate')}
        ${chip('p-level', 'advanced', '3+ years', p.level === 'advanced')}
      </div>
    </section>

    <section class="card">
      <h3>About you <small>used to estimate starting weights</small></h3>
      <div class="row">
        <label class="field grow">Bodyweight
          <input type="number" inputmode="decimal" data-field="bodyweight" value="${W(p.bodyweight)}">
        </label>
        <div class="seg">${chip('p-unit', 'kg', 'kg', p.unit === 'kg')}${chip('p-unit', 'lb', 'lb', p.unit === 'lb')}</div>
      </div>
      <div class="chips">
        ${chip('p-sex', 'male', 'Male', p.sex === 'male')}
        ${chip('p-sex', 'female', 'Female', p.sex === 'female')}
      </div>
    </section>

    <section class="card">
      <h3>Equipment you have</h3>
      <div class="chips">${Object.entries(EQUIPMENT).map(([k, l]) => chip('p-equip', k, l, p.equipment.includes(k))).join('')}</div>
      <p class="hint">No equipment? Deselect everything — bodyweight workouts work too.</p>
    </section>

    <section class="card">
      <h3>Session length</h3>
      <div class="chips">${[20, 30, 45, 60, 75, 90].map(m => chip('p-min', m, m + ' min', p.minutes === m)).join('')}</div>
    </section>

    <button class="btn primary big" data-act="finish-onboard">Build my first workout</button>
  </main>`;
}

// ----- train -----
function trainView() {
  const rec = G.recovery(state);
  const ui = state.ui;
  if (!state.plan) { if (state.program) planFromProgram(); else newPlan(); }
  const plan = state.plan;
  const streak = G.streakWeeks(state);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const fresh = Object.values(rec).filter(v => v >= 90).length;
  const selecting = ui.focus === 'custom';

  return `
  <header class="top">
    <div><p class="eyebrow">${greet}${state.profile.name ? ', ' + esc(state.profile.name) : ''}</p>
    <h1>Today's workout</h1></div>
    <div class="row tight">
      ${streak ? `<div class="streak" title="Weekly streak">${icon('flame')}<b>${streak}</b><span>wk</span></div>` : ''}
      ${goalRing(52)}
    </div>
  </header>

  <section class="card mapcard">
    <div class="cardhead">
      <h3>${selecting ? 'Tap muscles to target' : 'Muscle recovery'}</h3>
      <span class="muted">${selecting ? `${ui.custom.length} selected` : `${fresh}/${Object.keys(MUSCLES).length} fully fresh`}</span>
    </div>
    ${bodyMap(rec, selecting ? { mode: 'select', selected: new Set(ui.custom) } : {})}
    ${selecting ? '' : `<div class="legend"><span>Fatigued</span><i style="background:linear-gradient(90deg,${heatColor(0)},${heatColor(50)},${heatColor(100)})"></i><span>Fresh</span></div>`}
    <div class="recgrid">${Object.entries(rec).sort((a, b) => a[1] - b[1]).slice(0, 4).map(([m, v]) =>
      `<div><span class="dot" style="background:${heatColor(v)}"></span>${MUSCLES[m].name}<b>${v}%</b></div>`).join('')}</div>
  </section>

  <div class="chips scroll">
    ${Object.entries(FOCUS).map(([k, f]) => chip('focus', k, f.name, ui.focus === k)).join('')}
    ${chip('focus', 'custom', 'Pick muscles', selecting)}
  </div>

  ${programCard()}
  ${routinesRow()}

  <section class="plan">
    <div class="cardhead">
      <div><h3>${plan.title ? esc(plan.title) : `${plan.exercises.length} exercises`}</h3>
        <p class="muted sm">${plan.title ? `${plan.exercises.length} exercises · ` : ''}~${G.estimateMinutes(plan.exercises)} min</p></div>
      <div class="row tight">
        <button class="btn ghost sm" data-act="save-routine" data-val="plan" aria-label="Save as routine" ${plan.exercises.length ? '' : 'disabled'}>${icon('save')}</button>
        <button class="btn ghost sm" data-act="time-cycle">${state.profile.minutes} min</button>
        <button class="btn ghost sm" data-act="regen" aria-label="Regenerate">${icon('refresh')}</button>
      </div>
    </div>
    ${plan.exercises.length ? plan.exercises.map((e, i) => planItem(e, i)).join('') :
      `<div class="empty">No exercises match. ${selecting ? 'Tap a muscle above.' : 'Add equipment in Profile.'}</div>`}
    <button class="btn ghost wide" data-act="add-ex" data-ctx="plan">${icon('plus')} Add exercise</button>
  </section>

  <div class="sticky-cta"><button class="btn primary big" data-act="start" ${plan.exercises.length ? '' : 'disabled'}>Start workout</button></div>`;
}

function planItem(e, i) {
  const d = EX[e.exId];
  const work = e.sets.filter(s => !s.warmup);
  const s0 = work[0] || { reps: 0, weight: 0 };
  const load = d.cardio ? (s0.dist || s0.time ? setText(d, s0) : 'Log distance & time')
    : d.bw && !s0.weight ? (d.timed ? `${s0.reps}s` : `${s0.reps} reps`) : `${s0.reps}${d.timed ? 's' : ''} × ${W(s0.weight)} ${unit()}${d.perHand ? ' ea' : ''}`;
  const range = e.range && !d.cardio ? ` <span class="muted sm">(${e.range.lo === e.range.hi ? e.range.lo : `${e.range.lo}–${e.range.hi}`}${d.timed ? 's' : ''})</span>` : '';
  return `<article class="exrow ${e.superset ? 'ss' : ''}" ${e.superset ? `style="--ss:${ssColor(e.superset)}"` : ''}>
    <div class="exnum">${e.superset ? esc(e.superset) : i + 1}</div>
    <div class="exmain" data-act="ex-info" data-val="${d.id}">
      <h4>${esc(d.name)}</h4>
      <p>${d.cardio ? load : `${work.length} sets · ${load}${range}`}</p>
      <p class="muted sm">${d.primary.map(m => MUSCLES[m].name).join(', ')}${e.note ? ` · <span class="accent">${esc(e.note)}</span>` : ''}</p>
    </div>
    <button class="icbtn" data-act="swap" data-ctx="plan" data-i="${i}" aria-label="Swap">${icon('swap')}</button>
    <button class="icbtn" data-act="remove" data-ctx="plan" data-i="${i}" aria-label="Remove">${icon('x')}</button>
  </article>`;
}

function goalRing(size) {
  const goal = state.profile.weeklyGoal;
  const n = G.weeklyVolume(state, 1)[0].count;
  const r = size / 2 - 5, c = 2 * Math.PI * r, pct = Math.min(1, n / goal);
  return `<button class="ring" data-act="tab" data-val="progress" title="${n} of ${goal} workouts this week" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c * pct} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>
    <span><b>${n}</b>/${goal}</span></button>`;
}

const SS_COLORS = ['#ff8a3d', '#3ec7ff', '#c084fc', '#ff5c93', '#facc15'];
const ssColor = g => SS_COLORS[(g.charCodeAt(0) - 65) % SS_COLORS.length];

function routinesRow() {
  const rs = state.routines;
  if (!rs.length) return '';
  return `<section><div class="cardhead"><h3>My routines</h3><span class="muted sm">${rs.length}</span></div>
    <div class="routines">${rs.map(r => `<button class="routine" data-act="open-routine" data-val="${r.id}">
      <b>${esc(r.name)}</b><span class="muted sm">${r.exercises.length} exercises</span>
      <span class="muted sm">${r.exercises.slice(0, 3).map(e => esc(EX[e.exId]?.name || '')).join(', ')}</span></button>`).join('')}</div></section>`;
}

function planFromRoutine(r) {
  const exercises = r.exercises.filter(e => EX[e.exId]).map(e => ({ ...G.buildExercise(state, e.exId, e.sets, e.range), superset: e.superset || null }));
  state.plan = { exercises, targets: [], focus: 'routine', title: r.name, routineId: r.id };
}

// ----- programs -----
function programCard() {
  const pr = state.program, p = pr && PROGRAM[pr.id];
  if (!p) return `<button class="card promo" data-act="programs">${icon('calendar')}
    <div class="grow"><b>Follow a program</b><p class="muted sm">StrongLifts 5×5, Push/Pull/Legs, Upper/Lower and more. Each workout progresses automatically.</p></div></button>`;
  const idx = pr.day % p.days.length, d = p.days[idx];
  const loaded = state.plan?.program?.id === p.id && state.plan.program.day === idx;
  return `<section class="card program">
    <div class="cardhead">
      <div class="grow"><p class="eyebrow">${esc(p.name)} · session ${pr.done + 1}</p><h3>Up next: ${esc(d.name)}</h3></div>
      <button class="icbtn" data-act="program-info" data-val="${p.id}" aria-label="Program details">${icon('more')}</button>
    </div>
    <div class="daydots">${p.days.map((x, k) => `<span class="${k === idx ? 'on' : ''}" title="${esc(x.name)}">${esc(x.name)}</span>`).join('')}</div>
    <p class="muted sm">${d.ex.map(x => esc(EX[x.id]?.name || x.id)).join(' · ')}</p>
    <div class="row tight">
      ${loaded ? `<span class="accent sm grow">${icon('check')} Loaded below</span>` : `<button class="btn primary sm grow" data-act="program-load">Load ${esc(d.name)}</button>`}
      <button class="btn ghost sm" data-act="program-skip">Skip day</button>
    </div>
  </section>`;
}

/** Build the plan for the program's next day, swapping in alternatives for missing equipment. */
function planFromProgram() {
  const pr = state.program, p = PROGRAM[pr?.id];
  if (!p) { state.program = null; return newPlan(); }
  const idx = pr.day % p.days.length, day = p.days[idx];
  const used = [];
  const exercises = day.ex.map(x => {
    let id = x.id;
    if (!EX[id] || !G.available(state, EX[id])) id = EX[x.id] ? G.alternatives(state, x.id, used)[0]?.id : null;
    if (!id) return null;
    used.push(id);
    const e = G.buildExercise(state, id, null, x);
    if (id !== x.id) e.note = `Swapped in for ${EX[x.id].name}. ${e.note}`;
    return e;
  }).filter(Boolean);
  state.plan = { exercises, targets: [], focus: 'program', title: `${p.name} · ${day.name}`, program: { id: p.id, day: idx } };
  save();
}

function programsModal() {
  const cur = state.program?.id;
  modal(`<h2>Programs</h2>
    <p class="muted sm">Proven plans that rotate through set days. Weights still come from your own history, so every session progresses.</p>
    <div class="picklist">${PROGRAMS.map(p => `<button class="pick" data-act="program-info" data-val="${p.id}">
      <b>${esc(p.name)}${p.id === cur ? ' <span class="accent sm">· current</span>' : ''}</b>
      <span class="muted sm">${p.level} · ${p.goal} · ${p.days.length} day rotation · ${p.perWeek}×/week</span>
      <span class="sm">${esc(p.desc)}</span></button>`).join('')}</div>`, 'tall');
}

function programInfo(id) {
  const p = PROGRAM[id], active = state.program?.id === id;
  modal(`<p class="eyebrow">${p.level} · ${p.goal} · ${p.perWeek}× per week</p><h2>${esc(p.name)}</h2>
    <p class="muted">${esc(p.desc)}</p>
    ${p.days.map((d, k) => `<div class="detail-ex"><h4>${active && state.program.day % p.days.length === k ? '▶ ' : ''}${esc(d.name)}</h4>
      ${d.ex.map(x => {
        const e = EX[x.id], ok = e && G.available(state, e);
        return `<p class="sm ${ok ? '' : 'muted'}">${esc(e?.name || x.id)} · ${x.sets}×${x.lo === x.hi ? x.lo : `${x.lo}–${x.hi}`}${e?.timed ? 's' : ''}${ok ? '' : ' · swapped for your equipment'}</p>`;
      }).join('')}</div>`).join('')}
    ${active ? `<p class="muted sm">${state.program.done} session${state.program.done === 1 ? '' : 's'} done since ${fmtDate(state.program.started)}</p>
      <div class="row"><button class="btn ghost grow" data-act="programs">Other programs</button>
      <button class="btn ghost danger grow" data-act="program-end">End program</button></div>`
      : `<button class="btn primary big" data-act="program-start" data-val="${p.id}">${state.program ? 'Switch to this program' : 'Start program'}</button>`}`, 'tall');
}


function newPlan(seed = Date.now()) {
  const { focus, custom } = state.ui;
  const r = G.generate(state, { focus, customMuscles: custom, seed });
  state.plan = { ...r, focus, seed, created: Date.now() };
  save();
}

// ----- active workout -----
function activeView() {
  const a = state.active;
  const done = a.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  const total = a.exercises.reduce((n, e) => n + e.sets.length, 0);
  const pad = n => String(n).padStart(2, '0');
  const local = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  return `
  <header class="top active-top">
    ${a.editing ? `<button class="btn ghost sm" data-act="cancel-edit">Cancel</button>
    <div class="center"><b>${a.editing === 'new' ? 'Log past workout' : 'Edit workout'}</b><div class="muted sm">${done}/${total} sets</div></div>
    <button class="btn primary sm" data-act="finish-workout">Save</button>` : `
    <button class="btn ghost sm" data-act="cancel-workout">Discard</button>
    <div class="center"><div id="elapsed" class="elapsed">0:00</div><div class="muted sm">${done}/${total} sets</div></div>
    <button class="btn primary sm" data-act="finish-workout">Finish</button>`}
  </header>
  <div class="progressbar"><i style="width:${total ? done / total * 100 : 0}%"></i></div>
  <main class="view workout">
    ${a.editing ? `<section class="card">
      <label class="field">Title<input type="text" data-field="e-title" maxlength="60" value="${esc(a.title)}" placeholder="Named from the exercises if left blank"></label>
      <div class="row">
        <label class="field grow">Started<input type="datetime-local" data-field="e-start" value="${local(a.start)}"></label>
        <label class="field narrow">Minutes<input type="number" inputmode="numeric" data-field="e-dur" value="${Math.round((a.end - a.start) / 60000)}"></label>
      </div>
      <p class="muted sm">Tick each set you did. Unticked sets are dropped when you save.</p>
    </section>` : ''}
    ${a.exercises.length ? '' : `<div class="empty">Add the exercises you did.</div>`}
    ${a.exercises.map((e, i) => activeExercise(e, i)).join('')}
    <button class="btn ghost wide" data-act="add-ex" data-ctx="active">${icon('plus')} Add exercise</button>
    <label class="field">Workout notes<textarea data-field="wnote" rows="3" placeholder="How did it feel? Sleep, energy, anything worth remembering">${esc(a.notes || '')}</textarea></label>
  </main>
  <div id="restbar" class="restbar ${a.restEnd && a.restEnd > Date.now() ? 'show' : ''}">
    <span class="muted">Rest</span><b id="resttime">0:00</b>
    <button class="btn ghost sm" data-act="rest-add" data-val="-15">−15</button>
    <button class="btn ghost sm" data-act="rest-add" data-val="15">+15</button>
    <button class="btn primary sm" data-act="rest-skip">Skip</button>
  </div>`;
}

function activeExercise(e, i) {
  const d = EX[e.exId];
  const prev = G.exerciseHistory(state, e.exId).find(h => h.date < state.active.start)?.sets || [];
  const allDone = e.sets.length && e.sets.every(s => s.done);
  const a = state.active, askRpe = state.profile.rpe && !d.cardio;
  let wi = 0;
  const rows = e.sets.map((s, j) => {
    const p = s.warmup ? null : prev[wi++];
    const label = s.warmup ? 'W' : s.kind === 'drop' ? 'D' : s.kind === 'failure' ? 'F' : (j - e.sets.filter((x, k) => k < j && x.warmup).length + 1);
    const prevTxt = p ? setText(d, { ...p, kind: null }) : '—';
    const inputs = d.cardio ? `
      <input type="number" inputmode="decimal" step="any" data-field="d" data-i="${i}" data-j="${j}" value="${s.dist ? D(s.dist) : ''}" placeholder="0" aria-label="Distance (${distUnit()})">
      <input type="number" inputmode="decimal" step="any" data-field="t" data-i="${i}" data-j="${j}" value="${s.time ? +(s.time / 60).toFixed(1) : ''}" placeholder="0" aria-label="Minutes">` : `
      <input type="number" inputmode="decimal" step="any" data-field="w" data-i="${i}" data-j="${j}" value="${s.weight ? W(s.weight) : (d.bw ? '' : '0')}" placeholder="${d.bw ? 'BW' : '0'}" aria-label="Weight">
      <input type="number" inputmode="numeric" data-field="r" data-i="${i}" data-j="${j}" value="${s.reps || ''}" placeholder="0" aria-label="${d.timed ? 'Seconds' : 'Reps'}">`;
    const rpeAsk = askRpe && s.done && !s.warmup && s.rpe === undefined && a.lastSet?.i === i && a.lastSet?.j === j;
    return `<div class="setrow ${s.done ? 'done' : ''} ${s.warmup ? 'warm' : ''} ${s.kind || ''}">
      ${d.cardio ? `<span class="setn">${label}</span>` : `<button class="setn" data-act="set-kind" data-i="${i}" data-j="${j}" aria-label="Change set type">${label}</button>`}
      <span class="prev muted">${prevTxt}</span>
      ${inputs}
      <button class="check" data-act="toggle-set" data-i="${i}" data-j="${j}" aria-label="Complete set">${icon('check')}${s.rpe ? `<em class="rpe">${s.rpe}</em>` : ''}</button>
    </div>
    ${rpeAsk ? `<div class="rpestrip"><span title="Rate of perceived exertion: how many reps you had left">RPE</span>${[6, 7, 8, 9, 10].map(v =>
      `<button class="chip" data-act="rpe-set" data-i="${i}" data-j="${j}" data-val="${v}" title="${{ 6: '4+ reps left', 7: '3 reps left', 8: '2 reps left', 9: '1 rep left', 10: 'Nothing left' }[v]}">${v}</button>`).join('')}
      <button class="icbtn" data-act="rpe-set" data-i="${i}" data-j="${j}" data-val="0" aria-label="Skip">${icon('x')}</button></div>` : ''}`;
  }).join('');

  const ssList = e.superset ? state.active.exercises.filter(x => x.superset === e.superset) : [];
  return `<section class="card excard ${allDone ? 'complete' : ''} ${e.superset ? 'ss' : ''}" ${e.superset ? `style="--ss:${ssColor(e.superset)}"` : ''}>
    ${e.superset ? `<p class="sslabel">${icon('link')} Superset ${esc(e.superset)} · ${ssList.indexOf(e) + 1} of ${ssList.length}</p>` : ''}
    <div class="cardhead">
      <div data-act="ex-info" data-val="${d.id}" class="grow">
        <h3>${esc(d.name)}</h3>
        <p class="muted sm">${d.cardio ? 'Cardio · distance and time' : `${d.primary.map(m => MUSCLES[m].name).join(', ')}${e.target ? ` · target ${e.target.lo === e.target.hi ? e.target.lo : `${e.target.lo}–${e.target.hi}`}${d.timed ? 's' : ' reps'}` : ''}${d.perHand ? ' · per hand' : ''}`}</p>
        ${e.note ? `<p class="accent sm">${esc(e.note)}</p>` : ''}
        ${e.notes ? `<p class="exnote sm">${icon('note')} ${esc(e.notes)}</p>` : ''}
      </div>
      ${d.bar ? `<button class="icbtn" data-act="plates" data-i="${i}" aria-label="Plate calculator">${icon('plate')}</button>` : ''}
      <button class="icbtn" data-act="ex-menu" data-i="${i}" aria-label="More options">${icon('more')}</button>
    </div>
    <div class="sethead"><span>Set</span><span>Previous</span>${d.cardio ? `<span>${distUnit()}</span><span>Min</span>` : `<span>${unit()}</span><span>${d.timed ? 'Sec' : 'Reps'}</span>`}<span></span></div>
    ${rows}
    <div class="row tight">
      <button class="btn ghost sm" data-act="add-set" data-i="${i}">${icon('plus')} ${d.cardio ? 'Interval' : 'Set'}</button>
      ${e.sets.length > 1 ? `<button class="btn ghost sm" data-act="del-set" data-i="${i}">Remove</button>` : ''}
      ${d.cardio || a.editing ? '' : `<button class="btn ghost sm grow-right" data-act="ex-rest" data-i="${i}">${icon('timer')} ${(e.rest ?? 90) ? fmtDur((e.rest ?? 90) * 1000) : 'Off'}</button>`}
    </div>

  </section>`;
}

// ----- progress -----
function progressView() {
  const ws = state.workouts;
  if (!ws.length) return `<header class="top"><h1>Progress</h1></header>
    <div class="empty">${icon('progress')}<p>Finish your first workout and your strength trends, PRs and weekly volume will show up here.</p></div>
    ${toolsCard()}${bodyCard()}${badgesCard()}`;

  const weekly = G.weeklyVolume(state);
  const thisWeek = weekly.at(-1);
  const totalVol = ws.reduce((a, w) => a + G.workoutVolume(w), 0);
  const smuscle = G.setsPerMuscle(state);
  const trained = [...new Set(ws.flatMap(w => w.exercises.filter(e => G.workingSets(e).length).map(e => e.exId)))];
  let exId = state.ui.progressEx;
  if (!trained.includes(exId)) {
    const counts = {};
    ws.forEach(w => w.exercises.forEach(e => counts[e.exId] = (counts[e.exId] || 0) + 1));
    exId = trained.sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0];
  }
  const hist = exId ? G.exerciseHistory(state, exId).reverse() : [];
  const d = EX[exId];
  const useReps = d?.bw && !d.cardio && hist.every(h => h.sets.every(s => !s.weight));
  const cardioByTime = d?.cardio && hist.every(h => h.sets.every(s => !s.dist));
  const pts = hist.map(h => ({
    x: h.date,
    y: d.cardio ? (cardioByTime ? h.sets.reduce((a, s) => a + (s.time || 0), 0) / 60 : toDist(h.sets.reduce((a, s) => a + (s.dist || 0), 0)))
      : useReps ? Math.max(...h.sets.map(s => s.reps)) : G.toDisplay(Math.max(...h.sets.map(s => G.e1rm(s.weight, s.reps))), unit()),
  }));
  const pb = exId ? G.personalBests(state, exId) : null;
  const km = G.totalDistance(ws), kmWeek = G.totalDistance(ws.filter(w => w.start >= thisWeek.start));

  return `<header class="top"><h1>Progress</h1>${goalRing(52)}</header>
  <div class="tiles">
    <div class="tile"><b>${ws.length}</b><span>Workouts</span></div>
    <div class="tile"><b>${thisWeek.count}/${state.profile.weeklyGoal}</b><span>This week</span></div>
    <div class="tile"><b>${G.streakWeeks(state)}</b><span>Week streak</span></div>
    <div class="tile"><b>${fmtBig(G.toDisplay(totalVol, unit()))}</b><span>${unit()} lifted</span></div>
  </div>

  <section class="card">
    <div class="cardhead"><h3>Strength trend</h3></div>
    <select data-field="progressEx" class="select">${trained.map(id => `<option value="${id}" ${id === exId ? 'selected' : ''}>${esc(EX[id].name)}</option>`).join('')}</select>
    ${pb ? `<div class="pbrow">
      ${d.cardio ? `<div><b>${pb.bestDist ? D(pb.bestDist) : '—'}</b><span>Longest (${distUnit()})</span></div>
      <div><b>${pb.bestTime ? fmtDur(pb.bestTime * 1000) : '—'}</b><span>Longest time</span></div>`
      : useReps ? `<div><b>${pb.bestReps}${d.timed ? 's' : ''}</b><span>Best ${d.timed ? 'hold' : 'reps'}</span></div>` : `
      <div><b>${W(pb.best1rm)}</b><span>Est. 1RM (${unit()})</span></div>
      <div><b>${W(pb.bestW)}</b><span>Heaviest (${unit()})</span></div>`}
      <div><b>${hist.length}</b><span>Sessions</span></div>
    </div>` : ''}
    ${lineChart(pts, d.cardio ? (cardioByTime ? 'min' : distUnit()) : useReps ? (d.timed ? 'sec' : 'reps') : unit())}
  </section>

  ${km ? `<section class="card">
    <div class="cardhead"><h3>Cardio</h3><span class="muted sm">${distUnit()}</span></div>
    <div class="pbrow">
      <div><b>${D(kmWeek)}</b><span>This week</span></div>
      <div><b>${D(km)}</b><span>All time</span></div>
      <div><b>${ws.filter(w => w.exercises.some(e => EX[e.exId]?.cardio)).length}</b><span>Sessions</span></div>
    </div>
  </section>` : ''}

  <section class="card">
    <div class="cardhead"><h3>Weekly volume</h3><span class="muted sm">${unit()} × reps</span></div>
    ${barChart(weekly.map(w => ({ label: new Date(w.start).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }), value: G.toDisplay(w.volume, unit()) })))}
  </section>

  <section class="card">
    <div class="cardhead"><h3>Sets per muscle · last 7 days</h3><span class="muted sm">10–20 is a good target</span></div>
    <div class="hbars">${Object.entries(smuscle).sort((a, b) => b[1] - a[1]).map(([m, v]) => `
      <div class="hbar"><span>${MUSCLES[m].name}</span><i><em style="width:${Math.min(100, v / 20 * 100)}%;${v >= 10 ? '' : 'opacity:.55'}"></em></i><b>${+v.toFixed(1)}</b></div>`).join('')}
    </div>
  </section>
  ${bodyCard()}
  ${badgesCard()}
  ${toolsCard()}`;
}

function lineChart(pts, label) {
  if (pts.length < 2) return `<p class="muted sm chart-empty">Log this exercise in ${2 - pts.length} more session${pts.length ? '' : 's'} to see a trend.</p>`;
  const w = 320, h = 160, pad = { l: 36, r: 10, t: 12, b: 22 };
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const span = Math.max(y1 - y0, y1 * 0.08, 2); const mid = (y0 + y1) / 2; y0 = mid - span * 0.65; y1 = mid + span * 0.65;
  const fmt = v => span < 8 ? v.toFixed(1) : Math.round(v);
  const X = x => pad.l + (x - x0) / Math.max(1, x1 - x0) * (w - pad.l - pad.r);
  const Y = y => h - pad.b - (y - y0) / (y1 - y0) * (h - pad.t - pad.b);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const area = `${path}L${X(x1)},${h - pad.b}L${X(x0)},${h - pad.b}Z`;
  const ticks = [y0 + (y1 - y0) * 0.15, (y0 + y1) / 2, y1 - (y1 - y0) * 0.15];
  const delta = ys.at(-1) - ys[0];
  return `<svg class="chart" viewBox="0 0 ${w} ${h}">
    ${ticks.map(t => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/><text x="${pad.l - 6}" y="${Y(t) + 4}" text-anchor="end" class="axis">${fmt(t)}</text>`).join('')}
    <path d="${area}" class="area"/><path d="${path}" class="line"/>
    ${pts.map(p => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.5" class="pt"><title>${fmtDate(p.x)}: ${Math.round(p.y)} ${label}</title></circle>`).join('')}
    <text x="${pad.l}" y="${h - 4}" class="axis">${fmtDate(x0)}</text>
    <text x="${w - pad.r}" y="${h - 4}" text-anchor="end" class="axis">${fmtDate(x1)}</text>
  </svg>
  <p class="sm ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${+Math.abs(delta).toFixed(1)} ${label} since first session</p>`;
}

function barChart(data) {
  const max = Math.max(1, ...data.map(d => d.value));
  return `<div class="bars">${data.map((d, i) => `
    <div class="bar ${i === data.length - 1 ? 'cur' : ''}" title="${fmtBig(d.value)}">
      <span class="val">${d.value ? fmtBig(d.value) : ''}</span>
      <i style="height:${Math.max(2, d.value / max * 100)}%"></i><span>${d.label}</span>
    </div>`).join('')}</div>`;
}

// ----- history -----
function historyView() {
  const ws = [...state.workouts].sort((a, b) => b.start - a.start);
  if (!ws.length) return `<header class="top"><h1>History</h1></header>
    <div class="empty big">${icon('history')}<p>No workouts yet. Your log lives here — on this device, no account needed.</p></div>`;
  const n = state.ui.histN || 30;
  return `<header class="top"><h1>History</h1><button class="btn ghost sm" data-act="log-past">${icon('plus')} Log past workout</button></header>
  ${calendarCard()}
  <p class="muted sm">${ws.length} workout${ws.length === 1 ? '' : 's'}</p>
  ${ws.slice(0, n).map(w => {
    const prs = w.prs?.length || 0, dist = workoutDist(w), vol = G.workoutVolume(w);
    return `<article class="card hist" data-act="open-workout" data-val="${w.id}">
      <div class="cardhead"><h3>${esc(w.title || 'Workout')}</h3><span class="muted sm">${fmtDate(w.start)}</span></div>
      <p class="muted sm">${fmtDur((w.end || w.start) - w.start)}${vol ? ` · ${fmtBig(G.toDisplay(vol, unit()))} ${unit()}` : ''}${dist ? ` · ${D(dist)} ${distUnit()}` : ''} · ${w.exercises.length} exercise${w.exercises.length === 1 ? '' : 's'}${prs ? ` · <span class="accent">${prs} PR${prs > 1 ? 's' : ''}</span>` : ''}</p>
      <p class="sm">${w.exercises.map(e => esc(EX[e.exId]?.name)).join(' · ')}</p>
      ${w.notes ? `<p class="exnote sm">${icon('note')} ${esc(w.notes)}</p>` : ''}
    </article>`;
  }).join('')}
  ${ws.length > n ? `<button class="btn ghost wide" data-act="hist-more">Show ${Math.min(30, ws.length - n)} more</button>` : ''}`;
}

function workoutDetail(id) {
  const w = state.workouts.find(x => x.id === id);
  if (!w) return '';
  return `<h2>${esc(w.title || 'Workout')}</h2>
  <p class="muted">${new Date(w.start).toLocaleString()} · ${fmtDur(w.end - w.start)}</p>
  ${w.notes ? `<p class="exnote">${icon('note')} ${esc(w.notes)}</p>` : ''}
  ${w.prs?.length ? `<div class="prlist">${w.prs.map(p => `<div>🏆 ${esc(EX[p.exId]?.name)} — ${p.kind} <b>${prText(p)}</b></div>`).join('')}</div>` : ''}
  ${w.exercises.map(e => {
    const d = EX[e.exId]; const sets = G.workingSets(e);
    return `<div class="detail-ex"><h4>${e.superset ? `<span class="sstag" style="--ss:${ssColor(e.superset)}">${esc(e.superset)}</span> ` : ''}${esc(d?.name)}</h4>
      <p class="muted sm">${sets.map(s => setText(d, s) + (d?.cardio && G.pace(s) ? ` (${fmtPace(s)})` : '')).join(' · ') || 'No sets completed'}</p>
      ${e.notes ? `<p class="exnote sm">${esc(e.notes)}</p>` : ''}</div>`;
  }).join('')}
  <div class="row wrap">
    <button class="btn ghost" data-act="edit-workout" data-val="${w.id}">${icon('edit')} Edit</button>
    <button class="btn ghost" data-act="repeat-workout" data-val="${w.id}">${icon('refresh')} Repeat</button>
    <button class="btn ghost" data-act="save-routine" data-val="${w.id}">${icon('save')} Save routine</button>
    <button class="btn ghost" data-act="share-workout" data-val="${w.id}">${icon('share')} Share</button>
    <button class="btn ghost danger" data-act="delete-workout" data-val="${w.id}">${icon('trash')} Delete</button>
  </div>`;
}

// ----- profile -----
function profileView() {
  const p = state.profile;
  return `<header class="top"><h1>Profile</h1></header>
  <section class="card">
    <label class="field">Name <input type="text" data-field="name" value="${esc(p.name)}" placeholder="Optional"></label>
    <div class="row">
      <label class="field grow">Bodyweight (${p.unit})<input type="number" inputmode="decimal" data-field="bodyweight" value="${W(p.bodyweight)}"></label>
      <div class="seg">${chip('p-unit', 'kg', 'kg', p.unit === 'kg')}${chip('p-unit', 'lb', 'lb', p.unit === 'lb')}</div>
    </div>
  </section>
  <section class="card">
    <h3>Goal</h3>
    <div class="chips">${chip('p-goal', 'strength', 'Strength', p.goal === 'strength')}${chip('p-goal', 'hypertrophy', 'Muscle', p.goal === 'hypertrophy')}${chip('p-goal', 'endurance', 'Endurance', p.goal === 'endurance')}</div>
    <h3>Experience</h3>
    <div class="chips">${chip('p-level', 'beginner', 'Beginner', p.level === 'beginner')}${chip('p-level', 'intermediate', 'Intermediate', p.level === 'intermediate')}${chip('p-level', 'advanced', 'Advanced', p.level === 'advanced')}</div>
    <h3>Session length</h3>
    <div class="chips">${[20, 30, 45, 60, 75, 90].map(m => chip('p-min', m, m + ' min', p.minutes === m)).join('')}</div>
    <h3>Weekly goal</h3>
    <div class="chips">${[2, 3, 4, 5, 6].map(n => chip('p-goalw', n, n + '× / week', p.weeklyGoal === n)).join('')}</div>
  </section>
  <section class="card">
    <h3>Equipment</h3>
    <div class="chips">${Object.entries(EQUIPMENT).map(([k, l]) => chip('p-equip', k, l, p.equipment.includes(k))).join('')}</div>
  </section>
  <section class="card">
    <h3>Preferences</h3>
    ${toggle('warmups', 'Auto warm-up sets on heavy lifts')}
    ${toggle('core', 'Add a core finisher')}
    ${toggle('sound', 'Beep & vibrate when rest ends')}
    ${toggle('rpe', 'Ask how hard each set felt (RPE 6–10). Easy sets earn bigger jumps')}
    <h3>Rest timer</h3>
    <div class="chips">${[[0, 'Auto'], [45, '45s'], [60, '60s'], [90, '90s'], [120, '2m'], [180, '3m']].map(([v, l]) => chip('p-rest', v, l, p.restOverride === v)).join('')}</div>
  </section>
  <section class="card">
    <div class="cardhead"><h3>Exercise preferences</h3><button class="btn ghost sm" data-act="manage-ex">Manage</button></div>
    <p class="muted sm">${p.favorites.length} favorite · ${p.excluded.length} excluded · ${state.custom.length} custom</p>
    <button class="btn ghost" data-act="custom-ex">${icon('plus')} Create custom exercise</button>
  </section>
  <section class="card">
    <div class="cardhead"><h3>Program</h3><button class="btn ghost sm" data-act="programs">Browse</button></div>
    ${state.program && PROGRAM[state.program.id] ? `<p class="sm"><b>${esc(PROGRAM[state.program.id].name)}</b> · session ${state.program.done + 1}</p>
      <div class="row tight"><button class="chip" data-act="program-info" data-val="${state.program.id}">Details</button></div>`
      : '<p class="muted sm">Not following a program. Smart workouts are built from your recovery instead.</p>'}
  </section>
  <section class="card">
    <div class="cardhead"><h3>Routines</h3><span class="muted sm">${state.routines.length}</span></div>
    ${state.routines.length ? state.routines.map(r => `<div class="pick static"><b>${esc(r.name)}</b>
      <div class="row tight"><button class="chip" data-act="open-routine" data-val="${r.id}">Open</button>
      <button class="chip" data-act="delete-routine" data-val="${r.id}">Delete</button></div></div>`).join('')
      : '<p class="muted sm">Save any workout as a routine to reuse it — the weights still progress automatically.</p>'}
  </section>
  <section class="card">
    <h3>Your data</h3>
    <p class="muted sm">Everything is stored on this device only. Export a backup to move it to another phone.</p>
    <div class="row wrap">
      <button class="btn ghost" data-act="export">Export backup</button>
      <label class="btn ghost">Restore backup<input type="file" accept="application/json,.json" data-field="import" hidden></label>
      <button class="btn ghost danger" data-act="reset">Reset all</button>
    </div>
    <h3>Spreadsheets & other apps</h3>
    <p class="muted sm">Coming from Strong or Hevy? Export your workouts as CSV there, then import the file here. Workouts are added to your history; existing ones aren't touched.</p>
    <div class="row wrap">
      <label class="btn ghost">${icon('upload')} Import CSV<input type="file" accept=".csv,text/csv" data-field="import-csv" hidden></label>
      <button class="btn ghost" data-act="export-csv">Export CSV</button>
    </div>
  </section>
  <p class="muted sm center">WeZza · free, offline, private</p>`;
}
const toggle = (k, label) => `<label class="toggle"><span>${label}</span><input type="checkbox" data-field="t-${k}" ${state.profile[k] ? 'checked' : ''}><i></i></label>`;

// ---------- modal ----------
function modal(html, cls = '') {
  closeModal();
  const m = document.createElement('div');
  m.className = 'modal-wrap';
  m.innerHTML = `<div class="modal ${cls}" role="dialog"><button class="icbtn close" data-act="close-modal" aria-label="Close">${icon('x')}</button>${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  document.body.append(m);
  requestAnimationFrame(() => m.classList.add('show'));
  return m;
}
function closeModal() { document.querySelectorAll('.modal-wrap').forEach(m => m.remove()); }

/**
 * In-app stand-in for confirm() and prompt(), which embedded and installed web apps can block.
 * Resolves true/false, or with `input` set, the entered text (null when cancelled).
 */
function ask(msg, { input = null, ok = 'OK', danger = false } = {}) {
  return new Promise(resolve => {
    const m = modal(`<p class="askmsg">${esc(msg)}</p>
      ${input !== null ? `<input type="text" class="search" id="ask-in" maxlength="300" value="${esc(input)}">` : ''}
      <div class="row"><button class="btn ghost grow" data-ask="0">Cancel</button>
      <button class="btn ${danger ? 'danger-fill' : 'primary'} grow" data-ask="1">${esc(ok)}</button></div>`, 'ask');
    const answer = yes => input !== null ? (yes ? $('#ask-in', m).value.trim() || null : null) : yes;
    const done = yes => { closeModal(); resolve(answer(yes)); };
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-ask]');
      if (b) done(b.dataset.ask === '1');
      else if (e.target === m || e.target.closest('[data-act=close-modal]')) resolve(answer(false));
    });
    const field = $('#ask-in', m);
    if (field) { field.focus(); field.select(); field.addEventListener('keydown', e => { if (e.key === 'Enter') done(true); }); }
  });
}

/** Ask, and on yes run fn, then save and redraw. For use as an action's return value. */
function confirmThen(msg, opts, fn) {
  ask(msg, opts).then(yes => { if (yes) { fn(); save(); render(); } });
  return 'keep';
}

/**
 * Save a file. Inside an embedded viewer downloads are blocked, so show the contents
 * (text to copy, or an image to long-press) instead.
 */
function saveFile(name, blob, text) {
  if (window.top === window.self) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return;
  }
  const url = URL.createObjectURL(blob);
  const m = modal(`<h2>${esc(name)}</h2>
    ${text != null ? `<p class="muted sm">Downloads are blocked in this viewer. Copy the text below and save it as <b>${esc(name)}</b>, or open WeZza in its own tab to download it.</p>
      <textarea class="filetext" id="file-text" readonly>${esc(text)}</textarea>
      <button class="btn primary big" id="file-copy">Copy to clipboard</button>`
      : `<p class="muted sm">Downloads are blocked in this viewer. Press and hold the image to save or share it.</p><img class="fileimg" src="${url}" alt="${esc(name)}">`}`, 'tall');
  $('#file-copy', m)?.addEventListener('click', () => {
    const ta = $('#file-text', m);
    navigator.clipboard.writeText(text).then(() => toast('Copied')).catch(() => { ta.focus(); ta.select(); toast('Selected. Copy it from the menu'); });
  });
}

function pickerModal(title, list, act, ctx, i) {
  const m = modal(`<h2>${title}</h2>
    <input type="search" class="search" placeholder="Search exercises" data-field="search">
    ${act === 'do-add' ? `<button class="btn ghost sm" data-act="custom-ex" data-ctx="${ctx}">${icon('plus')} Create custom exercise</button>` : ''}
    <div class="chips scroll" id="mfilter">${chip('mfilter', '', 'All', true)}${Object.entries(MUSCLES).map(([k, v]) => chip('mfilter', k, v.name, false)).join('')}</div>
    <div class="picklist">${list.map(e => `
      <button class="pick" data-act="${act}" data-val="${e.id}" data-ctx="${ctx}" data-i="${i ?? ''}" data-name="${esc(e.name.toLowerCase())}" data-m="${[...e.primary, ...e.secondary].join(' ')}">
        <b>${esc(e.name)}</b><span class="muted sm">${musclesOf(e).slice(0, 3).join(', ')} · ${e.equip.map(q => EQUIPMENT[q]).join(', ') || 'Bodyweight'}</span>
      </button>`).join('')}</div>`, 'tall');
  const filter = () => {
    const q = $('[data-field=search]', m).value.toLowerCase();
    const mf = $('#mfilter .chip.on', m)?.dataset.val || '';
    m.querySelectorAll('.pick').forEach(b => b.hidden = !(b.dataset.name.includes(q) && (!mf || b.dataset.m.split(' ').includes(mf))));
  };
  m.addEventListener('input', filter);
  m.addEventListener('click', e => {
    const c = e.target.closest('[data-act=mfilter]');
    if (!c) return;
    m.querySelectorAll('#mfilter .chip').forEach(x => x.classList.toggle('on', x === c));
    filter();
  });
}

function exInfo(id) {
  const d = EX[id];
  const hist = G.exerciseHistory(state, id);
  const pb = G.personalBests(state, id);
  const p = G.prescribe(state, id);
  const fav = state.profile.favorites.includes(id);
  const weighted = !d.cardio && pb.bestW > 0;
  const maxes = weighted ? G.repMaxes(state, id) : [];
  const trend = [...hist].reverse().map(h => ({
    x: h.date,
    y: d.cardio ? toDist(h.sets.reduce((a, s) => a + (s.dist || 0), 0)) : weighted
      ? G.toDisplay(Math.max(...h.sets.map(s => G.e1rm(s.weight, s.reps))), unit()) : Math.max(...h.sets.map(s => s.reps)),
  }));
  const bestPace = d.cardio ? Math.min(...hist.flatMap(h => h.sets.map(G.pace)).filter(Boolean)) : 0;
  modal(`<h2>${esc(d.name)}</h2>
    <p class="muted">${d.cardio ? 'Cardio' : d.type === 'compound' ? 'Compound' : 'Isolation'} · ${d.equip.map(q => EQUIPMENT[q]).join(', ') || (d.cardio ? 'Any' : 'Bodyweight')}</p>
    <div class="musclebars">
      ${d.primary.map(m => `<span class="tag primary">${MUSCLES[m].name}</span>`).join('')}
      ${d.secondary.map(m => `<span class="tag">${MUSCLES[m].name}</span>`).join('')}
    </div>
    <div class="pbrow">${d.cardio ? `
      <div><b>${pb.bestDist ? D(pb.bestDist) : '—'}</b><span>Longest (${distUnit()})</span></div>
      <div><b>${isFinite(bestPace) && bestPace ? fmtPace({ dist: 1, time: bestPace }).split('/')[0] : '—'}</b><span>Best pace /${distUnit()}</span></div>
      <div><b>${hist.length}</b><span>Sessions</span></div>` : `
      <div><b>${d.bw && !pb.bestW ? pb.bestReps || '—' : (pb.best1rm ? W(pb.best1rm) : '—')}</b><span>${d.bw && !pb.bestW ? 'Best reps' : 'Est. 1RM'}</span></div>
      <div><b>${hist.length}</b><span>Sessions</span></div>
      <div><b>${d.bw && !p.weight ? p.reps : W(p.weight)}</b><span>Next target</span></div>`}
    </div>
    <p class="accent sm">${esc(p.note)}</p>
    ${hist.length > 1 ? lineChart(trend, d.cardio ? distUnit() : weighted ? unit() : 'reps') : ''}
    ${maxes.length ? `<h3>Records</h3>
      <table class="pct"><tr><th>Reps</th><th>Best (${unit()})</th><th>Est. 1RM</th></tr>
      ${maxes.map(r => `<tr><td>${r.n}</td><td>${W(r.w)}</td><td>${W(G.e1rm(r.w, r.n))}</td></tr>`).join('')}</table>
      <p class="muted sm">Best set volume: ${fmtBig(G.toDisplay(pb.bestSetVol, unit()))} ${unit()} · heaviest: ${W(pb.bestW)} ${unit()}</p>` : ''}
    ${CUES[id] ? `<h3>How to</h3><ol class="cues">${CUES[id].map(c => `<li>${esc(c)}</li>`).join('')}</ol>` : ''}
    ${hist.length ? `<h3>Recent sessions</h3>${hist.slice(0, 5).map(h => `<div class="detail-ex"><span class="muted sm">${fmtDate(h.date)}</span>
      <p class="sm">${h.sets.map(s => setText(d, s)).join(' · ')}</p></div>`).join('')}` : ''}
    <div class="row wrap">
      <button class="btn ghost" data-act="fav" data-val="${id}">${icon('star')} ${fav ? 'Unfavorite' : 'Favorite'}</button>
      <button class="btn ghost danger" data-act="exclude" data-val="${id}">Never suggest</button>
      ${d.custom ? `<button class="btn ghost danger" data-act="delete-custom" data-val="${id}">${icon('trash')} Delete exercise</button>` : ''}
    </div>`);
}

function platesModal(i) {
  const e = state.active.exercises[i];
  const next = e.sets.find(s => !s.done) || e.sets.at(-1);
  const show = kg => {
    const r = G.plates(kg, unit());
    const colors = { 25: '#e5484d', 20: '#3e63dd', 15: '#ffc53d', 10: '#30a46c', 5: '#ededed', 2.5: '#8e4ec6', 1.25: '#a1a1a1', 45: '#3e63dd', 35: '#ffc53d' };
    return `<div class="barviz"><span class="sleeve"></span>${r.plates.map(p => `<span class="plt" style="--h:${30 + Math.sqrt(p) * 12}px;background:${colors[p] || '#888'}">${p}</span>`).join('')}</div>
      <p>${r.plates.length ? `Each side: <b>${r.plates.join(' + ')}</b>` : 'Empty bar'} <span class="muted">(bar ${r.bar} ${unit()})</span></p>
      ${r.remainder ? `<p class="muted sm">${r.remainder} ${unit()} per side can't be made with standard plates.</p>` : ''}`;
  };
  const m = modal(`<h2>Plate calculator</h2>
    <label class="field">Total weight (${unit()})<input type="number" inputmode="decimal" id="plate-in" value="${W(next.weight)}"></label>
    <div id="plate-out">${show(next.weight)}</div>`);
  $('#plate-in', m).addEventListener('input', ev => { $('#plate-out', m).innerHTML = show(G.fromDisplay(+ev.target.value || 0, unit())); });
}

function manageExModal() {
  const p = state.profile;
  const list = EXERCISES.filter(e => G.available({ profile: { ...p, excluded: [] } }, e));
  modal(`<h2>Exercises</h2><p class="muted sm">Favorites get suggested more. Excluded never appear.</p>
    <input type="search" class="search" placeholder="Search" data-field="search">
    <div class="picklist">${list.map(e => `<div class="pick static" data-name="${esc(e.name.toLowerCase())}">
      <b>${esc(e.name)}</b>
      <div class="row tight">
        <button class="chip ${p.favorites.includes(e.id) ? 'on' : ''}" data-act="fav" data-val="${e.id}" data-stay="1">★</button>
        <button class="chip ${p.excluded.includes(e.id) ? 'on danger' : ''}" data-act="exclude" data-val="${e.id}" data-stay="1">Exclude</button>
      </div></div>`).join('')}</div>`, 'tall');
  const m = $('.modal-wrap');
  m.addEventListener('input', () => {
    const q = $('[data-field=search]', m).value.toLowerCase();
    m.querySelectorAll('.pick').forEach(b => b.hidden = !b.dataset.name.includes(q));
  });
}

function summaryModal(w) {
  const vol = G.workoutVolume(w);
  const sets = w.exercises.reduce((a, e) => a + G.workingSets(e).length, 0);
  const worked = {};
  w.exercises.forEach(e => { if (G.workingSets(e).length) { EX[e.exId].primary.forEach(m => worked[m] = 15); EX[e.exId].secondary.forEach(m => worked[m] ??= 55); } });
  modal(`<div class="summary">
    <p class="eyebrow">Workout complete</p>
    <h2>${esc(w.title)}</h2>
    <div class="pbrow">
      <div><b>${fmtDur(w.end - w.start)}</b><span>Duration</span></div>
      <div><b>${sets}</b><span>Sets</span></div>
      <div><b>${fmtBig(G.toDisplay(vol, unit()))}</b><span>${unit()} volume</span></div>
    </div>
    ${w.prs.length ? `<h3>🏆 ${w.prs.length} new personal record${w.prs.length > 1 ? 's' : ''}</h3>
      <div class="prlist">${w.prs.map(p => `<div>${esc(EX[p.exId].name)} — ${p.kind} <b>${prText(p)}</b></div>`).join('')}</div>` : ''}
    ${w.badges?.length ? `<h3>New achievement${w.badges.length > 1 ? 's' : ''} unlocked</h3>
      <div class="badges">${G.BADGES.filter(b => w.badges.includes(b.id)).map(b => `<div class="badge earned"><span>${b.icon}</span><b>${b.name}</b></div>`).join('')}</div>` : ''}
    <h3>Muscles worked</h3>
    ${bodyMap(worked)}
    <div class="row">
      <button class="btn ghost grow" data-act="share-workout" data-val="${w.id}">${icon('share')} Share</button>
      ${w.routineId ? '' : `<button class="btn ghost grow" data-act="save-routine" data-val="${w.id}">${icon('save')} Save routine</button>`}
    </div>
    <button class="btn primary big" data-act="close-modal">Done</button>
  </div>`);
}

// ----- calendar, body, achievements, tools -----
function calendarCard() {
  const now = new Date();
  const m = state.ui.calMonth ? new Date(state.ui.calMonth) : new Date(now.getFullYear(), now.getMonth(), 1);
  const year = m.getFullYear(), month = m.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const byDay = {};
  state.workouts.forEach(w => {
    const d = new Date(w.start);
    if (d.getFullYear() === year && d.getMonth() === month) (byDay[d.getDate()] ||= []).push(w);
  });
  const count = Object.values(byDay).reduce((a, l) => a + l.length, 0);
  const cells = [...Array(lead).fill('<span></span>')];
  for (let d = 1; d <= days; d++) {
    const ws = byDay[d];
    const today = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    cells.push(ws ? `<button class="day on ${today ? 'today' : ''}" data-act="open-workout" data-val="${ws[0].id}" title="${esc(ws.map(w => w.title).join(', '))}">${d}</button>`
      : `<span class="day ${today ? 'today' : ''}">${d}</span>`);
  }
  return `<section class="card">
    <div class="cardhead">
      <button class="icbtn" data-act="cal-move" data-val="-1" aria-label="Previous month">‹</button>
      <div class="center"><h3>${m.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3><p class="muted sm">${count} workout${count === 1 ? '' : 's'}</p></div>
      <button class="icbtn" data-act="cal-move" data-val="1" aria-label="Next month">›</button>
    </div>
    <div class="cal">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<em>${d}</em>`).join('')}${cells.join('')}</div>
  </section>`;
}

const lenUnit = () => unit() === 'lb' ? 'in' : 'cm';
const toLen = cm => unit() === 'lb' ? cm / 2.54 : cm;
const fromLen = v => unit() === 'lb' ? v * 2.54 : v;
// Tape measurements, stored in cm.
const MEASURES = [['waist', 'Waist'], ['chest', 'Chest'], ['arm', 'Arm'], ['thigh', 'Thigh'], ['hips', 'Hips'], ['neck', 'Neck']];

function bodyCard() {
  const entries = [...state.body].sort((a, b) => a.t - b.t);
  const last = entries.at(-1);
  const monthAgo = entries.filter(e => e.t <= Date.now() - 30 * 864e5).at(-1) || entries[0];
  const delta = last && monthAgo && last !== monthAgo ? G.toDisplay(last.weight - monthAgo.weight, unit()) : null;
  return `<section class="card">
    <div class="cardhead"><h3>Body</h3><button class="btn ghost sm" data-act="body-entry">${icon('plus')} Log</button></div>
    ${last ? `<div class="pbrow">
      <div><b>${W(last.weight)}</b><span>Weight (${unit()})</span></div>
      ${last.fat ? `<div><b>${last.fat}%</b><span>Body fat</span></div>` : ''}
      ${last.waist ? `<div><b>${+toLen(last.waist).toFixed(1)}</b><span>Waist (${lenUnit()})</span></div>` : ''}
      ${delta != null ? `<div><b>${delta > 0 ? '+' : ''}${delta.toFixed(1)}</b><span>vs 30 days</span></div>` : ''}
    </div>
    ${(() => {
      // Latest value of each tape measurement, with the change since the first time it was logged.
      const rows = MEASURES.slice(1).map(([k, l]) => {
        const has = entries.filter(e => e[k]);
        if (!has.length) return '';
        const ch = has.length > 1 ? toLen(has.at(-1)[k] - has[0][k]) : 0;
        return `<span>${l} <b>${+toLen(has.at(-1)[k]).toFixed(1)}</b>${ch ? ` <em class="${ch > 0 ? 'up' : 'down'}">${ch > 0 ? '+' : ''}${ch.toFixed(1)}</em>` : ''}</span>`;
      }).filter(Boolean);
      return rows.length ? `<p class="measures sm">${rows.join('')}<span class="muted">${lenUnit()}</span></p>` : '';
    })()}
    ${lineChart(entries.map(e => ({ x: e.t, y: G.toDisplay(e.weight, unit()) })), unit()).replace(/Log this exercise in.*?trend\./, 'Log one more weigh-in to see a trend.')}`
    : '<p class="muted sm">Track bodyweight, body fat and waist over time. Your latest weight also keeps starting-weight estimates accurate.</p>'}
  </section>`;
}

function badgesCard() {
  const list = G.achievements(state);
  const n = list.filter(b => b.earned).length;
  return `<section class="card">
    <div class="cardhead"><h3>Achievements</h3><span class="muted sm">${n}/${list.length}</span></div>
    <div class="badges">${list.map(b => `<div class="badge ${b.earned ? 'earned' : ''}" title="${esc(b.desc)}">
      <span>${b.icon}</span><b>${b.name}</b><small>${b.earned ? 'Unlocked' : esc(b.desc)}</small>
      ${b.earned ? '' : `<i><em style="width:${b.pct * 100}%"></em></i>`}</div>`).join('')}</div>
  </section>`;
}

function toolsCard() {
  return `<section class="card">
    <h3>Tools</h3>
    <div class="tools">
      <button data-act="tool-1rm">${icon('calc')}<span>1RM calculator</span></button>
      <button data-act="tool-plates">${icon('plate')}<span>Plate calculator</span></button>
      <button data-act="tool-interval">${icon('timer')}<span>Interval timer</span></button>
    </div>
  </section>`;
}

function oneRMModal() {
  const m = modal(`<h2>1RM calculator</h2>
    <div class="row"><label class="field grow">Weight (${unit()})<input type="number" inputmode="decimal" id="orm-w" value="100"></label>
    <label class="field grow">Reps<input type="number" inputmode="numeric" id="orm-r" value="5"></label></div>
    <div id="orm-out"></div>`);
  const upd = () => {
    const w = +$('#orm-w', m).value || 0, r = +$('#orm-r', m).value || 0;
    const orm = G.e1rm(w, r);
    $('#orm-out', m).innerHTML = `<div class="pbrow"><div><b>${Math.round(orm * 2) / 2}</b><span>Estimated 1RM (${unit()})</span></div></div>
      <table class="pct"><tr><th>%</th><th>${unit()}</th><th>Reps</th></tr>
      ${[100, 95, 90, 85, 80, 75, 70, 65, 60, 50].map(p => `<tr><td>${p}%</td><td>${Math.round(orm * p / 100 * 2) / 2}</td><td>${G.repsAtPct(p / 100)}</td></tr>`).join('')}</table>`;
  };
  m.addEventListener('input', upd); upd();
}

let interval = null;
function intervalModal() {
  const m = modal(`<h2>Interval timer</h2>
    <div id="iv-setup"><div class="row">
      <label class="field grow">Work (s)<input type="number" inputmode="numeric" id="iv-work" value="40"></label>
      <label class="field grow">Rest (s)<input type="number" inputmode="numeric" id="iv-rest" value="20"></label>
      <label class="field grow">Rounds<input type="number" inputmode="numeric" id="iv-rounds" value="8"></label></div>
      <p class="muted sm">Tabata: 20/10 × 8 · EMOM: 60/0 × 10</p>
      <button class="btn primary big" data-act="iv-start">${icon('play')} Start</button></div>
    <div id="iv-run" hidden><div class="ivclock"><p id="iv-phase">Get ready</p><b id="iv-time">0:05</b><p class="muted" id="iv-round"></p></div>
      <button class="btn ghost wide" data-act="iv-stop">Stop</button></div>`);
  return m;
}
function runInterval() {
  const cfg = { work: +$('#iv-work').value || 40, rest: +$('#iv-rest').value || 0, rounds: +$('#iv-rounds').value || 1 };
  $('#iv-setup').hidden = true; $('#iv-run').hidden = false;
  interval = { cfg, phase: 'ready', round: 0, end: Date.now() + 5000 };
  clearInterval(interval.timer);
  interval.timer = setInterval(() => {
    const el = $('#iv-time');
    if (!el || !interval) { clearInterval(interval?.timer); interval = null; return; }
    const left = interval.end - Date.now();
    if (left <= 0) {
      const { cfg } = interval;
      if (interval.phase === 'work' && cfg.rest && interval.round < cfg.rounds) { interval.phase = 'rest'; interval.end = Date.now() + cfg.rest * 1000; }
      else if (interval.round < cfg.rounds) { interval.phase = 'work'; interval.round++; interval.end = Date.now() + cfg.work * 1000; }
      else { $('#iv-phase').textContent = 'Done 🎉'; el.textContent = '0:00'; beep(); clearInterval(interval.timer); interval = null; return; }
      if (state.profile.sound) { beep(); navigator.vibrate?.(200); }
    }
    $('#iv-phase').textContent = { ready: 'Get ready', work: 'Work', rest: 'Rest' }[interval.phase];
    $('.ivclock').dataset.phase = interval.phase;
    $('#iv-round').textContent = interval.round ? `Round ${interval.round} of ${interval.cfg.rounds}` : '';
    el.textContent = fmtDur(Math.max(0, interval.end - Date.now()) + 999);
  }, 200);
}

function plateTool() {
  const show = kg => {
    const r = G.plates(kg, unit());
    return `<p>${r.plates.length ? `Each side: <b>${r.plates.join(' + ')}</b>` : 'Empty bar'} <span class="muted">(bar ${r.bar} ${unit()})</span></p>
      ${r.remainder ? `<p class="muted sm">${r.remainder} ${unit()} per side can't be made with standard plates.</p>` : ''}`;
  };
  const start = unit() === 'lb' ? 135 : 60;
  const m = modal(`<h2>Plate calculator</h2>
    <label class="field">Total weight (${unit()})<input type="number" inputmode="decimal" id="plate-in" value="${start}"></label>
    <div id="plate-out">${show(G.fromDisplay(start, unit()))}</div>`);
  $('#plate-in', m).addEventListener('input', ev => { $('#plate-out', m).innerHTML = show(G.fromDisplay(+ev.target.value || 0, unit())); });
}

function bodyEntryModal() {
  const last = [...state.body].sort((a, b) => b.t - a.t)[0];
  modal(`<h2>Log body stats</h2>
    <label class="field">Weight (${unit()})<input type="number" inputmode="decimal" id="be-w" value="${W(last?.weight ?? state.profile.bodyweight)}"></label>
    <label class="field">Body fat % <input type="number" inputmode="decimal" id="be-f" value="${last?.fat ?? ''}" placeholder="optional"></label>
    <h3>Measurements <small>${lenUnit()}, optional</small></h3>
    <div class="mgrid">${MEASURES.map(([k, l]) => `<label class="field">${l}<input type="number" inputmode="decimal" id="be-${k}" value="${last?.[k] ? +toLen(last[k]).toFixed(1) : ''}"></label>`).join('')}</div>
    <button class="btn primary big" data-act="body-save">Save</button>
    ${state.body.length ? `<h3>Entries</h3>${[...state.body].sort((a, b) => b.t - a.t).slice(0, 10).map(e => `<div class="pick static">
      <span>${fmtDate(e.t)} · <b>${W(e.weight)} ${unit()}</b>${e.fat ? ` · ${e.fat}%` : ''}</span>
      <button class="icbtn" data-act="body-del" data-val="${e.t}" aria-label="Delete">${icon('trash')}</button></div>`).join('')}` : ''}`);
}

function customExModal(ctx) {
  modal(`<h2>Custom exercise</h2>
    <label class="field">Name<input type="text" id="cx-name" maxlength="40" placeholder="e.g. Landmine Press"></label>
    <h3>Primary muscles</h3>
    <div class="chips" id="cx-prim">${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip" data-act="cx-toggle" data-val="${k}">${v.name}</button>`).join('')}</div>
    <h3>Secondary muscles <small>optional</small></h3>
    <div class="chips" id="cx-sec">${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip" data-act="cx-toggle" data-val="${k}">${v.name}</button>`).join('')}</div>
    <h3>Equipment</h3>
    <div class="chips" id="cx-eq">${Object.entries(EQUIPMENT).map(([k, v]) => `<button class="chip" data-act="cx-toggle" data-val="${k}">${v}</button>`).join('')}</div>
    <h3>Type</h3>
    <div class="chips" id="cx-type"><button class="chip on" data-act="cx-radio" data-val="compound">Compound</button><button class="chip" data-act="cx-radio" data-val="isolation">Isolation</button></div>
    <div class="chips" id="cx-flags"><button class="chip" data-act="cx-toggle" data-val="bw">Bodyweight</button><button class="chip" data-act="cx-toggle" data-val="timed">Timed (seconds)</button><button class="chip" data-act="cx-toggle" data-val="perHand">Per hand</button><button class="chip" data-act="cx-toggle" data-val="bar">Barbell plates</button></div>
    <button class="btn primary big" data-act="cx-save" data-ctx="${ctx || ''}">Create exercise</button>`, 'tall');
}

function exMenu(i) {
  const list = state.active.exercises, e = list[i], d = EX[e.exId];
  modal(`<h2>${esc(d.name)}</h2>
    <div class="sheet">
      <button data-act="swap" data-ctx="active" data-i="${i}">${icon('swap')} Swap exercise</button>
      ${i < list.length - 1 ? `<button data-act="ss-link" data-i="${i}">${icon('link')} ${e.superset && list[i + 1].superset === e.superset ? 'Unlink from next' : 'Superset with next'}</button>` : ''}
      ${e.superset ? `<button data-act="ss-unlink" data-i="${i}">${icon('link')} Remove from superset</button>` : ''}
      <button data-act="ex-note" data-i="${i}">${icon('note')} ${e.notes ? 'Edit note' : 'Add note'}</button>
      <button data-act="ex-rest" data-i="${i}">${icon('timer')} Rest timer</button>
      ${i > 0 ? `<button data-act="ex-move" data-i="${i}" data-val="-1">↑ Move up</button>` : ''}
      ${i < list.length - 1 ? `<button data-act="ex-move" data-i="${i}" data-val="1">↓ Move down</button>` : ''}
      <button data-act="ex-info" data-val="${d.id}">${icon('info')} Instructions & history</button>
      <button class="danger" data-act="remove" data-ctx="active" data-i="${i}">${icon('x')} Remove exercise</button>
    </div>`);
}

function routineModal(id) {
  const r = state.routines.find(x => x.id === id);
  if (!r) return;
  modal(`<h2>${esc(r.name)}</h2>
    <p class="muted sm">Created ${fmtDate(r.created)} · weights progress automatically from your history</p>
    ${r.exercises.map(e => `<div class="detail-ex"><h4>${e.superset ? `<span class="sstag" style="--ss:${ssColor(e.superset)}">${esc(e.superset)}</span> ` : ''}${esc(EX[e.exId]?.name || 'Deleted exercise')}</h4><p class="muted sm">${e.sets} sets</p></div>`).join('')}
    <button class="btn primary big" data-act="load-routine" data-val="${r.id}">Load routine</button>
    <div class="row"><button class="btn ghost grow" data-act="rename-routine" data-val="${r.id}">${icon('note')} Rename</button>
    <button class="btn ghost danger grow" data-act="delete-routine" data-val="${r.id}">${icon('trash')} Delete</button></div>`);
}

function saveRoutine(src) {
  const exs = src === 'plan' ? state.plan.exercises : state.workouts.find(w => w.id === src)?.exercises;
  if (!exs?.length) return;
  const suggested = src === 'plan' ? (state.plan.title || workoutTitle(exs)) : state.workouts.find(w => w.id === src).title;
  ask('Name this routine', { input: suggested, ok: 'Save routine' }).then(name => {
    if (!name) return;
    state.routines.push({
      id: uid(), name: name.slice(0, 40), created: Date.now(),
      exercises: exs.map(e => ({ exId: e.exId, sets: Math.max(1, e.sets.filter(s => !s.warmup).length), superset: e.superset || null, ...(e.range ? { range: e.range } : {}) })),
    });
    save(); render(); toast('Routine saved');
  });
}

async function shareWorkout(id) {
  const w = state.workouts.find(x => x.id === id);
  if (!w) return;
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 1080, 1350);
  grad.addColorStop(0, '#14181d'); grad.addColorStop(1, '#0a0c0f');
  g.fillStyle = grad; g.fillRect(0, 0, 1080, 1350);
  const font = (wt, px) => `${wt} ${px}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  g.fillStyle = '#c6f432'; g.font = font(800, 44); g.fillText('WeZza', 80, 120);
  g.fillStyle = '#8b95a1'; g.font = font(600, 34); g.fillText(new Date(w.start).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), 80, 220);
  g.fillStyle = '#f2f4f6'; g.font = font(800, 92); g.fillText(w.title || 'Workout', 80, 320, 920);
  const sets = w.exercises.reduce((a, e) => a + G.workingSets(e).length, 0);
  const vol = G.workoutVolume(w), dist = workoutDist(w);
  const stats = [[fmtDur(w.end - w.start), 'Duration'],
    !vol && dist ? [`${D(dist)} ${distUnit()}`, 'Distance'] : [fmtBig(G.toDisplay(vol, unit())) + ' ' + unit(), 'Volume'], [String(sets), 'Sets']];
  stats.forEach(([v, l], i) => {
    const x = 80 + i * 320;
    g.fillStyle = '#1f242b'; g.beginPath(); g.roundRect(x, 380, 290, 170, 28); g.fill();
    g.fillStyle = '#f2f4f6'; g.font = font(800, 54); g.fillText(v, x + 30, 470);
    g.fillStyle = '#8b95a1'; g.font = font(600, 28); g.fillText(l, x + 30, 520);
  });
  let y = 650;
  for (const e of w.exercises.slice(0, 7)) {
    const d = EX[e.exId], ss = G.workingSets(e);
    if (!d || !ss.length) continue;
    const best = ss.reduce((a, b) => G.e1rm(b.weight, b.reps) > G.e1rm(a.weight, a.reps) ? b : a, ss[0]);
    const pr = w.prs?.some(p => p.exId === e.exId);
    g.fillStyle = '#f2f4f6'; g.font = font(700, 38); g.fillText((pr ? '🏆 ' : '') + d.name, 80, y);
    g.fillStyle = '#8b95a1'; g.font = font(500, 32);
    g.fillText(d.cardio ? ss.map(s => setText(d, s)).join(', ') : `${ss.length} × ${d.bw && !best.weight ? best.reps + (d.timed ? 's' : ' reps') : `${W(best.weight)} ${unit()} × ${best.reps}`}`, 80, y + 44, 920);

    y += 100;
  }
  if (w.prs?.length) { g.fillStyle = '#c6f432'; g.font = font(800, 40); g.fillText(`${w.prs.length} personal record${w.prs.length > 1 ? 's' : ''}`, 80, 1270); }
  g.fillStyle = '#8b95a1'; g.font = font(600, 28); g.textAlign = 'right'; g.fillText('Tracked with WeZza', 1000, 1270);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], `wezza-${new Date(w.start).toISOString().slice(0, 10)}.png`, { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: w.title }); return; }
  } catch (err) { if (err.name === 'AbortError') return; }
  saveFile(file.name, file);
  if (window.top === window.self) toast('Image saved');

}

// ---------- actions ----------
let restTimer = null, elapsedTimer = null, wakeLock = null;

function startWorkout() {
  const plan = state.plan;
  state.active = {
    id: uid(), start: Date.now(),
    title: plan.title || workoutTitle(plan.exercises), routineId: plan.routineId || null, program: plan.program || null,
    exercises: structuredClone(plan.exercises), restEnd: 0, notes: '',
  };
  state.plan = null;
  save(); render();
  window.scrollTo(0, 0);
  navigator.wakeLock?.request('screen').then(l => wakeLock = l).catch(() => {});
}

function workoutTitle(exs) {
  const counts = {};
  exs.forEach(e => EX[e.exId].primary.forEach(m => counts[m] = (counts[m] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([m]) => m);
  const push = ['chest', 'shoulders', 'triceps'], pull = ['lats', 'upperback', 'biceps', 'traps'], legs = ['quads', 'hamstrings', 'glutes', 'calves', 'adductors'];
  const has = g => top.some(m => g.includes(m));
  if (has(legs) && (has(push) || has(pull))) return 'Full Body';
  if (has(legs)) return 'Lower Body';
  if (has(push) && has(pull)) return 'Upper Body';
  if (has(push)) return 'Push Day';
  if (has(pull)) return 'Pull Day';
  return top[0] ? MUSCLES[top[0]].name + ' Focus' : 'Workout';
}

function finishWorkout() {
  const a = state.active;
  const done = a.exercises.some(e => e.sets.some(s => s.done));
  if (!done && a.editing) { toast('Tick at least one set to save'); return; }
  if (!done) { ask('No sets completed. Discard this workout?', { ok: 'Discard', danger: true }).then(y => y && discard()); return; }
  if (!a.editing) a.end = Date.now();
  const exercises = a.exercises.filter(e => e.sets.some(s => s.done))
    .map(({ exId, sets, superset, notes, range }) => ({ exId, sets: sets.filter(s => s.done), superset: superset || null, notes: notes || '', ...(range ? { range } : {}) }));
  const w = {
    id: a.editing && a.editing !== 'new' ? a.editing : a.id, start: a.start, end: Math.max(a.end, a.start + 60e3),
    title: a.title || workoutTitle(exercises), notes: a.notes || '', exercises,
    ...(a.program ? { program: a.program } : {}), ...(a.imported ? { imported: true } : {}),
  };
  if (a.editing) {
    // Editing history: replace in place, recheck PRs against everything before it, no celebration.
    const others = state.workouts.filter(x => x.id !== w.id);
    w.prs = G.workoutPRs({ ...state, workouts: [...others, w] }, w);
    state.workouts = [...others, w];
    state.active = null;
    state.ui.tab = 'history';
    save(); render(); toast(a.editing === 'new' ? 'Workout logged' : 'Workout updated');
    return;
  }
  w.prs = G.workoutPRs({ ...state, workouts: [...state.workouts, w] }, w);
  const before = new Set(G.achievements(state).filter(b => b.earned).map(b => b.id));
  state.workouts.push(w);
  w.badges = G.achievements(state).filter(b => b.earned && !before.has(b.id)).map(b => b.id);
  // Following a program: move on to its next day.
  const pr = state.program;
  if (a.program && pr?.id === a.program.id && PROGRAM[pr.id]) {
    pr.day = (a.program.day + 1) % PROGRAM[pr.id].days.length;
    pr.done++;
  }
  state.active = null;
  stopTimers();
  save(); render();
  summaryModal(w);
}

/** Open a logged workout (or a blank one dated in the past) in the editor. */
function editWorkout(id) {
  const w = id && state.workouts.find(x => x.id === id);
  if (id && !w) return;
  const now = Date.now();
  state.active = w
    ? { ...structuredClone(w), editing: w.id, restEnd: 0, exercises: structuredClone(w.exercises).map(e => ({ ...e, rest: 0, target: null })) }
    : { id: uid(), editing: 'new', start: now - 3600e3, end: now - 600e3, title: '', notes: '', exercises: [], restEnd: 0 };
  closeModal(); window.scrollTo(0, 0);
}

function discard() {
  state.active = null; stopTimers(); save(); render();
}

function stopTimers() {
  clearInterval(restTimer); restTimer = null;
  wakeLock?.release?.(); wakeLock = null;
}

function updateTimers() {
  clearInterval(elapsedTimer);
  const tick = () => {
    const a = state.active;
    if (!a) { clearInterval(elapsedTimer); return; }
    const el = $('#elapsed'); if (el) el.textContent = fmtDur(Date.now() - a.start);
    const bar = $('#restbar');
    if (a.restEnd) {
      const left = a.restEnd - Date.now();
      if (left <= 0) {
        a.restEnd = 0; save();
        bar?.classList.remove('show');
        if (state.profile.sound) { beep(); navigator.vibrate?.([200, 100, 200]); }
      } else {
        bar?.classList.add('show');
        const t = $('#resttime'); if (t) t.textContent = fmtDur(left + 999);
      }
    }
  };
  tick();
  elapsedTimer = setInterval(tick, 250);
}

let audioCtx;
function beep() {
  try {
    audioCtx ??= new AudioContext();
    [0, 0.25].forEach(off => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.25, audioCtx.currentTime + off);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + off + 0.2);
      o.start(audioCtx.currentTime + off); o.stop(audioCtx.currentTime + off + 0.22);
    });
  } catch {}
}

const target = ctx => ctx === 'plan' ? state.plan.exercises : state.active.exercises;

const actions = {
  tab: v => { state.ui.tab = v; save(); render(); window.scrollTo(0, 0); },
  'p-goal': v => { state.profile.goal = v; state.plan = null; },
  'p-level': v => { state.profile.level = v; state.plan = null; },
  'p-sex': v => { state.profile.sex = v; state.plan = null; },
  'p-unit': v => { state.profile.unit = v; state.plan = null; },
  'p-min': v => { state.profile.minutes = +v; state.plan = null; },
  'p-rest': v => { state.profile.restOverride = +v; state.plan = null; },
  'p-equip': v => {
    const eq = state.profile.equipment;
    state.profile.equipment = eq.includes(v) ? eq.filter(x => x !== v) : [...eq, v];
    state.plan = null;
  },
  'finish-onboard': () => { state.profile.onboarded = true; state.plan = null; window.scrollTo(0, 0); },
  focus: v => {
    state.ui.focus = v;
    if (v !== 'custom') newPlan();
    else if (state.ui.custom.length) newPlan();
    else state.plan = { exercises: [], targets: [], focus: v };
  },
  'time-cycle': () => {
    const opts = [20, 30, 45, 60, 75, 90];
    state.profile.minutes = opts[(opts.indexOf(state.profile.minutes) + 1) % opts.length];
    newPlan();
  },
  regen: () => newPlan(),
  start: () => startWorkout(),
  'ex-info': v => exInfo(v),
  swap: (_, el) => {
    const ctx = el.dataset.ctx, i = +el.dataset.i;
    const list = target(ctx);
    pickerModal('Swap for…', G.alternatives(state, list[i].exId, list.map(e => e.exId)), 'do-swap', ctx, i);
    return 'keep';
  },
  'do-swap': (v, el) => {
    const ctx = el.dataset.ctx, i = +el.dataset.i;
    const list = target(ctx);
    const keepDone = list[i].sets.some(s => s.done);
    const fresh = { ...G.buildExercise(state, v, list[i].sets.filter(s => !s.warmup).length), superset: list[i].superset || null };
    if (keepDone) list.splice(i + 1, 0, fresh); else list[i] = fresh;
    closeModal();
  },
  remove: (_, el) => {
    const list = target(el.dataset.ctx), i = +el.dataset.i;
    const drop = () => { list.splice(i, 1); cleanSupersets(list); closeModal(); };
    if (el.dataset.ctx === 'active' && list[i].sets.some(s => s.done))
      return confirmThen('Remove this exercise and its logged sets?', { ok: 'Remove', danger: true }, drop);
    drop();
  },
  'add-ex': (_, el) => {
    const ctx = el.dataset.ctx;
    const have = target(ctx).map(e => e.exId);
    const list = EXERCISES.filter(e => G.available(state, e) && !have.includes(e.id));
    pickerModal('Add exercise', list, 'do-add', ctx);
    return 'keep';
  },
  'do-add': (v, el) => { target(el.dataset.ctx).push(G.buildExercise(state, v)); closeModal(); },
  'toggle-set': (_, el) => {
    const i = +el.dataset.i, j = +el.dataset.j;
    const ex = state.active.exercises[i], s = ex.sets[j];
    s.done = !s.done;
    if (s.done) {
      const cardio = EX[ex.exId].cardio;
      if (!s.reps && !cardio) s.reps = ex.target?.lo || 8;
      const list = state.active.exercises;
      let rest = s.warmup ? 45 : (ex.rest ?? 90);
      if (ex.superset && !s.warmup) {
        // In a superset, only rest after the last exercise of the round.
        const group = list.filter(x => x.superset === ex.superset);
        const doneN = x => x.sets.filter(y => y.done && !y.warmup).length;
        const after = group.slice(group.indexOf(ex) + 1);
        if (after.some(x => doneN(x) < doneN(ex) && x.sets.some(y => !y.done))) rest = 0;
        else rest = Math.max(...group.map(x => x.rest ?? 90));
      }
      const last = ex.sets.every(x => x.done) && i === list.length - 1;
      state.active.restEnd = !last && rest && !state.active.editing ? Date.now() + rest * 1000 : 0;
      state.active.lastSet = { i, j };
      navigator.vibrate?.(30);
    } else delete s.rpe;
  },
  'rpe-set': (v, el) => {
    const s = state.active.exercises[+el.dataset.i].sets[+el.dataset.j];
    s.rpe = +v;
  },
  'add-set': (_, el) => {
    const ex = state.active.exercises[+el.dataset.i];
    const last = ex.sets.filter(s => !s.warmup).at(-1) || ex.sets.at(-1) || { weight: 0, reps: EX[ex.exId].cardio ? 0 : 8 };
    ex.sets.push({ weight: last.weight || 0, reps: last.reps || 0, ...(EX[ex.exId].cardio ? { dist: last.dist || 0, time: last.time || 0 } : {}), done: false });
  },
  'del-set': (_, el) => {
    const ex = state.active.exercises[+el.dataset.i];
    const idx = ex.sets.map(s => s.done).lastIndexOf(false);
    ex.sets.splice(idx >= 0 ? idx : ex.sets.length - 1, 1);
  },
  'rest-add': v => { const a = state.active; a.restEnd = Math.max(Date.now() + 1000, a.restEnd + +v * 1000); return 'keep'; },
  'rest-skip': () => { state.active.restEnd = 0; $('#restbar')?.classList.remove('show'); return 'keep'; },
  plates: (_, el) => { platesModal(+el.dataset.i); return 'keep'; },
  'finish-workout': () => { finishWorkout(); return 'keep'; },
  'cancel-workout': () => { ask('Discard this workout? Logged sets will be lost.', { ok: 'Discard', danger: true }).then(y => y && discard()); return 'keep'; },
  'cancel-edit': () => { state.active = null; },
  'edit-workout': v => { editWorkout(v); },
  'log-past': () => { editWorkout(null); },
  'hist-more': () => { state.ui.histN = (state.ui.histN || 30) + 30; },
  // programs
  programs: () => { programsModal(); return 'keep'; },
  'program-info': v => { programInfo(v); return 'keep'; },
  'program-start': v => {
    state.program = { id: v, day: 0, done: 0, started: Date.now() };
    state.plan = null; state.ui.tab = 'train'; closeModal(); window.scrollTo(0, 0);
    toast(`${PROGRAM[v].name} started`);
  },
  'program-end': () => confirmThen('End this program? Your logged workouts stay in your history.', { ok: 'End program', danger: true },
    () => { state.program = null; state.plan = null; }),
  'program-load': () => { planFromProgram(); },
  'program-skip': () => {
    const p = PROGRAM[state.program.id];
    state.program.day = (state.program.day + 1) % p.days.length;
    planFromProgram();
  },
  'close-modal': () => { closeModal(); return 'keep'; },
  'open-workout': v => { modal(workoutDetail(v)); return 'keep'; },
  'delete-workout': v => confirmThen('Delete this workout?', { ok: 'Delete', danger: true },
    () => { state.workouts = state.workouts.filter(w => w.id !== v); }),
  'repeat-workout': v => {
    const w = state.workouts.find(x => x.id === v);
    state.plan = { exercises: w.exercises.filter(e => EX[e.exId]).map(e => ({ ...G.buildExercise(state, e.exId, EX[e.exId].cardio ? null : Math.max(2, G.workingSets(e).length), e.range), superset: e.superset || null })), targets: [], focus: 'repeat', title: w.title };
    state.ui.tab = 'train'; closeModal();
  },
  fav: (v, el) => {
    const f = state.profile.favorites;
    state.profile.favorites = f.includes(v) ? f.filter(x => x !== v) : [...f, v];
    if (el.dataset.stay) { el.classList.toggle('on'); save(); return 'keep'; }
    closeModal(); toast(state.profile.favorites.includes(v) ? 'Added to favorites' : 'Removed from favorites');
  },
  exclude: (v, el) => {
    const x = state.profile.excluded;
    state.profile.excluded = x.includes(v) ? x.filter(y => y !== v) : [...x, v];
    if (el.dataset.stay) { el.classList.toggle('on'); el.classList.toggle('danger'); state.plan = null; save(); return 'keep'; }
    closeModal(); toast(`${EX[v].name} won't be suggested`);
    if (state.plan && !state.active) newPlan();
  },
  'manage-ex': () => { manageExModal(); return 'keep'; },
  export: () => {
    const { profile, workouts, routines, custom, body, program } = state;
    const text = JSON.stringify({ app: 'wezza', version: 3, exported: new Date().toISOString(), profile, workouts, routines, custom, body, program }, null, 2);
    saveFile(`wezza-backup-${new Date().toISOString().slice(0, 10)}.json`, new Blob([text], { type: 'application/json' }), text);
    return 'keep';
  },
  'export-csv': () => {
    const text = exportCSV(state);
    saveFile(`wezza-workouts-${new Date().toISOString().slice(0, 10)}.csv`, new Blob([text], { type: 'text/csv' }), text);
    return 'keep';
  },
  reset: () => confirmThen('Erase all workouts and settings on this device?', { ok: 'Erase everything', danger: true },
    () => { state = structuredClone(DEFAULT); }),
  'p-goalw': v => { state.profile.weeklyGoal = +v; },
  'cal-move': v => {
    const now = new Date();
    const m = state.ui.calMonth ? new Date(state.ui.calMonth) : new Date(now.getFullYear(), now.getMonth(), 1);
    state.ui.calMonth = new Date(m.getFullYear(), m.getMonth() + +v, 1).getTime();
  },
  // routines
  'save-routine': v => { saveRoutine(v); return 'keep'; },
  'open-routine': v => { routineModal(v); return 'keep'; },
  'load-routine': v => {
    planFromRoutine(state.routines.find(r => r.id === v));
    state.ui.tab = 'train'; closeModal(); window.scrollTo(0, 0);
  },
  'rename-routine': v => {
    const r = state.routines.find(x => x.id === v);
    ask('Rename routine', { input: r.name, ok: 'Rename' }).then(name => { if (name) { r.name = name.slice(0, 40); save(); render(); } });
    return 'keep';
  },
  'delete-routine': v => confirmThen('Delete this routine?', { ok: 'Delete', danger: true },
    () => { state.routines = state.routines.filter(r => r.id !== v); }),
  // set types: normal → warm-up → drop → failure
  'set-kind': (_, el) => {
    const s = state.active.exercises[+el.dataset.i].sets[+el.dataset.j];
    const order = ['normal', 'warmup', 'drop', 'failure'];
    const cur = s.warmup ? 'warmup' : s.kind || 'normal';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    s.warmup = next === 'warmup';
    if (next === 'drop' || next === 'failure') s.kind = next; else delete s.kind;
    toast({ normal: 'Working set', warmup: 'Warm-up set', drop: 'Drop set', failure: 'Set to failure' }[next]);
  },
  'ex-menu': (_, el) => { exMenu(+el.dataset.i); return 'keep'; },
  'ss-link': (_, el) => {
    const list = state.active.exercises, i = +el.dataset.i, a = list[i], b = list[i + 1];
    if (a.superset && b.superset === a.superset) b.superset = null;
    else {
      const used = new Set(list.map(x => x.superset).filter(Boolean));
      const g = a.superset || b.superset || 'ABCDEFGHIJ'.split('').find(c => !used.has(c));
      a.superset = b.superset = g;
    }
    cleanSupersets(list); closeModal();
  },
  'ss-unlink': (_, el) => { state.active.exercises[+el.dataset.i].superset = null; cleanSupersets(state.active.exercises); closeModal(); },
  'ex-note': (_, el) => {
    const e = state.active.exercises[+el.dataset.i];
    ask('Note for this exercise (seat height, grip, how it felt…)', { input: e.notes || '', ok: 'Save note' })
      .then(n => { e.notes = (n || '').slice(0, 300); save(); render(); });
    return 'keep';
  },
  'ex-rest': (_, el) => {
    const i = +el.dataset.i, e = state.active.exercises[i];
    modal(`<h2>Rest timer</h2><p class="muted sm">${esc(EX[e.exId].name)}</p>
      <div class="chips">${[0, 30, 45, 60, 90, 120, 150, 180, 240, 300].map(v => `<button class="chip ${e.rest === v ? 'on' : ''}" data-act="ex-rest-set" data-i="${i}" data-val="${v}">${v ? fmtDur(v * 1000) : 'Off'}</button>`).join('')}</div>`);
    return 'keep';
  },
  'ex-rest-set': (v, el) => { state.active.exercises[+el.dataset.i].rest = +v; closeModal(); },
  'ex-move': (v, el) => {
    const list = state.active.exercises, i = +el.dataset.i, j = i + +v;
    [list[i], list[j]] = [list[j], list[i]];
    closeModal();
  },
  'share-workout': v => { shareWorkout(v); return 'keep'; },
  // body
  'body-entry': () => { bodyEntryModal(); return 'keep'; },
  'body-save': () => {
    const w = parseFloat($('#be-w').value);
    if (!(w > 0)) { toast('Enter your weight'); return 'keep'; }
    const fat = parseFloat($('#be-f').value);
    const entry = { t: Date.now(), weight: G.fromDisplay(w, unit()) };
    if (fat > 0) entry.fat = fat;
    for (const [k] of MEASURES) { const v = parseFloat($(`#be-${k}`).value); if (v > 0) entry[k] = fromLen(v); }
    state.body.push(entry);
    state.profile.bodyweight = entry.weight;
    closeModal(); toast('Logged');
  },
  'body-del': v => { state.body = state.body.filter(e => e.t !== +v); bodyEntryModal(); },
  // tools
  'tool-1rm': () => { oneRMModal(); return 'keep'; },
  'tool-plates': () => { plateTool(); return 'keep'; },
  'tool-interval': () => { intervalModal(); return 'keep'; },
  'iv-start': () => { runInterval(); return 'keep'; },
  'iv-stop': () => { clearInterval(interval?.timer); interval = null; closeModal(); return 'keep'; },
  // custom exercises
  'custom-ex': (_, el) => { customExModal(el.dataset.ctx); return 'keep'; },
  'cx-toggle': (_, el) => { el.classList.toggle('on'); return 'keep'; },
  'cx-radio': (_, el) => { el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); return 'keep'; },
  'cx-save': (_, el) => {
    const name = $('#cx-name').value.trim();
    const on = id => [...document.querySelectorAll(`#${id} .chip.on`)].map(c => c.dataset.val);
    const primary = on('cx-prim');
    if (!name || !primary.length) { toast('Add a name and at least one primary muscle'); return 'keep'; }
    const flags = on('cx-flags');
    const ex = {
      id: 'c_' + uid(), name, primary, secondary: on('cx-sec').filter(m => !primary.includes(m)), equip: on('cx-eq'),
      type: on('cx-type')[0] || 'compound', ratio: 0, custom: true,
      ...Object.fromEntries(flags.map(f => [f, true])),
    };
    state.custom.push(ex);
    G.registerCustom([ex]);
    const ctx = el.dataset.ctx;
    if (ctx && (ctx === 'plan' ? state.plan : state.active)) target(ctx).push(G.buildExercise(state, ex.id));
    closeModal(); toast(`${name} created`);
  },
  'delete-custom': v => {
    const inUse = state.workouts.some(w => w.exercises.some(e => e.exId === v));
    return confirmThen(inUse ? 'This exercise is in your history. Hide it from suggestions instead of deleting?' : 'Delete this custom exercise?',
      { ok: inUse ? 'Hide it' : 'Delete', danger: !inUse }, () => {
        if (inUse) state.profile.excluded.push(v);
        else {
          state.custom = state.custom.filter(e => e.id !== v);
          const i = EXERCISES.findIndex(e => e.id === v);
          if (i >= 0) EXERCISES.splice(i, 1);
          delete EX[v];
          state.plan = null;
        }
      });
  },
};

/** Drop superset groups that are left with a single exercise. */
function cleanSupersets(list) {
  const counts = {};
  list.forEach(e => e.superset && (counts[e.superset] = (counts[e.superset] || 0) + 1));
  list.forEach(e => { if (e.superset && counts[e.superset] < 2) e.superset = null; });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  if (el.dataset.act === 'mfilter') return; // handled inside the picker
  const fn = actions[el.dataset.act];
  if (!fn) return;
  const r = fn(el.dataset.val, el);
  if (r === 'keep') { save(); return; }
  save(); render();
});

document.addEventListener('input', e => {
  const el = e.target, f = el.dataset.field;
  if (!f) return;
  const p = state.profile;
  if (f === 'bodyweight') { const v = parseFloat(el.value); if (v > 0) { p.bodyweight = G.fromDisplay(v, p.unit); state.plan = null; } }
  else if (f === 'name') p.name = el.value.slice(0, 40);
  else if (f === 'wnote') state.active.notes = el.value.slice(0, 2000);
  else if (f === 'e-title') state.active.title = el.value.slice(0, 60);
  else if (f === 'e-start') {
    const t = new Date(el.value).getTime(), a = state.active;
    if (t) { const dur = a.end - a.start; a.start = t; a.end = t + dur; }
  }
  else if (f === 'e-dur') { const v = parseFloat(el.value); if (v > 0) state.active.end = state.active.start + v * 60e3; }
  else if (f === 'd' || f === 't') {
    const s = state.active.exercises[+el.dataset.i].sets[+el.dataset.j], v = parseFloat(el.value);
    if (f === 'd') s.dist = v > 0 ? fromDist(v) : 0; else s.time = v > 0 ? Math.round(v * 60) : 0;
  }
  else if (f === 'w' || f === 'r') {
    const ex = state.active.exercises[+el.dataset.i], j = +el.dataset.j, s = ex.sets[j];
    const v = parseFloat(el.value);
    if (f === 'w') {
      const old = s.weight, nw = isNaN(v) ? 0 : G.fromDisplay(v, unit());
      s.weight = nw;
      // carry a changed weight forward to later untouched sets
      ex.sets.forEach((x, k) => {
        if (k > j && !x.done && !x.warmup && !s.warmup && Math.abs((x.weight || 0) - (old || 0)) < 0.01) {
          x.weight = nw;
          const inp = document.querySelector(`[data-field=w][data-i="${el.dataset.i}"][data-j="${k}"]`);
          if (inp) inp.value = el.value;
        }
      });
    } else s.reps = isNaN(v) ? 0 : Math.round(v);
  }
  save();
});

document.addEventListener('change', e => {
  const el = e.target, f = el.dataset.field;
  if (!f) return;
  if (f.startsWith('t-')) { state.profile[f.slice(2)] = el.checked; state.plan = null; save(); }
  else if (f === 'progressEx') { state.ui.progressEx = el.value; save(); render(); }
  else if (f === 'bodyweight' && state.profile.onboarded) { render(); }
  else if (f === 'import') {
    const file = el.files[0]; if (!file) return;
    file.text().then(t => {
      const d = JSON.parse(t);
      if (!Array.isArray(d.workouts)) throw new Error('bad file');
      return ask(`Restore ${d.workouts.length} workouts? This replaces everything on this device.`, { ok: 'Restore', danger: true }).then(yes => {
        if (!yes) return;
        state.workouts = d.workouts;
        state.profile = { ...DEFAULT.profile, ...d.profile, onboarded: true };
        state.routines = d.routines || [];
        state.custom = d.custom || [];
        state.body = d.body || [];
        state.program = d.program || null;
        G.registerCustom(state.custom);
        state.plan = null; save(); render(); toast('Backup restored');
      });
    }).catch(() => toast("That file isn't a WeZza backup"));
    el.value = '';
  }
  else if (f === 'import-csv') {
    const file = el.files[0]; if (!file) return;
    el.value = '';
    file.text().then(t => {
      const { workouts, created, source } = importCSV(t, state);
      const have = new Set(state.workouts.map(w => Math.round(w.start / 60e3)));
      const fresh = workouts.filter(w => !have.has(Math.round(w.start / 60e3)));
      if (!fresh.length) { toast(workouts.length ? 'Those workouts are already in your history' : 'No workouts found in that file'); return; }
      const used = new Set(fresh.flatMap(w => w.exercises.map(e => e.exId)));
      const newEx = created.filter(e => used.has(e.id));
      return ask(`Import ${fresh.length} workout${fresh.length === 1 ? '' : 's'} from ${source}?` +
        (newEx.length ? `\n\n${newEx.length} exercise${newEx.length === 1 ? '' : 's'} WeZza doesn't know will be added as custom exercises.` : ''), { ok: 'Import' }).then(yes => {
        if (!yes) return;
        state.custom.push(...newEx);
        G.registerCustom(newEx);
        state.workouts.push(...fresh);
        for (const w of [...fresh].sort((a, b) => a.start - b.start)) w.prs = G.workoutPRs(state, w);
        state.plan = null; save(); render();
        toast(`Imported ${fresh.length} workout${fresh.length === 1 ? '' : 's'}`);
      });
    }).catch(() => toast("Couldn't read that CSV. Export it from Strong or Hevy and try again"));
  }

});

// The body map doubles as a muscle picker in "Pick muscles" mode.
document.addEventListener('click', e => {
  const m = e.target.closest('.bodymap [data-muscle]');
  if (!m || state.active || state.ui.tab !== 'train' || $('.modal-wrap')) return;
  const muscle = m.dataset.muscle;
  if (state.ui.focus !== 'custom') {
    const rec = G.recovery(state)[muscle];
    toast(`${MUSCLES[muscle].name}: ${rec}% recovered`);
    return;
  }
  const c = state.ui.custom;
  state.ui.custom = c.includes(muscle) ? c.filter(x => x !== muscle) : [...c, muscle];
  if (state.ui.custom.length) newPlan(); else state.plan = { exercises: [], targets: [], focus: 'custom' };
  save(); render();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.active && !wakeLock)
    navigator.wakeLock?.request('screen').then(l => wakeLock = l).catch(() => {});
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

render();
