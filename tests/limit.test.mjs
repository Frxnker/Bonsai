// Fase 5: hábitos con límite («como mucho 2 cafés», «1 h de redes»). Son de dejar algo con cantidad y un máximo:
// cumplir es no pasarse, pasarse es una recaída y las rachas y la XP son las de dejar algo, sin reglas nuevas.
// La fecha fija es el domingo 27 de septiembre de 2026 (semana del lunes 21).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';
import { dataset, rulesFingerprint, hash } from './rules-fixture.mjs';

const NOW = new Date('2026-09-27T10:00:00').getTime();
const MIN = 60 * 1000;
const coffee = (fields) => ({ id: 'c', name: 'Limitar el café', kind: 'quit', type: 'coffeelimit', measure: 'coffees', unit: 'cafés', limit: 2, created: '2026-09-01', done: {}, ...fields });
const social = (fields) => ({ id: 'r', name: 'Limitar las redes', kind: 'quit', type: 'sociallimit', measure: 'min', unit: 'min', limit: 60, created: '2026-09-01', done: {}, ...fields });
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('se guarda su máximo (los demás hábitos, sin él) y las copias antiguas siguen valiendo', () => {
  const app = loadApp();
  const norm = (h) => plain(app.run(`normalize(${JSON.stringify({ habits: [h] })}).habits[0]`));
  const c = norm(coffee({ limit: '3', done: { '2026-09-20': 2 } }));
  assert.equal(c.limit, 3);
  assert.equal(c.kind, 'quit');
  assert.deepEqual(c.schedule, { type: 'daily' }, 'diario, como los de dejar algo');
  assert.equal(c.goal, 1);
  assert.equal(c.measure, 'coffees');
  assert.deepEqual(c.done, { '2026-09-20': 2 });
  assert.equal(norm(social({ measure: 'hours', unit: 'h', limit: 1.5, done: { '2026-09-20': 1.25 } })).done['2026-09-20'], 1.25, 'con decimales en horas');
  // Si se le quita el límite, lo apuntado se guarda tal cual (por si vuelve a tenerlo) y no cuenta para nada.
  const off = norm(social({ measure: 'hours', unit: 'h', limit: null, done: { '2026-09-20': 0.75 }, slips: { '2026-09-19': 1 } }));
  assert.deepEqual([off.limit, off.done, off.slips, off.measure], [null, { '2026-09-20': 0.75 }, { '2026-09-19': 1 }, 'hours']);
  // Sin máximo válido, o en uno de empezar algo, no hay límite.
  assert.equal(norm(coffee({ limit: 0 })).limit, null);
  assert.equal(norm(coffee({ limit: -2 })).limit, null);
  assert.equal(norm(coffee({ limit: 'mucho' })).limit, null);
  assert.equal(norm({ id: 'b', name: 'Agua', limit: 3, done: {} }).limit, null);
  // Copias de antes (también de Racha): sin límite y con todo lo demás igual.
  const old = plain(app.run(`normalize(${JSON.stringify({ habits: [{ id: 'a', name: 'Correr', color: 'violeta', done: { '2026-09-20': 1 } }, { id: 'q', name: 'Sin fumar', kind: 'quit', slips: { '2026-09-02': 1 } }] })})`));
  assert.deepEqual(old.habits.map((h) => h.limit), [null, null]);
  assert.deepEqual(old.habits[1].slips, { '2026-09-02': 1 });
  assert.equal(plain(app.run('newHabit({ name: "X" }).limit')), null);
});

test('lo apuntado decide: pasarse del máximo es una recaída y corregirlo la quita', () => {
  const app = loadApp();
  // Una copia con recaídas que no cuadran con lo apuntado se pone de acuerdo al cargarla. Las recaídas sin
  // cantidad (de cuando no tenía límite) se quedan.
  const h = plain(app.run(`normalize(${JSON.stringify({ habits: [coffee({
    done: { '2026-09-20': 3, '2026-09-21': 1, '2026-09-22': 2 },
    slips: { '2026-09-21': 1, '2026-09-10': 1 },
  })] })}).habits[0]`));
  assert.deepEqual(h.slips, { '2026-09-20': 1, '2026-09-10': 1 });
});

