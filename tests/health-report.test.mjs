// Salud · informe para el médico: medidas y periodo a elegir; resumen, gráfica y tabla de registros; objetivos y
// relación con los hábitos solo si se marcan; nada del diario, de Zen ni de los hábitos. Se imprime solo.
// La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadApp, plain } from './harness.mjs';

const ROOT = new URL('../', import.meta.url);
const run = (app, code) => plain(app.run(code));
let n = 0;
const e = (metric, unit, date, value, extra = {}) => ({ id: `e${n++}`, metric, unit, date, value, created: n, note: '', ...extra });
const data = (extra = {}) => ({
  profile: { name: 'Ana' },
  habits: [{ id: 'read', name: 'Leer', emoji: '📚', created: '2026-09-01', done: { '2026-09-26': 1 }, notes: { '2026-09-26': 'NOTA-HABITO' } }],
  days: { '2026-09-26': { mood: 4, note: 'NOTA-DIARIO' } },
  zen: { gratitude: { '2026-09-26': ['GRACIAS-ZEN'] }, emotions: [{ id: 'z', date: '2026-09-26', words: ['calma'], intensity: 3, note: 'EMOCION-ZEN' }] },
  health: {
    metrics: ['weight', 'bloodPressure', 'sleep'],
    goals: { weight: { type: 'down', max: 70 } },
    entries: [
      e('weight', 'kg', '2026-06-01', 75),
      e('weight', 'lb', '2026-09-01', 160, { note: 'En ayunas' }),
      e('weight', 'kg', '2026-09-10', 71.5),
      e('weight', 'kg', '2026-09-20', 71),
      e('weight', 'kg', '2026-09-27', 70.6),
      e('bloodPressure', 'mmHg', '2026-09-25', 120, { value2: 80, pulse: 64 }),
      e('bloodPressure', 'mmHg', '2026-09-26', 125, { value2: 82 }),
      e('sleep', 'h', '2026-09-26', 7.5),
    ],
  },
  ...extra,
});
const report = (app, options) => app.run(`healthReportHTML(${JSON.stringify(options)})`);

test('el periodo: los últimos días, desde el primer registro o dos fechas', () => {
  const app = loadApp({ stored: data() });
  const range = (...args) => run(app, `healthReportRange(${args.map((a) => JSON.stringify(a)).join(', ')})`);
  assert.deepEqual(range('30', ['weight']), { from: '2026-08-29', to: '2026-09-27' });
  assert.deepEqual(range('90', ['weight']), { from: '2026-06-30', to: '2026-09-27' });
  assert.deepEqual(range('365', ['weight']), { from: '2025-09-28', to: '2026-09-27' });
  assert.deepEqual(range('all', ['weight', 'sleep']), { from: '2026-06-01', to: '2026-09-27' });
  assert.deepEqual(range('all', ['sleep']), { from: '2026-09-26', to: '2026-09-27' });
  assert.deepEqual(range('custom', ['weight'], '2026-09-01', '2026-09-20'), { from: '2026-09-01', to: '2026-09-20' });
  assert.match(range('custom', ['weight'], '', '2026-09-20').error, /las dos fechas/);
  assert.match(range('custom', ['weight'], '2026-09-01', '2026-09-28').error, /posterior a hoy/);
  assert.match(range('custom', ['weight'], '2026-09-21', '2026-09-20').error, /anterior a la final/);
});

test('lleva las medidas elegidas, con su resumen, su gráfica y la tabla de registros en la unidad elegida', () => {
  const app = loadApp({ stored: data() });
  const html = report(app, { metrics: ['weight', 'bloodPressure'], from: '2026-06-30', to: '2026-09-27' });
  assert.match(html, /<h1 id="report-title" tabindex="-1">Informe de salud<\/h1>/);
  assert.match(html, /Ana · Del 30 jun 2026 al 27 sept 2026 \(90 días\)/);
  assert.match(html, /La app no interpreta las medidas ni da consejos médicos/);
  assert.match(html, /<section class="report-metric" aria-labelledby="report-weight"><h2 id="report-weight">Peso <span class="report-unit">\(kg\)<\/span><\/h2>/);
  assert.match(html, /aria-labelledby="report-bloodPressure"/);
  assert.doesNotMatch(html, /report-sleep/, 'solo las elegidas');
  // Resumen: 7, 30 y 90 días (el periodo entero).
  assert.match(html, /<th scope="col">7 días<\/th><th scope="col">30 días<\/th><th scope="col">90 días<\/th>/);
  // Gráfica con su texto.
  assert.match(html, /<figure class="report-chart"><svg[^>]*aria-hidden="true"/);
  assert.match(html, /<figcaption>Peso del 30 jun 2026 al 27 sept 2026: 4 registros, entre 70,6 kg y 72,6 kg\. Los valores están en la tabla de registros\.<\/figcaption>/);
  // Tabla: fecha, hora, valor, unidad y nota; lo apuntado en libras, en kilos; el registro de junio, fuera.
  assert.match(html, /<th scope="col">Fecha<\/th><th scope="col">Hora<\/th><th scope="col">Valor<\/th><th scope="col">Unidad<\/th><th scope="col">Nota<\/th>/);
  assert.match(html, /<tr><td>1 sept 2026<\/td><td><span aria-hidden="true">—<\/span><span class="sr-only">sin hora<\/span><\/td>\s*<td class="num">72,6<\/td><td>kg<\/td><td>En ayunas<\/td><\/tr>/);
  const weight = html.slice(html.indexOf('report-weight'), html.indexOf('report-bloodPressure'));
  assert.equal((weight.match(/<tr><td>\d/g) || []).length, 4);
  assert.doesNotMatch(weight, /1 jun 2026/);
  // La tensión, con el pulso.
  assert.match(html, /<th scope="col">Pulso<\/th>/);
  assert.match(html, /<td class="num">120\/80<\/td><td>mmHg<\/td><td class="num">64 lpm<\/td>/);
});

