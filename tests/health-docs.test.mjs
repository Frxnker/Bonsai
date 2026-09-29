// Salud · fase final: versión (se queda en la 0.8 beta), caché nueva, Novedades, preguntas frecuentes y README.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { loadApp } from './harness.mjs';

const ROOT = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8');

test('versión 0.8 beta y caché nueva, con todos sus archivos (no hay archivos nuevos)', () => {
  const app = loadApp();
  assert.equal(app.run('APP_VERSION'), '0.8 beta');
  const sw = read('sw.js');
  assert.match(sw, /const CACHE = 'bonsai-v30';/);
  const assets = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  assets.forEach((path) => assert.ok(existsSync(new URL(path, ROOT)), `${path} existe`));
  assert.deepEqual([...new Set(assets.filter((p) => /\.(html|css|js|json)$/.test(p)))].sort(), ['assets/css/styles.css', 'assets/js/app.js', 'index.html', 'manifest.json']);
  assert.match(read('README.md'), /Versión actual: \*\*0\.8 beta\*\*/);
});

test('Novedades de la 0.8 beta: una sola versión, por grupos, con todo lo nuevo de Salud', () => {
  const app = loadApp();
  const news = app.run('INFO.news().body');
  assert.match(news, /^<h3 class="news-title">Versión 0\.8 beta<\/h3>/);
  assert.equal(news.match(/Versión 0\.8 beta/g).length, 1, 'la 0.8 sale una sola vez');
  assert.ok(!/Versión 0\.(9|1\d) beta/.test(news), 'ninguna versión por encima de la actual');
  assert.deepEqual([...news.matchAll(/<h4 class="news-group">([^<]*)<\/h4>/g)].map((m) => m[1]), ['Hábitos', 'Zen', 'Salud']);
  const now = news.slice(news.indexOf('>Salud</h4>'), news.indexOf('Versión 0.7 beta'));
  ['resumen de cada medida', '7, 30 y 90 días', 'Un objetivo en cada medida', 'sin juicios', 'Relación con tus hábitos', 'no una causa',
    'Informe para el médico', 'PDF', 'glucosa', 'oxígeno en sangre', 'estado de ánimo', 'energía', 'dolor', 'Tus propias medidas: hasta 5',
    'La hora de cada registro, opcional'].forEach((w) => assert.ok(now.includes(w), w));
});

test('las preguntas frecuentes explican lo nuevo de Salud', () => {
  const app = loadApp();
  const faq = app.run('INFO.faq().body');
  const health = faq.slice(faq.indexOf('¿Qué guarda Salud?'), faq.indexOf('</details>', faq.indexOf('¿Qué guarda Salud?')));
  ['glucosa', 'oxígeno en sangre', 'estado de ánimo', 'energía', 'dolor', 'las que crees tú', 'hora (si la pones)', 'objetivo', 'no da XP', 'imágenes',
    'no interpreta', 'distinto del ánimo del diario', 'CSV'].forEach((w) => assert.ok(health.includes(w), w));
  ['¿Puedo crear mis propias medidas?', '¿Qué es el resumen de una medida?', '¿Cómo funciona el objetivo de una medida?', '¿Qué es la relación con tus hábitos?',
    '¿Cómo hago el informe para el médico?'].forEach((q) => assert.ok(faq.includes(q), q));
  const custom = faq.slice(faq.indexOf('¿Puedo crear mis propias medidas?'), faq.indexOf('</details>', faq.indexOf('¿Puedo crear mis propias medidas?')));
  ['hasta 5', 'Crear una medida', 'se borran también sus registros', 'puedes deshacerlo', 'desactívala', 'versiones anteriores'].forEach((w) => assert.ok(custom.includes(w), w));
  assert.match(faq, /al menos 7 días en cada grupo/);
  assert.match(faq, /Es una coincidencia en tus datos, no una causa/);
  assert.match(faq, /nada de tu diario, de Zen ni de tus hábitos/);
});

test('el README cuenta lo nuevo de Salud', () => {
  const readme = read('README.md');
  ['Resumen', 'Objetivo', 'Relación con tus hábitos', 'Informe para el médico', 'glucosa', 'medidas personalizadas', 'hora opcional',
    'Salud (registros, objetivos y medidas personalizadas)', 'tests/health-*.test.mjs']
    .forEach((w) => assert.ok(readme.includes(w), w));
});