test('cuenta como en los de dejar algo: sin apuntar o sin pasarse, hecho; al pasarse, fallado', () => {
  const app = loadApp({ stored: { habits: [coffee({ done: { '2026-09-24': 1, '2026-09-25': 2, '2026-09-26': 3 } })] } });
  const done = (d) => app.run(`isDone(findHabit('c'), '${d}')`);
  const slip = (d) => app.run(`hasSlip(findHabit('c'), '${d}')`);
  assert.equal(done('2026-09-23'), true, 'sin apuntar nada');
  assert.equal(done('2026-09-24'), true, 'por debajo');
  assert.equal(done('2026-09-25'), true, 'justo en el máximo');
  assert.equal(done('2026-09-26'), false, 'por encima');
  assert.equal(slip('2026-09-26'), true);
  assert.equal(done('2026-09-27'), true, 'hoy, mientras no te pases');
  assert.equal(app.run(`limitState(findHabit('c'), '2026-09-24')`), 'under');
  assert.equal(app.run(`limitState(findHabit('c'), '2026-09-25')`), 'at');
  assert.equal(app.run(`limitState(findHabit('c'), '2026-09-26')`), 'over');
  const s = plain(app.run(`streakInfo(findHabit('c'))`));
  assert.equal(s.current, 1, 'la racha vuelve a empezar tras pasarse');
  assert.equal(s.best, 25);
});

test('rachas, XP, retos, protectores y logros: exactamente los de un hábito de dejar algo con esas recaídas', () => {
  // Del 1 de agosto a hoy, con cantidades variadas; los días que pasan de 2 son recaídas. Junto a otros hábitos,
  // para que también cuadren los días perfectos, los retos y los protectores.
  const done = {};
  const over = {};
  for (let d = new Date('2026-08-01T12:00:00'), i = 0; d <= new Date('2026-09-27T12:00:00'); d.setDate(d.getDate() + 1), i++) {
    const key = d.toISOString().slice(0, 10);
    const amount = [0, 1, 2, 1, 3, 0, 2, 1, 1, 4, 0, 2][i % 12];
    if (amount) done[key] = amount;
    if (amount > 2) over[key] = 1;
  }
  const others = [
    { id: 'l', name: 'Leer', created: '2026-08-01', done: Object.fromEntries(Object.keys(done).filter((k, i) => i % 3).map((k) => [k, 1])) },
    { id: 'w', name: 'Caminar', type: 'walk', mode: 'target', measure: 'min', goal: 30, unit: 'min', created: '2026-08-10', done: { '2026-09-20': 30, '2026-09-21': 40 } },
  ];
  const pauses = [{ from: '2026-08-20', to: '2026-08-24' }];
  const withLimit = loadApp({ stored: { habits: [coffee({ created: '2026-08-01', done, pauses }), ...others], challengesSince: '2026-08-03' } });
  const asQuit = loadApp({ stored: { habits: [{ id: 'c', name: 'Menos café', kind: 'quit', created: '2026-08-01', slips: over, pauses }, ...others], challengesSince: '2026-08-03' } });
  const same = (code, what) => assert.deepEqual(plain(withLimit.run(code)), plain(asQuit.run(code)), what);
  same('computeStats()', 'XP, nivel, rachas, días perfectos, protectores, retos y «Libre»');
  same(`streakInfo(findHabit('c'))`, 'racha, mejor racha, XP y días');
  same('shieldInfo()');
  same('challengeTotals()');
  same(`(() => { const o = []; for (let ws = '2026-08-03'; ws <= weekStartOf(ui.today); ws = shiftKey(ws, 7)) o.push(weekChallenges(ws).map((c) => [c.id, c.target, c.value, c.done, c.failed]), weekSummary(ws).pct); return o; })()`, 'retos y resúmenes de cada semana');
  same(`[habitRate(findHabit('c'), 30, 0), habitRate(findHabit('c'), 90, 0)]`, 'cumplimiento de la ficha');
  same(`ACHIEVEMENTS.map((a) => isUnlocked(a, computeStats()))`);
  assert.ok(plain(withLimit.run(`streakInfo(findHabit('c'))`)).best > 0);
});

