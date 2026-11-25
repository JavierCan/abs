/**
 * abs<3 — generador matemático de flores
 * Fase 1: matemática pura. Sin DOM, sin animación, sin red.
 * Todo es determinista: misma semilla + mismo mes = misma flor, siempre.
 */

/* ── Constantes ─────────────────────────────────────────────── */

export const PHI = (1 + Math.sqrt(5)) / 2;
export const PSI = 2 * Math.PI * (1 - 1 / PHI);   // ángulo áureo, radianes
export const PSI_DEG = (PSI * 180) / Math.PI;     // 137.50776...
export const SPECIES = ['hortensia', 'tulipan', 'gerbera', 'lirio'];

/* ── Azar reproducible ──────────────────────────────────────── */

export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(seed, tag) {
  return mulberry32(fnv1a(seed + ':' + tag));
}

/* ── Bolsa de especies por ciclos de cuatro ─────────────────── */

export function speciesForMonth(seed, m) {
  const cycle = Math.floor((m - 1) / 4);
  const rnd = rngFor(seed, 'cycle' + cycle);
  const bag = SPECIES.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  return bag[(m - 1) % 4];
}

/* ── Filotaxis de Vogel: dónde se coloca la pieza del mes m ──── */

export const PLANE_SCALE = [0.80, 0.90, 1.00];

export function placement(m, opts = {}) {
  const c = opts.c ?? 26;          // separación radial; NO depende del total
  const kappa = opts.kappa ?? 0.72; // compresión vertical del ramo
  const theta = m * PSI;
  const rho = c * Math.sqrt(m);
  const plane = m % 3;
  return {
    theta,
    rho,
    x: rho * Math.cos(theta),
    y: -kappa * rho * Math.sin(theta),
    scale: (opts.s0 ?? 1) * PLANE_SCALE[plane],
    plane
  };
}

/* ── Superfórmula de Gielis ─────────────────────────────────── */

export function superformula(t, p) {
  const a = p.a ?? 1;
  const b = p.b ?? 1;
  const t1 = Math.pow(Math.abs(Math.cos((p.p * t) / 4) / a), p.n2);
  const t2 = Math.pow(Math.abs(Math.sin((p.p * t) / 4) / b), p.n3);
  const s = t1 + t2;
  return s === 0 ? 0 : Math.pow(s, -1 / p.n1);
}

function superPath(p, radius, steps = 200) {
  let max = 0;
  const raw = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const r = superformula(t, p);
    raw.push([t, isFinite(r) ? r : 0]);
    if (isFinite(r) && r > max) max = r;
  }
  if (max === 0) return '';
  let d = '';
  for (let i = 0; i < raw.length; i++) {
    const r = (raw[i][1] / max) * radius;
    const x = r * Math.cos(raw[i][0]);
    const y = r * Math.sin(raw[i][0]);
    d += (i === 0 ? 'M ' : ' L ') + n(x) + ' ' + n(y);
  }
  return d + ' Z';
}

/* ── Utilidades de trazo ────────────────────────────────────── */

const n = (v) => (Math.round(v * 100) / 100).toString();

function closedPath(right, left) {
  let d = 'M ' + n(right[0][0]) + ' ' + n(right[0][1]);
  for (let i = 1; i < right.length; i++) d += ' L ' + n(right[i][0]) + ' ' + n(right[i][1]);
  for (let i = left.length - 1; i >= 0; i--) d += ' L ' + n(left[i][0]) + ' ' + n(left[i][1]);
  return d + ' Z';
}

/** Perfil de pétalo: x(u) = w·sin(π·u^e), y(u) = −L·u */
function petalPath(L, w, e = 0.8, steps = 16) {
  const right = [], left = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = w * Math.sin(Math.PI * Math.pow(u, e));
    const y = -L * u;
    right.push([x, y]);
    left.push([-x, y]);
  }
  return closedPath(right, left);
}

/** Tépalo recurvado: x(u) = w·sin(πu)(1−βu), y(u) = −L·u + c·u³ */
function recurvedPath(L, w, beta, c, steps = 18) {
  const right = [], left = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = w * Math.sin(Math.PI * u) * (1 - beta * u);
    const y = -L * u + c * L * Math.pow(u, 3);
    right.push([x, y]);
    left.push([-x, y]);
  }
  return closedPath(right, left);
}

/** Rosa de 4 pétalos: r(θ) = a·|cos(2θ)| */
function rosePath(a, steps = 72) {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const r = a * Math.abs(Math.cos(2 * t));
    d += (i === 0 ? 'M ' : ' L ') + n(r * Math.cos(t)) + ' ' + n(r * Math.sin(t));
  }
  return d + ' Z';
}

