// Zen · fase 5: modo dormir. Respiración 4-7-8 con la mezcla de sonidos, que baja poco a poco hasta apagarse en el
// tiempo elegido; pantalla muy oscura, encendida mientras suena, y un toque para salir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadApp, plain } from './harness.mjs';

const TODAY = '2026-09-27';
const run = (app, code) => plain(app.run(code));
const floss = { id: 'floss', name: 'Hilo dental', created: '2026-09-01', done: {} };

// AudioContext de mentira que apunta la programación de cada parámetro (sin sonar).
const FAKE_AUDIO = `(() => {
  const nodes = [];
  const param = (value = 1) => {
    const p = { value, calls: [] };
    ['setValueAtTime', 'exponentialRampToValueAtTime', 'linearRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues']
      .forEach((name) => { p[name] = (...args) => { p.calls.push([name, ...args]); }; });
    return p;
  };
  const node = (kind, extra = {}) => {
    const n = { kind, to: [], connect(t) { n.to.push(t); return t; }, disconnect() {}, start() {}, stop() {}, ...extra };
    nodes.push(n);
    return n;
  };
  audioCtx = {
    sampleRate: 8000, currentTime: 0, state: 'running', destination: { kind: 'destination' },
    createBuffer: (ch, length) => { const d = new Float32Array(length); return { length, getChannelData: () => d }; },
    createBufferSource: () => node('source', { buffer: null, loop: false }),
    createBiquadFilter: () => node('filter', { frequency: param(350), Q: param(1) }),
    createGain: () => node('gain', { gain: param(1) }),
    createOscillator: () => node('osc', { frequency: param(440) }),
    createDynamicsCompressor: () => node('compressor', { threshold: param(), knee: param(), ratio: param() }),
  };
  return nodes;
})()`;

test('empieza con 4 respiraciones 4-7-8 y la mezcla, y el sonido se apaga poco a poco en el tiempo elegido', () => {
  const app = loadApp({ stored: { habits: [], zen: { settings: { mix: { rain: 0.4, fire: 0.6 }, sleepMinutes: 30 } } } });
  const nodes = app.run(FAKE_AUDIO);
  app.run(`ui.zenScreen = 'sleep'; startSleep()`);
  assert.equal(app.run('zenRun.type'), 'sleep');
  assert.equal(app.run('zenRun.total'), 30 * 60000);
  assert.equal(app.run('zenRun.breathMs'), 4 * 19 * 1000, 'cuatro ciclos de 4 + 7 + 8 segundos');
  assert.deepEqual(run(app, 'zenRun.player.ids()'), ['rain', 'fire']);
  // El fundido: a volumen normal mientras se respira y, desde ahí, bajando hasta casi nada a los 30 minutos.
  const fade = nodes.find((n) => n.kind === 'gain' && n.gain.calls.some((c) => c[0] === 'exponentialRampToValueAtTime' && c[2] === 1800));
  assert.ok(fade, 'hay un volumen que se apaga a los 1800 s');
  assert.deepEqual(plain(fade.gain.calls), [['setValueAtTime', 1, 76], ['exponentialRampToValueAtTime', 0.0001, 1800]]);
  assert.ok(nodes.filter((n) => n.kind === 'gain' && n.to.includes(fade)).length === 2, 'los dos sonidos pasan por él');
  // La pantalla: un solo botón para salir; primero la respiración.
  const html = app.run('zenSleepHTML()');
  assert.match(html, /<button type="button" class="sleep-exit" data-sleep-exit aria-label="Salir del modo dormir">/);
  assert.match(html, /id="breath-circle"/);
  assert.match(html, /Toca la pantalla para salir/);
  app.run('zenRun.start -= 76500; tickZen()');
  assert.match(app.run('zenSleepHTML()'), /Buenas noches[\s\S]*El sonido se irá apagando poco a poco/);
});

