// Fase 4: modo vacaciones. Usa la pausa de siempre en todos los hábitos activos a la vez.
// La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain, STORAGE_KEY } from './harness.mjs';

function days(from, to) {
  const out = [];
  for (let d = new Date(`${from}T12:00:00`); d <= new Date(`${to}T12:00:00`); d.setDate(d.getDate() + 1)) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}
const marks = (list) => Object.fromEntries(list.map((d) => [d, 1]));

// Leer: 10 días seguidos hasta ayer. Agua: hecho también hoy. Dientes: ya en pausa. Viejo: archivado.
const habits = () => [
  { id: 'read', name: 'Leer', created: '2026-09-01', done: marks(days('2026-09-17', '2026-09-26')) },
  { id: 'water', name: 'Agua', created: '2026-09-01', done: marks(days('2026-09-20', '2026-09-27')) },
  { id: 'teeth', name: 'Dientes', created: '2026-09-01', done: {}, pauses: [{ from: '2026-09-25', to: null }] },
  { id: 'old', name: 'Viejo', created: '2026-09-01', done: {}, archived: '2026-09-10' },
];

test('pausa a la vez los hábitos activos, como la pausa de siempre, y no toca los que ya estaban en pausa', () => {
  const app = loadApp({ stored: { habits: habits() } });
  assert.equal(app.run(`startVacation('2026-10-05')`), true);
  const h = (id) => plain(app.run(`findHabit('${id}').pauses`));
  assert.deepEqual(h('read'), [{ from: '2026-09-27', to: '2026-10-04' }], 'hasta el día antes de volver');
  assert.deepEqual(h('water'), [{ from: '2026-09-28', to: '2026-10-04' }], 'hoy ya hecho: desde mañana, como al pausar a mano');
  assert.deepEqual(h('teeth'), [{ from: '2026-09-25', to: null }], 'el que ya estaba en pausa sigue igual');
  assert.deepEqual(h('old'), [], 'los archivados no se tocan');
  assert.deepEqual(plain(app.run('state.vacation')), {
    from: '2026-09-27', back: '2026-10-05',
    habits: [{ id: 'read', from: '2026-09-27' }, { id: 'water', from: '2026-09-28' }],
  });
  assert.ok(JSON.parse(app.storage.get(STORAGE_KEY)).vacation, 'se guarda');
  assert.equal(app.run(`startVacation()`), false, 'no se activa dos veces');
});

test('las rachas no se rompen durante las vacaciones y siguen al volver', () => {
  const app = loadApp({ stored: { habits: habits() } });
  app.run(`startVacation()`);
  const saved = app.storage.get(STORAGE_KEY);
  // Cinco días después, sin hacer nada: la racha de Leer sigue en 10.
  const later = loadApp({ stored: saved, now: '2026-10-02T09:00:00' });
  assert.equal(later.run(`streakInfo(findHabit('read')).current`), 10);
  assert.equal(later.run(`isPaused(findHabit('read'), '2026-10-02')`), true);
  // «He vuelto»: la pausa acaba ayer y hoy vuelve a contar, con la racha intacta.
  assert.equal(later.run('endVacation()'), true);
  assert.deepEqual(plain(later.run(`findHabit('read').pauses`)), [{ from: '2026-09-27', to: '2026-10-01' }]);
  assert.equal(later.run(`isDue(findHabit('read'), '2026-10-02')`), true);
  assert.equal(later.run(`streakInfo(findHabit('read')).current`), 10);
  later.run(`toggleHabit('read', null)`);
  assert.equal(later.run(`streakInfo(findHabit('read')).current`), 11);
  assert.deepEqual(plain(later.run(`findHabit('teeth').pauses`)), [{ from: '2026-09-25', to: null }], 'el que ya estaba en pausa sigue en pausa');
  assert.equal(later.run('state.vacation'), null);
});

test('volver el mismo día quita las pausas que aún no habían empezado', () => {
  const app = loadApp({ stored: { habits: habits() } });
  app.run(`startVacation()`);
  app.run('endVacation()');
  assert.deepEqual(plain(app.run(`findHabit('water').pauses`)), [], 'la de mañana se quita');
  assert.deepEqual(plain(app.run(`findHabit('read').pauses`)), [], 'la de hoy también: hoy vuelve a contar');
});

test('con fecha de vuelta, ese día se reanudan solos y el modo vacaciones termina', () => {
  const app = loadApp({ stored: { habits: habits() } });
  app.run(`startVacation('2026-10-01')`);
  const back = loadApp({ stored: app.storage.get(STORAGE_KEY), now: '2026-10-01T08:00:00' });
  assert.equal(back.run('state.vacation'), null);
  assert.equal(JSON.parse(back.storage.get(STORAGE_KEY)).vacation, null, 'y se guarda así');
  assert.equal(back.run(`isPaused(findHabit('read'), '2026-10-01')`), false);
  assert.equal(back.run(`isPaused(findHabit('teeth'), '2026-10-01')`), true, 'el que ya estaba en pausa, no');
  assert.equal(back.run(`streakInfo(findHabit('read')).current`), 10);
});

test('si reanudaste uno a mano durante las vacaciones, «He vuelto» no lo toca', () => {
  const app = loadApp({ stored: { habits: habits() } });
  app.run(`startVacation()`);
  const later = loadApp({ stored: app.storage.get(STORAGE_KEY), now: '2026-09-30T09:00:00' });
  later.run(`resumeHabit(findHabit('read')); save()`);
  const manual = plain(later.run(`findHabit('read').pauses`));
  later.run('endVacation()');
  assert.deepEqual(plain(later.run(`findHabit('read').pauses`)), manual);
});

test('el modo vacaciones viaja en la copia; lo que no es válido se descarta', () => {
  const app = loadApp({ stored: { habits: habits() } });
  app.run(`startVacation('2026-10-05')`);
  const data = plain(app.run('readBackup(JSON.stringify(backupPayload())).data'));
  assert.deepEqual(data.vacation, plain(app.run('state.vacation')));
  const check = (v) => plain(app.run(`normalizeVacation(${JSON.stringify(v)}, state.habits)`));
  assert.equal(check({ from: 'ayer' }), null);
  assert.deepEqual(check({ from: '2026-09-27', back: '2026-09-20', habits: [{ id: 'read', from: '2026-09-27' }, { id: 'nadie', from: '2026-09-27' }] }),
    { from: '2026-09-27', back: null, habits: [{ id: 'read', from: '2026-09-27' }] });
  assert.equal(plain(app.run('normalize({ habits: [] }).vacation')), null, 'las copias de antes no lo traen');
});

test('la lista de la hoja: qué se pausa y qué sigue igual', () => {
  const app = loadApp({ stored: { habits: habits() } });
  const plan = plain(app.run('(() => { const p = vacationPlan(); return { pause: p.pause.map((x) => [x.habit.id, x.from]), already: p.already.map((h) => h.id) }; })()'));
  assert.deepEqual(plan, { pause: [['read', '2026-09-27'], ['water', '2026-09-28']], already: ['teeth'] });
  const tomorrow = plain(app.run(`vacationPlan('2026-09-28').pause.map((x) => x.habit.id)`));
  assert.deepEqual(tomorrow, ['read'], 'si vuelves mañana, el que hoy ya está hecho no necesita pausa');
});
