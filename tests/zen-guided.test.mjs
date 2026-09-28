// Zen · fase 3: escaneo corporal y relajación muscular progresiva. Texto paso a paso, campana suave al cambiar
// de paso, duraciones a elegir, pausa y salida. Se guardan y marcan el hábito como las demás prácticas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const TODAY = '2026-09-27';
const run = (app, code) => plain(app.run(code));
const floss = { id: 'floss', name: 'Hilo dental', created: '2026-09-01', done: {} };

test('los pasos: el escaneo va de los pies a la cabeza; la relajación, tensar y soltar grupo por grupo', () => {
  const app = loadApp();
  const scan = run(app, 'ZEN_GUIDES.scan.steps');
  assert.ok(scan.length >= 10);
  assert.match(scan[1][0], /pies/i, 'empieza por los pies');
  assert.match(scan.at(-2)[0], /cabeza/i, 'termina en la cabeza');
  scan.forEach(([title, text]) => assert.ok(title && text.length > 20, title));
  const pmr = run(app, 'ZEN_GUIDES.pmr');
  assert.equal(pmr.tense, 5);
  pmr.steps.forEach(([title, tense, release]) => assert.ok(title && tense && release && tense !== release, title));
  assert.deepEqual(run(app, 'ZEN_GUIDE_MINUTES'), { scan: [5, 10, 15, 20], pmr: [5, 10, 15] });
});

test('el tiempo se reparte entre los pasos y, en la relajación, cada paso empieza tensando 5 segundos', () => {
  const app = loadApp();
  const step = (kind, minutes, ms) => run(app, `guidedStep('${kind}', ${minutes}, ${ms})`);
  const n = app.run('ZEN_GUIDES.scan.steps.length');
  assert.deepEqual(step('scan', 10, 0), { index: 0, count: n, phase: null, left: 0 });
  assert.equal(step('scan', 10, (600000 / n) * 2 + 10).index, 2);
  assert.equal(step('scan', 10, 600000).index, n - 1, 'nunca pasa del último');
  // Relajación de 9 grupos en 9 minutos: 60 s por grupo, 5 tensando y 55 soltando.
  assert.deepEqual(step('pmr', 9, 0), { index: 0, count: 9, phase: 'tense', left: 5 });
  assert.deepEqual(step('pmr', 9, 3200), { index: 0, count: 9, phase: 'tense', left: 2 });
  assert.deepEqual(step('pmr', 9, 5000), { index: 0, count: 9, phase: 'release', left: 0 });
  assert.deepEqual(step('pmr', 9, 61000), { index: 1, count: 9, phase: 'tense', left: 4 });
  const t = run(app, `guidedText('pmr', guidedStep('pmr', 9, 1000))`);
  assert.deepEqual([t.count, t.title, t.phase], ['Paso 1 de 9', 'Las manos', 'Tensa · 4']);
  assert.equal(t.speak, 'Las manos. Tensa. Cierra los puños con fuerza.', 'lo que anuncia el lector de pantalla');
  const r = run(app, `guidedText('pmr', guidedStep('pmr', 9, 7000))`);
  assert.deepEqual([r.phase, r.speak], ['Suelta', 'Las manos. Suelta. Abre las manos y nota cómo se aflojan.']);
  assert.equal(run(app, `guidedText('scan', guidedStep('scan', 10, 60000))`).speak.startsWith('Los pies.'), true);
});

test('se practica con el motor de siempre: se puede pausar, se guarda y marca el hábito', () => {
  const app = loadApp({ stored: { habits: [floss], zen: { settings: { habitId: 'floss', scanMinutes: 5 } } } });
  app.run(`ui.zenScreen = 'scan'; startGuided('scan')`);
  assert.equal(app.run('zenRun.type'), 'scan');
  assert.equal(app.run('zenRun.total'), 5 * 60000);
  assert.match(app.run('zenGuidedHTML("scan")'), /Paso 1 de 13/);
  assert.match(app.run('zenControlsHTML()'), /data-zen-pause>Pausa<[\s\S]*data-zen-stop>Terminar</, 'pausa y salida');
  // Dos minutos en pausa no cuentan.
  app.run(`zenRun.start -= 60000; toggleZenPause(); zenRun.start -= 120000; zenRun.pausedAt -= 120000; toggleZenPause()`);
  assert.equal(Math.round(app.run('zenElapsed()') / 1000), 60);
  app.run('zenRun.start -= 240500; tickZen()');
  assert.equal(app.run('zenRun'), null, 'termina sola');
  assert.deepEqual(run(app, 'state.zen.sessions.map((s) => [s.type, s.seconds])'), [['scan', 300]]);
  assert.equal(app.run(`findHabit('floss').done['${TODAY}']`), 1);
  // Salir antes de un minuto no guarda nada.
  app.run(`ui.zenScreen = 'pmr'; startGuided('pmr'); zenRun.start -= 30000; finishZen(false)`);
  assert.equal(app.run('state.zen.sessions.length'), 1);
});

test('cuentan en las estadísticas de Zen, con su nombre', () => {
  const app = loadApp({ stored: { habits: [], zen: { sessions: [
    { id: 'a', type: 'scan', date: TODAY, seconds: 600, created: 1 },
    { id: 'b', type: 'pmr', date: TODAY, seconds: 300, created: 2 },
  ] } } });
  const s = run(app, 'zenStats()');
  assert.deepEqual([s.weekMinutes, s.weekSessions], [15, 2]);
  assert.deepEqual(s.byType.map((t) => t.type), ['scan', 'pmr']);
  assert.match(app.run('zenHomeHTML()'), /escaneo corporal, 10 minutos y relajación muscular, 5 minutos/);
});

test('las duraciones se recuerdan y las que no son válidas vuelven a las de siempre', () => {
  const app = loadApp();
  const s = run(app, `normalizeZen({ settings: { scanMinutes: 15, pmrMinutes: 20 } }).settings`);
  assert.deepEqual([s.scanMinutes, s.pmrMinutes], [15, 10]);
  const old = run(app, `normalizeZen({ settings: { breath: 'relax' } }).settings`);
  assert.deepEqual([old.scanMinutes, old.pmrMinutes, old.breath], [10, 10, 'relax'], 'las copias de antes empiezan con los de siempre');
});

test('no dan XP ni cambian rachas por sí solas', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];
  const before = loadApp({ stored: { habits } });
  const after = loadApp({ stored: { habits, zen: { sessions: [{ id: 'a', type: 'scan', date: TODAY, seconds: 600, created: 1 }, { id: 'b', type: 'pmr', date: TODAY, seconds: 600, created: 1 }] } } });
  assert.deepEqual(run(after, 'computeStats()'), run(before, 'computeStats()'));
});
