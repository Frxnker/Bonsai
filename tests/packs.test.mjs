// Fase 7: packs para empezar. Crean varios hábitos del catálogo y su rutina de una vez, sin duplicar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

test('cada pack usa tipos del catálogo y un nombre que vale como rutina', () => {
  const app = loadApp();
  const packs = plain(app.run('PACKS'));
  assert.ok(packs.length >= 5);
  for (const p of packs) {
    assert.ok(p.name.length <= app.run('ROUTINE_NAME_MAX'), p.name);
    assert.ok(p.types.length >= 3 && p.types.length <= 6, p.name);
    p.types.forEach((id) => assert.equal(app.run(`typeOf('${id}').id`), id, `${p.name}: ${id}`));
    assert.equal(new Set(p.types).size, p.types.length, `${p.name}: sin repetidos`);
  }
});

test('«Dormir mejor» crea sus hábitos con lo que propone cada tipo y su rutina', () => {
  const app = loadApp();
  const created = plain(app.run(`addPack(findPack('sleep'), findPack('sleep').types, true).map((h) => ({ name: h.name, type: h.type, kind: h.kind, goal: h.goal, unit: h.unit, mode: h.mode, measure: h.measure }))`));
  assert.deepEqual(created, [
    { name: 'Sin pantallas antes de dormir', type: 'unplug', kind: 'build', goal: 1, unit: '', mode: 'count', measure: '' },
    { name: 'Acostarse pronto', type: 'bedtime', kind: 'build', goal: 1, unit: '', mode: 'count', measure: '' },
    { name: 'Dormir bien', type: 'sleep', kind: 'build', goal: 8, unit: 'h', mode: 'target', measure: 'hours' },
    { name: 'Menos café', type: 'coffee', kind: 'quit', goal: 1, unit: '', mode: 'count', measure: '' },
  ]);
  const routines = plain(app.run('state.routines'));
  assert.equal(routines.length, 1);
  assert.equal(routines[0].name, 'Dormir mejor');
  assert.deepEqual(routines[0].habitIds, plain(app.run('state.habits.map((h) => h.id)')));
  assert.equal(new Set(plain(app.run('state.habits.map((h) => h.color)'))).size, 4, 'cada uno con su color');
  // Tras guardar y volver a cargar, todo es válido.
  assert.equal(plain(app.run('normalize(JSON.parse(JSON.stringify(state))).habits.length')), 4);
});

test('si ya tienes uno de ese tipo (o con ese nombre), avisa y no lo duplica salvo que lo elijas', () => {
  const existing = [
    { id: 'z', name: 'Dormir 8 horas', type: 'sleep', created: '2026-09-01', done: { '2026-09-26': 8 }, mode: 'target', measure: 'hours', goal: 8, unit: 'h' },
    { id: 'c', name: 'menos CAFÉ', kind: 'quit', created: '2026-09-01' },
  ];
  const app = loadApp({ stored: { habits: existing } });
  const plan = plain(app.run(`packPlan(findPack('sleep')).items.map((it) => [it.type.id, it.existing && it.existing.id])`));
  assert.deepEqual(plan, [['unplug', null], ['bedtime', null], ['sleep', 'z'], ['coffee', 'c']]);
  const before = plain(app.run(`streakInfo(findHabit('z'))`));
  // Lo normal: solo los que no tienes. La rutina recoge también los que ya tenías.
  app.run(`addPack(findPack('sleep'), ['unplug', 'bedtime'], true)`);
  assert.equal(app.run('state.habits.length'), 4, 'sin duplicados');
  assert.deepEqual(plain(app.run('state.routines[0].habitIds.length')), 4);
  assert.deepEqual(plain(app.run(`streakInfo(findHabit('z'))`)), before, 'los que ya tenías no cambian');
  // Si lo eliges a propósito, sí se crea otro.
  app.run(`addPack(findPack('sleep'), ['sleep'], true)`);
  assert.equal(app.run(`state.habits.filter((h) => h.type === 'sleep').length`), 2);
  assert.equal(app.run('state.routines.length'), 1, 'se añade a la rutina que ya existe, sin crear otra');
});

test('los que ya están en otra rutina no se mueven; sin hueco para más rutinas, se añaden sin rutina', () => {
  const habits = [{ id: 'm', name: 'Meditar', type: 'meditate', created: '2026-09-01', done: {} }];
  const app = loadApp({ stored: { habits, routines: [{ id: 'r1', name: 'Noche', habitIds: ['m'] }] } });
  app.run(`addPack(findPack('calm'), ['breathe', 'gratitude', 'journal'], true)`);
  const calm = plain(app.run(`state.routines.find((r) => r.name === 'Mente en calma')`));
  assert.equal(calm.habitIds.length, 3);
  assert.deepEqual(plain(app.run(`state.routines.find((r) => r.id === 'r1').habitIds`)), ['m'], 'Meditar sigue en «Noche»');

  const full = loadApp({ stored: { habits: [], routines: Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, name: `R${i}`, habitIds: [] })) } });
  assert.equal(full.run(`packPlan(findPack('move')).canRoutine`), false);
  full.run(`addPack(findPack('move'), findPack('move').types, true)`);
  assert.equal(full.run('state.habits.length'), 4);
  assert.equal(full.run('state.routines.length'), 12);
});

test('los tipos con veces al día y los semanales llegan con su propuesta', () => {
  const app = loadApp();
  const food = plain(app.run(`addPack(findPack('food'), ['eat'], false).map((h) => [h.goal, h.mode])`));
  assert.deepEqual(food, [[3, 'count']]);
  const home = plain(app.run(`addPack(findPack('home'), ['laundry'], false).map((h) => h.schedule)`));
  assert.deepEqual(home, [{ type: 'weekly', times: 2 }]);
  assert.equal(app.run('state.routines.length'), 0, 'sin marcar la rutina, no se crea');
});
