// Salud · hora de cada registro (opcional) y medidas personalizadas (hasta 5, con nombre, unidad, decimales, gráfica y
// rango). Las personalizadas funcionan con todo lo demás de Salud. La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain, STORAGE_KEY } from './harness.mjs';

const TODAY = '2026-09-27';
const run = (app, code) => plain(app.run(code));
const js = (v) => JSON.stringify(v);
let n = 0;
const e = (metric, unit, date, value, extra = {}) => ({ id: `e${n++}`, metric, unit, date, value, created: n, note: '', ...extra });
const water = (extra = {}) => ({ id: 'c-agua', label: 'Vasos de agua', symbol: 'vasos', decimals: 0, chart: 'bars', min: 0, max: 30, ...extra });
const create = (app, fields) => run(app, `saveHealthCustom(${js(fields)})`);

// ---------- Hora ----------

test('la hora es opcional: se guarda si es válida y se puede quitar al editar', () => {
  const app = loadApp({ stored: { habits: [] } });
  const save = (fields) => run(app, `saveHealthEntry('weight', ${js({ valueText: '72', date: TODAY, ...fields })})`);
  assert.match(save({ time: '25:00' }).errors.time, /hora válida/);
  assert.equal(app.run('state.health.entries.length'), 0);
  const withTime = save({ time: '08:30' }).entry;
  assert.equal(withTime.time, '08:30');
  assert.equal('time' in save({}).entry, false, 'sin hora, no se guarda ninguna');
  const edited = run(app, `saveHealthEntry('weight', ${js({ id: withTime.id, valueText: '72', date: TODAY, time: '' })}).entry`);
  assert.equal('time' in edited, false, 'al vaciarla se quita');
  const batch = run(app, `saveHealthBatch(${js({ date: TODAY, time: '21:15', values: { weight: { valueText: '71' }, sleep: { valueText: '7' } } })}).entries`);
  assert.deepEqual(batch.map((x) => x.time), ['21:15', '21:15'], 'el registro rápido la pone en todas');
  assert.equal(JSON.parse(app.storage.get(STORAGE_KEY)).health.entries.filter((x) => x.time).length, 2);
});

test('al cargar se conserva solo una hora válida; los registros de antes siguen igual', () => {
  const app = loadApp();
  const out = run(app, `normalize(${js({ habits: [], health: { entries: [
    e('weight', 'kg', TODAY, 70, { time: '07:05' }), e('weight', 'kg', TODAY, 70, { time: '7:05' }), e('weight', 'kg', TODAY, 70, { time: '24:00' }), e('weight', 'kg', TODAY, 70),
  ] } })}).health.entries.map((x) => x.time ?? null)`);
  assert.deepEqual(out, ['07:05', null, null, null]);
});

test('la hora se ve en la lista, en el CSV y en el informe', () => {
  const app = loadApp({ stored: { habits: [], health: { entries: [e('weight', 'kg', TODAY, 70.4, { time: '07:05', note: 'En ayunas' }), e('weight', 'kg', '2026-09-26', 70.8)] } } });
  const list = app.run(`healthListCard('weight')`);
  assert.match(list, /aria-label="Hoy, 07:05: 70,4 kg\. En ayunas\. Editar"/);
  assert.match(list, /<b>Ayer<\/b>/);
  const csv = app.run('healthCSV()').trim().split('\r\n');
  assert.equal(csv[0], 'Fecha;Hora;Medida;Valor;Diastólica;Pulso;Unidad;Nota', '(trim ya quita la marca UTF-8)');
  assert.deepEqual(csv.slice(1), ['2026-09-26;;Peso;70,8;;;kg;', '2026-09-27;07:05;Peso;70,4;;;kg;En ayunas']);
  const report = app.run(`healthReportHTML({ metrics: ['weight'], from: '2026-09-01', to: '${TODAY}' })`);
  assert.match(report, /<tr><td>27 sept 2026<\/td><td>07:05<\/td>/);
  assert.match(report, /<tr><td>26 sept 2026<\/td><td><span aria-hidden="true">—<\/span><span class="sr-only">sin hora<\/span><\/td>/);
});

