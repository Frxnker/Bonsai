// Fase 3: temporizador en los hábitos de minutos. Cuenta con el reloj desde la hora de inicio guardada
// y, al parar, suma los minutos con la misma función que apuntarlos a mano.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain, STORAGE_KEY } from './harness.mjs';

const NOW = new Date('2026-09-27T10:00:00').getTime();
const MIN = 60 * 1000;
const meditate = { id: 'm', name: 'Meditar', type: 'meditate', mode: 'target', measure: 'min', goal: 10, unit: 'min', created: '2026-09-01', done: {} };
const read = { id: 'r', name: 'Leer', type: 'read', mode: 'target', measure: 'pages', goal: 20, unit: 'páginas', created: '2026-09-01', done: {} };

test('solo los hábitos de minutos tienen temporizador, y solo hoy', () => {
  const app = loadApp({ stored: { habits: [meditate, read] } });
  assert.match(app.run(`habitRow(findHabit('m'))`), /data-timer="m"/);
  assert.match(app.run(`habitRow(findHabit('m'))`), /Empezar el temporizador de «Meditar»/);
  assert.doesNotMatch(app.run(`habitRow(findHabit('r'))`), /data-timer/, 'páginas: no');
  app.run(`ui.day = '2026-09-26'`);
  assert.doesNotMatch(app.run(`habitRow(findHabit('m'))`), /data-timer/, 'días anteriores: no');
});

test('empezar guarda la hora de inicio; parar suma los minutos al día, como a mano', () => {
  const app = loadApp({ stored: { habits: [meditate] } });
  assert.equal(app.run(`startTimer('m')`), true);
  assert.deepEqual(plain(app.run('state.timer')), { id: 'm', day: '2026-09-27', start: NOW, paused: 0, pausedAt: 0 });
  assert.deepEqual(JSON.parse(app.storage.get(STORAGE_KEY)).timer, { id: 'm', day: '2026-09-27', start: NOW, paused: 0, pausedAt: 0 }, 'se guarda');
  // Han pasado 12 min y 40 s: se redondea a 13.
  app.run(`state.timer.start = ${NOW - 12 * MIN - 40 * 1000}`);
  assert.equal(app.run('fmtTimer(timerElapsed())'), '12:40');
  app.run('stopTimer()');
  assert.equal(app.run(`findHabit('m').done['2026-09-27']`), 13);
  assert.equal(app.run('state.timer'), null);
  assert.equal(app.run(`isDone(findHabit('m'), '2026-09-27')`), true, 'con 13 de 10 min queda hecho');
  assert.match(app.toasts.at(-1), /Logro conseguido: Primer paso/, 'y celebra lo mismo que al apuntarlo a mano');

  // Lo mismo que apuntar 13 min con el deslizador: mismas cifras.
  const manual = loadApp({ stored: { habits: [meditate] } });
  manual.run(`setHabitAmount(findHabit('m'), '2026-09-27', 13)`);
  assert.deepEqual(plain(app.run('computeStats()')), plain(manual.run('computeStats()')));
  assert.deepEqual(plain(app.run(`streakInfo(findHabit('m'))`)), plain(manual.run(`streakInfo(findHabit('m'))`)));
});

test('suma a lo que ya había apuntado ese día', () => {
  const app = loadApp({ stored: { habits: [{ ...meditate, done: { '2026-09-27': 4 } }] } });
  app.run(`startTimer('m'); state.timer.start = ${NOW - 5 * MIN}`);
  app.run('stopTimer()');
  assert.equal(app.run(`findHabit('m').done['2026-09-27']`), 9);
  assert.match(app.toasts.at(-1), /\+5 min a «Meditar»/);
});

