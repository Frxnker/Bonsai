# Bonsái

Tracker de hábitos para usar en el móvil (iPhone o Android) como una app normal (PWA). Está hecho con HTML, CSS y JavaScript, sin frameworks, sin servidor y sin login: **tus datos se quedan en tu móvil**, no hace falta cuenta y **funciona sin conexión**.

Versión actual: **1.0 beta**.

> **Antes se llamaba Racha; tus datos se conservan.** Al actualizar no se pierde nada: tus hábitos, tu nivel y tu diario siguen ahí, y las copias de seguridad de Racha se pueden importar igual que las nuevas.

## Índice

1. [Resumen rápido](#resumen-rápido)
2. [Primera vez: la bienvenida](#primera-vez-la-bienvenida)
3. [Pantalla Hoy](#pantalla-hoy)
4. [Crear y editar hábitos](#crear-y-editar-hábitos)
5. [Tipos de hábito](#tipos-de-hábito)
6. [Frecuencia](#frecuencia)
7. [Pausar, archivar y eliminar](#pausar-archivar-y-eliminar)
8. [XP y niveles](#xp-y-niveles)
9. [Protectores de racha](#protectores-de-racha-)
10. [Retos semanales](#retos-semanales-)
11. [Logros](#logros)
12. [Diario: ánimo y nota del día](#diario-ánimo-y-nota-del-día)
13. [Resumen de la semana](#resumen-de-la-semana)
14. [Recordatorios en el calendario](#recordatorios-en-el-calendario)
15. [Pantalla Progreso](#pantalla-progreso)
16. [Pantalla Historial](#pantalla-historial)
17. [Pantalla Ajustes](#pantalla-ajustes)
18. [Diseño, accesibilidad y detalles](#diseño-accesibilidad-y-detalles)
19. [Tus datos](#tus-datos)
20. [Archivos del proyecto](#archivos-del-proyecto)
21. [Publicarla e instalarla](#paso-1-opcional-verla-en-tu-ordenador)
22. [Tres cosas importantes](#️-tres-cosas-importantes)

---

## Resumen rápido

- Tocas un hábito cuando lo haces y ganas **XP**; subes de **nivel** y consigues **logros**.
- Cada hábito lleva su **racha** (días seguidos, o semanas en los semanales).
- Hay tres tipos de hábito: de **sí/no**, con **cantidad** («3/8 vasos») y para **dejar algo** («🚭 12 días sin fumar»).
- Eliges la **frecuencia**: cada día, algunos días de la semana o X veces por semana.
- Puedes **pausar** un hábito (vacaciones, lesión…) sin romper la racha, o **archivarlo**.
- Los **protectores 🛡️** salvan tu racha si un día se te olvida.
- Cada semana hay **3 retos** que dan XP extra.
- Un **diario** para apuntar cómo te ha ido el día, y un **resumen** de la semana cada lunes.
- **Recordatorios** que se añaden al calendario del móvil.
- **Mapas de calor** de 12 meses, **copia de seguridad**, modo claro/oscuro automático y diseño zen.

## Primera vez: la bienvenida

Si aún no tienes hábitos, Hoy muestra una bienvenida con los 3 pasos de la app y 8 hábitos sugeridos para elegir con un toque (puedes marcar varios). El botón **«Empezar con N hábitos»** se queda fijo abajo para que siempre lo veas. También puedes pulsar **«o crea uno a tu medida»**.

**Plantillas disponibles** (las 8 primeras salen en la bienvenida; todas aparecen como «Ideas rápidas» al crear un hábito):

| Plantilla | Tipo | Detalle |
| --- | --- | --- |
| 💧 Beber agua | Cantidad | Meta: 8 vasos |
| 🚶 Caminar 30 min | Sí/no | Cada día |
| 📚 Leer | Cantidad | Meta: 10 páginas |
| 🧘 Meditar | Sí/no | Cada día |
| 😴 Dormir 8 horas | Sí/no | Cada día |
| 💪 Hacer ejercicio | Sí/no | 3 veces por semana |
| 🍎 Comer fruta | Sí/no | Cada día |
| 📵 Menos redes | Dejar algo | — |
| ✍️ Escribir diario | Sí/no | Cada día |
| 🦷 Hilo dental | Sí/no | Cada día |
| 🚭 Dejar de fumar | Dejar algo | — |
| 🍬 Sin azúcar | Dejar algo | — |

## Pantalla Hoy

**Arriba**
- **Saludo** con tu avatar y tu nombre: «Buenos días» (de 6 a 13 h), «Buenas tardes» (de 13 a 21 h) o «Buenas noches». Tocar el avatar te lleva a Ajustes.
- **Editar** activa el modo edición y **+** crea un hábito nuevo.
- **Título del día:** «Hoy», «Ayer» o el día de la semana, con la fecha debajo.
- **Flechas ‹ ›** para ir a días anteriores y marcar lo que se te olvidó; no se puede ir al futuro. El botón **«Volver a hoy»** (o tocar otra vez la pestaña Hoy) te devuelve al día de hoy.

**Tarjeta principal** (tócala para ir a Progreso)
- **Anillo del día:** cuántos de los hábitos que tocan llevas («2/3»). Pone «¡hecho!» al completarlos todos y «🌿 descanso» si ese día no toca ninguno.
- **Tu nivel:** emoji, número y título, la XP dentro del nivel («371/700 XP»), la barra de XP y cuánto falta para el siguiente.
- **Protectores 🛡️** disponibles (de 0 a 3).

**Retos de la semana**: una tira con cuántos llevas («1/3») y una barrita por reto. Tócala para ver el detalle en Progreso.

**Pistas**: la primera vez verás «👆 Toca un hábito cuando lo completes», y en modo edición una ayuda para editar y reordenar.

**Lista de hábitos**
- La cabecera dice cuántos llevas («2 de 3 hechos»), «¡Todo hecho! 🎉» o «Día de descanso 🌿».
- **Orden:** primero los que tocan, luego los que descansan ese día (atenuados) y al final los que están en pausa.
- Debajo del nombre verás la racha y lo siguiente que conviene saber:
  - «🔥 5 días · ¡no la pierdas!» si hoy aún no lo has hecho.
  - «🔥 6 días · próxima meta: 7» cuando ya lo has hecho. Las metas son 3, 7, 14, 30, 60, 100, 180 y 365 días.
  - «Empieza tu racha hoy» si aún no tienes racha.
  - Semanales: «🔥 2 semanas · 2/3 esta semana» (con ✓ al cumplir la semana).
  - Cantidad: «3/8 vasos · 🔥 5 días».
  - Dejar algo: «🚭 12 días sin fumar».
  - Descanso: «Hoy descansa · 🔥 5 días» o «✨ Día extra» si lo haces igualmente.
  - Pausa: «En pausa hasta el 3 oct · reanudar».
  - Día salvado por un protector (al mirar días anteriores): «🛡️ Protegido · tu racha siguió viva».
- **Tocar una tarjeta:** marca o desmarca, suma 1 en los de cantidad, apunta una recaída en los de dejar algo, u ofrece reanudar si está en pausa.
- **Modo edición:** toca un hábito para editarlo, o arrástralo desde ☰ para cambiar el orden.

**Al marcar** notarás:
- una vibración suave;
- un «+15 XP» (o «+1» en los pasos de cantidad) que sube desde la tarjeta;
- una pequeña animación;
- cuando toca, una celebración: al completar todos los hábitos del día («🌟 ¡Día perfecto! +25 XP extra»), al desbloquear un logro o al subir de nivel (ventana con tu nuevo título, los logros conseguidos y pétalos que caen).

**Diario del día**: debajo de la lista (ver [Diario](#diario-ánimo-y-nota-del-día)).

## Crear y editar hábitos

Toca **+**. Lo mínimo es escribir el nombre y pulsar **Guardar**: así tienes un hábito diario de sí/no. El formulario está organizado por secciones:

- **Emoji:** toca el grande para escribir cualquier emoji o elige uno de los 24 sugeridos. Si eliges «Quiero dejar de…» sin haber tocado el emoji, se pone 🚭.
- **Tipo** (solo al crearlo): «🌱 Quiero empezar a…» o «🚭 Quiero dejar de…».
- **Nombre:** hasta 40 caracteres.
- **Ideas rápidas** (solo al crear): las plantillas que aún no usas. Rellenan nombre, emoji, tipo, meta y frecuencia de un toque.
- **Frecuencia:** cada día, algunos días o X veces por semana (ver [Frecuencia](#frecuencia)).
- **Meta de cada día:** de 1 a 99, con botones − y + o escribiendo el número, y una **unidad** opcional (hasta 20 caracteres: vasos, páginas, minutos…).
- **Color:** 8 tonos zen (Salvia, Jade, Niebla, Glicina, Sakura, Arcilla, Ocre y Piedra). Se usa en la tarjeta, la casilla y el mapa de calor del hábito. Por defecto se propone uno que no uses aún.
- **Recordatorio:** una hora y el botón para añadirlo al calendario (ver [Recordatorios](#recordatorios-en-el-calendario)).
- **Solo al editar:** Pausa, Archivar y Eliminar.

**Guardar** se desactiva si falta el nombre o si eliges «Algunos días» sin marcar ninguno. Al editar, si cambias la frecuencia o la meta, un aviso te recuerda que la racha y la XP se recalcularán (también la de los días pasados). **Cancelar** o tocar fuera de la hoja la cierra sin guardar.

## Tipos de hábito

### Sí/no (meta 1)
Un toque y listo. Tocar otra vez lo desmarca.

### Con cantidad (meta de 2 a 99)
- Cada toque **suma 1** hasta llegar a la meta. **Mantener pulsado** (medio segundo) **resta 1**. Con teclado, las teclas **−**, **Retroceso** o **Suprimir** también restan.
- La tarjeta muestra «3/8 vasos» y **se va rellenando** con el color del hábito.
- Solo cuenta como hecho (y da XP) **al llegar a la meta**. Si tocas cuando ya está completo, te recuerda que puedes mantener pulsado para restar.
- En el Historial, los días a medias salen más tenues.

### Para dejar algo
- **Cada día sin recaer cuenta como hecho automáticamente**, con su XP, desde el día en que lo creas.
- Si recaes, toca la tarjeta y confirma «Sí, he recaído». La racha vuelve a empezar al día siguiente. Si te has equivocado, vuelve a tocar para deshacerlo, sin confirmación.
- La tarjeta dice «🚭 12 días sin fumar». El texto se saca del nombre: «Dejar de fumar» da «fumar», «Sin azúcar» da «azúcar» y «Menos redes» da «redes».
- Siempre son diarios y sin cantidad, así que al elegir este tipo se ocultan la frecuencia y la meta.
- En el Historial se ven las recaídas marcadas y cuántas llevas.

## Frecuencia

- **Cada día.**
- **Algunos días** (por ejemplo, L · X · V; por defecto de lunes a viernes). Solo cuentan los días elegidos. Los demás son de **descanso**: no rompen la racha y en Hoy se ven atenuados con «Hoy descansa». Si aun así lo haces, cuenta como **día extra** (+10 XP, sin tocar la racha).
- **X veces por semana** (de 1 a 6). Vale cualquier día. La racha se cuenta en **semanas cumplidas** y la tarjeta muestra «2/3 esta semana». La semana en curso no rompe la racha hasta que termina. Una semana con días en pausa (o la primera, si empezaste a mitad) no rompe la racha aunque no la cumplas.

## Pausar, archivar y eliminar

Todo esto está en el formulario del hábito, al editarlo.

- **Pausar**, con fecha de fin opcional («hasta el…») o indefinidamente:
  - Los días en pausa no rompen la racha, no cuentan para el día perfecto y en el Historial salen en gris.
  - En Hoy, el hábito va al final, atenuado, con «En pausa · reanudar». Al tocarlo te pregunta si quieres reanudarlo.
  - Si hoy ya lo habías hecho, la pausa empieza mañana, para no perder la XP de hoy.
  - Se puede deshacer desde el aviso.
- **Archivar:**
  - Desaparece de Hoy y del Historial, pero conservas su XP y su historial.
  - Se restaura (o se borra) desde **Ajustes → Hábitos archivados**. Al restaurarlo, los días que estuvo archivado cuentan como pausa y tu racha sigue.
- **Eliminar:**
  - Se puede **deshacer** durante unos segundos.
  - Tu XP total, tus protectores usados, tus retos y tus récords **no cambian** al borrar un hábito.

## XP y niveles

| Qué haces | XP |
| --- | --- |
| ✅ Hábito hecho (o un día sin recaer) | +10 |
| 🔥 Bonus de racha: +1 por cada día (o semana) de racha | hasta +10 |
| 🌟 Día perfecto: todos los hábitos que tocaban ese día | +25 |
| 🏆 Reto semanal completado | +30 a +60 |
| ✨ Día extra (en un día de descanso) | +10 |
| 🛡️ Día salvado por un protector | 0 |

- Cada nivel pide 100 XP más que el anterior: el nivel 2 está en 100 XP, el 3 en 300, el 4 en 600, el 5 en 1.000…
- **Día perfecto:** solo cuentan los hábitos que tocaban ese día. No cuentan los que descansan, los que están en pausa ni los de «X veces por semana».
- **Todo se calcula a partir de tu historial.** Si desmarcas un día, la XP se resta; si cambias la frecuencia o la meta, se recalcula todo con lo nuevo.

**Los 15 títulos** (después del 15, «Leyenda 2», «Leyenda 3»…):

| Nivel | Título | Nivel | Título | Nivel | Título |
| --- | --- | --- | --- | --- | --- |
| 1 | 🌱 Semilla | 6 | ⚡ Enfocado | 11 | 🧠 Sabio |
| 2 | 🌿 Brote | 7 | 💪 Disciplinado | 12 | 🛡️ Guardián |
| 3 | 🪴 Planta | 8 | 🧭 Explorador | 13 | 👑 Maestro |
| 4 | 🌳 Árbol | 9 | 🏔️ Escalador | 14 | 🌟 Estrella |
| 5 | 🔥 Constante | 10 | 🦅 Imparable | 15 | 🐉 Leyenda |

## Protectores de racha 🛡️

- **Cómo se ganan:** 1 cada vez que la racha de cualquier hábito llega a 7, 14, 21… días seguidos. Como mucho guardas **3**; los que ganes con 3 guardados se pierden.
- **Cómo se usan:** solos. Al abrir la app (o al cambiar de día con la app abierta), si un hábito diario o de algunos días con racha de **3 o más** se quedó sin hacer ayer, se gasta un protector por cada día olvidado. Si fueron varios días seguidos, solo se gastan si tienes suficientes para cubrir todo el hueco. Verás el aviso «🛡️ Protector usado: tu racha de 12 días sigue viva».
- **El día protegido** mantiene la racha, pero no la aumenta, no da XP, no cuenta como hábito marcado ni como día perfecto. En el Historial sale en dorado.
- **Si luego marcas ese día a mano**, el protector vuelve a tu reserva.
- Los hábitos de «X veces por semana» y los de dejar algo no usan protectores.

## Retos semanales 🏆

- Cada lunes salen **3 retos** nuevos, elegidos según tus hábitos y los mismos toda la semana. Añadir un hábito a mitad de semana no los cambia.
- Cada reto da de 30 a 60 XP según su dificultad. Solo cuentan los retos desde que empezaste a usar esta versión (no se regala XP de semanas pasadas).
- Los ves resumidos en Hoy y con barras de avance en Progreso.

**Retos posibles:**

| Reto | XP |
| --- | --- |
| 🌟 Consigue 3 días perfectos | 40 |
| ✨ Consigue 5 días perfectos | 60 |
| 🔗 Encadena 3 días perfectos seguidos | 60 |
| 🏖️ Consigue un día perfecto en fin de semana | 40 |
| 🎯 Marca N hábitos esta semana (el 80 % de lo que te toca) | 40 |
| 📅 Completa «‹hábito›» todos los días que toca | 50 |
| 💪 Cumple «‹hábito semanal›» X veces esta semana | 40 |
| 💧 Llega a tu meta de «‹hábito con cantidad›» N días | 40 |
| ⭐ Haz un día extra de «‹hábito de algunos días›» | 30 |
| 🕊️ Semana entera sin recaídas en «‹hábito de dejar algo›» | 50 |
| 🌈 Marca cada hábito al menos una vez | 40 |
| 🔥 Llega a una racha de 7 días en algún hábito | 50 |
| 🛡️ No gastes ningún protector esta semana (se decide el domingo) | 30 |

## Logros

Hay 17 logros. En Progreso, los que te faltan muestran una barra con lo que llevas («4/7»).

| Logro | Cómo se consigue |
| --- | --- |
| ✅ Primer paso | Marca tu primer hábito |
| 🔥 En marcha | Racha de 3 días |
| 🌟 Día perfecto | Todos tus hábitos en un día |
| 📅 Una semana | Racha de 7 días |
| 🚀 Despegue | Llega al nivel 5 |
| ⚡ Dos semanas | Racha de 14 días |
| 🎯 Medio centenar | Marca 50 hábitos en total |
| ✨ Perfeccionista | 10 días perfectos |
| 🏅 Un mes entero | Racha de 30 días |
| 🦅 Doble dígito | Llega al nivel 10 |
| 🏆 Veterano | Marca 250 hábitos en total |
| 💯 Centenario | Racha de 100 días |
| 💎 Diamante | 50 días perfectos |
| 👑 Un año | Racha de 365 días |
| 🛡️ Escudo | Usa tu primer protector |
| 🕊️ Libre | 30 días sin recaer |
| 🏆 Retador | Completa 10 retos semanales |

Los logros de racha se miden en días, en cualquier hábito diario, de algunos días o de dejar algo.

## Diario: ánimo y nota del día

- Debajo de tus hábitos, en Hoy, está **«¿Qué tal el día?»**. Elige tu ánimo: 😞 Mal, 😕 Regular, 😐 Normal, 🙂 Bien o 😄 Genial. Tocar otra vez el mismo lo quita.
- **«✏️ Añadir nota»** abre un cuadro para escribir hasta 200 caracteres, con contador. Se guarda mientras escribes.
- Funciona también en **días anteriores** (con las flechas), y entonces pregunta «¿Qué tal fue ese día?».
- En el **Historial**, al tocar un día del mapa «Todos los hábitos», ves su ánimo junto a la fecha y su nota debajo.
- El diario viaja en las copias de seguridad y **no se borra** al restablecer el progreso.

## Resumen de la semana

- **Cuándo sale:** la primera vez que abres la app en una semana nueva, siempre que tengas al menos una semana entera de historial.
- **Qué muestra de la semana anterior:**
  - % de cumplimiento: los hechos entre los que tocaban. En los semanales cuentan hasta sus veces.
  - Días perfectos y XP ganada.
  - Tu mejor hábito y el que más te cuesta.
  - Comparación con la semana previa («↑ 12 puntos más», «↓ 5 puntos menos»).
  - Retos completados («2/3») y ánimo medio, si lo apuntaste.
- **Volver a verlo:** en **Progreso → Resumen de la semana pasada**.

## Recordatorios en el calendario

- En el formulario del hábito, elige una **hora** y pulsa **«Añadir recordatorio al calendario»**. Funciona también con un hábito que aún no has guardado.
- La app crea un evento que se repite según la frecuencia, con aviso a esa hora:
  - Cada día: diario.
  - Algunos días: esos días de la semana.
  - Veces por semana: un recordatorio semanal.
  - Dejar algo: diario.
- **iPhone:** se abre el menú Compartir; elige **Calendario** si aparece. Si no, **Guardar en Archivos**, abre el archivo desde la app Archivos y pulsa **Añadir todo**.
- **Android:** se abre el menú Compartir (o se descarga el archivo `.ics`); ábrelo con **Google Calendar** u otra app de calendario.
- **Si cambias la frecuencia**, tendrás que volver a añadir el recordatorio y borrar el anterior del calendario.

## Pantalla Progreso

- **Tu nivel:** anillo con el emoji del nivel, título, barra de XP, cuánto falta para el siguiente, y tu **XP total**, tu **mejor racha** y tus **días perfectos**.
- **Retos de la semana:** los 3 retos con su barra de avance y su estado («✓ +40 XP», «No conseguido», «Se decide el domingo»…), y cuántos llevas en total.
- **Tu semana pasada:** botón para abrir el resumen.
- **Protectores de racha:** cuántos tienes (de 3), cómo funcionan, y cuántos has ganado y usado.
- **Cómo ganar XP:** la tabla de puntos.
- **Camino de niveles:** los niveles en fila, con el tuyo centrado y resaltado, los superados marcados y la XP que pide cada uno de los siguientes.
- **Logros:** los 17, con los conseguidos en dorado y el avance de los que faltan.

## Pantalla Historial

- **Todos los hábitos:**
  - Mapa de calor de los últimos 12 meses, con columnas por semanas (de lunes a domingo), meses arriba y leyenda «Menos – Más».
  - Cuanto más intenso, más hábitos cumpliste de los que tocaban. Los días de descanso salen solo con contorno.
  - Al tocar un día: fecha, cuántos hiciste, tu ánimo y tu nota. El botón **«Ver día ›»** te lleva a ese día en Hoy para corregirlo.
- **Una tarjeta por hábito**, con su color:
  - Emoji, nombre, frecuencia (y meta o «En pausa») y botón **Editar**.
  - **Racha actual**, **mejor racha** (en días o semanas) y **días hechos**. En los de dejar algo, **recaídas** en lugar de días hechos.
  - Su propio mapa de calor. Leyenda de casillas:

    | Casilla | Significado |
    | --- | --- |
    | Color del hábito | Hecho |
    | Más clara | A medias (cantidad sin llegar a la meta) |
    | Solo contorno | Descanso |
    | Gris | En pausa |
    | Rojiza | Recaída |
    | Dorada | Protegido 🛡️ |
    | Con borde | Hoy |

  - Al tocar un día se explica qué pasó: «Hecho ✓», «Hecho ✓ (día extra)», «3/8 vasos», «Sin recaer ✓», «Recaída», «Protegido 🛡️», «En pausa», «Día de descanso», «Aún no existía» o «Sin hacer».

## Pantalla Ajustes

- **Tu perfil:**
  - Nombre (hasta 24 caracteres) y avatar: elige uno de los 24 o toca el grande y escribe cualquier emoji.
  - También muestra tu nivel y desde cuándo usas Bonsái. Todo se guarda al momento.
- **Copia de seguridad:**
  - **Exportar** comparte o descarga un archivo con todos tus datos.
  - **Importar** recupera una copia, previa confirmación. Las copias de versiones anteriores también valen.
  - Se muestra la fecha de tu última copia.
- **Hábitos archivados:** con la XP de cada uno y los botones **Restaurar** y **Borrar** (con deshacer).
- **Zona beta → Restablecer progreso y logros:**
  - Vuelves al nivel 1 y se borran el historial de días, las recaídas, los protectores y los logros.
  - Tus hábitos, tu perfil y tu diario se mantienen.
  - Antes te enseña tu nivel, tu XP y tus logros, con opción de exportar una copia. Se puede deshacer.
- **Versión** de la app, al final.

## Diseño, accesibilidad y detalles

- **Estilo zen:** papel de arroz, verde salvia, arena y dorado, con formas redondeadas y botones que se hunden al pulsarlos.
- **Modo oscuro automático** (verde bosque de noche), según el ajuste del móvil.
- **Pensada para el móvil:** botones grandes, barra de pestañas flotante, respeta el notch, la isla dinámica y la barra inferior, y nunca hay scroll horizontal.
- **Accesible:**
  - Etiquetas para lectores de pantalla.
  - Uso con teclado: tras cada cambio, el foco se queda en el hábito.
  - Si el móvil tiene activado «reducir movimiento», se desactivan las animaciones.
- **Sin conexión:** tras abrirla una vez, funciona sin internet. Al actualizarla, la versión nueva aparece la siguiente vez que la abras.
- **Cambio de día:** si dejas la app abierta pasada la medianoche (o vuelves a ella al día siguiente), se pasa sola al día nuevo, gasta protectores si hace falta y enseña el resumen si empieza semana.
- **Almacenamiento persistente:** pide al navegador que no borre tus datos si le falta espacio.

## Tus datos

- Todo se guarda en el propio móvil (`localStorage`, clave `racha:v1`: conserva el nombre antiguo para que nadie pierda sus datos). No hay servidor, cuenta ni seguimiento.
- Solo se guarda lo que decides tú:
  - tus hábitos y días marcados;
  - recaídas, pausas y protectores usados;
  - diario y perfil.
- La XP, los niveles, las rachas, los logros, los protectores ganados y los retos **se calculan a partir de tu historial**, así que siempre cuadran.
- Los datos de versiones anteriores se actualizan solos al abrir la app nueva, sin perder nada.

## Archivos del proyecto

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
   - **Repository name:** `racha` (el repositorio conserva el nombre antiguo, así la dirección de la app no cambia)
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
4. Toca **Añadir**. Aparecerá el icono de Bonsái junto a tus otras apps.
5. Ábrela siempre **desde ese icono**. Se verá a pantalla completa, sin las barras de Safari.

### Android (Chrome)

1. Abre esa dirección en **Chrome**.
2. Toca el menú **⋮** (arriba a la derecha) y elige **«Instalar app»**. Si no aparece, elige **«Añadir a pantalla de inicio»** y después **Instalar**. A veces Chrome muestra directamente un aviso abajo para instalarla.
3. Aparecerá el icono de Bonsái en tu pantalla de inicio (y en el cajón de apps).
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
- **Importar copia** te deja elegir ese archivo para recuperar todos tus datos, por ejemplo en un móvil nuevo. Las copias de versiones anteriores (también las de cuando la app se llamaba Racha) se pueden importar.

## ⚠️ Tres cosas importantes

- **Dónde se guardan tus datos:**
  - **iPhone:** los datos de la app instalada y los de la pestaña de Safari están separados. Lo que marques en Safari no aparece en el icono, así que usa siempre el icono.
  - **Android:** la app instalada comparte los datos con Chrome para esa dirección. Si borras los datos de navegación (o los del sitio) en Chrome, se borran también tus hábitos.
- **Borrar la app puede borrar tus datos.** En el iPhone, borrar el icono de la pantalla de inicio los borra siempre. En Android, desinstalarla o borrar los datos de Chrome también puede hacerlo. Haz una copia de seguridad de vez en cuando para poder recuperarlos.
- **La vibración al marcar** funciona en la mayoría de móviles Android con Chrome (si la vibración está activada en el sistema) y en iPhone con iOS 18 o posterior. En otros casos la app funciona igual, pero sin vibrar.
