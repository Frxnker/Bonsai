// Zen · fase 4: mezclador de sonidos. Varios a la vez, cada uno con su volumen; viento y fuego nuevos, generados
// con Web Audio; se recuerda la última mezcla y se mantiene el temporizador de siempre.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const run = (app, code) => plain(app.run(code));

// Un AudioContext de mentira que apunta los nodos que se crean y cómo se conectan (sin sonar).
const FAKE_AUDIO = `(() => {
  const nodes = [];
  const param = (value = 0) => ({ value, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {},
    setTargetAtTime() {}, cancelScheduledValues() {}, setValueCurveAtTime() {} });
  const node = (kind, extra = {}) => {
    const n = { kind, to: [], started: false, stopped: false, connect(t) { n.to.push(t); return t; },
      start() { n.started = true; }, stop() { n.stopped = true; }, ...extra };
    nodes.push(n);
    return n;
  };
  audioCtx = {
    sampleRate: 8000, currentTime: 0, state: 'running', destination: { kind: 'destination' },
    createBuffer: (ch, length) => { const data = new Float32Array(length); return { length, getChannelData: () => data }; },
    createBufferSource: () => node('source', { buffer: null, loop: false }),
    createBiquadFilter: () => node('filter', { type: '', frequency: param(350), Q: param(1) }),
    createGain: () => node('gain', { gain: param(1) }),
    createOscillator: () => node('osc', { frequency: param(440) }),
    createDynamicsCompressor: () => node('compressor', { threshold: param(), knee: param(), ratio: param() }),
  };
  return nodes;
})()`;

test('las copias de antes del mezclador: su sonido y su volumen son su mezcla', () => {
  const app = loadApp();
  const mix = (settings) => run(app, `normalizeZen({ settings: ${JSON.stringify(settings)} }).settings.mix`);
  assert.deepEqual(mix({ sound: 'waves', volume: 0.3 }), { waves: 0.3 });
  assert.deepEqual(mix({}), { rain: 0.5 }, 'sin nada, la lluvia de siempre');
  assert.deepEqual(mix({ mix: { rain: 0.2, wind: 0.8, trueno: 0.5, fire: 3, soft: '0.4' } }), { rain: 0.2, wind: 0.8 }, 'solo sonidos conocidos con volumen válido');
  assert.deepEqual(mix({ mix: {} }), {}, 'una mezcla vacía se respeta');
  const app2 = loadApp({ stored: { habits: [], zen: { settings: { sound: 'brown', volume: 0.7 } } } });
  assert.deepEqual(run(app2, 'state.zen.settings.mix'), { brown: 0.7 });
});

test('añadir, quitar y ajustar sonidos; se recuerda la mezcla (y su primer sonido, para versiones anteriores)', () => {
  const app = loadApp({ stored: { habits: [] } });
  app.run(`toggleMixSound('wind'); toggleMixSound('fire')`);
  assert.deepEqual(run(app, 'state.zen.settings.mix'), { rain: 0.5, wind: 0.5, fire: 0.5 });
  app.run(`setMixVolume('fire', 0.2); toggleMixSound('rain')`);
  assert.deepEqual(run(app, 'state.zen.settings.mix'), { wind: 0.5, fire: 0.2 });
  assert.deepEqual(run(app, '[state.zen.settings.sound, state.zen.settings.volume]'), ['wind', 0.5]);
  assert.equal(app.run('mixNames()'), 'Viento y fuego');
  assert.match(app.run('zenSoundsHTML()'), /data-mix-toggle="fire" aria-pressed="true"[\s\S]*value="0.2" data-mix-volume="fire"\s+aria-label="Volumen de fuego"/);
  assert.match(app.run('zenSoundsHTML()'), /data-mix-toggle="rain" aria-pressed="false"[\s\S]*data-mix-volume="rain"\s+aria-label="Volumen de lluvia" disabled/);
  // Viaja en la copia.
  assert.deepEqual(run(app, 'readBackup(JSON.stringify(backupPayload())).data.zen.settings.mix'), { wind: 0.5, fire: 0.2 });
});

