# 🔥 Racha

Tracker de hábitos para usar en el móvil (iPhone o Android) como una app normal (PWA). Está hecho con HTML, CSS y JavaScript, sin frameworks, sin servidor y sin login: los datos se quedan en tu móvil y funciona sin conexión.

## Qué hace

- **Bienvenida:** la primera vez eliges con un toque los hábitos con los que empezar (beber agua, leer, dejar de fumar…), o creas uno a tu medida.
- **Pantalla Hoy:** tocas un hábito y se marca como hecho, con vibración y un «+10 XP» que sube. Cada hábito muestra su racha y su próxima meta, por ejemplo «🔥 5 días · próxima meta: 7».
- **Tarjeta principal:** el anillo muestra cuántos hábitos llevas hoy; a su lado, tu nivel, tu barra de XP y tus protectores 🛡️.
- **Tipos de hábito:** de sí/no, con cantidad («3/8 vasos») o para dejar algo («🚭 12 días sin fumar»).
- **Frecuencia:** cada día, algunos días de la semana o X veces por semana.
- **Pausar y archivar** hábitos sin perder la racha ni la XP.
- **Niveles, logros, retos semanales y protectores de racha.**
- **Diario:** cómo te ha ido el día (😞 😕 😐 🙂 😄) y una nota corta.
- **Resumen de la semana** cada lunes.
- **Recordatorios** en el calendario del móvil.
- **Flechas ‹ ›** para ir a días anteriores y corregir lo que se te olvidó. «Volver a hoy» te trae de vuelta.
- **Pestañas:** Hoy, Progreso (nivel, retos, protectores, logros), Historial (mapas de calor de 12 meses) y Ajustes (perfil, copia de seguridad, archivados).
- Funciona sin conexión y el modo claro/oscuro va solo.

## Crear un hábito

Toca **+**. Lo mínimo es escribir el nombre y pulsar **Guardar**: así tienes un hábito diario de sí/no. Si quieres, el formulario tiene más secciones:

- **Tipo** (solo al crearlo): «Quiero empezar a…» o «Quiero dejar de…».
- **Frecuencia:**
  - **Cada día.**
  - **Algunos días** (por ejemplo, L · X · V): los demás días son de descanso, no rompen la racha y en Hoy se ven atenuados con «Hoy descansa». Si aun así lo haces, cuenta como **día extra** (+10 XP).
  - **X veces por semana** (de 1 a 6): vale cualquier día. La racha se cuenta en **semanas cumplidas** («🔥 3 semanas · 2/3 esta semana») y la semana en curso no rompe nada hasta que termina.
- **Meta de cada día:** con meta 1 es un hábito de sí/no. Con meta 2 o más (por ejemplo, 8 vasos), cada toque suma 1 y **mantener pulsado resta 1**; la tarjeta se va rellenando con su color y solo cuenta como hecho al llegar a la meta. Puedes ponerle unidad («vasos», «páginas»…).
- **Color** (8 tonos zen), **emoji** y **recordatorio** (más abajo).

Si cambias la frecuencia o la meta, las rachas y la XP se recalculan con lo nuevo (también los días pasados).

### Hábitos para dejar algo

Cada día sin recaer cuenta como hecho automáticamente, con su XP. Si un día recaes, toca la tarjeta y confirma «Sí, he recaído»: la racha vuelve a empezar al día siguiente. Si te equivocas, toca otra vez para deshacerlo.

### Pausar y archivar (en Editar)

- **Pausar:** para vacaciones, viajes o lesiones. Puedes poner fecha de fin o dejarla indefinida. Los días en pausa no rompen la racha ni cuentan para el día perfecto; en Hoy el hábito va al final con «En pausa · reanudar» y en el Historial esos días salen en gris.
- **Archivar:** el hábito desaparece de Hoy y del Historial, pero conservas su XP e historial. Lo restauras (o lo borras) desde **Ajustes → Hábitos archivados**.
- **Eliminar:** se puede deshacer durante unos segundos y tu XP total no cambia.

## Cómo funcionan los niveles

| Qué haces | XP |
| --- | --- |
| ✅ Hábito hecho (o un día sin recaer) | +10 |
| 🔥 Bonus de racha: +1 por cada día (o semana) de racha | hasta +10 |
| 🌟 Día perfecto: todos los hábitos que tocaban ese día | +25 |
| 🏆 Reto semanal completado | +30 a +60 |
| ✨ Día extra (en un día de descanso) | +10 |
| 🛡️ Día salvado por un protector | 0 |

