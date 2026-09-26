'use strict';

const APP_VERSION = '0.9 beta';
const STORAGE_KEY = 'racha:v1';
const HEATMAP_WEEKS = 53; // un año
const LONG_PRESS_MS = 500; // mantener pulsado resta 1 en los hábitos con cantidad

// ---------- Progresión: XP, niveles y logros ----------

const XP_PER_CHECK = 10;   // cada hábito hecho
const XP_STREAK_CAP = 10;  // bonus de racha: +1 por día seguido, hasta +10
const XP_PERFECT_DAY = 25; // todos los hábitos del día hechos
const SHIELD_EVERY = 7;      // 1 protector por cada 7 días seguidos de racha
const SHIELD_MAX = 3;        // como mucho 3 guardados
const SHIELD_MIN_STREAK = 3; // solo se gastan para salvar rachas de 3 días o más

// Ánimo del día (1–5) y nota corta
const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
const MOOD_NAMES = ['Mal', 'Regular', 'Normal', 'Bien', 'Genial'];
const NOTE_MAX = 200;
const MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];
const WEEK_MILESTONES = [2, 4, 8, 12, 26, 52]; // metas para los hábitos de "X veces por semana"

// Días de la semana: 0 = lunes … 6 = domingo
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const LEVELS = [
  { emoji: '🌱', title: 'Semilla' },
  { emoji: '🌿', title: 'Brote' },
  { emoji: '🪴', title: 'Planta' },
  { emoji: '🌳', title: 'Árbol' },
  { emoji: '🔥', title: 'Constante' },
  { emoji: '⚡', title: 'Enfocado' },
  { emoji: '💪', title: 'Disciplinado' },
  { emoji: '🧭', title: 'Explorador' },
  { emoji: '🏔️', title: 'Escalador' },
  { emoji: '🦅', title: 'Imparable' },
  { emoji: '🧠', title: 'Sabio' },
  { emoji: '🛡️', title: 'Guardián' },
  { emoji: '👑', title: 'Maestro' },
  { emoji: '🌟', title: 'Estrella' },
  { emoji: '🐉', title: 'Leyenda' },
];

// stat: qué número mira el logro (ver computeStats) · goal: cuánto hace falta
const ACHIEVEMENTS = [
  { emoji: '✅', name: 'Primer paso', desc: 'Marca tu primer hábito', stat: 'checkins', goal: 1 },
  { emoji: '🔥', name: 'En marcha', desc: 'Racha de 3 días', stat: 'best', goal: 3 },
  { emoji: '🌟', name: 'Día perfecto', desc: 'Todos tus hábitos en un día', stat: 'perfectDays', goal: 1 },
  { emoji: '📅', name: 'Una semana', desc: 'Racha de 7 días', stat: 'best', goal: 7 },
  { emoji: '🚀', name: 'Despegue', desc: 'Llega al nivel 5', stat: 'level', goal: 5 },
  { emoji: '⚡', name: 'Dos semanas', desc: 'Racha de 14 días', stat: 'best', goal: 14 },
  { emoji: '🎯', name: 'Medio centenar', desc: 'Marca 50 hábitos en total', stat: 'checkins', goal: 50 },
  { emoji: '✨', name: 'Perfeccionista', desc: '10 días perfectos', stat: 'perfectDays', goal: 10 },
  { emoji: '🏅', name: 'Un mes entero', desc: 'Racha de 30 días', stat: 'best', goal: 30 },
  { emoji: '🦅', name: 'Doble dígito', desc: 'Llega al nivel 10', stat: 'level', goal: 10 },
  { emoji: '🏆', name: 'Veterano', desc: 'Marca 250 hábitos en total', stat: 'checkins', goal: 250 },
  { emoji: '💯', name: 'Centenario', desc: 'Racha de 100 días', stat: 'best', goal: 100 },
  { emoji: '💎', name: 'Diamante', desc: '50 días perfectos', stat: 'perfectDays', goal: 50 },
  { emoji: '👑', name: 'Un año', desc: 'Racha de 365 días', stat: 'best', goal: 365 },
  { emoji: '🛡️', name: 'Escudo', desc: 'Usa tu primer protector', stat: 'shieldsUsed', goal: 1 },
  { emoji: '🕊️', name: 'Libre', desc: '30 días sin recaer', stat: 'bestClean', goal: 30 },
  { emoji: '🏆', name: 'Retador', desc: 'Completa 10 retos semanales', stat: 'challenges', goal: 10 },
];

// Plantillas: las 8 primeras salen en la bienvenida. Los campos que faltan usan los valores por defecto.
const TEMPLATES = [
  { emoji: '💧', name: 'Beber agua', goal: 8, unit: 'vasos' },
  { emoji: '🚶', name: 'Caminar 30 min' },
  { emoji: '📚', name: 'Leer', goal: 10, unit: 'páginas' },
  { emoji: '🧘', name: 'Meditar' },
  { emoji: '😴', name: 'Dormir 8 horas' },
  { emoji: '💪', name: 'Hacer ejercicio', schedule: { type: 'weekly', times: 3 } },
  { emoji: '🍎', name: 'Comer fruta' },
  { emoji: '📵', name: 'Menos redes', kind: 'quit' },
  { emoji: '✍️', name: 'Escribir diario' },
  { emoji: '🦷', name: 'Hilo dental' },
  { emoji: '🚭', name: 'Dejar de fumar', kind: 'quit' },
  { emoji: '🍬', name: 'Sin azúcar', kind: 'quit' },
];
// Campos de un hábito que se copian de una plantilla.
const templateFields = (t) => ({
  name: t.name,
  emoji: t.emoji,
  kind: t.kind || 'build',
  goal: t.goal || 1,
  unit: t.unit || '',
  schedule: t.schedule || { type: 'daily' },
});

const SUGGESTED_EMOJIS = [
  '💧', '🏃', '📚', '🧘', '😴', '🥗', '💊', '🦷',
  '✍️', '🎸', '🚶', '💪', '🧹', '🌱', '☀️', '🙏',
  '📵', '🍎', '🚭', '💰', '🧠', '🎨', '🛏️', '📝',
];

// Cada hábito tiene su color (se usa en su tarjeta, su casilla y su mapa de calor).
const COLORS = [
  { id: 'salvia', name: 'Salvia', hex: '#6F9677' },
  { id: 'jade', name: 'Jade', hex: '#4E8C7E' },
  { id: 'niebla', name: 'Niebla', hex: '#6C8CA6' },
  { id: 'glicina', name: 'Glicina', hex: '#8E86B4' },
  { id: 'sakura', name: 'Sakura', hex: '#CF8591' },
  { id: 'arcilla', name: 'Arcilla', hex: '#C27556' },
  { id: 'ocre', name: 'Ocre', hex: '#BF9544' },
  { id: 'piedra', name: 'Piedra', hex: '#858379' },
];
// Colores de la versión anterior → su equivalente zen.
const OLD_COLORS = {
  violeta: 'glicina', rosa: 'sakura', naranja: 'arcilla', amarillo: 'ocre',
  verde: 'salvia', turquesa: 'jade', azul: 'niebla', rojo: 'arcilla',
};
const colorHex = (id) => (COLORS.find((c) => c.id === id) || COLORS[0]).hex;
// El primer color que aún no use ningún hábito (o el siguiente en la rueda).
const nextColor = (habits) => (
  COLORS.find((c) => !habits.some((h) => h.color === c.id)) || COLORS[habits.length % COLORS.length]
).id;

const DEFAULT_AVATAR = '🙂';
const AVATARS = [
  '🙂', '😎', '🤓', '🥳', '🦊', '🐼', '🐯', '🦁',
  '🐸', '🐙', '🦄', '🐲', '🐱', '🐶', '🌻', '🌈',
  '⭐', '🚀', '🎧', '⚽', '🎮', '🧑‍💻', '🏃', '🧘',
];

const $ =(selector) => document.querySelector(selector);

const ICONS = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  grip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>',
};

// ---------- Fechas (siempre en hora local, formato AAAA-MM-DD) ----------

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => dateKey(new Date());
const isDateKey = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function shiftKey(key, days) {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

const weekdayOf = (key) => (parseKey(key).getDay() + 6) % 7; // 0 = lunes
const weekStartOf = (key) => shiftKey(key, -weekdayOf(key));

// Recorre los días de `from` a `to` (ambos incluidos) llamando a fn(clave, díaDeLaSemana).
function forEachDay(from, to, fn) {
  const d = parseKey(from);
  for (let key = from; key <= to; key = dateKey(d)) {
    fn(key, (d.getDay() + 6) % 7);
    d.setDate(d.getDate() + 1);
  }
}

const fmtLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtWeekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
const fmtMonth = new Intl.DateTimeFormat('es-ES', { month: 'short' });
const fmtCaption = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtCaptionYear = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtShortDate = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
const shortDate = (key) => fmtShortDate.format(parseKey(key)).replace('.', '');
const fmtNumber = new Intl.NumberFormat('es-ES');
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n, one, many) => `${fmtNumber.format(n)} ${n === 1 ? one : many}`;

const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// ---------- Datos (localStorage) ----------

const uid = () => (crypto.randomUUID
  ? crypto.randomUUID()
  : Date.now().toString(36) + Math.random().toString(36).slice(2));

// "bank" guarda la XP y los récords de los hábitos borrados, para que borrar no cambie tu XP ni tus logros.
const emptyBank = () => ({ xp: 0, checkins: 0, best: 0, clean: 0, shields: 0, challenges: 0 });
const emptyState = () => ({
  profile: { name: '', avatar: DEFAULT_AVATAR, since: todayKey() },
  habits: [],
  bank: emptyBank(),
  lastBackup: null,
  challengesSince: null, // lunes de la primera semana con retos (se fija al abrir la 0.8 por primera vez)
  days: {},              // diario: { 'AAAA-MM-DD': { mood: 1–5, note } }
  lastSummary: null,     // lunes de la última semana en la que se enseñó el resumen
});

// Diario: solo días válidos con ánimo (1–5) y/o nota (hasta 200 caracteres).
function normalizeDays(days) {
  const clean = {};
  Object.entries(days || {}).forEach(([k, v]) => {
    if (!isDateKey(k) || !v) return;
    const entry = {};
    const mood = Math.round(Number(v.mood));
    if (mood >= 1 && mood <= 5) entry.mood = mood;
    if (typeof v.note === 'string' && v.note.trim()) entry.note = v.note.trim().slice(0, NOTE_MAX);
    if (entry.mood || entry.note) clean[k] = entry;
  });
  return clean;
}

