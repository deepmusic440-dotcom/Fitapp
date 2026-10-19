// AI coach: turns the athlete's data into a prompt and talks to Claude. Inside the Claude
// app (WeZza published as an artifact) it uses the viewer's own Claude account; anywhere
// else it uses an Anthropic API key the user pastes in, kept only on this device.
import { MUSCLES, EXERCISES, EX, EQUIPMENT } from './data.js';
import * as G from './engine.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.131.0/+esm';
const MODEL = 'claude-opus-5-5';
const KEY_STORE = 'wezza.apikey';
const MAX_TURNS = 20;

export const apiKey = {
  get() { try { return localStorage.getItem(KEY_STORE) || ''; } catch { return ''; } },
  set(v) { try { v ? localStorage.setItem(KEY_STORE, v) : localStorage.removeItem(KEY_STORE); } catch {} },
};

export const framed = window.top !== window.self;

let samplePromise;
/** The Claude viewer's `sample` function, or null when WeZza isn't running inside Claude. */
export function viewerSample() {
  samplePromise ??= window.claude?.use ? window.claude.use('sample').catch(() => null) : Promise.resolve(null);
  return samplePromise;
}

/** Whether photos can be sent: through the viewer only when it reports image support. */
export async function photosAllowed(mode) {
  if (mode === 'key') return true;
  if (mode !== 'claude') return false;
  const limits = await (await viewerSample()).limits().catch(() => null);
  return !!limits?.images;
}

/**
 * Shrink a picked photo for sending (long side 1568px, JPEG) plus a small thumbnail
 * for the chat history. Rejects { code: 'image_decode' } if the browser can't read it.
 */
export async function prepareImage(file) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { throw { code: 'image_decode' }; }
  const draw = max => {
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c;
  };
  const blob = await new Promise(r => draw(1568).toBlob(r, 'image/jpeg', 0.85));
  const thumb = draw(480).toDataURL('image/jpeg', 0.7);
  bmp.close?.();
  if (!blob) throw { code: 'image_decode' };
  return { blob, thumb };
}

const toBase64 = blob => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1]);
  r.onerror = () => reject({ code: 'image_decode' });
  r.readAsDataURL(blob);
});

/** Which way the coach can reach Claude: 'claude', 'key', or 'none' (framed elsewhere: 'blocked'). */
export async function coachMode() {
  if (await viewerSample()) return 'claude';
  if (framed) return 'blocked'; // embedded hosts block direct API calls
  return apiKey.get() ? 'key' : 'none';
}

/** Recent turns, oldest first, starting on a user turn, with same-role neighbours merged. */
function turns(history) {
  const out = [];
  for (const m of history.slice(-MAX_TURNS)) {
    if (!out.length && m.role !== 'user') continue;
    // Photos go only with the newest message; earlier ones are noted so replies about them still make sense.
    const content = (m.photo ? '[The athlete attached a photo to this message.]\n' : '') + m.content;
    const last = out.at(-1);
    if (last?.role === m.role) last.content += '\n\n' + content;
    else out.push({ role: m.role, content });
  }
  return out;
}

/**
 * Ask the coach. `onText` receives the whole answer so far as it streams; `image`
 * (a JPEG Blob) goes with the newest message. Rejects with { code } — see errorText().
 */
