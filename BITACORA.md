# abs<3 — bitácora maestra

Registro consolidado de lo construido, las decisiones tomadas, las pruebas, los
errores corregidos y lo que sigue.

- **Proyecto:** `abs3`
- **Inicio de la relación:** 15 de marzo de 2026
- **Zona horaria oficial:** `America/Merida`
- **Progresión:** cada día 15 se desbloquea una pieza; abril de 2026 es el mes 1
- **Versión documentada:** fase 5.1
- **Fecha de actualización:** 1 de septiembre de 2026

---

## Estado por fases

| Fase | Contenido | Estado |
| ---: | --- | --- |
| 1 | Matemática de cuatro especies, semilla y filotaxis | terminada |
| 2 | Follaje: hojas, brotes, ramitas y destellos | terminada |
| 3 | Despertar, crecimiento mensual y respiración | terminada |
| 3.1 | Entrada desde la punta, separación real, elevación y destello mensual | terminada |
| 3.2 | Reparación del motor, acceso autónomo y progreso visible | terminada |
| 3.3 | Copa compacta, tallos proporcionados, envoltura y lazo animados | terminada |
| 4 | Apps Script: fecha, semilla y siembra del día 15 | terminada |
| 4.1 | Deployment @2 integrado y sincronización automática | terminada |
| 5.0 | Primera PWA con portada y alojamiento en Sites | descartada |
| 5.1 | App minimalista alojada en Apps Script e inspirada en los mockups | terminada |
| 6 | Notificaciones push | pendiente |
| 7 | Pulido y pruebas en iPhone real | pendiente |

El ZIP actual conserva el laboratorio y convierte el mismo proyecto de Apps
Script en la aplicación final destinada a la novia. El laboratorio sigue siendo
una herramienta privada; no es la pantalla que ella verá.

---

## Resultado actual

El proyecto dibuja un ramo SVG determinista de hortensias, tulipanes, gerberas y
lirios. La misma semilla y el mismo mes siempre producen exactamente el mismo
ramo. Cada nueva pieza conserva su posición definitiva, pero al desbloquearse se
presenta temporalmente al frente para que nunca pase desapercibida.

La revisión 3.1 introdujo estos cambios:

1. El despertar ahora acompaña la punta viva del tallo. La corola ya no queda
   inmóvil en la posición final mientras el tallo se dibuja.
2. La separación efectiva pasó de `c = 26` a `c = 52` en el código del
   laboratorio, en el valor predeterminado del generador y en el follaje.
3. La flor mensual se eleva con un arco corto, crece, se inserta en su posición
   definitiva y produce un destello visible.
4. Durante esa presentación, la pieza nueva se mueve temporalmente al primer
   plano. Al terminar, recupera el plano estable que le corresponde.
5. El destello se construye con círculos y rayos SVG, sin `feGaussianBlur`, para
   no penalizar Safari/iPhone.
6. El ciclo de animación se detiene correctamente si no hay respiración activa.
7. Se añadieron pruebas automáticas y un comando reproducible para regenerar el
   archivo autónomo.

La revisión 3.2 corrige un bloqueo crítico detectado al probar el ZIP entregado:

1. `renderBouquet()` intentaba guardar `stemGeom: st` fuera del bloque donde
   existía `st`. El navegador lanzaba `ReferenceError: st is not defined` y
   cancelaba el armado de la escena; por eso **Despertar** y **Desbloquear mes**
   no producían ninguna animación.
2. Cada pieza reconstruye ahora su propia curva con
   `const stemGeom = stemFor(pc, b.baseY)` dentro del alcance correcto.
3. La longitud del tallo se calcula por muestreo matemático de la Bézier y ya no
   depende de `SVGPathElement.getTotalLength()`, mejorando compatibilidad.
4. El ciclo de `requestAnimationFrame` libera su identificador antes de procesar
   el cuadro; un error ya no deja los botones congelados permanentemente.
5. Se añadió una barra de progreso con estados verificables para ambos botones.
6. El despertar dura más y usa una curva suave de entrada/salida; la presentación
   mensual dura 2.8 segundos para que la elevación y el destello sean visibles.
7. `ABRIR.html`, `lab.html` y `lab-standalone.html` son ahora autónomos. La fuente
   modular quedó separada como `lab-modular.html`.

