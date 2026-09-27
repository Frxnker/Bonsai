// Salud ampliada: más medidas, tensión arterial, registro rápido, media de 7 días, estadísticas,
// comparación, CSV, notas rápidas y recordatorio. La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain, STORAGE_KEY } from './harness.mjs';

const TODAY = '2026-09-27';
const e = (fields) => ({ id: `e${Math.random()}`, date: '2026-09-20', created: 1, note: '', ...fields });
const withEntries = (entries, extra = {}) => ({ habits: [], health: { entries, ...extra } });
const run = (app, code) => plain(app.run(code));

test('las medidas activas y el recordatorio solo aceptan valores válidos', () => {
  const app = loadApp();
  const health = run(app, `normalize(${JSON.stringify({
    habits: [],
    health: { metrics: ['steps', 'nada', 'weight', 'steps', 'constructor'], reminder: { days: [6, 1, 9, 'x', 1], time: '25:00' }, units: { temperature: 'f', waist: 'yd' } },
  })}).health`);
  assert.deepEqual(health.metrics, ['weight', 'steps'], 'en el orden del catálogo, sin repetidas ni desconocidas');
  assert.deepEqual(health.reminder, { days: [1, 6], time: '08:00' });
  assert.equal(health.units.temperature, 'f');
  assert.equal(health.units.waist, 'cm');
  assert.deepEqual(run(app, `normalize({ habits: [], health: { metrics: [] } }).health.metrics`), [], 'se pueden ocultar todas');
});

test('la tensión necesita una diastólica menor que la sistólica; el pulso es opcional', () => {
  const app = loadApp();
  const bp = (fields) => e({ metric: 'bloodPressure', unit: 'mmHg', value: 120, value2: 80, ...fields });
  const entries = [
    bp({ id: 'ok', pulse: 64 }),
    bp({ id: 'sin-pulso' }),
    bp({ id: 'pulso-raro', pulse: 500 }),
    bp({ id: 'al-reves', value: 80, value2: 120 }),
    bp({ id: 'sin-diastolica', value2: undefined }),
    bp({ id: 'fuera', value: 300 }),
  ];
  const out = run(app, `normalize(${JSON.stringify(withEntries(entries))}).health.entries`);
  const byId = Object.fromEntries(out.map((x) => [x.id, x]));
  assert.deepEqual(Object.keys(byId).sort(), ['ok', 'pulso-raro', 'sin-pulso']);
  assert.equal(byId.ok.pulse, 64);
  assert.equal('pulse' in byId['pulso-raro'], false, 'un pulso no válido se quita, el registro se queda');
});

test('las medidas sin decimales se guardan como enteros', () => {
  const app = loadApp();
  const out = run(app, `normalize(${JSON.stringify(withEntries([
    e({ id: 's', metric: 'steps', unit: 'steps', value: 8000.4 }),
    e({ id: 'p', metric: 'restingHr', unit: 'bpm', value: 61.6 }),
    e({ id: 'w', metric: 'waist', unit: 'cm', value: 80.25 }),
  ]))}).health.entries`);
  assert.deepEqual(out.map((x) => [x.id, x.value]).sort(), [['p', 62], ['s', 8000], ['w', 80.25]]);
});

test('la temperatura se convierte entre °C y °F con su desplazamiento', () => {
  const app = loadApp();
  assert.equal(Math.round(app.run(`convertHealth('temperature', 98.6, 'f', 'c')`) * 100) / 100, 37);
  assert.equal(Math.round(app.run(`convertHealth('temperature', 37, 'c', 'f')`) * 100) / 100, 98.6);
  assert.equal(Math.round(app.run(`convertHealth('waist', 40, 'in', 'cm')`) * 100) / 100, 101.6);
});

