import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const index = readFileSync(new URL('../apps-script/Index.html', import.meta.url), 'utf8');
const template = readFileSync(new URL('../apps-script/Index.template.html', import.meta.url), 'utf8');
const backend = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const assets = readFileSync(new URL('../apps-script/Assets.gs', import.meta.url), 'utf8');
const claspIgnore = readFileSync(new URL('../apps-script/.claspignore', import.meta.url), 'utf8');

assert.ok(index.includes('createBouquetScene'), 'el motor del ramo debe quedar incrustado');
assert.ok(index.includes('spacing: 44'), 'la app conserva la separación aprobada de fase 3.3');
assert.ok(index.includes('kappa: .82'), 'la app conserva la copa compacta aprobada');
assert.ok(index.includes('permission-bud'), 'el capullo es el gesto para solicitar permiso');
assert.ok(index.includes('equation-panel'), 'tocar una flor abre el panel matemático');
assert.ok(index.includes('is-vigil'), 'la vigilia visual existe sin contador numérico');
assert.ok(index.includes('splash-mark'), 'el splash breve usa únicamente una marca floral');
assert.ok(!index.includes('hero-copy'), 'no debe sobrevivir la portada anterior');
assert.ok(!index.includes('Un ramo que'), 'no debe sobrevivir el texto romántico anterior');
assert.ok(!index.includes('chatgpt.site'), 'la interfaz no depende de Sites');
assert.ok(!index.includes('/api/state'), 'la sincronización se hace dentro de Apps Script');

const beforeScript = index.match(/<body>([\s\S]*?)<script>/)?.[1] || '';
const visibleBodyText = beforeScript
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ')
  .trim();
assert.equal(visibleBodyText, '', 'el estado inicial no contiene texto visible');

const script = index.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Index.html contiene el JavaScript compilado');
assert.doesNotThrow(() => new Function(script), 'el JavaScript compilado tiene sintaxis válida');

assert.ok(template.includes('/*__ABS3_GARDEN__*/'), 'la plantilla conserva el punto de compilación');
assert.ok(backend.includes("createTemplateFromFile('Index')"), 'doGet sirve la app desde Apps Script');
assert.ok(backend.includes('getClientState'), 'la interfaz usa el estado oficial sin URL visible');
assert.ok(backend.includes("p.asset || ''"), 'el manifiesto tiene una ruta separada');
assert.ok(claspIgnore.includes('!Index.html'), 'clasp permite subir Index.html');
assert.ok(claspIgnore.includes('!Assets.gs'), 'clasp permite subir los iconos del manifiesto');

const context = vm.createContext({ JSON });
vm.runInContext(assets, context, { filename: 'Assets.gs' });
const manifest = vm.runInContext("buildManifest_('https://script.google.com/macros/s/TEST/exec')", context);
assert.equal(manifest.display, 'standalone', 'el manifiesto solicita modo independiente');
assert.equal(manifest.start_url, 'https://script.google.com/macros/s/TEST/exec', 'el inicio usa el deployment actual');
assert.equal(manifest.icons.length, 2, 'el manifiesto contiene iconos 192 y 512');
assert.ok(manifest.icons.every((icon) => icon.src.startsWith('data:image/png;base64,')), 'los iconos viajan dentro de Apps Script');

console.log('abs<3: interfaz minimalista de Apps Script verificada');
