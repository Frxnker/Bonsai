// Fase 2: la ficha de cada hábito. Todo sale del historial con las funciones de las rachas.
// La fecha fija es el domingo 27 de septiembre de 2026 (semana del lunes 21).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

// Días entre dos fechas (ambas incluidas), como claves AAAA-MM-DD.
function days(from, to) {
  const out = [];
  for (let d = new Date(`${from}T12:00:00`); d <= new Date(`${to}T12:00:00`); d.setDate(d.getDate() + 1)) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}
const marks = (list, value = 1) => Object.fromEntries(list.map((d) => [d, value]));

test('cumplimiento de 30 días: solo los días que tocaba, sin pausas, y hoy solo si ya está hecho', () => {
  // Desde el 29 ago (30 días hasta hoy). Hecho todo menos del 10 al 14 sept; en pausa del 20 al 22.
  const all = days('2026-08-29', '2026-09-26').filter((d) => d < '2026-09-10' || d > '2026-09-14');
  const habit = { id: 'a', name: 'Leer', created: '2026-08-29', done: marks(all), pauses: [{ from: '2026-09-20', to: '2026-09-22' }] };
  const app = loadApp({ stored: { habits: [habit] } });
  const r30 = plain(app.run(`habitRate(findHabit('a'), 30, 0)`));
  // 29 días pasados − 3 en pausa = 26 que tocaban; 5 sin hacer → 21 hechos. Hoy aún no está hecho: no cuenta.
  assert.deepEqual(r30, { unit: 'day', due: 26, done: 21, rate: 21 / 26 });
  app.run(`toggleHabit('a', null)`);
  assert.deepEqual(plain(app.run(`habitRate(findHabit('a'), 30, 0)`)), { unit: 'day', due: 27, done: 22, rate: 22 / 27 }, 'hecho hoy: cuenta');
  const r90 = plain(app.run(`habitRate(findHabit('a'), 90, 0)`));
  assert.equal(r90.due, 27, 'antes de crearlo no cuenta');
});

test('en los de algunos días, los de descanso no cuentan', () => {
  // Lunes, miércoles y viernes; hecho todos esos días y también algún día de descanso (día extra).
  const mwf = days('2026-08-29', '2026-09-26').filter((d) => [1, 3, 5].includes(new Date(`${d}T12:00:00`).getDay()));
  const habit = { id: 'b', name: 'Correr', created: '2026-08-29', schedule: { type: 'days', days: [0, 2, 4] }, done: marks([...mwf, '2026-09-13']) };
  const app = loadApp({ stored: { habits: [habit] } });
  const r = plain(app.run(`habitRate(findHabit('b'), 30, 0)`));
  assert.equal(r.due, mwf.length);
  assert.equal(r.done, mwf.length);
  assert.equal(r.rate, 1, 'los días extra no suben de 100 %');
});

test('los semanales cuentan por semanas, como el resumen semanal', () => {
  // 3 veces por semana desde el lunes 24 ago. Semanas del 24 ago, 31 ago, 7 sept: cumplidas; 14 sept: 2 de 3;
  // del 21 sept (la actual): 1 de 3, aún en curso.
  const done = marks(['2026-08-24', '2026-08-26', '2026-08-28', '2026-08-31', '2026-09-01', '2026-09-02',
    '2026-09-07', '2026-09-09', '2026-09-11', '2026-09-14', '2026-09-16', '2026-09-22']);
  const habit = { id: 'w', name: 'Nadar', created: '2026-08-24', schedule: { type: 'weekly', times: 3 }, done };
  const app = loadApp({ stored: { habits: [habit] } });
  assert.deepEqual(plain(app.run(`habitRate(findHabit('w'), 0, 4)`)), { unit: 'week', due: 3, done: 2, rate: 2 / 3 }, 'las 4 últimas: sin la actual');
  assert.deepEqual(plain(app.run(`habitRate(findHabit('w'), 0, 13)`)), { unit: 'week', due: 4, done: 3, rate: 3 / 4 });
  // Cada semana pasada que cuenta la ficha es una semana con fila en el resumen semanal.
  const summaryWeeks = app.run(`[1, 2, 3, 4, 5, 6].filter((i) => weekSummary(shiftKey(weekStartOf(ui.today), -7 * i)).rows.some((r) => r.habit.id === 'w')).length`);
  assert.equal(summaryWeeks, 4);
  // Al cumplir la semana en curso, ya cuenta.
  app.run(`findHabit('w').done['2026-09-24'] = 1; findHabit('w').done['2026-09-25'] = 1; save()`);
  assert.deepEqual(plain(app.run(`habitRate(findHabit('w'), 0, 4)`)), { unit: 'week', due: 4, done: 3, rate: 3 / 4 });
});