test('los enteros admiten separador de miles; los decimales, coma o punto', () => {
  const app = loadApp();
  assert.equal(app.run(`parseInteger('8.000')`), 8000);
  assert.equal(app.run(`parseInteger(' 12 345 ')`), 12345);
  assert.equal(app.run(`parseInteger('8000')`), 8000);
  for (const bad of ['8,5', '1234567', '8.00', '', 'mil']) assert.ok(Number.isNaN(app.run(`parseInteger(${JSON.stringify(bad)})`)), bad);
  assert.equal(app.run(`parseHealthValue('temperature', '36,6')`), 36.6);
  assert.ok(Number.isNaN(app.run(`parseHealthValue('restingHr', '62,5')`)));
});

test('cada medida valida su rango y su formato', () => {
  const app = loadApp({ stored: { habits: [], health: { units: { temperature: 'f' } } } });
  const save = (metric, fields) => run(app, `saveHealthEntry('${metric}', ${JSON.stringify({ date: TODAY, ...fields })})`);
  assert.match(save('steps', { valueText: '8,5' }).errors.value, /número entero/);
  assert.match(save('temperature', { valueText: '37' }).errors.value, /entre 86 y 113 °F/);
  assert.match(save('bodyFat', { valueText: '90' }).errors.value, /entre 2 y 75 %/);
  const bp = save('bloodPressure', { valueText: '80', value2Text: '90' });
  assert.match(bp.errors.value2, /menor que la sistólica/);
  assert.match(save('bloodPressure', { valueText: '120', value2Text: '' }).errors.value2, /diastólica/);
  assert.match(save('bloodPressure', { valueText: '120', value2Text: '80', pulseText: '5' }).errors.pulse, /pulso/i);
  assert.equal(app.run('state.health.entries.length'), 0);
  const ok = save('bloodPressure', { valueText: '121', value2Text: '79', pulseText: '63' }).entry;
  assert.deepEqual([ok.value, ok.value2, ok.pulse, ok.unit], [121, 79, 63, 'mmHg']);
  assert.equal(save('temperature', { valueText: '98,6' }).entry.unit, 'f');
  assert.equal(save('steps', { valueText: '8.500' }).entry.value, 8500);
});

test('al editar la tensión se puede quitar el pulso', () => {
  const app = loadApp({ stored: withEntries([e({ id: 'bp', metric: 'bloodPressure', unit: 'mmHg', value: 120, value2: 80, pulse: 64 })]) });
  const edited = run(app, `saveHealthEntry('bloodPressure', { id: 'bp', valueText: '120', value2Text: '78', pulseText: '', date: '${TODAY}' }).entry`);
  assert.equal(edited.value2, 78);
  assert.equal('pulse' in edited, false);
  assert.equal(app.run('state.health.entries.length'), 1);
});

test('el registro rápido guarda varias medidas a la vez, o ninguna si algo falla', () => {
  const app = loadApp({ stored: { habits: [] } });
  const batch = (values, date = TODAY, note = 'En ayunas') => run(app, `saveHealthBatch(${JSON.stringify({ date, note, values })})`);
  const bad = batch({ weight: { valueText: '72,4' }, waist: { valueText: '5' } });
  assert.match(bad.errors['waist.value'], /entre 30 y 250 cm/);
  assert.equal(app.run('state.health.entries.length'), 0, 'nada se guarda si una medida no es válida');
  assert.match(batch({ weight: { valueText: '' }, sleep: {} }).errors.form, /al menos una medida/);
  assert.match(batch({ weight: { valueText: '72' } }, '2026-10-01').errors.date, /posterior a hoy/);
  const ok = batch({
    weight: { valueText: '72,4' },
    waist: { valueText: '' },
    bloodPressure: { valueText: '118', value2Text: '76', pulseText: '' },
    sleep: { valueText: '7,5' },
  });
  assert.deepEqual(ok.entries.map((x) => x.metric), ['weight', 'bloodPressure', 'sleep']);
  assert.ok(ok.entries.every((x) => x.date === TODAY && x.note === 'En ayunas'));
  assert.equal(JSON.parse(app.storage.get(STORAGE_KEY)).health.entries.length, 3);
});

