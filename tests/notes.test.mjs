// Fase 1: una nota corta en cada hábito y día, distinta de la nota del diario.
// La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const read = { id: 'r', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } };

test('las notas se limpian al cargar: una línea, sin vacías, con fecha válida y hasta 140 caracteres', () => {
  const app = loadApp({
    stored: {
      habits: [{
        ...read,
        notes: {
          '2026-09-25': '  Muy bien,\n  a primera hora  ',
          '2026-09-24': '   ',
          'ayer': 'fecha mala',
          '2026-09-23': 42,
          '2026-09-22': 'x'.repeat(300),
        },
      }],
    },
  });
  const notes = plain(app.run(`findHabit('r').notes`));
  assert.deepEqual(Object.keys(notes).sort(), ['2026-09-22', '2026-09-25']);
  assert.equal(notes['2026-09-25'], 'Muy bien, a primera hora');
  assert.equal(notes['2026-09-22'].length, 140);
});

test('los datos y copias de antes (también de Racha) empiezan sin notas', () => {
  const app = loadApp({ stored: { habits: [read] } });
  assert.deepEqual(plain(app.run(`findHabit('r').notes`)), {});
  const racha = JSON.stringify({ app: 'racha', version: 1, data: { habits: [{ id: 'a', name: 'Correr', done: { '2026-09-20': 1 } }] } });
  const backup = plain(app.run(`readBackup(${JSON.stringify(racha)})`));
  assert.equal(backup.error, undefined);
  assert.deepEqual(backup.data.habits[0].notes, {});
});

test('apuntar o borrar una nota no cambia marcas, rachas ni XP', () => {
  const app = loadApp({ stored: { habits: [read] } });
  const before = plain(app.run(`({ habit: { ...findHabit('r'), notes: undefined }, stats: computeStats(), streak: streakInfo(findHabit('r')) })`));
  app.run(`setHabitNote(findHabit('r'), '2026-09-24', 'No pude: viaje')`);
  app.run(`setHabitNote(findHabit('r'), '2026-09-26', 'Muy bien')`);
  assert.deepEqual(plain(app.run(`findHabit('r').notes`)), { '2026-09-24': 'No pude: viaje', '2026-09-26': 'Muy bien' });
  const after = plain(app.run(`({ habit: { ...findHabit('r'), notes: undefined }, stats: computeStats(), streak: streakInfo(findHabit('r')) })`));
  assert.deepEqual(after, before);
  app.run(`setHabitNote(findHabit('r'), '2026-09-24', '   ')`);
  assert.deepEqual(plain(app.run(`findHabit('r').notes`)), { '2026-09-26': 'Muy bien' }, 'una nota vacía se borra');
  assert.equal(JSON.parse(app.storage.get('racha:v1')).habits[0].notes['2026-09-26'], 'Muy bien', 'se guarda');
  assert.equal(app.run(`state.days['2026-09-26']`), undefined, 'no toca el diario');
});

test('solo se puede anotar en días en que el hábito existía, hasta hoy', () => {
  const app = loadApp({ stored: { habits: [{ ...read, pauses: [{ from: '2026-09-10', to: '2026-09-12' }], schedule: { type: 'days', days: [0, 2, 4] } }] } });
  const can = (day) => app.run(`canNote(findHabit('r'), '${day}')`);
  assert.equal(can('2026-09-27'), true, 'hoy');
  assert.equal(can('2026-09-11'), true, 'en pausa también');
  assert.equal(can('2026-09-27'), true, 'en un día de descanso también');
  assert.equal(can('2026-08-31'), false, 'antes de crearlo');
  assert.equal(can('2026-09-28'), false, 'mañana no');
});

test('en Hoy, cada hábito tiene su botón de nota, que dice si hay una', () => {
  const app = loadApp({ stored: { habits: [{ ...read, notes: { '2026-09-27': 'Capítulo 3 "El río"' } }] } });
  const row = app.run(`habitRow(findHabit('r'))`);
  assert.match(row, /data-note="r"/);
  assert.match(row, /aux-btn on/);
  assert.match(row, /Nota de hoy de «Leer»: Capítulo 3 &quot;El río&quot;\. Editar la nota/);
  app.run(`ui.day = '2026-09-26'`);
  assert.match(app.run(`habitRow(findHabit('r'))`), /Añadir una nota de ese día a «Leer»/);
  app.run(`ui.editing = true`);
  assert.doesNotMatch(app.run(`habitRow(findHabit('r'))`), /data-note/, 'en modo edición no');
});

test('las notas viajan en la copia y se cuentan al exportar e importar', () => {
  const app = loadApp({ stored: { habits: [{ ...read, notes: { '2026-09-26': 'Muy bien', '2026-09-25': 'Corto' } }] } });
  const backup = plain(app.run('readBackup(JSON.stringify(backupPayload()))'));
  assert.deepEqual(backup.data.habits[0].notes, { '2026-09-26': 'Muy bien', '2026-09-25': 'Corto' });
  assert.equal(plain(app.run('backupCounts(state)')).notes, 2);
  assert.ok(plain(app.run('backupItems(backupCounts(state))')).includes('2 notas en tus hábitos'));
});

test('borrar todos los datos borra también las notas', () => {
  const app = loadApp({ stored: { habits: [{ ...read, notes: { '2026-09-26': 'Muy bien' } }] } });
  app.run('eraseAllData()');
  assert.deepEqual(plain(app.run('state.habits')), []);
});