- Cada nivel pide 100 XP más que el anterior: el nivel 2 está en 100 XP, el 3 en 300, el 4 en 600…
- Hay 15 títulos: 🌱 Semilla, 🌿 Brote, 🪴 Planta, 🌳 Árbol, 🔥 Constante, ⚡ Enfocado, 💪 Disciplinado, 🧭 Explorador, 🏔️ Escalador, 🦅 Imparable, 🧠 Sabio, 🛡️ Guardián, 👑 Maestro, 🌟 Estrella y 🐉 Leyenda.
- Para el día perfecto solo cuentan los hábitos que tocaban ese día: no cuentan los que descansan, los que están en pausa ni los de «X veces por semana».
- Todo se calcula a partir de tu historial: si desmarcas un día, la XP se resta. Si **borras** un hábito, tu XP total se queda igual.

### Protectores de racha 🛡️

- Ganas 1 cada vez que un hábito llega a 7, 14, 21… días seguidos. Como mucho guardas 3.
- Si un día se te olvida un hábito diario (o de algunos días) con racha de 3 o más, al abrir la app se gasta un protector por cada día olvidado y tu racha sigue viva («🛡️ Protector usado: tu racha de 12 días sigue viva»). Solo se gastan si tienes suficientes para cubrir todo el hueco.
- Ese día no da XP ni cuenta como día perfecto. Si luego lo marcas a mano, el protector vuelve.
- Los hábitos de «X veces por semana» y los de dejar algo no usan protectores.

### Retos semanales 🏆

Cada lunes salen 3 retos nuevos elegidos según tus hábitos: «Consigue 3 días perfectos», «Completa ‹Leer› todos los días que toca», «Semana entera sin recaídas en ‹Fumar›», «No gastes ningún protector esta semana»… Dan de 30 a 60 XP según la dificultad. Los ves resumidos en Hoy y con barras de avance en Progreso.

### Logros

Hay 17: rachas de 3, 7, 14, 30, 100 y 365 días; 1, 10 y 50 días perfectos; 1, 50 y 250 hábitos marcados; llegar a los niveles 5 y 10; **Escudo** (usa tu primer protector), **Libre** (30 días sin recaer) y **Retador** (10 retos completados).

## Diario y resumen de la semana

- **¿Qué tal el día?:** debajo de tus hábitos, en Hoy, eliges tu ánimo (😞 😕 😐 🙂 😄) y, si quieres, añades una nota de hasta 200 caracteres. También funciona en días anteriores. En el Historial, al tocar un día del mapa «Todos los hábitos», ves su ánimo y su nota.
- **Resumen de la semana:** la primera vez que abres la app en una semana nueva, aparece cómo te fue la anterior: % de cumplimiento, días perfectos, XP ganada, tu mejor hábito, el que más te cuesta, la comparación con la semana previa, los retos y tu ánimo medio. Puedes volver a verlo en **Progreso → Resumen de la semana pasada**.

## Recordatorios

En el formulario del hábito, elige una hora y pulsa **«Añadir recordatorio al calendario»**. La app crea un evento que se repite según la frecuencia del hábito, con aviso a esa hora:

- **iPhone:** se abre el menú Compartir; elige **Calendario** si aparece. Si no, **Guardar en Archivos**, abre el archivo desde la app Archivos y pulsa **Añadir todo**.
- **Android:** se abre el menú Compartir (o se descarga el archivo `.ics`); ábrelo con **Google Calendar** u otra app de calendario.

Si cambias la frecuencia del hábito, tendrás que volver a añadir el recordatorio (y borrar el anterior del calendario).

## Ajustes

- **Tu perfil:** tu nombre y un avatar (de la lista o cualquier emoji). Aparecen en el saludo de Hoy.
- **Copia de seguridad:** exporta o importa todos tus datos (hábitos, historial, diario y perfil).
- **Hábitos archivados:** restáuralos o bórralos.
- **Zona beta → Restablecer progreso y logros:** vuelves al nivel 1 y se borra el historial de días, las recaídas y los protectores. Tus hábitos, tu perfil y tu diario se mantienen. Pide confirmación y se puede deshacer.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Estructura de la app y etiquetas para instalarla en el móvil |
| `styles.css` | Diseño zen, modo claro/oscuro y zonas seguras de la pantalla |
| `app.js` | Toda la lógica: hábitos, rachas, XP, retos, protectores, diario, historial, copias y recordatorios |
| `sw.js` | Service worker, para que funcione sin conexión |
| `manifest.json` | Nombre, colores e iconos de la app instalada |
| `icons/` | Iconos de la app |

## Paso 1 (opcional): verla en tu ordenador

