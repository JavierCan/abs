import assert from 'node:assert/strict';
import {
  fetchOfficialState, loadApiSettings, normalizeApiUrl,
  saveApiSettings, validateOfficialState
} from '../src/api/official-state.js';

const endpoint = 'https://script.google.com/macros/s/AKfycb-test/exec';
assert.equal(normalizeApiUrl(`${endpoint}?old=1#x`), endpoint, 'limpia query y hash');
assert.throws(
  () => normalizeApiUrl('http://example.com/exec'),
  /URL HTTPS de Apps Script/,
  'rechaza servidores ajenos'
);

const payload = {
  ok: true,
  apiVersion: '4.0.0',
  timeZone: 'America/Merida',
  officialDate: '2026-09-15',
  seed: 'a3f1c07d',
  unlockedMonths: 6,
  newMonths: [6, 99, '6'],
  nextUnlockDate: '2026-10-15'
};
const validated = validateOfficialState(payload);
assert.deepEqual(validated.newMonths, [6], 'solo conserva meses oficiales válidos');
assert.throws(
  () => validateOfficialState({ ...payload, timeZone: 'UTC' }),
  /America\/Merida/,
  'rechaza otra zona horaria'
);

let request = null;
const fakeFetch = async (url, options) => {
  request = { url, options };
  return { ok: true, status: 200, json: async () => payload };
};
const state = await fetchOfficialState(endpoint, 5, fakeFetch);
assert.equal(state.unlockedMonths, 6, 'acepta el mes confirmado por el servidor');
assert.equal(request.options.method, 'POST', 'sincroniza por POST');
assert.equal(request.options.headers['Content-Type'], 'text/plain', 'evita preflight');
assert.deepEqual(
  JSON.parse(request.options.body),
  { action: 'sync', lastSeenMonths: 5 },
  'el cliente solo comunica el último mes visto'
);

const values = new Map();
const storage = {
  getItem: (key) => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, String(value))
};
assert.equal(saveApiSettings(state, endpoint, storage), true, 'guarda estado cacheado');
assert.deepEqual(loadApiSettings(storage), {
  url: endpoint,
  lastMonths: 6,
  seed: 'a3f1c07d',
  officialDate: '2026-09-15'
}, 'recupera URL y última confirmación');

console.log('abs<3: cliente de fecha oficial verificado');