test('la media de 7 días usa los registros de esos días, sin inventar los que faltan', () => {
  const app = loadApp({
    stored: withEntries([
      e({ id: 'a', metric: 'weight', unit: 'kg', value: 70, date: '2026-09-01' }),
      e({ id: 'b', metric: 'weight', unit: 'kg', value: 72, date: '2026-09-05' }),
      e({ id: 'c', metric: 'weight', unit: 'kg', value: 74, date: '2026-09-07' }),
      e({ id: 'd', metric: 'weight', unit: 'kg', value: 80, date: '2026-09-20' }),
    ]),
  });
  const avg = run(app, `movingAverage(healthSeries('weight')).map((x) => x.value)`);
  assert.deepEqual(avg, [70, 71, 72, 80]);
});

test('estadísticas y comparación del periodo, también de la tensión', () => {
  const app = loadApp({
    stored: withEntries([
      e({ id: 'p1', metric: 'weight', unit: 'kg', value: 74, date: '2026-08-10' }),
      e({ id: 'n1', metric: 'weight', unit: 'kg', value: 73, date: '2026-09-01' }),
      e({ id: 'n2', metric: 'weight', unit: 'kg', value: 71, date: '2026-09-15' }),
      e({ id: 'n3', metric: 'weight', unit: 'kg', value: 72, date: '2026-09-25' }),
      e({ id: 't1', metric: 'bloodPressure', unit: 'mmHg', value: 120, value2: 80, date: '2026-09-10' }),
      e({ id: 't2', metric: 'bloodPressure', unit: 'mmHg', value: 130, value2: 84, date: '2026-09-20' }),
    ]),
  });
  const s = run(app, `healthStats(healthSeries('weight').filter((x) => x.date >= '2026-08-29'))`);
  assert.deepEqual(s, { count: 3, main: { mean: 72, min: 71, max: 73, change: -1 }, second: null });
  const cmp = run(app, `comparePeriods(healthSeries('weight'), 30)`);
  assert.equal(cmp.before.main.mean, 74);
  assert.equal(cmp.now.count, 3);
  assert.equal(run(app, `comparePeriods(healthSeries('weight'), 90)`), null, 'sin registros en los 90 días anteriores no hay comparación');
  const bp = run(app, `healthStats(healthSeries('bloodPressure'))`);
  assert.deepEqual(bp.main, { mean: 125, min: 120, max: 130, change: 10 });
  assert.deepEqual(bp.second, { mean: 82, min: 80, max: 84, change: 4 });
  const latest = run(app, `healthLatest('bloodPressure')`);
  assert.deepEqual([latest.diff, latest.diff2], [10, 4]);
  assert.equal(app.run(`healthDiffText(10, 'mmHg', 0, 4)`), '+10/+4 mmHg');
  assert.equal(app.run(`healthDiffText(0, 'mmHg', 0, 0)`), 'Sin cambios');
});

test('el CSV lleva todos los registros, con coma decimal y las notas protegidas', () => {
  const app = loadApp({
    stored: withEntries([
      e({ id: '1', metric: 'weight', unit: 'kg', value: 72.45, date: '2026-09-02', note: 'Tras entrenar; bien' }),
      e({ id: '2', metric: 'bloodPressure', unit: 'mmHg', value: 120, value2: 80, pulse: 64, date: '2026-09-01' }),
      e({ id: '3', metric: 'temperature', unit: 'f', value: 98.6, date: '2026-09-03', note: '=HYPERLINK("x")' }),
    ], { metrics: ['weight'] }),
  });
  const csv = app.run('healthCSV()');
  assert.ok(csv.startsWith('﻿Fecha;Medida;Valor;Diastólica;Pulso;Unidad;Nota\r\n'));
  const lines = csv.trim().split('\r\n').slice(1);
  assert.equal(lines.length, 3, 'también las medidas ocultas');
  assert.equal(lines[0], '2026-09-01;Tensión arterial;120;80;64;mmHg;');
  assert.equal(lines[1], '2026-09-02;Peso;72,45;;;kg;"Tras entrenar; bien"');
  assert.equal(lines[2], `2026-09-03;Temperatura;98,6;;;°F;"'=HYPERLINK(""x"")"`);
});

