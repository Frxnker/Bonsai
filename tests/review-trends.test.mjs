// Fase 3: revisión semanal y tendencias descriptivas. La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Días entre dos fechas (incluidas) que cumplen `fn(díaDeLaSemana)`, con 0 = lunes.
function daysWhere(from, to, fn) {
  const out = {};
  for (let d = new Date(`${from}T12:00`); key(d) <= to; d.setDate(d.getDate() + 1)) {
    if (fn((d.getDay() + 6) % 7)) out[key(d)] = 1;
  }
  return out;
}

test('el resumen de cada semana expone lo que tocaba y lo hecho por hábito', () => {
  const app = loadApp({
    stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-14': 1, '2026-09-15': 1 } }] },
  });
  const rows = plain(app.run(`weekSummary('2026-09-14').rows.map((r) => ({ id: r.habit.id, due: r.due, done: r.done }))`));
  assert.deepEqual(rows, [{ id: 'h1', due: 7, done: 2 }]);
});

test('la revisión solo recorre semanas completas con historial', () => {
  const app = loadApp({ stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: {} }] } });
  const bounds = plain(app.run('reviewBounds()'));
  assert.deepEqual(bounds, { first: '2026-09-07', last: '2026-09-14' });
});

// La semana en curso sigue las reglas de pausa de siempre (un reto puede cambiar de objetivo, como al pausar
// desde la edición); lo que se comprueba aquí es que nada de lo anterior a hoy cambia.
test('pausar desde la revisión empieza hoy y no cambia días, XP ni retos anteriores', () => {
  const done = daysWhere('2026-09-01', '2026-09-26', () => true);
  const app = loadApp({ stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-09-01', done }], challengesSince: '2026-09-01' } });
  const past = () => plain(app.run(`({
    xp: streakInfo(findHabit('h1')).xp,
    best: streakInfo(findHabit('h1')).best,
    perfect: computeStats().perfectDays,
    weeks: ['2026-08-31', '2026-09-07', '2026-09-14'].map((ws) => weekChallenges(ws).map((c) => c.done)),
  })`));
  const before = past();
  app.run(`ui.reviewArchived = new Set(); applyReviewAction(findHabit('h1'), 'pause')`);
  const habit = plain(app.run(`findHabit('h1')`));
  assert.deepEqual(habit.pauses, [{ from: '2026-09-27', to: '2026-09-27' }]);
  assert.deepEqual(habit.done, done);
  assert.deepEqual(past(), before);
  assert.equal(plain(app.run(`streakInfo(findHabit('h1'))`)).current, 26);
});

test('si hoy ya está hecho, la pausa empezaría mañana (fuera de esta semana) y no toca hoy', () => {
  const app = loadApp({ stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-27': 1 } }] } });
  assert.equal(app.run(`firstFreeDay(findHabit('h1'))`), '2026-09-28');
  assert.ok(app.run(`firstFreeDay(findHabit('h1')) > shiftKey(weekStartOf(ui.today), 6)`), 'no se ofrece pausar esta semana');
});

test('archivar y restaurar desde la revisión deja el hábito como estaba', () => {
  const done = daysWhere('2026-09-01', '2026-09-26', () => true);
  const app = loadApp({ stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-09-01', done }] } });
  const before = plain(app.run(`findHabit('h1')`));
  app.run(`ui.reviewArchived = new Set(); applyReviewAction(findHabit('h1'), 'archive')`);
  assert.equal(app.run(`findHabit('h1').archived`), '2026-09-27');
  assert.equal(app.run(`ui.reviewArchived.has('h1')`), true);
  app.run(`applyReviewAction(findHabit('h1'), 'restore')`);
  assert.deepEqual(plain(app.run(`findHabit('h1')`)), before);
});

test('reanudar desde la revisión quita la pausa que empezaba hoy', () => {
  const app = loadApp({ stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: {}, pauses: [{ from: '2026-09-27', to: '2026-09-27' }] }] } });
  app.run(`ui.reviewArchived = new Set(); applyReviewAction(findHabit('h1'), 'resume')`);
  assert.deepEqual(plain(app.run(`findHabit('h1').pauses`)), []);
});

test('con pocos datos las tendencias no enseñan cifras', () => {
  const app = loadApp({ stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-09-17', done: { '2026-09-18': 1 } }] } });
  const t = plain(app.run('trendData(4)'));
  assert.equal(t.from, '2026-08-24');
  assert.equal(t.to, '2026-09-20');
  assert.equal(t.weekday.enough, false);
  assert.deepEqual(t.habits, []);
  assert.equal(t.mood.enough, false);
});

test('las tendencias por día de la semana describen el periodo sin causas', () => {
  // Diario desde agosto, hecho solo lunes y martes.
  const app = loadApp({
    stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-08-01', done: daysWhere('2026-08-01', '2026-09-26', (wd) => wd <= 1) }] },
  });
  const t = plain(app.run('trendData(4)'));
  assert.equal(t.weekday.enough, true);
  assert.deepEqual(t.weekday.rates, [1, 1, 0, 0, 0, 0, 0]);
  const text = app.run(`weekdayObservation(${JSON.stringify(t.weekday.rates)})`);
  assert.equal(text, 'Los lunes completaste el 100\u00A0% de lo que tocaba; los miércoles, el 0\u00A0%.');
  assert.doesNotMatch(text, /porque|debido|deberías|mejor|peor/i);
});

test('los días de la semana sin datos suficientes quedan fuera', () => {
  // De lunes a viernes: el fin de semana nunca toca, así que no se compara.
  const app = loadApp({
    stored: {
      habits: [{
        id: 'h1', name: 'Leer', created: '2026-08-01', schedule: { type: 'days', days: [0, 1, 2, 3, 4] },
        done: daysWhere('2026-08-01', '2026-09-26', (wd) => wd < 5),
      }],
    },
  });
  const t = plain(app.run('trendData(4)'));
  assert.deepEqual(t.weekday.rates, [1, 1, 1, 1, 1, null, null]);
  assert.match(app.run(`weekdayObservation(${JSON.stringify(t.weekday.rates)})`), /poca diferencia/);
});

test('cada hábito se compara con el periodo anterior solo si hay datos en los dos', () => {
  const done = {
    ...daysWhere('2026-07-27', '2026-08-23', (wd) => wd < 3), // antes: 3 de 7 días
    ...daysWhere('2026-08-24', '2026-09-20', () => true),     // ahora: todos
  };
  const app = loadApp({
    stored: {
      habits: [
        { id: 'viejo', name: 'Leer', created: '2026-07-01', done },
        { id: 'nuevo', name: 'Meditar', created: '2026-09-07', done: daysWhere('2026-09-07', '2026-09-20', () => true) },
        { id: 'reciente', name: 'Correr', created: '2026-09-17', done: {} },
      ],
    },
  });
  const habits = plain(app.run('trendData(4).habits.map((x) => ({ id: x.habit.id, now: x.now, before: x.before }))'));
  assert.deepEqual(habits.map((h) => h.id), ['viejo', 'nuevo']);
  assert.equal(habits[0].now, 1);
  assert.equal(Math.round(habits[0].before * 100), 43);
  assert.equal(habits[1].before, null);
  const text = app.run(`habitTrendText(trendData(4).habits[0], 4)`);
  assert.equal(text, '100\u00A0% de lo que tocaba · más que en las 4 semanas anteriores (43\u00A0%)');
  const habit = `findHabit('viejo')`;
  assert.equal(app.run(`habitTrendText({ habit: ${habit}, now: 0.5, before: 0.8 }, 4)`), '50\u00A0% de lo que tocaba · menos que en las 4 semanas anteriores (80\u00A0%)');
  assert.equal(app.run(`habitTrendText({ habit: ${habit}, now: 0.75, before: 0.7 }, 4)`), '75\u00A0% de lo que tocaba · parecido a las 4 semanas anteriores (70\u00A0%)');
  assert.equal(app.run(`habitTrendText({ habit: ${habit}, now: 0.75, before: null }, 4)`), '75\u00A0% de lo que tocaba · aún no hay datos suficientes de las 4 semanas anteriores');
});

test('el ánimo solo se resume con suficientes días apuntados', () => {
  const days = {};
  ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'].forEach((d) => { days[d] = { mood: 4 }; });
  const few = loadApp({ stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-08-01' }], days } });
  assert.equal(plain(few.run('trendData(4)')).mood.enough, false);
  days['2026-09-07'] = { mood: 2 };
  const enough = loadApp({ stored: { habits: [{ id: 'h1', name: 'Leer', created: '2026-08-01' }], days } });
  const mood = plain(enough.run('trendData(4)')).mood;
  assert.equal(mood.enough, true);
  assert.equal(mood.count, 7);
  assert.equal(Math.round(mood.avg * 100) / 100, 3.71);
});
