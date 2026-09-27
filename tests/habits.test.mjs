// Tipos de hábito, buscador, varias veces al día y hasta 7 veces por semana.
// La fecha fija es el domingo 27 de septiembre de 2026 (semana del lunes 21).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

// Los tipos de antes siguen existiendo: los hábitos creados con ellos no pasan a «Personalizado».
const OLD_TYPES = ['walk', 'run', 'bike', 'workout', 'stretch', 'meditate', 'read', 'study', 'language', 'music',
  'journal', 'water', 'sleep', 'fruit', 'floss', 'vitamins', 'smoke', 'sugar', 'social', 'alcohol', 'custom'];

test('el catálogo: ids únicos, grupos con tipos, nombres, medidas y frecuencias válidas', () => {
  const app = loadApp();
  const types = plain(app.run('HABIT_TYPES'));
  const groups = plain(app.run('TYPE_GROUPS')).map(([g]) => g);
  assert.ok(types.length >= 90, `hay ${types.length} tipos`);
  assert.equal(new Set(types.map((t) => t.id)).size, types.length, 'sin ids repetidos');
  groups.forEach((g) => assert.ok(types.some((t) => t.group === g), `el grupo ${g} tiene tipos`));
  OLD_TYPES.forEach((id) => assert.ok(types.some((t) => t.id === id), `sigue el tipo ${id}`));
  plain(app.run('WELCOME_TYPES')).forEach((id) => assert.ok(types.some((t) => t.id === id), id));
  for (const t of types) {
    assert.ok(groups.includes(t.group), `${t.id}: grupo`);
    if (t.id === 'custom') continue;
    assert.ok(t.name.length > 0 && t.name.length <= 40 && t.emoji, `${t.id}: nombre y emoji`);
    for (const m of t.measures || []) {
      const spec = plain(app.run(`measureSpec(typeOf('${t.id}'), '${m.id}')`));
      assert.ok(spec.unit && spec.def >= spec.min && spec.def <= spec.max, `${t.id}: medida ${m.id}`);
    }
    if (t.goal !== undefined) assert.ok(!t.measures && t.kind !== 'quit' && t.goal >= 2 && t.goal <= 99, `${t.id}: veces al día`);
    if (t.schedule) assert.deepEqual(plain(app.run(`normalizeSchedule(${JSON.stringify(t.schedule)})`)), t.schedule, `${t.id}: frecuencia`);
    if (t.kind === 'quit') {
      // «12 días sin …»: el texto se saca del nombre, así que tiene que quitarle «Dejar de», «Sin», «Menos» o «No».
      assert.notEqual(app.run(`quitWhat({ name: ${JSON.stringify(t.name)} })`), t.name.toLowerCase(), `${t.id}: ${t.name}`);
    }
  }
});

test('lo que se ve en cada tipo: veces al día, por semana, sí o no o su medida', () => {
  const app = loadApp();
  const hint = (id) => app.run(`typeHint(typeOf('${id}'))`);
  assert.equal(hint('eat'), '3 veces al día');
  assert.equal(hint('teeth'), '2 veces al día');
  assert.equal(hint('shop'), '1 vez por semana');
  assert.equal(hint('gym'), '3 veces por semana');
  assert.equal(hint('floss'), 'Sí o no');
  assert.equal(hint('veggies'), 'Raciones');
  assert.equal(hint('walk'), 'Tiempo o pasos');
  assert.equal(hint('junk'), 'Días sin recaer');
});

test('el buscador no distingue tildes ni mayúsculas y usa otras palabras', () => {
  const app = loadApp();
  const found = (q) => plain(app.run(`HABIT_TYPES.filter((t) => t.id !== 'custom' && typeMatches(t, searchText(${JSON.stringify(q)}))).map((t) => t.id)`));
  assert.ok(found('Comer').includes('eat'), '«comer» encuentra «Hacer las comidas»');
  assert.ok(found('comer').includes('fruit'));
  assert.deepEqual(found('dientes').sort(), ['floss', 'teeth']);
  assert.deepEqual(found('CAFE'), ['coffee']);
  assert.deepEqual(found('hacer comidas'), ['eat'], 'todas las palabras tienen que estar');
  assert.ok(found('casa').includes('laundry'), 'también por el nombre del grupo');
  assert.deepEqual(found('zzz'), []);
});