// Frecuencia: diario (por defecto), días concretos (0 = lunes) o X veces por semana (1–6).
function normalizeSchedule(s) {
  if (s && s.type === 'days' && Array.isArray(s.days)) {
    const days = [...new Set(s.days.map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort((a, b) => a - b);
    if (days.length === 7) return { type: 'daily' };
    if (days.length) return { type: 'days', days };
  }
  if (s && s.type === 'weekly') {
    const times = Math.round(Number(s.times));
    if (times >= 1 && times <= 6) return { type: 'weekly', times };
  }
  return { type: 'daily' };
}

// Pausas: [{ from, to }] con `to` = null si es indefinida.
const normalizePauses = (list) => (Array.isArray(list) ? list : [])
  .filter((p) => p && isDateKey(p.from) && (!p.to || (isDateKey(p.to) && p.to >= p.from)))
  .map((p) => ({ from: p.from, to: isDateKey(p.to) ? p.to : null }));

// Meta diaria: de 1 a 99 (1 = hábito de sí/no, como siempre).
const clampGoal = (v) => Math.min(99, Math.max(1, Math.round(Number(v)) || 1));

// Cada día marcado guarda un número (las versiones antiguas guardaban 1).
const normalizeDone = (done) => Object.fromEntries(Object.entries(done || {})
  .filter(([k, v]) => isDateKey(k) && Number(v) > 0)
  .map(([k, v]) => [k, Math.min(999, Math.round(Number(v)) || 1)]));

// { 'AAAA-MM-DD': 1 } con solo fechas válidas (recaídas y protectores).
const dayFlags = (obj) => Object.fromEntries(Object.keys(obj || {}).filter(isDateKey).map((k) => [k, 1]));

// Limpia y valida los datos (sirve para lo guardado y para copias importadas).
function normalize(data) {
  if (!data || !Array.isArray(data.habits)) return null;
  const clean = emptyState();
  clean.habits = data.habits
    .filter((h) => h && typeof h.name === 'string' && h.name.trim())
    .map((h, i) => ({
      id: String(h.id || uid()),
      name: h.name.trim().slice(0, 40),
      emoji: typeof h.emoji === 'string' && h.emoji ? h.emoji : '⭐',
      // Los hábitos de versiones anteriores reciben un color según su posición.
      color: COLORS.some((c) => c.id === h.color) ? h.color
        : OLD_COLORS[h.color] || COLORS[i % COLORS.length].id,
      // Tipo: 'build' (empezar a hacer algo) o 'quit' (dejar algo). Los de dejar son diarios y sin cantidad.
      kind: h.kind === 'quit' ? 'quit' : 'build',
      schedule: h.kind === 'quit' ? { type: 'daily' } : normalizeSchedule(h.schedule),
      goal: h.kind === 'quit' ? 1 : clampGoal(h.goal),
      unit: typeof h.unit === 'string' ? h.unit.trim().slice(0, 20) : '',
      pauses: normalizePauses(h.pauses),
      archived: isDateKey(h.archived) ? h.archived : null,
      created: isDateKey(h.created) ? h.created : todayKey(),
      done: normalizeDone(h.done),
      slips: dayFlags(h.slips),
      shields: dayFlags(h.shields), // días salvados con un protector
    }));
  const bank = data.bank || {};
  const count = (v) => Math.max(0, Number(v) || 0);
  clean.bank = {
    xp: Number(bank.xp) || 0, // puede ser negativo: compensa los días que pasan a ser perfectos al borrar
    checkins: count(bank.checkins),
    best: count(bank.best),
    clean: count(bank.clean),
    shields: count(bank.shields),
    challenges: count(bank.challenges),
  };
  clean.lastBackup = isDateKey(data.lastBackup) ? data.lastBackup : null;
  clean.challengesSince = isDateKey(data.challengesSince) ? weekStartOf(data.challengesSince) : null;
  clean.days = normalizeDays(data.days);
  clean.lastSummary = isDateKey(data.lastSummary) ? weekStartOf(data.lastSummary) : null;

  // Perfil. Si no hay fecha de inicio (datos de versiones anteriores), usamos el día más antiguo que conste.
  const profile = data.profile || {};
  const oldest = clean.habits
    .flatMap((h) => [h.created, ...Object.keys(h.done)])
    .sort()[0];
  clean.profile = {
    name: typeof profile.name === 'string' ? profile.name.trim().slice(0, 24) : '',
    avatar: typeof profile.avatar === 'string' && profile.avatar ? profile.avatar : DEFAULT_AVATAR,
    since: isDateKey(profile.since) ? profile.since : oldest || todayKey(),
  };
  return clean;
}

function load() {
  try {
    const data = normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    if (data) return data;
  } catch (err) {
    console.warn('No se pudieron leer los datos guardados', err);
  }
  return emptyState();
}

function save() {
  invalidate(); // los datos han cambiado: hay que recalcular
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    toast('No se pudo guardar. ¿Estás en navegación privada?');
  }
}

function replaceState(data) {
  state.profile = data.profile;
  state.habits = data.habits;
  state.bank = data.bank;
  state.lastBackup = data.lastBackup;
  state.challengesSince = data.challengesSince || state.challengesSince || weekStartOf(ui.today);
  state.days = data.days;
  state.lastSummary = data.lastSummary || state.lastSummary;
  save();
  render();
}

const findHabit = (id) => state.habits.find((h) => h.id === id);

// Hábito nuevo con los valores por defecto (diario, sin pausas).
const newHabit = (fields) => ({
  id: uid(),
  kind: 'build',
  schedule: { type: 'daily' },
  goal: 1,
  unit: '',
  pauses: [],
  archived: null,
  created: ui.today,
  done: {},
  slips: {},
  shields: {},
  ...fields,
});

// Hábitos que se ven en Hoy e Historial (los archivados solo aparecen en Ajustes).
const visibleHabits = () => state.habits.filter((h) => !h.archived);

// Caché de cálculos por hábito (y de los que mezclan varios, como protectores y retos).
// Se vacía en cada save() y al cambiar de día.
let calcCache = new WeakMap();
const globalCache = new Map();
let cacheDay = null;
function invalidate() {
  calcCache = new WeakMap();
  globalCache.clear();
}
function checkCacheDay() {
  if (cacheDay !== ui.today) {
    invalidate();
    cacheDay = ui.today;
  }
}
function cachedGlobal(name, compute) {
  checkCacheDay();
  if (!globalCache.has(name)) globalCache.set(name, compute());
  return globalCache.get(name);
}
function cached(habit, name, compute) {
  checkCacheDay();
  let entry = calcCache.get(habit);
  if (!entry) {
    entry = {};
    calcCache.set(habit, entry);
  }
  if (!(name in entry)) entry[name] = compute();
  return entry[name];
}

const state = load();
const ui = {
  view: 'today',
  today: todayKey(),
  day: todayKey(), // día que se está viendo en la pantalla "Hoy"
  editing: false,
  editingId: null,
  pop: null,
};

// ---------- Cálculos: rachas, XP y nivel ----------

// Estas pocas funciones deciden qué cuenta cada día. Hoy, Historial, XP, día perfecto
// y logros usan siempre las mismas, así todo cuadra.

// Primer día que cuenta: el de creación o el primer día marcado, si es anterior.
const habitStart = (habit) => cached(habit, 'start', () => (
  Object.keys(habit.done).reduce((min, k) => (k < min ? k : min), habit.created)
));
const isPaused = (habit, key) => habit.pauses.some((p) => key >= p.from && (!p.to || key <= p.to));
// `archived` es el primer día que ya no cuenta.
const isArchivedOn = (habit, key) => Boolean(habit.archived) && key >= habit.archived;
// Ya existía, no estaba en pausa ni archivado.
const isActive = (habit, key) => key >= habitStart(habit) && !isArchivedOn(habit, key) && !isPaused(habit, key);
// Hecho = llegó a su meta ese día. En los de dejar algo, cada día activo sin recaída cuenta como hecho.
function isDone(habit, key) {
  if (habit.kind === 'quit') return key <= ui.today && !habit.slips[key] && isActive(habit, key);
  return (habit.done[key] || 0) >= habit.goal;
}
// Cuánto se lleva ese día (sin pasar de la meta, por si se bajó después).
const amountOn = (habit, key) => Math.min(habit.done[key] || 0, habit.goal);
const hasSlip = (habit, key) => habit.kind === 'quit' && Boolean(habit.slips[key]) && isActive(habit, key);
// Día salvado por un protector: tocaba, no se hizo y hay un protector apuntado. Si luego se marca, deja de contar.
const isShielded = (habit, key) => Boolean(habit.shields[key]) && habit.kind !== 'quit' && isDue(habit, key) && !isDone(habit, key);
// "Dejar de fumar" → "fumar", "Sin azúcar" → "azúcar", "Menos redes" → "redes"
const quitWhat = (habit) => {
  const rest = habit.name.replace(/^(dejar\s+(de|el|la|los|las)\s+|dejar\s+|sin\s+|menos\s+|no\s+)/i, '').trim() || habit.name;
  return rest.charAt(0).toLowerCase() + rest.slice(1);
};

// ¿Tocaba hacerlo ese día? Los de "X veces por semana" nunca tocan un día concreto.
function isDue(habit, key, weekday = weekdayOf(key)) {
  const { schedule } = habit;
  if (schedule.type === 'weekly' || !isActive(habit, key)) return false;
  return schedule.type === 'daily' || schedule.days.includes(weekday);
}

// Estado de un día para pintarlo: activo, descanso (días concretos), en pausa o fuera (antes de crearlo / archivado).
function dayStatus(habit, key) {
  if (key < habitStart(habit) || isArchivedOn(habit, key)) return 'off';
  if (isPaused(habit, key)) return 'paused';
  if (habit.schedule.type === 'days' && !habit.schedule.days.includes(weekdayOf(key))) return 'rest';
  return 'active';
}

// Días hechos en la semana de `key` (de lunes hasta `until`, o la semana entera).
function weekCount(habit, key, until) {
  const start = weekStartOf(key);
  let n = 0;
  forEachDay(start, until || shiftKey(start, 6), (k) => { if (isDone(habit, k)) n++; });
  return n;
}

// Anillo de Hoy: los que tocan ese día y los semanales a los que aún les queda cupo esa semana.
function countsForRing(habit, key) {
  if (habit.schedule.type !== 'weekly') return isDue(habit, key);
  if (!isActive(habit, key)) return false;
  return isDone(habit, key) || weekCount(habit, key, shiftKey(key, -1)) < habit.schedule.times;
}

// Recorre el historial en orden cronológico: XP, racha actual, mejor racha y días marcados.
// La racha sigue viva hasta el final de hoy (o de la semana, en los semanales).
const streakInfo = (habit) => cached(habit, 'streak', () => (
  habit.schedule.type === 'weekly' ? weeklyTimeline(habit) : dailyTimeline(habit)
));

// Además de la racha, apunta los días en que llega a un múltiplo de 7 (ahí se gana un protector)
// y la racha de cada día (para los retos).
function dailyTimeline(habit) {
  const today = ui.today;
  let run = 0;
  let best = 0;
  let xp = 0;
  let checkins = 0;
  const earns = [];
  const runOn = {};
  const xpOn = {};
  forEachDay(habitStart(habit), today, (key, weekday) => {
    const done = isDone(habit, key);
    if (done) checkins++;
    if (isDue(habit, key, weekday)) {
      if (done) {
        xpOn[key] = XP_PER_CHECK + Math.min(run, XP_STREAK_CAP);
        xp += xpOn[key];
        run++;
        best = Math.max(best, run);
        if (run % SHIELD_EVERY === 0) earns.push(key);
      } else if (isShielded(habit, key)) {
        // protegido: la racha sigue viva, pero ese día no suma ni da XP
      } else if (key !== today || hasSlip(habit, key)) {
        run = 0; // hoy aún se puede hacer… salvo si ya se apuntó una recaída
      }
    } else if (done) {
      xpOn[key] = XP_PER_CHECK; // día extra: da XP sin tocar la racha
      xp += XP_PER_CHECK;
    }
    runOn[key] = run;
  });
  return { unit: 'day', current: run, best, xp, checkins, earns, runOn, xpOn };
}

// Semanales: la racha son semanas cumplidas. Una semana sin cumplir no rompe la racha si es
// la actual o si tuvo días en pausa (o antes de crear el hábito).
function weeklyTimeline(habit) {
  const today = ui.today;
  const { times } = habit.schedule;
  const thisWeek = weekStartOf(today);
  let run = 0;
  let best = 0;
  let xp = 0;
  let checkins = 0;
  let weekDone = 0;
  const xpOn = {};
  for (let ws = weekStartOf(habitStart(habit)); ws <= thisWeek; ws = shiftKey(ws, 7)) {
    let count = 0;
    let blocked = false;
    const gain = XP_PER_CHECK + Math.min(run, XP_STREAK_CAP); // cada día hecho de esta semana
    forEachDay(ws, ws === thisWeek ? today : shiftKey(ws, 6), (key) => {
      if (isDone(habit, key)) {
        count++;
        xpOn[key] = gain;
      }
      if (!isActive(habit, key)) blocked = true;
    });
    xp += count * gain;
    checkins += count;
    if (count >= times) {
      run++;
      best = Math.max(best, run);
    } else if (ws !== thisWeek && !blocked) {
      run = 0;
    }
    if (ws === thisWeek) weekDone = count;
  }
  return { unit: 'week', current: run, best, xp, checkins, weekDone, earns: [], runOn: {}, xpOn };
}

// Hábitos que tocaban ese día y cuántos se hicieron (para el día perfecto).
function dayTotals(key, habits = state.habits) {
  const weekday = weekdayOf(key);
  let total = 0;
  let done = 0;
  for (const h of habits) {
    if (!isDue(h, key, weekday)) continue;
    total++;
    if (isDone(h, key)) done++;
  }
  return { total, done };
}

// Lo mismo, pero para el anillo de Hoy y el mapa general (incluye semanales con cupo).
function ringTotals(key, habits) {
  let total = 0;
  let done = 0;
  for (const h of habits) {
    if (!countsForRing(h, key)) continue;
    total++;
    if (isDone(h, key)) done++;
  }
  return { total, done };
}

function isPerfectDay(key) {
  const { total, done } = dayTotals(key);
  return total > 0 && done === total;
}

// Nivel 1: 0 XP · Nivel 2: 100 · Nivel 3: 300 · Nivel 4: 600… (cada nivel pide 100 XP más que el anterior)
const xpForLevel = (level) => 50 * level * (level - 1);

function levelForXp(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

function levelInfo(level) {
  const meta = LEVELS[Math.min(level, LEVELS.length) - 1];
  if (level <= LEVELS.length) return meta;
  return { emoji: meta.emoji, title: `${meta.title} ${level - LEVELS.length + 1}` };
}

// Todo se calcula a partir del historial, así marcar o desmarcar siempre cuadra.
function computeStats() {
  const { bank } = state;
  let { xp, checkins, best } = bank;
  let bestClean = bank.clean;
  const days = new Set();
  for (const habit of state.habits) {
    const s = streakInfo(habit);
    xp += s.xp;
    checkins += s.checkins;
    if (s.unit === 'day') best = Math.max(best, s.best); // los logros de racha se miden en días
    if (habit.kind === 'quit') bestClean = Math.max(bestClean, s.best);
    // Días que pueden ser perfectos: los marcados y, en los de dejar algo, todos desde que empezó.
    if (habit.kind === 'quit') forEachDay(habitStart(habit), ui.today, (d) => days.add(d));
    else for (const d in habit.done) days.add(d);
  }
  let perfectDays = 0;
  days.forEach((d) => { if (isPerfectDay(d)) perfectDays++; });
  xp += perfectDays * XP_PERFECT_DAY;

  const shields = shieldInfo();
  const challenges = challengeTotals();
  xp += challenges.xp;

  xp = Math.max(0, xp);
  const level = levelForXp(xp);
  return {
    xp, checkins, best, perfectDays, level, bestClean,
    shields: shields.available,
    shieldsEarned: shields.earned,
    shieldsUsed: shields.used + bank.shields,
    challenges: challenges.done + bank.challenges,
    challengeXp: challenges.xp,
    levelStart: xpForLevel(level),
    levelEnd: xpForLevel(level + 1),
  };
}

const isUnlocked = (achievement, stats) => stats[achievement.stat] >= achievement.goal;

// ---------- Protectores de racha ----------

// Recorre el historial de todos los hábitos en orden: +1 protector cada vez que una racha llega a
// un múltiplo de 7 (sin pasar de 3 guardados) y −1 por cada día salvado.
function shieldInfo() {
  return cachedGlobal('shields', () => {
    const events = new Map(); // día → { earn, use }
    const at = (day) => {
      if (!events.has(day)) events.set(day, { earn: 0, use: 0 });
      return events.get(day);
    };
    for (const habit of state.habits) {
      streakInfo(habit).earns.forEach((d) => { at(d).earn++; });
      for (const d in habit.shields) if (isShielded(habit, d)) at(d).use++;
    }
    let stock = 0;
    let earned = 0;
    let used = 0;
    [...events.keys()].sort().forEach((day) => {
      const e = events.get(day);
      earned += e.earn;
      stock = Math.min(SHIELD_MAX, stock + e.earn);
      stock -= e.use;
      used += e.use;
    });
    return { available: Math.max(0, stock), earned, used };
  });
}

// Al abrir la app (y al cambiar de día): si un hábito diario o de días concretos con racha de 3 o más
// se quedó sin hacer ayer (o varios días seguidos, sin pasar de los protectores que tienes), se gastan solos.
function useShields() {
  let available = shieldInfo().available;
  if (!available) return;
  const saved = [];
  const yesterday = shiftKey(ui.today, -1);
  for (const habit of visibleHabits()) {
    if (!available) break;
    if (habit.kind === 'quit' || habit.schedule.type === 'weekly') continue;
    const start = habitStart(habit);
    const gap = [];
    let day = yesterday;
    let found = false; // ¿hay un día hecho (o protegido) antes del hueco?
    while (day >= start) {
      if (isDue(habit, day)) {
        if (isDone(habit, day) || isShielded(habit, day)) {
          found = true;
          break;
        }
        gap.push(day);
        if (gap.length > available) break;
      }
      day = shiftKey(day, -1);
    }
    if (!found || !gap.length || gap.length > available) continue;
    // Probamos a proteger el hueco y miramos si la racha que salva llega al mínimo.
    gap.forEach((d) => { habit.shields[d] = 1; });
    invalidate();
    const streak = streakInfo(habit).current;
    if (streak < SHIELD_MIN_STREAK) {
      gap.forEach((d) => { delete habit.shields[d]; });
      invalidate();
      continue;
    }
    available -= gap.length;
    saved.push({ habit, streak, days: gap.length });
  }
  if (!saved.length) return;
  save();
  const total = saved.reduce((n, x) => n + x.days, 0);
  const what = total === 1 ? '🛡️ Protector usado' : `🛡️ ${total} protectores usados`;
  toast(saved.length === 1
    ? `${what}: tu racha de ${plural(saved[0].streak, 'día', 'días')} sigue viva`
    : `${what}: tus rachas siguen vivas`);
}

// ---------- Retos semanales ----------

// Generador pseudoaleatorio con semilla: misma semana → mismos retos.
function seededRandom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = (h + 0x6D2B79F5) | 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const weekKeys = (ws) => Array.from({ length: 7 }, (_, i) => shiftKey(ws, i));
const isBuildDaily = (h) => h.kind === 'build' && h.schedule.type !== 'weekly';

// Hábitos con los que se eligen los retos de una semana: los que ya existían al empezarla
// (o, en la primera semana, los del primer día que hubo alguno). Así añadir uno a mitad de semana no los cambia.
function weekHabits(ws) {
  const we = shiftKey(ws, 6);
  const all = state.habits.filter((h) => habitStart(h) <= we && (!h.archived || h.archived > ws));
  if (!all.length) return [];
  const firstDay = all.reduce((min, h) => (habitStart(h) < min ? habitStart(h) : min), we);
  const cutoff = firstDay > ws ? firstDay : ws;
  return all.filter((h) => habitStart(h) <= cutoff).sort((a, b) => (a.id < b.id ? -1 : 1));
}

// Lo que pasó en una semana (solo hasta hoy).
function weekData(ws) {
  return cachedGlobal(`week:${ws}`, () => {
    const days = weekKeys(ws);
    const past = days.filter((d) => d <= ui.today);
    const perfect = days.map((d) => d <= ui.today && isPerfectDay(d));
    let row = 0;
    let perfectRow = 0;
    perfect.forEach((p) => { row = p ? row + 1 : 0; perfectRow = Math.max(perfectRow, row); });
    let marks = 0;
    let shieldsUsed = 0;
    let maxRun = 0;
    for (const h of state.habits) {
      const s = streakInfo(h);
      for (const d of past) {
        if (h.kind === 'build' && isDone(h, d)) marks++;
        if (isShielded(h, d)) shieldsUsed++;
        if (s.runOn[d] > maxRun) maxRun = s.runOn[d];
      }
    }
    return {
      days, past, perfect, perfectRow, marks, shieldsUsed, maxRun,
      perfectCount: perfect.filter(Boolean).length,
      ended: days[6] < ui.today,
    };
  });
}

const countDays = (days, fn) => days.reduce((n, d) => n + (fn(d) ? 1 : 0), 0);

// Plantillas de retos. `habit` elige a qué hábito se refiere (si hace falta); `final` = solo se sabe al acabar la semana.
const CHALLENGES = [
  { id: 'perfect3', emoji: '🌟', reward: 40, needs: (hs) => hs.some(isBuildDaily),
    text: () => 'Consigue 3 días perfectos', target: () => 3, value: (w) => w.perfectCount },
  { id: 'perfect5', emoji: '✨', reward: 60, needs: (hs) => hs.some(isBuildDaily),
    text: () => 'Consigue 5 días perfectos', target: () => 5, value: (w) => w.perfectCount },
  { id: 'perfectRow', emoji: '🔗', reward: 60, needs: (hs) => hs.some(isBuildDaily),
    text: () => 'Encadena 3 días perfectos seguidos', target: () => 3, value: (w) => w.perfectRow },
  { id: 'weekend', emoji: '🏖️', reward: 40, needs: (hs) => hs.some(isBuildDaily),
    text: () => 'Consigue un día perfecto en fin de semana', target: () => 1, value: (w) => (w.perfect[5] || w.perfect[6] ? 1 : 0) },
  { id: 'marks', emoji: '🎯', reward: 40, needs: (hs) => hs.some((h) => h.kind === 'build'),
    // 80 % de lo que toca en la semana (entre 2 y 40)
    target: (h, hs, ws) => {
      const expected = hs.filter((x) => x.kind === 'build').reduce((n, x) => n + (x.schedule.type === 'weekly'
        ? x.schedule.times : countDays(weekKeys(ws), (d) => isDue(x, d))), 0);
      return expected < 3 ? 0 : Math.max(2, Math.min(40, Math.round(expected * 0.8)));
    },
    text: (h, n) => `Marca ${n} hábitos esta semana`, value: (w) => w.marks },
  { id: 'allDue', emoji: '📅', reward: 50, habit: isBuildDaily,
    text: (h) => `Completa «${h.name}» todos los días que toca`,
    target: (h, hs, ws) => countDays(weekKeys(ws), (d) => isDue(h, d)),
    value: (w, h) => countDays(w.past, (d) => isDue(h, d) && isDone(h, d)) },
  { id: 'weekly', emoji: '💪', reward: 40, habit: (h) => h.kind === 'build' && h.schedule.type === 'weekly',
    text: (h) => `Cumple «${h.name}» ${plural(h.schedule.times, 'vez', 'veces')} esta semana`,
    target: (h) => h.schedule.times, value: (w, h) => countDays(w.past, (d) => isDone(h, d)) },
  { id: 'qty', emoji: '💧', reward: 40, habit: (h) => isBuildDaily(h) && h.goal > 1,
    text: (h, n) => `Llega a tu meta de «${h.name}» ${plural(n, 'día', 'días')}`,
    target: (h, hs, ws) => Math.min(5, countDays(weekKeys(ws), (d) => isDue(h, d))),
    value: (w, h) => countDays(w.past, (d) => isDone(h, d)) },
  { id: 'extra', emoji: '⭐', reward: 30, habit: (h) => h.kind === 'build' && h.schedule.type === 'days',
    text: (h) => `Haz un día extra de «${h.name}» (en un día de descanso)`, target: () => 1,
    value: (w, h) => countDays(w.past, (d) => isDone(h, d) && dayStatus(h, d) === 'rest') },
  { id: 'clean', emoji: '🕊️', reward: 50, habit: (h) => h.kind === 'quit',
    text: (h) => `Semana entera sin recaídas en «${h.name}»`, target: () => 7,
    value: (w, h) => countDays(w.past, (d) => isDone(h, d)),
    failed: (w, h) => w.past.some((d) => hasSlip(h, d)) },
  { id: 'variety', emoji: '🌈', reward: 40, needs: (hs) => hs.filter((h) => h.kind === 'build').length >= 2,
    text: () => 'Marca cada hábito al menos una vez', target: (h, hs) => hs.filter((x) => x.kind === 'build').length,
    value: (w, h, hs) => hs.filter((x) => x.kind === 'build' && w.past.some((d) => isDone(x, d))).length },
  { id: 'streak7', emoji: '🔥', reward: 50, needs: (hs) => hs.some((h) => h.schedule.type !== 'weekly'),
    text: () => 'Llega a una racha de 7 días en algún hábito', target: () => 7, value: (w) => w.maxRun },
  { id: 'noShield', emoji: '🛡️', reward: 30, final: true, needs: (hs) => hs.some(isBuildDaily),
    text: () => 'No gastes ningún protector esta semana', target: () => 1,
    value: (w) => (w.ended && !w.shieldsUsed ? 1 : 0), failed: (w) => w.shieldsUsed > 0 },
];

// Los 3 retos de la semana que empieza en `ws`, con su avance.
function weekChallenges(ws) {
  return cachedGlobal(`challenges:${ws}`, () => {
    const habits = weekHabits(ws);
    if (!habits.length) return [];
    const pool = [];
    for (const c of CHALLENGES) {
      let habit = null;
      if (c.habit) {
        const options = habits.filter(c.habit);
        if (!options.length) continue;
        habit = options[Math.floor(seededRandom(`${ws}:${c.id}`)() * options.length)];
      } else if (!c.needs(habits)) {
        continue;
      }
      const target = c.target(habit, habits, ws);
      if (target > 0) pool.push({ c, habit, target });
    }
    // Barajar de forma estable y quedarse con 3.
    const rnd = seededRandom(`retos:${ws}`);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const w = weekData(ws);
    return pool.slice(0, 3).map(({ c, habit, target }) => {
      const value = c.value(w, habit, habits);
      const failed = Boolean(c.failed && c.failed(w, habit, habits));
      const done = !failed && value >= target;
      return {
        id: c.id,
        emoji: c.emoji,
        text: c.text(habit, target),
        reward: c.reward,
        target,
        value: Math.min(value, target),
        done,
        failed,
        pending: Boolean(c.final) && !done && !failed, // solo se sabe al acabar la semana
      };
    });
  });
}

// XP y retos completados desde que existen los retos (no se regala XP de semanas anteriores).
function challengeTotals() {
  return cachedGlobal('challengeTotals', () => {
    let xp = 0;
    let done = 0;
    if (!state.challengesSince) return { xp, done };
    for (let ws = state.challengesSince; ws <= weekStartOf(ui.today); ws = shiftKey(ws, 7)) {
      weekChallenges(ws).forEach((ch) => {
        if (!ch.done) return;
        xp += ch.reward;
        done++;
      });
    }
    return { xp, done };
  });
}

// ---------- Pantalla "Hoy" ----------

function renderToday() {
  const stats = computeStats();
  const { day, today } = ui;
  const isToday = day === today;
  const habits = visibleHabits();
  const hasHabits = habits.length > 0;
  if (!hasHabits) ui.editing = false;

  $('#day-title').textContent = !hasHabits ? 'Hoy'
    : isToday ? 'Hoy'
    : day === shiftKey(today, -1) ? 'Ayer'
    : capitalize(fmtWeekday.format(parseKey(day)));
  $('#day-subtitle').textContent = capitalize(fmtLong.format(parseKey(day)));
  $('#greeting-avatar').textContent = state.profile.avatar;
  $('#greeting').innerHTML = greetingHTML();
  $('#next-day').disabled = isToday;
  $('#back-today').hidden = isToday || !hasHabits;
  $('#edit-toggle').textContent = ui.editing ? 'Listo' : 'Editar';
  $('#edit-toggle').classList.toggle('active', ui.editing);
  $('#edit-toggle').hidden = !hasHabits;
  $('#add-btn').hidden = ui.editing;
  $('#day-nav').hidden = !hasHabits;
  $('#level-card').hidden = !hasHabits;
  $('#progress').hidden = !hasHabits;
  $('#welcome').hidden = hasHabits;

  renderLevelCard(stats);
  renderChallengeStrip(hasHabits);
  renderJournal(hasHabits);

  // El anillo solo cuenta lo que toca ese día (los que descansan o están en pausa, no).
  const ring = ringTotals(day, habits);
  const allDone = ring.total > 0 && ring.done === ring.total;
  const restDay = hasHabits && ring.total === 0;
  $('#day-ring').style.setProperty('--p', ring.total ? ring.done / ring.total : 0);
  $('#progress-count').textContent = restDay ? '🌿' : `${ring.done}/${ring.total}`;
  $('#day-ring-label').textContent = restDay ? 'descanso' : allDone ? '¡hecho!' : isToday ? 'hoy' : 'ese día';
  $('#progress-text').textContent = isToday ? 'Tus hábitos de hoy' : 'Hábitos de ese día';
  const note = $('#progress-note');
  note.textContent = restDay ? 'Día de descanso 🌿'
    : allDone ? (isToday ? '¡Todo hecho! 🎉' : '¡Día completo! 🎉')
    : `${ring.done} de ${ring.total} hechos`;
  note.classList.toggle('all-done', allDone);

  let coach = '';
  if (ui.editing) coach = 'Toca un hábito para editarlo, o arrástralo desde ☰ para cambiar el orden.';
  else if (hasHabits && stats.checkins === 0) coach = '👆 Toca un hábito cuando lo completes';
  $('#coach').textContent = coach;
  $('#coach').hidden = !coach;

  // Primero lo que toca, luego lo que descansa y al final lo que está en pausa.
  // En modo edición se respeta el orden real, para poder arrastrar.
  const group = (h) => ({ active: 0, off: 0, rest: 1, paused: 2 }[dayStatus(h, day)]);
  const ordered = ui.editing ? habits : [...habits].sort((a, b) => group(a) - group(b));
  $('#habit-list').innerHTML = ordered.map(habitRow).join('');
  if (!hasHabits) renderWelcome();
}

// "Buenos días," en pequeño y el nombre en grande (o solo el saludo si no hay nombre).
function greetingHTML() {
  const hour = new Date().getHours();
  const hello = hour >= 6 && hour < 13 ? 'Buenos días'
    : hour >= 13 && hour < 21 ? 'Buenas tardes'
    : 'Buenas noches';
  const { name } = state.profile;
  if (!name) return `<b class="greeting-name">${hello}</b>`;
  return `<span class="greeting-hello">${hello},</span> <b class="greeting-name">${escapeHTML(name)}</b>`;
}

function renderLevelCard(stats) {
  const meta = levelInfo(stats.level);
  const inLevel = stats.xp - stats.levelStart;
  const span = stats.levelEnd - stats.levelStart;
  $('#level-emoji').textContent = meta.emoji;
  $('#level-name').textContent = `Nivel ${stats.level}`;
  $('#level-title').textContent = meta.title;
  $('#level-xp').textContent = `${fmtNumber.format(inLevel)}/${fmtNumber.format(span)} XP`;
  $('#level-fill').style.width = `${(inLevel / span) * 100}%`;
  $('#level-next').textContent = `${fmtNumber.format(stats.levelEnd - stats.xp)} XP para el nivel ${stats.level + 1}`;
  const chip = $('#shield-chip');
  chip.textContent = `🛡️ ${stats.shields}`;
  chip.setAttribute('aria-label', `${plural(stats.shields, 'protector de racha', 'protectores de racha')} de ${SHIELD_MAX}`);
}

// Tira compacta en Hoy: "Retos de la semana · 1/3" con una barrita por reto.
function renderChallengeStrip(hasHabits) {
  const list = weekChallenges(weekStartOf(ui.today));
  const strip = $('#challenge-strip');
  strip.hidden = !hasHabits || !list.length;
  if (strip.hidden) return;
  const done = list.filter((c) => c.done).length;
  $('#cs-count').textContent = `${done}/${list.length}`;
  strip.setAttribute('aria-label', `Retos de la semana: ${done} de ${list.length} completados. Ver detalle`);
  $('#cs-bars').innerHTML = list.map((c) => {
    const cls = c.done ? ' done' : c.failed ? ' failed' : '';
    return `<span class="cs-bar${cls}"><span style="width:${(c.value / c.target) * 100}%"></span></span>`;
  }).join('');
}

const flameHTML = (text) => `<span class="flame">🔥 ${text}</span>`;

// Semanales: "✓ 3/3 esta semana"
function weekText(habit) {
  const { times } = habit.schedule;
  const sameWeek = weekStartOf(ui.day) === weekStartOf(ui.today);
  const count = sameWeek ? streakInfo(habit).weekDone : weekCount(habit, ui.day);
  return `${count >= times ? '✓ ' : ''}${count}/${times} ${sameWeek ? 'esta semana' : 'esa semana'}`;
}

// Racha corta, para acompañar a otros datos: "🔥 5 días" o "🔥 2 semanas · 1/3 esta semana".
function shortStreak(habit) {
  const s = streakInfo(habit);
  if (s.unit === 'week') return [s.current ? flameHTML(plural(s.current, 'semana', 'semanas')) : '', weekText(habit)].filter(Boolean).join(' · ');
  return s.current ? flameHTML(plural(s.current, 'día', 'días')) : '';
}

// Texto bajo el nombre: racha y lo siguiente que conviene saber.
function streakMeta(habit) {
  const s = streakInfo(habit);
  const today = ui.today;
  if (s.unit === 'week') return shortStreak(habit);
  if (s.current === 0) return isDue(habit, today) ? 'Empieza tu racha hoy' : 'Empieza tu racha';
  const flame = flameHTML(plural(s.current, 'día', 'días'));
  if (isDue(habit, today) && !isDone(habit, today)) return `${flame} · ¡no la pierdas!`;
  const next = MILESTONES.find((m) => m > s.current);
  return next ? `${flame} · próxima meta: ${next}` : flame;
}

// Los de dejar algo: "🚭 12 días sin fumar"
function quitMeta(habit) {
  if (hasSlip(habit, ui.day)) return `Recaída${ui.day === ui.today ? ' hoy' : ''} · <u>deshacer</u>`;
  const days = plural(streakInfo(habit).current, 'día', 'días');
  return `<span class="flame">${escapeHTML(habit.emoji)} ${days}</span> sin ${escapeHTML(quitWhat(habit))}`;
}

// Cantidad: "3/8 vasos"
const amountText = (habit, key) => `${amountOn(habit, key)}/${habit.goal}${habit.unit ? ` ${escapeHTML(habit.unit)}` : ''}`;

function pauseLabel(habit) {
  const p = habit.pauses.find((x) => ui.day >= x.from && (!x.to || ui.day <= x.to));
  return p && p.to ? `En pausa hasta el ${shortDate(p.to)}` : 'En pausa';
}

function habitRow(habit) {
  const emoji = `<span class="emoji" aria-hidden="true">${escapeHTML(habit.emoji)}</span>`;
  const name = `<span class="name">${escapeHTML(habit.name)}</span>`;
  const safeName = escapeHTML(habit.name);
  let style = `--c:${colorHex(habit.color)}`;

  if (ui.editing) {
    return `<li><button type="button" class="habit" data-id="${habit.id}" style="${style}">
      ${emoji}
      <span class="info">${name}<span class="meta">Toca para editar</span></span>
      <span class="grip-space"></span>
    </button><span class="grip" aria-hidden="true">${ICONS.grip}</span></li>`;
  }

  const day = ui.day;
  const status = dayStatus(habit, day);
  const done = isDone(habit, day);
  const classes = ['habit'];
  if (done) classes.push('done');
  if (ui.pop === habit.id) classes.push('pop');

  if (status === 'paused') {
    classes.push('paused');
    return `<li><button type="button" class="${classes.join(' ')}" data-id="${habit.id}" style="${style}"
      aria-label="${safeName}: ${pauseLabel(habit)}. Toca para reanudar">
      ${emoji}
      <span class="info">${name}<span class="meta">${pauseLabel(habit)} · <u>reanudar</u></span></span>
      <span class="check pause-mark">${ICONS.pause}</span>
    </button></li>`;
  }

  const rest = status === 'rest' ? (day === ui.today ? 'Hoy descansa' : 'Día de descanso') : '';
  let meta;
  let mark = ICONS.check;
  let label = '';

  if (habit.kind === 'quit') {
    if (hasSlip(habit, day)) classes.push('slipped');
    meta = quitMeta(habit);
    label = hasSlip(habit, day) ? `${safeName}: recaída apuntada. Toca para deshacer`
      : `${safeName}: ${plural(streakInfo(habit).current, 'día', 'días')} sin ${escapeHTML(quitWhat(habit))}. Toca si has recaído`;
  } else if (habit.goal > 1) {
    // Cantidad: la tarjeta se va rellenando con el color del hábito.
    classes.push('qty');
    style += `;--fill:${(amountOn(habit, day) / habit.goal).toFixed(3)}`;
    const extra = rest ? (done ? '✨ Día extra' : rest) : shortStreak(habit);
    meta = [`<b class="amount">${amountText(habit, day)}</b>`, extra].filter(Boolean).join(' · ');
    if (!done) mark = ICONS.plus;
    label = `${safeName}: ${amountOn(habit, day)} de ${habit.goal}${habit.unit ? ` ${escapeHTML(habit.unit)}` : ''}. Toca para sumar 1; mantén pulsado para restar 1`;
  } else {
    meta = rest ? (done ? '✨ Día extra' : `${rest}${shortStreak(habit) ? ` · ${shortStreak(habit)}` : ''}`) : streakMeta(habit);
  }
  if (rest) classes.push('resting');
  // Día pasado salvado por un protector (si lo marcas, el protector vuelve).
  if (isShielded(habit, day)) {
    classes.push('shielded');
    meta = '🛡️ Protegido · tu racha siguió viva';
  }

  return `<li><button type="button" class="${classes.join(' ')}" data-id="${habit.id}" aria-pressed="${done}" style="${style}"${label ? ` aria-label="${label}"` : ''}>
    ${emoji}
    <span class="info">${name}<span class="meta">${meta}</span></span>
    <span class="check">${mark}</span>
  </button></li>`;
}

// Tocar un hábito en pausa ofrece reanudarlo (si sigue en pausa hoy).
async function askResume(habit) {
  if (!isPaused(habit, ui.today)) {
    toast('Ese día estaba en pausa');
    return;
  }
  const ok = await askConfirm({
    emoji: '▶️',
    title: `¿Reanudar «${habit.name}»?`,
    body: '<p>Vuelve a contar desde hoy. Los días que estuvo en pausa no rompen tu racha.</p>',
    confirmText: 'Reanudar',
  });
  if (!ok) return;
  resumeHabit(habit);
  save();
  render();
  haptic();
  toast(`▶️ «${habit.name}» reanudado`);
}

// Aplica un cambio en el día que se está viendo y enseña lo que ha pasado: XP, vibración y celebraciones.
function changeHabit(habit, button, mutate) {
  const day = ui.day;
  const before = computeStats();
  const wasPerfect = isPerfectDay(day);
  const wasDone = isDone(habit, day);
  const amountBefore = habit.done[day] || 0;
  const anchor = button && button.querySelector('.check');

  mutate();
  // Si marcas a mano un día que salvó un protector, el protector vuelve a tu reserva.
  const shieldBack = Boolean(habit.shields[day]) && isDone(habit, day);
  if (shieldBack) delete habit.shields[day];
  save();

  const nowDone = isDone(habit, day);
  const after = computeStats();
  const step = (habit.done[day] || 0) - amountBefore;
  if (after.xp !== before.xp) floatXp(anchor, after.xp - before.xp);
  else if (step) floatXp(anchor, step, step > 0 ? '+1' : '−1'); // pasos de cantidad que aún no llegan a la meta
  if (nowDone !== wasDone || step) haptic();

  const hadFocus = button && document.activeElement === button;
  ui.pop = (nowDone && !wasDone) || step > 0 ? habit.id : null;
  renderToday();
  ui.pop = null;
  // Con teclado, el foco sigue en el mismo hábito tras volver a pintar la lista.
  if (hadFocus) $(`.habit[data-id="${habit.id}"]`)?.focus();

  // El aviso del protector se suma al de la celebración, si la hay, para que no se pierda.
  const shieldNote = shieldBack ? ' · 🛡️ el protector vuelve' : '';
  const unlocked = nowDone && !wasDone ? ACHIEVEMENTS.filter((a) => isUnlocked(a, after) && !isUnlocked(a, before)) : [];
  if (nowDone && !wasDone && after.level > before.level) {
    showLevelUp(after, unlocked);
    if (shieldBack) toast('🛡️ El protector vuelve a tu reserva');
  } else if (unlocked.length) {
    confetti();
    const extra = unlocked.length > 1 ? ` (+${unlocked.length - 1})` : '';
    toast(`${unlocked[0].emoji} Logro desbloqueado: ${unlocked[0].name}${extra}${shieldNote}`);
  } else if (nowDone && !wasDone && !wasPerfect && isPerfectDay(day)) {
    confetti(document.body, 90);
    toast(`🌟 ¡Día perfecto! +${XP_PERFECT_DAY} XP extra${shieldNote}`);
  } else if (shieldBack) {
    toast('🛡️ El protector vuelve a tu reserva');
  }
}

// Tocar un hábito: marcar/desmarcar, sumar 1 (cantidad) o apuntar una recaída (dejar algo).
function toggleHabit(id, button) {
  const habit = findHabit(id);
  if (!habit) return;
  const day = ui.day;
  if (isPaused(habit, day)) {
    askResume(habit);
    return;
  }
  if (habit.kind === 'quit') {
    toggleSlip(habit, button);
    return;
  }
  if (habit.goal > 1) {
    const amount = amountOn(habit, day);
    if (amount >= habit.goal) {
      toast('¡Meta cumplida! Mantén pulsado para restar');
      return;
    }
    changeHabit(habit, button, () => { habit.done[day] = amount + 1; });
    return;
  }
  changeHabit(habit, button, () => {
    if (habit.done[day]) delete habit.done[day];
    else habit.done[day] = 1;
  });
}

// Mantener pulsado (o la tecla −) resta 1 en los hábitos con cantidad.
function stepDown(habit, button) {
  const day = ui.day;
  const amount = amountOn(habit, day);
  if (!amount || habit.kind === 'quit' || isPaused(habit, day)) return;
  changeHabit(habit, button, () => {
    if (amount > 1) habit.done[day] = amount - 1;
    else delete habit.done[day];
  });
}

// Recaídas: apuntarla pide confirmación; volver a tocar la deshace.
async function toggleSlip(habit, button) {
  const day = ui.day;
  if (dayStatus(habit, day) === 'off') {
    toast('Ese día este hábito aún no existía');
    return;
  }
  if (habit.slips[day]) {
    changeHabit(habit, button, () => { delete habit.slips[day]; });
    return;
  }
  const ok = await askConfirm({
    emoji: '🫶',
    title: day === ui.today ? '¿Has recaído hoy?' : '¿Recaíste ese día?',
    body: '<p>No pasa nada: apúntalo y sigue. La racha vuelve a empezar al día siguiente. Si te has equivocado, toca otra vez la tarjeta para deshacerlo.</p>',
    confirmText: 'Sí, he recaído',
  });
  if (!ok) return;
  changeHabit(habit, button, () => { habit.slips[day] = 1; });
}

// ---------- Bienvenida ----------

const pickedTemplates = new Set();

function renderWelcome() {
  $('#template-grid').innerHTML = TEMPLATES.slice(0, 8).map((t, i) => `
    <button type="button" class="template" data-template="${i}" aria-pressed="${pickedTemplates.has(i)}" style="--c:${COLORS[i % COLORS.length].hex}">
      <span class="t-emoji" aria-hidden="true">${t.emoji}</span><span>${escapeHTML(t.name)}</span>
    </button>`).join('');
  updateStartButton();
}

function updateStartButton() {
  const n = pickedTemplates.size;
  $('#start-btn').disabled = n === 0;
  $('#start-btn').textContent = n === 0 ? 'Elige al menos uno' : `Empezar con ${plural(n, 'hábito', 'hábitos')}`;
}

$('#template-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-template]');
  if (!btn) return;
  const i = Number(btn.dataset.template);
  if (pickedTemplates.has(i)) pickedTemplates.delete(i);
  else pickedTemplates.add(i);
  btn.setAttribute('aria-pressed', String(pickedTemplates.has(i)));
  updateStartButton();
});