test('al apagarse se guarda como práctica, marca el hábito y la pantalla sigue a oscuras', () => {
  const app = loadApp({ stored: { habits: [floss], zen: { settings: { habitId: 'floss', sleepMinutes: 15 } } } });
  app.run(FAKE_AUDIO);
  app.run(`ui.zenScreen = 'sleep'; startSleep(); zenRun.start -= 15 * 60000 + 500; tickZen()`);
  assert.equal(app.run('zenRun'), null);
  assert.deepEqual(run(app, 'state.zen.sessions.map((s) => [s.type, s.seconds])'), [['sleep', 900]]);
  assert.equal(app.run(`findHabit('floss').done['${TODAY}']`), 1);
  assert.equal(app.run('ui.sleep.done'), true);
  assert.equal(app.run('ui.zenResult'), null, 'sin la pantalla de resultado (que se vería clara)');
  assert.match(app.run('zenSleepHTML()'), /El sonido se ha apagado/);
  assert.equal(run(app, 'zenStats()').byType.find((t) => t.type === 'sleep').minutes, 15);
});

test('un toque sale: guarda lo que llevaba (si llega al minuto) y vuelve a la pantalla normal', () => {
  const app = loadApp({ stored: { habits: [] } });
  app.run(FAKE_AUDIO);
  app.run(`ui.zenScreen = 'sleep'; startSleep(); zenRun.start -= 5 * 60000; leaveSleep()`);
  assert.equal(app.run('zenRun'), null);
  assert.equal(app.run('ui.sleep'), null);
  assert.equal(app.run('ui.zenScreen'), 'sleep');
  assert.deepEqual(run(app, 'state.zen.sessions.map((s) => [s.type, s.seconds])'), [['sleep', 300]]);
  assert.match(app.run('zenSleepHTML()'), /El sonido se apaga en/, 'la pantalla de antes de empezar');
  // El aviso «Sesión guardada» se enseña (una vez) arriba de la pantalla a la que se vuelve.
  app.run(`ui.zenNotice = 'Sesión guardada: 5 minutos.'`);
  assert.match(app.run('zenNoticeHTML()'), /<p class="zen-notice" role="status">Sesión guardada: 5 minutos\.<\/p>/);
  assert.equal(app.run('zenNoticeHTML()'), '');
  // Salir enseguida no guarda nada.
  app.run(`startSleep(); zenRun.start -= 20000; leaveSleep()`);
  assert.equal(app.run('state.zen.sessions.length'), 1);
});

test('sin sonidos en la mezcla no empieza; el tiempo se recuerda', () => {
  const app = loadApp({ stored: { habits: [], zen: { settings: { mix: {}, sleepMinutes: 45 } } } });
  app.run(`ui.zenScreen = 'sleep'`);
  assert.match(app.run('zenControlsHTML()'), /data-zen-start disabled/);
  app.run('startSleep()');
  assert.equal(app.run('zenRun'), null);
  assert.match(app.run('zenSleepHTML()'), /Aún no has elegido ninguno/);
  assert.equal(app.run('state.zen.settings.sleepMinutes'), 45);
  assert.equal(app.run(`normalizeZen({ settings: { sleepMinutes: 50 } }).settings.sleepMinutes`), 30, 'lo que no es válido vuelve a 30');
  assert.equal(run(app, 'readBackup(JSON.stringify(backupPayload())).data.zen.settings.sleepMinutes'), 45);
});

test('se llega desde Zen, desde el pack «Dormir mejor» y desde el sueño de Salud (solo un enlace)', () => {
  const app = loadApp({ stored: { habits: [] } });
  assert.match(app.run('zenHomeHTML()'), /data-zen-screen="sleep"/);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="pack-sleep-link" data-open-sleep hidden/);
  assert.match(app.run(`healthDetailCard('sleep', { clientWidth: 358 })`), /data-open-sleep/);
  assert.doesNotMatch(app.run(`healthDetailCard('weight', { clientWidth: 358 })`), /data-open-sleep/);
  // Abrirlo no cambia nada de Salud.
  const before = run(app, 'state.health');
  app.run(`openZen('sleep')`);
  assert.deepEqual(run(app, 'state.health'), before);
});

test('no da XP ni cambia rachas por sí solo', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1 } }];
  const before = loadApp({ stored: { habits } });
  const after = loadApp({ stored: { habits, zen: { sessions: [{ id: 's', type: 'sleep', date: TODAY, seconds: 1800, created: 1 }] } } });
  assert.deepEqual(run(after, 'computeStats()'), run(before, 'computeStats()'));
});