export async function askCoach(context, history, { onText, signal, image }) {
  const msgs = turns(history);
  const sample = await viewerSample();
  if (sample) {
    const { text } = await sample([{ role: 'user', content: context }, ...msgs], {
      cache: false, signal, onText: ({ text }) => onText(text), ...(image ? { images: image } : {}),
    });
    return text;
  }
  if (image) {
    const last = msgs.at(-1);
    last.content = [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: await toBase64(image) } },
      { type: 'text', text: last.content }];
  }
  const key = apiKey.get();
  if (!key) throw { code: 'no_key' };
  let Anthropic;
  try { ({ default: Anthropic } = await import(SDK_URL)); } catch { throw { code: 'offline' }; }
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  try {
    const stream = client.beta.messages.stream({
      model: MODEL, max_tokens: 64000, system: context, messages: msgs,
      thinking: { type: 'adaptive' }, output_config: { effort: 'medium' },
      // Re-run a declined request on Anthropic's recommended fallback model.
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    }, { signal });
    stream.on('text', (_, snapshot) => onText(snapshot));
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') throw { code: 'refused' };
    return msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
  } catch (e) {
    if (e?.code) throw e;
    if (e instanceof Anthropic.APIUserAbortError) throw { code: 'cancelled' };
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw { code: 'bad_key' };
    if (e instanceof Anthropic.RateLimitError) throw { code: 'rate_limited' };
    if (e instanceof Anthropic.APIConnectionError) throw { code: 'offline' };
    throw { code: 'upstream_error' };
  }
}

export function errorText(code) {
  return {
    not_granted: 'You didn’t allow WeZza to use Claude. Reload the page to be asked again.',
    sampling_disabled: 'Claude isn’t available for this account.',
    rate_limited: 'Too many requests right now. Wait a minute, then try again.',
    session_expired: 'Your Claude session expired. Sign in again, then retry.',
    refused: 'The coach couldn’t help with that one. Try asking it a different way.',
    bad_key: 'That API key didn’t work. Check it under Profile → AI coach.',
    no_key: 'Add an Anthropic API key to use the coach.',
    offline: 'Couldn’t reach Claude. Check your connection and try again.',
    prompt_too_large: 'This chat got too long. Start a new chat and ask again.',
    images_unavailable: 'Photos can’t be sent from this view. Ask in words instead.',
    image_rejected: 'That photo couldn’t be used. Try a different one.',
    image_decode: 'Couldn’t read that photo. Try a JPEG or PNG.',
  }[code] || 'Something went wrong. Try again.';
}

