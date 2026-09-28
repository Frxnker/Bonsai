// Salud · resumen de cada medida: últimos 7, 30 y 90 días, con media, mínimo, máximo, registros y el cambio
// respecto a los mismos días justo antes. La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

let n = 0;
const e = (metric, unit, date, value, extra = {}) => ({ id: `e${n++}`, metric, unit, date, value, created: n, note: '', ...extra });
const load = (entries, extra = {}) => loadApp({ stored: { habits: [], health: { entries, ...extra } } });
const run = (app, code) => plain(app.run(code));

const WEIGHT = [
  e('weight', 'kg', '2026-09-15', 73),
  e('weight', 'kg', '2026-09-19', 72.6),
  e('weight', 'kg', '2026-09-21', 72),
  e('weight', 'lb', '2026-09-24', 160), // 72,57 kg
  e('weight', 'kg', '2026-09-27', 71.5),
];

test('medidas de nivel: media, mínimo y máximo de los registros, en la unidad elegida aunque se apuntaran en otra', () => {
  const app = load(WEIGHT);
  const s = run(app, `healthSummary('weight', 7)`);
  assert.equal(s.now.count, 3);
  assert.equal(s.now.from, '2026-09-21');
  assert.equal(Math.round(s.now.stats.main.mean * 1000) / 1000, 72.025);
  assert.equal(s.now.stats.main.min, 71.5);
  assert.equal(Math.round(s.now.stats.main.max * 100) / 100, 72.57);
  assert.equal(s.before.count, 2, 'del 14 al 20');
  assert.equal(s.before.stats.main.mean, 72.8);
  assert.equal(s.change, -0.8, 'con las medias redondeadas como se ven: 72,0 − 72,8');
  // En libras, lo mismo convertido.
  const lb = load(WEIGHT, { units: { weight: 'lb' } });
  const t = run(lb, `healthSummary('weight', 7)`);
  assert.equal(Math.round(t.now.stats.main.min * 10) / 10, 157.6);
  assert.equal(Math.round(t.now.stats.main.max * 10) / 10, 160);
  const html = lb.run(`healthSummaryCard('weight')`);
  assert.match(html, /<span class="card-count">lb<\/span>/);
  assert.match(html, /Todo en lb, también los registros que apuntaste en otra unidad\./);
});

test('sin el periodo anterior, o con un solo dato, lo dice en vez de dar una cifra', () => {
  const app = load(WEIGHT);
  const s30 = run(app, `healthSummary('weight', 30)`);
  assert.equal(s30.now.count, 5);
  assert.equal(s30.before.stats, null);
  assert.equal(s30.change, null);
  const only = load([e('weight', 'kg', '2026-09-27', 70), e('weight', 'kg', '2026-09-01', 71), e('weight', 'kg', '2026-08-30', 71.4)]);
  const one = run(only, `healthSummary('weight', 7)`);
  assert.equal(one.now.count, 1);
  assert.equal(one.now.stats, null, 'con 1 registro no hay «media»');
  const html = only.run(`healthSummaryCard('weight')`);
  assert.match(html, /Pocos datos en los últimos 7 días: solo 1 registro, y hacen falta 2 para el resumen\./);
  assert.match(html, /No hay datos suficientes en los 30 días anteriores y los 90 días anteriores para ver el cambio\./);
  assert.match(html, /<span aria-hidden="true">—<\/span><span class="sr-only">pocos datos<\/span>/);
  assert.equal(load([]).run(`healthSummaryCard('weight')`), '', 'sin registros no hay resumen');
});

test('totales del día: los registros de un día se suman y la media es por día con registro', () => {
  const app = load([
    e('steps', 'steps', '2026-09-25', 6000),
    e('steps', 'steps', '2026-09-26', 3000),
    e('steps', 'steps', '2026-09-26', 5000),
    e('steps', 'steps', '2026-09-27', 10000),
    e('steps', 'steps', '2026-09-18', 4000),
    e('steps', 'steps', '2026-09-19', 5000),
  ]);
  const s = run(app, `healthSummary('steps', 7)`);
  assert.deepEqual([s.now.count, s.now.days, s.now.values], [4, 3, 3]);
  assert.deepEqual(s.now.stats.main, { mean: 8000, min: 6000, max: 10000, change: 4000 });
  assert.equal(s.before.stats.main.mean, 4500);
  assert.equal(s.change, 3500);
  const html = app.run(`healthSummaryCard('steps')`);
  assert.match(html, /<th scope="row">Media por día<\/th><td>8\.000<\/td>/);
  assert.match(html, /<th scope="row">Días con registro<\/th><td>3<\/td>/);
  assert.match(html, /<th scope="row">Cambio<\/th><td>\+3\.500<\/td>/);
  assert.match(html, /Si un día tiene varios registros, se suman/);
  // El peso, en cambio, hace la media de los registros aunque dos sean del mismo día.
  const w = load([e('weight', 'kg', '2026-09-27', 70), e('weight', 'kg', '2026-09-27', 72)]);
  assert.equal(run(w, `healthSummary('weight', 7)`).now.stats.main.mean, 71);
});

test('tensión: sistólica y diastólica por separado', () => {
  const app = load([
    e('bloodPressure', 'mmHg', '2026-09-25', 120, { value2: 80 }),
    e('bloodPressure', 'mmHg', '2026-09-26', 130, { value2: 84, pulse: 70 }),
    e('bloodPressure', 'mmHg', '2026-09-18', 118, { value2: 76 }),
    e('bloodPressure', 'mmHg', '2026-09-19', 124, { value2: 80 }),
  ]);
  const s = run(app, `healthSummary('bloodPressure', 7)`);
  assert.deepEqual(s.now.stats.main, { mean: 125, min: 120, max: 130, change: 10 });
  assert.deepEqual(s.now.stats.second, { mean: 82, min: 80, max: 84, change: 4 });
  assert.deepEqual([s.change, s.change2], [4, 4]);
  const html = app.run(`healthSummaryCard('bloodPressure')`);
  assert.match(html, /<th scope="rowgroup" colspan="4">Sistólica<\/th>/);
  assert.match(html, /<th scope="rowgroup" colspan="4">Diastólica<\/th>/);
  assert.equal((html.match(/<th scope="row">Media<\/th>/g) || []).length, 2);
});

test('la tabla es accesible: título, cabeceras de fila y de columna', () => {
  const app = load(WEIGHT);
  const html = app.run(`healthSummaryCard('weight')`);
  assert.match(html, /<caption class="sr-only">Resumen de peso en kg: últimos 7, 30 y 90 días/);
  assert.match(html, /<th scope="col">7 días<\/th><th scope="col">30 días<\/th><th scope="col">90 días<\/th>/);
  for (const label of ['Registros', 'Media', 'Mínimo', 'Máximo', 'Media anterior', 'Cambio']) {
    assert.match(html, new RegExp(`<th scope="row">${label}</th>`), label);
  }
  assert.match(html, /<th scope="row">Cambio<\/th><td>−0,8<\/td>/);
});

test('el resumen no guarda nada ni cambia la XP, las rachas o los retos', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];
  const app = loadApp({ stored: { habits, health: { entries: WEIGHT } } });
  const before = [run(app, 'state'), run(app, 'computeStats()')];
  app.run(`healthSummaryCard('weight'); HEALTH_SUMMARY_DAYS.forEach((d) => healthSummary('weight', d))`);
  assert.deepEqual([run(app, 'state'), run(app, 'computeStats()')], before);
  assert.deepEqual(run(app, 'computeStats()'), run(loadApp({ stored: { habits } }), 'computeStats()'));
});
