/**
 * abs<3 — movimiento
 * Un solo parámetro τ manda sobre todo: tallo, hojas y apertura de pétalos.
 * τ = 0 → capullo cerrado, tallo sin dibujar.
 * τ = 1 → estado actual de la flor.
 */

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/**
 * Despertar: todas las piezas crecen en orden cronológico, escalonadas.
 * La ventana total se mantiene acotada aunque el ramo tenga cien meses:
 * el desfase se comprime, no se alarga la espera.
 */
export function awakenSchedule(pieces, opts = {}) {
  const count = pieces.length;
  const window = opts.window ?? 4;
  const maxStagger = opts.maxStagger ?? 0.24;
  const stagger = count > 1 ? Math.min(maxStagger, window / (count - 1)) : 0;
  const dur = opts.dur ?? 1.65;
  const map = new Map();
  [...pieces].sort((a, b) => a.m - b.m).forEach((p, i) => {
    map.set(p.m, { delay: i * stagger, dur });
  });
  return { map, stagger, dur, total: (count - 1) * stagger + dur };
}

/** Crecimiento mensual: una sola pieza, más lenta y con más presencia. */
export function growthSchedule(pieces, m, opts = {}) {
  const dur = opts.dur ?? 2.8;
  const map = new Map();
  for (const p of pieces) map.set(p.m, p.m === m ? { delay: 0, dur } : null);
  return { map, dur, total: dur, only: m };
}

export function progressFor(t, slot) {
  if (slot === undefined) return 1;
  if (slot === null) return 1;
  return clamp01((t - slot.delay) / slot.dur);
}

export function tauFor(t, slot) {
  return easeInOut(progressFor(t, slot));
}

/**
 * Presentación de la flor nueva.
 * La corola acompaña la punta viva del tallo, se eleva un instante y termina
 * exactamente en su posición definitiva. El destello no usa filtros SVG para
 * mantener el movimiento fluido en Safari/iPhone.
 */
export function presentationMotion(progress, opts = {}) {
  const p = clamp01(progress);
  const lift = opts.lift ?? 18;
  const glintPhase = clamp01((p - 0.48) / 0.52);
  return {
    liftY: -lift * Math.sin(Math.PI * p),
    scale: 0.72 + 0.28 * easeOut(p) + 0.08 * Math.sin(Math.PI * p),
    glint: Math.pow(Math.sin(Math.PI * glintPhase), 1.7),
    glintScale: 0.72 + 0.48 * glintPhase
  };
}

/** Despliegue de la envoltura; en el mes nuevo solo respira el lazo. */
export function wrappingMotion(progress, monthly = false) {
  const p = clamp01(progress);
  if (monthly) {
    const pulse = Math.sin(Math.PI * p);
    return {
      paperOpacity: 1,
      paperScaleX: 1,
      paperScaleY: 1,
      paperY: 0,
      bowOpacity: 1,
      bowScale: 1 + 0.1 * pulse,
      bowRot: 2.5 * Math.sin(2 * Math.PI * p) * pulse,
      glow: 0.58 * pulse
    };
  }
  const paper = easeOut(clamp01((p - 0.08) / 0.5));
  const bow = easeOut(clamp01((p - 0.54) / 0.3));
  return {
    paperOpacity: paper,
    paperScaleX: 0.64 + 0.36 * paper,
    paperScaleY: 0.38 + 0.62 * paper,
    paperY: 18 * (1 - paper),
    bowOpacity: bow,
    bowScale: 0.42 + 0.58 * bow,
    bowRot: -8 * (1 - bow),
    glow: 0.5 * Math.pow(Math.sin(Math.PI * bow), 2)
  };
}

/** Respiración ambiental. Fases irracionalmente separadas: nunca se repite. */
export function ambient(t, piece) {
  const s = Math.sin((2 * Math.PI * t) / piece.period + piece.phase);
  return { rot: 1.5 * s, scale: 1 + 0.012 * s };
}

/** Despliegue de la hoja: gira hacia su posición final y crece desde el tallo. */
export function leafUnfold(tau) {
  return { rotOffset: -46 * (1 - tau), scale: 0.15 + 0.85 * tau };
}

/** Las ramitas y destellos entran al final, cuando el ramo ya está armado. */
export function looseOpacity(t, total) {
  return clamp01((t - total * 0.55) / (total * 0.45));
}
