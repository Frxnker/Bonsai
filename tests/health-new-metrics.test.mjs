// Salud · medidas nuevas: glucosa (mg/dL o mmol/L), oxígeno en sangre (%), estado de ánimo y energía (1–5) y dolor
// (0–10). Opcionales, con sus rangos y su gráfica, y con el resumen, el objetivo, la relación con los hábitos, el
// informe y el CSV. La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const TODAY = '2026-09-27';
const run = (app, code) => plain(app.run(code));
let n = 0;
const e = (metric, unit, date, value, extra = {}) => ({ id: `e${n++}`, metric, unit, date, value, created: n, note: '', ...extra });
const load = (health = {}, extra = {}) => loadApp({ stored: { habits: [], health, ...extra } });
const save = (app, metric, valueText, date = TODAY) => run(app, `saveHealthEntry('${metric}', ${JSON.stringify({ valueText, date })})`);

test('el catálogo: cinco medidas más, opcionales y en su orden', () => {
  const app = load();
  assert.deepEqual(run(app, 'Object.keys(HEALTH_METRICS)'), [
    'weight', 'waist', 'restingHr', 'bloodPressure', 'sleep', 'bodyFat', 'temperature', 'steps',
    'glucose', 'oxygen', 'mood', 'energy', 'pain',
  ]);
  assert.deepEqual(run(app, 'state.health.metrics'), ['weight'], 'no se ven hasta que las eliges');
  app.run(`setHealthMetric('pain', true); setHealthMetric('glucose', true)`);
  assert.deepEqual(run(app, 'state.health.metrics'), ['weight', 'glucose', 'pain']);
  assert.deepEqual(run(app, `['glucose', 'oxygen', 'mood', 'energy', 'pain'].map((m) => HEALTH_METRICS[m].chart)`), ['line', 'line', 'line', 'line', 'line']);
});

test('glucosa: entera en mg/dL, con un decimal en mmol/L, y se convierte', () => {
  const app = load({ units: { glucose: 'mmol' } });
  assert.match(save(app, 'glucose', '0,9').errors.value, /entre 1,1 y 33,3 mmol\/L/);
  const mmol = save(app, 'glucose', '5,3').entry;
  assert.deepEqual([mmol.value, mmol.unit], [5.3, 'mmol']);
  assert.equal(app.run(`healthEntryText('glucose', healthSeries('glucose')[0])`), '5,3 mmol/L');
  app.run(`state.health.units.glucose = 'mgdl'`);
  assert.match(save(app, 'glucose', '95,5').errors.value, /número entero, por ejemplo 95/);
  assert.match(save(app, 'glucose', '700').errors.value, /entre 20 y 600 mg\/dL/);
  assert.deepEqual(save(app, 'glucose', '110').entry.value, 110);
  assert.deepEqual(run(app, `healthSeries('glucose').map((x) => healthEntryValue('glucose', x))`), ['95', '110'], '5,3 mmol/L son 95 mg/dL');
  assert.equal(app.run(`healthFieldLabel('glucose')`), 'Glucosa (mg/dL)');
  // Al cargar: los de mmol/L conservan sus decimales; los de mg/dL, enteros.
  const norm = run(app, `normalize(${JSON.stringify({ habits: [], health: { entries: [e('glucose', 'mmol', TODAY, 5.35), e('glucose', 'mgdl', TODAY, 99.6), e('glucose', 'mmol', TODAY, 40)] } })}).health.entries.map((x) => x.value)`);
  assert.deepEqual(norm, [5.35, 100], 'y lo que está fuera de rango se descarta');
});

test('oxígeno en sangre: entero, de 50 a 100 %', () => {
  const app = load();
  assert.match(save(app, 'oxygen', '101').errors.value, /entre 50 y 100 %/);
  assert.match(save(app, 'oxygen', '97,5').errors.value, /entero/);
  assert.equal(save(app, 'oxygen', '97').entry.value, 97);
  assert.equal(app.run(`healthFieldLabel('oxygen')`), 'Oxígeno en sangre (%)');
});

