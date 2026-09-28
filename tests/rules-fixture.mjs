// Datos ficticios pero variados (todos los tipos de hábito que ya existían, con pausas, protectores, archivados,
// recaídas y un banco de XP) y la «huella» de todo lo que sale de las reglas de XP, rachas, protectores, retos
// y logros. Sirve para comprobar que añadir funciones no cambia las cuentas de los hábitos de siempre.
import { createHash } from 'node:crypto';

// Generador con semilla (mulberry32): mismos datos en cada ejecución.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, '0');
function shift(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dataset(seed, today = '2026-09-27') {
  const r = rng(seed);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const span = 60 + Math.floor(r() * 200);
  const start = shift(today, -span);
  const kinds = ['yesno', 'count', 'target', 'weekly', 'days', 'quit', 'quit', 'yesno', 'target', 'count'];
  const habits = [];
  for (let i = 0, n = 5 + Math.floor(r() * 8); i < n; i++) {
    const kind = pick(kinds);
    const created = shift(start, Math.floor(r() * (span - 5)));
    const h = { id: `h${seed}-${i}`, name: `Hábito ${i}`, emoji: '⭐', created, done: {}, slips: {}, shields: {}, notes: {} };
    const p = 0.35 + r() * 0.6;
    if (kind === 'count') Object.assign(h, { goal: 2 + Math.floor(r() * 6), unit: pick(['', 'vasos']), type: pick(['custom', 'water', 'teeth']) });
    if (kind === 'target') Object.assign(h, { mode: 'target', measure: pick(['min', 'km', 'pages', 'hours']), goal: pick([10, 20, 30, 5, 8]), unit: 'min', type: pick(['walk', 'read', 'custom']) });
    if (kind === 'weekly') Object.assign(h, { schedule: { type: 'weekly', times: 1 + Math.floor(r() * 7) } });
    if (kind === 'days') Object.assign(h, { schedule: { type: 'days', days: [0, 1, 2, 3, 4, 5, 6].filter(() => r() < 0.5) } });
    if (kind === 'quit') Object.assign(h, { kind: 'quit', type: pick(['smoke', 'coffee', 'custom']) });
    for (let k = created; k <= today; k = shift(k, 1)) {
      if (kind === 'quit') {
        if (r() < 0.08) h.slips[k] = 1;
      } else if (r() < p) {
        if (kind === 'count') h.done[k] = 1 + Math.floor(r() * h.goal);
        else if (kind === 'target') h.done[k] = Math.round(h.goal * (0.3 + r() * 1.2) * 100) / 100;
        else h.done[k] = 1;
      } else if (kind !== 'weekly' && r() < 0.1) {
        h.shields[k] = 1;
      }
      if (r() < 0.05) h.notes[k] = `Nota ${k}`;
    }
    if (kind !== 'quit' && r() < 0.2) h.done[shift(created, -3)] = kind === 'count' || kind === 'target' ? h.goal : 1;
    if (r() < 0.35) {
      const from = shift(created, Math.floor(r() * 20));
      h.pauses = [{ from, to: r() < 0.3 ? null : shift(from, 2 + Math.floor(r() * 10)) }];
    }
    if (r() < 0.15) h.archived = shift(today, -Math.floor(r() * 30));
    habits.push(h);
  }
  const days = {};
  for (let k = start; k <= today; k = shift(k, 1)) if (r() < 0.3) days[k] = { mood: 1 + Math.floor(r() * 5) };
  return {
    habits,
    bank: { xp: Math.floor(r() * 500), checkins: Math.floor(r() * 50), best: Math.floor(r() * 20), clean: Math.floor(r() * 30), shields: Math.floor(r() * 3), challenges: Math.floor(r() * 5) },
    challengesSince: shift(start, 14),
    days,
    profile: { name: 'Prueba', since: start },
  };
}

// `limit: null` es el campo que los hábitos llevan desde los de límite: no cuenta para las reglas.
function withoutLimitField(value) {
  if (Array.isArray(value)) value.forEach(withoutLimitField);
  else if (value && typeof value === 'object') {
    if ('kind' in value && 'done' in value && value.limit === null) delete value.limit;
    Object.values(value).forEach(withoutLimitField);
  }
  return value;
}

// Todo lo que sale de las reglas con esos datos, también tras marcar, restar, apuntar cantidades, recaer,
// archivar y borrar. `run` ejecuta código en la app cargada (como app.run del arnés de pruebas).
// Zen y Salud quedan fuera: no cuentan para ninguna regla, y crecen con cada práctica o medida nueva (y con los
// objetivos de Salud).
export async function rulesFingerprint(run) {
  const get = (code) => JSON.parse(JSON.stringify(run(code)) ?? 'null');
  const rulesState = '(({ zen, health, ...rest }) => rest)(state)';
  const out = {
    boot: get(rulesState), // al abrir se gastan protectores solos
    stats: get('computeStats()'),
    streaks: get('state.habits.map((h) => streakInfo(h))'),
    shields: get('shieldInfo()'),
    challengeTotals: get('challengeTotals()'),
    weeks: get(`(() => { const o = {}; for (let ws = state.challengesSince; ws <= weekStartOf(ui.today); ws = shiftKey(ws, 7)) o[ws] = [weekChallenges(ws), weekSummary(ws).pct, weekSummary(ws).xp, weekData(ws)]; return o; })()`),
    days: get(`(() => { const o = {}; forEachDay(state.profile.since, ui.today, (d) => { o[d] = [dayTotals(d), isPerfectDay(d), state.habits.map((h) => [isDone(h, d), isDue(h, d), hasSlip(h, d), isShielded(h, d)])]; }); return o; })()`),
    rates: get('state.habits.map((h) => [habitRate(h, 30, 4), habitRate(h, 90, 13)])'),
    achievements: get('ACHIEVEMENTS.map((a) => isUnlocked(a, computeStats()))'),
  };
  run(`askConfirm = async () => true`);
  const ids = get('visibleHabits().map((h) => h.id)');
  const trail = [];
  for (const [i, id] of ids.entries()) {
    const day = `shiftKey(ui.today, -${i % 4})`;
    for (const op of [`toggleHabit('${id}', null)`, `stepDown(findHabit('${id}'), null)`, `toggleHabit('${id}', null)`,
      `if (isTarget(findHabit('${id}'))) setHabitAmount(findHabit('${id}'), ui.day, 3)`]) {
      await run(`(async () => { ui.day = ${day}; ${op} })()`);
      await new Promise((resolve) => setImmediate(resolve));
      trail.push(get('computeStats().xp'));
    }
  }
  if (ids[0]) run(`archiveHabit(findHabit('${ids[0]}'))`);
  if (ids[1]) run(`deleteHabit(findHabit('${ids[1]}'))`);
  run('ui.day = ui.today');
  out.trail = trail;
  out.after = [get(rulesState), get('computeStats()')];
  return withoutLimitField(out);
}

export const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
