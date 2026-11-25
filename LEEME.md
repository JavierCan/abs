# abs<3 · Fase 5.4.1

Versión corregida para iPhone:
- flores un poco más grandes
- icono instalable con PNG público vía Drive
- app estable sin romper la apertura

## Pasos
1. `clasp push --force`
2. crea una nueva versión
3. actualiza el deployment existente
4. ejecuta `setupAbs3Assets()` una sola vez desde el editor
5. vuelve a abrir `/exec` en Safari y agrega a pantalla de inicio

# abs<3 · entrega Fase 5.1

La aplicación destinada a la novia ahora vive dentro de Google Apps Script. No
usa ChatGPT Sites y no debe abrirse con `ABRIR.html`: ese archivo continúa siendo
el laboratorio privado.

## Qué verá ella

La URL `/exec` entra directamente a una pantalla negra con el ramo aprobado en
la fase 3.3. No existe portada, encabezado, frase romántica, fecha, estado de
conexión ni botón de instalación.

La secuencia está inspirada en los mockups, sin copiar sus flores esquemáticas:

1. splash floral de menos de un segundo, sin texto;
2. despertar del ramo desde las puntas;
3. capullo flotante para solicitar permiso mediante un gesto real;
4. ramo normal sin texto visible;
5. vigilia silenciosa durante los últimos 30 segundos antes del día 15;
6. llegada mensual con elevación, inserción, destello y pulso del lazo;
7. panel matemático únicamente después de tocar una flor.

El ramo conserva la semilla `a3f1c07d`, separación `c = 44`, compresión
`κ = 0.82`, envoltura curva y lazo de la fase aprobada.

## Subirla al Apps Script ya creado

Descomprime el ZIP sustituyendo tu carpeta `abs3`. Desde esa carpeta ejecuta:

```powershell
clasp show-file-status
clasp push --force
clasp create-deployment --deploymentId AKfycbzcTFqq6V3N37Ged7Wl5UmuFWAKj3I82_fq0H4eCnZCOjtDZRaRipU5HmFAO2XwqQONdg --description "abs3 Fase 5.1 minimalista"
clasp list-deployments
```

`show-file-status` debe listar `Code.gs`, `Assets.gs`, `Index.html` y
`appsscript.json`. La URL existente se conserva.

## Añadirla al teléfono

En iPhone abre la URL en Safari y usa **Compartir → Agregar a pantalla de
inicio**. En Android abre la URL en Chrome y usa **Instalar aplicación** o
**Agregar a pantalla principal**.

No hay botón dentro de la app; la instalación se hace desde el navegador.

## Qué archivo sirve para cada cosa

| Archivo | Uso |
| --- | --- |
| `apps-script/Index.html` | app final compilada |
| `apps-script/Code.gs` | app, fecha oficial y desbloqueo |
| `apps-script/Assets.gs` | manifiesto e iconos |
| `apps-script/README.md` | guía completa de despliegue |
| `ABRIR.html` | laboratorio privado |
| `BITACORA.md` | historia y decisiones del proyecto |

## Estado de las notificaciones

El capullo ya solicita el permiso desde un toque real y la vigilia está
implementada. El aviso push cuando la aplicación se encuentra totalmente
cerrada sigue pendiente para la Fase 6, porque requiere Web Push/FCM. El
crecimiento mensual no depende de esa notificación: Apps Script confirma el mes
al abrir la app.

## Verificación de desarrollo

```text
npm run build
npm test
```

Las pruebas validan geometría, calendario, idempotencia, ausencia de portada,
estado inicial sin texto, manifiesto, interacción del capullo y panel
matemático.
