# Bonsái

Tracker de hábitos para usar en el móvil (iPhone o Android) como una app normal (PWA). Está hecho con HTML, CSS y JavaScript, sin frameworks, sin servidor y sin login: **tus datos se quedan en tu móvil**, no hace falta cuenta y **funciona sin conexión**.

Versión actual: **0.5 beta**.

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
9. [Protectores de racha](#protectores-de-racha)
10. [Retos semanales](#retos-semanales)
11. [Logros](#logros)
12. [Diario: ánimo y nota del día](#diario-ánimo-y-nota-del-día)
13. [Resumen de la semana](#resumen-de-la-semana)
14. [Revisión semanal](#revisión-semanal)
15. [Tendencias](#tendencias)
16. [Rutinas](#rutinas)
17. [Recordatorios en el calendario](#recordatorios-en-el-calendario)
18. [Pantalla Salud](#pantalla-salud)
19. [Salud de Apple y Health Connect](#salud-de-apple-y-health-connect)
20. [Pantalla Progreso](#pantalla-progreso)
21. [Pantalla Historial](#pantalla-historial)
22. [Pantalla Ajustes](#pantalla-ajustes)
23. [Aspecto, accesibilidad y detalles](#aspecto-accesibilidad-y-detalles)
24. [Tus datos](#tus-datos)
25. [Sincronización entre dispositivos](#sincronización-entre-dispositivos)
26. [Archivos del proyecto](#archivos-del-proyecto)
27. [Pruebas](#pruebas)
28. [Publicarla e instalarla](#paso-1-opcional-verla-en-tu-ordenador)
29. [Copia de seguridad](#copia-de-seguridad)
30. [Tres cosas importantes](#tres-cosas-importantes)

---

## Resumen rápido

- Tocas un hábito cuando lo haces y ganas **XP**; subes de **nivel** y consigues **logros**.
- Cada hábito lleva su **racha** (días seguidos, o semanas en los semanales).
- **21 tipos de hábito** listos para usar (caminar, correr, leer, meditar, beber agua, dormir, dejar de fumar…), cada uno con su **edición a medida**: por ejemplo, un deslizador para elegir cuántos minutos quieres caminar. Y uno **personalizado** para cualquier otra cosa.
- Se miden de cuatro formas: **sí/no**, **tiempo o distancia** («30 min», «5 km»: un toque marca la meta), **contador** («3/8 vasos») y **dejar algo** («12 días sin fumar»).
- Eliges la **frecuencia**: cada día, algunos días de la semana o X veces por semana.
- Puedes **pausar** un hábito (vacaciones, lesión…) sin romper la racha, o **archivarlo**.
- Los **protectores** salvan tu racha si un día se te olvida.
- Cada semana hay **3 retos** que dan XP extra.
- Un **diario** para apuntar cómo te ha ido el día, y un **resumen** de la semana cada lunes.
- Una **revisión semanal** más completa (hábitos día a día, diario y últimas semanas) y **tendencias** opcionales, siempre descriptivas.
- **Rutinas** opcionales («Mañana», «Noche»…) para ver tus hábitos agrupados.
- Un apartado **Salud** para apuntar tu peso (kg o lb), privado y sin XP.
- **Recordatorios** que se añaden al calendario del móvil.
- **Mapas de calor** de 12 meses, **copia de seguridad**, modo claro/oscuro automático y un diseño sobrio y tranquilo.

## Primera vez: la bienvenida

Si aún no tienes hábitos, Hoy muestra una bienvenida con los 3 pasos de la app y 8 tipos de hábito sugeridos. **Al tocar uno no se crea todavía:** se abre su edición, ya adaptada (por ejemplo, Caminar con su deslizador de minutos), para que lo ajustes y pulses **Añadir**. **«Ver todos los tipos»** abre la lista completa.

## Pantalla Hoy

**Arriba**
- **Saludo** con tu avatar y tu nombre: «Buenos días» (de 6 a 13 h), «Buenas tardes» (de 13 a 21 h) o «Buenas noches». Tocar el avatar te lleva a Ajustes.
- **Editar** activa el modo edición y **+** crea un hábito nuevo.
- **Título del día:** «Hoy», «Ayer» o el día de la semana, con la fecha debajo.
- **Flechas ‹ ›** para ir a días anteriores y marcar lo que se te olvidó; no se puede ir al futuro. El botón **«Volver a hoy»** (o tocar otra vez la pestaña Hoy) te devuelve al día de hoy.

**Tarjeta principal** (tócala para ir a Progreso)
- **Anillo del día:** cuántos de los hábitos que tocan llevas («2/3»). Pone «hecho» al completarlos todos, y una hoja con «descanso» si ese día no toca ninguno.
- **Tu nivel:** número y título, la XP dentro del nivel («371/700 XP»), la barra de XP y cuánto falta para el siguiente.
- **Protectores** disponibles (de 0 a 3), junto al icono del escudo.

**Retos de la semana**: una tarjeta con cuántos llevas («1/3») y una barrita por reto. Tócala para ver el detalle en Progreso.

**Pistas**: la primera vez verás «Toca un hábito cuando lo completes.», y en modo edición una ayuda para editar y reordenar.

**Lista de hábitos**
- Todos van en una sola tarjeta, separados por líneas finas. Cada uno lleva su emoji en un cuadrado teñido con su color y, a la derecha, una **casilla redonda** que se rellena con ese color al marcarlo.
- La cabecera dice cuántos llevas («2 de 3 hechos»), «Todo hecho hoy» («Día completo» en días pasados) o «Día de descanso».
- **Orden:** primero los que tocan, luego los que descansan ese día (atenuados) y al final los que están en pausa.
- Debajo del nombre verás la racha (con un icono de llama delante) y lo siguiente que conviene saber:
  - «5 días · pendiente hoy» si hoy aún no lo has hecho.
  - «6 días · próxima meta: 7» cuando ya lo has hecho. Las metas son 3, 7, 14, 30, 60, 100, 180 y 365 días.
  - «Empieza tu racha hoy» si aún no tienes racha.
  - Semanales: «2 semanas · 2/3 esta semana» (con ✓ al cumplir la semana).
  - Contador: «3/8 vasos · 5 días», y un anillo fino alrededor de la casilla muestra lo que llevas.
  - Tiempo, distancia…: «20/30 min · 5 días» (o «30 min» al cumplirla).
  - Dejar algo: «12 días sin fumar».
  - Descanso: «Hoy descansa · 5 días» o «Día extra» si lo haces igualmente.
  - Pausa: «En pausa hasta el 3 oct · reanudar».
  - Día salvado por un protector (al mirar días anteriores): «Protegido · la racha se mantuvo».
- **Tocar un hábito:** marca o desmarca (en los de tiempo o distancia, marca la meta), suma 1 en los contadores, apunta una recaída en los de dejar algo, u ofrece reanudar si está en pausa.
- **Mantener pulsado:** en los de tiempo o distancia abre el deslizador para apuntar la cantidad real; en los contadores resta 1.
- **Modo edición:** toca un hábito para editarlo, o arrástralo desde ☰ para cambiar el orden.

**Al marcar** notarás, sin estridencias:
- una vibración suave;
- la casilla se rellena en unas décimas de segundo;
- un «+15 XP» pequeño (o «+1» en los pasos de cantidad) que sube un poco y se desvanece;
- cuando toca, un aviso: «Día completo · +25 XP» al completar todos los hábitos del día, o «Logro conseguido: …». Al subir de nivel se abre una ventana con un anillo que se completa, tu nivel, su título y los logros conseguidos. No hay confeti ni fuegos artificiales.

**Diario del día**: debajo de la lista (ver [Diario](#diario-ánimo-y-nota-del-día)).

## Crear y editar hábitos

Toca **+**. Primero eliges **qué tipo de hábito** quieres y después se abre **su edición, adaptada a ese tipo**. No se crea nada hasta que pulsas **Añadir** (y **«‹ Otro tipo»** te devuelve a la lista).

**Los tipos**, por grupos:

| Grupo | Tipo | Cómo se mide (y lo que propone) |
| --- | --- | --- |
| Moverte | 🚶 Caminar | Tiempo (5–180 min, 30) o pasos (1.000–30.000, 8.000) |
| | 🏃 Correr | Distancia (0,5–42 km, 5) o tiempo · 3 veces por semana |
| | 🚴 Montar en bici | Distancia (1–100 km, 15) o tiempo · 2 veces por semana |
| | 💪 Hacer ejercicio | Tiempo (45 min) · 3 veces por semana |
| | 🤸 Estirar | Tiempo (5–60 min, 10) |
| Mente | 🧘 Meditar | Tiempo (1–60 min, 10) |
| | 📚 Leer | Páginas (5–150, 20) o tiempo |
| | 🎓 Estudiar | Tiempo (45 min) |
| | 🗣️ Practicar un idioma | Tiempo (15 min) |
| | 🎸 Tocar un instrumento | Tiempo (20 min) |
| | ✍️ Escribir diario | Sí o no |
| Salud | 💧 Beber agua | Contador de vasos (2–16, 8) |
| | 😴 Dormir bien | Horas (4–12, de media en media, 8) |
| | 🍎 Comer fruta | Contador de piezas (1–8, 3) |
| | 🦷 Usar hilo dental | Sí o no |
| | 💊 Tomar vitaminas | Sí o no |
| Dejar algo | 🚭 Dejar de fumar · 🍬 Sin azúcar · 📵 Menos redes · 🍷 Sin alcohol | Días sin recaer |
| A tu manera | Personalizado | El formulario libre: empezar o dejar algo, meta de 1 a 99 y unidad |

**La edición** se adapta al tipo:

- **Emoji y nombre**, ya puestos (puedes cambiarlos; el nombre admite hasta 40 caracteres).
- **Meta de cada día:** un **deslizador** con los límites de ese tipo. Si se puede medir de dos formas, arriba eliges cuál (por ejemplo, «Tiempo | Pasos» al caminar). Debajo se explica cómo se marca.
- **Frecuencia:** cada día, algunos días o X veces por semana (ver [Frecuencia](#frecuencia)). Algunos tipos traen una propuesta (correr, 3 veces por semana).
- Los de **sí o no** no tienen meta, y los de **dejar algo** tampoco tienen frecuencia (son diarios).
- **Personalizado** es el formulario de siempre: «Quiero empezar a…» o «Quiero dejar de…», y una meta de 1 a 99 con botones − y + y una unidad opcional.
- **Color:** 8 tonos (Salvia, Jade, Niebla, Glicina, Sakura, Arcilla, Ocre y Piedra). Se usa en su icono, su casilla y su mapa de calor. Por defecto se propone uno que no uses aún.
- **Recordatorio:** una hora y el botón **«Añadir al calendario»** (ver [Recordatorios](#recordatorios-en-el-calendario)).
- **Solo al editar:** Pausa, Archivar y Eliminar. Al editar no se cambia el tipo.

**Añadir/Guardar** se desactiva si falta el nombre o si eliges «Algunos días» sin marcar ninguno. Al editar, si cambias la frecuencia o la meta, un aviso te explica qué pasa con los días pasados. **Cancelar** o tocar fuera de la hoja la cierra sin guardar.

## Tipos de hábito

### Sí/no (meta 1)
Un toque y listo. Tocar otra vez lo desmarca.

### De tiempo, distancia, pasos, horas o páginas
- **Un toque marca que has cumplido la meta** del día (por ejemplo, 30 min) y da su XP. Otro toque lo desmarca.
- **Mantener pulsado** (medio segundo) abre un deslizador para **apuntar lo que hiciste de verdad**: por ejemplo, 20 de 30 min. Si llegas a la meta (o la pasas), cuenta como hecho; si no, se queda a medias y un anillo alrededor de la casilla muestra cuánto llevas. Desde ahí también puedes **borrar lo de ese día**. Con teclado, la tecla **−** abre el mismo deslizador.
- Debajo del nombre verás «20/30 min» o, al cumplirla, lo que hiciste («35 min»).
- **Si cambias la meta**, los días que marcaste con un toque siguen contando como cumplidos. Si cambias la forma de medir (de minutos a pasos, por ejemplo), los días pasados se convierten en proporción.

### Contador (vasos, piezas… o una meta de 2 a 99 en Personalizado)
- Cada toque **suma 1** hasta llegar a la meta. **Mantener pulsado** (medio segundo) **resta 1**. Con teclado, las teclas **−**, **Retroceso** o **Suprimir** también restan.
- Muestra «3/8 vasos» y un **anillo alrededor de la casilla** se va completando con el color del hábito.
- Solo cuenta como hecho (y da XP) **al llegar a la meta**. Si tocas cuando ya está completo, te recuerda que puedes mantener pulsado para restar.
- En el Historial, los días a medias salen más tenues.

### Para dejar algo
- **Cada día sin recaer cuenta como hecho automáticamente**, con su XP, desde el día en que lo creas.
- Si recaes, toca el hábito y confirma «Sí, he recaído». La racha vuelve a empezar al día siguiente. Si te has equivocado, vuelve a tocar para deshacerlo, sin confirmación.
- Debajo del nombre pone «12 días sin fumar». El texto se saca del nombre: «Dejar de fumar» da «fumar», «Sin azúcar» da «azúcar» y «Menos redes» da «redes».
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
| Hábito hecho (o un día sin recaer) | +10 |
| Bonus de racha: +1 por cada día (o semana) de racha | hasta +10 |
| Día perfecto: todos los hábitos que tocaban ese día | +25 |
| Reto semanal completado | +30 a +60 |
| Día extra (en un día de descanso) | +10 |
| Día salvado por un protector | 0 |

- Cada nivel pide 100 XP más que el anterior: el nivel 2 está en 100 XP, el 3 en 300, el 4 en 600, el 5 en 1.000…
- **Día perfecto:** solo cuentan los hábitos que tocaban ese día. No cuentan los que descansan, los que están en pausa ni los de «X veces por semana».
- **Todo se calcula a partir de tu historial.** Si desmarcas un día, la XP se resta; si cambias la frecuencia o la meta, se recalcula todo con lo nuevo.

**Los 15 títulos** siguen el crecimiento de un bonsái, de la semilla al maestro (después del 15: «Maestro 2», «Maestro 3»…):

| Nivel | Título | Nivel | Título | Nivel | Título |
| --- | --- | --- | --- | --- | --- |
| 1 | Semilla | 6 | Rama | 11 | Corteza |
| 2 | Brote | 7 | Copa | 12 | Árbol joven |
| 3 | Plántula | 8 | Poda | 13 | Árbol maduro |
| 4 | Arraigo | 9 | Forma | 14 | Árbol antiguo |
| 5 | Tallo | 10 | Tronco | 15 | Maestro |

## Protectores de racha

- **Cómo se ganan:** 1 cada vez que la racha de cualquier hábito llega a 7, 14, 21… días seguidos. Como mucho guardas **3**; los que ganes con 3 guardados se pierden.
- **Cómo se usan:** solos. Al abrir la app (o al cambiar de día con la app abierta), si un hábito diario o de algunos días con racha de **3 o más** se quedó sin hacer ayer, se gasta un protector por cada día olvidado. Si fueron varios días seguidos, solo se gastan si tienes suficientes para cubrir todo el hueco. Verás el aviso «Protector usado: tu racha de 12 días se mantiene».
- **El día protegido** mantiene la racha, pero no la aumenta, no da XP, no cuenta como hábito marcado ni como día perfecto. En el Historial sale con un borde del color del hábito.
- **Si luego marcas ese día a mano**, el protector vuelve a tu reserva.
- Los hábitos de «X veces por semana» y los de dejar algo no usan protectores.

## Retos semanales

- Cada lunes salen **3 retos** nuevos, elegidos según tus hábitos y los mismos toda la semana. Añadir un hábito a mitad de semana no los cambia.
- Cada reto da de 30 a 60 XP según su dificultad. Solo cuentan los retos desde que empezaste a usar esta versión (no se regala XP de semanas pasadas).
- Los ves resumidos en Hoy y con barras de avance en Progreso.

**Retos posibles:**

| Reto | XP |
| --- | --- |
| Consigue 3 días perfectos | 40 |
| Consigue 5 días perfectos | 60 |
| Encadena 3 días perfectos seguidos | 60 |
| Consigue un día perfecto en fin de semana | 40 |
| Marca N hábitos esta semana (el 80 % de lo que te toca) | 40 |
| Completa «‹hábito›» todos los días que toca | 50 |
| Cumple «‹hábito semanal›» X veces esta semana | 40 |
| Llega a tu meta de «‹hábito con cantidad›» N días | 40 |
| Haz un día extra de «‹hábito de algunos días›» | 30 |
| Semana entera sin recaídas en «‹hábito de dejar algo›» | 50 |
| Marca cada hábito al menos una vez | 40 |
| Llega a una racha de 7 días en algún hábito | 50 |
| No gastes ningún protector esta semana (se decide el domingo) | 30 |

## Logros

Hay 17 logros. En Progreso salen como una cuadrícula de insignias, cada una con su icono de línea: las conseguidas en verde salvia y las que te faltan en gris, con una barra de lo que llevas («4/7»).

| Logro | Cómo se consigue |
| --- | --- |
| Primer paso | Marca tu primer hábito |
| En marcha | Racha de 3 días |
| Día perfecto | Todos tus hábitos en un día |
| Una semana | Racha de 7 días |
| Despegue | Llega al nivel 5 |
| Dos semanas | Racha de 14 días |
| Medio centenar | Marca 50 hábitos en total |
| Perfeccionista | 10 días perfectos |
| Un mes entero | Racha de 30 días |
| Doble dígito | Llega al nivel 10 |
| Veterano | Marca 250 hábitos en total |
| Centenario | Racha de 100 días |
| Diamante | 50 días perfectos |
| Un año | Racha de 365 días |
| Escudo | Usa tu primer protector |
| Libre | 30 días sin recaer |
| Retador | Completa 10 retos semanales |

Los logros de racha se miden en días, en cualquier hábito diario, de algunos días o de dejar algo.

## Diario: ánimo y nota del día

- Debajo de tus hábitos, en Hoy, está **«¿Qué tal el día?»**. Elige tu ánimo entre cinco caras de línea: Mal, Regular, Normal, Bien o Genial. Tocar otra vez la misma lo quita.
- **«Añadir nota»** abre un cuadro para escribir hasta 200 caracteres, con contador. Se guarda mientras escribes.
- Funciona también en **días anteriores** (con las flechas), y entonces pregunta «¿Qué tal fue ese día?».
- En el **Historial**, al tocar un día del mapa «Todos los hábitos», ves su ánimo junto a la fecha («Ánimo: bien») y su nota debajo.
- El diario viaja en las copias de seguridad y **no se borra** al restablecer el progreso.

## Resumen de la semana

- **Cuándo sale:** la primera vez que abres la app en una semana nueva, siempre que tengas al menos una semana entera de historial.
- **Qué muestra de la semana anterior:**
  - % de cumplimiento: los hechos entre los que tocaban. En los semanales cuentan hasta sus veces.
  - Días perfectos y XP ganada.
  - Tu mejor hábito y el que más te cuesta.
  - Comparación con la semana previa («↑ 12 puntos más», «↓ 5 puntos menos»).
  - Retos completados («2/3») y ánimo medio, si lo apuntaste.
- **Volver a verlo:** en **Progreso → Tu semana pasada → Ver el resumen breve**.
- Desde el propio resumen, **«Revisar la semana con calma»** abre la revisión semanal.

## Revisión semanal

Se abre desde el resumen del lunes o desde **Progreso → Tu semana pasada → Revisar la semana pasada**. Con las flechas de arriba puedes ir a semanas anteriores (solo semanas completas, hasta un año atrás).

- **Cómo fue:** el cumplimiento («Hiciste 23 de 29 de lo que tocaba»), la diferencia con la semana anterior en puntos, días perfectos, XP y retos, y unas columnas con las últimas 4 semanas.
- **Tus hábitos:** cada hábito con lo que hizo («5 de 7 días que tocaban», «2 de 3 veces», «7 días sin fumar») y una fila de 7 casillas, de lunes a domingo, con los colores del Historial. Van en tu orden de siempre: no hay «mejor» ni «peor» hábito.
- **Tu diario:** el ánimo medio y cada día con ánimo o nota.
- **Esta semana** (solo al revisar la semana pasada): puedes **pausar esta semana**, **reanudar** o **archivar** cada hábito. Todo empieza hoy (o mañana, si hoy ya lo hiciste) y no cambia los días anteriores. En la misma fila aparece el botón para deshacerlo («Reanudar» o «Restaurar»).
- Cambiar la frecuencia o la meta se sigue haciendo desde la edición del hábito, y eso recalcula su racha y su XP con lo nuevo, como siempre.

## Tendencias

En **Progreso → Tendencias** (plegadas; tócalas para abrirlas). Analizan las últimas **4 o 12 semanas completas**, y lo dicen: «Del 24 ago al 20 sept: 4 semanas completas».

- **Por día de la semana:** qué parte de lo que tocaba completaste cada día (en los hábitos para empezar algo, sin los semanales) y una frase como «Los lunes completaste el 90 % de lo que tocaba; los domingos, el 45 %» o «Entre días de la semana hay poca diferencia».
- **Por hábito:** su porcentaje y si es más, menos o parecido al de las semanas anteriores (diferencia de 10 puntos o más).
- **Ánimo:** cuántos días lo apuntaste y la media.
- **Sin datos suficientes no hay cifras:** cada día de la semana tiene que haber tocado algo al menos 3 veces, cada hábito al menos 7, y el ánimo necesita 7 días apuntados. Si no, lo dice.
- Solo describen lo que registraste: no explican por qué ni predicen nada.

## Rutinas

- Se crean en **Ajustes → Rutinas → Nueva rutina**: un nombre (hasta 30 caracteres) y los hábitos que quieras. Cada hábito puede estar en una sola rutina; si eliges uno que ya estaba en otra, se cambia. También puedes elegir la rutina desde la edición de cada hábito.
- En **Hoy**, cada rutina sale en su propio bloque con su nombre y cuántos llevas («2 de 3», «Completa» o «Descanso»); los demás hábitos van debajo, en «Otros hábitos». En modo edición la lista vuelve a ser una sola, para poder arrastrar.
- Las flechas de Ajustes cambian el orden de las rutinas; **Editar** las renombra o cambia sus hábitos, y desde ahí se eliminan (con deshacer).
- **Las rutinas solo agrupan.** Crearlas, editarlas, ordenarlas o eliminarlas nunca borra hábitos ni cambia sus días. Completar una rutina no marca nada por ti ni da XP extra: solo cuentan los hábitos, como siempre.

## Recordatorios en el calendario

- En el formulario del hábito, elige una **hora** y pulsa **«Añadir al calendario»**. Funciona también con un hábito que aún no has guardado.
- La app crea un evento que se repite según la frecuencia, con aviso a esa hora:
  - Cada día: diario.
  - Algunos días: esos días de la semana.
  - Veces por semana: un recordatorio semanal.
  - Dejar algo: diario.
- **iPhone:** se abre el menú Compartir; elige **Calendario** si aparece. Si no, **Guardar en Archivos**, abre el archivo desde la app Archivos y pulsa **Añadir todo**.
- **Android:** se abre el menú Compartir (o se descarga el archivo `.ics`); ábrelo con **Google Calendar** u otra app de calendario.
- **Si cambias la frecuencia**, tendrás que volver a añadir el recordatorio y borrar el anterior del calendario.

## Pantalla Salud

Un apartado aparte para tus medidas. De momento, el **peso**.

- **Registrar peso:** valor, fecha (hoy por defecto; no se admiten fechas futuras) y una nota opcional («en ayunas»). Se aceptan coma o punto decimal. Los valores válidos van de 20 a 400 kg (o de 44 a 880 lb); si algo no cuadra, el formulario lo dice junto al campo.
- **Resumen:** el último registro y su diferencia con el anterior («−0,2 kg respecto al registro anterior, del 23 sept»), siempre en el mismo tono: ni subir ni bajar se presenta como bueno o malo.
- **Evolución:** una gráfica de línea de los últimos 30 días, 90 días o 1 año. Tocándola (o con las flechas del teclado) ves cada registro debajo. Con menos de 2 registros en el periodo, lo dice en vez de dibujar nada.
- **Registros:** la lista completa, del más reciente al más antiguo (de 20 en 20). Toca uno para editarlo o borrarlo (con deshacer).
- **Unidad:** kilos o libras. Cada registro se guarda tal como lo apuntaste; al cambiar de unidad se muestran convertidos, sin modificarlos.
- **Borrar registros de Salud:** vacía solo este apartado, con confirmación y deshacer. Tus hábitos, tu progreso y tu diario no cambian.
- **Privado y aparte:** solo se guarda en el dispositivo y en tus copias. No da XP ni cuenta para rachas, retos o logros. Bonsái no interpreta tus medidas, no calcula el IMC y no da consejos médicos.
- Los datos están pensados para añadir más adelante otras medidas opcionales (cintura, pulso en reposo…) sin obligar a apuntar nada.

## Salud de Apple y Health Connect

Bonsái es una app web, y el iPhone y Android solo dejan leer **Salud** (Apple) y **Health Connect** (Android) a las apps nativas de la App Store o Google Play. Por eso **no puede leer tus pasos, minutos o sueño automáticamente**: los apuntas tú, con un toque o manteniendo pulsado para poner la cantidad exacta. Conectarla con Salud obligaría a convertir Bonsái en una app nativa. Por lo mismo, el peso del apartado [Salud](#pantalla-salud) de Bonsái también se apunta a mano.

## Pantalla Progreso

- **Tu nivel:** anillo con el número de tu nivel, su título, barra de XP, cuánto falta para el siguiente, y tu **XP total**, tu **mejor racha** y tus **días perfectos**.
- **Retos de la semana:** los 3 retos con su barra de avance y su estado («Conseguido · +40 XP», «No conseguido», «Se decide el domingo»…), y cuántos llevas en total.
- **Tu semana pasada:** botón para abrir la [revisión semanal](#revisión-semanal) y enlace al resumen breve.
- **Tendencias:** plegadas; ver [Tendencias](#tendencias).
- **Protectores de racha:** cuántos tienes (de 3), cómo funcionan, y cuántos has ganado y usado.
- **Cómo ganar XP:** la tabla de puntos.
- **Camino de niveles:** los niveles en fila, con su número y su título, el tuyo centrado y resaltado, los superados marcados y la XP que pide cada uno de los siguientes.
- **Logros:** los 17 en una cuadrícula de insignias, con el avance de los que faltan.

## Pantalla Historial

- **Todos los hábitos:**
  - Mapa de calor de los últimos 12 meses, con columnas por semanas (de lunes a domingo), meses arriba y leyenda «Menos – Más».
  - Un solo tono (verde salvia): cuanto más intenso, más hábitos cumpliste de los que tocaban. Los días de descanso salen solo con contorno.
  - Al tocar un día: fecha, cuántos hiciste, tu ánimo y tu nota. El botón **«Ver día ›»** te lleva a ese día en Hoy para corregirlo.
  - **Con teclado:** el tabulador entra en el mapa por el día de hoy; las flechas arriba y abajo cambian de día, izquierda y derecha de semana, e **Intro** abre ese día en Hoy. Los lectores de pantalla leen el resumen de cada día al llegar a él. Igual en el mapa de cada hábito.
- **Una tarjeta por hábito**, con su color:
  - Emoji, nombre, frecuencia (y meta o «En pausa») y botón **Editar**.
  - **Racha actual**, **mejor racha** (en días o semanas) y **días hechos**. En los de dejar algo, **recaídas** en lugar de días hechos.
  - Su propio mapa de calor, en el color del hábito. Leyenda de casillas:

    | Casilla | Significado |
    | --- | --- |
    | Color del hábito | Hecho |
    | Más clara | A medias (cantidad sin llegar a la meta) |
    | Solo contorno | Descanso |
    | Gris | En pausa |
    | Rojiza | Recaída |
    | Con borde de su color | Protegido |
    | Con borde | Hoy |

  - Al tocar un día se explica qué pasó: «Hecho», «Hecho (día extra)», «3/8 vasos», «Sin recaer», «Recaída», «Protegido», «En pausa», «Día de descanso», «Aún no existía» o «Sin hacer».

## Pantalla Ajustes

- **Tu perfil:**
  - Nombre (hasta 24 caracteres) y avatar: elige uno de los 24 o toca el grande y escribe cualquier emoji.
  - También muestra tu nivel y desde cuándo usas Bonsái. Todo se guarda al momento.
- **Rutinas:** crear, editar, ordenar y eliminar (ver [Rutinas](#rutinas)).
- **Copia de seguridad:** ver [Copia de seguridad](#copia-de-seguridad). Se muestra la fecha de tu última copia y, si hace falta, dos avisos:
  - **Tus datos de antes de la última importación**, con **Volver a ellos** o **Descartar**.
  - **Datos apartados**: si al abrir la app había datos guardados que no se podían leer, se apartan en vez de perderse. Puedes **descargarlos** para intentar recuperarlos, o **borrarlos**.
- **Hábitos archivados:** con la XP de cada uno y los botones **Restaurar** y **Borrar** (con deshacer).
- **Zona beta → Restablecer progreso y logros:**
  - Vuelves al nivel 1 y se borran el historial de días, las recaídas, los protectores y los logros.
  - Tus hábitos, tus rutinas, tu perfil, tu diario y tus registros de Salud se mantienen.
  - Antes te enseña tu nivel, tu XP y tus logros, con opción de exportar una copia. Se puede deshacer.
- **Versión** de la app, al final.

## Aspecto, accesibilidad y detalles

- **Calma, sobriedad y precisión** (en la línea de Things 3, Salud de Apple, Linear o Muji): fondo de papel liso, tarjetas planas con un borde fino, un solo color de acento (verde salvia) usado con moderación, y ni degradados ni botones «3D».
- **Letra del sistema:** San Francisco en el iPhone (Roboto en Android), con los títulos grandes en serif (New York). Los números usan cifras de ancho fijo para que no bailen al cambiar.
- **Iconos de línea** en toda la app. Los únicos emojis son los que eliges tú para tus hábitos y tu avatar.
- **Celebraciones tranquilas:** la casilla se rellena, la XP aparece como un texto pequeño que se desvanece y, al subir de nivel, un anillo se completa. Sin confeti.
- **Modo oscuro automático** (grafito verdoso, no negro puro), según el ajuste del móvil.
- **Icono:** un bonsái plano en color papel sobre verde salvia (`assets/icons/icon.svg`); los PNG del iPhone y Android se generan a partir de él.
- **Pensada para el móvil:** botones grandes, barra de pestañas translúcida de lado a lado, respeta el notch, la isla dinámica y la barra inferior, y nunca hay scroll horizontal.
- **Accesible:**
  - Contraste de texto AA (WCAG) en modo claro y oscuro.
  - Etiquetas para lectores de pantalla (también en los iconos que dan información, como el de la racha). La tarjeta principal de Hoy lee lo mismo que muestra: progreso del día, nivel, XP y protectores.
  - Uso con teclado: tras cada cambio, el foco se queda en el hábito. En modo edición, **Alt + flecha arriba o abajo** cambia el orden (la alternativa a arrastrar). En los grupos de opciones (ánimo, frecuencia, colores, periodos…) las flechas pasan a la opción de al lado. Los mapas de calor y la gráfica de Salud se recorren con las flechas.
  - Los errores de los formularios salen junto al campo, marcados para los lectores de pantalla, y el foco va al primero que hay que corregir.
  - Si el móvil tiene activado «reducir movimiento», se desactivan las animaciones.
- **Sin conexión:** tras abrirla una vez, funciona sin internet. Al actualizarla, la versión nueva aparece la siguiente vez que la abras.
- **Cambio de día:** si dejas la app abierta pasada la medianoche (o vuelves a ella al día siguiente), se pasa sola al día nuevo, gasta protectores si hace falta y enseña el resumen si empieza semana.
- **Almacenamiento persistente:** pide al navegador que no borre tus datos si le falta espacio.

## Tus datos

- Todo se guarda en el propio móvil (`localStorage`, clave `racha:v1`: conserva el nombre antiguo para que nadie pierda sus datos). No hay servidor, cuenta ni seguimiento.
- Solo se guarda lo que decides tú:
  - tus hábitos (con su tipo y cómo se miden) y lo que marcas cada día;
  - recaídas, pausas y protectores usados;
  - diario y perfil;
  - rutinas (solo qué hábitos agrupan);
  - registros de Salud (medida, fecha, valor con su unidad y nota) y la unidad que prefieres.
- La XP, los niveles, las rachas, los logros, los protectores ganados y los retos **se calculan a partir de tu historial**, así que siempre cuadran. Salud y las rutinas no intervienen en esos cálculos.
- Los datos de versiones anteriores se actualizan solos al abrir la app nueva, sin perder nada (los hábitos que ya tenías pasan a ser «Personalizado» y funcionan igual; quien no tenía Salud ni rutinas empieza sin ellas).
- Otras dos claves, solo cuando hacen falta: `racha:v1:antes-de-importar` (tus datos justo antes de la última importación) y `racha:v1:rescate` (datos guardados que no se podían leer).

## Sincronización entre dispositivos

**No hay sincronización**: cada dispositivo tiene sus datos, y para pasarlos de uno a otro se exporta e importa una copia. El diseño de una sincronización real (proveedores posibles, conflictos, borrados, restauración y privacidad) y las decisiones pendientes están en [`docs/sincronizacion.md`](docs/sincronizacion.md).

## Archivos del proyecto

```text
Racha/
├── index.html             # Punto de entrada de la app
├── manifest.json          # Configuración de la PWA e iconos instalables
├── sw.js                  # Caché y funcionamiento sin conexión
├── README.md              # Documentación del proyecto
├── assets/
│   ├── css/
│   │   └── styles.css     # Estilos y temas
│   ├── js/
│   │   └── app.js         # Lógica de la aplicación
│   └── icons/             # Iconos SVG y PNG
├── docs/
│   └── sincronizacion.md  # Diseño pendiente de la sincronización
└── tests/                 # Pruebas (no hace falta subirlas para publicar la app)
```

Los archivos de entrada de la PWA permanecen en la raíz para conservar el despliegue y el alcance del service worker.

## Pruebas

Con [Node.js](https://nodejs.org) 20 o posterior, desde la carpeta del proyecto:

```text
node --test "tests/*.test.mjs"
```

No hay que instalar nada: las pruebas cargan `assets/js/app.js` tal cual en un entorno aislado (con una fecha fija) y comprueban las reglas de XP y rachas de siempre, la compatibilidad con copias antiguas, Salud, la revisión semanal, las tendencias, las rutinas y las copias de seguridad.

## Paso 1 (opcional): verla en tu ordenador

Haz doble clic en `index.html` y se abrirá en tu navegador. Así funciona todo menos el modo sin conexión, que solo se activa una vez publicada en internet.

## Paso 2: subirla gratis a GitHub Pages

1. Entra en **github.com** y crea una cuenta gratuita, si aún no la tienes.
2. Arriba a la derecha, pulsa **+ → New repository**.
   - **Repository name:** `racha` (el repositorio conserva el nombre antiguo, así la dirección de la app no cambia)
   - Déjalo en **Public**; es necesario para que Pages sea gratis.
   - Pulsa **Create repository**.
3. En la página del repositorio vacío, pulsa el enlace **«uploading an existing file»**.
4. Abre la carpeta `Racha` en el Explorador de Windows. Selecciona **todo su contenido**, incluida la carpeta `assets`, y arrástralo a la página de GitHub.
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
4. Toca **Añadir**. Aparecerá el icono de Bonsái (un bonsái claro sobre verde) junto a tus otras apps.
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

- **Exportar copia** explica primero qué lleva el archivo (hábitos y días marcados, diario, rutinas, perfil y progreso). Si tienes registros de Salud, puedes elegir si incluirlos. Después se abre el menú Compartir: en el iPhone, elige **«Guardar en Archivos»** (por ejemplo, en iCloud Drive); en Android, guárdala en **Drive** o en tus archivos (si no se abre el menú, se descarga en la carpeta Descargas). La copia contiene tus datos personales: guárdala en un sitio privado.
- **Importar copia** te deja elegir ese archivo para recuperar todos tus datos, por ejemplo en un móvil nuevo. Las copias de versiones anteriores (también las de cuando la app se llamaba Racha) se pueden importar.
  - **Antes de tocar nada se comprueba el archivo.** Si no es una copia de Bonsái, es de otra app o es demasiado grande, se dice por qué y tus datos no cambian.
  - Luego se enseña qué trae (fecha de la copia, perfil, hábitos, diario, rutinas, Salud), qué va a reemplazar y si hay algo que no es válido y se quedará fuera.
  - **Salud:** una copia sin Salud (de una versión anterior, o exportada sin ella) no toca los registros de Salud del dispositivo.
  - Al importar se guardan antes tus datos actuales en el dispositivo: puedes deshacerlo desde el aviso o, más tarde, desde **Ajustes → Copia de seguridad → Volver a ellos**. Si la copia no se puede guardar (por ejemplo, por falta de espacio), todo se queda como estaba.

## Tres cosas importantes

- **Dónde se guardan tus datos:**
  - **iPhone:** los datos de la app instalada y los de la pestaña de Safari están separados. Lo que marques en Safari no aparece en el icono, así que usa siempre el icono.
  - **Android:** la app instalada comparte los datos con Chrome para esa dirección. Si borras los datos de navegación (o los del sitio) en Chrome, se borran también tus hábitos.
- **Borrar la app puede borrar tus datos.** En el iPhone, borrar el icono de la pantalla de inicio los borra siempre. En Android, desinstalarla o borrar los datos de Chrome también puede hacerlo. Haz una copia de seguridad de vez en cuando para poder recuperarlos.
- **La vibración al marcar** funciona en la mayoría de móviles Android con Chrome (si la vibración está activada en el sistema) y en iPhone con iOS 18 o posterior. En otros casos la app funciona igual, pero sin vibrar.
