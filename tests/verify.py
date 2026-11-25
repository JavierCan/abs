from pathlib import Path
import json, re
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'apps-script'/'Index.html').read_text(encoding='utf-8')
code=(ROOT/'apps-script'/'Code.gs').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'apps-script'/'appsscript.json').read_text(encoding='utf-8'))
assert manifest['timeZone']=='America/Merida'
assert 'C=44, KAPPA=.82' in html
assert 'apple-touch-icon' in html
assert 'Notification.requestPermission()' in html
assert 'window.innerHeight' in html and 'window.innerWidth' in html
assert 'laboratorio de flores' not in html
assert '<h1>' not in html
assert "DEFAULT_SEED: 'a3f1c07d'" in code
assert 'LockService.getScriptLock()' in code
assert 'DriveApp.createFile' in code
assert (ROOT/'assets'/'icon-180.png').exists()
assert (ROOT/'assets'/'icon-512.png').exists()
print('OK - Fase 5.2')