/** Bézier cúbica con apertura: rota P1 y P2 sobre P0 un ángulo α */
function bezierTepal(L, w, alphaDeg) {
  const a = (alphaDeg * Math.PI) / 180;
  const rot = (px, py) => [
    px * Math.cos(a) - py * Math.sin(a),
    px * Math.sin(a) + py * Math.cos(a)
  ];
  const p1 = rot(-w, -0.35 * L);
  const p2 = rot(-w * 0.85, -0.85 * L);
  const q1 = rot(w * 0.85, -0.85 * L);
  const q2 = rot(w, -0.35 * L);
  return (
    'M 0 0 C ' + n(p1[0]) + ' ' + n(p1[1]) + ' ' + n(p2[0]) + ' ' + n(p2[1]) +
    ' 0 ' + n(-L) + ' C ' + n(q1[0]) + ' ' + n(q1[1]) + ' ' + n(q2[0]) + ' ' + n(q2[1]) + ' 0 0 Z'
  );
}

/* ── Parámetros por especie ─────────────────────────────────── */

const pick = (rnd, lo, hi) => lo + rnd() * (hi - lo);

export function paramsFor(species, rnd) {
  switch (species) {
    case 'gerbera':
      return {
        n: Math.round(pick(rnd, 26, 32)),
        L: pick(rnd, 42, 50),
        w: pick(rnd, 5.2, 6.4),
        p: Math.round(pick(rnd, 22, 30)),
        n1: pick(rnd, 0.62, 0.78),
        n2: pick(rnd, 2.1, 2.7),
        n3: pick(rnd, 2.1, 2.7),
        discN: Math.round(pick(rnd, 76, 96)),
        discR: pick(rnd, 9.5, 12),
        hue: Math.round(pick(rnd, 340, 352))
      };
    case 'hortensia':
      return {
        N: Math.round(pick(rnd, 118, 148)),
        R: pick(rnd, 33, 40),
        a: pick(rnd, 4.9, 5.7),
        hue: Math.round(pick(rnd, 254, 268))
      };
    case 'tulipan':
      return {
        L: pick(rnd, 52, 60),
        w: pick(rnd, 15.5, 18.5),
        a0: 4,
        a1: pick(rnd, 32, 40),
        hue: Math.round(pick(rnd, 348, 358))
      };
    case 'lirio':
      return {
        L: pick(rnd, 50, 58),
        w: pick(rnd, 9, 11.5),
        beta: pick(rnd, 0.46, 0.58),
        c: pick(rnd, 0.30, 0.42),
        p: 6,
        n1: pick(rnd, 0.78, 0.92),
        n2: 1.7, n3: 1.7,
        hue: Math.round(pick(rnd, 304, 320))
      };
  }
}

/* ── Constructores ──────────────────────────────────────────── */

function gerbera(p, tau, lod) {
  const parts = [];
  const L = p.L * tau;
  const hue = p.hue;
  const petals = Math.max(9, Math.round(p.n * lod));
  const discCount = Math.max(10, Math.round(p.discN * lod));

  parts.push({ t: 'path', d: superPath(p, p.L * 1.15), fill: `hsl(${hue} 90% 62% / 0.07)` });
  parts.push({ t: 'circle', r: p.L * 0.75, fill: `hsl(${hue} 90% 62% / 0.10)` });

  for (let j = 0; j < petals; j++) {
    const alpha = (360 * j) / petals;
    parts.push({
      t: 'path',
      d: petalPath(L, p.w, 0.8),
      fill: `hsl(${hue} ${72 + (j % 3) * 4}% ${46 + (j % 2) * 6}%)`,
      rot: alpha * tau
    });
  }
  const inner = Math.max(6, Math.round(petals * 0.7));
  for (let j = 0; j < inner; j++) {
    const alpha = (360 * j) / inner + 180 / inner;
    parts.push({
      t: 'path',
      d: petalPath(L * 0.58, p.w * 0.82, 0.8),
      fill: `hsl(${hue} 88% ${64 + (j % 2) * 6}%)`,
      rot: alpha * tau
    });
  }

  const discR = p.discR * tau;
  parts.push({ t: 'circle', r: discR, fill: `hsl(24 72% 22%)` });
  const c = discR / Math.sqrt(discCount);
  for (let i = 1; i <= discCount; i++) {
    const r = c * Math.sqrt(i);
    const t = i * PSI;
    parts.push({
      t: 'circle',
      cx: r * Math.cos(t),
      cy: r * Math.sin(t),
      r: 0.75,
      fill: i > discCount * 0.55 ? 'hsl(38 92% 64%)' : 'hsl(30 80% 46%)'
    });
  }
  return parts;
}