La revisión 3.3 responde a la validación visual del ramo con muchas flores:

1. La separación radial baja de `c = 52` a `c = 44`, suficiente para conservar
   las cabezas identificables pero con una copa más unida.
2. La compresión vertical cambia de `κ = 0.72` a `κ = 0.82`, formando una copa
   ovalada en vez de un abanico demasiado plano.
3. La extensión inferior de los tallos baja de 1.35 a 0.58 veces la altura de la
   copa; ahora el conjunto se percibe como ramo y no como tallos largos sueltos.
4. Se agrega un punto de amarre proporcional debajo de la copa.
5. La envoltura usa curvas orgánicas y cuatro paneles semitransparentes: dos
   traseros y dos frontales. No utiliza desenfoques ni filtros pesados.
6. El lazo tiene nudo, dos asas y dos cintas calculadas según el ancho real del
   ramo.
7. En **Despertar**, el papel se abre desde el amarre y el lazo entra al final.
8. En **Desbloquear mes**, el papel permanece colocado y el lazo pulsa mientras
   la flor nueva se eleva y se inserta.
9. Las capas se separan en papel trasero, flores, papel frontal, lazo y capa de
   presentación. Esto evita que la envoltura tape la copa.
10. Se añadieron previsualizaciones estáticas con 6 y 40 flores para comprobar
    la proporción en ramos pequeños y grandes.

La Fase 4 convierte el calendario acordado en estado verificable de servidor:

1. `Code.gs` calcula siempre la fecha mediante `Utilities.formatDate` con
   `America/Merida`; la fecha del dispositivo no se recibe ni se consulta.
2. Abril de 2026 es el mes 1. Antes del 15 de abril hay cero piezas; cada día 15
   suma exactamente una.
3. La semilla aprobada `a3f1c07d` se inicializa una sola vez en Script
   Properties y luego permanece estable.
4. `ABS3_UNLOCKED_MONTHS` solo avanza. Una recarga o repetición de la solicitud
   no puede reducir ni duplicar el estado.
5. `LockService.getScriptLock()` protege la lectura-modificación-escritura para
   que dos dispositivos simultáneos no confirmen dos veces la misma siembra.
6. Si la aplicación estuvo cerrada, la siguiente solicitud detecta todos los
   meses faltantes y devuelve `newlyCommittedMonths` y `newMonths`.
7. La API acepta `GET` de estado/salud y `POST` de sincronización en
   `text/plain`. Cualquier `seed` o `unlockedMonths` enviado por el cliente se
   ignora.
8. El laboratorio añade un campo para la URL `/exec`, valida que pertenezca a
   Apps Script, cachea el último estado recibido y vuelve a sincronizar al abrir.
9. La primera conexión despierta el ramo oficial. Una actualización normal
   conserva la elevación, el destello, la capa frontal temporal y el pulso del
   lazo de la Fase 3.3.
10. Hasta tres meses pendientes se presentan uno por uno; una ausencia mayor
    usa un despertar completo para no obligar a esperar demasiadas animaciones.

La revisión 4.1 conecta el archivo autónomo con el deployment creado mediante
`clasp`:

1. El deployment versionado `@2` queda configurado como URL predeterminada.
2. `ABRIR.html` intenta sincronizar automáticamente desde su primera apertura;
   ya no es necesario copiar y pegar la URL.
3. El campo de URL y el botón manual se conservan para diagnóstico y futuros
   cambios de deployment.
4. Si existe un estado oficial guardado, se dibuja primero y después se consulta
   el servidor, evitando mostrar un mes provisional durante la conexión.

La primera propuesta de Fase 5 quedó descartada porque añadió una portada con
texto, cambió la densidad aprobada y publicó la interfaz en ChatGPT Sites. Esas
tres decisiones contradecían los mockups y la intención de instalar la app desde
el proyecto propio del usuario.

La revisión 5.1 corrige la dirección:

1. La app final se sirve desde `apps-script/Index.html` en el mismo deployment
   que ya contiene la fuente de verdad; no usa ChatGPT Sites.
2. La URL limpia `/exec` abre HTML. La API se conserva mediante `POST /exec` y
   `GET /exec?action=...`, por lo que el laboratorio no se rompe.
