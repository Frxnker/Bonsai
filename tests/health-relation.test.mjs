// Salud · relación con tus hábitos: la medida los días que hiciste un hábito frente a los que no, con las mismas
// cuentas que el resto de la app, sin días de descanso ni de pausa y con un mínimo de días en cada grupo.
// La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const run = (app, code) => plain(app.run(code));
// Del lunes 10 de agosto al domingo 27 de septiembre de 2026: 49 días.
const DAYS = Array.from({ length: 49 }, (_, i) => new Date(Date.UTC(2026, 7, 10 + i)).toISOString().slice(0, 10));
const weekday = (key) => (new Date(`${key}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = lunes
const PAUSE = { from: '2026-09-01', to: '2026-09-05' };
const inPause = (d) => d >= PAUSE.from && d <= PAUSE.to;
let n = 0;
const sleep = (date, value) => ({ id: `s${n++}`, metric: 'sleep', unit: 'h', date, value, created: n, note: '' });

// «Leer», diario y en pausa del 1 al 5 de septiembre: hecho los días pares. Esos días duermes 8 h; los demás, 6 h;
// los de la pausa, 12 h (si se contaran, cambiarían las medias).
const read = { id: 'read', name: 'Leer', emoji: '📚', created: '2026-08-01', pauses: [PAUSE],
  done: Object.fromEntries(DAYS.filter((d, i) => i % 2 === 0).map((d) => [d, 1])) };
const readSleep = DAYS.map((d, i) => sleep(d, inPause(d) ? 12 : i % 2 === 0 ? 8 : 6));
// «Leer menos a menudo»: hecho cada 4 días (así su diferencia es menor).
const often = { id: 'often', name: 'Estirar', emoji: '🤸', created: '2026-08-01', done: Object.fromEntries(DAYS.filter((d, i) => i % 4 === 0).map((d) => [d, 1])) };
// Solo 6 días hechos: no llega al mínimo.
const few = { id: 'few', name: 'Nadar', emoji: '🏊', created: '2026-08-01', done: Object.fromEntries(DAYS.slice(0, 6).map((d) => [d, 1])) };

test('los días que lo hiciste frente a los que no, sin contar los días de pausa', () => {
  const app = loadApp({ stored: { habits: [read], health: { metrics: ['sleep'], entries: readSleep } } });
  const r = run(app, `healthHabitRelation('sleep', findHabit('read'), healthDaily('sleep', healthSeries('sleep')))`);
  assert.deepEqual([r.done.days, r.done.mean], [22, 8], '25 días pares menos 3 en pausa');
  assert.deepEqual([r.missed.days, r.missed.mean], [22, 6], '24 impares menos 2 en pausa');
  assert.equal(r.enough, true);
  assert.equal(r.diff, 2);
  const html = app.run(`healthRelationCard('sleep')`);
  assert.match(html, /<h3 class="relation-name"><span aria-hidden="true">📚<\/span> Leer<\/h3>/);
  assert.match(html, /<dt>Los días en que lo hiciste<\/dt><dd>8,0 h <span>de media, 22 días<\/span><\/dd>/);
  assert.match(html, /<dt>Los días en que no<\/dt><dd>6,0 h <span>de media, 22 días<\/span><\/dd>/);
  assert.match(html, /Diferencia: \+2,0 h/);
  assert.match(html, /Es una coincidencia en tus datos, no una causa/);
});

test('sin días de descanso: en uno de lunes, miércoles y viernes solo cuentan esos días', () => {
  // Hecho los lunes y miércoles; los viernes, no. Duermes 7 h los lunes y miércoles, 5 h los viernes y 9 h el resto.
  const gym = { id: 'gym', name: 'Gimnasio', emoji: '🏋️', created: '2026-08-01', schedule: { type: 'days', days: [0, 2, 4] },
    done: Object.fromEntries(DAYS.filter((d) => [0, 2].includes(weekday(d))).map((d) => [d, 1])) };
  const entries = DAYS.map((d) => sleep(d, [0, 2].includes(weekday(d)) ? 7 : weekday(d) === 4 ? 5 : 9));
  const app = loadApp({ stored: { habits: [gym], health: { entries } } });
  const r = run(app, `healthHabitRelation('sleep', findHabit('gym'), healthDaily('sleep', healthSeries('sleep')))`);
  assert.deepEqual([r.done.days, r.done.mean, r.missed.days, r.missed.mean, r.diff], [14, 7, 7, 5, 2]);
});

test('cuadra con el cumplimiento de la ficha del hábito (las mismas funciones)', () => {
  const app = loadApp({ stored: { habits: [read, often, few], health: { entries: readSleep } } });
  for (const id of ['read', 'often', 'few']) {
    // Con un registro cada día de los últimos 30, los dos grupos son los días que tocaban y los hechos.
    const r = run(app, `healthHabitRelation('sleep', findHabit('${id}'), healthDaily('sleep', healthSeries('sleep').filter((e) => e.date >= shiftKey(ui.today, -29))))`);
    const rate = run(app, `habitRate(findHabit('${id}'), 30, 0)`);
    assert.deepEqual([r.done.days + r.missed.days, r.done.days], [rate.due, rate.done], id);
  }
});

test('hoy solo cuenta si ya está hecho', () => {
  const notToday = { id: 'nt', name: 'Meditar', emoji: '🧘', created: '2026-08-01', done: Object.fromEntries(DAYS.slice(0, -1).filter((d, i) => i % 3).map((d) => [d, 1])) };
  const app = loadApp({ stored: { habits: [notToday], health: { entries: readSleep } } });
  assert.equal(app.run(`habitDayOutcome(findHabit('nt'), '2026-09-27')`), null);
  assert.equal(app.run(`habitDayOutcome(findHabit('nt'), '2026-09-26')`), 'done');
  assert.equal(app.run(`habitDayOutcome(findHabit('nt'), '2026-09-24')`), 'missed');
  const withRead = loadApp({ stored: { habits: [read], health: { entries: readSleep } } });
  assert.equal(withRead.run(`habitDayOutcome(findHabit('read'), '2026-09-27')`), 'done');
  assert.equal(withRead.run(`habitDayOutcome(findHabit('read'), '2026-09-02')`), null, 'en pausa');
  assert.equal(withRead.run(`habitDayOutcome(findHabit('read'), '2026-07-31')`), null, 'antes de crearlo');
});

test('solo con un mínimo de días en cada grupo; se ordena por la diferencia y se puede elegir el hábito', () => {
  const app = loadApp({ stored: { habits: [often, few, read], health: { entries: readSleep } } });
  const all = run(app, `healthRelations('sleep').map((r) => [r.habit.id, r.enough, r.diff])`);
  assert.deepEqual(all.map(([id]) => id), ['read', 'often', 'few'], 'de mayor a menor diferencia; sin datos suficientes, al final');
  assert.equal(all[0][2], 2);
  assert.ok(all[1][2] > 0 && all[1][2] < 2);
  assert.deepEqual(all[2].slice(1), [false, null]);
  let html = app.run(`healthRelationCard('sleep')`);
  assert.match(html, /<option value="" selected>Todos con datos suficientes<\/option>/);
  assert.ok(html.indexOf('Leer</h3>') < html.indexOf('Estirar</h3>'));
  assert.doesNotMatch(html, /Nadar<\/h3>/, 'sin datos suficientes, no sale en la lista');
  app.run(`ui.healthRelation = 'few'`);
  html = app.run(`healthRelationCard('sleep')`);
  assert.match(html, /<option value="few" selected>Nadar<\/option>/);
  assert.match(html, /Nadar<\/h3><p class="card-text small">Pocos datos: 6 días en que lo hiciste y 42 días en que no, con registro de sueño\. Hacen falta 7 en cada grupo\./);
  assert.doesNotMatch(html, /Leer<\/h3>/);
  // Si el hábito elegido ya no está, vuelve a «Solo los que tienen datos suficientes».
  app.run(`ui.healthRelation = 'borrado'`);
  assert.match(app.run(`healthRelationCard('sleep')`), /<option value="" selected>/);
});

test('sin ningún hábito con datos suficientes lo dice; sin hábitos o sin registros no sale', () => {
  const app = loadApp({ stored: { habits: [few], health: { entries: readSleep } } });
  assert.match(app.run(`healthRelationCard('sleep')`), /Aún ningún hábito tiene datos suficientes: hacen falta al menos 7 días con registro de sueño/);
  assert.equal(loadApp({ stored: { habits: [], health: { entries: readSleep } } }).run(`healthRelationCard('sleep')`), '');
  assert.equal(loadApp({ stored: { habits: [read], health: { entries: [] } } }).run(`healthRelationCard('sleep')`), '');
});

test('de dejar algo y con límite: los días sin recaer frente a los días con recaída', () => {
  const slips = Object.fromEntries(DAYS.filter((d, i) => i % 3 === 0).map((d) => [d, 1]));
  const smoke = { id: 'smoke', name: 'Dejar de fumar', emoji: '🚭', kind: 'quit', created: '2026-08-01', slips };
  const app = loadApp({ stored: { habits: [smoke], health: { entries: readSleep } } });
  const html = app.run(`healthRelationCard('sleep')`);
  assert.match(html, /<dt>Los días sin recaer<\/dt>/);
  assert.match(html, /<dt>Los días con recaída<\/dt>/);
  const limit = { id: 'c', name: 'Limitar el café', emoji: '☕', kind: 'quit', limit: 2, measure: 'coffees', unit: 'cafés', created: '2026-08-01',
    done: Object.fromEntries(DAYS.map((d, i) => [d, i % 3 === 0 ? 3 : 1])) };
  const lim = loadApp({ stored: { habits: [limit], health: { entries: readSleep } } });
  assert.match(lim.run(`healthRelationCard('sleep')`), /<dt>Los días sin pasarte<\/dt>[\s\S]*<dt>Los días en que te pasaste<\/dt>/);
});

test('medidas de nivel: la media de cada día; la tensión, sistólica y diastólica', () => {
  const walk = { id: 'walk', name: 'Caminar', emoji: '🚶', created: '2026-08-01', done: Object.fromEntries(DAYS.filter((d, i) => i % 2 === 0).map((d) => [d, 1])) };
  const entries = DAYS.flatMap((d, i) => [
    { id: `w${i}a`, metric: 'weight', unit: 'kg', date: d, value: i % 2 === 0 ? 70 : 72, created: 1 },
    { id: `w${i}b`, metric: 'weight', unit: 'kg', date: d, value: i % 2 === 0 ? 71 : 72, created: 2 }, // dos el mismo día
    { id: `b${i}`, metric: 'bloodPressure', unit: 'mmHg', date: d, value: i % 2 === 0 ? 120 : 126, value2: i % 2 === 0 ? 78 : 80, created: 3 },
  ]);
  const app = loadApp({ stored: { habits: [walk], health: { entries } } });
  const w = run(app, `healthRelations('weight')[0]`);
  assert.deepEqual([w.done.mean, w.missed.mean, w.diff, w.done.days], [70.5, 72, -1.5, 25]);
  const bp = run(app, `healthRelations('bloodPressure')[0]`);
  assert.deepEqual([bp.diff, bp.diff2], [-6, -2]);
  assert.match(app.run(`healthRelationCard('bloodPressure')`), /<dd>120\/78 mmHg <span>de media, 25 días<\/span><\/dd>[\s\S]*Diferencia: −6\/−2 mmHg/);
});

test('mirar la relación no cambia nada: ni tus datos, ni la XP, ni las rachas', () => {
  const app = loadApp({ stored: { habits: [read, often, few], health: { entries: readSleep } } });
  const before = [run(app, 'state'), run(app, 'computeStats()'), run(app, 'state.habits.map((h) => streakInfo(h))')];
  app.run(`healthRelationCard('sleep'); healthRelations('sleep')`);
  assert.deepEqual([run(app, 'state'), run(app, 'computeStats()'), run(app, 'state.habits.map((h) => streakInfo(h))')], before);
  const noHealth = loadApp({ stored: { habits: [read, often, few] } });
  assert.deepEqual(run(app, 'computeStats()'), run(noHealth, 'computeStats()'));
});
