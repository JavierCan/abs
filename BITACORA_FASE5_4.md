# abs<3 · Fase 5.4.1

## Cambios
- Icono instalable preparado con URLs HTTPS reales publicadas en Drive mediante `setupAbs3Assets()`.
- `doGet()` ya no crea ni consulta Drive de forma riesgosa para abrir la app.
- Flores un poco más grandes en iPhone.
- Menos margen vacío alrededor del ramo.

## Paso adicional necesario
Después de publicar la versión, entra al editor de Apps Script y ejecuta una sola vez `setupAbs3Assets()` o `setupAbs3()`. Eso crea los PNG públicos para el icono.
