# abs<3 · Fase 5.4.1 en Apps Script

Esta carpeta contiene la aplicación final y el backend en el mismo proyecto de
Google Apps Script. La URL limpia abre el ramo minimalista; la fecha oficial,
la semilla y el desbloqueo mensual siguen calculándose en
`America/Merida`.

## Archivos que sube clasp

`clasp show-file-status` debe mostrar únicamente:

```text
Code.gs
Assets.gs
Index.html
appsscript.json
```

- `Code.gs`: página, API, calendario, bloqueo y persistencia.
- `Index.html`: experiencia móvil compilada, sin controles técnicos.
- `Assets.gs`: manifiesto e iconos instalables incrustados.
- `appsscript.json`: zona horaria, V8 y configuración web.

`Index.template.html` es la fuente editable y no se sube. Para regenerar
`Index.html` después de cambiar el motor o la plantilla:

```text
python build_apps_script.py
```

## Actualizar el deployment existente con clasp 3.x

Desde la carpeta `abs3` que ya contiene tu `.clasp.json`:

```powershell
clasp show-file-status
clasp push --force
clasp create-deployment --deploymentId AKfycbzcTFqq6V3N37Ged7Wl5UmuFWAKj3I82_fq0H4eCnZCOjtDZRaRipU5HmFAO2XwqQONdg --description "abs3 Fase 5.4.1 icon + flores"
clasp list-deployments
```

`create-deployment --deploymentId` actualiza el deployment existente y crea
una versión nueva. La URL no cambia:

```text
https://script.google.com/macros/s/AKfycbzcTFqq6V3N37Ged7Wl5UmuFWAKj3I82_fq0H4eCnZCOjtDZRaRipU5HmFAO2XwqQONdg/exec
```

Al abrirla debe aparecer un splash floral breve y después únicamente el ramo
sobre negro. Ya no devuelve JSON en la URL limpia. Para comprobar el backend:

```text
GET /exec?action=health
GET /exec?action=state&lastSeenMonths=5
```

El laboratorio `ABRIR.html` continúa funcionando porque sincroniza mediante
`POST /exec`.


## Paso extra para que salga el icono en iPhone

Después de publicar la versión, abre el editor de Apps Script y ejecuta **una sola vez**:

```text
setupAbs3Assets()
```

Si prefieres, también puedes ejecutar:

```text
setupAbs3()
```

Eso crea 3 PNG públicos en tu Google Drive y guarda sus IDs en Script Properties.
La app seguirá abriendo aunque no hagas este paso, pero el **icono instalable** del iPhone depende de él.

## Añadirla al teléfono

### iPhone

1. Abre la URL `/exec` en Safari.
2. Toca **Compartir**.
3. Elige **Agregar a pantalla de inicio**.
4. Abre `abs<3` desde el icono floral.

### Android

1. Abre la URL `/exec` en Chrome.
2. Abre el menú del navegador.
3. Elige **Instalar aplicación** o **Agregar a pantalla principal**.

La app no muestra un botón de instalación: la acción se hace desde el navegador,
como se definió en los mockups.

## Experiencia implementada

- pantalla negra y ramo aprobado de la fase 3.3;
- splash floral de menos de un segundo, sin portada;
- despertar desde las puntas, envoltura y lazo;
- flor mensual elevada, insertada y con destello;
- capullo interactivo para solicitar permiso, sin botón visible;
- vigilia visual de los últimos 30 segundos, sin números;
- panel matemático únicamente al tocar una flor;
- último estado oficial guardado localmente, sin inventar meses.

El permiso del capullo prepara la experiencia, pero el aviso push con la app
completamente cerrada sigue perteneciendo a la Fase 6. Apps Script por sí solo
no sustituye el servicio de Web Push/FCM.

## Contrato del estado

| Campo | Significado |
| --- | --- |
| `officialDate` | fecha `yyyy-MM-dd` calculada en Mérida |
| `officialTimestamp` | hora oficial con desplazamiento de zona |
| `seed` | semilla persistente del ramo |
| `unlockedMonths` | meses confirmados; nunca disminuye |
| `newMonths` | meses nuevos respecto del teléfono |
| `nextUnlockDate` | próximo día 15 oficial |

`LockService` evita dobles siembras y Script Properties conserva el estado. El
cliente nunca decide el mes ni acepta un mes enviado desde el teléfono.

## Referencias oficiales

- [Aplicaciones web de Apps Script](https://developers.google.com/apps-script/guides/web)
- [HTML Service](https://developers.google.com/apps-script/guides/html)
- [clasp](https://github.com/google/clasp)
