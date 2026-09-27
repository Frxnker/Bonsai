// Fase 5: copias de seguridad. Se valida todo antes de reemplazar y nunca se pierden los datos locales.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain, STORAGE_KEY } from './harness.mjs';

const PRE_IMPORT_KEY = `${STORAGE_KEY}:antes-de-importar`;
const RESCUE_KEY = `${STORAGE_KEY}:rescate`;
const local = {
  habits: [{ id: 'mio', name: 'Leer', created: '2026-09-01', done: { '2026-09-26': 1 } }],
  days: { '2026-09-26': { note: 'mi nota' } },
  health: { entries: [{ id: 'w1', metric: 'weight', date: '2026-09-20', value: 70, unit: 'kg' }] },
};
const other = {
  app: 'bonsai',
  version: 2,
  exportedAt: '2026-09-20T10:00:00.000Z',
  data: { habits: [{ id: 'suyo', name: 'Correr' }], health: { entries: [] } },
};

test('la copia informa de su fecha y de lo que no es válido', () => {
  const app = loadApp();
  const text = JSON.stringify({
    ...other,
    data: {
      habits: [{ name: 'Correr' }, { name: '' }, { nombre: 'x' }],
      health: { entries: [{ id: 'a', metric: 'weight', date: '2026-09-01', value: 70, unit: 'kg' }, { id: 'b', metric: 'weight', date: 'mal', value: 70, unit: 'kg' }] },
    },
  });
  const backup = plain(app.run(`readBackup(${JSON.stringify(text)})`));
  assert.equal(backup.exportedAt, '2026-09-20T10:00:00.000Z');
  assert.deepEqual(backup.dropped, { habits: 2, health: 1 });
  assert.equal(backup.data.habits.length, 1);
});

test('el resumen de una copia cuenta hábitos, días, diario, Salud y rutinas', () => {
  const app = loadApp({ stored: { ...local, routines: [{ id: 'r', name: 'Mañana', habitIds: ['mio'] }] } });
  const counts = plain(app.run('backupCounts(state)'));
  assert.deepEqual(counts, { habits: 1, marked: 1, notes: 0, diary: 1, health: 1, routines: 1, zen: 0, gratitude: 0, emotions: 0 });
  const items = plain(app.run('backupItems(backupCounts(state))'));
  assert.deepEqual(items, ['1 hábito y 1 día marcado', 'Diario: 1 día con ánimo o nota', '1 rutina', 'Salud: 1 registro', 'Tu perfil y tu progreso']);
  assert.ok(!plain(app.run('backupItems(backupCounts(state), { health: false })')).some((i) => i.startsWith('Salud')));
});

test('importar guarda antes los datos actuales y se puede volver a ellos', () => {
  const app = loadApp({ stored: local });
  const before = plain(app.run('state'));
  app.context.__backup = app.run(`readBackup(${JSON.stringify(JSON.stringify(other))})`);
  assert.deepEqual(plain(app.run('importBackup(__backup.data)')), { ok: true });
  assert.equal(app.run('state.habits[0].id'), 'suyo');
  const saved = JSON.parse(app.storage.get(PRE_IMPORT_KEY));
  assert.equal(saved.data.habits[0].id, 'mio');
  assert.equal(JSON.parse(app.storage.get(STORAGE_KEY)).habits[0].id, 'suyo');

  assert.equal(app.run('restorePreImport()'), true);
  assert.deepEqual(plain(app.run('state.habits')), before.habits);
  assert.deepEqual(plain(app.run('state.days')), before.days);
  assert.deepEqual(plain(app.run('state.health')), before.health);
  assert.equal(app.storage.has(PRE_IMPORT_KEY), false);
  assert.equal(app.run('restorePreImport()'), false, 'sin copia previa no hay nada que recuperar');
});

test('si no hay espacio para la copia previa, no se importa nada', () => {
  const app = loadApp({ stored: local });
  const stored = app.storage.get(STORAGE_KEY);
  app.context.__backup = app.run(`readBackup(${JSON.stringify(JSON.stringify(other))})`);
  app.run(`localStorage.setItem = () => { throw new Error('QuotaExceededError'); }`);
  const result = plain(app.run('importBackup(__backup.data)'));
  assert.match(result.error, /espacio/);
  assert.equal(app.run('state.habits[0].id'), 'mio');
  assert.equal(app.storage.get(STORAGE_KEY), stored);
});

test('si la copia no se puede guardar, todo vuelve a como estaba', () => {
  const app = loadApp({ stored: local });
  const stored = app.storage.get(STORAGE_KEY);
  app.context.__backup = app.run(`readBackup(${JSON.stringify(JSON.stringify(other))})`);
  // Se puede guardar la copia previa, pero no los datos nuevos (por ejemplo, sin espacio).
  app.run(`(() => {
    const setItem = localStorage.setItem;
    localStorage.setItem = (k, v) => {
      if (k === '${STORAGE_KEY}' && v.includes('suyo')) throw new Error('QuotaExceededError');
      setItem(k, v);
    };
  })()`);
  const result = plain(app.run('importBackup(__backup.data)'));
  assert.match(result.error, /siguen como estaban/);
  assert.equal(app.run('state.habits[0].id'), 'mio');
  assert.equal(JSON.parse(app.storage.get(STORAGE_KEY)).habits[0].id, 'mio');
  assert.deepEqual(JSON.parse(app.storage.get(STORAGE_KEY)), JSON.parse(stored));
  assert.equal(app.storage.has(PRE_IMPORT_KEY), false);
});

test('los datos guardados que no se pueden leer se apartan en vez de perderse', () => {
  const broken = '{"habits": [ roto';
  const app = loadApp({ stored: broken });
  assert.equal(app.run('loadProblem'), true);
  assert.equal(app.storage.get(RESCUE_KEY), broken);
  assert.deepEqual(plain(app.run('state.habits')), []);
  // Aunque la app guarde encima, lo apartado sigue ahí.
  app.run(`state.profile.name = 'Nueva'; save()`);
  assert.equal(app.storage.get(RESCUE_KEY), broken);
});

test('un formato desconocido también se aparta', () => {
  const app = loadApp({ stored: { version: 99, cosas: [] } });
  assert.equal(app.run('loadProblem'), true);
  assert.equal(JSON.parse(app.storage.get(RESCUE_KEY)).version, 99);
});

test('sin datos guardados no hay nada que apartar', () => {
  const app = loadApp();
  assert.equal(app.run('loadProblem'), false);
  assert.equal(app.storage.has(RESCUE_KEY), false);
});

test('reordenar con el teclado usa la misma regla que arrastrar', () => {
  const habits = ['a', 'b', 'c'].map((id) => ({ id, name: id.toUpperCase(), created: '2026-09-01' }));
  const app = loadApp({ stored: { habits: [...habits, { id: 'x', name: 'Archivado', created: '2026-09-01', archived: '2026-09-10' }] } });
  app.run('reorderHabit(2, 0)');
  assert.deepEqual(plain(app.run('state.habits.map((h) => h.id)')), ['c', 'a', 'b', 'x']);
});
