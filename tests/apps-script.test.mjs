import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const propertyValues = new Map();
let waits = 0;
let releases = 0;

function ymdInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const take = (type) => parts.find((part) => part.type === type).value;
  return `${take('year')}-${take('month')}-${take('day')}`;
}

const context = vm.createContext({
  console,
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key) => propertyValues.has(key) ? propertyValues.get(key) : null,
      setProperties: (values) => {
        for (const [key, value] of Object.entries(values)) propertyValues.set(key, String(value));
      }
    })
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: (milliseconds) => {
        assert.equal(milliseconds, 10000, 'espera acotada del bloqueo');
        waits += 1;
      },
      releaseLock: () => { releases += 1; }
    })
  },
  Utilities: {
    formatDate: (date, timeZone, format) => {
      const ymd = ymdInZone(date, timeZone);
      return format === 'yyyy-MM-dd' ? ymd : `${ymd}T07:00:00-0500`;
    }
  },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: (content) => ({
      content,
      mimeType: '',
      setMimeType(value) { this.mimeType = value; return this; }
    })
  },
  ScriptApp: {
    getService: () => ({
      getUrl: () => 'https://script.google.com/macros/s/TEST/exec'
    })
  },
  HtmlService: {
    XFrameOptionsMode: { DEFAULT: 'DEFAULT' },
    createTemplateFromFile: (name) => ({
      name,
      manifestUrl: '',
      evaluate() {
        return {
          kind: 'html',
          name,
          manifestUrl: this.manifestUrl,
          setTitle(value) { this.title = value; return this; },
          setXFrameOptionsMode(value) { this.frameMode = value; return this; }
        };
      }
    })
  }
});

const assetsSource = readFileSync(new URL('../apps-script/Assets.gs', import.meta.url), 'utf8');
const source = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
vm.runInContext(assetsSource, context, { filename: 'Assets.gs' });
vm.runInContext(source, context, { filename: 'Code.gs' });
const call = (expression) => vm.runInContext(expression, context);

assert.equal(call('eligibleMonthsForParts_(2026, 4, 14)'), 0, 'antes del primer día 15 no hay flor');
assert.equal(call('eligibleMonthsForParts_(2026, 4, 15)'), 1, 'abril de 2026 es mes 1');
assert.equal(call('eligibleMonthsForParts_(2026, 5, 14)'), 1, 'el día 14 no adelanta el ramo');
assert.equal(call('eligibleMonthsForParts_(2026, 5, 15)'), 2, 'el día 15 suma exactamente uno');
assert.equal(call('eligibleMonthsForParts_(2026, 9, 1)'), 5, 'septiembre 1 conserva cinco meses');
assert.equal(call("nextUnlockForParts_(2026, 9, 1).date"), '2026-09-15', 'próximo desbloqueo del mismo mes');
assert.equal(call("nextUnlockForParts_(2026, 12, 15).date"), '2027-01-15', 'cambio de año correcto');

propertyValues.set('ABS3_UNLOCKED_MONTHS', '2');
const first = call("synchronizeState_(new Date('2026-09-01T12:00:00Z'), 3)");
assert.equal(first.unlockedMonths, 5, 'pone al día todos los meses pendientes');
assert.deepEqual([...first.newlyCommittedMonths], [3, 4, 5], 'informa las siembras confirmadas');
assert.deepEqual([...first.newMonths], [4, 5], 'distingue lo nuevo para este cliente');
assert.equal(first.seed, 'a3f1c07d', 'preserva la semilla visual aprobada');
assert.equal(first.timeZone, 'America/Merida', 'usa la zona oficial');

const repeated = call("synchronizeState_(new Date('2026-09-01T12:00:00Z'), 5)");
assert.equal(repeated.unlockedMonths, 5, 'la repetición es idempotente');
assert.deepEqual([...repeated.newlyCommittedMonths], [], 'no duplica siembras');
assert.equal(waits, 2, 'cada escritura toma el bloqueo global');
assert.equal(releases, 2, 'cada bloqueo se libera');

const post = call(`doPost_compat = doPost({postData:{contents:'{"action":"sync","lastSeenMonths":5,"unlockedMonths":999}'}})`);
const postPayload = JSON.parse(post.content);
assert.equal(postPayload.unlockedMonths, 5, 'ignora un mes inventado por el cliente');
assert.equal(post.mimeType, 'application/json', 'responde JSON');
const invalidPost = call("doPost({postData:{contents:'no-es-json'}})");
assert.equal(JSON.parse(invalidPost.content).error.code, 'INVALID_JSON', 'un cuerpo roto también responde JSON');

const page = call('doGet({parameter:{}})');
assert.equal(page.kind, 'html', 'la URL limpia abre la aplicación final');
assert.equal(page.name, 'Index', 'la aplicación se sirve desde Index.html');
assert.equal(page.title, 'abs<3', 'el nombre de la app queda limitado a la marca');
assert.equal(
  page.manifestUrl,
  'https://script.google.com/macros/s/TEST/exec?asset=manifest',
  'el manifiesto permanece en el mismo deployment'
);

const manifestResponse = call("doGet({parameter:{asset:'manifest'}})");
const manifest = JSON.parse(manifestResponse.content);
assert.equal(manifest.display, 'standalone', 'el deployment publica un manifiesto instalable');
assert.equal(manifest.start_url, 'https://script.google.com/macros/s/TEST/exec', 'el icono abre la misma web app');

const apiGet = call("doGet({parameter:{action:'health'}})");
assert.equal(JSON.parse(apiGet.content).ok, true, 'la API GET anterior sigue disponible');

console.log('abs<3: backend Apps Script verificado');
