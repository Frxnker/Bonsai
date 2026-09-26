'use strict';

const APP_VERSION = '0.5 beta';
const STORAGE_KEY = 'racha:v1';
const HEATMAP_WEEKS = 53; // un año

// ---------- Progresión: XP, niveles y logros ----------

const XP_PER_CHECK = 10;   // cada hábito hecho
const XP_STREAK_CAP = 10;  // bonus de racha: +1 por día seguido, hasta +10
const XP_PERFECT_DAY = 25; // todos los hábitos del día hechos
const MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];

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
];

const TEMPLATES = [
  { emoji: '💧', name: 'Beber agua' },
  { emoji: '🚶', name: 'Caminar 30 min' },
  { emoji: '📚', name: 'Leer 10 páginas' },
  { emoji: '🧘', name: 'Meditar' },
  { emoji: '😴', name: 'Dormir 8 horas' },
  { emoji: '💪', name: 'Hacer ejercicio' },
  { emoji: '🍎', name: 'Comer fruta' },
  { emoji: '📵', name: 'Menos móvil' },
  { emoji: '✍️', name: 'Escribir diario' },
  { emoji: '🦷', name: 'Hilo dental' },
];

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

const fmtLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtWeekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
const fmtMonth = new Intl.DateTimeFormat('es-ES', { month: 'short' });
const fmtCaption = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtCaptionYear = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
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

// "bank" guarda la XP y récords de hábitos borrados, para no perder progreso al borrar.
const emptyState = () => ({
  profile: { name: '', avatar: DEFAULT_AVATAR, since: todayKey() },
  habits: [],
  bank: { xp: 0, checkins: 0, best: 0 },
  lastBackup: null,
});

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
      created: isDateKey(h.created) ? h.created : todayKey(),
      done: Object.fromEntries(Object.keys(h.done || {}).filter(isDateKey).map((k) => [k, 1])),
    }));
  const bank = data.bank || {};
  clean.bank = {
    xp: Math.max(0, Number(bank.xp) || 0),
    checkins: Math.max(0, Number(bank.checkins) || 0),
    best: Math.max(0, Number(bank.best) || 0),
  };
  clean.lastBackup = isDateKey(data.lastBackup) ? data.lastBackup : null;

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
  save();
  render();
}

const findHabit = (id) => state.habits.find((h) => h.id === id);

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

// La racha sigue viva hasta el final de hoy: si hoy aún no está hecho, se cuenta desde ayer.
function currentStreak(habit) {
  let day = habit.done[ui.today] ? ui.today : shiftKey(ui.today, -1);
  let n = 0;
  while (habit.done[day]) {
    n++;
    day = shiftKey(day, -1);
  }
  return n;
}

// Recorre el historial de un hábito: XP ganada, mejor racha y total de días.
function habitProgress(habit) {
  const days = Object.keys(habit.done).sort();
  let xp = 0;
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of days) {
    run = prev && shiftKey(prev, 1) === day ? run + 1 : 1;
    xp += XP_PER_CHECK + Math.min(run - 1, XP_STREAK_CAP);
    best = Math.max(best, run);
    prev = day;
  }
  return { xp, best, checkins: days.length };
}

// Hábitos que "existían" ese día (creados antes, o marcados ese día).
function dayTotals(key) {
  const active = state.habits.filter((h) => h.created <= key || h.done[key]);
  return { total: active.length, done: active.filter((h) => h.done[key]).length };
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
  let { xp, checkins, best } = state.bank;
  const days = new Set();
  for (const habit of state.habits) {
    const p = habitProgress(habit);
    xp += p.xp;
    checkins += p.checkins;
    best = Math.max(best, p.best);
    Object.keys(habit.done).forEach((d) => days.add(d));
  }
  let perfectDays = 0;
  days.forEach((d) => { if (isPerfectDay(d)) perfectDays++; });
  xp += perfectDays * XP_PERFECT_DAY;

  const level = levelForXp(xp);
  return {
    xp, checkins, best, perfectDays, level,
    levelStart: xpForLevel(level),
    levelEnd: xpForLevel(level + 1),
  };
}

const isUnlocked = (achievement, stats) => stats[achievement.stat] >= achievement.goal;

// ---------- Pantalla "Hoy" ----------