$('#start-btn').addEventListener('click', () => {
  [...pickedTemplates].sort((a, b) => a - b).forEach((i) => {
    const t = TEMPLATES[i];
    state.habits.push(newHabit({ ...templateFields(t), color: nextColor(state.habits) }));
  });
  pickedTemplates.clear();
  save();
  render();
  haptic();
});

// ---------- Pantalla "Progreso" ----------

function renderProgress() {
  const stats = computeStats();
  const meta = levelInfo(stats.level);
  const inLevel = stats.xp - stats.levelStart;
  const span = stats.levelEnd - stats.levelStart;
  const unlockedCount = ACHIEVEMENTS.filter((a) => isUnlocked(a, stats)).length;

  const hero = `<article class="card hero">
    <div class="ring" style="--p:${(inLevel / span).toFixed(3)}"><span aria-hidden="true">${meta.emoji}</span></div>
    <div class="hero-level">Nivel ${stats.level}</div>
    <div class="hero-title">${escapeHTML(meta.title)}</div>
    <div class="xp-track big"><span class="xp-fill" style="width:${(inLevel / span) * 100}%"></span></div>
    <p class="hero-next">${fmtNumber.format(inLevel)} / ${fmtNumber.format(span)} XP · faltan ${fmtNumber.format(stats.levelEnd - stats.xp)} para el nivel ${stats.level + 1}</p>
    <div class="stats">
      <div class="stat"><b>${fmtNumber.format(stats.xp)}</b><span>XP total</span></div>
      <div class="stat"><b>${stats.best}</b><span>Mejor racha</span></div>
      <div class="stat"><b>${stats.perfectDays}</b><span>Días perfectos</span></div>
    </div>
  </article>`;

  const rules = `<article class="card">
    <div class="card-head"><h2>Cómo ganar XP</h2></div>
    <ul class="rules">
      <li><span class="rule-emoji" aria-hidden="true">✅</span>
        <span class="rule-text"><b>Cada hábito hecho</b><span>Toca el hábito cuando lo completes</span></span>
        <span class="rule-xp">+${XP_PER_CHECK}</span></li>
      <li><span class="rule-emoji" aria-hidden="true">🔥</span>
        <span class="rule-text"><b>Bonus de racha</b><span>+1 por cada día (o semana) de racha</span></span>
        <span class="rule-xp">hasta +${XP_STREAK_CAP}</span></li>
      <li><span class="rule-emoji" aria-hidden="true">🌟</span>
        <span class="rule-text"><b>Día perfecto</b><span>Todos los hábitos que tocaban ese día</span></span>
        <span class="rule-xp">+${XP_PERFECT_DAY}</span></li>
      <li><span class="rule-emoji" aria-hidden="true">🏆</span>
        <span class="rule-text"><b>Retos semanales</b><span>3 cada semana, según tus hábitos</span></span>
        <span class="rule-xp">+30 a +60</span></li>
      <li><span class="rule-emoji" aria-hidden="true">✨</span>
        <span class="rule-text"><b>Día extra</b><span>Marcar un hábito en su día de descanso</span></span>
        <span class="rule-xp">+${XP_PER_CHECK}</span></li>
      <li><span class="rule-emoji" aria-hidden="true">🛡️</span>
        <span class="rule-text"><b>Día protegido</b><span>Salva la racha, pero no da XP</span></span>
        <span class="rule-xp">0</span></li>
    </ul>
    <p class="rules-note">Los días de descanso y en pausa no rompen la racha. En los hábitos para dejar algo, cada día sin recaer cuenta como hecho. Cada nivel pide un poco más de XP que el anterior. Si borras un hábito, conservas la XP que ganaste con él.</p>
  </article>`;

  const challenges = weekChallenges(weekStartOf(ui.today));
  const challengeItems = challenges.map((c) => {
    const cls = c.done ? 'done' : c.failed ? 'failed' : '';
    const status = c.done ? `✓ +${c.reward} XP`
      : c.failed ? 'No conseguido'
      : c.pending ? `Se decide el domingo · +${c.reward} XP`
      : `${c.value}/${c.target} · +${c.reward} XP`;
    return `<li class="challenge ${cls}">
      <span class="ch-emoji" aria-hidden="true">${c.emoji}</span>
      <span class="ch-body">
        <b>${escapeHTML(c.text)}</b>
        <span class="ch-bar"><span style="width:${(c.value / c.target) * 100}%"></span></span>
        <span class="ch-meta">${status}</span>
      </span>
    </li>`;
  }).join('');
  const challengesCard = challenges.length ? `<article class="card" id="challenges-card">
    <div class="card-head"><h2>Retos de la semana</h2><span class="card-count">${challenges.filter((c) => c.done).length} de ${challenges.length}</span></div>
    <ul class="challenge-list">${challengeItems}</ul>
    <p class="rules-note">Se renuevan cada lunes y se eligen según tus hábitos. Llevas ${plural(stats.challenges, 'reto completado', 'retos completados')}.</p>
  </article>` : '';

  const slots = Array.from({ length: SHIELD_MAX }, (_, i) => (
    `<span class="shield-slot${i < stats.shields ? ' full' : ''}" aria-hidden="true">🛡️</span>`
  )).join('');
  const shieldsCard = `<article class="card">
    <div class="card-head"><h2>Protectores de racha</h2><span class="card-count">${stats.shields} de ${SHIELD_MAX}</span></div>
    <div class="shield-row" role="img" aria-label="${plural(stats.shields, 'protector disponible', 'protectores disponibles')}">${slots}</div>
    <p class="card-text">Ganas 1 cada vez que un hábito llega a 7, 14, 21… días seguidos (como mucho guardas ${SHIELD_MAX}). Si un día se te olvida un hábito diario con una racha de ${SHIELD_MIN_STREAK} días o más, al abrir la app se gasta solo y tu racha sigue viva. Ese día no da XP ni cuenta como día perfecto, y si luego lo marcas, el protector vuelve.</p>
    <p class="shield-stats">Ganados: ${stats.shieldsEarned} · Usados: ${stats.shieldsUsed}</p>
  </article>`;

  const roadLength = Math.max(LEVELS.length, stats.level + 1);
  const road = Array.from({ length: roadLength }, (_, i) => i + 1).map((lv) => {
    const m = levelInfo(lv);
    const status = lv < stats.level ? 'done' : lv === stats.level ? 'current' : 'locked';
    const note = status === 'done' ? '✓ Superado'
      : status === 'current' ? 'Estás aquí'
      : `${fmtNumber.format(xpForLevel(lv))} XP`;
    return `<div class="road-step ${status}">
      <span class="road-emoji" aria-hidden="true">${m.emoji}</span>
      <span class="road-level">Nivel ${lv}</span>
      <span class="road-title">${escapeHTML(m.title)}</span>
      <span class="road-xp">${note}</span>
    </div>`;
  }).join('');

  const roadCard = `<article class="card clip">
    <div class="card-head"><h2>Camino de niveles</h2></div>
    <div class="road" id="road">${road}</div>
  </article>`;

  const badges = ACHIEVEMENTS.map((a) => {
    const value = Math.min(stats[a.stat], a.goal);
    if (isUnlocked(a, stats)) {
      return `<div class="badge unlocked">
        <span class="badge-emoji" aria-hidden="true">${a.emoji}</span>
        <b>${a.name}</b><span class="badge-desc">${a.desc}</span>
        <span class="badge-done">✓ Conseguido</span>
      </div>`;
    }
    return `<div class="badge locked">
      <span class="badge-emoji" aria-hidden="true">${a.emoji}</span>
      <b>${a.name}</b><span class="badge-desc">${a.desc}</span>
      <span class="badge-bar"><span style="width:${(value / a.goal) * 100}%"></span></span>
      <span class="badge-count">${fmtNumber.format(value)} / ${fmtNumber.format(a.goal)}</span>
    </div>`;
  }).join('');

  const badgesCard = `<article class="card">
    <div class="card-head"><h2>Logros</h2><span class="card-count">${unlockedCount} de ${ACHIEVEMENTS.length}</span></div>
    <div class="badges">${badges}</div>
  </article>`;

  const lastWeek = shiftKey(weekStartOf(ui.today), -7);
  const summaryCard = hasWeekHistory(lastWeek) ? `<article class="card">
    <div class="card-head"><h2>Tu semana pasada</h2></div>
    <p class="card-text">${weekRange(lastWeek)}: cumplimiento, días perfectos, XP, retos y ánimo.</p>
    <button type="button" class="secondary-btn wide" data-summary>📊 Resumen de la semana pasada</button>
  </article>` : '';

  $('#progress-view').innerHTML = hero + challengesCard + summaryCard + shieldsCard + rules + roadCard + badgesCard;

  // Centrar el nivel actual en el camino.
  const roadEl = $('#road');
  const current = roadEl.querySelector('.current');
  if (current) roadEl.scrollLeft = current.offsetLeft - (roadEl.clientWidth - current.offsetWidth) / 2;
}

