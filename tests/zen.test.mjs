// Zen: prácticas, gratitud, emociones y su relación con los hábitos. La fecha fija es el domingo 27 de
// septiembre de 2026 (la semana empieza el lunes 21).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain, STORAGE_KEY } from './harness.mjs';

const TODAY = '2026-09-27';
const run = (app, code) => plain(app.run(code));
const session = (fields) => ({ id: `s${Math.random()}`, type: 'meditation', date: TODAY, seconds: 600, created: 1, ...fields });
const meditate = { id: 'med', name: 'Meditar', created: '2026-09-01', type: 'meditate', mode: 'target', measure: 'min', goal: 10, unit: 'min', done: {} };
const floss = { id: 'floss', name: 'Hilo dental', created: '2026-09-01', done: {} };

test('los datos y copias sin Zen empiezan vacíos', () => {
  const app = loadApp({ stored: { habits: [] } });
  const zen = run(app, 'state.zen');
  assert.deepEqual(zen.sessions, []);
  assert.deepEqual(zen.gratitude, {});
  assert.deepEqual(zen.emotions, []);
  assert.equal(zen.settings.breath, 'box');
  assert.equal(zen.settings.habitId, null);
});

test('la normalización descarta lo que no es válido y conserva lo desconocido que es seguro', () => {
  const app = loadApp();
  const zen = run(app, `normalizeZen(${JSON.stringify({
    sessions: [session({ id: 'ok' }), session({ type: 'yoga' }), session({ date: '2026-02-30' }), session({ seconds: 0 }), session({ seconds: 99999 })],
    gratitude: { [TODAY]: ['  sol  ', '', 'x'.repeat(200), 'cuarta'], '2026-09-20': ['', ' '], malo: ['a'] },
    emotions: [
      { id: 'e1', date: TODAY, words: ['Calma', 'calma', 'palabra-nueva', 'estrés', 'alegría'], intensity: 9, note: ' nota ' },
      { id: 'e2', date: TODAY, words: [] },
    ],
    settings: { breath: 'nada', minutes: 10, volume: 2, habitId: 'med', rhythm: 'sí', interval: 5 },
  })})`);
  assert.deepEqual(zen.sessions.map((s) => s.id), ['ok']);
  assert.deepEqual(Object.keys(zen.gratitude), [TODAY]);
  assert.deepEqual(zen.gratitude[TODAY], ['sol', '', 'x'.repeat(140)]);
  assert.equal(zen.emotions.length, 1);
  assert.deepEqual(zen.emotions[0].words, ['calma', 'palabra-nueva', 'estrés']);
  assert.equal(zen.emotions[0].intensity, 5);
  assert.equal(zen.emotions[0].note, 'nota');
  assert.equal(zen.settings.breath, 'box');
  assert.equal(zen.settings.volume, 0.5);
  assert.equal(zen.settings.habitId, 'med');
  assert.equal(zen.settings.rhythm, true);
  assert.equal(zen.settings.interval, 5);
});

test('la reflexión es la misma todo el día y cambia al siguiente', () => {
  const app = loadApp();
  const today = app.run(`zenReflection('${TODAY}')`);
  assert.equal(app.run(`zenReflection('${TODAY}')`), today);
  assert.notEqual(app.run(`zenReflection('2026-09-28')`), today);
  assert.ok(app.run(`ZEN_REFLECTIONS.includes(${JSON.stringify(today)})`));
});

test('la respiración dura ciclos completos y sabe en qué fase está', () => {
  const app = loadApp();
  assert.equal(app.run(`breathTotal('box', 1)`), 64000, 'caja: 4 ciclos de 16 s');
  assert.equal(app.run(`breathTotal('relax', 3)`), 190000, '4-7-8: 10 ciclos de 19 s');
  assert.equal(app.run(`breathTotal('calm', 5)`), 300000);
  const at = (pattern, ms) => run(app, `breathPhase('${pattern}', ${ms})`);
  assert.deepEqual([at('box', 0).kind, at('box', 0).left], ['in', 4]);
  assert.deepEqual([at('box', 4500).kind, at('box', 4500).left, at('box', 4500).index], ['hold', 4, 1]);
  assert.deepEqual([at('box', 16000).kind, at('box', 16000).round], ['in', 1]);
  assert.deepEqual([at('relax', 11000).kind, at('relax', 11000).left], ['out', 8]);
  assert.deepEqual([at('calm', 9999).kind, at('calm', 9999).left], ['out', 1]);
});

