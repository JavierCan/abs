import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PSI_DEG, bouquetBounds, buildBouquet, buildFlower, paramsFor, rngFor, speciesForMonth
} from '../src/garden/flowers.js';
import { stemFor } from '../src/garden/foliage.js';
import { buildWrapping } from '../src/garden/wrapping.js';
import {
  awakenSchedule, growthSchedule, presentationMotion, progressFor, tauFor,
  wrappingMotion
} from '../src/garden/motion.js';

const seed = 'a3f1c07d';
const byMonth = (pieces, m) => pieces.find((piece) => piece.m === m);

assert.ok(Math.abs(PSI_DEG - 137.507764) < 1e-5, 'ángulo áureo');

const six = buildBouquet(seed, 6);
const oneTwenty = buildBouquet(seed, 120);
assert.equal(byMonth(six, 1).pos.rho, 44, 'separación compacta predeterminada c = 44');
for (const old of six) {
  const later = byMonth(oneTwenty, old.m);
  assert.deepEqual(later.pos, old.pos, `el mes ${old.m} no debe moverse`);
  assert.equal(later.species, old.species, `la especie del mes ${old.m} es estable`);
}

for (let cycle = 0; cycle < 30; cycle++) {
  const species = new Set();
  for (let i = 1; i <= 4; i++) species.add(speciesForMonth(seed, cycle * 4 + i));
  assert.equal(species.size, 4, `bolsa completa en el ciclo ${cycle + 1}`);
}

for (const species of ['hortensia', 'tulipan', 'gerbera', 'lirio']) {
  const params = paramsFor(species, rngFor(seed, `test-${species}`));
  for (const tau of [0.02, 0.5, 1]) {
    const svgParts = buildFlower(species, params, tau, 1);
    assert.ok(svgParts.length > 0, `${species} produce geometría`);
    assert.ok(!JSON.stringify(svgParts).includes('NaN'), `${species} sin NaN en τ=${tau}`);
  }
}

const target = byMonth(six, 6);
const bounds = bouquetBounds(six);
const stem = stemFor(target, bounds.baseY);
assert.deepEqual(stem.at(0), [0, bounds.baseY], 'el tallo nace en la base');
assert.ok(Math.abs(stem.at(1)[0] - target.pos.x) < 1e-9, 'la punta termina en x final');
assert.ok(Math.abs(stem.at(1)[1] - target.pos.y) < 1e-9, 'la punta termina en y final');
assert.ok(bounds.baseY - bounds.crown.y1 < bounds.crown.h * 0.8, 'los tallos bajos son proporcionados');

const wrap = buildWrapping(bounds);
assert.ok(wrap.back.length >= 2 && wrap.front.length >= 2, 'la envoltura tiene capas trasera y frontal');
assert.ok(wrap.bow.length >= 5, 'el lazo tiene nudo, asas y cintas');
assert.ok(wrap.anchorY > bounds.crown.y1, 'el amarre queda debajo de la copa');

const awakening = awakenSchedule(six);
let previousDelay = -1;
for (let m = 1; m <= 6; m++) {
  const slot = awakening.map.get(m);
  assert.ok(slot.delay > previousDelay, 'el despertar conserva el orden cronológico');
  previousDelay = slot.delay;
  assert.equal(tauFor(slot.delay, slot), 0, 'cada flor comienza cerrada');
  assert.equal(tauFor(slot.delay + slot.dur, slot), 1, 'cada flor termina abierta');
}

const growth = growthSchedule(six, 6);
assert.equal(growth.map.get(5), null, 'las flores anteriores permanecen abiertas');
assert.ok(growth.map.get(6), 'solo la flor mensual recibe animación');
assert.equal(growth.dur, 2.8, 'la presentación mensual debe ser visible');
const monthlySlot = growth.map.get(6);
const frameProgress = [0, 0.7, 1.4, 2.1, 2.8].map((time) => tauFor(time, monthlySlot));
for (let i = 1; i < frameProgress.length; i++) {
  assert.ok(frameProgress[i] > frameProgress[i - 1], 'la animación avanza en cada tramo');
}
assert.equal(progressFor(0, monthlySlot), 0, 'el primer cuadro empieza en cero');
assert.equal(progressFor(2.8, monthlySlot), 1, 'el último cuadro termina en uno');

const start = presentationMotion(0);
const middle = presentationMotion(0.75);
const end = presentationMotion(1);
assert.ok(Math.abs(start.liftY) < 1e-9, 'la presentación empieza en la punta');
assert.ok(middle.liftY < 0, 'la flor se eleva durante la presentación');
assert.ok(middle.glint > 0, 'el destello aparece durante la inserción');
assert.ok(Math.abs(end.liftY) < 1e-9, 'la flor termina en su posición definitiva');
assert.ok(Math.abs(end.scale - 1) < 1e-9, 'la escala final es exacta');

const wrapStart = wrappingMotion(0, false);
const wrapMiddle = wrappingMotion(0.72, false);
const wrapEnd = wrappingMotion(1, false);
assert.equal(wrapStart.paperOpacity, 0, 'la envoltura inicia cerrada');
assert.ok(wrapMiddle.paperOpacity > 0 && wrapMiddle.bowOpacity > 0, 'papel y lazo entran en el despertar');
assert.equal(wrapEnd.paperOpacity, 1, 'la envoltura termina abierta');
assert.equal(wrapEnd.bowScale, 1, 'el lazo termina en su escala exacta');
assert.ok(wrappingMotion(0.5, true).bowScale > 1, 'el lazo pulsa al agregar un mes');

const labSource = readFileSync(new URL('../lab-modular.html', import.meta.url), 'utf8');
assert.ok(!labSource.includes('stemGeom: st'), 'no puede sobrevivir la referencia fuera de alcance');
assert.ok(
  labSource.includes('const stemGeom = stemFor(pc, b.baseY)'),
  'cada pieza debe reconstruir su curva dentro del ciclo'
);
assert.ok(labSource.includes("addEventListener('click'"), 'los botones conservan sus eventos');
assert.ok(labSource.includes('setMotionStatus'), 'la animación expone progreso visible');
assert.ok(labSource.includes('presentation-layer'), 'la flor mensual tiene una capa de presentación');
assert.ok(labSource.includes('Envoltura y lazo'), 'la envoltura está disponible y activa');
assert.ok(labSource.includes('Sincronizar fecha oficial'), 'la Fase 4 expone sincronización visible');
assert.ok(labSource.includes('fetchOfficialState'), 'el laboratorio consume la API oficial');
assert.ok(labSource.includes('playMonthlyArrival'), 'la llegada oficial conserva la animación mensual');
assert.ok(
  labSource.includes('AKfycbzcTFqq6V3N37Ged7Wl5UmuFWAKj3I82_fq0H4eCnZCOjtDZRaRipU5HmFAO2XwqQONdg'),
  'ABRIR debe conservar el deployment @2 aprobado'
);
assert.ok(labSource.includes('savedApi.url || DEFAULT_API_URL'), 'la primera apertura sincroniza automáticamente');

console.log('abs<3: verificaciones completadas correctamente');
