// Zen · fase 7: tus emociones en el tiempo. Por semana y por mes, con lo que ya se guarda: lo que más apuntas, la
// intensidad media y cómo cambia. Con pocos registros se dice en vez de resumir. Sin diagnósticos ni consejos.
// La fecha fija es el domingo 27 de septiembre de 2026 (la semana empieza el lunes 21).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const run = (app, code) => plain(app.run(code));
let n = 0;
const e = (date, words, intensity) => ({ id: `e${n++}`, date, words, intensity, created: n });

test('los periodos: semanas de lunes a domingo y meses naturales, el actual hasta hoy', () => {
  const app = loadApp();
  const weeks = run(app, `emotionPeriods('week')`);
  assert.equal(weeks.length, 6);
  assert.deepEqual(weeks.at(-1), { from: '2026-09-21', to: '2026-09-27' });
  assert.deepEqual(weeks.at(-2), { from: '2026-09-14', to: '2026-09-20' });
  const months = run(app, `emotionPeriods('month')`);
  assert.deepEqual(months.at(-1), { from: '2026-09-01', to: '2026-09-27' });
  assert.deepEqual(months.at(-2), { from: '2026-08-01', to: '2026-08-31' });
  assert.deepEqual(months[0], { from: '2026-04-01', to: '2026-04-30' });
  assert.deepEqual(run(app, `emotionPeriods('month', '2026-03-15', 2)`), [{ from: '2026-02-01', to: '2026-02-28' }, { from: '2026-03-01', to: '2026-03-15' }]);
});

test('con registros suficientes: lo que más apuntas, la intensidad media y el cambio', () => {
  const emotions = [
    e('2026-09-22', ['calma', 'alegría'], 2), e('2026-09-24', ['calma'], 2), e('2026-09-26', ['cansancio'], 3),
    e('2026-09-15', ['estrés'], 4), e('2026-09-16', ['estrés', 'cansancio'], 4), e('2026-09-18', ['cansancio'], 3),
  ];
  const app = loadApp({ stored: { habits: [], zen: { emotions } } });
  const t = run(app, `emotionTrend('week')`);
  assert.deepEqual([t.now.count, t.now.top, +t.now.avg.toFixed(2)], [3, [['calma', 2], ['alegría', 1], ['cansancio', 1]], 2.33]);
  assert.deepEqual(t.lines, [
    'Esta semana: 3 registros. Lo que más has apuntado: calma (2), alegría (1) y cansancio (1). Intensidad media: 2,3 de 5.',
    'La semana pasada: 3 registros, sobre todo cansancio (2), estrés (2). La intensidad media de ahora es más baja que la semana pasada (3,7 de 5).',
  ].map((s) => s.replace('cansancio (2), estrés (2)', 'cansancio (2) y estrés (2)')));
  // Por mes: todo septiembre junto, y agosto sin registros.
  const m = run(app, `emotionTrend('month')`);
  assert.equal(m.now.count, 6);
  assert.equal(m.lines[1], 'Del mes pasado hay pocos registros para comparar.');
});

test('con pocos registros lo dice, sin sacar conclusiones', () => {
  const app = loadApp({ stored: { habits: [], zen: { emotions: [e('2026-09-25', ['estrés'], 5), e('2026-09-26', ['estrés'], 5)] } } });
  const t = run(app, `emotionTrend('week')`);
  assert.deepEqual(t.lines, ['Esta semana solo hay 2 registros: con 3 o más verás aquí un resumen.']);
  const empty = loadApp({ stored: { habits: [], zen: { emotions: [e('2026-08-02', ['calma'], 3)] } } });
  assert.deepEqual(run(empty, `emotionTrend('week').lines`), ['Esta semana aún no hay registros: con 3 o más verás aquí un resumen.']);
});

test('la gráfica: intensidad media por periodo, con su alternativa en texto', () => {
  const emotions = [e('2026-09-22', ['calma'], 2), e('2026-09-23', ['calma'], 3), e('2026-09-24', ['calma'], 2), e('2026-09-15', ['estrés'], 4)];
  const app = loadApp({ stored: { habits: [], zen: { emotions } } });
  const html = app.run(`emotionChart('week', emotionPeriods('week'))`);
  assert.match(html, /role="img" aria-label="Intensidad media de 1 a 5 por semana: semana del 17 ago, pocos registros; [^"]*semana del 14 sept, pocos registros; semana del 21 sept, 2,3"/);
  assert.equal((html.match(/class="mini-bar[ "]/g) || []).length, 6);
  assert.match(html, /class="mini-bar em"[\s\S]*2,3/, 'la semana actual, resaltada');
  const section = app.run(`ui.zenDraft = { words: [], intensity: 3, note: '' }; zenEmotionsHTML()`);
  assert.match(section, /Tus emociones en el tiempo/);
  assert.match(section, /data-emotion-period="week" aria-checked="true">Por semana</);
  assert.match(section, /no es un diagnóstico/);
});

test('solo describe: nada de diagnósticos ni consejos', () => {
  const emotions = [];
  for (let i = 0; i < 12; i++) emotions.push(e(`2026-09-${String(10 + i).padStart(2, '0')}`, ['tristeza', 'agobio'], 5));
  const app = loadApp({ stored: { habits: [], zen: { emotions } } });
  const all = [...run(app, `emotionTrend('week').lines`), ...run(app, `emotionTrend('month').lines`)].join(' ');
  assert.doesNotMatch(all, /deber[ií]as|te recomend|consulta|ansiedad|depresi[oó]n|trastorno|diagn[oó]stic|preocupante|mejor[aó]|empeor/i);
});

test('sin emociones apuntadas, la sección no aparece', () => {
  const app = loadApp({ stored: { habits: [] } });
  assert.doesNotMatch(app.run(`ui.zenDraft = { words: [], intensity: 3, note: '' }; zenEmotionsHTML()`), /Tus emociones en el tiempo/);
});
