# abs<3 · Fase 5.4.1

Corrección de emergencia sobre Fase 5.4.

- Eliminado `HtmlOutput.setFaviconUrl(...)`, que hacía fallar `doGet()` con “No se admite el tipo de imagen de icono de página”.
- Se conserva `apple-touch-icon` en el HTML para iPhone.
- Se conservan las flores ampliadas y los márgenes reducidos.
- La publicación de PNG mediante `setupAbs3Assets()` sigue siendo manual y no bloquea la apertura de la app.