test('suenan todos a la vez y se pueden cambiar mientras suenan; el temporizador de siempre los apaga', () => {
  const app = loadApp({ stored: { habits: [], zen: { settings: { mix: { rain: 0.4, wind: 0.6 }, soundMinutes: 15 } } } });
  app.run(FAKE_AUDIO);
  app.run(`ui.zenScreen = 'sounds'; startSounds()`);
  assert.equal(app.run('zenRun.total'), 15 * 60000);
  assert.deepEqual(run(app, 'zenRun.player.ids()'), ['rain', 'wind']);
  app.run(`toggleMixSound('fire')`);
  assert.deepEqual(run(app, 'zenRun.player.ids()'), ['rain', 'wind', 'fire'], 'se añade al momento');
  app.run(`toggleMixSound('rain')`);
  assert.deepEqual(run(app, 'zenRun.player.ids()'), ['wind', 'fire'], 'y se quita');
  app.run('toggleZenPause()');
  assert.equal(app.run('zenRun.player'), null, 'en pausa no suena nada');
  app.run('toggleZenPause()');
  assert.deepEqual(run(app, 'zenRun.player.ids()'), ['wind', 'fire'], 'al seguir, la mezcla de ahora');
  app.run('zenRun.start -= 15 * 60000 + 500; tickZen()');
  assert.equal(app.run('zenRun'), null, 'se apaga solo a los 15 minutos');
  assert.deepEqual(run(app, 'state.zen.sessions.map((s) => [s.type, s.seconds])'), [['sounds', 900]]);
});

test('sin ningún sonido en la mezcla no se puede reproducir', () => {
  const app = loadApp({ stored: { habits: [], zen: { settings: { mix: {} } } } });
  app.run(`ui.zenScreen = 'sounds'`);
  assert.match(app.run('zenControlsHTML()'), /data-zen-start disabled/);
  app.run('startSounds()');
  assert.equal(app.run('zenRun'), null);
  assert.match(app.run('zenSoundsHTML()'), /Aún no hay ningún sonido en la mezcla/);
});

test('cada sonido es una receta de Web Audio; los de siempre, igual que antes', () => {
  const app = loadApp();
  const nodes = app.run(FAKE_AUDIO);
  assert.deepEqual(Object.keys(run(app, 'ZEN_SOUNDS')).sort(), Object.keys(run(app, 'Object.fromEntries(Object.keys(SOUND_RECIPES).map((k) => [k, 1]))')).sort());
  const graph = (kind) => {
    nodes.length = 0;
    const player = app.run(`startSound('${kind}', 0.5)`);
    return { player, nodes: [...nodes] };
  };
  // Lluvia: ruido rosa → paso alto a 500 Hz → volumen → fundido de salida (como antes) → compresor suave.
  const rain = graph('rain').nodes;
  const rainFilter = rain.find((n) => n.kind === 'filter');
  assert.deepEqual([rainFilter.type, rainFilter.frequency.value], ['highpass', 500]);
  assert.equal(rain.filter((n) => n.kind === 'source').length, 1);
  // Olas: paso bajo a 1000 Hz y el vaivén lento de siempre (0,09 Hz).
  const waves = graph('waves').nodes;
  assert.deepEqual(waves.filter((n) => n.kind === 'osc').map((o) => o.frequency.value), [0.09]);
  // Viento: dos ruidos por filtros de banda que se mueven con osciladores lentos (ráfagas).
  const wind = graph('wind').nodes;
  assert.equal(wind.filter((n) => n.kind === 'source').length, 2);
  assert.ok(wind.filter((n) => n.kind === 'filter').every((f) => f.type === 'bandpass'));
  assert.ok(wind.filter((n) => n.kind === 'osc').length >= 4 && wind.filter((n) => n.kind === 'osc').every((o) => o.frequency.value < 0.2), 'ráfagas lentas');
  // Fuego: un rumor grave y chasquidos (dos bucles de distinta duración), todo arrancado.
  const fire = graph('fire');
  const sources = fire.nodes.filter((n) => n.kind === 'source');
  assert.equal(sources.length, 3);
  assert.deepEqual(sources.slice(1).map((s) => s.buffer.length), [7 * 8000, 11 * 8000]);
  assert.ok([...fire.nodes].filter((n) => n.start && n.kind !== 'gain' && n.kind !== 'filter').every((n) => n.started));
  fire.player.stop();
  assert.ok(sources.every((s) => s.stopped), 'al parar se para todo');
});

test('los chasquidos del fuego son estallidos cortos y sueltos, no un ruido continuo', () => {
  const app = loadApp();
  const stats = run(app, `(() => {
    const ctx = { sampleRate: 8000, createBuffer: (c, length) => { const d = new Float32Array(length); return { getChannelData: () => d }; } };
    const data = crackleBuffer(ctx, 60).getChannelData(0);
    let silent = 0;
    let bursts = 0;
    let inBurst = false;
    for (const v of data) {
      if (Math.abs(v) < 1e-4) { silent++; if (inBurst) inBurst = false; } else if (!inBurst) { bursts++; inBurst = true; }
    }
    return { silent: silent / data.length, perSecond: bursts / 60 };
  })()`);
  assert.ok(stats.silent > 0.75, `casi todo silencio entre chasquidos (${stats.silent})`);
  assert.ok(stats.perSecond > 2 && stats.perSecond < 12, `unos pocos por segundo (${stats.perSecond})`);
});
