# Sincronización entre dispositivos: diseño pendiente de decidir

**Estado: no implementada.** Bonsái guarda todo en `localStorage` del dispositivo (clave `racha:v1`). No hay servidor, cuenta ni proveedor configurado, y la app no muestra en ningún sitio que sincronice. Hasta que se decida lo de abajo, la forma de pasar datos entre dispositivos es exportar e importar una copia.

## Qué hace falta para una sincronización real

1. **Un almacén remoto** accesible por HTTPS desde el navegador (con CORS), porque la app es estática y se publica en GitHub Pages.
2. **Identidad**: saber de quién son los datos. Puede ser una cuenta (correo con enlace mágico, Google…) o una cuenta del propio usuario en un servicio de archivos.
3. **Cambios con fecha y borrados que se recuerdan**: cada registro necesita una marca de modificación y los borrados, una «lápida». Hoy no existen, así que hará falta una migración del esquema (v3).
4. **Funcionar sin conexión**: una cola local de cambios pendientes que se sube al volver la red.
5. **Resolver conflictos** cuando dos dispositivos cambian lo mismo (ver abajo).
6. **Proteger Salud**: son datos sensibles, así que conviene cifrarlos antes de que salgan del dispositivo.

Lo que ya está preparado: los hábitos, las rutinas y los registros de Salud tienen identificadores estables. La normalización también tolera datos antiguos y desconocidos. Y las copias se validan antes de reemplazar nada, con una copia previa guardada.

## Opciones de proveedor

Ninguna necesita meter secretos en el código. Las claves públicas de cliente de estos servicios no son secretas, y la seguridad depende de las reglas de acceso del servidor.

| Opción | Cómo sería | A favor | En contra |
| --- | --- | --- | --- |
| **A. Supabase** (Postgres + Auth) | Una tabla por tipo de registro con reglas por usuario (RLS); acceso con `fetch` a su API REST, sin SDK | Plan gratuito, inicio de sesión por correo, reglas por fila, sin dependencias en la app | Servicio de terceros; hay que configurar bien las reglas; los datos viven en su servidor (salvo que se cifren) |
| **B. Almacenamiento del usuario** (Google Drive, carpeta oculta de la app) | Un archivo cifrado por usuario; la fusión se hace en el móvil | Los datos quedan en la cuenta de cada persona; sin servidor propio | Sincroniza un archivo entero (más lento con mucho historial); requiere registrar la app en Google y, según los permisos, su verificación |
| **C. Firebase** (Firestore + Auth) | Documentos por registro, con caché sin conexión incluida | Resuelve la parte sin conexión | SDK pesado (dependencia nueva), dependencia fuerte de Google |
| **D. Servidor propio mínimo** (Cloudflare Workers + D1, o PocketBase) | Una API pequeña con cuentas | Control total | Hay que mantenerlo y pagarlo |

**Recomendación:** A (Supabase vía REST, sin SDK) con **cifrado de extremo a extremo** mediante una frase de paso (WebCrypto: PBKDF2 + AES-GCM). El servidor solo guarda datos que no puede leer. Si se prefiere que los datos nunca estén en un servicio de terceros, B.

## Cómo se resolverían los conflictos

- **Se fusiona por registro, no por archivo.** Las unidades son la configuración de cada hábito, cada día de cada hábito (hecho, cantidad, recaída, protector), cada día del diario, cada registro de Salud, cada rutina y el perfil.
- **Gana el cambio más reciente de cada registro.** Para ordenar los cambios se usa un reloj lógico híbrido (hora y contador, con el identificador del dispositivo para desempatar), no la hora del móvil a secas, por si un reloj va mal. Si en un móvil marcas el lunes y en otro el martes, se conservan los dos días. Si los dos cambian el mismo día, gana el último cambio.
- **La XP, las rachas, los logros, los protectores ganados y los retos no se sincronizan**: se recalculan del historial, como ahora, así que no pueden entrar en conflicto. `challengesSince` se fusiona tomando la fecha más antigua.
- **El «banco» de XP de hábitos borrados** se guardaría por hábito borrado (su aportación, identificada por el id del hábito) y no como un único contador. Así, fusionar dos veces no suma dos veces.
- **Orden de hábitos y rutinas**: cada uno lleva una posición propia, así que reordenar en dos móviles no desordena el resto.

## Borrados

- Borrar crea una lápida `{ id, deletedAt }` que también se sincroniza. Así, un dispositivo que estuvo sin conexión no «resucita» lo borrado.
- Las lápidas se purgan a los 90 días. Un dispositivo que lleve más tiempo sin sincronizar hará una fusión completa guiada: se le pregunta antes de nada.
- Borrar una rutina no borra sus hábitos. Borrar los registros de Salud crea lápidas solo para Salud.

## Restauración (importar una copia) con sincronización activa

- Importar pasa a ser «este es el estado bueno». Se pide confirmación diciendo que afectará a todos los dispositivos. Lo que no esté en la copia recibe lápidas y todo lo demás se sube como cambio nuevo.
- La copia previa local de antes de importar se mantiene, como ahora. Además, el servidor guarda versiones de los últimos 30 días para poder volver atrás.
- **Primera vez con datos en los dos lados:** se pregunta si combinar (fusión por registro), usar solo los de este dispositivo o usar solo los de la nube. Nunca se decide solo.

## Privacidad

- Todo es opcional y está desactivado por defecto. Sin activarlo, la app funciona exactamente igual que hoy.
- **Salud no se sincroniza salvo que se active aparte.**
- Con cifrado de extremo a extremo, ni el proveedor ni nadie sin la frase de paso puede leer los datos. Si se olvida la frase, los datos de la nube no se pueden recuperar, pero los del dispositivo siguen ahí.
- Desde Ajustes se podría borrar todo lo guardado en la nube y cerrar la sesión. Sin analítica ni seguimiento.
- La app solo dirá «Sincronizado» cuando el servidor haya confirmado el último cambio. Si no, dirá «Pendiente» o «Sin conexión».

## Decisiones necesarias antes de implementarla

1. **Proveedor:** A (Supabase), B (Drive del usuario) u otro.
2. **Cifrado de extremo a extremo con frase de paso:** sí (recomendado) o no.
3. **Salud en la sincronización:** excluida siempre, o activable por separado (recomendado).
4. **Inicio de sesión** (solo con A): enlace mágico por correo, Google o ambos.

Con eso decidido, el trabajo sería: el esquema v3 con marcas de cambio y lápidas (con migración y pruebas), un módulo de sincronización separado de `app.js`, la cola sin conexión, el indicador de estado en Ajustes y pruebas de fusión con los casos de arriba.