3. El estado normal no contiene texto visible: solo negro, partículas discretas
   y el ramo. No hay portada, frase, fecha, indicador de conexión ni botón.
4. La composición recupera exactamente la fase 3.3: `c = 44`, `κ = 0.82`, copa
   compacta, envoltura curva y lazo animado.
5. El splash dura menos de un segundo y usa únicamente una marca floral.
6. El capullo es el gesto de permiso. Visualmente no existe un botón separado;
   el elemento accesible está oculto dentro de la forma.
7. La vigilia de los últimos 30 segundos no presenta cuenta regresiva ni
   números. Solo incrementa el halo del capullo antes de volver a sincronizar.
8. La flor oficial nueva conserva la elevación, inserción, destello, plano
   temporal frontal y pulso del lazo.
9. Tocar una flor abre su panel matemático; al cerrarlo vuelve el estado sin
   texto. Las ecuaciones no aparecen en la pantalla normal.
10. `Assets.gs` sirve un manifiesto `standalone` con iconos incrustados y
    `Index.html` incluye las etiquetas de instalación para iPhone.
11. `.claspignore` permite subir únicamente `Code.gs`, `Assets.gs`,
    `Index.html` y `appsscript.json`.
12. El aviso push con la aplicación completamente cerrada permanece en la Fase
    6; la revisión 5.1 prepara el permiso, la vigilia y el evento local, pero no
    presenta eso como notificación de fondo terminada.

---

## Arquitectura acordada

### Apps Script contiene la aplicación y la API

La decisión vigente, confirmada al revisar los mockups, es alojar la experiencia
en el proyecto propio de Apps Script. No se usa `iframe`, ChatGPT Sites ni una
segunda URL:

- `GET /exec` sirve la interfaz mediante `HtmlService`;
- `google.script.run` obtiene el estado oficial dentro del mismo proyecto;
- `POST /exec` conserva la API utilizada por `ABRIR.html`;
- `GET /exec?action=...` conserva diagnóstico e integración externa;
- `GET /exec?asset=manifest` sirve el manifiesto de instalación.

Esta elección simplifica propiedad y despliegue con `clasp`, pero no incorpora
un service worker de origen propio. Por ello el push en segundo plano y una
experiencia realmente offline continúan fuera de la Fase 5.1.

### Apps Script es la fuente de verdad de la fecha

El reloj del teléfono no decidirá el crecimiento. La fecha se calculará con:

```js
Utilities.formatDate(new Date(), 'America/Merida', ...)
```

Sin conexión se muestra el último ramo disponible y no se desbloquean piezas
nuevas. Cambiar la hora del dispositivo no altera la progresión.

### El ramo no tiene capacidad máxima

La primera fórmula dependía de una capacidad `N`:

```text
ρₘ = R√(m/N)
```

Al aumentar `N`, las flores anteriores cambiaban de lugar. Se eliminó esa
dependencia y se adoptó:

```text
ρₘ = c√m
θₘ = mψ
```

Las coordenadas de cada mes quedan congeladas. Solo la cámara abre el encuadre
cuando el ramo crece. La densidad permanece aproximadamente constante porque el
área aumenta proporcionalmente a `m`.

### La aleatoriedad es reproducible

La variedad visual se deriva de la semilla; no cambia al recargar:

```text
h₀ = FNV-1a(seed ‖ ":" ‖ m)
u₁, u₂, … = mulberry32(h₀)
```

La posición global usa filotaxis; especie, inclinación, parámetros y follaje usan
azar seudorreproducible. Así se conserva la sensación orgánica sin mover una flor
existente.

### Decisiones visuales revisadas

- **Primera envoltura descartada:** el cono de nueve paneles triangulares se veía
  demasiado geométrico. En la fase 3.3 se retomó la idea con cuatro paneles
  curvos, semitransparentes y proporcionados a la copa.
- **Jardín:** dispersaba las piezas, perdía el gesto de regalo y obligaba a alejar
  demasiado la cámara vertical.

---

## Matemática implementada

### Especies por ciclos de cuatro

Cada bloque de cuatro meses contiene exactamente una hortensia, un tulipán, una
gerbera y un lirio, barajados con Fisher–Yates y la semilla del ciclo.

```text
ciclo = ⌊(m−1)/4⌋
especie(m) = permutación_ciclo[(m−1) mod 4]
```

