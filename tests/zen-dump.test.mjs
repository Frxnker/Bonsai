// Zen · fase 6: Vaciar la cabeza. Se escribe lo que ronda y «Soltarlo» lo borra sin guardarlo en ningún sitio.
// (Guardarlo en el diario queda pendiente de decidir cómo encaja con la nota del día, de 200 caracteres.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, STORAGE_KEY } from './harness.mjs';

const SECRET = 'SECRETO-que-no-debe-guardarse';

test('la pantalla: hasta 2000 caracteres, con su cuenta, y «Soltarlo» solo cuando hay algo escrito', () => {
  const app = loadApp({ stored: { habits: [] } });
  assert.equal(app.run('DUMP_MAX'), 2000);
  let html = app.run('zenDumpHTML()');
  assert.match(html, /<textarea class="dump-input" id="dump-input" data-dump maxlength="2000"/);
  assert.match(html, /aria-label="Lo que te ronda \(máximo 2000 caracteres\)"/);
  assert.match(html, /0\/2000/);
  assert.match(html, /data-dump-release disabled>Soltarlo</);
  app.run(`ui.dumpDraft = 'Mucho trabajo y poco tiempo'`);
  html = app.run('zenDumpHTML()');
  assert.match(html, />Mucho trabajo y poco tiempo<\/textarea>/);
  assert.match(html, /27\/2000/);
  assert.match(html, /data-dump-release>Soltarlo</);
  assert.match(app.run('zenHomeHTML()'), /data-zen-screen="dump"/);
});

test('lo escrito nunca se guarda: ni en el móvil ni en la copia', () => {
  const app = loadApp({ stored: { habits: [] } });
  app.run(`ui.dumpDraft = ${JSON.stringify(SECRET)}; save()`);
  assert.ok(!app.storage.get(STORAGE_KEY).includes(SECRET), 'no está en lo guardado');
  assert.ok(!app.run('JSON.stringify(backupPayload())').includes(SECRET), 'ni en la copia');
});

test('«Soltarlo» lo borra de la memoria; sin animación si se pide reducir movimiento', () => {
  const app = loadApp({ stored: { habits: [] } });
  app.run(`ui.zenScreen = 'dump'; ui.dumpDraft = ${JSON.stringify(SECRET)}; releaseDump()`);
  assert.equal(app.run('ui.dumpDraft'), '', 'se borra ya, aunque la animación siga');
  // Con «reducir movimiento», al momento y con el aviso.
  app.context.matchMedia = () => ({ matches: true });
  app.run(`ui.dumpDraft = ${JSON.stringify(SECRET)}; ui.dumpReleased = false; releaseDump()`);
  assert.equal(app.run('ui.dumpDraft'), '');
  assert.equal(app.run('ui.dumpReleased'), true);
  assert.match(app.run('zenDumpHTML()'), /Soltado\. No se ha guardado en ningún sitio\./);
  assert.ok(!app.storage.get(STORAGE_KEY)?.includes(SECRET));
});

test('borrar todos los datos también lo borra de la memoria', () => {
  const app = loadApp({ stored: { habits: [] } });
  app.run(`ui.dumpDraft = ${JSON.stringify(SECRET)}; eraseAllData()`);
  assert.equal(app.run('ui.dumpDraft'), '');
});