// ---------- Pantalla "Historial" ----------

// "Cada día", "De lunes a viernes", "L · X · V", "3 veces por semana"…
function scheduleLabel(s) {
  if (s.type === 'weekly') return `${s.times} ${s.times === 1 ? 'vez' : 'veces'} por semana`;
  if (s.type === 'days') {
    const key = s.days.join(',');
    if (key === '0,1,2,3,4') return 'De lunes a viernes';
    if (key === '5,6') return 'Fines de semana';
    return s.days.map((d) => WEEKDAYS[d]).join(' · ');
  }
  return 'Cada día';
}

function renderHistory() {
  const root = $('#history');
  const habits = visibleHabits();

  if (!habits.length) {
    root.innerHTML = `<div class="empty">
      <div class="empty-emoji" aria-hidden="true">📅</div>
      <h2>Todavía no hay historial</h2>
      <p>Cuando marques tus hábitos, aquí verás tu progreso día a día.</p>
      <button type="button" class="primary-btn" data-add>Crear un hábito</button>
    </div>`;
    return;
  }

  const legend = `<span class="legend" aria-hidden="true"><span>Menos</span>${
    [0, 1, 2, 3, 4].map((l) => `<i class="l${l}"></i>`).join('')}<span>Más</span></span>`;

  const overview = `<article class="card">
    <div class="card-head"><h2>Todos los hábitos</h2>${legend}</div>
    ${heatmapHTML('all', (key) => {
      const { total, done } = ringTotals(key, habits);
      if (total) return done ? `l${Math.ceil((done / total) * 4)}` : 'l0';
      // Ese día no tocaba nada: descanso (o días extra), si ya había algún hábito.
      if (habits.some((h) => isDone(h, key))) return 'l2';
      return habits.some((h) => dayStatus(h, key) !== 'off') ? 'rest' : 'l0';
    })}
  </article>`;

  const cards = habits.map((h) => {
    const s = streakInfo(h);
    const unit = s.unit === 'week' ? 'semanas' : 'días';
    const sub = [
      h.kind === 'quit' ? `Dejar · ${escapeHTML(quitWhat(h))}` : scheduleLabel(h.schedule),
      h.goal > 1 ? `Meta: ${h.goal}${h.unit ? ` ${escapeHTML(h.unit)}` : ''}` : '',
      isPaused(h, ui.today) ? 'En pausa' : '',
    ].filter(Boolean).join(' · ');
    const third = h.kind === 'quit'
      ? `<b>${Object.keys(h.slips).length}</b><span>Recaídas</span>`
      : `<b>${s.checkins}</b><span>Días hechos</span>`;
    return `<article class="card" style="--c:${colorHex(h.color)}">
      <div class="card-head">
        <span class="emoji" aria-hidden="true">${escapeHTML(h.emoji)}</span>
        <div class="card-title">
          <h2>${escapeHTML(h.name)}</h2>
          <span class="card-sub">${sub}</span>
        </div>
        <button type="button" class="text-btn" data-edit="${h.id}">Editar</button>
      </div>
      <div class="stats">
        <div class="stat"><b>${s.current}</b><span>Racha (${unit})</span></div>
        <div class="stat"><b>${s.best}</b><span>Mejor (${unit})</span></div>
        <div class="stat">${third}</div>
      </div>
      ${heatmapHTML(h.id, (key) => habitCellClass(h, key))}
    </article>`;
  });

  root.innerHTML = overview + cards.join('');

  // Empezar mostrando las semanas más recientes (a la derecha).
  root.querySelectorAll('.hm-scroll').forEach((el) => { el.scrollLeft = el.scrollWidth; });
}

