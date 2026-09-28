// Salud · objetivo personal: subir o bajar hasta un valor, o un rango. Se guarda en la unidad base, se ve en la
// elegida, se dibuja en la gráfica y se cuenta sin juicios. La fecha fija es el domingo 27 de septiembre de 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from './harness.mjs';

let n = 0;
const e = (metric, unit, date, value, extra = {}) => ({ id: `e${n++}`, metric, unit, date, value, created: n, note: '', ...extra });
const load = (health, extra = {}) => loadApp({ stored: { habits: [], health, ...extra } });
const run = (app, code) => plain(app.run(code));

const WEIGHT = [
  e('weight', 'kg', '2026-09-20', 71),
  e('weight', 'kg', '2026-09-23', 70),
  e('weight', 'kg', '2026-09-25', 69.8),
  e('weight', 'kg', '2026-09-27', 72.3),
];
const SLEEP = [
  e('sleep', 'h', '2026-09-17', 5),
  e('sleep', 'h', '2026-09-18', 8), e('sleep', 'h', '2026-09-19', 7),
  e('sleep', 'h', '2026-09-20', 6.5), e('sleep', 'h', '2026-09-20', 1), // siesta: el día suma 7,5
  e('sleep', 'h', '2026-09-21', 8.5), e('sleep', 'h', '2026-09-22', 7.5), e('sleep', 'h', '2026-09-23', 8),
  e('sleep', 'h', '2026-09-24', 6), e('sleep', 'h', '2026-09-25', 9), e('sleep', 'h', '2026-09-26', 7.9),
  e('sleep', 'h', '2026-09-27', 8),
];

test('solo se guardan objetivos válidos; las copias sin objetivos se quedan sin ninguno', () => {
  const app = loadApp();
  const goals = run(app, `normalize(${JSON.stringify({ habits: [], health: { goals: {
    weight: { type: 'down', max: 70 },
    sleep: { type: 'up', min: 8, max: 3 }, // lo que no corresponde al tipo se ignora
    steps: { type: 'range', min: 9000, max: 8000 }, // al revés
    waist: { type: 'down', max: 5 }, // fuera de rango
    bodyFat: { type: 'bajar', max: 20 },
    temperature: { type: 'up', min: '37' },
    bloodPressure: { type: 'down', max: 130 }, // sin la diastólica
    restingHr: { type: 'range', min: 50, max: 70 },
    nada: { type: 'up', min: 1 },
    constructor: { type: 'up', min: 1 },
  } } })}).health.goals`);
  assert.deepEqual(goals, { weight: { type: 'down', max: 70 }, sleep: { type: 'up', min: 8 }, restingHr: { type: 'range', min: 50, max: 70 } });
  assert.deepEqual(run(app, `normalize({ habits: [], health: { entries: [] } }).health.goals`), {});
  assert.deepEqual(run(app, `normalize({ habits: [] }).health.goals`), {});
  const bp = run(app, `normalize(${JSON.stringify({ habits: [], health: { goals: { bloodPressure: { type: 'range', min: 110, max: 130, min2: 70, max2: 85 } } } })}).health.goals`);
  assert.deepEqual(bp.bloodPressure, { type: 'range', min: 110, max: 130, min2: 70, max2: 85 });
});

test('se guarda en la unidad base y se ve en la elegida', () => {
  const app = load({ units: { weight: 'lb' } });
  assert.deepEqual(run(app, `saveHealthGoal('weight', 'down', { max: '154' })`), { goal: { type: 'down', max: 69.853225 } });
  assert.deepEqual(run(app, 'state.health.goals.weight'), { type: 'down', max: 69.853225 });
  assert.equal(app.run(`healthGoalText('weight')`), '154 lb o menos');
  assert.deepEqual(run(app, `healthGoalTexts('weight', state.health.goals.weight)`), { max: '154' }, 'al editarlo se ve lo que escribiste');
  app.run(`state.health.units.weight = 'kg'`);
  assert.equal(app.run(`healthGoalText('weight')`), '69,9 kg o menos');
  // Temperatura en °F: se guarda en °C.
  const t = load({ units: { temperature: 'f' } });
  t.run(`saveHealthGoal('temperature', 'range', { min: '97,7', max: '99,5' })`);
  assert.deepEqual(run(t, 'state.health.goals.temperature'), { type: 'range', min: 36.5, max: 37.5 });
  assert.equal(t.run(`healthGoalText('temperature')`), 'entre 97,7 y 99,5 °F');
  // Guardado de verdad (y se relee igual).
  const again = loadApp({ stored: JSON.parse(app.storage.get('racha:v1')) });
  assert.deepEqual(run(again, 'state.health.goals.weight'), { type: 'down', max: 69.853225 });
});

