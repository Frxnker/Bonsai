// Fase 1: modelo de datos de Salud, compatibilidad con copias antiguas y copia de seguridad.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const weight = (fields) => ({ id: 'w1', metric: 'weight', date: '2026-09-20', value: 72.4, unit: 'kg', note: '', created: 1, ...fields });
const withHealth = (health) => ({ habits: [], health });

const EMPTY_HEALTH = {
  units: { weight: 'kg', waist: 'cm', restingHr: 'bpm', bloodPressure: 'mmHg', sleep: 'h', bodyFat: 'pct', temperature: 'c', steps: 'steps' },
  metrics: ['weight'],
  reminder: { days: [0, 1, 2, 3, 4, 5, 6], time: '08:00' },
  entries: [],
};

test('los datos y copias sin Salud reciben la sección vacía, con el peso en kg a la vista', () => {
  const app = loadApp({ stored: { habits: [] } });
  assert.deepEqual(plain(app.run('state.health')), EMPTY_HEALTH);
  const data = plain(app.run('normalize({ habits: [] })'));
  assert.deepEqual(data.health, EMPTY_HEALTH);
});

test('las copias de antes de tener más medidas conservan el peso y se quedan con el peso a la vista', () => {
  const app = loadApp();
  const old = { habits: [], health: { units: { weight: 'lb' }, entries: [weight({ value: 160, unit: 'lb' })] } };
  const health = plain(app.run(`normalize(${JSON.stringify(old)}).health`));
  assert.deepEqual(health.metrics, ['weight']);
  assert.equal(health.units.weight, 'lb');
  assert.deepEqual(health.reminder, EMPTY_HEALTH.reminder);
  assert.equal(health.entries[0].value, 160);
});

test('se conserva la unidad elegida y se ignora una desconocida', () => {
  const app = loadApp();
  assert.equal(app.run(`normalize(${JSON.stringify(withHealth({ units: { weight: 'lb' } }))}).health.units.weight`), 'lb');
  assert.equal(app.run(`normalize(${JSON.stringify(withHealth({ units: { weight: 'stone' } }))}).health.units.weight`), 'kg');
  assert.equal(app.run(`normalize(${JSON.stringify(withHealth({ units: { weight: '__proto__' } }))}).health.units.weight`), 'kg');
});

test('se descartan registros con fecha, valor o unidad no válidos', () => {
  const app = loadApp();
  const entries = [
    weight({ id: 'ok' }),
    weight({ id: 'fecha-imposible', date: '2026-02-30' }),
    weight({ id: 'sin-fecha', date: 'ayer' }),
    weight({ id: 'muy-antigua', date: '1850-01-01' }),
    weight({ id: 'bajo', value: 5 }),
    weight({ id: 'alto', value: 900 }),
    weight({ id: 'texto', value: 'setenta' }),
    weight({ id: 'unidad', unit: 'stone' }),
    weight({ id: 'lb-ok', value: 160, unit: 'lb' }),
    weight({ id: 'lb-alto', value: 881, unit: 'lb' }),
    { id: 'proto', metric: 'constructor', date: '2026-09-20', value: 1, unit: 'x' },
    null,
  ];
  const ids = plain(app.run(`normalize(${JSON.stringify(withHealth({ entries }))}).health.entries.map((e) => e.id)`));
  assert.deepEqual(ids.sort(), ['lb-ok', 'ok', 'proto'].sort());
});

test('los registros se ordenan por fecha, se quitan los repetidos y la nota se recorta', () => {
  const app = loadApp();
  const entries = [
    weight({ id: 'b', date: '2026-09-21', created: 5 }),
    weight({ id: 'a2', date: '2026-09-20', created: 9 }),
    weight({ id: 'a1', date: '2026-09-20', created: 3, note: `  ${'x'.repeat(250)}  ` }),
    weight({ id: 'b', date: '2026-09-25' }),
  ];
  const out = plain(app.run(`normalize(${JSON.stringify(withHealth({ entries }))}).health.entries`));
  assert.deepEqual(out.map((e) => e.id), ['a1', 'a2', 'b']);
  assert.equal(out[0].note.length, 200);
  assert.equal(out[2].date, '2026-09-21');
});

test('los valores se guardan con dos decimales como mucho', () => {
  const app = loadApp();
  const out = plain(app.run(`normalize(${JSON.stringify(withHealth({ entries: [weight({ value: 72.456 })] }))}).health.entries[0]`));
  assert.equal(out.value, 72.46);
});

test('las medidas que esta versión no conoce se conservan', () => {
  const app = loadApp();
  const entries = [{ id: 'c1', metric: 'waist', date: '2026-09-20', value: 80, unit: 'cm' }];
  const out = plain(app.run(`normalize(${JSON.stringify(withHealth({ entries }))}).health.entries`));
  assert.equal(out.length, 1);
  assert.equal(out[0].metric, 'waist');
});

test('Salud no cambia la XP, las rachas ni los retos', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];
  const before = loadApp({ stored: { habits } });
  const after = loadApp({ stored: { habits, health: { entries: [weight({}), weight({ id: 'w2', date: '2026-09-26', value: 71 })] } } });
  assert.deepEqual(plain(after.run('computeStats()')), plain(before.run('computeStats()')));
});

test('la copia exportada incluye Salud, salvo si se pide sin ella', () => {
  const app = loadApp({ stored: { habits: [], health: { units: { weight: 'lb' }, entries: [weight({ value: 160, unit: 'lb' })] } } });
  const full = plain(app.run('backupPayload()'));
  assert.equal(full.app, 'bonsai');
  assert.equal(full.data.health.entries.length, 1);
  assert.equal(full.data.health.units.weight, 'lb');
  const without = plain(app.run('backupPayload({ health: false })'));
  assert.equal(without.data.health, undefined);
  assert.ok(Array.isArray(without.data.habits));
});

test('una copia exportada se puede volver a importar sin perder Salud', () => {
  const app = loadApp({ stored: { habits: [], health: { entries: [weight({ note: 'tras correr' })] } } });
  const text = JSON.stringify(app.run('backupPayload()'));
  const backup = plain(app.run(`readBackup(${JSON.stringify(text)})`));
  assert.equal(backup.hasHealth, true);
  assert.deepEqual(backup.data.health.entries, plain(app.run('state.health.entries')));
});

test('las copias antiguas se reconocen como copias sin Salud', () => {
  const app = loadApp();
  const oldBackup = JSON.stringify({ app: 'racha', version: 1, data: { habits: [{ name: 'Leer' }] } });
  const backup = plain(app.run(`readBackup(${JSON.stringify(oldBackup)})`));
  assert.equal(backup.hasHealth, false);
  assert.equal(backup.data.habits.length, 1);
  const bare = plain(app.run(`readBackup(${JSON.stringify(JSON.stringify({ habits: [] }))})`));
  assert.equal(bare.hasHealth, false);
});

test('readBackup rechaza archivos que no son copias de Bonsái, con un motivo claro', () => {
  const app = loadApp();
  const error = (text) => app.run(`readBackup(${JSON.stringify(text)}).error`);
  assert.match(error('no es json'), /no se puede leer/);
  assert.match(error(JSON.stringify({ app: 'otra', data: { habits: [] } })), /otra app/);
  for (const text of ['42', 'null', '[]', JSON.stringify({ data: {} }), JSON.stringify({ habits: 'x' })]) {
    assert.match(error(text), /formato/, text);
  }
});
