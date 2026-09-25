'use strict';

const STORAGE_KEY = 'racha:v1';
const HEATMAP_WEEKS = 53; // un año
const SUGGESTED_EMOJIS = [
  '💧', '🏃', '📚', '🧘', '😴', '🥗', '💊', '🦷',
  '✍️', '🎸', '🚶', '💪', '🧹', '🌱', '☀️', '🙏',
  '📵', '🍎', '🚭', '💰', '🧠', '🎨', '🛏️', '📝',
];

const $ = (selector) => document.querySelector(selector);

const ICONS = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
};

// ---------- Fechas (siempre en hora local, formato AAAA-MM-DD) ----------

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => dateKey(new Date());

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
const fmtCaption = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Datos (localStorage) ----------

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && Array.isArray(data.habits)) {
      data.habits.forEach((h) => { h.done = h.done || {}; });
      return data;
    }
  } catch (err) {
    console.warn('No se pudieron leer los datos guardados', err);
  }
  return { habits: [] };
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    toast('No se pudo guardar. ¿Estás en navegación privada?');
  }
}

const uid = () => (crypto.randomUUID
  ? crypto.randomUUID()
  : Date.now().toString(36) + Math.random().toString(36).slice(2));

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

// ---------- Rachas ----------

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

function bestStreak(habit) {
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of Object.keys(habit.done).sort()) {
    run = prev && shiftKey(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

// Hábitos que "existían" ese día (creados antes, o marcados ese día).
function dayTotals(key) {
  const active = state.habits.filter((h) => h.created <= key || h.done[key]);
  return { total: active.length, done: active.filter((h) => h.done[key]).length };
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// ---------- Pantalla "Hoy" ----------

function renderToday() {
  const { day, today } = ui;
  const isToday = day === today;
  const habits = state.habits;
  const hasHabits = habits.length > 0;
  if (!hasHabits) ui.editing = false;

  $('#day-title').textContent = isToday ? 'Hoy'
    : day === shiftKey(today, -1) ? 'Ayer'
    : capitalize(fmtWeekday.format(parseKey(day)));
  $('#day-subtitle').textContent = capitalize(fmtLong.format(parseKey(day)));
  $('#next-day').disabled = isToday;
  $('#edit-toggle').textContent = ui.editing ? 'Listo' : 'Editar';
  $('#edit-toggle').hidden = !hasHabits;
  $('#empty-today').hidden = hasHabits;
  $('#progress').hidden = !hasHabits;

  const doneCount = habits.filter((h) => h.done[day]).length;
  $('#progress-fill').style.width = hasHabits ? `${(doneCount / habits.length) * 100}%` : '0';
  $('#progress-text').textContent = doneCount === habits.length
    ? (isToday ? '¡Todo hecho hoy! 🎉' : '¡Día completo! 🎉')
    : `${doneCount} de ${habits.length} hechos`;

  $('#habit-list').innerHTML = habits.map(habitRow).join('');
}

function habitRow(habit) {
  const done = Boolean(habit.done[ui.day]);
  const streak = currentStreak(habit);

  let meta = 'Empieza tu racha';
  if (streak > 0) {
    meta = `<span class="flame">🔥 ${plural(streak, 'día', 'días')}</span>`;
    if (!habit.done[ui.today]) meta += ' · hazlo hoy';
  }

  const classes = ['habit'];
  if (done) classes.push('done');
  if (ui.pop === habit.id) classes.push('pop');

  const trailing = ui.editing
    ? `<span class="edit-icon">${ICONS.pencil}</span>`
    : `<span class="check">${ICONS.check}</span>`;
  const pressed = ui.editing ? '' : ` aria-pressed="${done}"`;

  return `<li><button type="button" class="${classes.join(' ')}" data-id="${habit.id}"${pressed}>
    <span class="emoji" aria-hidden="true">${escapeHTML(habit.emoji)}</span>
    <span class="info">
      <span class="name">${escapeHTML(habit.name)}</span>
      <span class="meta">${meta}</span>
    </span>
    ${trailing}
  </button></li>`;
}

function toggleHabit(id) {
  const habit = findHabit(id);
  if (!habit) return;
  if (habit.done[ui.day]) delete habit.done[ui.day];
  else habit.done[ui.day] = 1;
  save();
  ui.pop = habit.done[ui.day] ? id : null;
  renderToday();
  ui.pop = null;
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

  const overview = `<article class="card">
    <div class="card-head"><h2>Todos los hábitos</h2></div>
    ${heatmapHTML('all', (key) => {
      const { total, done } = dayTotals(key);
      return total && done ? Math.ceil((done / total) * 4) : 0;
    })}
  </article>`;

  const cards = state.habits.map((h) => `<article class="card">
    <div class="card-head">
      <span class="emoji" aria-hidden="true">${escapeHTML(h.emoji)}</span>
      <h2>${escapeHTML(h.name)}</h2>
      <button type="button" class="text-btn" data-edit="${h.id}">Editar</button>
    </div>
    <div class="stats">
      <div class="stat"><b>${currentStreak(h)}</b><span>Racha actual</span></div>
      <div class="stat"><b>${bestStreak(h)}</b><span>Mejor racha</span></div>
      <div class="stat"><b>${Object.keys(h.done).length}</b><span>Días hechos</span></div>
    </div>
    ${heatmapHTML(h.id, (key) => (h.done[key] ? 4 : 0))}
  </article>`);

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

  const legend = [0, 1, 2, 3, 4].map((l) => `<i style="background:var(--heat-${l})"></i>`).join('');

  return `<div class="heatmap" data-habit="${id}" role="img" aria-label="Mapa de calor de los últimos 12 meses">
      <div class="hm-days" aria-hidden="true"><span></span><span>L</span><span></span><span>X</span><span></span><span>V</span><span></span><span></span></div>
      <div class="hm-scroll">
        <div class="hm-months" aria-hidden="true">${months}</div>
        <div class="hm-grid">${cells}</div>
      </div>
    </div>
    <div class="hm-foot">
      <span class="hm-caption">Toca un día para ver el detalle</span>
      <span class="legend" aria-hidden="true"><span>Menos</span>${legend}<span>Más</span></span>
    </div>`;
}

function dayCaption(habitId, key) {
  const date = capitalize(fmtCaption.format(parseKey(key)).replace(/\./g, ''));
  if (habitId === 'all') {
    const { total, done } = dayTotals(key);
    return total ? `${date} · ${done} de ${total}` : `${date} · sin hábitos`;
  }
  const habit = findHabit(habitId);
  return `${date} · ${habit && habit.done[key] ? 'Hecho ✓' : 'Sin hacer'}`;
}

// ---------- Navegación ----------

function render() {
  if (ui.view === 'today') renderToday();
  else renderHistory();
}

function showView(view) {
  // Tocar "Hoy" estando ya en "Hoy" vuelve al día de hoy.
  if (view === 'today' && ui.view === 'today') ui.day = ui.today;
  ui.view = view;
  ui.editing = false;
  $('#view-today').hidden = view !== 'today';
  $('#view-history').hidden = view !== 'history';
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
const deleteBtn = $('#delete-btn');
let deleteArmed = false;

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

function resetDelete() {
  deleteArmed = false;
  deleteBtn.textContent = 'Eliminar hábito';
  deleteBtn.classList.remove('armed');
}

function openSheet(id = null) {
  const habit = id ? findHabit(id) : null;
  ui.editingId = habit ? habit.id : null;

  $('#sheet-title').textContent = habit ? 'Editar hábito' : 'Nuevo hábito';
  nameInput.value = habit ? habit.name : '';
  emojiInput.value = habit
    ? habit.emoji
    : SUGGESTED_EMOJIS.find((e) => !state.habits.some((h) => h.emoji === e)) || '⭐';
  deleteBtn.hidden = !habit;
  resetDelete();
  syncEmojiGrid();
  updateSaveButton();

  document.documentElement.classList.add('locked');
  sheet.showModal();
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

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  const emoji = lastGrapheme(emojiInput.value) || '⭐';

  const habit = ui.editingId && findHabit(ui.editingId);
  if (habit) {
    habit.name = name;
    habit.emoji = emoji;
  } else {
    state.habits.push({ id: uid(), name, emoji, created: ui.today, done: {} });
  }
  save();
  closeSheet();
  render();
});

// Borrar pide confirmación con un segundo toque.
deleteBtn.addEventListener('click', () => {
  if (!deleteArmed) {
    deleteArmed = true;
    deleteBtn.textContent = 'Toca otra vez para borrarlo y su historial';
    deleteBtn.classList.add('armed');
    return;
  }
  state.habits = state.habits.filter((h) => h.id !== ui.editingId);
  save();
  closeSheet();
  render();
  toast('Hábito eliminado');
});

// ---------- Aviso flotante ----------

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ---------- Eventos ----------

$('#habit-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.habit');
  if (!btn) return;
  if (ui.editing) openSheet(btn.dataset.id);
  else toggleHabit(btn.dataset.id);
});

$('#add-btn').addEventListener('click', () => openSheet());

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-add]')) openSheet();
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

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => showView(tab.dataset.view));
});

$('#history').addEventListener('click', (e) => {
  const edit = e.target.closest('[data-edit]');
  if (edit) {
    openSheet(edit.dataset.edit);
    return;
  }
  const cell = e.target.closest('.hm-grid i[data-k]');
  if (!cell) return;
  const map = cell.closest('.heatmap');
  const selected = map.querySelector('.sel');
  if (selected) selected.classList.remove('sel');
  cell.classList.add('sel');
  map.nextElementSibling.querySelector('.hm-caption').textContent = dayCaption(map.dataset.habit, cell.dataset.k);
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