test('valida cada campo con la unidad elegida', () => {
  const app = load({});
  const errors = (metric, type, texts) => run(app, `saveHealthGoal('${metric}', '${type}', ${JSON.stringify(texts)}).errors`);
  assert.match(errors('weight', 'up', { min: 'setenta' }).min, /Escribe un número, por ejemplo 72,5/);
  assert.match(errors('weight', 'up', { min: '5' }).min, /entre 20 y 400 kg/);
  assert.match(errors('steps', 'up', { min: '8,5' }).min, /número entero/);
  assert.match(errors('weight', 'range', { min: '70', max: '65' }).max, /mayor que el primer valor/);
  const bp = errors('bloodPressure', 'down', { max: '130', max2: '' });
  assert.deepEqual(Object.keys(bp), ['max2']);
  assert.match(bp.max2, /diastólica, entre 30 y 160 mmHg/);
  assert.deepEqual(run(app, 'state.health.goals'), {}, 'con errores no se guarda nada');
  assert.deepEqual(run(app, `saveHealthGoal('steps', 'up', { min: '8.000' }).goal`), { type: 'up', min: 8000 });
});

test('medidas de nivel: lo que te falta desde el último registro y cuántos de los últimos estaban dentro', () => {
  const app = load({ entries: WEIGHT, goals: { weight: { type: 'down', max: 70 } } });
  const p = run(app, `healthGoalProgress('weight')`);
  assert.deepEqual([p.gap, p.recent, p.met], [2.3, 4, 2]);
  assert.deepEqual(run(app, `healthGoalSentences('weight', healthGoalProgress('weight'))`), [
    'Último registro (hoy): 72,3 kg, te faltan 2,3 kg para tu objetivo.',
    '2 de tus últimos 4 registros, dentro de tu objetivo.',
  ]);
  const html = app.run(`healthGoalHTML('weight', healthSeries('weight'))`);
  assert.match(html, /<h3 class="detail-sub">Tu objetivo: 70 kg o menos<\/h3>/);
  assert.match(html, /data-health-goal="weight"/);
  // Un rango: la distancia hasta el borde más cercano.
  app.run(`state.health.goals.weight = { type: 'range', min: 60, max: 70 }`);
  assert.equal(app.run(`healthGoalText('weight')`), 'entre 60 y 70 kg');
  assert.equal(run(app, `healthGoalProgress('weight')`).gap, 2.3);
  app.run(`state.health.goals.weight = { type: 'up', min: 75 }`);
  assert.match(app.run(`healthGoalSentences('weight', healthGoalProgress('weight'))[0]`), /te faltan 2,7 kg para tu objetivo/);
});

test('totales del día: «en 5 de tus últimos 10 días con registro llegaste», sumando los registros de cada día', () => {
  const app = load({ entries: SLEEP, goals: { sleep: { type: 'up', min: 8 } } });
  assert.deepEqual(run(app, `healthGoalSentences('sleep', healthGoalProgress('sleep'))`), [
    'Último día con registro (hoy): 8,0 h, dentro de tu objetivo.',
    'En 5 de tus últimos 10 días con registro llegaste a 8 h.',
  ]);
  const past = load({ entries: SLEEP.filter((x) => x.date < '2026-09-27'), goals: { sleep: { type: 'up', min: 8 } } });
  assert.equal(past.run(`healthGoalSentences('sleep', healthGoalProgress('sleep'))[0]`), 'Último día con registro (ayer): 7,9 h, te faltaron 0,1 h para tu objetivo.');
  const steps = load({ entries: [e('steps', 'steps', '2026-09-27', 6500)], goals: { steps: { type: 'up', min: 8000 } } });
  assert.deepEqual(run(steps, `healthGoalSentences('steps', healthGoalProgress('steps'))`), ['Último día con registro (hoy): 6.500 pasos, te faltan 1.500 pasos para tu objetivo.']);
  const down = load({ entries: SLEEP, goals: { sleep: { type: 'down', max: 8 } } });
  assert.equal(down.run(`healthGoalSentences('sleep', healthGoalProgress('sleep'))[1]`), 'En 8 de tus últimos 10 días con registro no pasaste de 8 h.');
});

test('tensión: sistólica y diastólica, cada una con su valor', () => {
  const app = load({
    entries: [e('bloodPressure', 'mmHg', '2026-09-26', 135, { value2: 84 }), e('bloodPressure', 'mmHg', '2026-09-27', 128, { value2: 86 })],
    goals: { bloodPressure: { type: 'down', max: 130, max2: 85 } },
  });
  assert.equal(app.run(`healthGoalText('bloodPressure')`), '130/85 mmHg o menos');
  assert.deepEqual(run(app, `healthGoalSentences('bloodPressure', healthGoalProgress('bloodPressure'))`), [
    'Último registro (hoy): 128/86 mmHg, sistólica: dentro de tu objetivo; diastólica: te faltan 1 mmHg.',
    '0 de tus últimos 2 registros, dentro de tu objetivo.',
  ]);
  assert.deepEqual(run(app, `healthGoalValues('bloodPressure')`), [130, 85], 'una línea para cada una');
});