function renderToday() {
  const stats = computeStats();
  const { day, today } = ui;
  const isToday = day === today;
  const habits = state.habits;
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

  const doneCount = habits.filter((h) => h.done[day]).length;
  const allDone = hasHabits && doneCount === habits.length;
  $('#day-ring').style.setProperty('--p', hasHabits ? doneCount / habits.length : 0);
  $('#progress-count').textContent = `${doneCount}/${habits.length}`;
  $('#day-ring-label').textContent = allDone ? '¡hecho!' : isToday ? 'hoy' : 'ese día';
  $('#progress-text').textContent = isToday ? 'Tus hábitos de hoy' : 'Hábitos de ese día';
  const note = $('#progress-note');
  note.textContent = allDone ? (isToday ? '¡Todo hecho! 🎉' : '¡Día completo! 🎉') : `${doneCount} de ${habits.length} hechos`;
  note.classList.toggle('all-done', allDone);

  let coach = '';
  if (ui.editing) coach = 'Toca un hábito para editarlo, o arrástralo desde ☰ para cambiar el orden.';
  else if (hasHabits && stats.checkins === 0) coach = '👆 Toca un hábito cuando lo completes';
  $('#coach').textContent = coach;
  $('#coach').hidden = !coach;

  $('#habit-list').innerHTML = habits.map(habitRow).join('');
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
  $('#level-next').textContent = `Faltan ${fmtNumber.format(stats.levelEnd - stats.xp)} XP para el nivel ${stats.level + 1}`;
}

function streakMeta(habit) {
  const streak = currentStreak(habit);
  if (streak === 0) return 'Empieza tu racha hoy';
  const flame = `<span class="flame">🔥 ${plural(streak, 'día', 'días')}</span>`;
  if (!habit.done[ui.today]) return `${flame} · ¡no la pierdas!`;
  const next = MILESTONES.find((m) => m > streak);
  return next ? `${flame} · próxima meta: ${next}` : flame;
}

function habitRow(habit) {
  const emoji = `<span class="emoji" aria-hidden="true">${escapeHTML(habit.emoji)}</span>`;
  const name = `<span class="name">${escapeHTML(habit.name)}</span>`;
  const color = `style="--c:${colorHex(habit.color)}"`;

  if (ui.editing) {
    return `<li><button type="button" class="habit" data-id="${habit.id}" ${color}>
      ${emoji}
      <span class="info">${name}<span class="meta">Toca para editar</span></span>
      <span class="grip-space"></span>
    </button><span class="grip" aria-hidden="true">${ICONS.grip}</span></li>`;
  }

  const done = Boolean(habit.done[ui.day]);
  const classes = ['habit'];
  if (done) classes.push('done');
  if (ui.pop === habit.id) classes.push('pop');

  return `<li><button type="button" class="${classes.join(' ')}" data-id="${habit.id}" aria-pressed="${done}" ${color}>
    ${emoji}
    <span class="info">${name}<span class="meta">${streakMeta(habit)}</span></span>
    <span class="check">${ICONS.check}</span>
  </button></li>`;
}

