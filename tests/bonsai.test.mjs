// Fase 6: el bonsái que crece con el nivel. Solo dibuja: sale de los niveles y títulos de siempre.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

test('una ilustración distinta por cada título, de Semilla a Maestro, y Maestro de ahí en adelante', () => {
  const app = loadApp();
  const svgs = plain(app.run('Array.from({ length: 15 }, (_, i) => bonsaiSVG(i + 1))'));
  assert.equal(new Set(svgs).size, 15, 'las 15 etapas son distintas');
  const titles = plain(app.run('LEVELS.map((l) => l.title)'));
  svgs.forEach((svg, i) => assert.match(svg, new RegExp(`aria-label="Tu bonsái, en la etapa ${titles[i]}`)));
  assert.match(svgs[0], /la 1 de 15/);
  assert.match(svgs[14], /Maestro: la última/);
  assert.equal(app.run('bonsaiSVG(16)'), svgs[14]);
  assert.equal(app.run('bonsaiSVG(40)'), svgs[14]);
  assert.match(svgs[0], /bz-seed/, 'empieza siendo una semilla');
  assert.match(svgs[14], /bz-flower/, 'y el maestro florece');
});

test('la versión pequeña de Hoy es decorativa: el nivel ya se lee al lado', () => {
  const app = loadApp();
  const small = app.run(`bonsaiSVG(8, { size: 'small' })`);
  assert.match(small, /aria-hidden="true"/);
  assert.doesNotMatch(small, /role="img"/);
});

test('pintar Progreso con el bonsái no cambia nada de XP, rachas ni logros', () => {
  const app = loadApp({ stored: { habits: [{ id: 'r', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }] } });
  const before = plain(app.run('computeStats()'));
  app.run('renderProgress(); renderToday()');
  assert.deepEqual(plain(app.run('computeStats()')), before);
});