test('las rachas anteriores salen con sus fechas y cuadran con la racha y la mejor racha', () => {
  // Del 1 al 7 sept (7), falla el 8, del 9 al 12 (4), falla el 13, del 14 al 26 (13, sigue viva hoy).
  const done = marks([...days('2026-09-01', '2026-09-07'), ...days('2026-09-09', '2026-09-12'), ...days('2026-09-14', '2026-09-26')]);
  const app = loadApp({ stored: { habits: [{ id: 'r', name: 'Leer', created: '2026-09-01', done }] } });
  const s = plain(app.run(`streakInfo(findHabit('r'))`));
  assert.deepEqual(s.runs, [
    { from: '2026-09-01', to: '2026-09-07', length: 7 },
    { from: '2026-09-09', to: '2026-09-12', length: 4 },
    { from: '2026-09-14', to: '2026-09-26', length: 13, current: true },
  ]);
  assert.equal(s.current, 13);
  assert.equal(s.best, 13);
  s.runs.forEach((r) => assert.equal(s.runOn[r.to], r.length, 'la racha de su último día es su longitud'));
  const html = app.run(`detailStreaksCard(streakInfo(findHabit('r')), 'r')`);
  assert.match(html, /Racha actual: <b>13 días<\/b>, desde el 14 sept/);
  assert.match(html, /<b>4 días<\/b><span>del 9 sept al 12 sept<\/span>/);
  assert.match(html, /<b>7 días<\/b><span>del 1 sept al 7 sept<\/span>/);
});

test('un día protegido y los de descanso no cortan la racha; en los de dejar algo, las recaídas sí', () => {
  const done = marks(['2026-09-21', '2026-09-22', '2026-09-24', '2026-09-25']);
  const app = loadApp({
    stored: {
      habits: [
        { id: 'p', name: 'Estirar', created: '2026-09-21', done, shields: { '2026-09-23': 1 } },
        { id: 'q', name: 'Sin fumar', kind: 'quit', created: '2026-09-15', slips: { '2026-09-20': 1 } },
      ],
    },
  });
  // El 23, protegido, no la corta; el 26 no se hizo y ahí acaba (hoy aún no está hecho).
  assert.deepEqual(plain(app.run(`streakInfo(findHabit('p')).runs`)), [{ from: '2026-09-21', to: '2026-09-25', length: 4 }]);
  assert.deepEqual(plain(app.run(`streakInfo(findHabit('q')).runs`)), [
    { from: '2026-09-15', to: '2026-09-19', length: 5 },
    { from: '2026-09-21', to: '2026-09-27', length: 7, current: true },
  ]);
  const quit = app.run(`detailQuitCard(findHabit('q'), streakInfo(findHabit('q')))`);
  assert.match(quit, /<b>7<\/b><span>Días seguidos ahora/);
  assert.match(quit, /<b>12<\/b><span>Días sin recaer en total/);
  assert.match(quit, /<b>1<\/b><span>Recaídas/);
  assert.match(quit, /Domingo, 20 de septiembre/);
});

test('las rachas de los semanales van por semanas, de lunes a domingo', () => {
  const done = marks(['2026-08-31', '2026-09-01', '2026-09-07', '2026-09-08', '2026-09-21', '2026-09-22']);
  const app = loadApp({ stored: { habits: [{ id: 'w', name: 'Nadar', created: '2026-08-31', schedule: { type: 'weekly', times: 2 }, done }] } });
  assert.deepEqual(plain(app.run(`streakInfo(findHabit('w')).runs`)), [
    { from: '2026-08-31', to: '2026-09-13', length: 2 },
    { from: '2026-09-21', to: '2026-09-27', length: 1, current: true },
  ]);
});