test('escalas: ánimo y energía del 1 al 5, dolor del 0 al 10, con su eje fijo', () => {
  const app = load();
  assert.equal(save(app, 'pain', '0').entry.value, 0, 'el 0 vale en el dolor');
  assert.equal(app.run(`saveHealthEntry('mood', { valueText: '6', date: '${TODAY}' }).errors.value`), 'Escribe un valor entre 1 y 5.');
  assert.match(save(app, 'energy', '0').errors.value, /entre 1 y 5\.$/);
  assert.match(save(app, 'pain', '11').errors.value, /entre 0 y 10\.$/);
  assert.match(save(app, 'mood', '3,5').errors.value, /entero/);
  assert.equal(app.run(`healthFieldLabel('mood')`), 'Estado de ánimo (del 1 al 5)');
  save(app, 'mood', '4');
  assert.equal(app.run(`healthEntryText('mood', healthSeries('mood')[0])`), '4 de 5');
  const ticks = (metric) => [...app.run(`healthChart([{ id: 'a', date: '2026-09-20', shown: 3 }, { id: 'b', date: '${TODAY}', shown: 4 }], '2026-08-29', 320, { decimals: 0, fixed: HEALTH_METRICS['${metric}'].axis }).svg`)
    .matchAll(/text-anchor="end">(\d+)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(ticks('mood'), ['1', '2', '3', '4', '5']);
  assert.deepEqual(ticks('pain'), ['0', '2', '4', '6', '8', '10']);
});

test('funcionan con el resumen, el objetivo, la relación con los hábitos, el informe y el CSV', () => {
  const days = Array.from({ length: 20 }, (_, i) => new Date(Date.UTC(2026, 8, 8 + i)).toISOString().slice(0, 10));
  const habits = [{ id: 'walk', name: 'Caminar', emoji: '🚶', created: '2026-09-01', done: Object.fromEntries(days.filter((d, i) => i % 2).map((d) => [d, 1])) }];
  const entries = [
    ...days.map((d, i) => e('mood', 'scale', d, i % 2 ? 4 : 3)),
    e('glucose', 'mgdl', '2026-09-26', 95, { note: 'En ayunas' }),
    e('glucose', 'mmol', TODAY, 5.6),
    e('pain', 'scale', TODAY, 0),
    e('oxygen', 'pct', TODAY, 97),
  ];
  const app = loadApp({ stored: { habits, health: { metrics: ['mood', 'glucose'], entries, goals: { mood: { type: 'up', min: 4 } } } } });
  // Resumen: la media de una escala, con un decimal.
  const s = run(app, `healthSummary('mood', 7)`);
  assert.equal(s.now.stats.main.mean, 25 / 7, 'del 21 al 27: cuatro días con 4 y tres con 3');
  assert.match(app.run(`healthSummaryCard('mood')`), /<th scope="row">Media<\/th><td>3,6<\/td>/);
  assert.match(app.run(`healthSummaryCard('mood')`), /<span class="card-count">del 1 al 5<\/span>/);
  // Objetivo: la distancia, en puntos.
  assert.equal(app.run(`healthGoalText('mood')`), '4 de 5 o más');
  assert.deepEqual(run(app, `healthGoalSentences('mood', healthGoalProgress('mood'))`), [
    'Último registro (hoy): 4 de 5, dentro de tu objetivo.',
    '5 de tus últimos 10 registros, dentro de tu objetivo.',
  ]);
  app.run(`state.health.goals.mood = { type: 'up', min: 5 }`);
  assert.match(app.run(`healthGoalSentences('mood', healthGoalProgress('mood'))[0]`), /te faltan 1 punto para tu objetivo/);
  // Relación con los hábitos.
  const r = run(app, `healthRelations('mood')[0]`);
  assert.deepEqual([r.done.mean, r.missed.mean, r.diff], [4, 3, 1]);
  assert.match(app.run(`healthRelationCard('mood')`), /Diferencia: \+1,0 punto<\/p>/);
  // Informe.
  const report = app.run(`healthReportHTML({ metrics: ['mood', 'glucose', 'pain'], from: '2026-08-29', to: '${TODAY}' })`);
  assert.match(report, /<h2 id="report-mood">Estado de ánimo <span class="report-unit">\(del 1 al 5\)<\/span><\/h2>/);
  assert.match(report, /<td class="num">95<\/td><td>mg\/dL<\/td><td>En ayunas<\/td>/);
  assert.match(report, /<td class="num">101<\/td><td>mg\/dL<\/td>/, '5,6 mmol/L, en mg/dL');
  assert.match(report, /<td class="num">0<\/td><td>de 10<\/td>/);
  // CSV: como se apuntaron.
  const csv = app.run('healthCSV()').trim().split('\r\n');
  assert.ok(csv.includes('2026-09-26;;Glucosa;95;;;mg/dL;En ayunas'));
  assert.ok(csv.includes(`${TODAY};;Glucosa;5,6;;;mmol/L;`));
  assert.ok(csv.includes(`${TODAY};;Dolor;0;;;de 10;`));
  assert.ok(csv.includes(`${TODAY};;Oxígeno en sangre;97;;;%;`));
  assert.ok(csv.includes(`${TODAY};;Estado de ánimo;4;;;de 5;`));
});

test('copias: las antiguas se leen con las medidas nuevas por defecto, y las nuevas llevan todo', () => {
  const app = load();
  const old = run(app, `readBackup(${JSON.stringify(JSON.stringify({ app: 'bonsai', version: 2, data: { habits: [], health: { units: { weight: 'lb' }, metrics: ['weight', 'sleep'], entries: [e('weight', 'lb', TODAY, 160)] } } }))})`);
  assert.deepEqual([old.data.health.units.glucose, old.data.health.units.mood, old.data.health.metrics], ['mgdl', 'scale', ['weight', 'sleep']]);
  const racha = run(app, `readBackup(${JSON.stringify(JSON.stringify({ app: 'racha', version: 1, data: { habits: [{ name: 'Leer' }] } }))})`);
  assert.equal(racha.hasHealth, false);
  assert.equal(racha.data.health.units.pain, 'scale');
  const withNew = load({ units: { glucose: 'mmol' }, metrics: ['glucose', 'pain'], entries: [e('glucose', 'mmol', TODAY, 5.3), e('pain', 'scale', TODAY, 0)], goals: { glucose: { type: 'range', min: 70, max: 100 } } });
  const copy = run(withNew, 'readBackup(JSON.stringify(backupPayload())).data.health');
  assert.deepEqual(copy, run(withNew, 'state.health'));
  assert.equal(withNew.run(`healthGoalText('glucose')`), 'entre 3,9 y 5,6 mmol/L', 'el objetivo, guardado en mg/dL');
});

test('las medidas nuevas no cambian la XP, las rachas ni los retos', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];
  const withNew = loadApp({ stored: { habits, health: { metrics: ['mood', 'pain', 'glucose'], entries: [e('mood', 'scale', TODAY, 2), e('pain', 'scale', TODAY, 7), e('glucose', 'mgdl', TODAY, 180)] } } });
  assert.deepEqual(run(withNew, 'computeStats()'), run(loadApp({ stored: { habits } }), 'computeStats()'));
});
