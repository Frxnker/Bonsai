// Zen · fase final: versión, caché sin conexión, Novedades, preguntas frecuentes y README.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { loadApp } from './harness.mjs';

const ROOT = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8');

test('versión 0.10 beta y caché nueva, con todos sus archivos (sin audios ni imágenes nuevos)', () => {
  const app = loadApp();
  assert.equal(app.run('APP_VERSION'), '0.10 beta');
  const sw = read('sw.js');
  assert.match(sw, /const CACHE = 'bonsai-v28';/);
  const assets = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  assets.forEach((path) => assert.ok(existsSync(new URL(path, ROOT)), `${path} existe`));
  assert.ok(!assets.some((p) => /\.(mp3|ogg|wav|m4a)$/.test(p)), 'los sonidos se generan: no hay audios');
  assert.match(read('README.md'), /Versión actual: \*\*0\.10 beta\*\*/);
});

test('Novedades de la 0.10 beta: todo lo nuevo de Zen', () => {
  const app = loadApp();
  const news = app.run('INFO.news().body');
  const now = news.slice(0, news.indexOf('Versión 0.9 beta'));
  assert.match(now, /Versión 0\.10 beta/);
  ['Necesito calma', 'suspiro fisiológico', 'Escaneo corporal', 'relajación muscular', 'Mezclador de sonidos', 'viento y fuego',
    'Modo dormir', 'Vaciar la cabeza', 'Tus emociones en el tiempo', 'Intención del día'].forEach((w) => assert.ok(now.includes(w), w));
});

test('las preguntas frecuentes explican Zen y lo nuevo', () => {
  const app = loadApp();
  const faq = app.run('INFO.faq().body');
  const zen = faq.slice(faq.indexOf('¿Qué es Zen?'), faq.indexOf('</details>', faq.indexOf('¿Qué es Zen?')));
  ['Necesito calma', 'suspiro', 'escaneo corporal', 'relajación muscular', 'modo dormir', 'vaciar la cabeza', 'intención del día', 'No da XP'].forEach((w) => assert.ok(zen.includes(w), w));
  ['¿Qué hace «Necesito calma»?', '¿Cómo funciona el modo dormir?', '¿Se guarda lo que escribo en «Vaciar la cabeza»?', '¿Qué es la intención del día?']
    .forEach((q) => assert.ok(faq.includes(q), q));
});