test('mejor día de la semana: el de mayor cumplimiento, o el que más lo haces si es semanal', () => {
  // Diario: los lunes siempre, los demás días la mitad de las veces.
  const all = days('2026-06-30', '2026-09-26');
  const done = marks(all.filter((d, i) => new Date(`${d}T12:00:00`).getDay() === 1 || i % 2 === 0));
  const app = loadApp({ stored: { habits: [{ id: 'd', name: 'Leer', created: '2026-06-30', done }] } });
  const best = plain(app.run(`bestWeekday(findHabit('d'))`));
  assert.equal(best.enough, true);
  assert.deepEqual(best.days, [0]);
  assert.equal(best.rate, 1);
  assert.match(app.run(`detailWeekdayCard(findHabit('d'))`), /En los últimos 90 días, los lunes \(100\s%/);

  const weekly = { id: 'w', name: 'Nadar', created: '2026-06-30', schedule: { type: 'weekly', times: 1 },
    done: marks(all.filter((d) => new Date(`${d}T12:00:00`).getDay() === 6)) };
  const app2 = loadApp({ stored: { habits: [weekly] } });
  const w = plain(app2.run(`bestWeekday(findHabit('w'))`));
  assert.equal(w.weekly, true);
  assert.deepEqual(w.days, [5]);
  assert.match(app2.run(`detailWeekdayCard(findHabit('w'))`), /lo haces más los sábados/);

  const fresh = loadApp({ stored: { habits: [{ id: 'n', name: 'Nuevo', created: '2026-09-25', done: {} }] } });
  assert.equal(plain(fresh.run(`bestWeekday(findHabit('n'))`)).enough, false, 'sin datos suficientes no se inventa nada');
});

test('la gráfica de cantidades: 30 días, la meta y una tabla con los datos', () => {
  const done = { '2026-09-27': 12, '2026-09-26': 20, '2026-09-25': 25, '2026-09-20': 5 };
  const app = loadApp({ stored: { habits: [{ id: 'r', name: 'Leer', type: 'read', mode: 'target', measure: 'pages', goal: 20, unit: 'páginas', created: '2026-08-01', done }] } });
  const series = plain(app.run(`amountSeries(findHabit('r'))`));
  assert.equal(series.length, 30);
  assert.equal(series.at(-1).key, '2026-09-27');
  assert.equal(series.at(-1).value, 12);
  const html = app.run(`detailAmountCard(findHabit('r'))`);
  assert.equal((html.match(/<rect /g) || []).length, 30);
  assert.equal((html.match(/class="met/g) || []).length, 2, 'dos días con la meta cumplida');
  assert.match(html, /Meta: 20 páginas/);
  assert.match(html, /apuntaste algo 4 días, con una media de 15,5 páginas esos días, y llegaste a la meta 2 días/);
  assert.match(html, /<th scope="row">Vie, 25 sept<\/th><td>25 páginas<\/td>/);
});

test('las notas salen en la ficha, de la más reciente a la más antigua', () => {
  const notes = { '2026-09-20': 'Primera', '2026-09-26': 'Última', '2026-09-22': 'En medio' };
  const app = loadApp({ stored: { habits: [{ id: 'r', name: 'Leer', created: '2026-09-01', done: {}, notes }] } });
  const html = app.run(`detailNotesCard(findHabit('r'))`);
  const order = [...html.matchAll(/detail-note-text">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(order, ['Última', 'En medio', 'Primera']);
  assert.match(html, /Añadir una nota de hoy/);
});

test('abrir la ficha no cambia nada de la XP ni de las rachas', () => {
  const app = loadApp({ stored: { habits: [{ id: 'r', name: 'Leer', created: '2026-09-01', done: marks(days('2026-09-01', '2026-09-20')) }] } });
  const before = plain(app.run('computeStats()'));
  app.run(`openHabitDetail('r'); renderHabitDetail()`);
  assert.deepEqual(plain(app.run('computeStats()')), before);
});
