// Ajustes: preferencias, compatibilidad con datos y copias antiguas, aviso de copia, borrar todo y ayuda.
// La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain, STORAGE_KEY } from './harness.mjs';

const DEFAULTS = {
  theme: 'auto', textSize: 'normal', haptics: true, startView: 'today', showChallenges: true,
  showJournal: true, showHealth: true, weeklySummary: true, backupReminder: 14,
};
const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];

test('los datos y copias de antes empiezan con los ajustes por defecto', () => {
  const app = loadApp({ stored: { habits } });
  assert.deepEqual(plain(app.run('state.prefs')), DEFAULTS);
  assert.deepEqual(plain(app.run('normalize({ habits: [] }).prefs')), DEFAULTS);
});

test('cada ajuste solo acepta valores válidos', () => {
  const app = loadApp();
  const prefs = plain(app.run(`normalizePrefs({
    theme: 'dark', textSize: 'enorme', haptics: 'no', startView: 'settings',
    showHealth: false, weeklySummary: false, backupReminder: 30, showJournal: 0, extra: 1,
  })`));
  assert.deepEqual(prefs, { ...DEFAULTS, theme: 'dark', showHealth: false, weeklySummary: false, backupReminder: 30 });
  assert.equal(app.run(`normalizePrefs({ backupReminder: '7' }).backupReminder`), 14, 'los números llegan como números');
});

test('cambiar un ajuste lo guarda y no toca hábitos, XP ni rachas', () => {
  const app = loadApp({ stored: { habits } });
  const before = plain(app.run('({ habits: state.habits, stats: computeStats() })'));
  app.run(`setPref('theme', 'dark'); setPref('backupReminder', 7); setPref('showChallenges', false); setPref('textSize', 'nada')`);
  const stored = JSON.parse(app.storage.get(STORAGE_KEY));
  assert.equal(stored.prefs.theme, 'dark');
  assert.equal(stored.prefs.backupReminder, 7);
  assert.equal(stored.prefs.showChallenges, false);
  assert.equal(stored.prefs.textSize, 'normal', 'un valor no válido no se guarda');
  assert.deepEqual(plain(app.run('({ habits: state.habits, stats: computeStats() })')), before);
});

test('los ajustes viajan en la copia; las copias sin ellos se reconocen', () => {
  const app = loadApp({ stored: { habits, prefs: { theme: 'light', haptics: false } } });
  const backup = plain(app.run('readBackup(JSON.stringify(backupPayload()))'));
  assert.equal(backup.hasPrefs, true);
  assert.equal(backup.data.prefs.theme, 'light');
  assert.equal(backup.data.prefs.haptics, false);
  const old = plain(app.run(`readBackup(${JSON.stringify(JSON.stringify({ app: 'bonsai', version: 2, data: { habits: [] } }))})`));
  assert.equal(old.hasPrefs, false);
});

test('sin vibración, marcar no vibra', () => {
  const app = loadApp({ stored: { habits } });
  app.run('navigator.vibrate = () => { __vibrations = (globalThis.__vibrations || 0) + 1; return true; }');
  app.run('haptic()');
  assert.equal(app.run('globalThis.__vibrations'), 1);
  app.run(`setPref('haptics', false); haptic(); haptic()`);
  assert.equal(app.run('globalThis.__vibrations'), 1);
});

test('con el resumen desactivado no se abre solo, pero la semana queda vista', () => {
  const app = loadApp({ stored: { habits, lastSummary: '2026-09-21' } });
  app.run('showSummary = () => { globalThis.__shown = (globalThis.__shown || 0) + 1; }');
  app.run(`setPref('weeklySummary', false); state.lastSummary = null; maybeShowSummary()`);
  assert.equal(app.run('globalThis.__shown'), undefined);
  assert.equal(app.run('state.lastSummary'), '2026-09-21', 'al activarlo no sale uno atrasado');
  app.run(`setPref('weeklySummary', true); state.lastSummary = null; maybeShowSummary()`);
  assert.equal(app.run('globalThis.__shown'), 1);
});

test('la app se abre en la pantalla elegida, salvo Salud si está oculta', () => {
  assert.equal(loadApp({ stored: { habits, prefs: { startView: 'history' } } }).run('ui.view'), 'history');
  assert.equal(loadApp({ stored: { habits, prefs: { startView: 'health' } } }).run('ui.view'), 'health');
  assert.equal(loadApp({ stored: { habits, prefs: { startView: 'health', showHealth: false } } }).run('ui.view'), 'today');
  assert.equal(loadApp({ stored: { habits } }).run('ui.view'), 'today');
});