// Casilla de un hábito: hecho (l4), a medias (l1–l3, en los de cantidad), recaída, pausa o descanso.
function habitCellClass(habit, key) {
  if (hasSlip(habit, key)) return 'slip';
  if (isDone(habit, key)) return 'l4';
  if (isShielded(habit, key)) return 'shield';
  const status = dayStatus(habit, key);
  if (status === 'paused' || status === 'rest') return status;
  const amount = habit.kind === 'quit' ? 0 : amountOn(habit, key);
  return amount ? `l${Math.min(3, Math.max(1, Math.round((amount / habit.goal) * 3)))}` : 'l0';
}

// Cuadrícula tipo GitHub: columnas = semanas (de lunes a domingo), filas = días.
// classOf(clave) devuelve la clase de cada casilla: l0–l4, "rest" (descanso) o "paused".
function heatmapHTML(id, classOf) {
  const today = ui.today;
  const weekday = (parseKey(today).getDay() + 6) % 7; // 0 = lunes
  const start = shiftKey(today, -(weekday + (HEATMAP_WEEKS - 1) * 7));

  let months = '';
  let cells = '';
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    let monthLabel = '';
    for (let d = 0; d < 7; d++) {
      const key = shiftKey(start, w * 7 + d);
      const date = parseKey(key);
      if (w > 0 && date.getDate() === 1) monthLabel = fmtMonth.format(date).replace('.', '');
      if (key > today) {
        cells += '<i class="future"></i>';
      } else {
        cells += `<i class="${classOf(key)}${key === today ? ' today' : ''}" data-k="${key}"></i>`;
      }
    }
    months += `<span>${monthLabel}</span>`;
  }

  return `<div class="heatmap" data-habit="${id}" role="img" aria-label="Mapa de calor de los últimos 12 meses">
      <div class="hm-days" aria-hidden="true"><span></span><span>L</span><span></span><span>X</span><span></span><span>V</span><span></span><span></span></div>
      <div class="hm-scroll">
        <div class="hm-months" aria-hidden="true">${months}</div>
        <div class="hm-grid">${cells}</div>
      </div>
    </div>
    <div class="hm-foot">
      <span class="hm-caption">Toca un día para ver el detalle</span>
      <button type="button" class="link-btn" data-goto hidden>Ver día ›</button>
    </div>
    ${id === 'all' ? '<p class="hm-note" hidden></p>' : ''}`;
}

function dayCaption(habitId, key) {
  const date = parseKey(key);
  const fmt = date.getFullYear() === new Date().getFullYear() ? fmtCaption : fmtCaptionYear;
  const label = capitalize(fmt.format(date).replace(/\./g, ''));
  if (habitId === 'all') {
    const habits = visibleHabits();
    const { total, done } = ringTotals(key, habits);
    const mood = (state.days[key] || {}).mood;
    const moodText = mood ? ` · ${MOODS[mood - 1]}` : '';
    if (total) return `${label} · ${done} de ${total}${moodText}`;
    return `${label} · ${habits.some((h) => dayStatus(h, key) !== 'off') ? 'Día de descanso' : 'sin hábitos'}${moodText}`;
  }
  const habit = findHabit(habitId);
  if (!habit) return label;
  const status = dayStatus(habit, key);
  const amount = habit.kind !== 'quit' && habit.goal > 1
    ? `${amountOn(habit, key)}/${habit.goal}${habit.unit ? ` ${habit.unit}` : ''}` : '';
  if (hasSlip(habit, key)) return `${label} · Recaída`;
  if (isShielded(habit, key)) return `${label} · Protegido 🛡️`;
  if (isDone(habit, key)) {
    if (habit.kind === 'quit') return `${label} · Sin recaer ✓`;
    return `${label} · ${status === 'active' ? 'Hecho ✓' : 'Hecho ✓ (día extra)'}${amount ? ` · ${amount}` : ''}`;
  }
  const text = { paused: 'En pausa', rest: 'Día de descanso', off: 'Aún no existía' }[status]
    || (amount && amountOn(habit, key) ? amount : 'Sin hacer');
  return `${label} · ${text}`;
}

// ---------- Pantalla "Ajustes" ----------

const fmtMonthYear = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const profileName = $('#profile-name');
const profileAvatar = $('#profile-avatar');

$('#avatar-grid').innerHTML = AVATARS
  .map((e) => `<button type="button" data-avatar="${e}" aria-label="${e}">${e}</button>`)
  .join('');
$('#app-version').innerHTML = `Racha · versión ${APP_VERSION}<br>Tus datos se guardan solo en este dispositivo.`;

function renderSettings() {
  const stats = computeStats();
  const meta = levelInfo(stats.level);
  const { profile } = state;

  // No pisamos lo que la persona está escribiendo.
  if (document.activeElement !== profileName) profileName.value = profile.name;
  if (document.activeElement !== profileAvatar) profileAvatar.value = profile.avatar;

  const nameDisplay = $('#profile-name-display');
  nameDisplay.textContent = profile.name || 'Añade tu nombre';
  nameDisplay.classList.toggle('no-name', !profile.name);
  $('#profile-level').textContent = `${meta.emoji} Nivel ${stats.level} · ${meta.title}`;
  $('#profile-since').textContent = `En Racha desde ${fmtMonthYear.format(parseKey(profile.since))}`;
  document.querySelectorAll('#avatar-grid button').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.avatar === profile.avatar));
  });

  $('#backup-date').textContent = state.lastBackup
    ? `Última copia: ${fmtCaptionYear.format(parseKey(state.lastBackup)).replace(/\./g, '')}`
    : 'Aún no has hecho ninguna copia.';

  const archived = state.habits.filter((h) => h.archived);
  $('#archived-section').hidden = !archived.length;
  $('#archived-list').innerHTML = archived.map((h) => {
    const since = h.archived > ui.today ? ui.today : h.archived;
    const name = escapeHTML(h.name);
    return `<li style="--c:${colorHex(h.color)}">
      <span class="emoji" aria-hidden="true">${escapeHTML(h.emoji)}</span>
      <span class="archived-info"><b>${name}</b><span>Desde el ${shortDate(since)} · ${fmtNumber.format(streakInfo(h).xp)} XP</span></span>
      <button type="button" class="pill-btn small" data-restore="${h.id}" aria-label="Restaurar ${name}">Restaurar</button>
      <button type="button" class="icon-btn danger" data-remove="${h.id}" aria-label="Borrar ${name}">🗑️</button>
    </li>`;
  }).join('');
}

