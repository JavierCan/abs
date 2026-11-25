# abs<3 — bitácora · Fase 5.2

Fecha: 1 de septiembre de 2026.

## Motivo

Prueba física en iPhone detectó cuatro problemas visibles:

1. el ramo se veía demasiado pequeño/lejos dentro de la pantalla;
2. el acceso agregado a Inicio mostraba un monograma `A`;
3. el capullo de permiso parecía un elemento roto/permanente;
4. la franja de Google ocupaba la parte superior.

## Correcciones implementadas

### Encuadre móvil

Se mantiene la composición 3.3 (`c=44`, `κ=0.82`) y se cambia únicamente la cámara de presentación. La altura del `viewBox` se calcula con la relación real del viewport y el grupo del ramo aplica un factor de ajuste acotado por el radio real de la filotaxis. Esto evita modificar posiciones matemáticas de flores existentes.

### Capullo / onboarding

Se elimina el capullo persistente. El primer uso instalado en Inicio muestra una tarjeta inferior de una sola ocasión. El usuario decide `Permitir` o `Ahora no`. El crecimiento no se bloquea.

### Icono iOS

iOS 16.4+ usa un monograma si no consigue un icono de Home Screen. El icono de Fase 5.1 estaba incrustado de una manera que la prueba real no resolvió. Fase 5.2 crea un PNG de 180×180 en Drive una sola vez, lo comparte como archivo de solo lectura y usa esa URL HTTPS como `apple-touch-icon`.

### Barra de Apps Script

No se intenta ocultar desde CSS. Está fuera del HTML servido por el proyecto y forma parte del contenedor de Google. El viewport ahora se adapta al alto restante para que esa franja no vuelva a reducir visualmente el ramo más de lo necesario.

## Backend preservado

- Zona horaria: `America/Merida`.
- Semilla: `a3f1c07d` salvo que ya exista otra en Script Properties.
- Abril 2026 = mes 1.
- Día 15 = desbloqueo.
- `ABS3_UNLOCKED_MONTHS` es monótono.
- `LockService` protege la confirmación concurrente.

## Estado de push

La tarjeta de Fase 5.2 prepara/solicita el permiso mediante un gesto real. El envío con la app cerrada continúa pendiente de Fase 6. Apps Script HTML Service mantiene la interfaz dentro de su sandbox `IFRAME`, así que esta revisión no simula ni promete un Service Worker de fondo donde no existe.

## Seguridad de la revisión

- Se eliminó `setXFrameOptionsMode(ALLOWALL)`: no aporta nada a esta app y no es necesario para el sandbox actual de Apps Script.
- Se retiró la función de prueba que podía borrar `ABS3_UNLOCKED_MONTHS`. La entrega no incluye un reset de progresión.