test('una práctica se guarda si dura al menos un minuto; el 5-4-3-2-1, si se completa', () => {
  const app = loadApp({ stored: { habits: [] } });
  assert.equal(run(app, `completeZenPractice('breath', 59, true)`).saved, false);
  assert.equal(run(app, `completeZenPractice('grounding', 45, false)`).saved, false);
  assert.equal(run(app, `completeZenPractice('grounding', 45, true)`).saved, true);
  const saved = run(app, `completeZenPractice('meditation', 600.4, false)`);
  assert.deepEqual([saved.saved, saved.session.date, saved.session.seconds], [true, TODAY, 600]);
  assert.equal(JSON.parse(app.storage.get(STORAGE_KEY)).zen.sessions.length, 2);
});

test('en un hábito de minutos se suman los minutos practicados', () => {
  const app = loadApp({ stored: { habits: [meditate], zen: { settings: { habitId: 'med' } } } });
  const first = run(app, `completeZenPractice('meditation', 300, true).habit`);
  assert.deepEqual([first.changed, first.done, first.xp], [true, false, 0], 'a medias: sin XP todavía');
  assert.equal(app.run(`findHabit('med').done['${TODAY}']`), 5);
  const second = run(app, `completeZenPractice('breath', 320, true).habit`);
  assert.deepEqual([second.changed, second.done], [true, true]);
  assert.ok(second.xp > 0, 'al llegar a la meta da la XP de siempre');
  assert.equal(app.run(`findHabit('med').done['${TODAY}']`), 10);
});

test('en un hábito de sí o no se marca una vez', () => {
  const app = loadApp({ stored: { habits: [floss], zen: { settings: { habitId: 'floss' } } } });
  const first = run(app, `completeZenPractice('meditation', 120, true).habit`);
  assert.deepEqual([first.changed, first.done], [true, true]);
  const again = run(app, `completeZenPractice('meditation', 120, true).habit`);
  assert.deepEqual([again.changed, again.done, again.xp], [false, true, 0]);
  assert.equal(app.run(`findHabit('floss').done['${TODAY}']`), 1);
});

test('no se marca ningún hábito si no hay, si está en pausa, archivado o es para dejar algo', () => {
  const cases = [
    { habits: [floss], settings: {} },
    { habits: [{ ...floss, pauses: [{ from: '2026-09-20', to: null }] }], settings: { habitId: 'floss' } },
    { habits: [{ ...floss, archived: '2026-09-20' }], settings: { habitId: 'floss' } },
    { habits: [{ id: 'q', name: 'Dejar de fumar', kind: 'quit', created: '2026-09-01' }], settings: { habitId: 'q' } },
    { habits: [floss], settings: { habitId: 'no-existe' } },
  ];
  for (const { habits, settings } of cases) {
    const app = loadApp({ stored: { habits, zen: { settings } } });
    const before = run(app, 'state.habits');
    assert.equal(run(app, `completeZenPractice('meditation', 300, true)`).habit, null);
    assert.deepEqual(run(app, 'state.habits'), before);
  }
});

test('las sesiones de Zen no dan XP ni cambian rachas por sí solas', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];
  const before = loadApp({ stored: { habits } });
  const after = loadApp({ stored: { habits, zen: { sessions: [session({}), session({ type: 'breath' })], gratitude: { [TODAY]: ['sol'] } } } });
  assert.deepEqual(run(after, 'computeStats()'), run(before, 'computeStats()'));
});

test('la gratitud guarda hasta 3 cosas por día y un día vacío se borra', () => {
  const app = loadApp({ stored: { habits: [] } });
  app.run(`setGratitude('${TODAY}', 1, '  un paseo  ')`);
  assert.deepEqual(run(app, `state.zen.gratitude['${TODAY}']`), ['', 'un paseo', '']);
  app.run(`setGratitude('${TODAY}', 0, 'el café')`);
  assert.deepEqual(run(app, `state.zen.gratitude['${TODAY}']`), ['el café', 'un paseo', '']);
  app.run(`setGratitude('${TODAY}', 0, ''); setGratitude('${TODAY}', 1, '   ')`);
  assert.equal(app.run(`'${TODAY}' in state.zen.gratitude`), false);
});

test('las emociones admiten hasta 3 palabras conocidas y se pueden borrar', () => {
  const app = loadApp({ stored: { habits: [] } });
  assert.match(run(app, `addEmotion({ words: ['inventada'], intensity: 3 })`).error, /al menos una palabra/);
  const { entry } = run(app, `addEmotion({ words: ['calma', 'calma', 'alegría', 'cansancio', 'estrés', 'inventada'], intensity: 7, note: '  tras el paseo ' })`);
  assert.deepEqual(entry.words, ['calma', 'alegría', 'cansancio']);
  assert.equal(entry.intensity, 5);
  assert.equal(entry.note, 'tras el paseo');
  app.run(`addEmotion({ words: ['calma'], intensity: 2 })`);
  assert.deepEqual(run(app, 'emotionSummary()'), [['calma', 2], ['alegría', 1], ['cansancio', 1]]);
  app.run(`deleteEmotion('${entry.id}')`);
  assert.equal(app.run('state.zen.emotions.length'), 1);
});

