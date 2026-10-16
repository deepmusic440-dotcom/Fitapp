// Front/back anatomical heat map rendered as inline SVG.

// Each muscle maps to a list of SVG path strings, mirrored for left/right.
const mirror = d => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(160 - +x).toFixed(1)},${y}`);
const pair = d => [d, mirror(d)];

const FRONT = {
  shoulders: pair('M52,72 C40,72 32,82 32,96 C34,104 40,106 46,102 C50,92 56,84 62,78 C60,74 56,72 52,72 Z'),
  chest: pair('M78,80 L64,80 C56,86 50,94 48,104 C52,116 62,120 78,118 Z'),
  biceps: pair('M34,108 C28,116 27,134 30,146 C34,150 40,149 43,144 C46,132 46,118 44,108 C41,104 37,104 34,108 Z'),
  forearms: pair('M29,152 C24,164 21,182 22,198 C25,201 29,201 31,198 C35,186 40,170 42,152 C38,148 32,148 29,152 Z'),
  abs: ['M70,122 L78,121 L78,198 C74,197 70,192 68,184 L67,134 C67,127 68,123 70,122 Z',
        'M90,122 L82,121 L82,198 C86,197 90,192 92,184 L93,134 C93,127 92,123 90,122 Z'],
  obliques: pair('M64,122 C58,126 54,134 54,146 C55,164 58,180 64,192 C66,188 66,180 66,170 L65,134 C65,128 65,124 64,122 Z'),
  quads: pair('M58,206 C52,222 50,250 54,276 C57,288 64,292 70,290 C75,278 77,258 77,236 C76,224 72,212 66,204 Z'),
  adductors: pair('M74,208 C76,218 78,232 78,246 C76,252 74,254 72,252 C70,240 68,226 68,212 Z'),
  calves: pair('M56,300 C52,314 52,334 56,350 C59,352 62,352 64,350 C67,334 68,316 66,300 C62,296 58,296 56,300 Z'),
  traps: pair('M70,60 C66,66 60,70 54,72 L64,76 L76,74 Z'),
};

const BACK = {
  traps: ['M80,56 C74,62 64,68 54,72 C62,78 70,90 74,110 L80,118 L86,110 C90,90 98,78 106,72 C96,68 86,62 80,56 Z'],
  shoulders: pair('M52,72 C40,72 32,82 32,96 C34,104 40,106 46,102 C48,92 52,84 58,78 C56,74 54,72 52,72 Z'),
  upperback: pair('M58,80 C54,88 52,98 54,108 C60,114 68,116 72,110 C70,98 66,88 60,80 Z'),
  lats: pair('M52,110 C50,128 54,148 64,166 C70,170 74,168 76,160 L76,128 C70,122 62,116 52,110 Z'),
  triceps: pair('M34,106 C28,116 27,134 30,146 C34,150 40,149 43,144 C46,132 46,118 45,106 C41,102 37,102 34,106 Z'),
  forearms: pair('M29,152 C24,164 21,182 22,198 C25,201 29,201 31,198 C35,186 40,170 42,152 C38,148 32,148 29,152 Z'),
  lowerback: ['M76,166 L78,128 L82,128 L84,166 C88,174 90,182 90,190 L70,190 C70,182 72,174 76,166 Z'],
  glutes: pair('M78,194 L64,192 C56,196 52,206 54,220 C58,232 70,236 78,230 Z'),
  hamstrings: pair('M56,236 C52,252 52,272 56,288 C60,294 66,294 70,290 C74,276 76,258 76,240 C70,240 62,238 56,236 Z'),
  adductors: pair('M76,240 C77,250 78,262 77,274 C75,276 73,276 72,274 C72,262 73,250 74,240 Z'),
  calves: pair('M55,300 C50,314 50,334 55,348 C59,352 63,352 66,348 C69,334 69,314 66,300 C62,295 58,295 55,300 Z'),
};

const SILHOUETTE = [
  // head + neck
  'M80,14 C70,14 64,22 64,33 C64,44 71,52 80,52 C89,52 96,44 96,33 C96,22 90,14 80,14 Z',
  'M72,50 L88,50 L90,62 L70,62 Z',
  // torso
  'M54,70 C44,72 34,80 32,94 L30,108 C26,124 26,140 28,150 C22,166 19,184 20,200 L18,214 C20,220 26,222 30,216 L32,200 C38,184 44,166 46,150 L50,128 C52,148 54,170 54,190 C52,204 50,224 50,250 C50,272 52,290 54,300 C50,316 50,336 54,350 L52,356 C58,360 66,360 68,354 C70,336 70,314 68,298 C74,280 78,258 79,236 L80,230 L81,236 C82,258 86,280 92,298 C90,314 90,336 92,354 C94,360 102,360 108,356 L106,350 C110,336 110,316 106,300 C108,290 110,272 110,250 C110,224 108,204 106,190 C106,170 108,148 110,128 L114,150 C116,166 122,184 128,200 L130,216 C134,222 140,220 142,214 L140,200 C141,184 138,166 132,150 C134,140 134,124 130,108 L128,94 C126,80 116,72 106,70 L90,62 L70,62 Z',
];

export function heatColor(rec) {
  // 0 (fatigued) → red, 50 → amber, 100 (fresh) → green
  const hue = Math.round(Math.max(0, Math.min(100, rec)) * 1.25);
  return `hsl(${hue} 78% 52%)`;
}

function figure(map, values, opts, offsetX, label) {
  const parts = Object.entries(map).map(([m, ds]) => {
    const v = values[m];
    const sel = opts.selected?.has(m);
    const fill = opts.mode === 'select'
      ? (sel ? 'var(--accent)' : 'var(--muscle)')
      : (v == null ? 'var(--muscle)' : heatColor(v));
    const op = opts.mode === 'select' || v == null ? 1 : 0.9;
    return ds.map(d => `<path d="${d}" data-muscle="${m}" fill="${fill}" fill-opacity="${op}" class="muscle${sel ? ' sel' : ''}"><title>${m}</title></path>`).join('');
  }).join('');
  return `<g transform="translate(${offsetX},0)">
    ${SILHOUETTE.map(d => `<path d="${d}" class="silhouette"/>`).join('')}
    ${parts}
    <text x="80" y="376" text-anchor="middle" class="fig-label">${label}</text>
  </g>`;
}

/**
 * values: { muscle: 0..100 } recovery; opts: { mode: 'heat'|'select', selected: Set }
 */
export function bodyMap(values = {}, opts = {}) {
  return `<svg class="bodymap" viewBox="0 0 330 384" role="img" aria-label="Muscle recovery map">
    ${figure(FRONT, values, opts, 0, 'Front')}
    ${figure(BACK, values, opts, 170, 'Back')}
  </svg>`;
}
