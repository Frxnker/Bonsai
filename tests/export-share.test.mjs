// Fase 8: historial de hábitos en CSV, accesos directos del icono y compartir como imagen.
// La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { loadApp, plain } from './harness.mjs';

const ROOT = new URL('../', import.meta.url);
const data = () => ({
  habits: [
    { id: 'run', name: 'Correr', type: 'run', mode: 'target', measure: 'km', goal: 5, unit: 'km', created: '2026-09-01',
      done: { '2026-09-25': 5.5, '2026-09-26': 3 }, notes: { '2026-09-26': 'Cansado; con lluvia' } },
    { id: 'teeth', name: 'Lavarse los dientes', type: 'teeth', goal: 2, created: '2026-09-01', done: { '2026-09-26': 2, '2026-09-27': 1 } },
    { id: 'read', name: '=Leer', created: '2026-09-01', done: { '2026-09-25': 1 } },
    { id: 'smoke', name: 'Dejar de fumar', kind: 'quit', type: 'smoke', created: '2026-09-01', slips: { '2026-09-24': 1 }, notes: { '2026-09-27': 'Sin ganas' } },
    { id: 'old', name: 'Viejo', created: '2026-09-01', done: { '2026-09-20': 1 }, archived: '2026-09-22' },
  ],
  days: { '2026-09-26': { mood: 4, note: 'NOTA-DEL-DIARIO' } },
  health: { entries: [{ id: 'w', metric: 'weight', date: '2026-09-26', value: 70, unit: 'kg', note: 'NOTA-DE-SALUD' }] },
});

test('el historial en CSV: una fila por hábito y día con algo apuntado, en el formato del CSV de Salud', () => {
  const app = loadApp({ stored: data() });
  const csv = app.run('habitsCSV()');
  assert.equal(csv.charCodeAt(0), 0xfeff, 'con marca UTF-8');
  assert.ok(csv.endsWith('\r\n'));
  const lines = csv.slice(1).trimEnd().split('\r\n');
  assert.equal(lines[0], 'Fecha;Hábito;Tipo;Hecho;Cantidad;Unidad;Recaída;Nota');
  assert.deepEqual(lines.slice(1), [
    '2026-09-20;Viejo;Sí o no;Sí;;;;',
    '2026-09-24;Dejar de fumar;Dejar algo;No;;;Sí;',
    "2026-09-25;Correr;Distancia;Sí;5,5;km;;",
    "2026-09-25;'=Leer;Sí o no;Sí;;;;",
    '2026-09-26;Correr;Distancia;No;3;km;;"Cansado; con lluvia"',
    '2026-09-26;Lavarse los dientes;Contador;Sí;2;veces;;',
    '2026-09-27;Lavarse los dientes;Contador;No;1;veces;;',
    '2026-09-27;Dejar de fumar;Dejar algo;Sí;;;;Sin ganas',
  ]);
  assert.doesNotMatch(csv, /NOTA-DEL-DIARIO|NOTA-DE-SALUD/, 'nada del diario ni de Salud');
});

test('el CSV de Salud sigue saliendo igual con las funciones compartidas', () => {
  const app = loadApp({ stored: data() });
  // (Desde la 0.11 beta lleva la hora, opcional, detrás de la fecha.)
  assert.equal(app.run('healthCSV()'), `${String.fromCharCode(0xfeff)}Fecha;Hora;Medida;Valor;Diastólica;Pulso;Unidad;Nota\r\n2026-09-26;;Peso;70;;;kg;NOTA-DE-SALUD\r\n`);
});

test('los accesos directos del manifiesto abren Zen, Registrar salud y Nuevo hábito', () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', ROOT), 'utf8'));
  assert.deepEqual(manifest.shortcuts.map((s) => [s.name, s.url]), [
    ['Zen', './?abrir=zen'], ['Registrar salud', './?abrir=salud'], ['Nuevo hábito', './?abrir=nuevo'],
  ]);
  manifest.shortcuts.forEach((s) => s.icons.forEach((i) => assert.ok(existsSync(new URL(i.src, ROOT)), i.src)));
  const sw = readFileSync(new URL('sw.js', ROOT), 'utf8');
  manifest.shortcuts.forEach((s) => s.icons.forEach((i) => assert.ok(sw.includes(`./${i.src}`), `${i.src} en la caché sin conexión`)));

  const opened = (search, withMetrics = true) => {
    const app = loadApp({ stored: withMetrics ? data() : { ...data(), health: { metrics: [] } } });
    app.run(`globalThis.__open = []; openZen = () => __open.push('zen'); openSheet = () => __open.push('nuevo');
      openHealth = () => __open.push('salud'); openHealthEntry = () => __open.push('registro');`);
    app.context.location.search = search;
    return [app.run('openFromShortcut()'), plain(app.run('__open'))];
  };
  assert.deepEqual(opened('?abrir=zen'), ['zen', ['zen']]);
  assert.deepEqual(opened('?abrir=nuevo'), ['nuevo', ['nuevo']]);
  assert.deepEqual(opened('?abrir=salud'), ['salud', ['salud', 'registro']], 'Salud y su registro rápido');
  assert.deepEqual(opened('?abrir=salud', false), ['salud', ['salud']], 'sin medidas elegidas, solo Salud');
  assert.deepEqual(opened('?abrir=otra'), [null, []]);
  assert.deepEqual(opened(''), [null, []]);
});

test('la imagen de una racha solo lleva el hábito y su racha; la de un logro, el logro', () => {
  const done = {};
  for (let d = 10; d <= 26; d++) done[`2026-09-${d}`] = 1;
  const app = loadApp({ stored: { ...data(), habits: [...data().habits, { id: 'med', name: 'Meditar', created: '2026-09-01', done }] } });
  const card = plain(app.run(`shareCard('streak', 'med')`));
  assert.equal(card.big, '17');
  assert.equal(card.unit, 'días');
  assert.equal(card.title, 'Meditar');
  assert.equal(card.kicker, 'Racha actual');
  const quit = plain(app.run(`shareCard('streak', 'smoke')`));
  assert.equal(quit.title, 'sin fumar');
  assert.equal(quit.big, '3');
  assert.equal(plain(app.run(`shareCard('streak', 'nadie')`)), null);
  const unlocked = plain(app.run(`ACHIEVEMENTS.findIndex((a) => isUnlocked(a, computeStats()))`));
  const badge = plain(app.run(`shareCard('achievement', ${unlocked})`));
  assert.equal(badge.kicker, 'Logro conseguido');
  const locked = plain(app.run(`ACHIEVEMENTS.findIndex((a) => !isUnlocked(a, computeStats()))`));
  assert.equal(plain(app.run(`shareCard('achievement', ${locked})`)), null, 'un logro sin conseguir no se comparte');
  const all = JSON.stringify([card, quit, badge]);
  assert.doesNotMatch(all, /NOTA-DEL-DIARIO|NOTA-DE-SALUD|Cansado|Sin ganas|Peso/, 'ni diario, ni Salud, ni notas');
});