test('las estadísticas cuentan minutos y sesiones de la semana y del mes', () => {
  const app = loadApp({
    stored: {
      habits: [],
      zen: {
        sessions: [
          session({ date: '2026-09-27', seconds: 600 }),
          session({ date: '2026-09-22', seconds: 190, type: 'breath' }),
          session({ date: '2026-09-15', seconds: 900 }),
          session({ date: '2026-08-30', seconds: 1200 }),
        ],
        gratitude: { '2026-09-27': ['sol'], '2026-09-02': ['mar'], '2026-08-31': ['lluvia'] },
        emotions: [{ id: 'e', date: '2026-09-10', words: ['calma'], intensity: 3 }],
      },
    },
  });
  const s = run(app, 'zenStats()');
  assert.deepEqual([s.weekMinutes, s.weekSessions], [13, 2]);
  assert.deepEqual([s.monthMinutes, s.monthSessions], [28, 3]);
  assert.deepEqual(s.byType, [{ type: 'breath', minutes: 3, sessions: 1 }, { type: 'meditation', minutes: 25, sessions: 2 }]);
  assert.deepEqual([s.gratitudeDays, s.emotions], [2, 1]);
});

test('Zen viaja en las copias; las copias sin Zen no borran el del dispositivo', () => {
  const app = loadApp({ stored: { habits: [], zen: { sessions: [session({})], gratitude: { [TODAY]: ['sol'] } } } });
  const backup = run(app, 'readBackup(JSON.stringify(backupPayload()))');
  assert.equal(backup.hasZen, true);
  assert.equal(backup.data.zen.sessions.length, 1);
  assert.ok(run(app, 'backupItems(backupCounts(state))').includes('Zen: 1 sesión y gratitud de 1 día'));
  const old = run(app, `readBackup(${JSON.stringify(JSON.stringify({ app: 'bonsai', version: 2, data: { habits: [] } }))})`);
  assert.equal(old.hasZen, false);
});

test('borrar todos los datos vacía también Zen', () => {
  const app = loadApp({ stored: { habits: [floss], zen: { sessions: [session({})], settings: { habitId: 'floss' } } } });
  app.run('eraseAllData()');
  const zen = run(app, 'state.zen');
  assert.deepEqual([zen.sessions, zen.settings.habitId], [[], null]);
});

test('el motor de práctica termina y guarda con el tiempo real, también la respiración y el 5-4-3-2-1', () => {
  const app = loadApp({ stored: { habits: [meditate], zen: { settings: { habitId: 'med', minutes: 5 } } } });
  // Meditación de 5 minutos: se simula que ha pasado el tiempo y el temporizador lo nota al siguiente paso.
  app.run(`ui.zenScreen = 'meditation'; startMeditation(); zenRun.start -= 5 * 60000 + 500; tickZen()`);
  assert.equal(app.run('zenRun'), null, 'termina sola');
  assert.deepEqual(run(app, 'state.zen.sessions.map((s) => [s.type, s.seconds])'), [['meditation', 300]]);
  assert.equal(app.run(`findHabit('med').done['${TODAY}']`), 5);
  // La pausa no cuenta como tiempo practicado. El reloj de las pruebas está quieto: que «pasen» 10 minutos
  // en pausa es retrasar a la vez el inicio y el momento en que se pausó.
  app.run(`ui.zenScreen = 'breath'; setZenSetting('breathMinutes', 1); startBreath(); zenRun.start -= 30000; toggleZenPause();
    zenRun.start -= 600000; zenRun.pausedAt -= 600000; toggleZenPause()`);
  assert.equal(Math.round(app.run('zenElapsed()') / 1000), 30);
  app.run('zenRun.start -= 40000; tickZen()');
  assert.deepEqual(run(app, 'state.zen.sessions.at(-1)').seconds, 64, 'hasta el final del último ciclo');
  // 5-4-3-2-1: 15 cosas encontradas completan el ejercicio.
  app.run(`ui.zenScreen = 'grounding'; startGrounding(); for (let i = 0; i < 15; i++) groundingFound()`);
  assert.equal(app.run('zenRun'), null);
  assert.equal(run(app, 'state.zen.sessions.at(-1)').type, 'grounding');
  // Terminar antes de un minuto no guarda nada.
  app.run(`ui.zenScreen = 'sounds'; startSounds(); zenRun.start -= 20000; finishZen(false)`);
  assert.equal(app.run('state.zen.sessions.length'), 3);
});