test('Hoy: «1 de 2 cafés» con una barra que avisa con texto al llegar al máximo; al pasarse, fallado', () => {
  const app = loadApp({ stored: { habits: [coffee({ done: { '2026-09-25': 2, '2026-09-26': 3, '2026-09-27': 1 } })] } });
  const row = (day = '2026-09-27') => { app.run(`ui.day = '${day}'`); return app.run(`habitRow(findHabit('c'))`); };
  let html = row();
  // El 26 se pasó: la racha vuelve a empezar hoy.
  assert.match(html, /<b class="amount">1 de 2 cafés<\/b> · <span class="flame">1 día<\/span> sin pasarte/);
  assert.match(html, /class="limit-bar" aria-hidden="true"/);
  assert.match(html, /--limit:0\.500/);
  assert.match(html, /class="habit done with-aux limit"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-label="Limitar el café: 1 de 2 cafés, 1 día sin pasarte\. Toca para sumar 1; mantén pulsado para restar 1"/);
  html = row('2026-09-25');
  assert.match(html, /at-limit/);
  assert.match(html, /2 de 2 cafés<\/b> · <span class="limit-state">en el límite<\/span>/, 'lo dice con texto, no solo con color');
  assert.match(html, /aria-label="Limitar el café: 2 de 2 cafés, en el límite\./);
  html = row('2026-09-26');
  assert.match(html, /class="habit with-aux limit slipped"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /3 de 2 cafés<\/b> · te pasaste/);
  assert.match(html, /--limit:1\.000/);
  assert.match(html, /te has pasado del máximo/);
  // Hoy cuenta en el anillo como cualquier hábito de dejar algo.
  assert.deepEqual(plain(app.run(`ringTotals('2026-09-27', visibleHabits())`)), { total: 1, done: 1 });
});

test('un toque suma 1; si con él te pasas, pregunta antes; corregir devuelve el día y su XP', async () => {
  const app = loadApp({ stored: { habits: [coffee({ created: '2026-09-20' })] } });
  const xp0 = app.run('computeStats().xp');
  app.run(`toggleHabit('c', null)`);
  app.run(`toggleHabit('c', null)`);
  assert.equal(app.run(`findHabit('c').done['2026-09-27']`), 2);
  assert.equal(app.run('computeStats().xp'), xp0, 'mientras no te pases, nada cambia');
  let asked = 0;
  app.context.__ask = () => { asked++; };
  app.run(`askConfirm = async (o) => { __ask(o); return false; }`);
  await app.run(`toggleHabit('c', null)`);
  await tick();
  assert.equal(asked, 1);
  assert.equal(app.run(`findHabit('c').done['2026-09-27']`), 2, 'sin confirmar, no se apunta');
  app.run(`askConfirm = async (o) => { __ask(o); return true; }`);
  await app.run(`toggleHabit('c', null)`);
  await tick();
  assert.equal(app.run(`findHabit('c').done['2026-09-27']`), 3);
  assert.equal(app.run(`isDone(findHabit('c'), '2026-09-27')`), false);
  assert.ok(app.run('computeStats().xp') < xp0, 'como una recaída');
  await app.run(`toggleHabit('c', null)`);
  await tick();
  assert.equal(asked, 2, 'ya pasado, no vuelve a preguntar');
  assert.equal(app.run(`findHabit('c').done['2026-09-27']`), 4);
  app.run(`stepDown(findHabit('c'), null)`);
  app.run(`stepDown(findHabit('c'), null)`);
  assert.equal(app.run(`findHabit('c').done['2026-09-27']`), 2);
  assert.equal(app.run(`isDone(findHabit('c'), '2026-09-27')`), true, 'al corregirlo vuelve a contar');
  assert.equal(app.run('computeStats().xp'), xp0);
  assert.deepEqual(plain(app.run(`findHabit('c').slips`)), {});
  // Antes de crearlo no se puede apuntar nada.
  app.run(`ui.day = '2026-09-10'; toggleHabit('c', null)`);
  assert.equal(app.run(`findHabit('c').done['2026-09-10']`), undefined);
  assert.match(app.toasts.at(-1), /aún no existía/);
});

test('sin unidad: «1 de 3 veces»; con un café de máximo, en singular', () => {
  const app = loadApp({ stored: { habits: [
    { id: 'u', name: 'Menos picar', kind: 'quit', limit: 3, created: '2026-09-01', done: { '2026-09-27': 1 } },
    coffee({ limit: 1 }),
  ] } });
  assert.equal(app.run(`limitText(findHabit('u'), '2026-09-27')`), '1 de 3 veces');
  assert.equal(app.run(`limitLabel(findHabit('c'))`), 'Máximo 1 café al día');
  assert.equal(app.run(`limitText(findHabit('c'), '2026-09-27')`), '0 de 1 café');
});

test('los de tiempo se apuntan con el deslizador: un toque lo abre y lo que guardes decide', () => {
  const app = loadApp({ stored: { habits: [social()] } });
  app.run(`globalThis.__opened = []; openLog = (h) => __opened.push(h.id)`);
  app.run(`toggleHabit('r', null)`);
  app.run(`stepDown(findHabit('r'), null)`);
  assert.deepEqual(plain(app.run('__opened')), ['r', 'r'], 'tocar y mantener pulsado abren el deslizador');
  app.run(`setHabitAmount(findHabit('r'), '2026-09-27', 75)`);
  assert.equal(app.run(`hasSlip(findHabit('r'), '2026-09-27')`), true);
  assert.match(app.run(`habitRow(findHabit('r'))`), /75 de 60 min<\/b> · te pasaste/);
  app.run(`setHabitAmount(findHabit('r'), '2026-09-27', 45)`);
  assert.equal(app.run(`isDone(findHabit('r'), '2026-09-27')`), true, 'corregido: vuelve a contar');
  app.run(`setHabitAmount(findHabit('r'), '2026-09-27', 0)`);
  assert.equal(app.run(`findHabit('r').done['2026-09-27']`), undefined, 'borrar lo de ese día');
  assert.equal(app.run(`hasSlip(findHabit('r'), '2026-09-27')`), false);
});

test('el temporizador suma minutos; si al parar te pasas, el día cuenta como fallado', () => {
  const app = loadApp({ stored: { habits: [social({ done: { '2026-09-27': 50 } })] } });
  assert.match(app.run(`habitRow(findHabit('r'))`), /data-timer="r"/);
  assert.equal(app.run(`startTimer('r')`), true);
  app.run(`state.timer.start = ${NOW - 25 * MIN}`);
  app.run('stopTimer()');
  assert.equal(app.run(`findHabit('r').done['2026-09-27']`), 75, 'suma a lo que había, como en los de tiempo');
  assert.equal(app.run(`isDone(findHabit('r'), '2026-09-27')`), false);
  assert.match(app.toasts.at(-1), /\+25 min a «Limitar las redes»: te has pasado del máximo \(75 de 60 min\)/);
  // Por debajo del máximo, el aviso de siempre.
  const ok = loadApp({ stored: { habits: [social()] } });
  ok.run(`startTimer('r'); state.timer.start = ${NOW - 20 * MIN}`);
  ok.run('stopTimer()');
  assert.equal(ok.run(`isDone(findHabit('r'), '2026-09-27')`), true);
  assert.match(ok.toasts.at(-1), /^\+20 min a «Limitar las redes»$/);
  // Solo los de límite en minutos: en horas, o sin límite, no hay temporizador.
  const check = (h) => plain(app.run(`normalizeTimer({ id: '${h.id}', day: '2026-09-27', start: ${NOW - MIN}, paused: 0, pausedAt: 0 }, [${JSON.stringify(h)}])`));
  assert.equal(check({ ...social(), archived: null, kind: 'quit' }).id, 'r');
  assert.equal(check({ ...social(), measure: 'hours', archived: null }), null);
  assert.equal(check({ ...social(), limit: null, archived: null }), null);
  assert.doesNotMatch(app.run(`habitRow(normalize({ habits: [${JSON.stringify(coffee())}] }).habits[0])`), /data-timer/, 'cafés: no');
});

test('las pausas y el modo vacaciones funcionan igual: esos días no cuentan ni fallan', () => {
  const app = loadApp({ stored: { habits: [coffee({ created: '2026-09-01', pauses: [{ from: '2026-09-10', to: '2026-09-12' }], done: { '2026-09-11': 5 } })] } });
  assert.equal(app.run(`hasSlip(findHabit('c'), '2026-09-11')`), false, 'en pausa no hay recaída');
  assert.equal(app.run(`dayStatus(findHabit('c'), '2026-09-11')`), 'paused');
  assert.equal(app.run(`streakInfo(findHabit('c')).current`), 27 - 3, 'la pausa no rompe la racha ni suma días');
  // Tocarlo un día en pausa ofrece reanudarlo, sin sumar.
  app.run(`askResume = () => { globalThis.__resume = true; }; ui.day = '2026-09-11'; toggleHabit('c', null)`);
  assert.equal(app.run('globalThis.__resume'), true);
  assert.equal(app.run(`findHabit('c').done['2026-09-11']`), 5);
  // Modo vacaciones: se pausa como los demás (desde mañana, porque hoy ya cuenta como hecho).
  app.run(`ui.day = ui.today`);
  assert.equal(app.run(`startVacation()`), true);
  assert.deepEqual(plain(app.run(`findHabit('c').pauses.at(-1)`)), { from: '2026-09-28', to: null });
});

test('la ficha: días sin pasarte, veces que te pasaste y la gráfica con la línea del máximo', () => {
  const app = loadApp({ stored: { habits: [coffee({ created: '2026-09-15', done: { '2026-09-20': 3, '2026-09-24': 4, '2026-09-25': 2, '2026-09-26': 1 } })] } });
  const quit = app.run(`detailQuitCard(findHabit('c'), streakInfo(findHabit('c')))`);
  assert.match(quit, /<h2>Sin pasarte del máximo<\/h2>/);
  assert.match(quit, /<b>3<\/b><span>Días seguidos ahora/);
  assert.match(quit, /<b>11<\/b><span>Días sin pasarte en total/);
  assert.match(quit, /<b>2<\/b><span>Veces que te pasaste/);
  assert.match(quit, /Jueves, 24 de septiembre · 4 cafés/);
  assert.match(quit, /Domingo, 20 de septiembre · 3 cafés/);
  const chart = app.run(`detailAmountCard(findHabit('c'))`);
  assert.match(chart, /Máximo: 2 cafés/);
  assert.equal((chart.match(/class="over/g) || []).length, 2, 'los días que te pasaste, marcados');
  assert.match(chart, /<line class="goal"/);
  assert.match(chart, /apuntaste algo 4 días, con una media de 2,5 cafés esos días, y te pasaste del máximo 2 días/);
  assert.match(chart, /<th scope="row">Jue, 24 sept<\/th><td>4 cafés · te pasaste<\/td>/);
  assert.match(chart, /<th scope="row">Vie, 25 sept<\/th><td>2 cafés · en el límite<\/td>/);
  assert.match(app.run(`detailRateCard(findHabit('c'))`), /Días sin pasarte del máximo/);
  // Abrir la ficha no cambia nada.
  const before = plain(app.run('computeStats()'));
  app.run(`openHabitDetail('c'); renderHabitDetail()`);
  assert.deepEqual(plain(app.run('computeStats()')), before);
});

test('el CSV lleva la cantidad de cada día y marca como recaída los días que te pasaste', () => {
  const app = loadApp({ stored: { habits: [
    coffee({ done: { '2026-09-25': 2, '2026-09-26': 3 }, notes: { '2026-09-24': 'Sin café' } }),
    social({ done: { '2026-09-26': 45.5 } }),
  ] } });
  const lines = app.run('habitsCSV()').slice(1).trimEnd().split('\r\n');
  assert.deepEqual(lines, [
    'Fecha;Hábito;Tipo;Hecho;Cantidad;Unidad;Recaída;Nota',
    '2026-09-24;Limitar el café;Con límite;Sí;;;;Sin café',
    '2026-09-25;Limitar el café;Con límite;Sí;2;cafés;;',
    '2026-09-26;Limitar el café;Con límite;No;3;cafés;Sí;',
    '2026-09-26;Limitar las redes;Con límite;Sí;45,5;min;;',
  ]);
});

test('Historial, revisión, tendencias, retos y compartir lo dicen con palabras de límite', () => {
  const app = loadApp({ stored: { habits: [coffee({ done: { '2026-09-24': 3, '2026-09-25': 1 } })], challengesSince: '2026-09-21' } });
  assert.equal(app.run(`dayCaption('c', '2026-09-24')`), 'Jue, 24 sept · Te pasaste · 3 de 2 cafés');
  assert.equal(app.run(`dayCaption('c', '2026-09-25')`), 'Vie, 25 sept · Sin pasarte · 1 de 2 cafés');
  assert.equal(app.run(`dayCaption('c', '2026-09-22')`), 'Mar, 22 sept · Sin pasarte');
  assert.equal(app.run(`habitCellClass(findHabit('c'), '2026-09-24')`), 'slip');
  assert.equal(app.run(`habitCellClass(findHabit('c'), '2026-09-25')`), 'l4');
  app.run('ui.reviewArchived = new Set()');
  assert.match(app.run('reviewPlan()'), /Máximo 2 cafés al día/);
  assert.match(app.run(`habitTrendText({ habit: findHabit('c'), now: 0.9, before: null }, 4)`), /^90\s% de los días sin pasarte · /);
  assert.equal(app.run(`CHALLENGES.find((c) => c.id === 'clean').text(findHabit('c'))`), 'Semana entera sin pasarte en «Limitar el café»');
  const card = plain(app.run(`shareCard('streak', 'c')`));
  assert.equal(card.kicker, 'Llevo');
  assert.equal(card.big, '3', 'del 25 a hoy');
  assert.equal(card.title, 'sin pasarme de 2 cafés');
  assert.equal(card.line, 'Limitar el café');
});

test('la copia de seguridad lleva el máximo, la medida y lo apuntado', () => {
  const app = loadApp({ stored: { habits: [coffee({ done: { '2026-09-26': 3 } }), social({ measure: 'hours', unit: 'h', limit: 1.5, done: { '2026-09-26': 0.75 } })] } });
  const copy = plain(app.run('readBackup(JSON.stringify(backupPayload())).data.habits'));
  assert.deepEqual(copy.map((h) => [h.kind, h.limit, h.measure, h.unit, h.done, h.slips]), [
    ['quit', 2, 'coffees', 'cafés', { '2026-09-26': 3 }, { '2026-09-26': 1 }],
    ['quit', 1.5, 'hours', 'h', { '2026-09-26': 0.75 }, {}],
  ]);
  assert.deepEqual(plain(app.run('backupCounts(state)')).marked, 2, 'los días con cantidad cuentan como apuntados');
});

test('cambiar el máximo recalcula los días apuntados; pasar de minutos a horas convierte lo apuntado', () => {
  const app = loadApp({ stored: { habits: [coffee({ done: { '2026-09-25': 3, '2026-09-26': 2 }, slips: { '2026-09-10': 1 } }), social({ done: { '2026-09-26': 90, '2026-09-25': 45 } })] } });
  app.run(`findHabit('c').limit = 3; syncLimitSlips(findHabit('c'))`);
  assert.deepEqual(plain(app.run(`findHabit('c').slips`)), { '2026-09-10': 1 }, 'el 25 ya no pasa; la recaída sin cantidad se queda');
  app.run(`findHabit('c').limit = 1; syncLimitSlips(findHabit('c'))`);
  assert.deepEqual(plain(app.run(`Object.keys(findHabit('c').slips).sort()`)), ['2026-09-10', '2026-09-25', '2026-09-26']);
  app.run(`keepLimitAmounts(findHabit('r'), 'hours'); Object.assign(findHabit('r'), { measure: 'hours', unit: 'h', limit: 1 }); syncLimitSlips(findHabit('r'))`);
  assert.deepEqual(plain(app.run(`findHabit('r').done`)), { '2026-09-26': 1.5, '2026-09-25': 0.75 });
  assert.deepEqual(plain(app.run(`findHabit('r').slips`)), { '2026-09-26': 1 });
  app.run(`keepLimitAmounts(findHabit('r'), 'coffees')`);
  assert.deepEqual(plain(app.run(`findHabit('r').done`)), { '2026-09-26': 1.5, '2026-09-25': 0.75 }, 'entre otras medidas no se convierte');
});

test('la ayuda lo explica y la caché sin conexión es nueva', async () => {
  const { readFileSync } = await import('node:fs');
  const app = loadApp();
  assert.match(app.run(`INFO.news().body`), /Versión 0\.9 beta<\/h3>\s*<ul class="news-list">\s*<li>Hábitos con límite/);
  assert.match(app.run(`INFO.faq().body`), /¿Qué es un hábito con límite\?/);
  assert.match(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), /const CACHE = 'bonsai-v27';/);
  assert.match(readFileSync(new URL('../README.md', import.meta.url), 'utf8'), /con límite/);
});

test('el catálogo trae dos con límite (en «Dejar algo») y los packs siguen igual', () => {
  const app = loadApp();
  assert.equal(app.run(`typeHint(typeOf('coffeelimit'))`), 'Máximo 2 cafés al día');
  assert.equal(app.run(`typeHint(typeOf('sociallimit'))`), 'Máximo 60 min al día');
  assert.equal(app.run(`typeHint(typeOf('coffee'))`), 'Días sin recaer', 'los de dejar algo de siempre, sin límite');
  // Si uno de estos se pasa a «Días sin hacerlo», se lee «6 días sin café», no «sin limitar el café».
  assert.equal(app.run(`quitWhat({ name: 'Limitar el café' })`), 'café');
  assert.equal(app.run(`quitWhat({ name: 'Limitar las redes' })`), 'redes');
  const c = plain(app.run(`habitFromType(typeOf('coffeelimit'))`));
  assert.deepEqual([c.kind, c.limit, c.measure, c.unit, c.goal, c.mode, c.schedule], ['quit', 2, 'coffees', 'cafés', 1, 'count', { type: 'daily' }]);
  const r = plain(app.run(`habitFromType(typeOf('sociallimit'))`));
  assert.deepEqual([r.limit, r.measure, r.unit], [60, 'min', 'min']);
  assert.equal(app.run(`measureSpec(typeOf('sociallimit'), 'hours').min`), 0.5);
  const packs = plain(app.run('PACKS.flatMap((p) => p.types)'));
  assert.ok(!packs.includes('coffeelimit') && !packs.includes('sociallimit'));
  assert.equal(plain(app.run(`addPack(findPack('sleep'), ['coffee'], false)[0].limit`)), null, '«Dormir mejor» sigue creando «Menos café» sin límite');
});

test('las reglas de los hábitos de siempre no cambian: mismas cuentas que antes de los de límite', async () => {
  // Huellas calculadas con la versión anterior (0.9 beta sin los de límite, commit c61edca) y los mismos datos.
  const golden = [
    [1, '2026-09-27T10:00:00', '671f9ebbf0d0ebad140b7ac931fe11b157d3ee50d8c9dd19a52c092c1fe0d335'],
    [2, '2026-09-28T08:00:00', '154c28d38d2831f3ceb42ea82c8ddb1b06714183567b16c19f6dca40509a3677'],
    [3, '2026-03-29T23:30:00', '0cc489e1af6e2369d27ae546e8f93d5cb5e4d9920330483fd7aa3cdb7f60f77c'],
    [4, '2026-09-27T10:00:00', 'd0b66229e82e8ec5c1a2747436906968c04b6fd2cfa364c2fc184e6c5ab48f22'],
    [5, '2026-01-01T09:00:00', '6e696c5743619c076dafbd74f94749b05fa2261a49b38be87bad14e34e97f9cc'],
  ];
  for (const [seed, now, expected] of golden) {
    const app = loadApp({ stored: dataset(seed, now.slice(0, 10)), now });
    assert.equal(hash(await rulesFingerprint(app.run)), expected, `datos ${seed} (${now})`);
  }
});
