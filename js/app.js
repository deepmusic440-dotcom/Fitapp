import { MUSCLES, EQUIPMENT, FOCUS, EXERCISES, EX } from './data.js';
import * as G from './engine.js';
import { bodyMap, heatColor } from './body.js';

const KEY = 'forge.v1';
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT = {
  profile: {
    onboarded: false, name: '', goal: 'hypertrophy', level: 'intermediate', sex: 'male',
    bodyweight: 75, unit: 'kg', minutes: 45, equipment: Object.keys(EQUIPMENT),
    excluded: [], favorites: [], warmups: true, core: true, restOverride: 0, sound: true,
  },
  workouts: [],
  active: null,
  plan: null,
  ui: { tab: 'train', focus: 'auto', custom: [], progressEx: null },
};

let state = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) return { ...DEFAULT, ...s, profile: { ...DEFAULT.profile, ...s.profile }, ui: { ...DEFAULT.ui, ...s.ui } };
  } catch {}
  return structuredClone(DEFAULT);
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

const unit = () => state.profile.unit;
const W = kg => G.fmtW(kg, unit());

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
    <div class="brand"><span class="logo">${icon('flame')}</span><h1>Forge</h1></div>
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
  if (!state.plan) newPlan();
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
    ${streak ? `<div class="streak" title="Weekly streak">${icon('flame')}<b>${streak}</b><span>wk</span></div>` : ''}
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

  <section class="plan">
    <div class="cardhead">
      <h3>${plan.exercises.length} exercises · ~${G.estimateMinutes(plan.exercises)} min</h3>
      <div class="row tight">
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
  const load = d.bw && !s0.weight ? (d.timed ? `${s0.reps}s` : `${s0.reps} reps`) : `${s0.reps}${d.timed ? 's' : ''} × ${W(s0.weight)} ${unit()}${d.perHand ? ' ea' : ''}`;
  return `<article class="exrow">
    <div class="exnum">${i + 1}</div>
    <div class="exmain" data-act="ex-info" data-val="${d.id}">
      <h4>${esc(d.name)}</h4>
      <p>${work.length} sets · ${load}</p>
      <p class="muted sm">${d.primary.map(m => MUSCLES[m].name).join(', ')}${e.note ? ` · <span class="accent">${esc(e.note)}</span>` : ''}</p>
    </div>
    <button class="icbtn" data-act="swap" data-ctx="plan" data-i="${i}" aria-label="Swap">${icon('swap')}</button>
    <button class="icbtn" data-act="remove" data-ctx="plan" data-i="${i}" aria-label="Remove">${icon('x')}</button>
  </article>`;
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
  return `
  <header class="top active-top">
    <button class="btn ghost sm" data-act="cancel-workout">Discard</button>
    <div class="center"><div id="elapsed" class="elapsed">0:00</div><div class="muted sm">${done}/${total} sets</div></div>
    <button class="btn primary sm" data-act="finish-workout">Finish</button>
  </header>
  <div class="progressbar"><i style="width:${total ? done / total * 100 : 0}%"></i></div>
  <main class="view workout">
    ${a.exercises.map((e, i) => activeExercise(e, i)).join('')}
    <button class="btn ghost wide" data-act="add-ex" data-ctx="active">${icon('plus')} Add exercise</button>
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
  let wi = 0;
  const rows = e.sets.map((s, j) => {
    const p = s.warmup ? null : prev[wi++];
    const label = s.warmup ? 'W' : (j - e.sets.filter((x, k) => k < j && x.warmup).length + 1);
    const prevTxt = p ? (d.bw && !p.weight ? `${p.reps}${d.timed ? 's' : ''}` : `${W(p.weight)}×${p.reps}`) : '—';
    return `<div class="setrow ${s.done ? 'done' : ''} ${s.warmup ? 'warm' : ''}">
      <span class="setn">${label}</span>
      <span class="prev muted">${prevTxt}</span>
      <input type="number" inputmode="decimal" step="any" data-field="w" data-i="${i}" data-j="${j}" value="${s.weight ? W(s.weight) : (d.bw ? '' : '0')}" placeholder="${d.bw ? 'BW' : '0'}" aria-label="Weight">
      <input type="number" inputmode="numeric" data-field="r" data-i="${i}" data-j="${j}" value="${s.reps || ''}" placeholder="0" aria-label="${d.timed ? 'Seconds' : 'Reps'}">
      <button class="check" data-act="toggle-set" data-i="${i}" data-j="${j}" aria-label="Complete set">${icon('check')}</button>
    </div>`;
  }).join('');

  return `<section class="card excard ${allDone ? 'complete' : ''}">
    <div class="cardhead">
      <div data-act="ex-info" data-val="${d.id}" class="grow">
        <h3>${esc(d.name)}</h3>
        <p class="muted sm">${d.primary.map(m => MUSCLES[m].name).join(', ')} · target ${e.target?.lo ?? ''}–${e.target?.hi ?? ''}${d.timed ? 's' : ' reps'}${d.perHand ? ' · per hand' : ''}</p>
        ${e.note ? `<p class="accent sm">${esc(e.note)}</p>` : ''}
      </div>
      ${d.bar ? `<button class="icbtn" data-act="plates" data-i="${i}" aria-label="Plate calculator">${icon('plate')}</button>` : ''}
      <button class="icbtn" data-act="swap" data-ctx="active" data-i="${i}" aria-label="Swap">${icon('swap')}</button>
      <button class="icbtn" data-act="remove" data-ctx="active" data-i="${i}" aria-label="Remove">${icon('x')}</button>
    </div>
    <div class="sethead"><span>Set</span><span>Previous</span><span>${unit()}</span><span>${d.timed ? 'Sec' : 'Reps'}</span><span></span></div>
    ${rows}
    <div class="row tight">
      <button class="btn ghost sm" data-act="add-set" data-i="${i}">${icon('plus')} Set</button>
      ${e.sets.length > 1 ? `<button class="btn ghost sm" data-act="del-set" data-i="${i}">Remove set</button>` : ''}
      <span class="muted sm grow right">Rest ${fmtDur((e.rest || 90) * 1000)}</span>
    </div>
  </section>`;
}

// ----- progress -----
function progressView() {
  const ws = state.workouts;
  if (!ws.length) return `<header class="top"><h1>Progress</h1></header>
    <div class="empty big">${icon('progress')}<p>Finish your first workout and your strength trends, PRs and weekly volume will show up here.</p></div>`;

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
  const useReps = d?.bw && hist.every(h => h.sets.every(s => !s.weight));
  const pts = hist.map(h => ({
    x: h.date,
    y: useReps ? Math.max(...h.sets.map(s => s.reps)) : G.toDisplay(Math.max(...h.sets.map(s => G.e1rm(s.weight, s.reps))), unit()),
  }));
  const pb = exId ? G.personalBests(state, exId) : null;

  return `<header class="top"><h1>Progress</h1></header>
  <div class="tiles">
    <div class="tile"><b>${ws.length}</b><span>Workouts</span></div>
    <div class="tile"><b>${thisWeek.count}</b><span>This week</span></div>
    <div class="tile"><b>${G.streakWeeks(state)}</b><span>Week streak</span></div>
    <div class="tile"><b>${fmtBig(G.toDisplay(totalVol, unit()))}</b><span>${unit()} lifted</span></div>
  </div>

  <section class="card">
    <div class="cardhead"><h3>Strength trend</h3></div>
    <select data-field="progressEx" class="select">${trained.map(id => `<option value="${id}" ${id === exId ? 'selected' : ''}>${esc(EX[id].name)}</option>`).join('')}</select>
    ${pb ? `<div class="pbrow">
      ${useReps ? `<div><b>${pb.bestReps}${d.timed ? 's' : ''}</b><span>Best ${d.timed ? 'hold' : 'reps'}</span></div>` : `
      <div><b>${W(pb.best1rm)}</b><span>Est. 1RM (${unit()})</span></div>
      <div><b>${W(pb.bestW)}</b><span>Heaviest (${unit()})</span></div>`}
      <div><b>${hist.length}</b><span>Sessions</span></div>
    </div>` : ''}
    ${lineChart(pts, useReps ? (d.timed ? 'sec' : 'reps') : unit())}
  </section>

  <section class="card">
    <div class="cardhead"><h3>Weekly volume</h3><span class="muted sm">${unit()} × reps</span></div>
    ${barChart(weekly.map(w => ({ label: new Date(w.start).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }), value: G.toDisplay(w.volume, unit()) })))}
  </section>

  <section class="card">
    <div class="cardhead"><h3>Sets per muscle · last 7 days</h3><span class="muted sm">10–20 is a good target</span></div>
    <div class="hbars">${Object.entries(smuscle).sort((a, b) => b[1] - a[1]).map(([m, v]) => `
      <div class="hbar"><span>${MUSCLES[m].name}</span><i><em style="width:${Math.min(100, v / 20 * 100)}%;${v >= 10 ? '' : 'opacity:.55'}"></em></i><b>${+v.toFixed(1)}</b></div>`).join('')}
    </div>
  </section>`;
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
  return `<header class="top"><h1>History</h1><span class="muted">${ws.length} workouts</span></header>
  ${ws.map(w => {
    const prs = w.prs?.length || 0;
    return `<article class="card hist" data-act="open-workout" data-val="${w.id}">
      <div class="cardhead"><h3>${esc(w.title || 'Workout')}</h3><span class="muted sm">${fmtDate(w.start)}</span></div>
      <p class="muted sm">${fmtDur((w.end || w.start) - w.start)} · ${fmtBig(G.toDisplay(G.workoutVolume(w), unit()))} ${unit()} · ${w.exercises.length} exercises${prs ? ` · <span class="accent">${prs} PR${prs > 1 ? 's' : ''}</span>` : ''}</p>
      <p class="sm">${w.exercises.map(e => esc(EX[e.exId]?.name)).join(' · ')}</p>
    </article>`;
  }).join('')}`;
}

function workoutDetail(id) {
  const w = state.workouts.find(x => x.id === id);
  if (!w) return '';
  return `<h2>${esc(w.title || 'Workout')}</h2>
  <p class="muted">${new Date(w.start).toLocaleString()} · ${fmtDur(w.end - w.start)}</p>
  ${w.prs?.length ? `<div class="prlist">${w.prs.map(p => `<div>🏆 ${esc(EX[p.exId]?.name)} — ${p.kind} <b>${p.w ? W(p.value) + ' ' + unit() : p.value}</b></div>`).join('')}</div>` : ''}
  ${w.exercises.map(e => {
    const d = EX[e.exId]; const sets = G.workingSets(e);
    return `<div class="detail-ex"><h4>${esc(d?.name)}</h4>
      <p class="muted sm">${sets.map(s => d.bw && !s.weight ? `${s.reps}${d.timed ? 's' : ''}` : `${W(s.weight)}×${s.reps}`).join(' · ') || 'No sets completed'}</p></div>`;
  }).join('')}
  <div class="row"><button class="btn ghost danger" data-act="delete-workout" data-val="${w.id}">${icon('trash')} Delete</button>
  <button class="btn ghost" data-act="repeat-workout" data-val="${w.id}">${icon('refresh')} Repeat this workout</button></div>`;
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
    <h3>Rest timer</h3>
    <div class="chips">${[[0, 'Auto'], [45, '45s'], [60, '60s'], [90, '90s'], [120, '2m'], [180, '3m']].map(([v, l]) => chip('p-rest', v, l, p.restOverride === v)).join('')}</div>
  </section>
  <section class="card">
    <div class="cardhead"><h3>Exercise preferences</h3><button class="btn ghost sm" data-act="manage-ex">Manage</button></div>
    <p class="muted sm">${p.favorites.length} favorite · ${p.excluded.length} excluded</p>
  </section>
  <section class="card">
    <h3>Your data</h3>
    <p class="muted sm">Everything is stored on this device only. Export a backup to move it to another phone.</p>
    <div class="row wrap">
      <button class="btn ghost" data-act="export">Export backup</button>
      <label class="btn ghost">Import<input type="file" accept="application/json" data-field="import" hidden></label>
      <button class="btn ghost danger" data-act="reset">Reset all</button>
    </div>
  </section>
  <p class="muted sm center">Forge · free, offline, private</p>`;
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