### Posición por filotaxis de Vogel

```text
φ = (1+√5)/2
ψ = 2π(1 − φ⁻¹) = 137.507764°
θₘ = mψ
ρₘ = 44√m
(x,y) = (ρ cos θ, −0.82ρ sin θ)
plano = m mod 3
```

Los planos asignan escala, opacidad y nivel de detalle. Durante la presentación
mensual se altera únicamente el orden visual temporal, no las coordenadas ni el
plano definitivo.

### Contorno de gerbera y lirio

```text
r(θ) = (|cos(pθ/4)/a|^n₂ + |sin(pθ/4)/b|^n₃)^(−1/n₁)
```

### Gerbera

Dos coronas de pétalos y disco central. Los puntos del disco también siguen el
ángulo áureo.

```text
x(u) = w·sin(π·u^0.8)
y(u) = −L·u
```

### Hortensia

Corimbo de flósculos por Vogel; cada flósculo es una rosa de cuatro pétalos.

```text
flósculo: r(θ) = a·cos(2θ)
domo: sᵢ = s₀(1 − 0.35(ρᵢ/R)²)
```

### Tulipán

Seis tépalos en dos verticilos desfasados. La apertura rota los puntos de
control de la Bézier sin deformar la curva base.

```text
B(t) = (1−t)³P₀ + 3(1−t)²tP₁ + 3(1−t)t²P₂ + t³P₃
α(τ) = α₀ + τ(α₁−α₀)
```

### Lirio

El término cúbico produce la recurva del tépalo:

```text
x(u) = w·sin(πu)(1−βu)
y(u) = −Lu + cu³
```

### Hojas y tallos

La hoja se prende a un punto real de la Bézier del tallo. Se calcula la tangente
y se orienta alternando lados.

```text
x(u) = w·sin(π·u^0.7)(1−0.12u) + κLu²
```

---

## Movimiento

Un único parámetro `τ` controla el tallo, la corola, las hojas y la apertura:

```text
p = clamp((t−retardo)/D, 0, 1)
τ(p) = 4p³                         si p < 0.5
τ(p) = 1 − (−2p+2)³/2             si p ≥ 0.5
tallo: dashoffset = (1−τ)·longitud
punta: Bézier_tallo(τ)
corola: translate(punta)
hoja: rot = rot₁ − 46°(1−τ)
hoja: escala = 0.15 + 0.85τ
```

En el despertar, cada corola viaja sobre la punta del tallo que la sostiene. En
el crecimiento mensual se añade una presentación:

```text
elevación = −18·sin(πτ)
escala = 0.72 + 0.28·easeOut(τ) + 0.08·sin(πτ)
destello = sin(π·fase_destello)^1.7
```

La flor termina con elevación cero y escala exacta 1; por eso no salta al
insertarse en su posición definitiva.

La respiración usa periodos entre 6 y 9 segundos y fases irracionalmente
separadas:

```text
δᵢ = 2π·frac(iφ)
rotación = 1.5°·sin(2πt/Tᵢ + δᵢ)
```

---

## Parámetros congelados

| Especie | Rango |
| --- | --- |
| Gerbera | `n` 26–32, `L` 42–50, `w` 5.2–6.4, `p` 22–30, `n₁` 0.62–0.78, `n₂` 2.1–2.7, disco 76–96, matiz 340–352 |
| Hortensia | `N` 118–148, `R` 33–40, `a` 4.9–5.7, matiz 254–268 |
| Tulipán | `L` 52–60, `w` 15.5–18.5, `α₁` 32–40, matiz 348–358 |
| Lirio | `L` 50–58, `w` 9–11.5, `β` 0.46–0.58, `c` 0.30–0.42, matiz 304–320 |

La fase 3.1 alineó código y documentación en `c = 52` para eliminar el solape
excesivo de `c = 26`. Tras la validación visual con muchas flores, la fase 3.3
congela el laboratorio en `c = 44` y `κ = 0.82`. La app móvil 5.1 conserva esos
valores aprobados; el encuadre se adapta mediante el `viewBox`, sin alterar la semilla, la
especie ni la estabilidad de cada mes.

---

## Rendimiento y compatibilidad

