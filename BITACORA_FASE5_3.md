# abs<3 · Fase 5.3

Corrección de emergencia sobre la base estable de Fase 5.1.

- Se eliminó por completo la dependencia en tiempo de ejecución de Google Drive introducida en Fase 5.2.
- `doGet()` vuelve a servir la app directamente desde HtmlService.
- El icono vuelve a estar embebido; no se crea ni consulta ningún archivo de Drive al abrir la app.
- El capullo de permiso queda desactivado para que no aparezca como elemento extraño.
- Se amplió el ramo para iPhone reduciendo padding del SVG y usando más alto/ancho del viewport.
- Se conserva la lógica oficial de fecha, semilla, progreso mensual y geometría de Fase 5.1.

Esta versión prioriza que la Web App vuelva a abrir de forma fiable. La instalación/PWA y el icono de iOS se tratarán por separado sin volver a introducir dependencias que bloqueen `doGet()`.
