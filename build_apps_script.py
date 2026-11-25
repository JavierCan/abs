"""Compila la experiencia móvil dentro del proyecto de Google Apps Script."""

import base64
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
APP_DIR = ROOT / "apps-script"
SOURCE_DIR = ROOT / "src" / "garden"
ASSETS_DIR = ROOT / "assets"


def strip_module(path: pathlib.Path) -> str:
    source = path.read_text(encoding="utf-8")
    source = re.sub(r"^import\s+\{[^}]*\}\s+from\s+['\"][^'\"]+['\"];\s*", "", source, flags=re.M)
    source = re.sub(r"^export\s+", "", source, flags=re.M)
    return source.strip()


def data_uri(path: pathlib.Path) -> str:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def base64_png(path: pathlib.Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


modules = ["flowers.js", "foliage.js", "wrapping.js", "motion.js", "bouquet-scene.js"]

garden_source = "\n\n".join(
    f"/* {name} */\n{strip_module(SOURCE_DIR / name)}" for name in modules
)

template = (APP_DIR / "Index.template.html").read_text(encoding="utf-8")
compiled = template.replace("/*__ABS3_GARDEN__*/", garden_source)

assert "/*__ABS3_GARDEN__*/" not in compiled
assert not re.search(r"^\s*(?:import|export)\s", compiled, flags=re.M)
assert "createBouquetScene" in compiled
assert "spacing: 44" in compiled
assert "hero-copy" not in compiled
assert "Un ramo que" not in compiled

(APP_DIR / "Index.html").write_text(compiled, encoding="utf-8")

icon_180_data = data_uri(ASSETS_DIR / "apple-touch-icon.png")
icon_192_data = data_uri(ASSETS_DIR / "icon-192.png")
icon_512_data = data_uri(ASSETS_DIR / "icon-512.png")
icon_180_base64 = base64_png(ASSETS_DIR / "apple-touch-icon.png")
icon_192_base64 = base64_png(ASSETS_DIR / "icon-192.png")
icon_512_base64 = base64_png(ASSETS_DIR / "icon-512.png")

manifest_template = {
    "id": "__START_URL__",
    "name": "abs<3",
    "short_name": "abs<3",
    "lang": "es-MX",
    "start_url": "__START_URL__",
    "scope": "__START_URL__",
    "display": "standalone",
    "orientation": "portrait-primary",
    "background_color": "#000000",
    "theme_color": "#000000",
    "icons": [
        {"src": "__ICON_192_URL__", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": "__ICON_512_URL__", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}
    ]
}

manifest_json = json.dumps(manifest_template, ensure_ascii=False, separators=(",", ":"))
assets_source = """/** Archivo generado por build_apps_script.py. */
const ABS3_INLINE_ASSETS_ = {
  appleTouchIcon: __ICON180_DATA__,
  icon192: __ICON192_DATA__,
  icon512: __ICON512_DATA__
};

const ABS3_ICON_BASE64_180 = __ICON180_BASE64__;
const ABS3_ICON_BASE64_192 = __ICON192_BASE64__;
const ABS3_ICON_BASE64_512 = __ICON512_BASE64__;

const ABS3_MANIFEST_TEMPLATE_ = __MANIFEST_JSON__;

function buildManifest_(webAppUrl, iconAssets) {
  const url = String(webAppUrl || '');
  const icons = iconAssets || {};
  const manifestText = JSON.stringify(ABS3_MANIFEST_TEMPLATE_)
    .replaceAll('__START_URL__', url)
    .replaceAll('__ICON_192_URL__', icons.icon192 || ABS3_INLINE_ASSETS_.icon192)
    .replaceAll('__ICON_512_URL__', icons.icon512 || ABS3_INLINE_ASSETS_.icon512);
  return JSON.parse(manifestText);
}
"""
assets_source = assets_source.replace('__ICON180_DATA__', json.dumps(icon_180_data, ensure_ascii=False))
assets_source = assets_source.replace('__ICON192_DATA__', json.dumps(icon_192_data, ensure_ascii=False))
assets_source = assets_source.replace('__ICON512_DATA__', json.dumps(icon_512_data, ensure_ascii=False))
assets_source = assets_source.replace('__ICON180_BASE64__', json.dumps(icon_180_base64, ensure_ascii=False))
assets_source = assets_source.replace('__ICON192_BASE64__', json.dumps(icon_192_base64, ensure_ascii=False))
assets_source = assets_source.replace('__ICON512_BASE64__', json.dumps(icon_512_base64, ensure_ascii=False))
assets_source = assets_source.replace('__MANIFEST_JSON__', manifest_json)
(APP_DIR / "Assets.gs").write_text(assets_source, encoding="utf-8")

print(f"Apps Script generado: Index.html={len(compiled)} bytes, Assets.gs={len(assets_source)} bytes")