// ---------- context ----------
const day = t => new Date(t).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** Everything the coach should know, as plain text. Units follow the athlete's setting. */
export function coachContext(state, programOf) {
  const p = state.profile, u = p.unit;
  const W = kg => G.fmtW(kg, u);
  const dist = km => +(u === 'lb' ? km / 1.609344 : km).toFixed(2) + (u === 'lb' ? ' mi' : ' km');
  const setTxt = (d, s) => d.cardio ? [s.dist ? dist(s.dist) : '', s.time ? Math.round(s.time / 60) + ' min' : ''].filter(Boolean).join(' / ')
    : (d.bw && !s.weight ? `${s.reps}${d.timed ? 's' : ' reps'}` : `${W(s.weight)}×${s.reps}`) + (s.rpe ? ` @RPE${s.rpe}` : '') + (s.kind ? ` (${s.kind})` : '');

  const ws = [...state.workouts].sort((a, b) => b.start - a.start);
  const recent = ws.slice(0, 12).map(w => `- ${day(w.start)} · ${w.title || 'Workout'} · ${Math.round(((w.end || w.start) - w.start) / 60000)} min: ` +
    w.exercises.map(e => { const d = EX[e.exId]; return d ? `${d.name} ${G.workingSets(e).map(s => setTxt(d, s)).join(', ')}` : ''; }).filter(Boolean).join('; ') +
    (w.notes ? ` — note: "${w.notes.slice(0, 120)}"` : '')).join('\n');

  const counts = {};
  ws.forEach(w => w.exercises.forEach(e => counts[e.exId] = (counts[e.exId] || 0) + 1));
  const lifts = Object.keys(counts).filter(id => EX[id] && !EX[id].cardio && G.exerciseHistory(state, id).length)
    .sort((a, b) => counts[b] - counts[a]).slice(0, 12).map(id => {
    const d = EX[id], pb = G.personalBests(state, id), last = G.exerciseHistory(state, id)[0];
    const best = d.bw && !pb.bestW ? `best ${pb.bestReps}${d.timed ? 's' : ' reps'}` : `est. 1RM ${W(pb.best1rm)} ${u}, heaviest ${W(pb.bestW)} ${u}`;
    return `- ${d.name} (${id}): ${best}; ${counts[id]} sessions; last ${day(last.date)}: ${last.sets.map(s => setTxt(d, s)).join(', ')}; next target: ${G.prescribe(state, id).note}`;
  }).join('\n');

  const rec = G.recovery(state);
  const body = [...state.body].sort((a, b) => a.t - b.t);
  const pr = state.program && programOf(state.program.id);
  const avail = EXERCISES.filter(e => G.available(state, e) || e.cardio);
  const lib = avail.map(e => `${e.id} | ${e.name} | ${e.primary.map(m => MUSCLES[m].name).join('/')}` +
    `${e.cardio ? ' | cardio' : e.timed ? ' | timed (reps = seconds)' : e.bw ? ' | bodyweight' : ''}`).join('\n');
  const weekly = G.weeklyVolume(state, 4).map(w => w.count).join(', ');

  return `You are WeZza Coach, an experienced, encouraging strength and conditioning coach built into the WeZza workout app. You answer the athlete's training questions and plan workouts for them, using their real data below.

Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.

## Athlete
- Name: ${p.name || 'not given'}
- Goal: ${p.goal}; experience: ${p.level}; sex: ${p.sex}; bodyweight: ${W(p.bodyweight)} ${u}
- Usual session length: ${p.minutes} min; weekly goal: ${p.weeklyGoal} workouts (last 4 weeks: ${weekly}); weekly streak: ${G.streakWeeks(state)}
- Equipment: ${p.equipment.map(e => EQUIPMENT[e]).join(', ') || 'none (bodyweight only)'}
- Never suggest: ${p.excluded.map(id => EX[id]?.name).filter(Boolean).join(', ') || 'nothing excluded'}
- Units: ${u === 'lb' ? 'pounds and miles' : 'kilograms and kilometres'}
- Program: ${pr ? `${pr.name}, next day "${pr.days[state.program.day % pr.days.length].name}", ${state.program.done} sessions done` : 'none (uses the app’s recovery-based Smart workouts)'}

## Muscle recovery now (100 = fully fresh)
${Object.entries(rec).map(([m, v]) => `${MUSCLES[m].name} ${v}`).join(', ')}

## Recent workouts (newest first)
${recent || 'No workouts logged yet.'}

## Main lifts
${lifts || 'No lifting history yet.'}

## Body
${body.length ? `Latest weight ${W(body.at(-1).weight)} ${u} on ${day(body.at(-1).t)}; first logged ${W(body[0].weight)} ${u} on ${day(body[0].t)}.` : 'No body measurements logged.'}

## Exercise library (id | name | main muscles | type)
These are the only exercises available with the athlete's equipment.
${lib}

## How to answer
- Be concise and practical: short paragraphs or bullet points, plain language, Markdown allowed (bold, lists, short ### headings), no tables.
- Ground advice in the data above and mention specifics (their lifts, recovery, recent sessions). If data is missing, say what you're assuming.
- When the athlete asks for a single workout, or a workout is clearly the best answer, give a one- or two-sentence rationale and then exactly one fenced block like this:
\`\`\`workout
{"title": "Upper Push", "exercises": [{"id": "bench", "sets": 4, "reps": [6, 10], "rest": 150}, {"id": "lateral_raise", "sets": 3, "reps": [12, 20], "rest": 60}, {"id": "run", "minutes": 20}]}
\`\`\`
- When they ask for a multi-day plan, split or program, give a short overview and then exactly one fenced block:
\`\`\`program
{"title": "Bench Specialisation", "days": [{"name": "Day 1 · Heavy Bench", "exercises": [{"id": "bench", "sets": 5, "reps": [3, 5], "rest": 180}]}, {"name": "Day 2 · Legs", "exercises": []}]}
\`\`\`
  The app rotates through the days in order, one per session.
- Use only ids from the library. "reps" is [low, high] (equal for a fixed count); for timed exercises they are seconds. Cardio uses "minutes" instead of sets and reps. "rest" is seconds.
- Do not put weights in the JSON. The app sets each working weight from the athlete's history and progresses it automatically. You may suggest loads in the text.
- Fit workouts to their session length, recovery and equipment unless they ask otherwise. Don't restate the JSON as a list; the app shows it as a card.
- The athlete may attach a photo: their form or physique, a gym machine or equipment, a meal or nutrition label, a program or whiteboard, a screenshot from another app, or an injury. Say briefly what you see that matters, then answer. A single frame shows only one moment of a lift, so say what you can and can't judge from it. For equipment, explain how to use it and suggest matching exercises from the library. For food, give rough estimates and say so. Don't try to identify people.
- For pain, injury or medical questions, be careful: suggest safe alternatives, don't diagnose, and recommend a qualified professional when appropriate.`;
}

