# 🔥 Racha

Tracker de hábitos minimalista para usar en el iPhone como una app normal (PWA). Está hecho con HTML, CSS y JavaScript, sin frameworks, sin servidor y sin login: los datos se quedan en tu móvil.

## Qué hace

- **Bienvenida:** la primera vez eliges con un toque los hábitos con los que empezar (beber agua, leer, meditar…), o creas uno a tu medida.
- **Pantalla Hoy:** tocas un hábito y se marca como hecho, con vibración y un «+10 XP» que sube. Cada hábito muestra su racha y su próxima meta, por ejemplo «🔥 5 días · próxima meta: 7». Si hoy aún no lo has hecho, verás «¡no la pierdas!».
- **Niveles y logros:** ganas XP, subes de nivel (con celebración y confeti) y desbloqueas logros. Más abajo tienes cómo funciona.
- **Botón +** para crear hábitos, con «ideas rápidas» para rellenarlos de un toque.
- **Editar:** toca un hábito para cambiar su nombre o emoji, o arrástralo desde ☰ para cambiar el orden. Si borras uno, puedes **deshacerlo** durante unos segundos.
- **Flechas ‹ ›** para ir a días anteriores, por si se te olvidó marcar algo. El botón «Volver a hoy» te trae de vuelta.
- **Pestaña Progreso:** tu nivel, cómo ganar XP, el camino de niveles y los logros.
- **Pestaña Historial:** un mapa de calor de 12 meses con todos los hábitos y otro por cada hábito. Si tocas un cuadrito, te dice qué pasó ese día, y con «Ver día» puedes ir a él para corregirlo.
- **Pestaña Ajustes:** tu perfil (nombre y avatar), la copia de seguridad y la opción de restablecer tu progreso.
- Funciona sin conexión y el modo claro/oscuro va solo.

## Ajustes

- **Tu perfil:** escribe tu nombre y elige un avatar de la lista, o toca el avatar grande y escribe cualquier emoji. Se guarda al momento y aparece en el saludo de la pantalla Hoy («🦊 Buenos días, Fran»).
- **Copia de seguridad:** exporta o importa todos tus datos (más abajo tienes cómo).
- **Zona beta → Restablecer progreso y logros:** mientras la app está en fase beta, puedes volver a empezar desde cero.
  - Se borra: tu XP, tu nivel (vuelves al 1), los logros, el historial de días y las rachas.
  - Se mantiene: tus hábitos y tu perfil.
  - Antes te pide confirmación, con la opción de exportar una copia. Después, durante unos segundos, puedes pulsar **Deshacer**.

## Cómo funcionan los niveles

| Qué haces | XP |
| --- | --- |
| ✅ Marcar un hábito como hecho | +10 |
| 🔥 Bonus de racha: +1 por cada día seguido | hasta +10 |
| 🌟 Día perfecto: todos tus hábitos del día hechos | +25 |

- Cada nivel pide 100 XP más que el anterior: el nivel 2 está en 100 XP, el 3 en 300, el 4 en 600…
- Hay 15 títulos: 🌱 Semilla, 🌿 Brote, 🪴 Planta, 🌳 Árbol, 🔥 Constante, ⚡ Enfocado, 💪 Disciplinado, 🧭 Explorador, 🏔️ Escalador, 🦅 Imparable, 🧠 Sabio, 🛡️ Guardián, 👑 Maestro, 🌟 Estrella y 🐉 Leyenda.
- Hay 14 logros: rachas de 3, 7, 14, 30, 100 y 365 días; días perfectos; total de hábitos marcados; y llegar a los niveles 5 y 10.
- Si desmarcas un hábito, la XP se resta. Si **borras** un hábito, conservas la XP que ganaste con él.
- Si añades un hábito nuevo a mitad del día, ese día deja de ser «perfecto» hasta que también lo completes.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Estructura de la app y etiquetas para el iPhone |
| `styles.css` | Diseño, modo claro/oscuro y zonas seguras del iPhone |
| `app.js` | Toda la lógica: hábitos, rachas, XP, niveles, logros, historial, perfil y copias |
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

## Paso 3: instalarla en tu iPhone

1. Abre esa dirección en **Safari**.
2. Toca el botón **Compartir** (el cuadrado con una flecha hacia arriba). En las versiones recientes de iOS puede estar dentro del menú **«⋯»**.
3. Baja y toca **«Añadir a pantalla de inicio»**. Si aparece la opción **«Abrir como app web»**, déjala activada.
4. Toca **Añadir**. Aparecerá el icono verde de Racha junto a tus otras apps.
5. Ábrela siempre **desde ese icono**. Se verá a pantalla completa, sin las barras de Safari.

## Actualizar la app ya publicada

Si cambias algún archivo y ya tenías la app en GitHub:

1. Entra en tu repositorio en github.com y pulsa **Add file → Upload files**.
2. Arrastra los archivos que hayan cambiado. Los que tengan el mismo nombre se sustituyen.
3. Pulsa **Commit changes** y espera 1–2 minutos.
4. En el iPhone, abre la app, ciérrala del todo (desliza hacia arriba en el selector de apps) y vuelve a abrirla. La primera vez aún verás la versión anterior; la siguiente, ya la nueva.

Tus hábitos, tu XP, tu nivel y tu perfil no se pierden al actualizar.

## Copia de seguridad

En **Ajustes → Copia de seguridad**:

- **Exportar copia** abre el menú Compartir del iPhone. Elige **«Guardar en Archivos»** (por ejemplo, en iCloud Drive).
- **Importar copia** te deja elegir ese archivo para recuperar todos tus datos, por ejemplo en un iPhone nuevo.

## ⚠️ Tres cosas importantes

- **Los datos del icono y los de Safari están separados.** Lo que marques en la pestaña de Safari no aparece en la app instalada, así que usa siempre el icono.
- **Si borras el icono de la pantalla de inicio, se borran tus datos.** Haz una copia de seguridad de vez en cuando para poder recuperarlos.
- **La vibración al marcar** solo funciona en iPhone con iOS 18 o posterior. En versiones anteriores, la app funciona igual, pero sin vibrar.