$('#archived-list').addEventListener('click', (e) => {
  const restore = e.target.closest('[data-restore]');
  const remove = e.target.closest('[data-remove]');
  if (restore) restoreHabit(findHabit(restore.dataset.restore));
  else if (remove) deleteHabit(findHabit(remove.dataset.remove));
});

// ---------- Pausar, archivar y borrar ----------

// Si hoy ya está hecho, la pausa (o el archivo) empieza mañana: así no se pierde la XP de hoy.
const firstFreeDay = (habit) => (isDone(habit, ui.today) ? shiftKey(ui.today, 1) : ui.today);
const undoTo = (snapshot) => () => replaceState(normalize(JSON.parse(snapshot)));

// Termina ayer las pausas que siguen en marcha y quita las que aún no habían empezado.
function resumeHabit(habit) {
  const today = ui.today;
  habit.pauses = habit.pauses.flatMap((p) => {
    if (p.to && p.to < today) return [p];
    if (p.from >= today) return [];
    return [{ from: p.from, to: shiftKey(today, -1) }];
  });
}

function archiveHabit(habit) {
  const snapshot = JSON.stringify(state);
  habit.archived = firstFreeDay(habit);
  save();
  render();
  haptic();
  toast(`🗄️ «${habit.name}» archivado`, { action: 'Deshacer', onAction: undoTo(snapshot) });
}

function restoreHabit(habit) {
  if (!habit) return;
  // Los días que estuvo archivado cuentan como una pausa, para que no rompan la racha.
  const yesterday = shiftKey(ui.today, -1);
  if (habit.archived <= yesterday) habit.pauses.push({ from: habit.archived, to: yesterday });
  habit.archived = null;
  save();
  render();
  haptic();
  toast(`«${habit.name}» vuelve a estar en Hoy`);
}

// Al borrar, el banco guarda toda la XP que aportaba el hábito (incluidos sus días perfectos).
function deleteHabit(habit) {
  if (!habit) return;
  const snapshot = JSON.stringify(state);
  const before = computeStats();
  const s = streakInfo(habit);
  state.habits = state.habits.filter((h) => h !== habit);
  invalidate(); // los retos y protectores dependen de todos los hábitos
  const after = computeStats();
  // Borrar no cambia la XP total: ni se pierde la que dio, ni se gana por los días que ahora serían perfectos.
  state.bank.xp += before.xp - after.xp;
  state.bank.checkins += s.checkins;
  if (s.unit === 'day') state.bank.best = Math.max(state.bank.best, s.best);
  if (habit.kind === 'quit') state.bank.clean = Math.max(state.bank.clean, s.best);
  state.bank.shields += Math.max(0, before.shieldsUsed - after.shieldsUsed);
  state.bank.challenges += Math.max(0, before.challenges - after.challenges);
  save();
  render();
  toast(`«${habit.name}» eliminado`, { action: 'Deshacer', onAction: undoTo(snapshot) });
}

profileName.addEventListener('input', () => {
  state.profile.name = profileName.value.trim().slice(0, 24);
  save();
  renderSettings();
});
profileName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') profileName.blur();
});

// Igual que el emoji de los hábitos: se queda el último emoji escrito.
profileAvatar.addEventListener('focus', () => profileAvatar.select());
profileAvatar.addEventListener('input', () => {
  const emoji = lastGrapheme(profileAvatar.value);
  profileAvatar.value = emoji;
  if (!emoji) return;
  state.profile.avatar = emoji;
  save();
  renderSettings();
});
profileAvatar.addEventListener('blur', () => { profileAvatar.value = state.profile.avatar; });
profileAvatar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') profileAvatar.blur();
});

$('#avatar-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-avatar]');
  if (!btn) return;
  state.profile.avatar = btn.dataset.avatar;
  save();
  renderSettings();
  haptic();
});

// Fase beta: borra XP, logros e historial, pero mantiene hábitos y perfil. Se puede deshacer.
$('#reset-btn').addEventListener('click', async () => {
  const hasProgress = state.bank.xp > 0 || state.habits.some((h) => Object.keys(h.done).length);
  if (!hasProgress) {
    toast('Aún no tienes progreso que restablecer');
    return;
  }
  const stats = computeStats();
  const ok = await askConfirm({
    emoji: '🔄',
    title: '¿Restablecer tu progreso?',
    body: `<p>Ahora mismo tienes <b>nivel ${stats.level}</b>, <b>${fmtNumber.format(stats.xp)} XP</b> y <b>${
      ACHIEVEMENTS.filter((a) => isUnlocked(a, stats)).length} logros</b>.</p>
      <ul class="confirm-list">
        <li><span aria-hidden="true">🗑️</span><span>Tu XP y tu nivel vuelven a cero</span></li>
        <li><span aria-hidden="true">🗑️</span><span>Todos los logros se bloquean otra vez</span></li>
        <li><span aria-hidden="true">🗑️</span><span>Se borra el historial de días y las rachas</span></li>
        <li><span aria-hidden="true">✅</span><span>Tus hábitos, tu perfil y tu diario se mantienen</span></li>
      </ul>
      <button type="button" class="link-btn" data-export>Exportar una copia antes</button>`,
    confirmText: 'Sí, restablecer',
    danger: true,
  });
  if (!ok) return;

  const snapshot = JSON.stringify(state);
  state.habits.forEach((h) => {
    h.done = {};
    h.slips = {};
    h.shields = {};
    h.created = ui.today;
  });
  state.bank = emptyBank();
  save();
  render();
  haptic();
  toast('🔄 Progreso restablecido', {
    action: 'Deshacer',
    onAction: () => replaceState(normalize(JSON.parse(snapshot))),
  });
});

// ---------- Diálogo de confirmación ----------

const confirmDialog = $('#confirm');

// Devuelve una promesa: true si se confirma, false si se cancela o se cierra.
function askConfirm({ emoji, title, body, confirmText, danger = false }) {
  $('#confirm-emoji').textContent = emoji;
  $('#confirm-title').textContent = title;
  $('#confirm-body').innerHTML = body;
  const okBtn = $('#confirm-ok');
  okBtn.textContent = confirmText;
  okBtn.classList.toggle('danger', danger);

  return new Promise((resolve) => {
    let answer = false;
    okBtn.onclick = () => {
      answer = true;
      confirmDialog.close();
    };
    $('#confirm-cancel').onclick = () => confirmDialog.close();
    confirmDialog.addEventListener('close', () => resolve(answer), { once: true });
    confirmDialog.showModal();
  });
}

confirmDialog.addEventListener('click', (e) => {
  if (e.target === confirmDialog) confirmDialog.close();
});

// ---------- Diario: ánimo y nota del día ----------

const noteInput = $('#note-input');

function setDayEntry(day, patch) {
  const entry = { ...(state.days[day] || {}), ...patch };
  if (!entry.mood) delete entry.mood;
  if (!entry.note) delete entry.note;
  if (entry.mood || entry.note) state.days[day] = entry;
  else delete state.days[day];
  save();
}

function renderJournal(hasHabits) {
  $('#journal').hidden = !hasHabits;
  if (!hasHabits) return;
  const day = ui.day;
  const entry = state.days[day] || {};
  $('#journal-title').textContent = day === ui.today ? '¿Qué tal el día?' : '¿Qué tal fue ese día?';
  document.querySelectorAll('#mood-row [data-mood]').forEach((btn) => {
    btn.setAttribute('aria-checked', String(Number(btn.dataset.mood) === entry.mood));
  });
  const open = Boolean(entry.note) || ui.noteOpenFor === day;
  $('#note-box').hidden = !open;
  $('#note-open').hidden = open;
  if (document.activeElement !== noteInput) noteInput.value = entry.note || '';
  $('#note-count').textContent = `${noteInput.value.length}/${NOTE_MAX}`;
}

$('#mood-row').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-mood]');
  if (!btn) return;
  const mood = Number(btn.dataset.mood);
  // Tocar otra vez el mismo lo quita.
  setDayEntry(ui.day, { mood: (state.days[ui.day] || {}).mood === mood ? 0 : mood });
  renderJournal(true);
  haptic();
});

$('#note-open').addEventListener('click', () => {
  ui.noteOpenFor = ui.day;
  renderJournal(true);
  noteInput.focus();
});

// La nota se guarda mientras escribes (sin volver a pintar, para no perder el foco).
noteInput.addEventListener('input', () => {
  setDayEntry(ui.day, { note: noteInput.value.slice(0, NOTE_MAX) });
  $('#note-count').textContent = `${noteInput.value.length}/${NOTE_MAX}`;
});
noteInput.addEventListener('blur', () => {
  const note = noteInput.value.trim();
  if (note !== ((state.days[ui.day] || {}).note || '')) setDayEntry(ui.day, { note });
});

// ---------- Resumen de la semana ----------

const fmtDayMonth = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });

// "Del 14 al 20 de septiembre" o "Del 28 de septiembre al 4 de octubre"
function weekRange(ws) {
  const a = parseKey(ws);
  const b = parseKey(shiftKey(ws, 6));
  if (a.getMonth() === b.getMonth()) return `Del ${a.getDate()} al ${fmtDayMonth.format(b)}`;
  return `Del ${fmtDayMonth.format(a)} al ${fmtDayMonth.format(b)}`;
}

// ¿Había hábitos desde el lunes de esa semana (una semana entera de historial)?
const hasWeekHistory = (ws) => state.habits.some((h) => habitStart(h) <= ws);

// Cumplimiento de una semana: hechos / los que tocaban (en los semanales, hasta sus veces).
function weekSummary(ws) {
  return cachedGlobal(`summary:${ws}`, () => {
    const days = weekKeys(ws);
    let due = 0;
    let done = 0;
    let xp = 0;
    const rows = [];
    for (const h of state.habits) {
      const s = streakInfo(h);
      days.forEach((d) => { xp += s.xpOn[d] || 0; });
      let hDue = 0;
      let hDone = 0;
      if (h.schedule.type === 'weekly') {
        // Igual que en la racha: una semana con días en pausa (o antes de crearlo) solo cuenta si se cumplió.
        const count = countDays(days, (d) => isDone(h, d));
        const blocked = days.some((d) => !isActive(h, d));
        if (days.some((d) => isActive(h, d)) && (!blocked || count >= h.schedule.times)) {
          hDue = h.schedule.times;
          hDone = Math.min(hDue, count);
        }
      } else {
        days.forEach((d) => {
          if (!isDue(h, d)) return;
          hDue++;
          if (isDone(h, d)) hDone++;
        });
      }
      due += hDue;
      done += hDone;
      if (hDue) rows.push({ habit: h, pct: hDone / hDue, done: hDone });
    }
    const w = weekData(ws);
    xp += w.perfectCount * XP_PERFECT_DAY;
    const withChallenges = Boolean(state.challengesSince) && ws >= state.challengesSince;
    const challenges = withChallenges ? weekChallenges(ws) : [];
    const won = challenges.filter((c) => c.done);
    xp += won.reduce((n, c) => n + c.reward, 0);
    const moods = days.map((d) => (state.days[d] || {}).mood).filter(Boolean);
    const sorted = [...rows].sort((a, b) => b.pct - a.pct || b.done - a.done);
    const best = sorted[0] || null;
    const hardest = sorted.length > 1 && sorted.at(-1).pct < 1 ? sorted.at(-1) : null;
    return {
      pct: due ? done / due : null,
      due,
      done,
      xp,
      perfect: w.perfectCount,
      challenges: withChallenges ? `${won.length}/${challenges.length}` : '—',
      best,
      hardest: hardest && hardest !== best ? hardest : null,
      mood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    };
  });
}

const summaryDialog = $('#summary');

function showSummary(ws) {
  const sum = weekSummary(ws);
  const prev = hasWeekHistory(shiftKey(ws, -7)) ? weekSummary(shiftKey(ws, -7)) : null;
  const pct = sum.pct === null ? null : Math.round(sum.pct * 100);
  let delta = '';
  if (pct !== null && prev && prev.pct !== null) {
    const diff = pct - Math.round(prev.pct * 100);
    delta = diff > 0 ? `<span class="delta up">↑ ${plural(diff, 'punto', 'puntos')} más que la semana anterior</span>`
      : diff < 0 ? `<span class="delta down">↓ ${plural(-diff, 'punto', 'puntos')} menos que la semana anterior</span>`
      : '<span class="delta">= Igual que la semana anterior</span>';
  }
  const habitLine = (row) => `${escapeHTML(row.habit.emoji)} ${escapeHTML(row.habit.name)} · ${Math.round(row.pct * 100)} %`;
  const items = [
    sum.best ? `<li><span aria-hidden="true">🏅</span><span><b>Tu mejor hábito</b>${habitLine(sum.best)}</span></li>` : '',
    sum.hardest ? `<li><span aria-hidden="true">🧗</span><span><b>El que más te cuesta</b>${habitLine(sum.hardest)}</span></li>` : '',
    sum.mood ? `<li><span aria-hidden="true">${MOODS[Math.round(sum.mood) - 1]}</span><span><b>Ánimo medio</b>${sum.mood.toFixed(1).replace('.', ',')} de 5</span></li>` : '',
  ].join('');
  $('#summary-title').textContent = weekRange(ws);
  $('#summary-body').innerHTML = `
    <div class="summary-hero">
      <div class="summary-ring" style="--p:${sum.pct || 0}"><b>${pct === null ? '—' : `${pct} %`}</b></div>
      <p class="summary-sub">${pct === null ? 'Esa semana no tocaba ningún hábito' : `de lo que tocaba (${sum.done} de ${sum.due})`}</p>
      ${delta}
    </div>
    <div class="stats">
      <div class="stat"><b>${sum.perfect}</b><span>Días perfectos</span></div>
      <div class="stat"><b>+${fmtNumber.format(sum.xp)}</b><span>XP ganada</span></div>
      <div class="stat"><b>${sum.challenges}</b><span>Retos</span></div>
    </div>
    ${items ? `<ul class="summary-list">${items}</ul>` : ''}`;
  if (!summaryDialog.open) summaryDialog.showModal();
}

// La primera vez que se abre la app en una semana nueva, enseña cómo fue la anterior.
function maybeShowSummary() {
  const thisWeek = weekStartOf(ui.today);
  if (state.lastSummary && state.lastSummary >= thisWeek) return;
  const prev = shiftKey(thisWeek, -7);
  if (!hasWeekHistory(prev)) return;
  state.lastSummary = thisWeek;
  save();
  showSummary(prev);
}