Haz doble clic en `index.html` y se abrirá en tu navegador. Así funciona todo menos el modo sin conexión, que solo se activa una vez publicada en internet.

## Paso 2: subirla gratis a GitHub Pages

1. Entra en **github.com** y crea una cuenta gratuita, si aún no la tienes.
2. Arriba a la derecha, pulsa **+ → New repository**.
   - **Repository name:** `racha`
   - Déjalo en **Public**; es necesario para que Pages sea gratis.
   - Pulsa **Create repository**.
3. En la página del repositorio vacío, pulsa el enlace **«uploading an existing file»**.
4. Abre la carpeta `Racha` en el Explorador de Windows. Selecciona **todo su contenido** (los archivos y la carpeta `icons`) y arrástralo a la página de GitHub.
   - Importante: arrastra lo que hay **dentro** de la carpeta Racha, no la carpeta en sí. `index.html` tiene que quedar en la raíz del repositorio.
5. Abajo, pulsa el botón verde **Commit changes**.
6. Ve a **Settings** (la pestaña de arriba) y luego a **Pages** (en el menú de la izquierda).
   - En **Source**, elige **Deploy from a branch**.
   - En **Branch**, elige **main** y la carpeta **/ (root)**. Pulsa **Save**.
7. Espera 1–2 minutos y recarga esa página. Arriba aparecerá tu dirección, parecida a esta:
   **`https://TU-USUARIO.github.io/racha/`**

## Paso 3: instalarla en el móvil

### iPhone (Safari)

1. Abre esa dirección en **Safari**.
2. Toca el botón **Compartir** (el cuadrado con una flecha hacia arriba). En las versiones recientes de iOS puede estar dentro del menú **«⋯»**.
3. Baja y toca **«Añadir a pantalla de inicio»**. Si aparece la opción **«Abrir como app web»**, déjala activada.
4. Toca **Añadir**. Aparecerá el icono de Racha junto a tus otras apps.
5. Ábrela siempre **desde ese icono**. Se verá a pantalla completa, sin las barras de Safari.

### Android (Chrome)

1. Abre esa dirección en **Chrome**.
2. Toca el menú **⋮** (arriba a la derecha) y elige **«Instalar app»**. Si no aparece, elige **«Añadir a pantalla de inicio»** y después **Instalar**. A veces Chrome muestra directamente un aviso abajo para instalarla.
3. Aparecerá el icono de Racha en tu pantalla de inicio (y en el cajón de apps).
4. Ábrela desde ese icono: se verá a pantalla completa, como una app más.

## Actualizar la app ya publicada

Si cambias algún archivo y ya tenías la app en GitHub:

1. Entra en tu repositorio en github.com y pulsa **Add file → Upload files**.
2. Arrastra los archivos que hayan cambiado. Los que tengan el mismo nombre se sustituyen.
3. Pulsa **Commit changes** y espera 1–2 minutos.
4. En el móvil, abre la app, ciérrala del todo (desde el selector de apps) y vuelve a abrirla. La primera vez aún verás la versión anterior; la siguiente, ya la nueva.

Tus hábitos, tu XP, tu nivel, tu diario y tu perfil no se pierden al actualizar.

## Copia de seguridad

En **Ajustes → Copia de seguridad**:

- **Exportar copia** abre el menú Compartir. En el iPhone, elige **«Guardar en Archivos»** (por ejemplo, en iCloud Drive). En Android, guárdala en **Drive** o en tus archivos (si no se abre el menú, se descarga en la carpeta Descargas).
- **Importar copia** te deja elegir ese archivo para recuperar todos tus datos, por ejemplo en un móvil nuevo. Las copias de versiones anteriores de Racha también se pueden importar.

## ⚠️ Tres cosas importantes

- **Dónde se guardan tus datos:**
  - **iPhone:** los datos de la app instalada y los de la pestaña de Safari están separados. Lo que marques en Safari no aparece en el icono, así que usa siempre el icono.
  - **Android:** la app instalada comparte los datos con Chrome para esa dirección. Si borras los datos de navegación (o los del sitio) en Chrome, se borran también tus hábitos.
- **Borrar la app puede borrar tus datos.** En el iPhone, borrar el icono de la pantalla de inicio los borra siempre. En Android, desinstalarla o borrar los datos de Chrome también puede hacerlo. Haz una copia de seguridad de vez en cuando para poder recuperarlos.
- **La vibración al marcar** funciona en la mayoría de móviles Android con Chrome (si la vibración está activada en el sistema) y en iPhone con iOS 18 o posterior. En otros casos la app funciona igual, pero sin vibrar.