function toggleHabit(id, button) {
  const habit = findHabit(id);
  if (!habit) return;

  const before = computeStats();
  const wasPerfect = isPerfectDay(ui.day);
  const anchor = button && button.querySelector('.check');

  if (habit.done[ui.day]) delete habit.done[ui.day];
  else habit.done[ui.day] = 1;
  save();

  const nowDone = Boolean(habit.done[ui.day]);
  const after = computeStats();
  floatXp(anchor, after.xp - before.xp);
  if (nowDone) haptic();

  ui.pop = nowDone ? id : null;
  renderToday();
  ui.pop = null;

  if (!nowDone) return;
  const unlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a, after) && !isUnlocked(a, before));
  if (after.level > before.level) {
    showLevelUp(after, unlocked);
  } else if (unlocked.length) {
    confetti();
    const extra = unlocked.length > 1 ? ` (+${unlocked.length - 1})` : '';
    toast(`${unlocked[0].emoji} Logro desbloqueado: ${unlocked[0].name}${extra}`);
  } else if (!wasPerfect && isPerfectDay(ui.day)) {
    confetti(document.body, 90);
    toast(`🌟 ¡Día perfecto! +${XP_PERFECT_DAY} XP extra`);
  }
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
    state.habits.push({ id: uid(), name: t.name, emoji: t.emoji, color: nextColor(state.habits), created: ui.today, done: {} });
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
        <span class="rule-text"><b>Bonus de racha</b><span>+1 por cada día seguido</span></span>
        <span class="rule-xp">hasta +${XP_STREAK_CAP}</span></li>
      <li><span class="rule-emoji" aria-hidden="true">🌟</span>
        <span class="rule-text"><b>Día perfecto</b><span>Todos tus hábitos del día</span></span>
        <span class="rule-xp">+${XP_PERFECT_DAY}</span></li>
    </ul>
    <p class="rules-note">Cada nivel pide un poco más de XP que el anterior. Si borras un hábito, conservas la XP que ganaste con él.</p>
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

  $('#progress-view').innerHTML = hero + rules + roadCard + badgesCard;

  // Centrar el nivel actual en el camino.
  const roadEl = $('#road');
  const current = roadEl.querySelector('.current');
  if (current) roadEl.scrollLeft = current.offsetLeft - (roadEl.clientWidth - current.offsetWidth) / 2;
}

// ---------- Pantalla "Historial" ----------

function renderHistory() {
  const root = $('#history');

  if (!state.habits.length) {
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
      const { total, done } = dayTotals(key);
      return total && done ? Math.ceil((done / total) * 4) : 0;
    })}
  </article>`;

  const cards = state.habits.map((h) => {
    const p = habitProgress(h);
    return `<article class="card" style="--c:${colorHex(h.color)}">
      <div class="card-head">
        <span class="emoji" aria-hidden="true">${escapeHTML(h.emoji)}</span>
        <h2>${escapeHTML(h.name)}</h2>
        <button type="button" class="text-btn" data-edit="${h.id}">Editar</button>
      </div>
      <div class="stats">
        <div class="stat"><b>${currentStreak(h)}</b><span>Racha actual</span></div>
        <div class="stat"><b>${p.best}</b><span>Mejor racha</span></div>
        <div class="stat"><b>${p.checkins}</b><span>Días hechos</span></div>
      </div>
      ${heatmapHTML(h.id, (key) => (h.done[key] ? 4 : 0))}
    </article>`;
  });

  root.innerHTML = overview + cards.join('');

  // Empezar mostrando las semanas más recientes (a la derecha).
  root.querySelectorAll('.hm-scroll').forEach((el) => { el.scrollLeft = el.scrollWidth; });
}

// Cuadrícula tipo GitHub: columnas = semanas (de lunes a domingo), filas = días.
function heatmapHTML(id, levelOf) {
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
        cells += `<i class="l${levelOf(key)}${key === today ? ' today' : ''}" data-k="${key}"></i>`;
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
    </div>`;
}