test('pausar no cuenta el tiempo en pausa; menos de medio minuto no suma nada', () => {
  const app = loadApp({ stored: { habits: [meditate] } });
  app.run(`startTimer('m')`);
  // Empezó hace 20 min, estuvo 8 en pausa y ahora está en pausa desde hace 2.
  app.run(`state.timer.start = ${NOW - 20 * MIN}; state.timer.paused = ${8 * MIN}; state.timer.pausedAt = ${NOW - 2 * MIN}`);
  assert.equal(app.run('timerMinutes()'), 10);
  app.run('toggleTimerPause()'); // reanudar: suma los 2 min de esta pausa
  assert.equal(app.run('state.timer.pausedAt'), 0);
  assert.equal(app.run('state.timer.paused'), 10 * MIN);
  assert.equal(app.run('timerMinutes()'), 10);
  app.run('toggleTimerPause()');
  assert.equal(app.run('state.timer.pausedAt'), NOW, 'pausar apunta desde cuándo');

  const short = loadApp({ stored: { habits: [meditate] } });
  short.run(`startTimer('m'); state.timer.start = ${NOW - 20 * 1000}`);
  short.run('stopTimer()');
  assert.equal(short.run(`findHabit('m').done['2026-09-27']`), undefined);
  assert.match(short.toasts.at(-1), /Menos de un minuto/);
});

test('solo un temporizador a la vez; cancelar no suma y se puede deshacer', () => {
  const other = { ...meditate, id: 'y', name: 'Yoga', type: 'yoga' };
  const app = loadApp({ stored: { habits: [meditate, other] } });
  app.run(`startTimer('m')`);
  assert.equal(app.run(`startTimer('y')`), false);
  assert.match(app.toasts.at(-1), /Ya hay un temporizador en marcha, el de «Meditar»/);
  assert.equal(app.run('state.timer.id'), 'm');
  app.run(`state.timer.start = ${NOW - 30 * MIN}; cancelTimer()`);
  assert.equal(app.run('state.timer'), null);
  assert.equal(app.run(`findHabit('m').done['2026-09-27']`), undefined, 'cancelar no suma');
  assert.match(app.toasts.at(-1), /Temporizador cancelado/);
});

test('si se pasa la medianoche, cuenta para el día en que empezó', () => {
  const start = new Date('2026-09-26T23:50:00').getTime();
  const app = loadApp({
    stored: { habits: [meditate], timer: { id: 'm', day: '2026-09-26', start, paused: 0, pausedAt: 0 } },
    now: '2026-09-27T00:25:00',
  });
  assert.equal(app.run('state.timer.day'), '2026-09-26', 'sigue en marcha tras cerrar y abrir la app');
  assert.equal(app.run('timerMinutes()'), 35);
  app.run('stopTimer()');
  assert.equal(app.run(`findHabit('m').done['2026-09-26']`), 35);
  assert.equal(app.run(`findHabit('m').done['2026-09-27']`), undefined);
});

test('con muchas horas, pregunta antes de sumar', async () => {
  const app = loadApp({ stored: { habits: [meditate] } });
  app.run(`startTimer('m'); state.timer.start = ${NOW - 9 * 60 * MIN}`);
  app.run(`askConfirm = async () => false`);
  await app.run('stopTimer()');
  assert.equal(app.run('state.timer.id'), 'm', 'sin confirmar, sigue en marcha');
  app.run(`askConfirm = async () => true`);
  await app.run('stopTimer()');
  assert.equal(app.run(`findHabit('m').done['2026-09-27']`), 540);
});

test('el temporizador va en la copia; los datos no válidos se descartan', () => {
  const timer = { id: 'm', day: '2026-09-27', start: NOW - MIN, paused: 0, pausedAt: 0 };
  const app = loadApp({ stored: { habits: [meditate, read], timer } });
  assert.deepEqual(plain(app.run('readBackup(JSON.stringify(backupPayload())).data.timer')), timer);
  const check = (t) => plain(app.run(`normalizeTimer(${JSON.stringify(t)}, state.habits)`));
  assert.equal(check({ ...timer, id: 'r' }), null, 'un hábito que no es de minutos');
  assert.equal(check({ ...timer, id: 'nadie' }), null, 'un hábito que no existe');
  assert.equal(check({ ...timer, day: 'hoy' }), null);
  assert.equal(check({ ...timer, start: 'ayer' }), null);
  assert.equal(check({ ...timer, pausedAt: NOW - 2 * MIN }), null, 'en pausa antes de empezar');
  assert.equal(plain(app.run(`normalize({ habits: [] }).timer`)), null, 'las copias de antes no traen temporizador');
});

test('borrar o archivar el hábito quita su temporizador', () => {
  const app = loadApp({ stored: { habits: [meditate, read], timer: { id: 'm', day: '2026-09-27', start: NOW - MIN, paused: 0, pausedAt: 0 } } });
  app.run(`deleteHabit(findHabit('m'))`);
  assert.equal(app.run('state.timer'), null);
});