El nivel de detalle por plano mantiene 30 %, 60 % y 100 % de geometría. La
hortensia es la especie más costosa. La geometría solo se regenera mientras una
flor se abre y como máximo cada 40 ms; una vez abierta, solo cambia su
`transform` de respiración.

La espera total del despertar permanece acotada. El desfase entre piezas se
comprime cuando crece la cantidad de meses, en vez de alargar indefinidamente la
animación.

Se evita `feGaussianBlur` en el destello mensual. El efecto utiliza geometría
SVG ligera para mejorar la compatibilidad con Safari en iPhone.

La PWA respeta `prefers-reduced-motion`, usa safe areas y limita la regeneración
geométrica al periodo de apertura. Sigue pendiente la validación física en un
iPhone real con meses altos.

---

## Verificaciones automatizadas

Ejecutar desde la carpeta del proyecto:

```bash
npm test
python3 build.py
cd pwa && npm run lint && npm test
```

La suite comprueba:

- ángulo áureo de 137.507764°;
- separación compacta predeterminada `c = 44`;
- estabilidad de posición y especie entre los meses 6 y 120;
- una especie de cada tipo en 30 ciclos consecutivos;
- ausencia de `NaN` en las cuatro especies para `τ = 0.02, 0.5, 1`;
- coincidencia de la punta del tallo con la coordenada final;
- orden cronológico del despertar;
- animación exclusiva de la pieza mensual;
- elevación, destello y escala final exacta de la presentación.
- proporción entre copa, tallos y punto de amarre;
- capas completas de envoltura y lazo;
- despliegue del papel durante el despertar y pulso mensual del lazo;
- 14 y 15 de abril de 2026, 14 y 15 de mayo, septiembre y cambio de año;
- avance idempotente y recuperación de meses omitidos bajo bloqueo;
- rechazo de una zona horaria incorrecta y de meses inventados por el cliente;
- `POST` en `text/plain` y persistencia local del último estado oficial.
- manifiesto instalable con iconos 192, 512 y maskable;
- exclusión de `/api/` en el service worker;
- ausencia de la URL de Apps Script en el cliente visible;
- puente de servidor con `cache: no-store`;
- densidad compacta y determinismo del ramo de la PWA.

El compilador verifica además que el archivo autónomo no conserve imports y que
contenga los módulos de flores, follaje, envoltura, movimiento y cliente API.

---

## Errores encontrados y corregidos

1. **El compilador absorbía dos imports con una sola expresión regular.** Se
   sustituyó el patrón amplio por uno que no cruza la llave final y se añadieron
   aserciones.
2. **Dos módulos declaraban una auxiliar con el mismo nombre.** No chocaban como
   módulos ES, pero sí al incrustarlos; se renombró una función.
3. **La separación real seguía en `c = 26`.** La documentación decía `52`, pero
   `rebuildBouquet()` forzaba `26`; esto ocultaba flores. Se corrigió el
   generador, el laboratorio y el follaje.
4. **La corola quedaba quieta en la posición final.** El tallo crecía debajo de
   ella y el despertar parecía no agregar nada. Ahora la cabeza evalúa la misma
   Bézier y acompaña su punta.
5. **La flor mensual podía nacer detrás de otra.** Su plano aleatorio estable era
   correcto, pero la presentación podía pasar desapercibida. Ahora sube
   temporalmente al frente y después recupera su plano.
6. **Faltaba un acento visual de llegada.** Se añadió un destello con dos anillos
   y cuatro rayos sincronizados con la inserción.
7. **El bucle podía seguir activo sin animación ni respiración.** Ahora se detiene
   cuando no tiene trabajo.
8. **`st` quedaba fuera de alcance al construir la escena.** Este error de la
   revisión 3.1 detenía por completo los dos botones. Se reemplazó por una curva
   `stemGeom` creada dentro del ciclo correcto y se añadió una aserción al
   compilador para impedir la misma regresión.
9. **Era fácil abrir el HTML modular con doble clic.** Los módulos se bloqueaban
   bajo `file://` y la interfaz parecía inerte. Ahora las tres entradas visibles
   son autónomas y `ABRIR.html` indica claramente cuál abrir.
10. **El compilador interpretó `\d` como escape al incrustar el cliente API.**
    El reemplazo de módulos ahora usa una función, por lo que conserva
    literalmente expresiones regulares y caracteres de escape. Se compilaron y
    validaron las tres entradas autónomas después del cambio.
