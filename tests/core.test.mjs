// Comportamiento que ya existía: sirve para detectar regresiones al añadir funciones nuevas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain, STORAGE_KEY } from './harness.mjs';

const habit = (fields) => ({ id: 'h1', name: 'Leer', emoji: '📚', created: '2026-09-01', done: {}, ...fields });

test('sin datos guardados arranca con el estado vacío', () => {
  const app = loadApp();
  const state = plain(app.run('state'));
  assert.deepEqual(state.habits, []);
  assert.equal(state.profile.since, '2026-09-27');
  assert.deepEqual(state.days, {});
});

test('las copias antiguas de Racha se normalizan sin perder hábitos ni días', () => {
  const app = loadApp();
  const old = {
    habits: [{ id: 'a', name: '  Correr  ', emoji: '🏃', color: 'violeta', done: { '2026-09-20': 1, malo: 1 } }],
    bank: { xp: 40 },
  };
  const data = plain(app.run(`normalize(${JSON.stringify(old)})`));
  assert.equal(data.habits.length, 1);
  const [h] = data.habits;
  assert.equal(h.name, 'Correr');
  assert.equal(h.color, 'glicina');
  assert.equal(h.type, 'custom');
  assert.deepEqual(h.done, { '2026-09-20': 1 });
  assert.equal(data.bank.xp, 40);
});

test('normalize rechaza datos sin lista de hábitos', () => {
  const app = loadApp();
  assert.equal(app.run('normalize({})'), null);
  assert.equal(app.run('normalize(null)'), null);
});

test('la XP de una racha diaria sigue las reglas de siempre', () => {
  const app = loadApp({
    stored: { habits: [habit({ done: { '2026-09-24': 1, '2026-09-25': 1, '2026-09-26': 1 } })] },
  });
  const info = plain(app.run('streakInfo(state.habits[0])'));
  assert.equal(info.xp, 10 + 11 + 12);
  assert.equal(info.current, 3);
  assert.equal(info.best, 3);
});

test('los datos guardados se leen al abrir la app', () => {
  const app = loadApp({ stored: { habits: [habit()], profile: { name: 'Ana' } } });
  assert.equal(app.run('state.profile.name'), 'Ana');
  assert.equal(app.run('state.habits.length'), 1);
  assert.ok(app.storage.get(STORAGE_KEY));
});
