// Fase 2: registrar, editar y borrar peso; unidades, validación y resumen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain, STORAGE_KEY } from './harness.mjs';

const TODAY = '2026-09-27';
const entry = (fields) => ({ id: 'w1', metric: 'weight', date: '2026-09-20', value: 72.4, unit: 'kg', created: 1, ...fields });
const save = (app, fields) => plain(app.run(`saveHealthEntry('weight', ${JSON.stringify(fields)})`));

test('acepta coma o punto decimal y rechaza lo que no es un número', () => {
  const app = loadApp();
  assert.equal(app.run('parseDecimal("72,5")'), 72.5);
  assert.equal(app.run('parseDecimal(" 72.25 ")'), 72.25);
  assert.equal(app.run('parseDecimal("160")'), 160);
  for (const bad of ['', '72,555', '7a', '-70', '1e2', '72,5 kg']) assert.ok(Number.isNaN(app.run(`parseDecimal(${JSON.stringify(bad)})`)), bad);
});

test('registrar un peso lo guarda en la unidad elegida y con fecha', () => {
  const app = loadApp({ stored: { habits: [] } });
  const { entry: saved, errors } = save(app, { valueText: '72,4', date: TODAY, note: '  en ayunas  ' });
  assert.equal(errors, undefined);
  assert.equal(saved.value, 72.4);
  assert.equal(saved.unit, 'kg');
  assert.equal(saved.note, 'en ayunas');
  const stored = JSON.parse(app.storage.get(STORAGE_KEY));
  assert.equal(stored.health.entries.length, 1);
});

test('valida el valor, la fecha y el futuro', () => {
  const app = loadApp({ stored: { habits: [] } });
  assert.match(save(app, { valueText: 'mucho', date: TODAY }).errors.value, /número/);
  assert.match(save(app, { valueText: '5', date: TODAY }).errors.value, /entre 20 y 400 kg/);
  assert.match(save(app, { valueText: '72', date: '2026-09-28' }).errors.date, /posterior a hoy/);
  assert.match(save(app, { valueText: '72', date: '' }).errors.date, /fecha/);
  assert.match(save(app, { valueText: '72', date: '2026-02-30' }).errors.date, /fecha/);
  assert.equal(app.run('state.health.entries.length'), 0);
});

test('en libras los límites cambian con la unidad', () => {
  const app = loadApp({ stored: { habits: [], health: { units: { weight: 'lb' } } } });
  assert.match(save(app, { valueText: '30', date: TODAY }).errors.value, /entre 44 y 880 lb/);
  assert.equal(save(app, { valueText: '160', date: TODAY }).entry.unit, 'lb');
});

test('editar sin tocar el valor conserva la unidad en que se apuntó', () => {
  const app = loadApp({ stored: { habits: [], health: { units: { weight: 'kg' }, entries: [entry({ value: 160, unit: 'lb' })] } } });
  const shown = app.run(`healthInputText(state.health.entries[0], 'kg')`);
  assert.equal(shown, '72,57');
  const { entry: edited } = save(app, { id: 'w1', valueText: shown, date: '2026-09-21', note: 'nota' });
  assert.equal(edited.value, 160);
  assert.equal(edited.unit, 'lb');
  assert.equal(edited.date, '2026-09-21');
  const { entry: changed } = save(app, { id: 'w1', valueText: '71', date: '2026-09-21' });
  assert.equal(changed.value, 71);
  assert.equal(changed.unit, 'kg');
  assert.equal(app.run('state.health.entries.length'), 1);
});

test('cambiar de unidad no modifica los registros; solo cómo se ven', () => {
  const app = loadApp({ stored: { habits: [], health: { entries: [entry({})] } } });
  app.run(`state.health.units.weight = 'lb'`);
  const [e] = plain(app.run(`healthSeries('weight')`));
  assert.equal(e.value, 72.4);
  assert.equal(e.unit, 'kg');
  assert.equal(Math.round(e.shown * 10) / 10, 159.6);
});

test('el resumen compara con el registro anterior sin juicios', () => {
  const app = loadApp({
    stored: { habits: [], health: { entries: [entry({ id: 'a', date: '2026-09-10', value: 72 }), entry({ id: 'b', date: '2026-09-20', value: 72.4 })] } },
  });
  const latest = plain(app.run(`healthLatest('weight')`));
  assert.equal(latest.last.id, 'b');
  assert.equal(latest.diff, 0.4);
  assert.equal(app.run(`healthDiffText(0.4, 'kg')`), '+0,4 kg');
  assert.equal(app.run(`healthDiffText(-0.3, 'kg')`), '−0,3 kg');
  assert.equal(app.run(`healthDiffText(0, 'kg')`), 'Sin cambios');
});

test('con un solo registro no hay diferencia que mostrar', () => {
  const app = loadApp({ stored: { habits: [], health: { entries: [entry({})] } } });
  const latest = plain(app.run(`healthLatest('weight')`));
  assert.equal(latest.prev, null);
  assert.equal(latest.diff, null);
});

test('la diferencia usa el mismo redondeo que se ve en pantalla', () => {
  const app = loadApp({
    stored: { habits: [], health: { entries: [entry({ id: 'a', date: '2026-09-10', value: 72.05 }), entry({ id: 'b', date: '2026-09-20', value: 72.44 })] } },
  });
  assert.equal(app.run(`healthText(state.health.entries[0].value, 'kg')`), '72,1 kg');
  assert.equal(app.run(`healthText(state.health.entries[1].value, 'kg')`), '72,4 kg');
  assert.equal(app.run(`healthLatest('weight').diff`), 0.3);
});

test('borrar un registro o todos no toca hábitos ni diario', () => {
  const stored = {
    habits: [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-26': 1 } }],
    days: { '2026-09-26': { mood: 4, note: 'bien' } },
    health: { entries: [entry({ id: 'a' }), entry({ id: 'b', date: '2026-09-21' })] },
  };
  const app = loadApp({ stored });
  app.run(`deleteHealthEntry('a')`);
  assert.deepEqual(plain(app.run('state.health.entries.map((e) => e.id)')), ['b']);
  assert.equal(app.run('state.habits[0].done["2026-09-26"]'), 1);
  assert.equal(app.run('state.days["2026-09-26"].note'), 'bien');
});

test('la escala del eje usa pasos limpios', () => {
  const app = loadApp();
  assert.equal(app.run('niceStep(1)'), 0.5);
  assert.equal(app.run('niceStep(3)'), 1);
  assert.equal(app.run('niceStep(7)'), 2.5);
  assert.equal(app.run('niceStep(40)'), 20);
});

test('la gráfica coloca cada registro del periodo en orden', () => {
  const app = loadApp({
    stored: { habits: [], health: { entries: [entry({ id: 'a', date: '2026-08-29', value: 73 }), entry({ id: 'b', date: TODAY, value: 72 })] } },
  });
  const chart = plain(app.run(`healthChart(healthSeries('weight'), '2026-08-29', 300)`));
  assert.equal(chart.points.length, 2);
  assert.ok(chart.points[0].x < chart.points[1].x);
  assert.ok(chart.points[0].y < chart.points[1].y, 'el valor mayor queda más arriba');
  assert.match(chart.svg, /<path class="hc-line"/);
});