function hortensia(p, tau, lod) {
  const parts = [];
  const R = p.R * tau;
  const count = Math.max(14, Math.round(p.N * lod));
  parts.push({ t: 'circle', r: R * 1.7, fill: `hsl(${p.hue} 88% 66% / 0.09)` });
  const c = R / Math.sqrt(count);
  for (let i = 1; i <= count; i++) {
    const rho = c * Math.sqrt(i);
    const t = i * PSI;
    const s = (0.3 + 0.7 * tau) * (1 - 0.35 * Math.pow(rho / R, 2));
    const light = 62 - 14 * (rho / R);
    parts.push({
      t: 'path',
      d: rosePath(p.a),
      fill: `hsl(${p.hue + (i % 5) * 2} 76% ${light.toFixed(1)}%)`,
      tx: rho * Math.cos(t),
      ty: rho * Math.sin(t),
      sc: s,
      rot: (t * 180) / Math.PI
    });
    if (lod > 0.5) {
      parts.push({
        t: 'circle',
        cx: rho * Math.cos(t),
        cy: rho * Math.sin(t),
        r: 0.9 * s,
        fill: 'hsl(258 100% 95%)'
      });
    }
  }
  return parts;
}

function tulipan(p, tau) {
  const parts = [];
  const alpha = p.a0 + tau * (p.a1 - p.a0);
  parts.push({ t: 'circle', cy: -p.L * 0.45, r: p.L * 0.78, fill: `hsl(${p.hue} 90% 60% / 0.08)` });
  for (let j = 0; j < 3; j++) {
    parts.push({
      t: 'path',
      d: bezierTepal(p.L * 0.94, p.w * 1.06, alpha * 1.25),
      fill: `hsl(${p.hue} 72% 28%)`,
      rot: 60 * j + 30
    });
  }
  for (let j = 0; j < 3; j++) {
    parts.push({
      t: 'path',
      d: bezierTepal(p.L, p.w, alpha),
      fill: `hsl(${p.hue} 80% ${44 + j * 3}%)`,
      rot: 60 * j
    });
  }
  parts.push({
    t: 'path',
    d: bezierTepal(p.L * 0.7, p.w * 0.5, alpha * 0.6),
    fill: `hsl(${p.hue} 92% 72% / 0.42)`
  });
  return parts;
}

function lirio(p, tau) {
  const parts = [];
  const L = p.L * (0.35 + 0.65 * tau);
  const spread = 0.35 + 0.65 * tau;
  parts.push({ t: 'path', d: superPath(p, p.L * 1.1), fill: `hsl(${p.hue} 80% 80% / 0.07)` });
  for (let j = 0; j < 3; j++) {
    parts.push({
      t: 'path',
      d: recurvedPath(L * 0.96, p.w, p.beta, p.c * tau),
      fill: `hsl(${p.hue} 46% 68%)`,
      rot: (60 * j + 30) * spread
    });
  }
  for (let j = 0; j < 3; j++) {
    parts.push({
      t: 'path',
      d: recurvedPath(L, p.w * 1.05, p.beta, p.c * tau),
      fill: `hsl(${p.hue} 70% ${86 - j * 2}%)`,
      rot: 60 * j * spread
    });
  }
  for (let j = 0; j < 6; j++) {
    const a = ((60 * j + 20) * Math.PI) / 180;
    const len = L * 0.4;
    parts.push({
      t: 'path',
      d: `M 0 0 L ${n(Math.sin(a) * len * 0.4)} ${n(-Math.cos(a) * len)}`,
      stroke: 'hsl(42 70% 72%)',
      sw: 0.9
    });
    parts.push({
      t: 'circle',
      cx: Math.sin(a) * len * 0.45,
      cy: -Math.cos(a) * len * 1.06,
      r: 1.5,
      fill: 'hsl(34 74% 50%)'
    });
  }
  parts.push({ t: 'circle', r: 2.2, fill: 'hsl(44 76% 80%)' });
  return parts;
}

/* ── API pública ────────────────────────────────────────────── */

/**
 * lod ∈ (0,1] — nivel de detalle. 1 = plano frontal, valores menores
 * reducen pétalos y flósculos en los planos de fondo, donde no se nota.
 */
export function buildFlower(species, params, tau = 1, lod = 1) {
  const t = Math.max(0.001, Math.min(1, tau));
  const d = Math.max(0.08, Math.min(1, lod));
  if (species === 'gerbera') return gerbera(params, t, d);
  if (species === 'hortensia') return hortensia(params, t, d);
  if (species === 'tulipan') return tulipan(params, t);
  return lirio(params, t);
}