// ---------- Medidas personalizadas ----------

test('crear una: se añade al catálogo, se pone a la vista y se guarda', () => {
  const app = loadApp({ stored: { habits: [] } });
  const { custom } = create(app, { label: '  Vasos   de agua ', symbol: 'vasos', decimals: 0, chart: 'bars', minText: '', maxText: '30' });
  assert.match(custom.id, /^c-[a-z0-9]{12}$/);
  assert.deepEqual({ ...custom, id: 'x' }, { id: 'x', label: 'Vasos de agua', symbol: 'vasos', decimals: 0, chart: 'bars', min: 0, max: 30 });
  assert.deepEqual(run(app, 'state.health.metrics'), ['weight', custom.id]);
  assert.equal(app.run('ui.healthMetric'), custom.id);
  assert.equal(app.run(`healthUnit('${custom.id}')`), 'u');
  assert.equal(app.run(`healthFieldLabel('${custom.id}')`), 'Vasos de agua (vasos)');
  const stored = JSON.parse(app.storage.get(STORAGE_KEY)).health;
  assert.deepEqual(stored.custom, [custom]);
  // Registrar: con su rango y sus decimales.
  const save = (valueText) => run(app, `saveHealthEntry('${custom.id}', ${js({ valueText, date: TODAY })})`);
  assert.equal(save('31').errors.value, 'Escribe un valor entre 0 y 30 vasos.');
  assert.equal(save('2,5').errors.value, 'Escribe un número entero.');
  assert.deepEqual([save('0').entry.value, save('6').entry.unit], [0, 'u']);
  // Al volver a abrir la app sigue ahí, con sus registros.
  const again = loadApp({ stored: JSON.parse(app.storage.get(STORAGE_KEY)) });
  assert.equal(again.run(`HEALTH_METRICS['${custom.id}'].label`), 'Vasos de agua');
  assert.equal(again.run(`healthSeries('${custom.id}').length`), 2);
});

test('valida el nombre, la unidad, el rango y el máximo de 5', () => {
  const app = loadApp({ stored: { habits: [], health: { custom: [water()] } } });
  const errors = (fields) => create(app, { label: 'Café', symbol: 'tazas', decimals: 0, chart: 'line', ...fields }).errors || {};
  assert.match(errors({ label: '' }).label, /Escribe un nombre/);
  assert.match(errors({ label: 'peso' }).label, /Ya tienes una medida con ese nombre/, 'tampoco el de una de la app');
  assert.match(errors({ label: 'VASOS DE AGUA' }).label, /ese nombre/);
  assert.match(errors({ label: '<b>Café</b>' }).label, /sin los signos/);
  assert.match(errors({ symbol: ' ' }).symbol, /Escribe la unidad/);
  assert.match(errors({ minText: '10', maxText: '5' }).range, /menor que el máximo/);
  assert.match(errors({ maxText: '100000' }).range, /del 0 al 99\.999, sin decimales/);
  assert.match(errors({ decimals: 1, minText: '1,555' }).range, /con 1 decimal como mucho/);
  assert.equal(create(app, { label: 'Café', symbol: 'tazas', decimals: 1, chart: 'line', minText: '0,5', maxText: '12,5' }).custom.max, 12.5);
  ['Uno', 'Dos', 'Tres'].forEach((label) => create(app, { label, symbol: 'x', decimals: 0, chart: 'line' }));
  assert.equal(app.run('state.health.custom.length'), 5);
  assert.match(errors({ label: 'Seis' }).form, /Ya tienes 5 medidas personalizadas/);
});

