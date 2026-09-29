# Bonsái

Tracker de hábitos para el móvil (iPhone o Android) que se instala como una app (PWA). Hecho con HTML, CSS y JavaScript, sin frameworks, sin servidor y sin cuenta: **tus datos se quedan en tu móvil** y **funciona sin conexión**.

Versión actual: **0.8 beta**. Antes se llamaba Racha: los datos y las copias de entonces siguen valiendo.

La ayuda completa (cómo se usa, preguntas frecuentes y novedades) está dentro de la app, en **Ajustes → Ayuda**.

## Qué hace

- **Hábitos:** 100 tipos listos para usar, por grupos y con buscador (desde lo básico, como hacer las comidas o lavarse los dientes, hasta deporte, casa, trabajo o dejar algo), uno personalizado y **packs para empezar** («Dormir mejor», «Mañana tranquila»…) que crean varios hábitos y su rutina de una vez.
- **Cómo se marcan:** sí o no (una o varias veces al día), tiempo o distancia («30 min»), contador («3/8 vasos»), dejar algo («12 días sin fumar») o **con límite** («1 de 2 cafés»).
- **Hábitos con límite:** los de dejar algo pueden tener un máximo al día («como mucho 2 cafés», «1 h de redes»). Se elige al crearlos o editarlos, en «Cómo lo mides». Apuntas lo que llevas, una barra avisa (también con texto) al llegar al máximo y el día solo cuenta como recaída si te pasas; si te equivocas, corriges la cantidad y vuelve a contar. Las rachas y la XP son las de dejar algo.
- **Frecuencia:** cada día, algunos días de la semana o de 1 a 7 veces por semana. Se pueden pausar (sin romper la racha), todos a la vez con el **modo vacaciones**, o archivar.
- **Temporizador** en los hábitos de minutos (también en los de límite en minutos): sigue contando aunque cierres la app y, al parar, suma los minutos.
- **Notas y ficha:** una nota corta en cada hábito y día, y una ficha por hábito (tócalo en el Historial) con su cumplimiento de 30 y 90 días, mejor día, cantidades (con la línea de la meta o del máximo), rachas anteriores y notas.
- **Progreso:** XP, niveles, rachas, protectores de racha, 3 retos cada semana y logros, con un **bonsái que crece** con tu nivel. Todo se calcula a partir de tu historial, así que siempre cuadra. Las rachas y los logros se pueden compartir como imagen (sin datos de Salud ni del diario).
- **Diario:** ánimo y nota de cada día, un resumen cada lunes, una revisión semanal y tendencias que solo describen lo que has registrado.
- **Rutinas** («Mañana», «Noche»…) para ver tus hábitos agrupados.
- **Salud:** tus medidas (peso, tensión, sueño, pasos, glucosa, oxígeno en sangre, estado de ánimo, energía, dolor… y hasta 5 **medidas personalizadas** con tu nombre, unidad, decimales y gráfica), con fecha, hora opcional, gráficas y estadísticas. Es privado y va aparte: no da XP ni cuenta para rachas, retos o logros, y la app no interpreta tus medidas ni da consejos médicos.
  - **Resumen** de cada medida: media, mínimo, máximo, registros y cambio de los últimos 7, 30 y 90 días, en tu unidad.
  - **Objetivo** opcional en cada medida (subir o bajar hasta un valor, o un rango): una línea en la gráfica y cuánto te falta, sin juicios.
  - **Relación con tus hábitos:** la medida los días que hiciste cada hábito frente a los que no (una coincidencia en tus datos, no una causa).
  - **Informe para el médico:** las medidas y el periodo que elijas, para imprimir o guardar en PDF. Solo Salud.
- **Zen**, sin XP ni rachas:
  - **«Necesito calma»**: un toque (en Hoy o en Zen) y un minuto de respiración lenta; si aún no estás mejor, el 5-4-3-2-1.
  - Respiración guiada (caja, 4-7-8, tranquila y suspiro fisiológico), meditación con campana, el 5-4-3-2-1, **escaneo corporal** y **relajación muscular progresiva**, guiados paso a paso.
  - **Mezclador de sonidos** (lluvia, olas, viento, fuego y ruidos), varios a la vez con su volumen, y **modo dormir**: respiración 4-7-8 y tus sonidos, que se apagan poco a poco, con la pantalla casi a oscuras. Los sonidos se generan en el móvil, sin archivos de audio.
  - Gratitud, emociones (con su resumen **por semana y por mes**), **vaciar la cabeza** (lo que escribes no se guarda) e **intención del día**, que se ve en Hoy y, por la noche, marcas cómo fue.
  - Si quieres, al terminar una práctica se marca el hábito que elijas.
- **Recordatorios** que se añaden al calendario del móvil y, en Android, **accesos directos** en el icono (Zen, Registrar salud, Nuevo hábito).
- Mapas de calor de 12 meses, modo claro u oscuro, tamaño del texto ajustable y uso con teclado o lector de pantalla.

## Tus datos