function pickerModal(title, list, act, ctx, i) {
  const m = modal(`<h2>${title}</h2>
    <input type="search" class="search" placeholder="Search exercises" data-field="search">
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
  modal(`<h2>${esc(d.name)}</h2>
    <p class="muted">${d.type === 'compound' ? 'Compound' : 'Isolation'} · ${d.equip.map(q => EQUIPMENT[q]).join(', ') || 'Bodyweight'}</p>
    <div class="musclebars">
      ${d.primary.map(m => `<span class="tag primary">${MUSCLES[m].name}</span>`).join('')}
      ${d.secondary.map(m => `<span class="tag">${MUSCLES[m].name}</span>`).join('')}
    </div>
    <div class="pbrow">
      <div><b>${d.bw && !pb.bestW ? pb.bestReps || '—' : (pb.best1rm ? W(pb.best1rm) : '—')}</b><span>${d.bw && !pb.bestW ? 'Best reps' : 'Est. 1RM'}</span></div>
      <div><b>${hist.length}</b><span>Sessions</span></div>
      <div><b>${d.bw && !p.weight ? p.reps : W(p.weight)}</b><span>Next target</span></div>
    </div>
    <p class="accent sm">${esc(p.note)}</p>
    ${hist.length ? `<h3>Recent sessions</h3>${hist.slice(0, 5).map(h => `<div class="detail-ex"><span class="muted sm">${fmtDate(h.date)}</span>
      <p class="sm">${h.sets.map(s => d.bw && !s.weight ? `${s.reps}` : `${W(s.weight)}×${s.reps}`).join(' · ')}</p></div>`).join('')}` : ''}
    <div class="row">
      <button class="btn ghost" data-act="fav" data-val="${id}">${icon('star')} ${fav ? 'Unfavorite' : 'Favorite'}</button>
      <button class="btn ghost danger" data-act="exclude" data-val="${id}">Never suggest</button>
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
      <div class="prlist">${w.prs.map(p => `<div>${esc(EX[p.exId].name)} — ${p.kind} <b>${p.w ? W(p.value) + ' ' + unit() : p.value}</b></div>`).join('')}</div>` : ''}
    <h3>Muscles worked</h3>
    ${bodyMap(worked)}
    <button class="btn primary big" data-act="close-modal">Done</button>
  </div>`);
}