$('#summary-close').addEventListener('click', () => summaryDialog.close());
summaryDialog.addEventListener('click', (e) => {
  if (e.target === summaryDialog) summaryDialog.close();
});

// ---------- Recordatorios (archivo .ics para el calendario) ----------

const ICS_DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const icsText = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const utf8Bytes = (s) => new TextEncoder().encode(s).length;

// El formato pide líneas de 75 bytes como mucho; las siguientes empiezan con un espacio.
function foldLine(line) {
  const parts = [];
  let current = '';
  for (const ch of Array.from(line)) {
    const limit = parts.length ? 74 : 75;
    if (utf8Bytes(current + ch) > limit) {
      parts.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
}

// Evento que se repite según la frecuencia, a la hora local elegida, con aviso a esa misma hora.
function buildICS({ id, name, emoji, schedule, time }) {
  const [hh, mm] = time.split(':').map(Number);
  let first = ui.today;
  if (schedule.type === 'days') while (!schedule.days.includes(weekdayOf(first))) first = shiftKey(first, 1);
  const start = parseKey(first);
  start.setHours(hh, mm, 0, 0);
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  // Hora local "flotante" (sin zona): el calendario la pone a esa hora esté donde esté.
  const local = (d) => `${dateKey(d).replace(/-/g, '')}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const rule = schedule.type === 'daily' ? 'FREQ=DAILY'
    : schedule.type === 'days' ? `FREQ=WEEKLY;BYDAY=${schedule.days.map((d) => ICS_DAYS[d]).join(',')}`
    : `FREQ=WEEKLY;BYDAY=${ICS_DAYS[weekdayOf(first)]}`;
  const title = `${emoji} ${name}`;
  const about = schedule.type === 'weekly'
    ? `Esta semana toca «${name}» ${plural(schedule.times, 'vez', 'veces')}. Márcalo en Racha.`
    : `Es hora de «${name}». Márcalo en Racha.`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Racha//Recordatorios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${id}-${Date.now()}@racha`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    `RRULE:${rule}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(about)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'habito';

// Descarga un archivo (cuando no se puede compartir).
function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// En el móvil se abre el menú Compartir; si no se puede, se descarga el archivo.
async function shareOrDownload(file, title) {
  const isTouch = matchMedia('(pointer: coarse)').matches;
  if (isTouch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
    }
  }
  downloadFile(file);
  return 'downloaded';
}

$('#reminder-btn').addEventListener('click', async () => {
  const habit = ui.editingId && findHabit(ui.editingId);
  const name = nameInput.value.trim();
  if (!name) {
    toast('Escribe primero el nombre del hábito');
    nameInput.focus();
    return;
  }
  const quit = (habit ? habit.kind : ui.sheetKind) === 'quit';
  const ics = buildICS({
    id: habit ? habit.id : 'nuevo',
    name,
    emoji: lastGrapheme(emojiInput.value) || '⭐',
    schedule: quit ? { type: 'daily' } : sheetScheduleValue(),
    time: $('#reminder-time').value || '09:00',
  });
  const file = new File([ics], `racha-${slugify(name)}.ics`, { type: 'text/calendar' });
  haptic();
  const result = await shareOrDownload(file, `Recordatorio: ${name}`);
  if (result === 'downloaded') toast('📅 Abre el archivo descargado para añadirlo a tu calendario');
  else if (result === 'shared') toast('📅 Elige Calendario para guardar el recordatorio');
});

// ---------- Navegación ----------

function render() {
  if (ui.view === 'today') renderToday();
  else if (ui.view === 'progress') renderProgress();
  else if (ui.view === 'history') renderHistory();
  else renderSettings();
}

function showView(view) {
  // Tocar "Hoy" estando ya en "Hoy" vuelve al día de hoy.
  if (view === 'today' && ui.view === 'today') ui.day = ui.today;
  ui.view = view;
  ui.editing = false;
  ['today', 'progress', 'history', 'settings'].forEach((v) => { $(`#view-${v}`).hidden = v !== view; });
  document.querySelectorAll('.tab').forEach((tab) => {
    if (tab.dataset.view === view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  render();
  window.scrollTo(0, 0);
}

// Si la app se queda abierta (o en segundo plano) y cambia el día, actualizamos.
function checkDateChange() {
  const now = todayKey();
  if (now === ui.today) return;
  if (ui.day === ui.today) ui.day = now;
  ui.today = now;
  useShields();
  render();
  maybeShowSummary();
}

// ---------- Hoja de crear / editar ----------

const sheet = $('#sheet');
const form = $('#habit-form');
const nameInput = $('#habit-name');
const emojiInput = $('#habit-emoji');
const saveBtn = $('#save-btn');

// Separa el texto en "caracteres visibles" para que emojis compuestos (👍🏽, 🧘‍♀️) cuenten como uno.
const segmenter = 'Segmenter' in Intl ? new Intl.Segmenter('es', { granularity: 'grapheme' }) : null;
const graphemes = (s) => (segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s));
const lastGrapheme = (s) => graphemes(s.trim()).pop() || '';

$('#emoji-grid').innerHTML = SUGGESTED_EMOJIS
  .map((e) => `<button type="button" data-emoji="${e}" aria-label="${e}">${e}</button>`)
  .join('');

function syncEmojiGrid() {
  document.querySelectorAll('#emoji-grid button').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.emoji === emojiInput.value));
  });
}

function updateSaveButton() {
  const s = ui.sheetSchedule;
  saveBtn.disabled = nameInput.value.trim() === '' || Boolean(s && s.type === 'days' && !s.days.length);
}

// ---------- Frecuencia (en la hoja) ----------

$('#freq-days').innerHTML = WEEKDAYS.map((d, i) => (
  `<button type="button" data-day="${i}" aria-label="${WEEKDAY_NAMES[i]}">${d}</button>`
)).join('');

// Lo que se elige en la hoja; se recuerdan los días y las veces aunque cambies de tipo.
function setSheetSchedule(schedule) {
  ui.sheetSchedule = {
    type: schedule.type,
    days: schedule.type === 'days' ? [...schedule.days] : [0, 1, 2, 3, 4],
    times: schedule.type === 'weekly' ? schedule.times : 3,
  };
  syncFrequency();
}

function sheetScheduleValue() {
  const s = ui.sheetSchedule;
  if (s.type === 'days') return normalizeSchedule({ type: 'days', days: s.days });
  if (s.type === 'weekly') return { type: 'weekly', times: s.times };
  return { type: 'daily' };
}

function syncFrequency() {
  const s = ui.sheetSchedule;
  document.querySelectorAll('#freq-type [data-freq]').forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.freq === s.type));
  });
  $('#freq-days').hidden = s.type !== 'days';
  $('#freq-times').hidden = s.type !== 'weekly';
  document.querySelectorAll('#freq-days [data-day]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(s.days.includes(Number(btn.dataset.day))));
  });
  $('#freq-times-value').textContent = s.times;
  $('#freq-times [data-step="-1"]').disabled = s.times <= 1;
  $('#freq-times [data-step="1"]').disabled = s.times >= 6;

  let hint = {
    daily: 'Cuenta todos los días.',
    days: s.days.length ? 'Solo cuentan los días elegidos. Los demás son de descanso y no rompen la racha.' : 'Elige al menos un día.',
    weekly: 'Vale cualquier día de la semana. La racha se cuenta en semanas cumplidas.',
  }[s.type];
  const habit = ui.editingId && findHabit(ui.editingId);
  if (habit && JSON.stringify(sheetScheduleValue()) !== JSON.stringify(habit.schedule)) {
    hint += ' Tu racha y tu XP se recalcularán con la nueva frecuencia.';
  }
  $('#freq-hint').textContent = hint;
  updateSaveButton();
}

$('#freq-type').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-freq]');
  if (!btn) return;
  ui.sheetSchedule.type = btn.dataset.freq;
  syncFrequency();
  haptic();
});

$('#freq-days').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-day]');
  if (!btn) return;
  const day = Number(btn.dataset.day);
  const { days } = ui.sheetSchedule;
  ui.sheetSchedule.days = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b);
  syncFrequency();
  haptic();
});

$('#freq-times').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-step]');
  if (!btn) return;
  ui.sheetSchedule.times = Math.min(6, Math.max(1, ui.sheetSchedule.times + Number(btn.dataset.step)));
  syncFrequency();
  haptic();
});

// ---------- Pausa (en la hoja, solo al editar) ----------

function pauseText(p) {
  const tomorrow = shiftKey(ui.today, 1);
  const from = p.from === ui.today ? 'desde hoy' : p.from === tomorrow ? 'desde mañana' : `desde el ${shortDate(p.from)}`;
  const to = p.to ? `hasta el ${shortDate(p.to)}` : 'sin fecha de fin';
  return `⏸️ En pausa ${from}, ${to}.`;
}

function syncPauseBox(habit) {
  const current = habit.pauses.find((p) => !p.to || p.to >= ui.today);
  $('#pause-off').hidden = Boolean(current);
  $('#pause-on').hidden = !current;
  if (current) $('#pause-status').textContent = pauseText(current);
  $('#pause-until').value = '';
  $('#pause-until').min = firstFreeDay(habit);
}

$('#pause-btn').addEventListener('click', () => {
  const habit = findHabit(ui.editingId);
  if (!habit) return;
  const from = firstFreeDay(habit);
  const until = $('#pause-until').value || null;
  if (until && until < from) {
    toast(from === ui.today ? 'Elige hoy o una fecha posterior' : 'Hoy ya está hecho: elige una fecha a partir de mañana');
    return;
  }
  const snapshot = JSON.stringify(state);
  habit.pauses.push({ from, to: until });
  save();
  closeSheet();
  render();
  haptic();
  toast(until ? `⏸️ En pausa hasta el ${shortDate(until)}` : '⏸️ En pausa', { action: 'Deshacer', onAction: undoTo(snapshot) });
});

$('#resume-btn').addEventListener('click', () => {
  const habit = findHabit(ui.editingId);
  if (!habit) return;
  resumeHabit(habit);
  save();
  closeSheet();
  render();
  haptic();
  toast(`▶️ «${habit.name}» reanudado`);
});

$('#archive-btn').addEventListener('click', () => {
  const habit = findHabit(ui.editingId);
  if (!habit) return;
  closeSheet();
  archiveHabit(habit);
});

$('#color-row').innerHTML = COLORS.map((c) => (
  `<button type="button" class="color-swatch" role="radio" data-color="${c.id}" aria-label="${c.name}" style="--sw:${c.hex}"></button>`
)).join('');

// Marca el color elegido y tiñe el emoji grande con él.
function setSheetColor(id) {
  ui.sheetColor = id;
  document.querySelectorAll('#color-row .color-swatch').forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.color === id));
  });
  emojiInput.style.setProperty('--c', colorHex(id));
}

$('#color-row').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-color]');
  if (!btn) return;
  setSheetColor(btn.dataset.color);
  haptic();
});

// ---------- Tipo y meta (en la hoja) ----------

const goalInput = $('#goal-value');
const unitInput = $('#habit-unit');

// Empezar a hacer algo o dejarlo. Los de dejar son diarios y sin cantidad, así que se ocultan esas secciones.
function setSheetKind(kind) {
  ui.sheetKind = kind;
  const quit = kind === 'quit';
  document.querySelectorAll('#kind-type [data-kind]').forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.kind === kind));
  });
  $('#freq-block').hidden = quit;
  $('#goal-block').hidden = quit;
  $('#kind-hint').hidden = !quit;
  $('#kind-hint').textContent = 'Cada día sin recaer cuenta como hecho (y da XP). Si un día recaes, toca la tarjeta para apuntarlo.';
  nameInput.placeholder = quit ? 'Ej. Dejar de fumar' : 'Ej. Beber 2 litros de agua';
}

function setSheetGoal(goal, unit) {
  goalInput.value = goal;
  unitInput.value = unit;
  syncGoal();
}

function syncGoal() {
  const goal = clampGoal(goalInput.value);
  $('#unit-field').hidden = goal <= 1;
  $('#goal-label').textContent = goal <= 1 ? 'vez al día' : 'al día';
  $('#goal-stepper [data-step="-1"]').disabled = goal <= 1;
  $('#goal-stepper [data-step="1"]').disabled = goal >= 99;
  let hint = goal <= 1
    ? 'Un toque y listo.'
    : 'Cada toque suma 1 y, si mantienes pulsado, resta 1. Cuenta como hecho (y da XP) al llegar a la meta.';
  const habit = ui.editingId && findHabit(ui.editingId);
  if (habit && goal !== habit.goal) hint += ' Los días pasados se recalcularán con la nueva meta.';
  $('#goal-hint').textContent = hint;
}

$('#kind-type').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-kind]');
  if (!btn) return;
  setSheetKind(btn.dataset.kind);
  // Si aún no has elegido emoji, ponemos uno que encaje con el tipo.
  if (!ui.emojiTouched) {
    emojiInput.value = btn.dataset.kind === 'quit' ? '🚭' : ui.defaultEmoji;
    syncEmojiGrid();
  }
  haptic();
});

$('#goal-stepper').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-step]');
  if (!btn) return;
  goalInput.value = clampGoal(clampGoal(goalInput.value) + Number(btn.dataset.step));
  syncGoal();
  haptic();
});
goalInput.addEventListener('input', syncGoal);
goalInput.addEventListener('change', () => { goalInput.value = clampGoal(goalInput.value); syncGoal(); });

function renderIdeas() {
  const used = new Set(state.habits.map((h) => h.name.toLowerCase()));
  const ideas = TEMPLATES.filter((t) => !used.has(t.name.toLowerCase()));
  $('#ideas').hidden = ui.editingId !== null || ideas.length === 0;
  $('#ideas-row').innerHTML = ideas.map((t) => (
    `<button type="button" class="idea" data-template="${TEMPLATES.indexOf(t)}">${t.emoji} ${escapeHTML(t.name)}</button>`
  )).join('');
}

function openSheet(id = null) {
  const habit = id ? findHabit(id) : null;
  ui.editingId = habit ? habit.id : null;

  $('#sheet-title').textContent = habit ? 'Editar hábito' : 'Nuevo hábito';
  nameInput.value = habit ? habit.name : '';
  ui.defaultEmoji = SUGGESTED_EMOJIS.find((e) => !state.habits.some((h) => h.emoji === e)) || '⭐';
  ui.emojiTouched = Boolean(habit);
  emojiInput.value = habit ? habit.emoji : ui.defaultEmoji;
  $('#delete-block').hidden = !habit;
  if (habit) syncPauseBox(habit);
  // El tipo solo se elige al crear el hábito.
  $('#kind-block').hidden = Boolean(habit);
  setSheetKind(habit ? habit.kind : 'build');
  setSheetGoal(habit ? habit.goal : 1, habit ? habit.unit : '');
  setSheetColor(habit ? habit.color : nextColor(state.habits));
  setSheetSchedule(habit ? habit.schedule : { type: 'daily' });
  renderIdeas();
  syncEmojiGrid();
  updateSaveButton();

  document.documentElement.classList.add('locked');
  sheet.showModal();
  $('.sheet-body').scrollTop = 0;
}

