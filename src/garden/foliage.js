/**
 * abs<3 — follaje y envoltura
 * Todo se deriva de la misma semilla que las flores, así que el follaje
 * tampoco cambia nunca al recargar.
 */

import { PSI, rngFor } from './flowers.js';

const fmt = (v) => (Math.round(v * 100) / 100).toString();

/* ── Tallo: Bézier cuadrática de la base a la flor ──────────── */

export function stemFor(pc, baseY) {
  const p0 = [0, baseY];
  const p1 = [pc.pos.x * 0.42, (baseY + pc.pos.y) * 0.55];
  const p2 = [pc.pos.x, pc.pos.y];
  const at = (t) => {
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
    ];
  };
  const tangent = (t) => {
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  };
  return {
    d: `M ${fmt(p0[0])} ${fmt(p0[1])} Q ${fmt(p1[0])} ${fmt(p1[1])} ${fmt(p2[0])} ${fmt(p2[1])}`,
    at,
    tangent
  };
}

/* ── Hoja: x(u) = w·sin(π·u^0.7)·(1 − 0.12u) + κ·L·u² ──────── */

export function leafPath(L, w, bend, steps = 16) {
  const right = [], left = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const half = w * Math.sin(Math.PI * Math.pow(u, 0.7)) * (1 - 0.12 * u);
    const drift = bend * L * u * u * 0.35;
    right.push([drift + half, -L * u]);
    left.push([drift - half, -L * u]);
  }
  let d = 'M ' + fmt(right[0][0]) + ' ' + fmt(right[0][1]);
  for (let i = 1; i < right.length; i++) d += ' L ' + fmt(right[i][0]) + ' ' + fmt(right[i][1]);
  for (let i = left.length - 1; i >= 0; i--) d += ' L ' + fmt(left[i][0]) + ' ' + fmt(left[i][1]);
  return d + ' Z';
}

function midribPath(L, bend) {
  return `M 0 0 Q ${fmt(bend * L * 0.14)} ${fmt(-L * 0.5)} ${fmt(bend * L * 0.35)} ${fmt(-L * 0.92)}`;
}

/* ── Brote ──────────────────────────────────────────────────── */

function budPath(L, w) {
  return `M 0 0 C ${fmt(-w)} ${fmt(-L * 0.28)} ${fmt(-w)} ${fmt(-L * 0.78)} 0 ${fmt(-L)} ` +
         `C ${fmt(w)} ${fmt(-L * 0.78)} ${fmt(w)} ${fmt(-L * 0.28)} 0 0 Z`;
}

/* ── Follaje completo del ramo ──────────────────────────────── */

const GREEN = (plane, shift = 0) =>
  `hsl(${155 + shift} ${42 + plane * 6}% ${13 + plane * 7}%)`;
const VEIN = (plane) => `hsl(158 40% ${26 + plane * 10}%)`;

export function buildFoliage(seed, pieces, baseY, opts = {}) {
  const back = [], front = [];
  const density = opts.density ?? 1;
  const spacing = opts.spacing ?? 44;

  for (const pc of pieces) {
    const rnd = rngFor(seed, 'foliage' + pc.m);
    const stem = stemFor(pc, baseY);
    const bucket = pc.pos.plane === 0 ? back : front;
    const s = pc.pos.scale;

    // Hojas prendidas al tallo, alternadas a izquierda y derecha
    const leaves = 1 + Math.round(rnd() * 1.6 * density);
    for (let k = 0; k < leaves; k++) {
      const t = 0.34 + 0.3 * k + rnd() * 0.12;
      if (t > 0.86) continue;
      const [lx, ly] = stem.at(t);
      const side = k % 2 === 0 ? 1 : -1;
      const rot = stem.tangent(t) + side * (32 + rnd() * 20);
      const L = (34 + rnd() * 18) * s;
      const w = L * (0.26 + rnd() * 0.07);
      const bend = side * (0.3 + rnd() * 0.4);
      bucket.push({ t: 'path', d: leafPath(L, w, bend), fill: GREEN(pc.pos.plane, (k % 3) * 3), tx: lx, ty: ly, rot, m: pc.m, kind: 'leaf' });
      if (pc.pos.plane > 0) {
        bucket.push({ t: 'path', d: midribPath(L, bend), stroke: VEIN(pc.pos.plane), sw: 0.6, tx: lx, ty: ly, rot, m: pc.m, kind: 'leaf' });
      }
    }

    // Brote en uno de cada tres meses
    if (pc.m % 3 === 1) {
      const t = 0.72 + rnd() * 0.12;
      const [bx, by] = stem.at(t);
      const rot = stem.tangent(t) + (rnd() - 0.5) * 46;
      const L = (16 + rnd() * 9) * s;
      front.push({ t: 'path', d: budPath(L, L * 0.3), fill: `hsl(${340 + rnd() * 12} 58% 42%)`, tx: bx, ty: by, rot, m: pc.m, kind: 'leaf' });
      front.push({ t: 'path', d: budPath(L * 0.62, L * 0.16), fill: 'hsl(344 78% 66%)', o: 0.55, tx: bx, ty: by, rot, m: pc.m, kind: 'leaf' });
    }
  }

  // Ramitas de relleno en los huecos: mismo ángulo áureo, medio paso corrido
  const sprigs = Math.max(3, Math.round(pieces.length * 0.55 * density));
  for (let i = 1; i <= sprigs; i++) {
    const rnd = rngFor(seed, 'sprig' + i);
    const theta = (i + 0.5) * PSI;
    const rho = spacing * Math.sqrt(i + 0.5) * 1.08;
    const x = rho * Math.cos(theta);
    const y = -0.72 * rho * Math.sin(theta);
    const rot = (Math.atan2(y, x) * 180) / Math.PI + 90 + (rnd() - 0.5) * 30;
    const len = 46 + rnd() * 26;
    const bucket = i % 3 === 0 ? front : back;
    bucket.push({
      t: 'path',
      d: `M 0 0 Q ${fmt(len * 0.12)} ${fmt(-len * 0.55)} ${fmt(len * 0.1)} ${fmt(-len)}`,
      stroke: GREEN(1, 0), sw: 1.3, tx: x, ty: y, rot
    });
    const leaflets = 6 + Math.floor(rnd() * 3);
    for (let k = 1; k <= leaflets; k++) {
      const u = k / (leaflets + 1);
      const lx = x + Math.sin((rot * Math.PI) / 180) * 0 + 0;
      const side = k % 2 === 0 ? 1 : -1;
      bucket.push({
        t: 'path',
        d: leafPath(9 - u * 3, 3.4 - u, side * 0.4),
        fill: GREEN(i % 3 === 0 ? 2 : 0, 4),
        tx: x + (len * 0.1 * u) * Math.cos((rot * Math.PI) / 180) - side * 3,
        ty: y - len * u,
        rot: rot + side * 52
      });
      void lx;
    }
  }

  // Destellos: pétalos diminutos en el perímetro
  const sparks = Math.round(pieces.length * 1.4 * density);
  for (let i = 1; i <= sparks; i++) {
    const rnd = rngFor(seed, 'spark' + i);
    const theta = (i + 0.31) * PSI;
    const rho = spacing * Math.sqrt(i) * (1.02 + rnd() * 0.24);
    front.push({
      t: 'circle',
      cx: rho * Math.cos(theta),
      cy: -0.72 * rho * Math.sin(theta),
      r: 1 + rnd() * 1.1,
      fill: rnd() > 0.5 ? 'hsl(330 100% 92%)' : 'hsl(258 100% 90%)',
      o: 0.35 + rnd() * 0.4
    });
  }

  return { back, front };
}