test('varias veces al día: cada toque suma 1 y solo cuenta (y da XP) al llegar a la meta', () => {
  const habit = { id: 't', name: 'Lavarse los dientes', type: 'teeth', goal: 2, created: '2026-09-20', done: {} };
  const app = loadApp({ stored: { habits: [habit] } });
  assert.equal(app.run(`findHabit('t').mode`), 'count');
  assert.equal(app.run(`findHabit('t').goal`), 2);
  const xp0 = app.run('computeStats().xp');
  app.run(`toggleHabit('t', null)`);
  assert.equal(app.run(`findHabit('t').done['2026-09-27']`), 1);
  assert.equal(app.run(`isDone(findHabit('t'), '2026-09-27')`), false);
  assert.equal(app.run(`amountText(findHabit('t'), '2026-09-27')`), '1/2 veces');
  assert.equal(app.run('computeStats().xp'), xp0, 'a medias no da XP');
  app.run(`toggleHabit('t', null)`);
  assert.equal(app.run(`isDone(findHabit('t'), '2026-09-27')`), true);
  assert.ok(app.run('computeStats().xp') > xp0);
  app.run(`toggleHabit('t', null)`);
  assert.equal(app.run(`findHabit('t').done['2026-09-27']`), 2, 'no pasa de la meta');
  assert.match(app.toasts.at(-1), /Meta cumplida/);
  app.run(`stepDown(findHabit('t'), null)`);
  assert.equal(app.run(`amountText(findHabit('t'), '2026-09-27')`), '1/2 veces');
  assert.equal(app.run('computeStats().xp'), xp0);
});

test('los contadores con unidad siguen como antes', () => {
  const water = { id: 'w', name: 'Beber agua', type: 'water', measure: 'glasses', goal: 8, unit: 'vasos', created: '2026-09-20', done: { '2026-09-27': 3 } };
  const app = loadApp({ stored: { habits: [water] } });
  assert.equal(app.run(`amountText(findHabit('w'), '2026-09-27')`), '3/8 vasos');
});

test('hasta 7 veces por semana: la semana se cumple haciéndolo los 7 días', () => {
  const app = loadApp();
  assert.deepEqual(plain(app.run(`normalizeSchedule({ type: 'weekly', times: 7 })`)), { type: 'weekly', times: 7 });
  assert.deepEqual(plain(app.run(`normalizeSchedule({ type: 'weekly', times: 8 })`)), { type: 'daily' });
  assert.deepEqual(plain(app.run(`normalizeSchedule({ type: 'weekly', times: 0 })`)), { type: 'daily' });

  const done = {};
  // Semana del 7: 6 de 7 (no se cumple). Semana del 14: los 7. Esta semana: de lunes a sábado.
  ['07', '08', '09', '10', '11', '12', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26']
    .forEach((d) => { done[`2026-09-${d}`] = 1; });
  const habit = { id: 'g', name: 'Estirar', created: '2026-09-07', schedule: { type: 'weekly', times: 7 }, done };
  const week = loadApp({ stored: { habits: [habit] } });
  assert.deepEqual(plain(week.run(`findHabit('g').schedule`)), { type: 'weekly', times: 7 });
  const info = plain(week.run(`streakInfo(findHabit('g'))`));
  assert.equal(info.unit, 'week');
  assert.equal(info.current, 1, 'la semana en curso aún no rompe ni suma');
  assert.equal(info.best, 1);
  assert.equal(week.run(`weekText(findHabit('g'))`), '6/7 esta semana');
  week.run(`toggleHabit('g', null)`);
  assert.equal(week.run(`streakInfo(findHabit('g')).current`), 2);
  assert.equal(week.run(`weekText(findHabit('g'))`), '✓ 7/7 esta semana');
  assert.equal(week.run(`scheduleLabel(findHabit('g').schedule)`), '7 veces por semana');
});
