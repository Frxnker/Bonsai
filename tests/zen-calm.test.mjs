// Zen · fase 1: «Necesito calma». Un toque: un minuto de respiración lenta; después, «¿Estás un poco mejor?».
// «Sí» cierra y «Todavía no» sigue con el 5-4-3-2-1. La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadApp, plain } from './harness.mjs';

const TODAY = '2026-09-27';
const run = (app, code) => plain(app.run(code));
const meditate = { id: 'med', name: 'Meditar', created: '2026-09-01', type: 'meditate', mode: 'target', measure: 'min', goal: 10, unit: 'min', done: {} };

test('un toque empieza un minuto de respiración lenta, sin tocar tus ajustes de Respirar', () => {
  const app = loadApp({ stored: { habits: [], zen: { settings: { breath: 'box', breathMinutes: 5 } } } });
  app.run(`startCalm('today')`);
  assert.equal(app.run('ui.zenScreen'), 'calm');
  assert.deepEqual(run(app, 'ui.calm'), { from: 'today', step: 'breath', lines: [] });
  assert.equal(app.run('zenRun.type'), 'breath');
  assert.equal(app.run('zenRun.total'), 60000, 'seis respiraciones de 5 + 5 segundos');
  assert.deepEqual(run(app, `breathPhase(CALM_BREATH, 0)`).kind, 'in');
  assert.deepEqual(run(app, '[state.zen.settings.breath, state.zen.settings.breathMinutes]'), ['box', 5]);
  const html = app.run('zenCalmHTML()');
  assert.match(html, /Un minuto para ti/);
  assert.match(html, /id="breath-circle"/);
});

test('al terminar se guarda como cualquier respiración y pregunta si estás mejor', () => {
  const app = loadApp({ stored: { habits: [meditate], zen: { settings: { habitId: 'med' } } } });
  app.run(`startCalm('today'); zenRun.start -= 60500; tickZen()`);
  assert.equal(app.run('zenRun'), null);
  assert.deepEqual(run(app, 'state.zen.sessions.map((s) => [s.type, s.seconds, s.date])'), [['breath', 60, TODAY]]);
  assert.equal(app.run(`findHabit('med').done['${TODAY}']`), 1, 'marca el hábito elegido, como las demás prácticas');
  assert.equal(app.run('ui.calm.step'), 'ask');
  const html = app.run('zenCalmHTML()');
  assert.match(html, /¿Estás un poco mejor\?/);
  assert.match(html, /data-calm-yes>Sí</);
  assert.match(html, /data-calm-more>Todavía no</);
  assert.match(html, /Un minuto de respiración se ha guardado en tu práctica/);
  assert.match(html, /«Meditar», apuntado: 1\/10 min/);
  assert.equal(run(app, 'zenStats()').weekSessions, 1, 'cuenta en las estadísticas de Zen');
});

test('«Todavía no» lanza el 5-4-3-2-1; al completarlo, cierre o otro minuto', () => {
  const app = loadApp({ stored: { habits: [] } });
  app.run(`startCalm('zen'); zenRun.start -= 60500; tickZen(); calmGrounding()`);
  assert.equal(app.run('ui.calm.step'), 'grounding');
  assert.equal(app.run('zenRun.type'), 'grounding');
  assert.match(app.run('zenCalmHTML()'), /He encontrado una \(0 de 5\)/);
  app.run('for (let i = 0; i < 15; i++) groundingFound()');
  assert.deepEqual(run(app, 'state.zen.sessions.map((s) => s.type)'), ['breath', 'grounding']);
  assert.equal(app.run('ui.calm.step'), 'done');
  const html = app.run('zenCalmHTML()');
  assert.match(html, /Has completado el 5-4-3-2-1/);
  assert.match(html, /data-calm-yes>Cerrar</);
  assert.match(html, /data-calm-again>Respirar otro minuto</);
  // «Sí» (o «Cerrar») vuelve a donde estabas: aquí, a la pantalla principal de Zen.
  app.run('leaveCalm()');
  assert.equal(app.run('ui.calm'), null);
  assert.equal(app.run('ui.zenScreen'), 'home');
});

test('siempre se puede salir: antes del minuto no se guarda nada ni se pregunta', () => {
  const app = loadApp({ stored: { habits: [meditate], zen: { settings: { habitId: 'med' } } } });
  app.run(`startCalm('today'); zenRun.start -= 20000`);
  // Los controles: solo «Salir», sin opciones ni pausa.
  const controls = app.run('zenControlsHTML()');
  assert.match(controls, /data-calm-leave>Salir</);
  assert.doesNotMatch(controls, /data-zen-pause|data-calm-start/);
  app.run('leaveCalm()');
  assert.equal(app.run('ui.calm'), null);
  assert.deepEqual(run(app, 'state.zen.sessions'), []);
  assert.equal(app.run(`findHabit('med').done['${TODAY}']`), undefined);
});

test('no da XP ni cambia rachas por sí solo', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];
  const app = loadApp({ stored: { habits } });
  const before = run(app, 'computeStats()');
  app.run(`startCalm('today'); zenRun.start -= 60500; tickZen(); calmGrounding(); for (let i = 0; i < 15; i++) groundingFound()`);
  assert.equal(app.run('state.zen.sessions.length'), 2);
  assert.deepEqual(run(app, 'computeStats()'), before);
});

test('el botón está en la tarjeta de Zen de Hoy (fuera de su botón) y arriba en Zen', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const box = html.slice(html.indexOf('id="zen-card-box"'), html.indexOf('</div>', html.indexOf('id="zen-card-box"')));
  const cardEnd = box.indexOf('</button>');
  assert.ok(cardEnd > 0 && box.indexOf('data-calm="today"') > cardEnd, 'no va dentro del botón que abre Zen');
  assert.match(box, /Necesito calma/);
  const app = loadApp({ stored: { habits: [] } });
  const home = app.run('zenHomeHTML()');
  assert.ok(home.indexOf('data-calm="zen"') < home.indexOf('Reflexión del día'), 'lo primero de Zen');
  assert.equal(app.run('ZEN_SCREENS.calm'), 'Necesito calma');
});