test('ocultar Salud estando en Salud vuelve a Hoy, sin borrar registros', () => {
  const entries = [{ id: 'w', metric: 'weight', date: '2026-09-20', value: 70, unit: 'kg' }];
  const app = loadApp({ stored: { habits, health: { entries }, prefs: { startView: 'health' } } });
  app.run(`setPref('showHealth', false)`);
  assert.equal(app.run('ui.view'), 'today');
  assert.equal(app.run('state.health.entries.length'), 1);
});

test('el aviso de copia depende de los días sin copia y de si hay datos', () => {
  const noData = loadApp({ stored: { habits: [] } });
  assert.equal(noData.run('backupDue()'), null, 'sin datos no hay nada que copiar');
  const never = loadApp({ stored: { habits } });
  assert.deepEqual(plain(never.run('backupDue()')), { days: null });
  const old = loadApp({ stored: { habits, lastBackup: '2026-09-07' } });
  assert.deepEqual(plain(old.run('backupDue()')), { days: 20 });
  old.run(`setPref('backupReminder', 30)`);
  assert.equal(old.run('backupDue()'), null);
  old.run(`setPref('backupReminder', 0)`);
  assert.equal(old.run('backupDue()'), null, '«Nunca» no avisa');
  const recent = loadApp({ stored: { habits, lastBackup: '2026-09-20' } });
  assert.equal(recent.run('backupDue()'), null);
});

test('borrar todos los datos deja la app como nueva, también las copias guardadas', () => {
  const app = loadApp({
    stored: {
      habits, days: { '2026-09-26': { note: 'nota' } }, profile: { name: 'Ana' },
      health: { entries: [{ id: 'w', metric: 'weight', date: '2026-09-20', value: 70, unit: 'kg' }] },
      routines: [{ id: 'r', name: 'Mañana', habitIds: ['h1'] }], prefs: { theme: 'dark' },
    },
  });
  app.storage.set(`${STORAGE_KEY}:antes-de-importar`, '{}');
  app.storage.set(`${STORAGE_KEY}:rescate`, 'roto');
  assert.equal(app.run('eraseAllData()'), true);
  const state = plain(app.run('state'));
  assert.deepEqual(state.habits, []);
  assert.deepEqual(state.days, {});
  assert.deepEqual(state.routines, []);
  assert.deepEqual(state.health.entries, []);
  assert.equal(state.profile.name, '');
  assert.deepEqual(state.prefs, DEFAULTS);
  assert.equal(state.challengesSince, '2026-09-21');
  assert.equal(app.run('computeStats().xp'), 0);
  assert.equal(app.storage.has(`${STORAGE_KEY}:antes-de-importar`), false);
  assert.equal(app.storage.has(`${STORAGE_KEY}:rescate`), false);
  assert.deepEqual(JSON.parse(app.storage.get(STORAGE_KEY)).habits, []);
});

test('el almacenamiento cuenta los datos y las copias guardadas', () => {
  const app = loadApp({ stored: { habits } });
  const before = plain(app.run('dataSizes()'));
  assert.equal(before.data, Buffer.byteLength(app.storage.get(STORAGE_KEY)));
  assert.equal(before.saved, 0);
  app.storage.set(`${STORAGE_KEY}:antes-de-importar`, 'x'.repeat(2048));
  assert.equal(plain(app.run('dataSizes()')).saved, 2048);
  assert.equal(app.run('fmtBytes(2048)'), '2 KB');
  assert.equal(app.run('fmtBytes(1572864)'), '1,5 MB');
});

test('la ayuda usa las reglas reales de XP y protectores', () => {
  const app = loadApp();
  const faq = app.run('INFO.faq().body');
  assert.match(faq, /\+10 por cada hábito hecho/);
  assert.match(faq, /hasta \+10/);
  assert.match(faq, /\+25/);
  assert.match(faq, /7, 14, 21… días seguidos \(como mucho guardas 3\)/);
  assert.match(app.run('INFO.news().body'), /Versión 0\.6 beta/);
  assert.match(app.run('INFO.welcome().title'), /Cómo se usa Bonsái/);
});