function closeSheet() {
  sheet.close();
}

sheet.addEventListener('close', () => {
  document.documentElement.classList.remove('locked');
  nameInput.blur();
  emojiInput.blur();
});

// Tocar fuera de la hoja (en la zona oscura) la cierra.
sheet.addEventListener('click', (e) => {
  if (e.target === sheet) closeSheet();
});

sheet.querySelector('[data-close]').addEventListener('click', closeSheet);

nameInput.addEventListener('input', updateSaveButton);

// Nos quedamos solo con el último emoji escrito, así escribir uno nuevo reemplaza al anterior.
emojiInput.addEventListener('input', () => {
  ui.emojiTouched = true;
  emojiInput.value = lastGrapheme(emojiInput.value);
  syncEmojiGrid();
});
emojiInput.addEventListener('focus', () => emojiInput.select());

$('#emoji-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-emoji]');
  if (!btn) return;
  ui.emojiTouched = true;
  emojiInput.value = btn.dataset.emoji;
  syncEmojiGrid();
});

$('#ideas-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.idea');
  if (!btn) return;
  const t = templateFields(TEMPLATES[Number(btn.dataset.template)]);
  nameInput.value = t.name;
  emojiInput.value = t.emoji;
  ui.emojiTouched = true;
  setSheetKind(t.kind);
  setSheetGoal(t.goal, t.unit);
  setSheetSchedule(t.schedule);
  syncEmojiGrid();
  updateSaveButton();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  const emoji = lastGrapheme(emojiInput.value) || '⭐';

  const habit = ui.editingId && findHabit(ui.editingId);
  const kind = habit ? habit.kind : ui.sheetKind;
  const quit = kind === 'quit';
  const goal = quit ? 1 : clampGoal(goalInput.value);
  const fields = {
    name,
    emoji,
    color: ui.sheetColor,
    // Cambiar la frecuencia o la meta recalcula todo (también los días pasados) con lo nuevo.
    schedule: quit ? { type: 'daily' } : sheetScheduleValue(),
    goal,
    unit: goal > 1 ? unitInput.value.trim().slice(0, 20) : '',
  };
  if (habit) Object.assign(habit, fields);
  else state.habits.push(newHabit({ ...fields, kind }));
  save();
  closeSheet();
  render();
  if (!habit) toast(`${emoji} «${name}» añadido`);
});

// Borrar es inmediato, pero se puede deshacer desde el aviso.
$('#delete-btn').addEventListener('click', () => {
  const habit = findHabit(ui.editingId);
  if (!habit) return;
  closeSheet();
  deleteHabit(habit);
});

// ---------- Reordenar arrastrando (modo edición) ----------

$('#habit-list').addEventListener('pointerdown', (e) => {
  const grip = e.target.closest('.grip');
  if (!grip || !ui.editing) return;
  e.preventDefault();

  const rows = [...$('#habit-list').children];
  const row = grip.closest('li');
  const from = rows.indexOf(row);
  const rects = rows.map((r) => r.getBoundingClientRect());
  const step = rows.length > 1 ? rects[1].top - rects[0].top : 0;
  const startY = e.clientY;
  let to = from;

  row.classList.add('dragging');
  grip.setPointerCapture(e.pointerId);
  haptic();

  const move = (ev) => {
    const dy = ev.clientY - startY;
    row.style.transform = `translateY(${dy}px)`;
    const center = rects[from].top + rects[from].height / 2 + dy;
    to = rects.filter((r, i) => i !== from && center > r.top + r.height / 2).length;
    rows.forEach((r, i) => {
      if (i === from) return;
      let shift = 0;
      if (from < to && i > from && i <= to) shift = -step;
      if (from > to && i < from && i >= to) shift = step;
      r.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  };

  const end = () => {
    grip.removeEventListener('pointermove', move);
    grip.removeEventListener('pointerup', end);
    grip.removeEventListener('pointercancel', end);
    if (to !== from) {
      // La lista solo muestra los visibles: los archivados se quedan al final.
      const visible = visibleHabits();
      const [moved] = visible.splice(from, 1);
      visible.splice(to, 0, moved);
      state.habits = [...visible, ...state.habits.filter((h) => h.archived)];
      save();
      haptic();
    }
    renderToday();
  };

  grip.addEventListener('pointermove', move);
  grip.addEventListener('pointerup', end);
  grip.addEventListener('pointercancel', end);
});

// ---------- Celebraciones ----------

const levelupDialog = $('#levelup');

function showLevelUp(stats, achievements) {
  const meta = levelInfo(stats.level);
  $('#levelup-emoji').textContent = meta.emoji;
  $('#levelup-title').textContent = `Nivel ${stats.level}`;
  $('#levelup-sub').innerHTML = `Nuevo título: <b>${escapeHTML(meta.title)}</b>`;
  $('#levelup-achievements').innerHTML = achievements.map((a) => (
    `<li><span aria-hidden="true">${a.emoji}</span><span><b>Logro: ${a.name}</b><br>${a.desc}</span></li>`
  )).join('');
  levelupDialog.showModal();
  confetti(levelupDialog, 160);
  haptic();
}

$('#levelup-close').addEventListener('click', () => levelupDialog.close());
levelupDialog.addEventListener('click', (e) => {
  if (e.target === levelupDialog) levelupDialog.close();
});

// "+12 XP" que sube y se desvanece sobre el hábito tocado.
function floatXp(anchor, amount, text) {
  if (!anchor || !amount) return;
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('span');
  el.className = amount > 0 ? 'xp-float' : 'xp-float minus';
  if (text) el.classList.add('step'); // "+1" de cantidad, sin XP
  el.textContent = text || `${amount > 0 ? '+' : '−'}${Math.abs(amount)} XP`;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top - 10}px`;
  document.body.appendChild(el);
  const remove = () => el.remove();
  el.addEventListener('animationend', remove);
  setTimeout(remove, 1500);
}

// Confeti ligero dibujado en un <canvas>.
function confetti(container = document.body, amount = 120) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  container.appendChild(canvas);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Pétalos de cerezo, hojas de salvia y motas doradas que caen despacio, meciéndose.
  const colors = ['#F2C4CB', '#E8A5B0', '#CF8591', '#B7CDB5', '#8FB39A', '#E3CE9A'];
  const pieces = Array.from({ length: amount }, (_, i) => ({
    x: Math.random() * w,
    y: -Math.random() * h * 0.5,
    vy: 1.2 + Math.random() * 1.8,
    sway: 0.6 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
    size: 7 + Math.random() * 7,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.06,
    color: colors[i % colors.length],
  }));

  const duration = 3400;
  const start = performance.now();
  const frame = (now) => {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    // Se ven enteros casi todo el rato y se desvanecen al final.
    ctx.globalAlpha = Math.min(1, Math.max(0, (duration - t) / (duration * 0.3)));
    for (const p of pieces) {
      p.y += p.vy;
      p.x += Math.sin(t / 500 + p.phase) * p.sway;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size / 2, p.size / 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (t < duration) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

// Vibración suave. En iPhone (iOS 18+) se consigue pulsando un interruptor oculto.
function haptic() {
  if (navigator.vibrate) {
    navigator.vibrate(12);
    return;
  }
  try {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.setAttribute('aria-hidden', 'true');
    label.style.display = 'none';
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    label.remove();
  } catch (err) {
    // Sin vibración, no pasa nada.
  }
}

// ---------- Copia de seguridad ----------

async function exportData() {
  const payload = { app: 'racha', version: 1, exportedAt: new Date().toISOString(), data: state };
  const fileName = `racha-copia-${ui.today}.json`;
  const file = new File([JSON.stringify(payload, null, 2)], fileName, { type: 'application/json' });

  const markDone = () => {
    state.lastBackup = ui.today;
    save();
    render();
    toast('✅ Copia guardada');
  };

  // En el móvil se abre el menú Compartir ("Guardar en Archivos", AirDrop…); si no, se descarga.
  const result = await shareOrDownload(file, 'Copia de Racha');
  if (result !== 'cancelled') markDone();
}

$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  let data;
  try {
    const parsed = JSON.parse(await file.text());
    data = normalize(parsed && parsed.data ? parsed.data : parsed);
  } catch (err) {
    data = null;
  }
  if (!data) {
    toast('Ese archivo no es una copia de Racha');
    return;
  }
  const ok = await askConfirm({
    emoji: '📥',
    title: '¿Importar esta copia?',
    body: `<p>Tus datos actuales se reemplazarán por los de la copia (${
      plural(data.habits.length, 'hábito', 'hábitos')}${data.profile.name ? `, perfil de ${escapeHTML(data.profile.name)}` : ''}).</p>`,
    confirmText: 'Importar',
  });
  if (!ok) return;
  // La fecha de la última copia es de este móvil: nos quedamos con la más reciente.
  data.lastBackup = [data.lastBackup, state.lastBackup].filter(Boolean).sort().pop() || null;
  replaceState(data);
  toast('✅ Copia restaurada');
});

// ---------- Aviso flotante ----------

let toastTimer;
let toastAction = null;

function toast(message, { action, onAction } = {}) {
  const el = $('#toast');
  const btn = $('#toast-action');
  $('#toast-text').textContent = message;
  btn.hidden = !action;
  btn.textContent = action || '';
  toastAction = onAction || null;
  el.classList.toggle('has-action', Boolean(action));
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 6000 : 2600);
}

function hideToast() {
  $('#toast').classList.remove('show');
  toastAction = null;
}

$('#toast-action').addEventListener('click', () => {
  const fn = toastAction;
  hideToast();
  if (fn) fn();
});

// ---------- Eventos ----------

// Tras mantener pulsado no queremos que el "clic" del final sume otra vez.
let pressTimer = null;
let skipClick = false;

$('#habit-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.habit');
  if (!btn) return;
  if (skipClick) {
    skipClick = false;
    return;
  }
  if (ui.editing) openSheet(btn.dataset.id);
  else toggleHabit(btn.dataset.id, btn);
});

// Mantener pulsado ~500 ms resta 1 en los hábitos con cantidad.
$('#habit-list').addEventListener('pointerdown', (e) => {
  skipClick = false;
  const btn = e.target.closest('.habit');
  if (!btn || ui.editing) return;
  const habit = findHabit(btn.dataset.id);
  if (!habit || habit.kind === 'quit' || habit.goal <= 1) return;
  const { clientX: x, clientY: y } = e;
  const cancel = () => {
    clearTimeout(pressTimer);
    pressTimer = null;
    btn.removeEventListener('pointerup', cancel);
    btn.removeEventListener('pointercancel', cancel);
    btn.removeEventListener('pointerleave', cancel);
    btn.removeEventListener('pointermove', onMove);
  };
  const onMove = (ev) => {
    if (Math.abs(ev.clientX - x) > 10 || Math.abs(ev.clientY - y) > 10) cancel();
  };
  clearTimeout(pressTimer);
  pressTimer = setTimeout(() => {
    cancel();
    skipClick = true;
    stepDown(habit, btn);
  }, LONG_PRESS_MS);
  btn.addEventListener('pointerup', cancel);
  btn.addEventListener('pointercancel', cancel);
  btn.addEventListener('pointerleave', cancel);
  btn.addEventListener('pointermove', onMove);
});

// Sin menú contextual al mantener pulsado (Android) y con teclado: "−" o Retroceso restan 1.
$('#habit-list').addEventListener('contextmenu', (e) => {
  if (e.target.closest('.habit.qty')) e.preventDefault();
});
$('#habit-list').addEventListener('keydown', (e) => {
  const btn = e.target.closest('.habit');
  if (!btn || ui.editing || !['-', 'Backspace', 'Delete'].includes(e.key)) return;
  const habit = findHabit(btn.dataset.id);
  if (!habit || habit.goal <= 1) return;
  e.preventDefault();
  stepDown(habit, btn);
});

$('#add-btn').addEventListener('click', () => openSheet());

// Botones repartidos por la app con data-*.
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-add], [data-export], [data-import], [data-goto-view], [data-summary]');
  if (!target) return;
  if (target.hasAttribute('data-summary')) showSummary(shiftKey(weekStartOf(ui.today), -7));
  else if (target.hasAttribute('data-add')) openSheet();
  else if (target.hasAttribute('data-export')) exportData();
  else if (target.hasAttribute('data-import')) $('#import-file').click();
  else showView(target.dataset.gotoView);
});

$('#edit-toggle').addEventListener('click', () => {
  ui.editing = !ui.editing;
  renderToday();
});

$('#prev-day').addEventListener('click', () => {
  ui.day = shiftKey(ui.day, -1);
  renderToday();
});

$('#next-day').addEventListener('click', () => {
  if (ui.day < ui.today) ui.day = shiftKey(ui.day, 1);
  renderToday();
});

$('#back-today').addEventListener('click', () => {
  ui.day = ui.today;
  renderToday();
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => showView(tab.dataset.view));
});

$('#history').addEventListener('click', (e) => {
  const edit = e.target.closest('[data-edit]');
  if (edit) {
    openSheet(edit.dataset.edit);
    return;
  }
  const goto = e.target.closest('[data-goto]');
  if (goto) {
    ui.day = goto.dataset.goto;
    showView('today');
    return;
  }
  const cell = e.target.closest('.hm-grid i[data-k]');
  if (!cell) return;
  const map = cell.closest('.heatmap');
  const foot = map.nextElementSibling;
  const selected = map.querySelector('.sel');
  if (selected) selected.classList.remove('sel');
  cell.classList.add('sel');
  foot.querySelector('.hm-caption').textContent = dayCaption(map.dataset.habit, cell.dataset.k);
  const noteEl = foot.nextElementSibling;
  if (noteEl && noteEl.classList.contains('hm-note')) {
    const note = (state.days[cell.dataset.k] || {}).note;
    noteEl.hidden = !note;
    noteEl.textContent = note ? `📝 ${note}` : '';
  }
  const gotoBtn = foot.querySelector('[data-goto]');
  gotoBtn.dataset.goto = cell.dataset.k;
  gotoBtn.hidden = false;
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkDateChange();
});
setInterval(checkDateChange, 60 * 1000);

// ---------- Arranque ----------

// La primera vez que se abre esta versión, los retos empiezan a contar desde esta semana.
if (!state.challengesSince) {
  state.challengesSince = weekStartOf(ui.today);
  save();
}
useShields();
render();
maybeShowSummary();

// Pide al navegador que no borre nuestros datos si le falta espacio.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// Service worker: permite abrir la app sin conexión.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker no registrado', err));
}