// ---------- actions ----------
let restTimer = null, elapsedTimer = null, wakeLock = null;

function startWorkout() {
  const plan = state.plan;
  state.active = {
    id: uid(), start: Date.now(), title: workoutTitle(plan.exercises),
    exercises: structuredClone(plan.exercises), restEnd: 0,
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
  if (!done) { if (confirm('No sets completed. Discard this workout?')) discard(); return; }
  a.end = Date.now();
  a.exercises = a.exercises.filter(e => e.sets.some(s => s.done)).map(e => ({ ...e, sets: e.sets.filter(s => s.done) }));
  const w = { id: a.id, start: a.start, end: a.end, title: a.title, exercises: a.exercises.map(({ exId, sets }) => ({ exId, sets })) };
  w.prs = G.workoutPRs({ ...state, workouts: [...state.workouts, w] }, w);
  state.workouts.push(w);
  state.active = null;
  stopTimers();
  save(); render();
  summaryModal(w);
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
    const fresh = G.buildExercise(state, v, list[i].sets.filter(s => !s.warmup).length);
    if (keepDone) list.splice(i + 1, 0, fresh); else list[i] = fresh;
    closeModal();
  },
  remove: (_, el) => {
    const list = target(el.dataset.ctx), i = +el.dataset.i;
    if (el.dataset.ctx === 'active' && list[i].sets.some(s => s.done) && !confirm('Remove this exercise and its logged sets?')) return 'keep';
    list.splice(i, 1);
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
      if (!s.reps) s.reps = ex.target?.lo || 8;
      const rest = s.warmup ? 45 : (ex.rest || 90);
      const last = ex.sets.every(x => x.done) && i === state.active.exercises.length - 1;
      if (!last) state.active.restEnd = Date.now() + rest * 1000;
      navigator.vibrate?.(30);
    }
  },
  'add-set': (_, el) => {
    const ex = state.active.exercises[+el.dataset.i];
    const last = ex.sets.filter(s => !s.warmup).at(-1) || ex.sets.at(-1) || { weight: 0, reps: 8 };
    ex.sets.push({ weight: last.weight, reps: last.reps, done: false });
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
  'cancel-workout': () => { if (confirm('Discard this workout? Logged sets will be lost.')) discard(); return 'keep'; },
  'close-modal': () => { closeModal(); return 'keep'; },
  'open-workout': v => { modal(workoutDetail(v)); return 'keep'; },
  'delete-workout': v => {
    if (!confirm('Delete this workout?')) return 'keep';
    state.workouts = state.workouts.filter(w => w.id !== v); closeModal();
  },
  'repeat-workout': v => {
    const w = state.workouts.find(x => x.id === v);
    state.plan = { exercises: w.exercises.filter(e => EX[e.exId]).map(e => G.buildExercise(state, e.exId, Math.max(2, G.workingSets(e).length))), targets: [], focus: 'repeat' };
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
    const blob = new Blob([JSON.stringify({ app: 'forge', version: 1, exported: new Date().toISOString(), profile: state.profile, workouts: state.workouts }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `forge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return 'keep';
  },
  reset: () => {
    if (!confirm('Erase all workouts and settings on this device?')) return 'keep';
    state = structuredClone(DEFAULT);
  },
};

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
      if (!confirm(`Import ${d.workouts.length} workouts? This replaces current data.`)) return;
      state.workouts = d.workouts;
      state.profile = { ...DEFAULT.profile, ...d.profile, onboarded: true };
      state.plan = null; save(); render(); toast('Backup restored');
    }).catch(() => toast("That file isn't a Forge backup"));
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