export const PLANE_LOD = [0.30, 0.60, 1.00];

export function formulaFor(species, p, tau = 1) {
  const r = (v, d = 2) => Number(v).toFixed(d);
  switch (species) {
    case 'gerbera':
      return [
        'r(θ) = ( |cos(pθ/4)/a|^n₂ + |sin(pθ/4)/b|^n₃ )^(−1/n₁)',
        `p = ${p.p},  n₁ = ${p.n1},  n₂ = n₃ = ${p.n2}`,
        'x(u) = w·sin(π·u^0.8),   y(u) = −L·u',
        `n = ${p.n},  L = ${r(p.L, 1)},  w = ${r(p.w)}`,
        `disco:  ρᵢ = c√i,  θᵢ = i·ψ,  ψ = ${r(PSI_DEG, 5)}°`,
        `τ = ${r(tau)}`
      ];
    case 'hortensia':
      return [
        'corimbo:  ρᵢ = c√i,   θᵢ = i·ψ',
        `ψ = ${r(PSI_DEG, 5)}°,  N = ${p.N},  R = ${r(p.R, 1)}`,
        'flósculo:  r(θ) = a·cos(2θ)',
        `a = ${r(p.a)}`,
        'sᵢ = s₀(1 − 0.35·(ρᵢ/R)²)',
        `τ = ${r(tau)}`
      ];
    case 'tulipan':
      return [
        'B(t) = (1−t)³P₀ + 3(1−t)²t·P₁ + 3(1−t)t²·P₂ + t³P₃',
        'α(τ) = α₀ + τ(α₁ − α₀)',
        `α₀ = ${p.a0}°,  α₁ = ${r(p.a1, 1)}°,  α = ${r(p.a0 + tau * (p.a1 - p.a0), 1)}°`,
        `L = ${r(p.L, 1)},  w = ${r(p.w, 1)}`,
        '6 tépalos, 2 verticilos desfasados 60°',
        `τ = ${r(tau)}`
      ];
    default:
      return [
        'x(u) = w·sin(πu)·(1 − βu)',
        'y(u) = −L·u + c·u³',
        `β = ${r(p.beta)},  c = ${r(p.c)}·L,  u ∈ [0,1]`,
        `L = ${r(p.L, 1)},  w = ${r(p.w, 1)}`,
        `envolvente: p = ${p.p}, n₁ = ${p.n1}, n₂ = n₃ = ${p.n2}`,
        `τ = ${r(tau)}`
      ];
  }
}

/** Composición completa del ramo hasta el mes `months`. */
export function buildBouquet(seed, months, opts = {}) {
  const c = opts.c ?? 44;
  const kappa = opts.kappa ?? 0.82;
  const pieces = [];
  for (let m = 1; m <= months; m++) {
    const species = speciesForMonth(seed, m);
    const rnd = rngFor(seed, 'm' + m);
    const params = paramsFor(species, rnd);
    const pos = placement(m, { c, kappa });
    pieces.push({
      m,
      species,
      params,
      pos,
      lod: PLANE_LOD[pos.plane],
      tilt: (rnd() - 0.5) * 18,
      phase: 2 * Math.PI * ((m * PHI) % 1),
      period: 6 + rnd() * 3
    });
  }
  pieces.sort((a, b) => a.pos.plane - b.pos.plane || b.pos.rho - a.pos.rho);
  return pieces;
}

/** Encuadre que contiene todo el ramo. La cámara se abre; las flores no se mueven. */
export function bouquetBounds(pieces, opts = {}) {
  const pad = opts.pad ?? 70;
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  for (const pc of pieces) {
    const r = (pc.params.L || pc.params.R || 40) * pc.pos.scale * 1.2;
    x0 = Math.min(x0, pc.pos.x - r); x1 = Math.max(x1, pc.pos.x + r);
    y0 = Math.min(y0, pc.pos.y - r); y1 = Math.max(y1, pc.pos.y + r);
  }
  const crownW = Math.max(1, x1 - x0);
  const crownH = Math.max(1, y1 - y0);
  const stem = (opts.stem ?? 0.58) * Math.max(130, crownH);
  const baseY = y1 + stem;
  return {
    x: x0 - pad,
    y: y0 - pad,
    w: (x1 - x0) + pad * 2,
    h: crownH + stem + pad * 1.35,
    baseY,
    tieY: y1 + stem * 0.46,
    crown: { x0, x1, y0, y1, w: crownW, h: crownH }
  };
}
