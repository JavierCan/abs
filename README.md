# abs<3 — Fase 5.2 · corrección iPhone

Esta revisión corrige la prueba física de la Fase 5.1 sin volver a convertir la app en un laboratorio.

## Qué cambió

- La pantalla normal vuelve a ser **solo negro + partículas + ramo**.
- El ramo usa la geometría aprobada: `c = 44`, `κ = 0.82`.
- El encuadre se calcula con `window.innerWidth/window.innerHeight` para iPhone Pro / Pro Max y para el alto reducido que deja la franja externa de Apps Script.
- El ramo crece hasta ocupar el ancho útil; con pocos meses ya no queda diminuto o demasiado lejos.
- Se elimina el capullo permanente. La interfaz de notificaciones aparece **solo una vez** al abrir desde Inicio.
- El permiso de notificaciones se solicita únicamente desde el botón **Permitir**, que constituye un gesto real del usuario.
- Se genera un `apple-touch-icon` PNG real. Como Apps Script no sirve binarios PNG, `Code.gs` crea el icono una vez en Google Drive, lo comparte como asset y lo coloca en `<link rel="apple-touch-icon">`.
- Tocar una flor sigue abriendo el panel matemático; el panel queda anclado abajo y limitado al alto del teléfono.
- La fecha oficial sigue dependiendo exclusivamente de Apps Script en `America/Merida`.

## Importante: la franja de Google

La leyenda **“Un usuario de Google Apps Script creó esta aplicación”** no está dentro de `Index.html`. Google la añade alrededor de la Web App para ciertos accesos externos. No existe CSS o JavaScript del proyecto que pueda eliminarla manteniendo el alojamiento directo en Apps Script.

## Importante: notificaciones

Fase 5.2 prepara el permiso de notificaciones desde una acción del usuario. El **push con la app completamente cerrada** sigue siendo Fase 6: en iPhone el Web Push real necesita Push API, Notifications API y un Service Worker. Además, HTML Service de Apps Script ejecuta la interfaz dentro de un sandbox `IFRAME`, por lo que esta entrega no presenta el push de fondo como terminado. El crecimiento del ramo nunca depende de esto.

## Subir al MISMO proyecto de Apps Script

1. Entra a `apps-script/`.
2. Conserva tu `.clasp.json` real. **No lo sustituyas** por `.clasp.json.example`.
3. Ejecuta:

```powershell
clasp status
clasp push --force
clasp create-version "abs3 Fase 5.2 - iPhone"
```

4. Actualiza tu deployment existente para que apunte a esa nueva versión. No crees otra URL si quieres conservar el `/exec` actual.
5. Abre la Web App una vez con la cuenta propietaria. Si Google pide autorización de Drive, acéptala; solo se usa para publicar el PNG del icono.
6. Opcionalmente ejecuta `testTouchIcon()` en Apps Script. Debe devolver una URL HTTPS.

> Fase 5.2 no usa `setXFrameOptionsMode(ALLOWALL)` ni expone funciones que borren la progresión del ramo.

## Para corregir la “A” en el iPhone

El icono ya instalado queda cacheado por iOS. Después de publicar Fase 5.2:

1. elimina de la pantalla de Inicio el acceso viejo `abs<3` que muestra la A;
2. abre nuevamente la URL `/exec` publicada;
3. usa Compartir → **Agregar a pantalla de inicio**;
4. comprueba que ahora aparezca el icono floral.

No es necesario borrar el proyecto ni cambiar la semilla.
