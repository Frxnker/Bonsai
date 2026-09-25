# 🔥 Racha

Tracker de hábitos minimalista para usar en el iPhone como una app normal (PWA). Está hecho con HTML, CSS y JavaScript, sin frameworks, sin servidor y sin login: los datos se quedan en tu móvil.

## Qué hace

- **Pantalla Hoy:** tocas un hábito y se marca como hecho, con una barra de progreso («2 de 3 hechos»). Cada hábito muestra su racha, por ejemplo «🔥 5 días». Si hoy aún no lo has hecho, añade «· hazlo hoy», porque la racha sigue viva hasta que acaba el día.
- **Botón +** para crear hábitos. **Editar** activa el modo edición: al tocar un hábito puedes cambiar su nombre y su emoji, o borrarlo. Para borrar hay que tocar dos veces, así no lo borras sin querer.
- **Flechas ‹ ›** para ir a días anteriores, por si se te olvidó marcar algo ayer.
- **Pestaña Historial:** un mapa de calor de 12 meses con todos los hábitos y otro por cada hábito, con racha actual, mejor racha y días hechos. Si tocas un cuadrito, te dice qué pasó ese día.
- Los datos se guardan en el móvil (localStorage), la app funciona sin conexión y el modo claro/oscuro va solo.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Estructura de la app y etiquetas para el iPhone |
| `styles.css` | Diseño, modo claro/oscuro y zonas seguras del iPhone |
| `app.js` | Toda la lógica: hábitos, rachas, historial |
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

## ⚠️ Tres cosas importantes

- **Los datos del icono y los de Safari están separados.** Lo que marques en la pestaña de Safari no aparece en la app instalada, así que usa siempre el icono.
- **Si borras el icono de la pantalla de inicio, se borran tus datos.** No hay copia de seguridad porque no hay servidor.
- **Si cambias algo y vuelves a subir los archivos,** la primera vez que abras la app verás la versión anterior. Ciérrala del todo (desliza hacia arriba en el selector de apps), vuelve a abrirla y ya tendrás la nueva.