test('sin objetivos, relaciones, hábitos, diario ni Zen, salvo lo que se marque', () => {
  const app = loadApp({ stored: data() });
  const base = report(app, { metrics: ['weight', 'bloodPressure', 'sleep'], from: '2026-06-30', to: '2026-09-27' });
  assert.doesNotMatch(base, /Objetivo|hc-goal|objetivo/, 'el objetivo existe, pero no se ha marcado');
  assert.doesNotMatch(base, /Relación con sus hábitos|Leer|NOTA-HABITO|NOTA-DIARIO|GRACIAS-ZEN|EMOCION-ZEN|calma/);
  const withGoal = report(app, { metrics: ['weight'], from: '2026-06-30', to: '2026-09-27', goals: true });
  assert.match(withGoal, /<h3>Objetivo<\/h3><p>Fijado por la persona: 70 kg o menos\.<\/p>/);
  assert.match(withGoal, /class="hc-goal"/);
  assert.match(withGoal, /la línea discontinua es el objetivo/);
  const withRelations = report(app, { metrics: ['weight'], from: '2026-06-30', to: '2026-09-27', relations: true });
  assert.match(withRelations, /<h3>Relación con sus hábitos<\/h3>/);
  assert.match(withRelations, /Son coincidencias en sus datos, no causas\./);
  assert.match(withRelations, /Ningún hábito tiene datos suficientes en este periodo\./);
  assert.doesNotMatch(withRelations, /NOTA-HABITO|NOTA-DIARIO|GRACIAS-ZEN/);
});

test('la relación con los hábitos, si se marca y hay datos suficientes', () => {
  const days = Array.from({ length: 30 }, (_, i) => new Date(Date.UTC(2026, 7, 29 + i)).toISOString().slice(0, 10));
  const app = loadApp({ stored: {
    habits: [{ id: 'walk', name: 'Caminar', emoji: '🚶', created: '2026-08-01', done: Object.fromEntries(days.filter((d, i) => i % 2).map((d) => [d, 1])) }],
    health: { metrics: ['sleep'], entries: days.map((d, i) => e('sleep', 'h', d, i % 2 ? 8 : 7)) },
  } });
  const html = report(app, { metrics: ['sleep'], from: '2026-08-29', to: '2026-09-27', relations: true });
  assert.match(html, /<li><b>Caminar<\/b>: los días en que lo hizo, 8,0 h de media \(15 días\); los días en que no, 7,0 h \(15 días\)\. Diferencia: \+1,0 h\.<\/li>/);
});

test('un periodo que acaba antes de hoy, y una medida sin registros en él', () => {
  const app = loadApp({ stored: data() });
  const html = report(app, { metrics: ['weight', 'sleep'], from: '2026-09-01', to: '2026-09-20' });
  assert.match(html, /Del 1 sept 2026 al 20 sept 2026 \(20 días\)/);
  assert.match(html, /<th scope="col">7 días<\/th><th scope="col">20 días<\/th>/);
  assert.match(html, /Pocos datos en los 7 días hasta el 20 sept 2026: solo 1 registro, y hacen falta 2 para el resumen\./);
  assert.match(html, /text-anchor="end">20 sept<\/text>/, 'la gráfica acaba en la última fecha');
  assert.doesNotMatch(html, />Hoy</);
  assert.match(html, /<h2 id="report-sleep">Sueño <span class="report-unit">\(h\)<\/span><\/h2><p>Sin registros en este periodo\.<\/p>/);
});

test('se imprime solo el informe, en blanco y negro, sin botones y con saltos de página razonables', () => {
  const css = readFileSync(new URL('assets/css/styles.css', ROOT), 'utf8');
  const print = css.slice(css.indexOf('@media print'));
  assert.ok(css.includes('@media print'));
  assert.match(print, /html\.reporting body > :not\(#report\) \{ display: none !important; \}/);
  assert.match(print, /\.report-bar \{ display: none !important; \}/);
  assert.match(print, /--ink: #000000;/);
  assert.match(print, /display: table-header-group/);
  assert.match(print, /break-inside: avoid/);
  assert.match(css, /html\.reporting main,\s*html\.reporting \.timer-bar,\s*html\.reporting \.tabbar \{ display: none !important; \}/);
  const html = readFileSync(new URL('index.html', ROOT), 'utf8');
  assert.ok(html.indexOf('</main>') < html.indexOf('<section class="report" id="report"'), 'fuera de la app, para imprimirlo solo');
  assert.match(html, /id="report-print">Imprimir o guardar en PDF<\/button>/);
  assert.match(html, /<dialog class="modal" id="health-report-dialog"/);
});

test('hacer el informe no cambia nada', () => {
  const app = loadApp({ stored: data() });
  const before = [run(app, 'state'), run(app, 'computeStats()')];
  report(app, { metrics: ['weight', 'bloodPressure', 'sleep'], from: '2026-06-01', to: '2026-09-27', goals: true, relations: true });
  assert.deepEqual([run(app, 'state'), run(app, 'computeStats()')], before);
});
