// Zen · fase 2: más respiraciones con el mismo motor, la misma animación y los mismos textos de fase.
// El suspiro fisiológico necesita una fase nueva: «Inhala otra vez».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const run = (app, code) => plain(app.run(code));

test('el suspiro: dos inhalaciones (la segunda, «inhala otra vez») y una exhalación larga', () => {
  const app = loadApp();
  const sigh = run(app, 'ZEN_BREATHS.sigh');
  assert.deepEqual(sigh.phases, [['in', 3], ['again', 1], ['out', 6]]);
  assert.ok(sigh.phases.at(-1)[1] > sigh.phases[0][1], 'la exhalación, más larga');
  assert.equal(app.run('ZEN_PHASE_TEXT.again'), 'Inhala otra vez');
  assert.equal(app.run(`breathTotal('sigh', 1)`), 60000, 'seis suspiros de 10 s en un minuto');
  assert.equal(app.run(`breathTotal('sigh', 3)`), 180000);
  const at = (ms) => run(app, `breathPhase('sigh', ${ms})`);
  assert.deepEqual([at(0).kind, at(0).left], ['in', 3]);
  assert.deepEqual([at(3200).kind, at(3200).left], ['again', 1]);
  assert.deepEqual([at(4000).kind, at(4000).left], ['out', 6]);
  assert.deepEqual([at(10000).kind, at(10000).round], ['in', 1]);
});

test('el círculo: casi lleno en la primera inhalación, lleno en la segunda; las demás, como siempre', () => {
  const app = loadApp();
  const shapes = (id) => run(app, `ZEN_BREATHS['${id}'].phases.map((_, i) => breathShape(ZEN_BREATHS['${id}'].phases, i))`);
  assert.deepEqual(shapes('sigh'), ['almost', 'full', '']);
  // Las de antes: lleno al inhalar, «mantén» como estaba y vacío al exhalar (igual que con la regla anterior).
  assert.deepEqual(shapes('box'), ['full', 'full', '', '']);
  assert.deepEqual(shapes('relax'), ['full', 'full', '']);
  assert.deepEqual(shapes('calm'), ['full', '']);
});

test('se elige, se guarda y se practica como las demás', () => {
  const app = loadApp({ stored: { habits: [], zen: { settings: { breath: 'sigh', breathMinutes: 1 } } } });
  assert.equal(app.run('state.zen.settings.breath'), 'sigh', 'es un ajuste válido');
  assert.match(app.run('zenBreathHTML()'), /data-zen-choice="breath:sigh" aria-checked="true">Suspiro</);
  app.run(`ui.zenScreen = 'breath'; startBreath(); zenRun.start -= 61000; tickZen()`);
  assert.deepEqual(run(app, 'state.zen.sessions.map((s) => [s.type, s.seconds])'), [['breath', 60]]);
  // Una copia con una respiración que esta versión no conoce vuelve a la de siempre.
  assert.equal(app.run(`normalizeZen({ settings: { breath: 'inventada' } }).settings.breath`), 'box');
});