test('las notas rápidas se añaden y se quitan de la nota', () => {
  const app = loadApp();
  assert.equal(app.run(`toggleTag('', 'en ayunas')`), 'En ayunas');
  assert.equal(app.run(`toggleTag('En ayunas', 'tras entrenar')`), 'En ayunas, tras entrenar');
  assert.equal(app.run(`toggleTag('En ayunas, tras entrenar', 'en ayunas')`), 'Tras entrenar');
  assert.equal(app.run(`toggleTag('Me dolía la espalda', 'por la noche')`), 'Me dolía la espalda, por la noche');
  assert.equal(app.run(`hasTag('Tras entrenar, EN AYUNAS', 'en ayunas')`), true);
});

test('el recordatorio de Salud crea un evento para los días elegidos', () => {
  const app = loadApp();
  const ics = app.run(`buildICS({ id: 'salud', name: 'Apuntar mis medidas', emoji: '❤️', schedule: { type: 'days', days: [0, 3] }, time: '07:30', text: 'Es un buen momento para apuntar peso en Bonsái.' })`);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,TH/);
  assert.match(ics, /DTSTART:\d{8}T073000/);
  assert.match(ics, /DESCRIPTION:Es un buen momento para apuntar peso en Bonsái\./);
  assert.doesNotMatch(ics, /Márcalo/);
});

test('cada tipo de gráfica dibuja sus marcas', () => {
  const app = loadApp({
    stored: withEntries([
      e({ id: 's1', metric: 'steps', unit: 'steps', value: 6000, date: '2026-09-20' }),
      e({ id: 's2', metric: 'steps', unit: 'steps', value: 9000, date: '2026-09-25' }),
      e({ id: 'b1', metric: 'bloodPressure', unit: 'mmHg', value: 120, value2: 80, date: '2026-09-20' }),
      e({ id: 'b2', metric: 'bloodPressure', unit: 'mmHg', value: 125, value2: 82, date: '2026-09-25' }),
    ]),
  });
  const bars = run(app, `healthChart(healthSeries('steps'), '2026-08-29', 320, { kind: 'bars', decimals: 0, span: 1000, average: movingAverage(healthSeries('steps')) })`);
  assert.equal((bars.svg.match(/class="hc-bar soft"/g) || []).length, 2);
  assert.match(bars.svg, /class="hc-avg"/);
  assert.match(bars.svg, />0<\/text>/, 'las columnas empiezan en 0');
  const range = run(app, `healthChart(healthSeries('bloodPressure'), '2026-08-29', 320, { kind: 'range', decimals: 0, span: 20 })`);
  assert.equal((range.svg.match(/class="hc-range"/g) || []).length, 2);
  assert.equal(range.points.length, 2);
});

test('elegir medidas mantiene el orden del catálogo y no borra registros', () => {
  const app = loadApp({ stored: withEntries([e({ id: 'w', metric: 'waist', unit: 'cm', value: 80 })], { metrics: ['weight', 'waist'] }) });
  app.run(`setHealthMetric('steps', true); setHealthMetric('restingHr', true); setHealthMetric('waist', false)`);
  assert.deepEqual(run(app, 'state.health.metrics'), ['weight', 'restingHr', 'steps']);
  assert.equal(app.run('state.health.entries.length'), 1);
});

test('ninguna medida de Salud cambia la XP, las rachas ni los retos', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];
  const before = loadApp({ stored: { habits } });
  const after = loadApp({
    stored: {
      habits,
      health: {
        metrics: ['weight', 'bloodPressure', 'steps', 'sleep'],
        entries: [
          e({ metric: 'bloodPressure', unit: 'mmHg', value: 120, value2: 80, date: '2026-09-26' }),
          e({ metric: 'steps', unit: 'steps', value: 12000, date: '2026-09-26' }),
          e({ metric: 'sleep', unit: 'h', value: 8, date: '2026-09-26' }),
        ],
      },
    },
  });
  assert.deepEqual(run(after, 'computeStats()'), run(before, 'computeStats()'));
});
