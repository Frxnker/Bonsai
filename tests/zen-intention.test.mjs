// Zen · fase 8: intención del día. Una frase corta por la mañana, que se ve en Hoy; por la noche, cómo fue (sí,
// a medias, no), sin XP. Historial en Zen. No aparece si no se usa. La fecha fija es el domingo 27 de septiembre.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

const TODAY = '2026-09-27';
const run = (app, code) => plain(app.run(code));
const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];

test('se escribe (hasta 100 caracteres, en una línea) y, vacía, se borra', () => {
  const app = loadApp({ stored: { habits } });
  assert.equal(app.run('INTENTION_MAX'), 100);
  app.run(`setIntention('${TODAY}', '  hoy quiero ir\\n con calma  ')`);
  assert.deepEqual(run(app, `state.zen.intentions['${TODAY}']`), { text: 'hoy quiero ir con calma', result: null });
  app.run(`setIntention('${TODAY}', ${JSON.stringify('x'.repeat(150))})`);
  assert.equal(app.run(`state.zen.intentions['${TODAY}'].text.length`), 100);
  app.run(`setIntention('${TODAY}', '   ')`);
  assert.equal(app.run(`'${TODAY}' in state.zen.intentions`), false);
});

test('cómo fue: sí, a medias o no; tocar otra vez el mismo lo quita; cambiar la frase no lo borra', () => {
  const app = loadApp({ stored: { habits } });
  app.run(`setIntention('${TODAY}', 'ir con calma'); rateIntention('${TODAY}', 'partly')`);
  assert.equal(app.run(`state.zen.intentions['${TODAY}'].result`), 'partly');
  app.run(`setIntention('${TODAY}', 'ir con más calma')`);
  assert.equal(app.run(`state.zen.intentions['${TODAY}'].result`), 'partly');
  app.run(`rateIntention('${TODAY}', 'partly')`);
  assert.equal(app.run(`state.zen.intentions['${TODAY}'].result`), null);
  app.run(`rateIntention('${TODAY}', 'inventado')`);
  assert.equal(app.run(`state.zen.intentions['${TODAY}'].result`), null);
});

test('en Hoy: solo si la has escrito; cómo fue, desde la tarde (y en días pasados)', () => {
  const morning = loadApp({ stored: { habits }, now: `${TODAY}T09:00:00` });
  assert.equal(morning.run(`canRateIntention('${TODAY}')`), false, 'por la mañana, aún no');
  assert.equal(morning.run(`canRateIntention('2026-09-26')`), true, 'un día pasado, sí');
  const evening = loadApp({ stored: { habits }, now: `${TODAY}T20:30:00` });
  assert.equal(evening.run(`canRateIntention('${TODAY}')`), true);
  // La tarjeta: su HTML de valorar (el DOM de las pruebas es de mentira, así que se prueba lo que pinta).
  evening.run(`setIntention('${TODAY}', 'ir con calma')`);
  assert.match(evening.run(`intentionRating('${TODAY}', 'x')`), /role="group" aria-labelledby="x"[\s\S]*data-intention-rate="2026-09-27:yes" aria-pressed="false">Sí<[\s\S]*A medias[\s\S]*>No</);
});

test('sin XP ni rachas, y sin avisos: si no se usa, no hay nada', () => {
  const before = loadApp({ stored: { habits } });
  const after = loadApp({ stored: { habits, zen: { intentions: { [TODAY]: { text: 'ir con calma', result: 'yes' }, '2026-09-26': { text: 'escuchar', result: 'no' } } } } });
  assert.deepEqual(run(after, 'computeStats()'), run(before, 'computeStats()'));
  assert.deepEqual(run(before, 'state.zen.intentions'), {});
  assert.match(before.run('zenHomeHTML()'), /Una frase para hoy/);
  assert.match(after.run('zenHomeHTML()'), /«ir con calma»/);
});

test('el historial en Zen, con un resumen de los últimos 30 días', () => {
  const intentions = {
    [TODAY]: { text: 'ir con calma', result: null },
    '2026-09-26': { text: 'escuchar más', result: 'yes' },
    '2026-09-25': { text: 'no correr', result: 'partly' },
    '2026-09-20': { text: 'descansar', result: null },
  };
  const app = loadApp({ stored: { habits, zen: { intentions } } });
  const html = app.run('zenIntentionHTML()');
  assert.match(html, /value="ir con calma"/);
  assert.match(html, /maxlength="100"/);
  assert.match(html, /En los últimos 30 días: 3 intenciones \(sí, 1; a medias, 1\)\./);
  assert.match(html, /«escuchar más»<\/span>\s*<span class="intention-result">Sí</);
  assert.match(html, /«descansar»<\/span>\s*<div class="intention-rate"/, 'las de días pasados sin marcar se pueden marcar');
});

test('viaja en la copia, se borra con todo y las copias de antes siguen valiendo', () => {
  const app = loadApp({ stored: { habits, zen: { intentions: { [TODAY]: { text: 'ir con calma', result: 'yes' } } } } });
  const copy = run(app, 'readBackup(JSON.stringify(backupPayload()))');
  assert.deepEqual(copy.data.zen.intentions, { [TODAY]: { text: 'ir con calma', result: 'yes' } });
  assert.ok(run(app, 'backupItems(backupCounts(state))').includes('Zen: 1 intención del día'));
  const cleaned = run(app, `normalizeZen({ intentions: { '${TODAY}': { text: ' x ', result: 'quizá' }, 'mal': { text: 'y' }, '2026-02-30': { text: 'z' }, '2026-09-01': { text: '' } } }).intentions`);
  assert.deepEqual(cleaned, { [TODAY]: { text: 'x', result: null } });
  const old = run(app, `readBackup(${JSON.stringify(JSON.stringify({ app: 'racha', data: { habits: [{ name: 'Leer' }], zen: { sessions: [] } } }))})`);
  assert.deepEqual(old.data.zen.intentions, {});
  app.run('eraseAllData()');
  assert.deepEqual(run(app, 'state.zen.intentions'), {});
});
