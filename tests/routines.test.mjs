// Fase 4: rutinas. Solo agrupan hábitos: nunca borran hábitos, ni cambian sus días, ni dan XP.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const habits = [
  { id: 'a', name: 'Meditar', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } },
  { id: 'b', name: 'Agua', created: '2026-09-01', done: { '2026-09-26': 1 } },
  { id: 'c', name: 'Leer', created: '2026-09-01', done: {} },
];
const snapshot = (app) => plain(app.run('({ habits: state.habits, stats: computeStats() })'));

test('los datos y copias sin rutinas empiezan sin ninguna', () => {
  const app = loadApp({ stored: { habits } });
  assert.deepEqual(plain(app.run('state.routines')), []);
});

test('la normalización descarta ids desconocidos, repetidos y nombres vacíos', () => {
  const app = loadApp();
  const data = {
    habits,
    routines: [
      { id: 'r1', name: '  Mañana  ', habitIds: ['a', 'zzz', 'a', 'b'] },
      { id: 'r2', name: 'Noche', habitIds: ['b', 'c'] },
      { id: 'r1', name: 'Repetida', habitIds: [] },
      { id: 'r3', name: '   ', habitIds: ['c'] },
      null,
    ],
  };
  const routines = plain(app.run(`normalize(${JSON.stringify(data)}).routines`));
  assert.equal(routines.length, 3);
  assert.deepEqual(routines[0], { id: 'r1', name: 'Mañana', habitIds: ['a', 'b'] });
  assert.deepEqual(routines[1], { id: 'r2', name: 'Noche', habitIds: ['c'] }, 'un hábito solo está en una rutina');
  assert.notEqual(routines[2].id, 'r1', 'los ids repetidos se renuevan');
});

test('crear una rutina no cambia hábitos, días ni XP', () => {
  const app = loadApp({ stored: { habits } });
  const before = snapshot(app);
  const result = plain(app.run(`saveRoutine({ name: 'Mañana', habitIds: ['a', 'b'] })`));
  assert.deepEqual(result.routine.habitIds, ['a', 'b']);
  assert.deepEqual(snapshot(app), before);
});

test('valida el nombre y no repite rutinas con el mismo nombre', () => {
  const app = loadApp({ stored: { habits } });
  assert.match(plain(app.run(`saveRoutine({ name: '   ' })`)).errors.name, /nombre/);
  app.run(`saveRoutine({ name: 'Mañana' })`);
  assert.match(plain(app.run(`saveRoutine({ name: 'mañana' })`)).errors.name, /Ya tienes/);
  assert.equal(app.run('state.routines.length'), 1);
});

test('elegir un hábito en una rutina lo saca de la anterior', () => {
  const app = loadApp({ stored: { habits } });
  app.run(`saveRoutine({ name: 'Mañana', habitIds: ['a', 'b'] })`);
  app.run(`saveRoutine({ name: 'Noche', habitIds: ['b', 'c'] })`);
  assert.deepEqual(plain(app.run('state.routines.map((r) => r.habitIds)')), [['a'], ['b', 'c']]);
});

test('editar una rutina conserva a los archivados que ya estaban', () => {
  const app = loadApp({ stored: { habits: [...habits, { id: 'x', name: 'Viejo', created: '2026-09-01', archived: '2026-09-20' }], routines: [{ id: 'r1', name: 'Mañana', habitIds: ['a', 'x'] }] } });
  app.run(`saveRoutine({ id: 'r1', name: 'Mañanas', habitIds: ['b'] })`);
  assert.deepEqual(plain(app.run('state.routines[0]')), { id: 'r1', name: 'Mañanas', habitIds: ['b', 'x'] });
});

test('reordenar rutinas solo cambia su orden', () => {
  const app = loadApp({ stored: { habits } });
  app.run(`saveRoutine({ name: 'Mañana', habitIds: ['a'] }); saveRoutine({ name: 'Tarde' }); saveRoutine({ name: 'Noche', habitIds: ['c'] })`);
  const before = snapshot(app);
  const noche = app.run(`state.routines[2].id`);
  app.run(`moveRoutine('${noche}', -1); moveRoutine('${noche}', -1); moveRoutine('${noche}', -1)`);
  assert.deepEqual(plain(app.run('state.routines.map((r) => r.name)')), ['Noche', 'Mañana', 'Tarde']);
  assert.deepEqual(snapshot(app), before);
});

test('eliminar una rutina no borra sus hábitos ni sus días', () => {
  const app = loadApp({ stored: { habits, routines: [{ id: 'r1', name: 'Mañana', habitIds: ['a', 'b'] }] } });
  const before = snapshot(app);
  app.run(`deleteRoutine('r1')`);
  assert.deepEqual(plain(app.run('state.routines')), []);
  assert.deepEqual(snapshot(app), before);
});

test('borrar un hábito lo quita de su rutina, que sigue existiendo', () => {
  const app = loadApp({ stored: { habits, routines: [{ id: 'r1', name: 'Mañana', habitIds: ['a', 'b'] }] } });
  app.run(`deleteHabit(findHabit('a'))`);
  assert.deepEqual(plain(app.run('state.routines')), [{ id: 'r1', name: 'Mañana', habitIds: ['b'] }]);
});

test('en Hoy los hábitos se reparten por rutina y el resto va aparte', () => {
  const app = loadApp({ stored: { habits, routines: [{ id: 'r1', name: 'Noche', habitIds: ['c'] }, { id: 'r2', name: 'Vacía', habitIds: [] }] } });
  const groups = plain(app.run(`(() => {
    const { groups, rest } = routineGroups(visibleHabits());
    return { groups: groups.map((g) => [g.routine.name, g.habits.map((h) => h.id)]), rest: rest.map((h) => h.id) };
  })()`));
  assert.deepEqual(groups, { groups: [['Noche', ['c']]], rest: ['a', 'b'] });
});

test('una rutina completa no da XP extra ni marca nada', () => {
  const plainApp = loadApp({ stored: { habits } });
  const withRoutine = loadApp({ stored: { habits, routines: [{ id: 'r1', name: 'Mañana', habitIds: ['a', 'b'] }] } });
  assert.deepEqual(plain(withRoutine.run('computeStats()')), plain(plainApp.run('computeStats()')));
  assert.deepEqual(plain(withRoutine.run('state.habits')), plain(plainApp.run('state.habits')));
});

test('la rutina de un hábito se puede cambiar desde su edición', () => {
  const app = loadApp({ stored: { habits, routines: [{ id: 'r1', name: 'Mañana', habitIds: ['a'] }, { id: 'r2', name: 'Noche', habitIds: [] }] } });
  app.run(`setHabitRoutine('a', 'r2')`);
  assert.deepEqual(plain(app.run('state.routines.map((r) => r.habitIds)')), [[], ['a']]);
  app.run(`setHabitRoutine('a', '')`);
  assert.deepEqual(plain(app.run('state.routines.map((r) => r.habitIds)')), [[], []]);
});

test('las rutinas viajan en la copia y se recuperan al importarla', () => {
  const app = loadApp({ stored: { habits, routines: [{ id: 'r1', name: 'Mañana', habitIds: ['a'] }] } });
  const backup = plain(app.run(`readBackup(JSON.stringify(backupPayload()))`));
  assert.deepEqual(backup.data.routines, [{ id: 'r1', name: 'Mañana', habitIds: ['a'] }]);
});