- Todo se guarda en el propio dispositivo (`localStorage`, clave `racha:v1`). No hay servidor, cuenta ni seguimiento.
- **No hay sincronización:** cada dispositivo tiene sus datos. Para pasarlos a otro, exporta una copia e impórtala allí. El diseño pendiente de una sincronización real está en [`docs/sincronizacion.md`](docs/sincronizacion.md).
- **Copia de seguridad**, en **Ajustes → Copia de seguridad**:
  - **Exportar copia** guarda un archivo con tus hábitos (con sus notas), tu historial, el diario, las rutinas, Zen (prácticas, gratitud, emociones, intenciones del día y tu mezcla de sonidos; lo de «vaciar la cabeza» nunca se guarda), el modo vacaciones, el temporizador en marcha, tus ajustes y, si quieres, Salud (registros, objetivos y medidas personalizadas). En el iPhone, elige «Guardar en Archivos»; en Android, guárdala en Drive o en tus archivos. Lleva datos personales: guárdala en un sitio privado.
  - **Importar copia** comprueba el archivo, te enseña qué trae y qué va a reemplazar, y guarda antes tus datos actuales para que puedas deshacerlo.
  - La app puede recordarte que hagas una copia cada cierto tiempo.
- **Historial de hábitos en CSV**, también en Copia de seguridad: para abrirlo en una hoja de cálculo (no se puede importar y no lleva Salud ni el diario). En los de límite lleva la cantidad de cada día y marca como recaída los días en que te pasaste.
- **Salud en CSV** (en Salud, «Exportar a CSV»): todos tus registros de Salud, tal como se apuntaron.
- **Salud de Apple y Health Connect:** el iPhone y Android solo dejan leerlos a las apps nativas, así que Bonsái no puede importar pasos, sueño ni peso automáticamente. Se apuntan a mano.

## Tres cosas importantes

- **iPhone:** la app instalada y Safari guardan datos por separado. Usa siempre el icono de la pantalla de inicio.
- **Borrar la app puede borrar tus datos.** En el iPhone, borrar el icono los borra siempre; en Android, puede pasar al desinstalarla o al borrar los datos de Chrome. Haz una copia de vez en cuando.
- **La vibración al marcar** funciona en la mayoría de Android con Chrome y en iPhone con iOS 18 o posterior. Si no, la app funciona igual, sin vibrar.

## Publicarla e instalarla

**Verla en el ordenador:** abre `index.html` con doble clic. Funciona todo menos el modo sin conexión, que solo se activa una vez publicada.

**Publicarla gratis en GitHub Pages:**

1. En github.com, crea un repositorio **público** llamado `racha` (el nombre antiguo, para que la dirección de la app no cambie).
2. Pulsa **«uploading an existing file»** y arrastra **el contenido** de la carpeta del proyecto (no la carpeta en sí: `index.html` tiene que quedar en la raíz). Pulsa **Commit changes**.
3. En **Settings → Pages**, elige **Deploy from a branch**, rama **main** y carpeta **/ (root)**, y pulsa **Save**.
4. En 1–2 minutos tendrás la dirección: `https://TU-USUARIO.github.io/racha/`

**Instalarla en el móvil:**

- **iPhone (Safari):** abre la dirección, toca **Compartir** (puede estar dentro de «⋯») y luego **«Añadir a pantalla de inicio»**. Ábrela siempre desde ese icono.
- **Android (Chrome):** abre la dirección, toca **⋮** y elige **«Instalar app»** (o «Añadir a pantalla de inicio»).

**Actualizarla:** en el repositorio, **Add file → Upload files**, arrastra los archivos que han cambiado y pulsa **Commit changes**. En el móvil, la primera vez que abras la app aún verás la versión anterior; la siguiente, ya la nueva. Tus datos no se pierden al actualizar.

## Para desarrollar

```text
index.html             # Punto de entrada
manifest.json          # Configuración de la PWA
sw.js                  # Caché sin conexión (cambia CACHE en cada versión)
assets/css/styles.css  # Estilos y temas
assets/js/app.js       # Toda la lógica
assets/icons/          # Iconos (también los de los accesos directos)
docs/                  # Diseño pendiente de la sincronización
tests/                 # Pruebas (no hace falta publicarlas)
```

Pruebas, con [Node.js](https://nodejs.org) 20 o posterior y sin instalar nada:

```text
node --test "tests/*.test.mjs"
```

Cargan `assets/js/app.js` tal cual, con una fecha fija, y comprueban las reglas de XP y rachas, la compatibilidad con copias antiguas, los hábitos (también los de límite), las notas, la ficha, el temporizador, el modo vacaciones, los packs, el bonsái, las exportaciones, Salud (con su resumen, los objetivos, la relación con los hábitos, el informe y las medidas nuevas: `tests/health-*.test.mjs`), Zen, las rutinas, los ajustes y las copias de seguridad, y cada parte de Zen (`tests/zen-*.test.mjs`). `tests/rules-fixture.mjs` genera datos variados y una «huella» de todas las cuentas de XP, rachas, protectores, retos y logros (sin Zen ni Salud, que no cuentan para ellas): `tests/limit.test.mjs` comprueba que sale la misma que con versiones anteriores.

## Derechos de autor

© 2026 Frxnker. Todos los derechos reservados.

Bonsái (su código, su diseño, sus textos y sus iconos) es una obra original de Frxnker. Puedes usar e instalar la app publicada, pero no es software libre: no se permite copiarla, modificarla, redistribuirla ni publicarla en otro sitio, total o parcialmente, sin permiso previo por escrito de Frxnker.