11. **El sitio podía depender del CORS de Apps Script.** La PWA consulta una ruta
    propia `/api/state`, que reenvía el `POST` en el servidor y mantiene el
    deployment fuera del cliente.
12. **Un service worker podría congelar una respuesta antigua de la API.** La
    ruta `/api/` se excluye por completo del manejador de caché. El modo sin red
    utiliza únicamente el último estado oficial ya validado en `localStorage`.
13. **El icono maskable tenía esquinas transparentes.** Los PNG finales se
    aplanaron sobre `#080609`, conservando el contenido dentro de la zona segura.

---

## Inventario del ZIP

```text
abs3/
├── ABRIR.html               entrada autónoma recomendada
├── lab-standalone.html      laboratorio completo para abrir con doble clic
├── lab.html                 alias autónomo
├── lab-modular.html         fuente modular para desarrollo
├── build.py                 genera las tres entradas autónomas
├── build_apps_script.py     compila la interfaz final para Apps Script
├── package.json             comandos de prueba y compilación
├── assets/                  fuente e iconos florales sin texto
├── apps-script/
│   ├── Code.gs              app, API, fecha y siembra idempotente
│   ├── Assets.gs            manifiesto e iconos incrustados
│   ├── Index.html           aplicación final compilada
│   ├── Index.template.html  fuente minimalista editable
│   ├── appsscript.json      zona horaria, V8 y configuración de web app
│   └── README.md            despliegue con clasp e instalación
├── src/api/
│   └── official-state.js    cliente validado, POST simple y estado local
├── src/garden/
│   ├── flowers.js           PRNG, especies, posiciones y geometría
│   ├── foliage.js           tallos, hojas, brotes, ramitas y destellos
│   ├── wrapping.js          envoltura orgánica, lazo y geometría proporcional
│   ├── motion.js            horarios, despertar, presentación y respiración
│   └── bouquet-scene.js     escena móvil e interacción por flor
├── tests/verify.mjs         geometría, composición y movimiento
├── tests/api-client.test.mjs validación del cliente de fecha oficial
├── tests/apps-script.test.mjs calendario, bloqueo e idempotencia
├── tests/apps-script-ui.test.mjs interfaz sin portada y manifiesto
├── tests/render-preview.mjs genera una previsualización reproducible
├── PREVIEW-APPS-SCRIPT.png  control visual vertical con seis flores
├── PREVIEW-COMPACTO.png     control visual con 40 flores
├── LEEME.md                 despliegue e instalación de la app final
└── BITACORA.md              este documento
```

---

## Pendientes

### Fase 4 activada

- proyecto creado mediante `clasp 3.3.0`;
- `Code.gs` y `appsscript.json` subidos correctamente;
- versión y deployment `@2` creados;
- URL `/exec` incorporada en `ABRIR.html` para sincronización automática.

Solo falta la comprobación visual del usuario abriendo el nuevo `ABRIR.html` en
su equipo y confirmando que el panel muestre **Conectado**.

### Fase 5.1 — Apps Script minimalista terminada localmente

- interfaz final separada del laboratorio y sin texto normal;
- mockups usados como lenguaje de interacción, no como copia gráfica;
- ramo 3.3, splash, capullo, vigilia y panel matemático;
- `Index.html`, manifiesto e iconos compilados dentro de Apps Script;
- sincronización silenciosa mediante `google.script.run`;
- pruebas automáticas aprobadas;
- pendiente que el usuario ejecute `clasp push --force` y actualice el mismo
  deployment `@2` para verla en su teléfono.

### Fase 6 — Push

Web Push directo desde Apps Script no es viable porque requiere VAPID con ECDSA
P-256 y cifrado ECDH. El camino previsto es FCM HTTP v1 con JWT RS256 de una
cuenta de servicio. En iOS se requiere 16.4 o superior, la PWA instalada en la
pantalla de inicio y el permiso solicitado desde un gesto real. El push será
informativo; nunca condicionará el crecimiento.

### Fase 7 — Pulido

- vigilia de 30 segundos;
- respeto a `prefers-reduced-motion`;
- pruebas de rendimiento con meses altos;
- revisión visual en iPhone real;
- ajuste fino de ritmo, elevación y brillo si la prueba física lo requiere.