// ---------- reading the coach's replies ----------
/**
 * Split a reply into text and plan blocks. While streaming, an unfinished block
 * becomes { type: 'pending' } so half-written JSON never shows.
 */
export function parseReply(text) {
  const parts = [];
  const rx = /```(workout|program)\s*\n([\s\S]*?)```/g;
  let at = 0, m;
  while ((m = rx.exec(text))) {
    if (m.index > at) parts.push({ type: 'text', text: text.slice(at, m.index) });
    try { parts.push({ type: m[1], data: JSON.parse(m[2]) }); }
    catch { parts.push({ type: 'text', text: '(The coach sent a plan the app couldn’t read. Ask it to try again.)' }); }
    at = rx.lastIndex;
  }
  const rest = text.slice(at);
  const open = rest.search(/```(workout|program)/);
  if (open >= 0) {
    if (open > 0) parts.push({ type: 'text', text: rest.slice(0, open) });
    parts.push({ type: 'pending' });
  } else if (rest) parts.push({ type: 'text', text: rest });
  return parts;
}

/** Look up an exercise the coach named, by id or (as a fallback) by name. */
export function resolveExercise(x) {
  if (EX[x?.id]) return x.id;
  const n = String(x?.name || x?.id || '').toLowerCase();
  return EXERCISES.find(e => e.name.toLowerCase() === n)?.id || null;
}

/** A program day entry ({ id, sets, lo, hi, rest }) from one coach exercise, or null. */
export function coachEntry(x) {
  const id = resolveExercise(x);
  if (!id) return null;
  const int = (v, lo, hi) => { const n = Math.round(Number(v)); return isFinite(n) && n > 0 ? Math.min(hi, Math.max(lo, n)) : null; };
  if (EX[id].cardio) return { id, sets: 1, lo: null, hi: null, rest: 0, minutes: int(x.minutes, 1, 600) };
  const [a, b] = Array.isArray(x.reps) ? x.reps : [x.reps, x.reps];
  const lo = int(a, 1, 300), hi = int(b, 1, 300);
  return { id, sets: int(x.sets, 1, 10) ?? 3, lo, hi: lo && hi ? Math.max(lo, hi) : hi, rest: x.rest == null ? null : Math.min(600, Math.max(0, Math.round(+x.rest) || 0)) };
}

// ---------- tiny, safe Markdown ----------
const escH = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inline = s => escH(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');

/** Render the coach's Markdown subset (headings, lists, bold, italics, code) as escaped HTML. */
export function md(text) {
  const out = [];
  let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of text.replace(/```[\s\S]*?```/g, '').split('\n')) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { close(); continue; }
    if ((m = line.match(/^#{1,6}\s+(.*)/))) { close(); out.push(`<h4>${inline(m[1])}</h4>`); }
    else if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); }
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close();
  return out.join('');
}