function dayCaption(habitId, key) {
  const date = parseKey(key);
  const fmt = date.getFullYear() === new Date().getFullYear() ? fmtCaption : fmtCaptionYear;
  const label = capitalize(fmt.format(date).replace(/\./g, ''));
  if (habitId === 'all') {
    const { total, done } = dayTotals(key);
    return total ? `${label} · ${done} de ${total}` : `${label} · sin hábitos`;
  }
  const habit = findHabit(habitId);
  return `${label} · ${habit && habit.done[key] ? 'Hecho ✓' : 'Sin hacer'}`;
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
        <li><span aria-hidden="true">✅</span><span>Tus hábitos y tu perfil se mantienen</span></li>
      </ul>
      <button type="button" class="link-btn" data-export>Exportar una copia antes</button>`,
    confirmText: 'Sí, restablecer',
    danger: true,
  });
  if (!ok) return;

  const snapshot = JSON.stringify(state);
  state.habits.forEach((h) => {
    h.done = {};
    h.created = ui.today;
  });
  state.bank = { xp: 0, checkins: 0, best: 0 };
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
  render();
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
  saveBtn.disabled = nameInput.value.trim() === '';
}

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

function renderIdeas() {
  const used = new Set(state.habits.map((h) => h.name.toLowerCase()));
  const ideas = TEMPLATES.filter((t) => !used.has(t.name.toLowerCase()));
  $('#ideas').hidden = ui.editingId !== null || ideas.length === 0;
  $('#ideas-row').innerHTML = ideas.map((t) => (
    `<button type="button" class="idea" data-name="${escapeHTML(t.name)}" data-idea-emoji="${t.emoji}">${t.emoji} ${escapeHTML(t.name)}</button>`
  )).join('');
}

function openSheet(id = null) {
  const habit = id ? findHabit(id) : null;
  ui.editingId = habit ? habit.id : null;

  $('#sheet-title').textContent = habit ? 'Editar hábito' : 'Nuevo hábito';
  nameInput.value = habit ? habit.name : '';
  emojiInput.value = habit
    ? habit.emoji
    : SUGGESTED_EMOJIS.find((e) => !state.habits.some((h) => h.emoji === e)) || '⭐';
  $('#delete-block').hidden = !habit;
  setSheetColor(habit ? habit.color : nextColor(state.habits));
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
  emojiInput.value = lastGrapheme(emojiInput.value);
  syncEmojiGrid();
});
emojiInput.addEventListener('focus', () => emojiInput.select());

$('#emoji-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-emoji]');
  if (!btn) return;
  emojiInput.value = btn.dataset.emoji;
  syncEmojiGrid();
});

$('#ideas-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.idea');
  if (!btn) return;
  nameInput.value = btn.dataset.name;
  emojiInput.value = btn.dataset.ideaEmoji;
  syncEmojiGrid();
  updateSaveButton();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  const emoji = lastGrapheme(emojiInput.value) || '⭐';

  const habit = ui.editingId && findHabit(ui.editingId);
  if (habit) {
    habit.name = name;
    habit.emoji = emoji;
    habit.color = ui.sheetColor;
  } else {
    state.habits.push({ id: uid(), name, emoji, color: ui.sheetColor, created: ui.today, done: {} });
  }
  save();
  closeSheet();
  render();
  if (!habit) toast(`${emoji} «${name}» añadido`);
});

// Borrar es inmediato, pero se puede deshacer desde el aviso.
$('#delete-btn').addEventListener('click', () => {
  const habit = findHabit(ui.editingId);
  if (!habit) return;
  const snapshot = JSON.stringify(state);

  const p = habitProgress(habit);
  state.bank.xp += p.xp;
  state.bank.checkins += p.checkins;
  state.bank.best = Math.max(state.bank.best, p.best);
  state.habits = state.habits.filter((h) => h !== habit);

  save();
  closeSheet();
  render();
  toast(`«${habit.name}» eliminado`, {
    action: 'Deshacer',
    onAction: () => replaceState(normalize(JSON.parse(snapshot))),
  });
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
      const [moved] = state.habits.splice(from, 1);
      state.habits.splice(to, 0, moved);
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
function floatXp(anchor, amount) {
  if (!anchor || !amount) return;
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('span');
  el.className = amount > 0 ? 'xp-float' : 'xp-float minus';
  el.textContent = `${amount > 0 ? '+' : '−'}${Math.abs(amount)} XP`;
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

  // En el móvil abrimos el menú Compartir ("Guardar en Archivos", AirDrop, etc.).
  const isTouch = matchMedia('(pointer: coarse)').matches;
  if (isTouch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Copia de Racha' });
      markDone();
    } catch (err) {
      if (err.name !== 'AbortError') toast('No se pudo compartir la copia');
    }
    return;
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  markDone();
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

$('#habit-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.habit');
  if (!btn) return;
  if (ui.editing) openSheet(btn.dataset.id);
  else toggleHabit(btn.dataset.id, btn);
});

$('#add-btn').addEventListener('click', () => openSheet());

// Botones repartidos por la app con data-*.
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-add], [data-export], [data-import], [data-goto-view]');
  if (!target) return;
  if (target.hasAttribute('data-add')) openSheet();
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
  const gotoBtn = foot.querySelector('[data-goto]');
  gotoBtn.dataset.goto = cell.dataset.k;
  gotoBtn.hidden = false;
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkDateChange();
});
setInterval(checkDateChange, 60 * 1000);

// ---------- Arranque ----------

render();

// Pide al navegador que no borre nuestros datos si le falta espacio.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// Service worker: permite abrir la app sin conexión.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker no registrado', err));
}