test('en la gráfica: una línea discontinua que siempre queda a la vista, con su leyenda y su texto', () => {
  const app = load({ entries: WEIGHT, goals: { weight: { type: 'down', max: 65 } } });
  const chart = run(app, `healthChart(healthSeries('weight'), '2026-08-29', 320, { goals: healthGoalValues('weight') })`);
  assert.equal((chart.svg.match(/class="hc-goal"/g) || []).length, 1);
  assert.match(chart.svg, />65<\/text>/, 'el eje llega hasta el objetivo');
  const card = app.run(`healthDetailCard('weight', { clientWidth: 358 })`);
  assert.match(card, /<span><i class="goal"><\/i>Tu objetivo<\/span>/);
  assert.match(card, /aria-label="Gráfica de peso, 30 días: 4 registros, [^"]*, con tu objetivo: 65 kg o menos\./);
  assert.match(card, /Tu objetivo: 65 kg o menos/);
  const none = load({ entries: WEIGHT });
  const plainCard = none.run(`healthDetailCard('weight', { clientWidth: 358 })`);
  assert.doesNotMatch(plainCard, /hc-goal|class="goal"/);
  assert.match(plainCard, /data-health-goal="weight"[^>]*>.*Fijar un objetivo/s);
  // También sin registros se puede fijar.
  assert.match(load({}).run(`healthDetailCard('weight', { clientWidth: 358 })`), /Fijar un objetivo/);
});

test('solo datos: sin ánimos, alarmas ni juicios, y sin colores de aviso', () => {
  const texts = [];
  const cases = [
    [{ entries: WEIGHT, goals: { weight: { type: 'down', max: 70 } } }, 'weight'],
    [{ entries: WEIGHT, goals: { weight: { type: 'up', min: 60 } } }, 'weight'],
    [{ entries: SLEEP, goals: { sleep: { type: 'range', min: 7, max: 9 } } }, 'sleep'],
    [{ entries: [e('bloodPressure', 'mmHg', '2026-09-27', 150, { value2: 95 })], goals: { bloodPressure: { type: 'down', max: 130, max2: 85 } } }, 'bloodPressure'],
  ];
  for (const [health, metric] of cases) {
    const app = load(health);
    texts.push(app.run(`healthGoalHTML('${metric}', healthSeries('${metric}'))`), app.run(`healthDetailCard('${metric}', { clientWidth: 358 })`));
  }
  const all = texts.join(' ');
  assert.doesNotMatch(all, /¡|sano|sobrepeso|\balt[oa]\b|\bbaj[oa]\b|enhorabuena|bien hecho|cuidado|riesgo|peligro|preocup|genial|ánimo/i);
  assert.doesNotMatch(all, /class="[^"]*\b(over|alert|warn|danger)\b/);
});

test('quitarlo, copias, «Borrar todos los datos» y borrar registros', async () => {
  const app = load({ entries: WEIGHT, goals: { weight: { type: 'down', max: 70 }, sleep: { type: 'up', min: 8 } } });
  assert.deepEqual(run(app, 'readBackup(JSON.stringify(backupPayload())).data.health.goals'), run(app, 'state.health.goals'));
  assert.equal(run(app, 'backupPayload({ health: false }).data.health'), undefined);
  assert.ok(run(app, 'backupItems(backupCounts(state))').includes('Salud: 4 registros y 2 objetivos'));
  app.run(`removeHealthGoal('sleep')`);
  assert.deepEqual(Object.keys(run(app, 'state.health.goals')), ['weight']);
  assert.equal(JSON.parse(app.storage.get('racha:v1')).health.goals.sleep, undefined, 'quitado de verdad');
  // Borrar todos los datos también los borra.
  app.run('eraseAllData()');
  assert.deepEqual(run(app, 'state.health.goals'), {});
  // Borrar solo los registros de Salud conserva los objetivos.
  const keep = load({ entries: WEIGHT, goals: { weight: { type: 'down', max: 70 } } });
  keep.run(`askConfirm = async () => true`);
  await keep.run('clearHealth()');
  assert.equal(keep.run('state.health.entries.length'), 0);
  assert.deepEqual(run(keep, 'state.health.goals'), { weight: { type: 'down', max: 70 } });
});

test('los objetivos no cambian la XP, las rachas ni los retos', () => {
  const habits = [{ id: 'h1', name: 'Leer', created: '2026-09-01', done: { '2026-09-25': 1, '2026-09-26': 1 } }];
  const withGoals = loadApp({ stored: { habits, health: { entries: WEIGHT, goals: { weight: { type: 'down', max: 70 } } } } });
  withGoals.run(`saveHealthGoal('sleep', 'up', { min: '8' })`);
  assert.deepEqual(run(withGoals, 'computeStats()'), run(loadApp({ stored: { habits } }), 'computeStats()'));
});