test('funciona con el resumen, el objetivo, la relación con los hábitos, el informe y el CSV', () => {
  const days = Array.from({ length: 20 }, (_, i) => new Date(Date.UTC(2026, 8, 8 + i)).toISOString().slice(0, 10));
  const entries = days.flatMap((d, i) => [e('c-agua', 'u', d, i % 2 ? 6 : 3), ...(i % 2 ? [e('c-agua', 'u', d, 2)] : [])]);
  const app = loadApp({ stored: {
    habits: [{ id: 'walk', name: 'Caminar', emoji: '🚶', created: '2026-09-01', done: Object.fromEntries(days.filter((d, i) => i % 2).map((d) => [d, 1])) }],
    health: { metrics: ['c-agua'], custom: [water()], goals: { 'c-agua': { type: 'up', min: 8 } }, entries },
  } });
  // Columnas: un total del día, así que se suman los registros de cada día (6 + 2 = 8).
  const s = run(app, `healthSummary('c-agua', 7)`);
  assert.deepEqual([s.now.count, s.now.days, s.now.stats.main.max], [11, 7, 8]);
  assert.match(app.run(`healthSummaryCard('c-agua')`), /<th scope="row">Media por día<\/th>/);
  assert.deepEqual(run(app, `healthGoalSentences('c-agua', healthGoalProgress('c-agua'))`), [
    'Último día con registro (hoy): 8 vasos, dentro de tu objetivo.',
    'En 5 de tus últimos 10 días con registro llegaste a 8 vasos.',
  ]);
  const r = run(app, `healthRelations('c-agua')[0]`);
  assert.deepEqual([r.done.mean, r.missed.mean, r.diff], [8, 3, 5]);
  const report = app.run(`healthReportHTML({ metrics: ['c-agua'], from: '2026-09-01', to: '${TODAY}', goals: true })`);
  assert.match(report, /<h2 id="report-c-agua">Vasos de agua <span class="report-unit">\(vasos\)<\/span><\/h2>/);
  assert.match(report, /Fijado por la persona: 8 vasos o más\./);
  assert.ok(app.run('healthCSV()').includes(`${TODAY};;Vasos de agua;6;;;vasos;`));
  assert.match(app.run(`healthDetailCard('c-agua', { clientWidth: 358 })`), /class="hc-bar/);
});

test('editarla: nombre, decimales y gráfica, sin perder registros; su objetivo se quita si queda fuera', () => {
  const app = loadApp({ stored: { habits: [], health: { metrics: ['c-agua'], custom: [water()], goals: { 'c-agua': { type: 'up', min: 25 } },
    entries: [e('c-agua', 'u', TODAY, 4), e('c-agua', 'u', '2026-09-26', 12)] } } });
  const edit = (fields) => run(app, `saveHealthCustom(${js({ ...water(), label: 'Agua', symbol: 'vasos', decimals: 1, chart: 'line', minText: '', maxText: '30', ...fields })})`);
  assert.match(edit({ minText: '5' }).errors.range, /Tienes registros entre 4 y 12: el rango tiene que incluirlos/);
  const ok = edit({ maxText: '20' });
  assert.equal(ok.goalRemoved, true, 'el objetivo (25) queda fuera del nuevo rango');
  assert.deepEqual(run(app, 'state.health.goals'), {});
  assert.equal(app.run(`HEALTH_METRICS['c-agua'].label`), 'Agua');
  assert.equal(app.run(`healthEntryText('c-agua', healthSeries('c-agua')[1])`), '4,0 vasos', 'ahora con un decimal');
  assert.deepEqual(run(app, `state.health.entries.map((x) => x.value)`), [12, 4], 'lo apuntado no cambia');
  assert.equal(app.run(`healthSummary('c-agua', 7).now.stats.main.mean`), 8, 'línea: media de los registros');
});

test('borrarla quita sus registros y su objetivo; se puede deshacer', () => {
  const app = loadApp({ stored: { habits: [], health: { metrics: ['weight', 'c-agua'], custom: [water()], goals: { 'c-agua': { type: 'up', min: 8 } },
    entries: [e('c-agua', 'u', TODAY, 4), e('weight', 'kg', TODAY, 70)] } } });
  const snapshot = app.run('JSON.stringify(state)');
  app.run(`removeHealthCustom('c-agua')`);
  const health = run(app, 'state.health');
  assert.deepEqual([health.custom, health.metrics, health.goals, health.entries.map((x) => x.metric), 'c-agua' in health.units], [[], ['weight'], {}, ['weight'], false]);
  assert.equal(app.run(`Object.hasOwn(HEALTH_METRICS, 'c-agua')`), false);
  app.context.__snapshot = snapshot;
  app.run('undoTo(__snapshot)()');
  assert.equal(app.run(`HEALTH_METRICS['c-agua'].label`), 'Vasos de agua');
  assert.equal(app.run('state.health.entries.length'), 2);
});

test('al leer datos o copias: solo las válidas, sin signos de HTML, y sin tocar las de la app hasta importar', () => {
  const app = loadApp({ stored: { habits: [], health: { custom: [water()] } } });
  const custom = run(app, `normalize(${js({ habits: [], health: { custom: [
    water({ id: 'c-a', label: 'Uno<img src=x onerror=alert(1)>' }), water({ id: 'c-a', label: 'Repetido' }), water({ id: 'mal id', label: 'Id malo' }),
    water({ id: 'c-b', label: '' }), water({ id: 'c-c', label: 'Al revés', min: 9, max: 3 }), water({ id: 'c-d', label: 'Dos', decimals: 7, chart: 'tarta' }),
    water({ id: 'c-e', label: 'Tres' }), water({ id: 'c-f', label: 'Cuatro' }), water({ id: 'c-g', label: 'Cinco' }), water({ id: 'c-h', label: 'Seis' }),
  ] } })}).health.custom`);
  assert.deepEqual(custom.map((c) => c.id), ['c-a', 'c-d', 'c-e', 'c-f', 'c-g'], 'como mucho 5');
  assert.equal(custom[0].label, 'Unoimg src=x onerror=ale', 'sin < > y con 24 caracteres como mucho');
  assert.deepEqual([custom[1].decimals, custom[1].chart], [0, 'line']);
  // Sus registros se leen con su rango; los de una personalizada que no viene se conservan.
  const entries = run(app, `normalize(${js({ habits: [], health: { custom: [water({ id: 'c-x' })], entries: [
    e('c-x', 'u', TODAY, 31), e('c-x', 'u', TODAY, 30), e('c-sin', 'u', TODAY, 0),
  ] } })}).health.entries.map((x) => x.metric + ':' + x.value)`);
  assert.deepEqual(entries, ['c-x:30', 'c-sin:0']);
  // Leer una copia no cambia las medidas de la app; importarla, sí.
  const text = js({ app: 'bonsai', version: 2, data: { habits: [], health: { custom: [water({ id: 'c-otra', label: 'Otra' })] } } });
  app.context.__backup = app.run(`readBackup(${js(text)})`);
  assert.deepEqual(run(app, `Object.keys(HEALTH_METRICS).filter((id) => id.startsWith('c-'))`), ['c-agua']);
  app.run('importBackup(__backup.data)');
  assert.deepEqual(run(app, `Object.keys(HEALTH_METRICS).filter((id) => id.startsWith('c-'))`), ['c-otra']);
});

test('copias y «Borrar todos los datos»; las copias antiguas no traen ninguna', () => {
  const app = loadApp({ stored: { habits: [], health: { custom: [water()], entries: [e('c-agua', 'u', TODAY, 4)] } } });
  assert.deepEqual(run(app, 'readBackup(JSON.stringify(backupPayload())).data.health.custom'), [water()]);
  assert.ok(run(app, 'backupItems(backupCounts(state))').includes('Salud: 1 registro y 1 medida personalizada'));
  assert.deepEqual(run(app, `readBackup(${js(js({ app: 'racha', version: 1, data: { habits: [{ name: 'Leer' }] } }))}).data.health.custom`), []);
  app.run('eraseAllData()');
  assert.deepEqual(run(app, 'state.health.custom'), []);
  assert.equal(app.run(`Object.hasOwn(HEALTH_METRICS, 'c-agua')`), false);
});

test('ni la hora ni las medidas personalizadas cambian la XP, las rachas o los retos', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];
  const app = loadApp({ stored: { habits, health: { custom: [water()], entries: [e('c-agua', 'u', TODAY, 4, { time: '09:00' })] } } });
  assert.deepEqual(run(app, 'computeStats()'), run(loadApp({ stored: { habits } }), 'computeStats()'));
});
