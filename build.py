"""Genera las entradas autónomas incrustando los módulos, sin servidor."""
import re, pathlib

root = pathlib.Path(__file__).parent

def strip(path):
    t = (root / 'src' / path).read_text(encoding='utf-8')
    t = re.sub(r"^import \{[^}]*\} from '[^']+';\s*", '', t, flags=re.M)
    return re.sub(r'^export ', '', t, flags=re.M)

lab = (root / 'lab-modular.html').read_text(encoding='utf-8')
lab = lab.replace('<script type="module">', '<script>')

# [^}] impide que un import se trague al siguiente
embedded_modules = (
    '/* flowers.js */\n' + strip('garden/flowers.js') +
    '\n/* foliage.js */\n' + strip('garden/foliage.js') +
    '\n/* wrapping.js */\n' + strip('garden/wrapping.js') +
    '\n/* motion.js */\n' + strip('garden/motion.js') +
    '\n/* official-state.js */\n' + strip('api/official-state.js') +
    '\n/* laboratorio */'
)
# Usar función de reemplazo conserva literalmente las expresiones regulares de
# los módulos incrustados (por ejemplo, \d en el validador de la URL).
lab = re.sub(
    r"import \{[^}]*\} from '\./src/garden/flowers\.js';",
    lambda _match: embedded_modules,
    lab
)
for mod in ('foliage', 'wrapping', 'motion'):
    lab = re.sub(r"import \{[^}]*\} from '\./src/garden/" + mod + r"\.js';", '', lab)
lab = re.sub(r"import \{[^}]*\} from '\./src/api/official-state\.js';", '', lab)

leftover = re.findall(r'^\s*import ', lab, flags=re.M)
assert not leftover, f'quedaron {len(leftover)} imports sin resolver'
for symbol in (
    'buildFoliage', 'buildWrapping', 'wrappingMotion', 'awakenSchedule',
    'function mulberry32', 'fetchOfficialState', 'normalizeApiUrl'
):
    assert symbol in lab, f'falta {symbol} en la salida'
assert 'stemGeom: st' not in lab, 'referencia de tallo fuera de alcance'
assert 'const stemGeom = stemFor(pc, b.baseY)' in lab, 'falta reconstruir la curva del tallo'

targets = ('ABRIR.html', 'lab.html', 'lab-standalone.html')
for target in targets:
    (root / target).write_text(lab, encoding='utf-8')
print(f'{", ".join(targets)} generados, {len(lab)} bytes cada uno')
