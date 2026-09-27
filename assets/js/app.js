'use strict';

const APP_VERSION = '0.8 beta';
const STORAGE_KEY = 'racha:v1';
const BACKUP_APPS = ['bonsai', 'racha'];
const BACKUP_MAX_BYTES = 10 * 1024 * 1024;
const PRE_IMPORT_KEY = `${STORAGE_KEY}:antes-de-importar`; // tus datos justo antes de la última importación
const RESCUE_KEY = `${STORAGE_KEY}:rescate`;               // datos guardados que no se pudieron leer
const HEATMAP_WEEKS = 53;
const LONG_PRESS_MS = 500;

const XP_PER_CHECK = 10;
const XP_STREAK_CAP = 10;
const XP_PERFECT_DAY = 25;
const SHIELD_EVERY = 7;
const SHIELD_MAX = 3;
const SHIELD_MIN_STREAK = 3;

const MOOD_NAMES = ['Mal', 'Regular', 'Normal', 'Bien', 'Genial'];
const MOOD_MOUTHS = [
  'M8.5 16.5c1-1.3 2.2-2 3.5-2s2.5.7 3.5 2',
  'M9 15.9l6-1.3',
  'M9 15.5h6',
  'M9 14.5c.9.6 1.9.9 3 .9s2.1-.3 3-.9',
  'M8 13.5h8a4 4 0 0 1-8 0z',
];
const NOTE_MAX = 200;
// Salud: medidas personales, privadas y solo en este dispositivo (y en las copias que exportes).
// No dan XP ni cuentan para rachas o retos. Cada unidad pasa a la primera con `toBase` (y `offset`, en °F),
// para comparar registros hechos en unidades distintas. `decimals`: los que se ven (0 = solo enteros);
// `chart`: línea para niveles, columnas desde cero para totales del día y rango para la tensión;
// `span`: rango mínimo del eje; `example`: la pista de los campos (la de la unidad, si la tiene).
// La tensión guarda la sistólica (value), la diastólica (value2) y, si se apunta, el pulso.
const HEALTH_METRICS = {
  weight: {
    label: 'Peso', decimals: 1, chart: 'line', span: 1, example: '72,5',
    units: {
      kg: { label: 'Kilos', symbol: 'kg', min: 20, max: 400, toBase: 1, example: '72,5' },
      lb: { label: 'Libras', symbol: 'lb', min: 44, max: 880, toBase: 0.45359237, example: '160' },
    },
  },
  waist: {
    label: 'Cintura', decimals: 1, chart: 'line', span: 2, example: '80',
    units: {
      cm: { label: 'Centímetros', symbol: 'cm', min: 30, max: 250, toBase: 1, example: '80' },
      in: { label: 'Pulgadas', symbol: 'in', min: 12, max: 100, toBase: 2.54, example: '31,5' },
    },
  },
  restingHr: {
    label: 'Pulso en reposo', decimals: 0, chart: 'line', span: 6, example: '62',
    units: { bpm: { label: 'Pulsaciones por minuto', symbol: 'lpm', min: 25, max: 220, toBase: 1 } },
  },
  bloodPressure: {
    label: 'Tensión arterial', decimals: 0, chart: 'range', span: 20, example: '120', pair: true,
    units: { mmHg: { label: 'Milímetros de mercurio', symbol: 'mmHg', min: 60, max: 260, toBase: 1 } },
    second: { label: 'Diastólica', min: 30, max: 160, example: '80' },
    pulse: { label: 'Pulso', min: 25, max: 220, example: '64' },
  },
  sleep: {
    label: 'Sueño', decimals: 1, chart: 'bars', span: 2, example: '7,5',
    units: { h: { label: 'Horas', symbol: 'h', min: 0, max: 24, toBase: 1 } },
  },
  bodyFat: {
    label: 'Grasa corporal', decimals: 1, chart: 'line', span: 2, example: '18,5',
    units: { pct: { label: 'Porcentaje', symbol: '%', min: 2, max: 75, toBase: 1 } },
  },
  temperature: {
    label: 'Temperatura', decimals: 1, chart: 'line', span: 1, example: '36,6',
    units: {
      c: { label: 'Celsius', symbol: '°C', min: 30, max: 45, toBase: 1, example: '36,6' },
      f: { label: 'Fahrenheit', symbol: '°F', min: 86, max: 113, toBase: 5 / 9, offset: -160 / 9, example: '97,9' },
    },
  },
  steps: {
    label: 'Pasos', decimals: 0, chart: 'bars', span: 1000, example: '8.000',
    units: { steps: { label: 'Pasos', symbol: 'pasos', min: 0, max: 100000, toBase: 1 } },
  },
};
const HEALTH_NOTE_MAX = 200;
const HEALTH_MIN_DATE = '1900-01-01';
// Ajustes de la app. Viajan en las copias; los datos y copias de antes empiezan con estos valores.
const DEFAULT_PREFS = {
  theme: 'auto',        // 'auto' (el del móvil), 'light' u 'dark'
  textSize: 'normal',   // 'normal', 'large' o 'xlarge'
  haptics: true,        // vibración al marcar
  startView: 'today',   // pestaña con la que se abre la app
  showChallenges: true, // retos de la semana en Hoy
  showJournal: true,    // diario en Hoy
  showHealth: true,     // tarjeta de Salud en Hoy (antes, la pestaña)
  showZen: true,        // tarjeta de Zen en Hoy
  weeklySummary: true,  // el resumen se abre solo al empezar la semana
  backupReminder: 14,   // días sin copia antes de avisar en Ajustes (0 = nunca)
};
// Zen: prácticas de calma, gratitud y emociones. Sin XP ni rachas: si se elige, al terminar se marca un hábito.
// Cada respiración es una lista de fases [tipo, segundos] que se repite.
const ZEN_TYPES = { breath: 'Respiración', meditation: 'Meditación', sounds: 'Sonidos', grounding: '5-4-3-2-1' };
const ZEN_BREATHS = {
  box: { label: 'Caja', rhythm: '4 · 4 · 4 · 4', about: 'Inhala, mantén, exhala y mantén, 4 segundos cada vez.', phases: [['in', 4], ['hold', 4], ['out', 4], ['hold', 4]] },
  relax: { label: '4-7-8', rhythm: '4 · 7 · 8', about: 'Inhala 4 segundos, mantén 7 y exhala despacio durante 8.', phases: [['in', 4], ['hold', 7], ['out', 8]] },
  calm: { label: 'Tranquila', rhythm: '5 · 5', about: 'Inhala 5 segundos y exhala otros 5, sin pausas.', phases: [['in', 5], ['out', 5]] },
};
const ZEN_SOUNDS = { rain: 'Lluvia', waves: 'Olas', brown: 'Ruido marrón', soft: 'Ruido suave' };
const ZEN_GROUNDING = [[5, 'cosas que ves'], [4, 'cosas que puedes tocar'], [3, 'cosas que oyes'], [2, 'cosas que hueles'], [1, 'cosa que saboreas']];
const ZEN_EMOTIONS = {
  Agradables: ['calma', 'alegría', 'gratitud', 'ilusión', 'orgullo', 'energía', 'esperanza', 'cariño'],
  Difíciles: ['cansancio', 'estrés', 'tristeza', 'preocupación', 'frustración', 'soledad', 'enfado', 'agobio'],
  Otras: ['nervios', 'aburrimiento', 'confusión', 'curiosidad', 'nostalgia', 'indiferencia'],
};
const ZEN_INTENSITY = ['Poco', 'Algo', 'Bastante', 'Mucho', 'Muchísimo'];
const ZEN_WORDS_MAX = 3;
const GRATITUDE_ITEMS = 3;
const GRATITUDE_MAX = 140;
const ZEN_MEDITATION_MINUTES = [3, 5, 10, 15, 20, 30];
const ZEN_BREATH_MINUTES = [1, 3, 5, 10];
const ZEN_SOUND_MINUTES = [0, 15, 30, 60]; // 0 = sin límite
const ZEN_INTERVALS = [[0, 'Sin avisos'], [1, 'Cada minuto'], [5, 'Cada 5 minutos']];
const DEFAULT_ZEN_SETTINGS = {
  habitId: null,     // hábito que se marca al terminar una práctica
  rhythm: true,      // vibración en cada cambio de la respiración
  bell: true,        // campana al empezar y terminar la meditación
  breath: 'box',
  breathMinutes: 3,
  minutes: 10,       // meditación
  interval: 0,       // avisos durante la meditación (minutos, 0 = ninguno)
  sound: 'rain',
  soundMinutes: 0,
  volume: 0.5,
};
// Frases breves y propias, una por día. Sin consejos médicos ni promesas.
const ZEN_REFLECTIONS = [
  'Respira. Este momento también cuenta.',
  'Lo pequeño, repetido cada día, termina notándose.',
  'No hace falta hacerlo perfecto; basta con empezar.',
  'Hoy puedes ir un poco más despacio.',
  'Fíjate en algo bonito que tengas cerca.',
  'Descansar también es avanzar.',
  'Tus pasos cuentan aunque sean cortos.',
  'Suelta lo que no depende de ti.',
  'Una respiración lenta cambia el ritmo del día.',
  'Mira el cielo un momento.',
  'Lo que sientes es válido; no tienes que arreglarlo ahora.',
  'Agradece algo sencillo: un café, una charla, un rato de sol.',
  'Empieza por lo más fácil.',
  'No compitas con nadie: acompáñate.',
  'Haz una pausa antes de responder.',
  'Tu cuerpo te habla: escúchalo un momento.',
  'Cada día se empieza de nuevo.',
  'La calma también se entrena.',
  'Bebe un vaso de agua con atención.',
  'Camina unos minutos sin mirar el móvil.',
  'Di algo amable a alguien. Y a ti.',
  'Lo que hoy cuesta, mañana puede costar menos.',
  'No todo tiene que ser productivo.',
  'Deja un rato para no hacer nada.',
  'Observa tu respiración sin cambiarla.',
  'Estás haciendo lo que puedes, y eso es suficiente.',
  'Cuida tu energía como un bonsái: con paciencia.',
  'Hoy, elige una sola cosa importante.',
  'Nota tus pies en el suelo.',
  'Un buen día no es un día perfecto.',
  'Escucha una canción entera sin hacer nada más.',
  'Despídete del día con algo que agradecer.',
  'Lo que riegas, crece.',
  'Date permiso para empezar despacio.',
  'Sonríe a algo pequeño.',
  'El progreso no siempre se ve, pero está.',
  'Deja un hueco de calma entre tarea y tarea.',
  'Hoy es un buen día para ser amable contigo.',
  'Relaja los hombros. Ahora, la mandíbula.',
  'Lo importante rara vez es urgente.',
];
const PREF_CHOICES = {
  theme: ['auto', 'light', 'dark'],
  textSize: ['normal', 'large', 'xlarge'],
  startView: ['today', 'progress', 'history'], // Salud ya no es una pestaña: quien la tenía vuelve a Hoy
  backupReminder: [0, 7, 14, 30],
};
const MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const LEVELS = [
  'Semilla', 'Brote', 'Plántula', 'Arraigo', 'Tallo',
  'Rama', 'Copa', 'Poda', 'Forma', 'Tronco',
  'Corteza', 'Árbol joven', 'Árbol maduro', 'Árbol antiguo', 'Maestro',
].map((title) => ({ title }));

const ACHIEVEMENTS = [
  { icon: 'checkCircle', name: 'Primer paso', desc: 'Marca tu primer hábito', stat: 'checkins', goal: 1 },
  { icon: 'flame', name: 'En marcha', desc: 'Racha de 3 días', stat: 'best', goal: 3 },
  { icon: 'sun', name: 'Día perfecto', desc: 'Todos tus hábitos en un día', stat: 'perfectDays', goal: 1 },
  { icon: 'calendar', name: 'Una semana', desc: 'Racha de 7 días', stat: 'best', goal: 7 },
  { icon: 'sprout', name: 'Despegue', desc: 'Llega al nivel 5', stat: 'level', goal: 5 },
  { icon: 'link', name: 'Dos semanas', desc: 'Racha de 14 días', stat: 'best', goal: 14 },
  { icon: 'checks', name: 'Medio centenar', desc: 'Marca 50 hábitos en total', stat: 'checkins', goal: 50 },
  { icon: 'sparkle', name: 'Perfeccionista', desc: '10 días perfectos', stat: 'perfectDays', goal: 10 },
  { icon: 'moon', name: 'Un mes entero', desc: 'Racha de 30 días', stat: 'best', goal: 30 },
  { icon: 'tree', name: 'Doble dígito', desc: 'Llega al nivel 10', stat: 'level', goal: 10 },
  { icon: 'layers', name: 'Veterano', desc: 'Marca 250 hábitos en total', stat: 'checkins', goal: 250 },
  { icon: 'mountain', name: 'Centenario', desc: 'Racha de 100 días', stat: 'best', goal: 100 },
  { icon: 'gem', name: 'Diamante', desc: '50 días perfectos', stat: 'perfectDays', goal: 50 },
  { icon: 'cycle', name: 'Un año', desc: 'Racha de 365 días', stat: 'best', goal: 365 },
  { icon: 'shield', name: 'Escudo', desc: 'Usa tu primer protector', stat: 'shieldsUsed', goal: 1 },
  { icon: 'unlock', name: 'Libre', desc: '30 días sin recaer', stat: 'bestClean', goal: 30 },
  { icon: 'target', name: 'Retador', desc: 'Completa 10 retos semanales', stat: 'challenges', goal: 10 },
];

const MEASURES = {
  min: { label: 'Tiempo', unit: 'min', mode: 'target', min: 5, max: 180, step: 5 },
  steps: { label: 'Pasos', unit: 'pasos', mode: 'target', min: 1000, max: 30000, step: 500 },
  km: { label: 'Distancia', unit: 'km', mode: 'target', min: 0.5, max: 50, step: 0.5 },
  hours: { label: 'Horas', unit: 'h', mode: 'target', min: 4, max: 12, step: 0.5 },
  pages: { label: 'Páginas', unit: 'páginas', mode: 'target', min: 5, max: 150, step: 5 },
  glasses: { label: 'Vasos', unit: 'vasos', mode: 'count', min: 2, max: 16, step: 1 },
  pieces: { label: 'Piezas', unit: 'piezas', mode: 'count', min: 1, max: 8, step: 1 },
};

const HABIT_TYPES = [
  { id: 'walk', group: 'move', emoji: '🚶', name: 'Caminar', measures: [{ id: 'min', def: 30 }, { id: 'steps', def: 8000 }] },
  { id: 'run', group: 'move', emoji: '🏃', name: 'Correr', schedule: { type: 'weekly', times: 3 }, measures: [{ id: 'km', def: 5, max: 42 }, { id: 'min', def: 30 }] },
  { id: 'bike', group: 'move', emoji: '🚴', name: 'Montar en bici', schedule: { type: 'weekly', times: 2 }, measures: [{ id: 'km', def: 15, min: 1, max: 100, step: 1 }, { id: 'min', def: 45 }] },
  { id: 'workout', group: 'move', emoji: '💪', name: 'Hacer ejercicio', schedule: { type: 'weekly', times: 3 }, measures: [{ id: 'min', def: 45 }] },
  { id: 'stretch', group: 'move', emoji: '🤸', name: 'Estirar', measures: [{ id: 'min', def: 10, max: 60 }] },
  { id: 'meditate', group: 'mind', emoji: '🧘', name: 'Meditar', measures: [{ id: 'min', def: 10, min: 1, max: 60, step: 1 }] },
  { id: 'read', group: 'mind', emoji: '📚', name: 'Leer', measures: [{ id: 'pages', def: 20 }, { id: 'min', def: 20 }] },
  { id: 'study', group: 'mind', emoji: '🎓', name: 'Estudiar', measures: [{ id: 'min', def: 45 }] },
  { id: 'language', group: 'mind', emoji: '🗣️', name: 'Practicar un idioma', measures: [{ id: 'min', def: 15 }] },
  { id: 'music', group: 'mind', emoji: '🎸', name: 'Tocar un instrumento', measures: [{ id: 'min', def: 20 }] },
  { id: 'journal', group: 'mind', emoji: '✍️', name: 'Escribir diario' },
  { id: 'water', group: 'health', emoji: '💧', name: 'Beber agua', measures: [{ id: 'glasses', def: 8 }] },
  { id: 'sleep', group: 'health', emoji: '😴', name: 'Dormir bien', measures: [{ id: 'hours', def: 8 }],
    hint: 'Márcalo al despertar: un toque si has dormido tus horas, o mantén pulsado para apuntar las horas reales.' },
  { id: 'fruit', group: 'health', emoji: '🍎', name: 'Comer fruta', measures: [{ id: 'pieces', def: 3 }] },
  { id: 'floss', group: 'health', emoji: '🦷', name: 'Usar hilo dental' },
  { id: 'vitamins', group: 'health', emoji: '💊', name: 'Tomar vitaminas' },
  { id: 'smoke', group: 'quit', emoji: '🚭', name: 'Dejar de fumar', kind: 'quit' },
  { id: 'sugar', group: 'quit', emoji: '🍬', name: 'Sin azúcar', kind: 'quit' },
  { id: 'social', group: 'quit', emoji: '📵', name: 'Menos redes', kind: 'quit' },
  { id: 'alcohol', group: 'quit', emoji: '🍷', name: 'Sin alcohol', kind: 'quit' },
  { id: 'custom', group: 'custom', emoji: '', name: '' },
];
const TYPE_GROUPS = [['move', 'Moverte'], ['mind', 'Mente'], ['health', 'Salud'], ['quit', 'Dejar algo'], ['custom', 'A tu manera']];
const WELCOME_TYPES = ['walk', 'water', 'read', 'meditate', 'sleep', 'workout', 'fruit', 'social'];
const typeOf = (id) => HABIT_TYPES.find((t) => t.id === id) || HABIT_TYPES[HABIT_TYPES.length - 1];

function measureSpec(type, id) {
  const base = MEASURES[id];
  const own = (type.measures || []).find((m) => m.id === id) || {};
  return { ...base, id, def: own.def ?? base.min, min: own.min ?? base.min, max: own.max ?? base.max, step: own.step ?? base.step };
}

function typeHint(type) {
  if (type.id === 'custom') return 'Cualquier hábito, como tú quieras';
  if (type.kind === 'quit') return 'Días sin recaer';
  if (!type.measures) return 'Sí o no';
  return type.measures.map((m, i) => (i ? MEASURES[m.id].label.toLowerCase() : MEASURES[m.id].label)).join(' o ');
}

const SUGGESTED_EMOJIS = [
  '💧', '🏃', '📚', '🧘', '😴', '🥗', '💊', '🦷',
  '✍️', '🎸', '🚶', '💪', '🧹', '🌱', '☀️', '🙏',
  '📵', '🍎', '🚭', '💰', '🧠', '🎨', '🛏️', '📝',
];

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
const OLD_COLORS = {
  violeta: 'glicina', rosa: 'sakura', naranja: 'arcilla', amarillo: 'ocre',
  verde: 'salvia', turquesa: 'jade', azul: 'niebla', rojo: 'arcilla',
};
const colorHex = (id) => (COLORS.find((c) => c.id === id) || COLORS[0]).hex;
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

// Iconos de línea (trazo de 1,5, como los de la barra de pestañas). Sustituyen a los emojis de la app;
// los emojis que eliges para tus hábitos y tu avatar se quedan tal cual.
const svg = (body, label) => `<svg viewBox="0 0 24 24" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;
const ICONS = {
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  grip: svg('<path d="M5 8h14M5 12h14M5 16h14"/>'),
  pause: svg('<path d="M9 6v12M15 6v12"/>'),
  plus: svg('<path d="M12 6v12M6 12h12"/>'),
  x: svg('<path d="M7 7l10 10M17 7L7 17"/>'),
  flame: svg('<path d="M12 3c.4 2.6 2 4.3 3.6 6 1.5 1.6 2.4 3.2 2.4 5.2A6 6 0 0 1 6 14.2c0-2 .8-3.6 2.2-5 .2 1.5.9 2.6 2 3.2C10 9 10.6 5.8 12 3z"/>', 'Racha'),
  shield: svg('<path d="M12 3l7 2.7v5.5c0 4.4-2.9 7.9-7 9.3-4.1-1.4-7-4.9-7-9.3V5.7L12 3z"/>'),
  leaf: svg('<path d="M6 18C6 10.5 10.5 6 19 5c-.6 8.3-5 13-13 13z"/><path d="M6 18l6-6"/>'),
  target: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>'),
  calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  checkCircle: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'),
  checks: svg('<path d="M2.5 12.5l4 4L15 8M11.5 15.5l1 1L21 8"/>'),
  layers: svg('<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8 12 3.5z"/><path d="M3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>'),
  moon: svg('<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/>'),
  mountain: svg('<path d="M2.5 19.5l7-11.5 4 6.5 2-3 6 8H2.5z"/>'),
  cycle: svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4v4h-4"/>'),
  sparkle: svg('<path d="M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5z"/><path d="M18.5 16.5v4M16.5 18.5h4"/>'),
  gem: svg('<path d="M7 4.5h10l3.5 5L12 20 3.5 9.5 7 4.5z"/><path d="M3.5 9.5h17M9.5 4.5L8 9.5l4 10.5 4-10.5-1.5-5"/>'),
  sprout: svg('<path d="M12 20.5v-8"/><path d="M12 12.5C12 8.5 9.5 6 5 6c0 4 2.5 6.5 7 6.5z"/><path d="M12 10.5c0-3.5 2.3-6 6.5-6 0 3.8-2.4 6-6.5 6z"/>'),
  tree: svg('<path d="M12 21v-5.5"/><path d="M8 15.5a4 4 0 0 1-1.3-7.8 5.5 5.5 0 0 1 10.6 0A4 4 0 0 1 16 15.5H8z"/>'),
  unlock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7a3.5 3.5 0 0 1 6.8-1.2"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  drop: svg('<path d="M12 3.5c3.5 4.2 6 7.4 6 10.5a6 6 0 0 1-12 0c0-3.1 2.5-6.3 6-10.5z"/>'),
  grid: svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
  award: svg('<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5"/>'),
  chart: svg('<path d="M4 20.5h16M7 16.5v-4M12 16.5v-9M17 16.5v-6"/>'),
  play: svg('<path d="M8 5.5v13l10.5-6.5L8 5.5z"/>'),
  heart: svg('<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10z"/>'),
  rotate: svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/>'),
  download: svg('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M4.5 19.5h15"/>'),
  trash: svg('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5"/>'),
  note: svg('<path d="M4.5 19.5h4l10-10-4-4-10 10v4z"/><path d="M13 7l4 4"/>'),
  chevronLeft: svg('<path d="M15 5l-7 7 7 7"/>'),
  chevronRight: svg('<path d="M9 5l7 7-7 7"/>'),
  chevronUp: svg('<path d="M5 15l7-7 7 7"/>'),
  chevronDown: svg('<path d="M5 9l7 7 7-7"/>'),
  wind: svg('<path d="M3 9h10.5a3 3 0 1 0-3-3"/><path d="M3 15h14a3 3 0 1 1-3 3"/><path d="M3 12h6"/>'),
  timer: svg('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.5 1.5M9.5 3h5"/>'),
  wave: svg('<path d="M2.5 9.5c2.4 0 2.4-2.5 4.8-2.5s2.4 2.5 4.7 2.5 2.4-2.5 4.8-2.5 2.3 2.5 4.7 2.5"/><path d="M2.5 16c2.4 0 2.4-2.5 4.8-2.5s2.4 2.5 4.7 2.5 2.4-2.5 4.8-2.5 2.3 2.5 4.7 2.5"/>'),
  eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
};
const moodIcon = (mood) => svg(`<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="${MOOD_MOUTHS[mood - 1]}"/>`);

// ---------- Fechas (siempre en hora local, formato AAAA-MM-DD) ----------

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => dateKey(new Date());
const isDateKey = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Los cálculos de rachas, XP y retos recorren miles de fechas en cada pintado. Crear un Date para cada una
// era lo más lento, así que el resultado de cada fecha (siempre el mismo) se recuerda. Con un tope, por si
// la app pasa mucho tiempo abierta.
const DATE_MEMO_MAX = 50000;
function memoized(fn) {
  const memo = new Map();
  return (key) => {
    let value = memo.get(key);
    if (value === undefined) {
      if (memo.size >= DATE_MEMO_MAX) memo.clear();
      value = fn(key);
      memo.set(key, value);
    }
    return value;
  };
}

const addDays = (key, days) => {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
};
const nextKey = memoized((key) => addDays(key, 1));
const shiftedKey = memoized((id) => {
  const [key, days] = id.split('|');
  return addDays(key, Number(days));
});
const shiftKey = (key, days) => (days === 1 ? nextKey(key) : shiftedKey(`${key}|${days}`));

const weekdayOf = memoized((key) => (parseKey(key).getDay() + 6) % 7); // 0 = lunes
const weekStartOf = (key) => shiftKey(key, -weekdayOf(key));

// Recorre los días de `from` a `to` (ambos incluidos) llamando a fn(clave, díaDeLaSemana).
function forEachDay(from, to, fn) {
  let weekday = weekdayOf(from);
  for (let key = from; key <= to; key = nextKey(key)) {
    fn(key, weekday);
    weekday = (weekday + 1) % 7;
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
  health: emptyHealth(), // medidas de Salud
  routines: [],          // rutinas: [{ id, name, habitIds }], en el orden en que se ven
  prefs: normalizePrefs(), // ajustes (ver DEFAULT_PREFS)
  zen: emptyZen(),         // prácticas, gratitud y emociones
});

// Zen: sesiones [{ id, type, date, seconds, created }], gratitud { 'AAAA-MM-DD': [hasta 3 textos] },
// emociones [{ id, date, words, intensity 1–5, note, created }] y sus ajustes.
function emptyZen() {
  return { sessions: [], gratitude: {}, emotions: [], settings: { ...DEFAULT_ZEN_SETTINGS } };
}

const cleanId = (id) => (typeof id === 'string' || typeof id === 'number' ? String(id).slice(0, 64) : '') || uid();
const cleanText = (text, max) => (typeof text === 'string' ? text.trim().slice(0, max) : '');

// Las copias de antes de Zen no traen esta sección: se quedan con la vacía.
function normalizeZen(data) {
  const zen = emptyZen();
  if (!data || typeof data !== 'object') return zen;
  zen.sessions = (Array.isArray(data.sessions) ? data.sessions : [])
    .filter((s) => s && Object.hasOwn(ZEN_TYPES, s.type) && isRealDate(s.date) && Number(s.seconds) >= 1 && Number(s.seconds) <= 86400)
    .map((s) => ({ id: cleanId(s.id), type: s.type, date: s.date, seconds: Math.round(Number(s.seconds)), created: Math.max(0, Number(s.created) || 0) }))
    .sort(byHealthDate);
  Object.entries(data.gratitude && typeof data.gratitude === 'object' ? data.gratitude : {}).forEach(([date, items]) => {
    const clean = (Array.isArray(items) ? items : []).map((t) => cleanText(t, GRATITUDE_MAX)).slice(0, GRATITUDE_ITEMS);
    if (isRealDate(date) && clean.some(Boolean)) zen.gratitude[date] = clean;
  });
  zen.emotions = (Array.isArray(data.emotions) ? data.emotions : [])
    .filter((e) => e && isRealDate(e.date) && Array.isArray(e.words))
    .map((e) => ({
      id: cleanId(e.id),
      date: e.date,
      // Las palabras que esta versión no conoce se conservan (vienen de una copia más nueva).
      words: [...new Set(e.words.map((w) => cleanText(w, 30).toLocaleLowerCase('es')).filter(Boolean))].slice(0, ZEN_WORDS_MAX),
      intensity: Math.min(5, Math.max(1, Math.round(Number(e.intensity)) || 3)),
      note: cleanText(e.note, NOTE_MAX),
      created: Math.max(0, Number(e.created) || 0),
    }))
    .filter((e) => e.words.length)
    .sort(byHealthDate);
  const s = data.settings || {};
  const pick = (key, ok) => { if (ok(s[key])) zen.settings[key] = s[key]; };
  pick('habitId', (v) => typeof v === 'string' && v.length > 0);
  pick('rhythm', (v) => typeof v === 'boolean');
  pick('bell', (v) => typeof v === 'boolean');
  pick('breath', (v) => typeof v === 'string' && Object.hasOwn(ZEN_BREATHS, v));
  pick('breathMinutes', (v) => ZEN_BREATH_MINUTES.includes(v));
  pick('minutes', (v) => ZEN_MEDITATION_MINUTES.includes(v));
  pick('interval', (v) => ZEN_INTERVALS.some(([n]) => n === v));
  pick('sound', (v) => typeof v === 'string' && Object.hasOwn(ZEN_SOUNDS, v));
  pick('soundMinutes', (v) => ZEN_SOUND_MINUTES.includes(v));
  pick('volume', (v) => typeof v === 'number' && v >= 0 && v <= 1);
  return zen;
}

// Cada ajuste, solo con un valor válido; si no, el de por defecto.
function normalizePrefs(data) {
  const prefs = { ...DEFAULT_PREFS };
  if (!data || typeof data !== 'object') return prefs;
  Object.keys(prefs).forEach((key) => {
    const value = data[key];
    if (PREF_CHOICES[key] ? PREF_CHOICES[key].includes(value) : typeof value === 'boolean') prefs[key] = value;
  });
  return prefs;
}

// Rutinas: solo agrupan hábitos para verlos juntos en Hoy (sin XP ni rachas propias).
// Cada hábito está como mucho en una; los ids que ya no existen se descartan.
const ROUTINE_MAX = 12;
const ROUTINE_NAME_MAX = 30;
function normalizeRoutines(list, habits) {
  const known = new Set(habits.map((h) => h.id));
  const used = new Set();
  const ids = new Set();
  return (Array.isArray(list) ? list : [])
    .filter((r) => r && typeof r.name === 'string' && r.name.trim())
    .slice(0, ROUTINE_MAX)
    .map((r) => {
      let id = typeof r.id === 'string' && r.id ? r.id.slice(0, 64) : uid();
      if (ids.has(id)) id = uid();
      ids.add(id);
      const habitIds = (Array.isArray(r.habitIds) ? r.habitIds : []).map(String)
        .filter((hid) => known.has(hid) && !used.has(hid) && used.add(hid));
      return { id, name: r.name.trim().slice(0, ROUTINE_NAME_MAX), habitIds };
    });
}

// Unidad preferida de cada medida (la primera de su lista, por defecto), las medidas que se ven en Salud
// (en el orden del catálogo), el recordatorio para el calendario y los registros, por fecha.
const HEALTH_DEFAULT_METRICS = ['weight'];
const emptyHealthReminder = () => ({ days: [0, 1, 2, 3, 4, 5, 6], time: '08:00' });
function emptyHealth() {
  const units = Object.fromEntries(Object.entries(HEALTH_METRICS).map(([id, m]) => [id, Object.keys(m.units)[0]]));
  return { units, metrics: [...HEALTH_DEFAULT_METRICS], reminder: emptyHealthReminder(), entries: [] };
}

const isRealDate = (key) => isDateKey(key) && key >= HEALTH_MIN_DATE && dateKey(parseKey(key)) === key;
const inRange = (value, range) => Number.isFinite(value) && value >= range.min && value <= range.max;
const inHealthRange = (metric, value, unit) => {
  const range = Object.hasOwn(HEALTH_METRICS[metric].units, unit) && HEALTH_METRICS[metric].units[unit];
  return Boolean(range) && inRange(value, range);
};
// Enteros en las medidas sin decimales; en las demás, hasta 2 decimales (como siempre se ha guardado el peso).
const healthRound = (metric, v) => (HEALTH_METRICS[metric] && HEALTH_METRICS[metric].decimals === 0 ? Math.round(Number(v)) : round2(v));
// Por fecha y, el mismo día, por orden de creación.
const byHealthDate = (a, b) => (a.date === b.date ? a.created - b.created : a.date < b.date ? -1 : 1);

// Un registro: { id, metric, date, value, (value2, pulse), unit, note, created }. Se guarda en la unidad
// en que se apuntó. Los de medidas que esta versión no conoce se conservan, para no perderlos al importar
// una copia más nueva.
function normalizeHealthEntry(e) {
  if (!e || typeof e.metric !== 'string' || !isRealDate(e.date)) return null;
  const known = Object.hasOwn(HEALTH_METRICS, e.metric) ? HEALTH_METRICS[e.metric] : null;
  const value = healthRound(e.metric, e.value);
  const unit = typeof e.unit === 'string' ? e.unit : '';
  const extra = {};
  let valid;
  if (known) {
    valid = inHealthRange(e.metric, value, unit);
    if (valid && known.pair) {
      const value2 = Math.round(Number(e.value2));
      valid = inRange(value2, known.second) && value2 < value;
      extra.value2 = value2;
      const pulse = Math.round(Number(e.pulse));
      if (e.pulse !== undefined && e.pulse !== null && inRange(pulse, known.pulse)) extra.pulse = pulse;
    }
  } else {
    valid = /^[a-z][\w-]{0,31}$/i.test(e.metric) && value > 0 && value < 1e6 && unit.length > 0 && unit.length <= 12;
  }
  if (!valid) return null;
  const id = typeof e.id === 'string' || typeof e.id === 'number' ? String(e.id).slice(0, 64) : '';
  return {
    id: id || uid(),
    metric: e.metric,
    date: e.date,
    value,
    ...extra,
    unit,
    note: typeof e.note === 'string' ? e.note.trim().slice(0, HEALTH_NOTE_MAX) : '',
    created: Math.max(0, Number(e.created) || 0),
  };
}

// Las copias anteriores a Salud no traen esta sección, y las de antes de tener más medidas no traen
// `metrics` ni `reminder`: se quedan con los valores por defecto.
function normalizeHealth(data) {
  const health = emptyHealth();
  if (!data || typeof data !== 'object') return health;
  Object.keys(health.units).forEach((id) => {
    const unit = data.units && data.units[id];
    if (typeof unit === 'string' && Object.hasOwn(HEALTH_METRICS[id].units, unit)) health.units[id] = unit;
  });
  if (Array.isArray(data.metrics)) {
    health.metrics = Object.keys(HEALTH_METRICS).filter((id) => data.metrics.includes(id));
  }
  const reminder = data.reminder || {};
  if (Array.isArray(reminder.days)) {
    health.reminder.days = [...new Set(reminder.days.map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort((a, b) => a - b);
  }
  if (typeof reminder.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(reminder.time)) health.reminder.time = reminder.time;
  const ids = new Set();
  health.entries = (Array.isArray(data.entries) ? data.entries : [])
    .map(normalizeHealthEntry)
    .filter((e) => e && !ids.has(e.id) && ids.add(e.id))
    .sort(byHealthDate);
  return health;
}

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
// En los de tiempo, distancia…: cualquier cantidad positiva (hasta 2 decimales, como 5,5 km).
const round2 = (v) => Math.round(Number(v) * 100) / 100;
const clampTarget = (v) => Math.min(100000, Math.max(0.1, round2(v) || 1));

// Cada día marcado guarda un número (las versiones antiguas guardaban 1).
const normalizeDone = (done, target = false) => Object.fromEntries(Object.entries(done || {})
  .filter(([k, v]) => isDateKey(k) && Number(v) > 0)
  .map(([k, v]) => [k, target ? Math.min(100000, round2(v)) : Math.min(999, Math.round(Number(v)) || 1)]));
const isTargetData = (h) => h.kind !== 'quit' && h.mode === 'target';

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
      // Tipo elegido al crearlo (adapta su edición). Los de versiones anteriores son 'custom'.
      type: HABIT_TYPES.some((t) => t.id === h.type) ? h.type : 'custom',
      // 'target': un toque marca la meta; 'count': cada toque suma 1 (o sí/no, con meta 1).
      mode: isTargetData(h) ? 'target' : 'count',
      measure: typeof h.measure === 'string' && MEASURES[h.measure] ? h.measure : '',
      schedule: h.kind === 'quit' ? { type: 'daily' } : normalizeSchedule(h.schedule),
      goal: h.kind === 'quit' ? 1 : isTargetData(h) ? clampTarget(h.goal) : clampGoal(h.goal),
      unit: typeof h.unit === 'string' ? h.unit.trim().slice(0, 20) : '',
      pauses: normalizePauses(h.pauses),
      archived: isDateKey(h.archived) ? h.archived : null,
      created: isDateKey(h.created) ? h.created : todayKey(),
      done: normalizeDone(h.done, isTargetData(h)),
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
  clean.health = normalizeHealth(data.health);
  clean.routines = normalizeRoutines(data.routines, clean.habits);
  clean.prefs = normalizePrefs(data.prefs);
  clean.zen = normalizeZen(data.zen);

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

let loadProblem = false; // había datos guardados que no se podían leer

function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    const data = normalize(JSON.parse(raw));
    if (data) return data;
  } catch (err) {
    console.warn('No se pudieron leer los datos guardados', err);
  }
  // Si había algo guardado que no se puede leer, se aparta antes de que el primer guardado lo pise.
  if (raw !== null) {
    loadProblem = true;
    try {
      if (localStorage.getItem(RESCUE_KEY) === null) localStorage.setItem(RESCUE_KEY, raw);
    } catch (err) {
      console.warn('No se pudieron apartar los datos', err);
    }
  }
  return emptyState();
}

// Devuelve si se pudo guardar.
function save() {
  invalidate(); // los datos han cambiado: hay que recalcular
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    toast('No se pudo guardar. ¿Estás en navegación privada?');
    return false;
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
  state.health = data.health;
  state.routines = data.routines;
  state.prefs = data.prefs;
  state.zen = data.zen;
  const saved = save();
  applyPrefs();
  render();
  return saved;
}

const findHabit = (id) => state.habits.find((h) => h.id === id);

// Hábito nuevo con los valores por defecto (diario, sin pausas).
const newHabit = (fields) => ({
  id: uid(),
  kind: 'build',
  type: 'custom',
  mode: 'count',
  measure: '',
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
  healthMetric: null, // medida que se ve en detalle en Salud (la primera activa, si no)
  healthPeriod: 30,   // días que se ven en la gráfica de Salud
  healthAvg: true,    // media de 7 días en la gráfica
  healthSel: null,    // registro elegido en la gráfica
  healthShown: 10,    // registros que se ven en la lista
  zenScreen: 'home',  // pantalla de Zen
  zenResult: null,    // lo que se enseña al terminar una práctica
  zenNotice: '',      // aviso breve arriba de Zen
  zenShown: 14,       // registros de gratitud o emociones que se ven
  zenDraft: null,     // emoción que se está eligiendo
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
// De tiempo, distancia…: un toque marca la meta. Con cantidad: esos y los contadores (meta de 2 o más).
const isTarget = (habit) => habit.mode === 'target' && habit.kind !== 'quit';
const hasAmount = (habit) => habit.kind !== 'quit' && (isTarget(habit) || habit.goal > 1);
const fmtAmount = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1, useGrouping: 'always' }); // «8.000 pasos», «5,5 km»
// "30 min", "5,5 km", "8000 pasos"
const qty = (habit, v) => `${fmtAmount.format(v)}${habit.unit ? ` ${habit.unit}` : ''}`;
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
  return { title: `${meta.title} ${level - LEVELS.length + 1}` };
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
  const what = total === 1 ? 'Protector usado' : `${total} protectores usados`;
  toast(saved.length === 1
    ? `${what}: tu racha de ${plural(saved[0].streak, 'día', 'días')} se mantiene`
    : `${what}: tus rachas se mantienen`);
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
  { id: 'perfect3', icon: 'sun', reward: 40, needs: (hs) => hs.some(isBuildDaily),
    text: () => 'Consigue 3 días perfectos', target: () => 3, value: (w) => w.perfectCount },
  { id: 'perfect5', icon: 'sparkle', reward: 60, needs: (hs) => hs.some(isBuildDaily),
    text: () => 'Consigue 5 días perfectos', target: () => 5, value: (w) => w.perfectCount },
  { id: 'perfectRow', icon: 'link', reward: 60, needs: (hs) => hs.some(isBuildDaily),
    text: () => 'Encadena 3 días perfectos seguidos', target: () => 3, value: (w) => w.perfectRow },
  { id: 'weekend', icon: 'calendar', reward: 40, needs: (hs) => hs.some(isBuildDaily),
    text: () => 'Consigue un día perfecto en fin de semana', target: () => 1, value: (w) => (w.perfect[5] || w.perfect[6] ? 1 : 0) },
  { id: 'marks', icon: 'checks', reward: 40, needs: (hs) => hs.some((h) => h.kind === 'build'),
    // 80 % de lo que toca en la semana (entre 2 y 40)
    target: (h, hs, ws) => {
      const expected = hs.filter((x) => x.kind === 'build').reduce((n, x) => n + (x.schedule.type === 'weekly'
        ? x.schedule.times : countDays(weekKeys(ws), (d) => isDue(x, d))), 0);
      return expected < 3 ? 0 : Math.max(2, Math.min(40, Math.round(expected * 0.8)));
    },
    text: (h, n) => `Marca ${n} hábitos esta semana`, value: (w) => w.marks },
  { id: 'allDue', icon: 'checkCircle', reward: 50, habit: isBuildDaily,
    text: (h) => `Completa «${h.name}» todos los días que toca`,
    target: (h, hs, ws) => countDays(weekKeys(ws), (d) => isDue(h, d)),
    value: (w, h) => countDays(w.past, (d) => isDue(h, d) && isDone(h, d)) },
  { id: 'weekly', icon: 'cycle', reward: 40, habit: (h) => h.kind === 'build' && h.schedule.type === 'weekly',
    text: (h) => `Cumple «${h.name}» ${plural(h.schedule.times, 'vez', 'veces')} esta semana`,
    target: (h) => h.schedule.times, value: (w, h) => countDays(w.past, (d) => isDone(h, d)) },
  { id: 'qty', icon: 'drop', reward: 40, habit: (h) => isBuildDaily(h) && hasAmount(h),
    text: (h, n) => `Llega a tu meta de «${h.name}» ${plural(n, 'día', 'días')}`,
    target: (h, hs, ws) => Math.min(5, countDays(weekKeys(ws), (d) => isDue(h, d))),
    value: (w, h) => countDays(w.past, (d) => isDone(h, d)) },
  { id: 'extra', icon: 'leaf', reward: 30, habit: (h) => h.kind === 'build' && h.schedule.type === 'days',
    text: (h) => `Haz un día extra de «${h.name}» (en un día de descanso)`, target: () => 1,
    value: (w, h) => countDays(w.past, (d) => isDone(h, d) && dayStatus(h, d) === 'rest') },
  { id: 'clean', icon: 'unlock', reward: 50, habit: (h) => h.kind === 'quit',
    text: (h) => `Semana entera sin recaídas en «${h.name}»`, target: () => 7,
    value: (w, h) => countDays(w.past, (d) => isDone(h, d)),
    failed: (w, h) => w.past.some((d) => hasSlip(h, d)) },
  { id: 'variety', icon: 'grid', reward: 40, needs: (hs) => hs.filter((h) => h.kind === 'build').length >= 2,
    text: () => 'Marca cada hábito al menos una vez', target: (h, hs) => hs.filter((x) => x.kind === 'build').length,
    value: (w, h, hs) => hs.filter((x) => x.kind === 'build' && w.past.some((d) => isDone(x, d))).length },
  { id: 'streak7', icon: 'flame', reward: 50, needs: (hs) => hs.some((h) => h.schedule.type !== 'weekly'),
    text: () => 'Llega a una racha de 7 días en algún hábito', target: () => 7, value: (w) => w.maxRun },
  { id: 'noShield', icon: 'shield', reward: 30, final: true, needs: (hs) => hs.some(isBuildDaily),
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
        icon: c.icon,
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
  renderHealthCard(hasHabits);
  renderZenCard(hasHabits);

  // El anillo solo cuenta lo que toca ese día (los que descansan o están en pausa, no).
  const ring = ringTotals(day, habits);
  const allDone = ring.total > 0 && ring.done === ring.total;
  const restDay = hasHabits && ring.total === 0;
  $('#day-ring').style.setProperty('--p', ring.total ? ring.done / ring.total : 0);
  $('#progress-count').innerHTML = restDay ? ICONS.leaf : `${ring.done}/${ring.total}`;
  $('#day-ring-label').textContent = restDay ? 'descanso' : allDone ? 'hecho' : isToday ? 'hoy' : 'ese día';
  // La tarjeta es un botón: su nombre tiene que contar lo mismo que se ve dentro.
  const when = isToday ? 'Hoy' : 'Ese día';
  $('#level-card').setAttribute('aria-label', [
    restDay ? `${when}, día de descanso` : `${when}: ${ring.done} de ${ring.total} hechos`,
    `Nivel ${stats.level}, ${levelInfo(stats.level).title}, ${fmtNumber.format(stats.xp - stats.levelStart)} de ${
      fmtNumber.format(stats.levelEnd - stats.levelStart)} XP`,
    `${plural(stats.shields, 'protector de racha', 'protectores de racha')} de ${SHIELD_MAX}`,
    'Ver tu progreso',
  ].join('. '));
  $('#progress-text').textContent = isToday ? 'Tus hábitos de hoy' : 'Hábitos de ese día';
  const note = $('#progress-note');
  const statuses = habits.map((h) => dayStatus(h, day));
  const activeCount = statuses.filter((status) => status === 'active' || status === 'rest').length;
  const pausedCount = statuses.filter((status) => status === 'paused').length;
  const restCount = statuses.filter((status) => status === 'rest').length;
  $('#habit-total-count').textContent = activeCount;
  const emptyNote = restCount
    ? `<strong>Día de descanso</strong>${pausedCount ? ` · ${pausedCount} en pausa` : ''}`
    : pausedCount
      ? activeCount ? `<strong>Sin tareas pendientes</strong> · ${pausedCount} en pausa` : '<strong>Todos los hábitos están en pausa</strong>'
      : activeCount ? '<strong>Meta semanal al día</strong>'
        : `<strong>${isToday ? 'Aún no hay' : 'Aún no había'} hábitos activos</strong>`;
  note.innerHTML = restDay ? emptyNote
    : allDone ? (isToday ? '<strong>Todo hecho hoy</strong>' : '<strong>Día completo</strong>')
    : `${ring.done} de ${ring.total} hechos`;
  note.classList.toggle('all-done', allDone);

  let coach = '';
  if (ui.editing) coach = 'Toca un hábito para editarlo, o arrástralo desde ☰ para cambiar el orden.';
  else if (hasHabits && stats.checkins === 0) coach = 'Toca un hábito cuando lo completes.';
  $('#coach').textContent = coach;
  $('#coach').hidden = !coach;

  // Primero lo que toca, luego lo que descansa y al final lo que está en pausa.
  // En modo edición se respeta el orden real, para poder arrastrar.
  const group = (h) => ({ active: 0, off: 0, rest: 1, paused: 2 }[dayStatus(h, day)]);
  const ordered = ui.editing ? habits : [...habits].sort((a, b) => group(a) - group(b));
  // Con rutinas, cada una va en su propio bloque (salvo en modo edición, para poder arrastrar).
  const { groups, rest } = ui.editing ? { groups: [], rest: ordered } : routineGroups(ordered);
  $('#routine-groups').innerHTML = groups.map((g, i) => routineGroupHTML(g, i, day)).join('')
    + (groups.length && rest.length ? '<h3 class="routine-title others">Otros hábitos</h3>' : '');
  $('#habit-list').innerHTML = rest.map(habitRow).join('');
  if (!hasHabits) renderWelcome();
}

// Cabecera de una rutina: su nombre y cuántos lleva ese día. Solo informa: no marca nada ni da XP.
function routineGroupHTML({ routine, habits }, index, day) {
  const { total, done } = ringTotals(day, habits);
  const complete = total > 0 && done === total;
  const count = !total ? 'Descanso' : complete ? `${ICONS.check}Completa` : `${done} de ${total}`;
  return `<section class="routine" aria-labelledby="routine-${index}">
    <div class="routine-head">
      <h3 class="routine-title" id="routine-${index}">${escapeHTML(routine.name)}</h3>
      <span class="routine-count${complete ? ' done' : ''}">${count}</span>
    </div>
    <ul class="habit-list">${habits.map(habitRow).join('')}</ul>
  </section>`;
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
  $('#level-name').textContent = `Nivel ${stats.level}`;
  $('#level-title').textContent = meta.title;
  $('#level-xp').textContent = `${fmtNumber.format(inLevel)}/${fmtNumber.format(span)} XP`;
  $('#level-fill').style.width = `${(inLevel / span) * 100}%`;
  $('#level-next').textContent = `${fmtNumber.format(stats.levelEnd - stats.xp)} XP para el nivel ${stats.level + 1}`;
  const chip = $('#shield-chip');
  chip.innerHTML = `${ICONS.shield}${stats.shields}`;
  chip.setAttribute('aria-label', `${plural(stats.shields, 'protector de racha', 'protectores de racha')} de ${SHIELD_MAX}`);
}

// Tira compacta en Hoy: "Retos de la semana · 1/3" con una barrita por reto.
function renderChallengeStrip(hasHabits) {
  const list = weekChallenges(weekStartOf(ui.today));
  const strip = $('#challenge-strip');
  strip.hidden = !hasHabits || !list.length || !state.prefs.showChallenges;
  if (strip.hidden) return;
  const done = list.filter((c) => c.done).length;
  $('#cs-count').textContent = `${done}/${list.length}`;
  strip.setAttribute('aria-label', `Retos de la semana: ${done} de ${list.length} completados. Ver detalle`);
  $('#cs-bars').innerHTML = list.map((c) => {
    const cls = c.done ? ' done' : c.failed ? ' failed' : '';
    return `<span class="cs-bar${cls}"><span style="width:${(c.value / c.target) * 100}%"></span></span>`;
  }).join('');
}

const flameHTML = (text) => `<span class="flame">${ICONS.flame}${text}</span>`;

// Semanales: "✓ 3/3 esta semana"
function weekText(habit) {
  const { times } = habit.schedule;
  const sameWeek = weekStartOf(ui.day) === weekStartOf(ui.today);
  const count = sameWeek ? streakInfo(habit).weekDone : weekCount(habit, ui.day);
  return `${count >= times ? '✓ ' : ''}${count}/${times} ${sameWeek ? 'esta semana' : 'esa semana'}`;
}

// Racha corta, para acompañar a otros datos: "5 días" o "2 semanas · 1/3 esta semana" (con el icono de racha).
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
  if (isDue(habit, today) && !isDone(habit, today)) return `${flame} · pendiente hoy`;
  const next = MILESTONES.find((m) => m > s.current);
  return next ? `${flame} · próxima meta: ${next}` : flame;
}

// Los de dejar algo: "12 días sin fumar"
function quitMeta(habit) {
  if (hasSlip(habit, ui.day)) return `Recaída${ui.day === ui.today ? ' hoy' : ''} · <u>deshacer</u>`;
  const days = plural(streakInfo(habit).current, 'día', 'días');
  return `<span class="flame">${days}</span> sin ${escapeHTML(quitWhat(habit))}`;
}

// Cantidad: "3/8 vasos"
// Contadores: "3/8 vasos". De tiempo, distancia…: "20/30 min" y, al cumplirla, lo hecho ("30 min"). Texto plano.
function amountText(habit, key) {
  if (!isTarget(habit)) return `${amountOn(habit, key)}/${habit.goal}${habit.unit ? ` ${habit.unit}` : ''}`;
  const v = habit.done[key] || 0;
  return v >= habit.goal ? qty(habit, v) : `${fmtAmount.format(v)}/${qty(habit, habit.goal)}`;
}

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
    return `<li><button type="button" class="habit" data-id="${habit.id}" style="${style}" aria-describedby="reorder-hint">
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
  } else if (hasAmount(habit)) {
    // Con cantidad: un anillo alrededor de la casilla muestra lo que llevas (--fill, de 0 a 1).
    classes.push('qty');
    style += `;--fill:${(amountOn(habit, day) / habit.goal).toFixed(3)}`;
    const extra = rest ? (done ? 'Día extra' : rest) : shortStreak(habit);
    const amount = escapeHTML(amountText(habit, day));
    meta = [`<b class="amount">${amount}</b>`, extra].filter(Boolean).join(' · ');
    if (isTarget(habit)) {
      classes.push('target');
      label = `${safeName}: ${done ? `hecho, ${amount}` : amount.replace('/', ' de ')}. Toca para ${done ? 'desmarcarlo' : 'marcar la meta'}; mantén pulsado para apuntar la cantidad`;
    } else {
      if (!done) mark = ICONS.plus;
      label = `${safeName}: ${amountOn(habit, day)} de ${habit.goal}${habit.unit ? ` ${escapeHTML(habit.unit)}` : ''}. Toca para sumar 1; mantén pulsado para restar 1`;
    }
  } else {
    meta = rest ? (done ? 'Día extra' : `${rest}${shortStreak(habit) ? ` · ${shortStreak(habit)}` : ''}`) : streakMeta(habit);
  }
  if (rest) classes.push('resting');
  // Día pasado salvado por un protector (si lo marcas, el protector vuelve).
  if (isShielded(habit, day)) {
    classes.push('shielded');
    meta = `${ICONS.shield}Protegido · la racha se mantuvo`;
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
    icon: 'play',
    title: `¿Reanudar «${habit.name}»?`,
    body: '<p>Vuelve a contar desde hoy. Los días que estuvo en pausa no rompen tu racha.</p>',
    confirmText: 'Reanudar',
  });
  if (!ok) return;
  resumeHabit(habit);
  save();
  render();
  haptic();
  toast(`«${habit.name}» reanudado`);
}

// Aplica un cambio en el día que se está viendo y enseña lo que ha pasado: XP, vibración y celebraciones.
function changeHabit(habit, button, mutate) {
  const day = ui.day;
  const before = computeStats();
  const wasPerfect = isPerfectDay(day);
  const wasDone = isDone(habit, day);
  const beforeEntry = { done: habit.done[day], slip: habit.slips[day], shield: habit.shields[day] };
  const amountBefore = habit.done[day] || 0;
  const anchor = button && button.querySelector('.check');

  hideToast();
  mutate();
  // Si marcas a mano un día que salvó un protector, el protector vuelve a tu reserva.
  const shieldBack = Boolean(habit.shields[day]) && isDone(habit, day);
  if (shieldBack) delete habit.shields[day];
  save();

  const nowDone = isDone(habit, day);
  const after = computeStats();
  const step = (habit.done[day] || 0) - amountBefore;
  if (after.xp !== before.xp) floatXp(anchor, after.xp - before.xp);
  // Pasos de cantidad que aún no llegan a la meta: "+1" o, en los de tiempo, distancia…, "+20 min"
  else if (step) floatXp(anchor, step, isTarget(habit) ? `${step > 0 ? '+' : '−'}${qty(habit, Math.abs(step))}` : step > 0 ? '+1' : '−1');
  if (nowDone !== wasDone || step) haptic();

  const hadFocus = button && document.activeElement === button;
  ui.pop = (nowDone && !wasDone) || step > 0 ? habit.id : null;
  renderToday();
  ui.pop = null;
  // Con teclado, el foco sigue en el mismo hábito tras volver a pintar la lista.
  if (hadFocus) $(`.habit[data-id="${habit.id}"]`)?.focus();

  // El aviso del protector se suma al de la celebración, si la hay, para que no se pierda.
  const shieldNote = shieldBack ? ' · el protector vuelve' : '';
  const unlocked = nowDone && !wasDone ? ACHIEVEMENTS.filter((a) => isUnlocked(a, after) && !isUnlocked(a, before)) : [];
  let message = '';
  if (nowDone && !wasDone && after.level > before.level) {
    showLevelUp(after, unlocked);
    if (shieldBack) message = 'El protector vuelve a tu reserva';
  } else if (unlocked.length) {
    const extra = unlocked.length > 1 ? ` (+${unlocked.length - 1})` : '';
    message = `Logro conseguido: ${unlocked[0].name}${extra}${shieldNote}`;
  } else if (nowDone && !wasDone && !wasPerfect && isPerfectDay(day)) {
    message = `Día completo · +${XP_PERFECT_DAY} XP${shieldNote}`;
  } else if (shieldBack) {
    message = 'El protector vuelve a tu reserva';
  }

  if (nowDone && !wasDone && habit.kind !== 'quit') {
    const afterEntry = { done: habit.done[day], slip: habit.slips[day], shield: habit.shields[day] };
    const undo = () => undoHabitDayChange(habit.id, day, beforeEntry, afterEntry);
    const showUndo = () => toast(message || 'Hábito marcado', { action: 'Deshacer', onAction: undo });
    if (after.level > before.level) levelupDialog.addEventListener('close', showUndo, { once: true });
    else showUndo();
  } else if (message) {
    toast(message);
  }
}

function undoHabitDayChange(id, day, before, after) {
  const habit = findHabit(id);
  const fields = ['done', 'slips', 'shields'];
  if (!habit || fields.some((field) => habit[field][day] !== after[field])) {
    toast('Ese hábito ya cambió; no se ha deshecho');
    return;
  }
  fields.forEach((field) => {
    if (before[field] === undefined) delete habit[field][day];
    else habit[field][day] = before[field];
  });
  save();
  render();
  haptic();
  toast('Marcado deshecho');
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
  if (isTarget(habit)) {
    // Un toque marca la meta del día (o la desmarca si ya estaba cumplida).
    changeHabit(habit, button, () => {
      if (isDone(habit, day)) delete habit.done[day];
      else habit.done[day] = habit.goal;
    });
    return;
  }
  if (habit.goal > 1) {
    const amount = amountOn(habit, day);
    if (amount >= habit.goal) {
      toast('Meta cumplida. Mantén pulsado para restar');
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

// Mantener pulsado (o la tecla −) resta 1 en los contadores; en los de tiempo, distancia… abre el deslizador.
function stepDown(habit, button) {
  const day = ui.day;
  if (isTarget(habit)) {
    if (!isPaused(habit, day)) openLog(habit);
    return;
  }
  const amount = amountOn(habit, day);
  if (!amount || habit.kind === 'quit' || isPaused(habit, day)) return;
  changeHabit(habit, button, () => {
    if (amount > 1) habit.done[day] = amount - 1;
    else delete habit.done[day];
  });
}

// ---------- Apuntar la cantidad real de un día (tiempo, distancia…) ----------

const logDialog = $('#log');
const logRange = $('#log-range');
let logFor = null;

function openLog(habit) {
  const day = ui.day;
  const spec = measureSpec(typeOf(habit.type), MEASURES[habit.measure] ? habit.measure : 'min');
  const max = Math.max(spec.max, Math.ceil((habit.goal * 2) / spec.step) * spec.step);
  logFor = { id: habit.id, day };
  $('#log-day').textContent = day === ui.today ? 'Hoy' : capitalize(fmtLong.format(parseKey(day)));
  $('#log-title').textContent = habit.name;
  logRange.min = 0;
  logRange.max = max;
  logRange.step = spec.step;
  logRange.value = habit.done[day] || habit.goal;
  $('#log-min').textContent = qty(habit, 0);
  $('#log-max').textContent = qty(habit, max);
  $('#log-goal').textContent = `Meta: ${qty(habit, habit.goal)}`;
  $('#log-clear').hidden = !habit.done[day];
  syncLog();
  logDialog.showModal();
  haptic();
}

function syncLog() {
  const habit = findHabit(logFor.id);
  const text = qty(habit, Number(logRange.value));
  $('#log-value').textContent = text;
  $('#log-value').classList.toggle('met', Number(logRange.value) >= habit.goal);
  logRange.setAttribute('aria-valuetext', text);
}
logRange.addEventListener('input', syncLog);

function saveLog(value) {
  const habit = logFor && findHabit(logFor.id);
  const day = logFor && logFor.day;
  logDialog.close();
  if (!habit || day !== ui.day) return;
  changeHabit(habit, $(`.habit[data-id="${habit.id}"]`), () => {
    if (value > 0) habit.done[day] = round2(value);
    else delete habit.done[day];
  });
}
$('#log-save').addEventListener('click', () => saveLog(Number(logRange.value)));
$('#log-clear').addEventListener('click', () => saveLog(0));
$('#log-cancel').addEventListener('click', () => logDialog.close());
logDialog.addEventListener('click', (e) => {
  if (e.target === logDialog) logDialog.close();
});

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
    icon: 'heart',
    title: day === ui.today ? '¿Has recaído hoy?' : '¿Recaíste ese día?',
    body: '<p>No pasa nada: apúntalo y sigue. La racha vuelve a empezar al día siguiente. Si te has equivocado, toca otra vez el hábito para deshacerlo.</p>',
    confirmText: 'Sí, he recaído',
  });
  if (!ok) return;
  changeHabit(habit, button, () => { habit.slips[day] = 1; });
}

// ---------- Bienvenida ----------

// Botón de un tipo (en la bienvenida y al crear un hábito)
const typeTile = (t) => `<button type="button" class="type-tile" data-type="${t.id}">
    <span class="t-emoji" aria-hidden="true">${t.id === 'custom' ? ICONS.plus : t.emoji}</span>
    <span class="type-text"><span class="type-name">${t.id === 'custom' ? 'Personalizado' : escapeHTML(t.name)}</span> <span class="type-hint">${typeHint(t)}</span></span>
  </button>`;

function renderWelcome() {
  $('#template-grid').innerHTML = WELCOME_TYPES.map((id) => typeTile(typeOf(id))).join('');
}

// Elegir un tipo no crea nada todavía: primero se abre su edición, ya adaptada.
$('#template-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-type]');
  if (btn) openSheet(null, btn.dataset.type);
});

// ---------- Pantalla "Progreso" ----------

function renderProgress() {
  const stats = computeStats();
  const meta = levelInfo(stats.level);
  const inLevel = stats.xp - stats.levelStart;
  const span = stats.levelEnd - stats.levelStart;
  const unlockedCount = ACHIEVEMENTS.filter((a) => isUnlocked(a, stats)).length;

  const hero = `<article class="card hero">
    <div class="ring" style="--p:${(inLevel / span).toFixed(3)}"><b aria-hidden="true">${stats.level}</b></div>
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

  const rule = (icon, title, text, xp) => `<li><span class="rule-icon">${ICONS[icon]}</span>
        <span class="rule-text"><b>${title}</b><span>${text}</span></span>
        <span class="rule-xp">${xp}</span></li>`;
  const rules = `<article class="card">
    <div class="card-head"><h2>Cómo ganar XP</h2></div>
    <ul class="rules">
      ${rule('checkCircle', 'Cada hábito hecho', 'Toca el hábito cuando lo completes', `+${XP_PER_CHECK}`)}
      ${rule('flame', 'Bonus de racha', '+1 por cada día (o semana) de racha', `hasta +${XP_STREAK_CAP}`)}
      ${rule('sun', 'Día perfecto', 'Todos los hábitos que tocaban ese día', `+${XP_PERFECT_DAY}`)}
      ${rule('target', 'Retos semanales', '3 cada semana, según tus hábitos', '+30 a +60')}
      ${rule('leaf', 'Día extra', 'Marcar un hábito en su día de descanso', `+${XP_PER_CHECK}`)}
      ${rule('shield', 'Día protegido', 'Salva la racha, pero no da XP', '0')}
    </ul>
    <p class="rules-note">Los días de descanso y en pausa no rompen la racha. En los hábitos para dejar algo, cada día sin recaer cuenta como hecho. Cada nivel pide un poco más de XP que el anterior. Si borras un hábito, conservas la XP que ganaste con él.</p>
  </article>`;

  const challenges = weekChallenges(weekStartOf(ui.today));
  const challengeItems = challenges.map((c) => {
    const cls = c.done ? 'done' : c.failed ? 'failed' : '';
    const status = c.done ? `Conseguido · +${c.reward} XP`
      : c.failed ? 'No conseguido'
      : c.pending ? `Se decide el domingo · +${c.reward} XP`
      : `${c.value}/${c.target} · +${c.reward} XP`;
    return `<li class="challenge ${cls}">
      <span class="ch-icon">${ICONS[c.icon]}</span>
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
    `<span class="shield-slot${i < stats.shields ? ' full' : ''}">${ICONS.shield}</span>`
  )).join('');
  const shieldsCard = `<article class="card">
    <div class="card-head"><h2>Protectores de racha</h2><span class="card-count">${stats.shields} de ${SHIELD_MAX}</span></div>
    <div class="shield-row" role="img" aria-label="${plural(stats.shields, 'protector disponible', 'protectores disponibles')}">${slots}</div>
    <p class="card-text">Ganas 1 cada vez que un hábito llega a 7, 14, 21… días seguidos (como mucho guardas ${SHIELD_MAX}). Si un día se te olvida un hábito diario con una racha de ${SHIELD_MIN_STREAK} días o más, al abrir la app se gasta solo y tu racha se mantiene. Ese día no da XP ni cuenta como día perfecto, y si luego lo marcas, el protector vuelve.</p>
    <p class="shield-stats">Ganados: ${stats.shieldsEarned} · Usados: ${stats.shieldsUsed}</p>
  </article>`;

  const roadLength = Math.max(LEVELS.length, stats.level + 1);
  const road = Array.from({ length: roadLength }, (_, i) => i + 1).map((lv) => {
    const m = levelInfo(lv);
    const status = lv < stats.level ? 'done' : lv === stats.level ? 'current' : 'locked';
    const note = status === 'done' ? 'Superado'
      : status === 'current' ? 'Estás aquí'
      : `${fmtNumber.format(xpForLevel(lv))} XP`;
    return `<div class="road-step ${status}">
      <span class="road-num"><span class="sr-only">Nivel </span>${lv}</span>
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
        <span class="badge-icon">${ICONS[a.icon]}</span>
        <b>${a.name}</b><span class="badge-desc">${a.desc}</span>
        <span class="badge-done">Conseguido</span>
      </div>`;
    }
    return `<div class="badge locked">
      <span class="badge-icon">${ICONS[a.icon]}</span>
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
    <p class="card-text">${weekRange(lastWeek)}: tus hábitos día a día, tu diario y las últimas semanas. Desde ahí también puedes preparar esta.</p>
    <button type="button" class="secondary-btn wide" data-review>${ICONS.chart}Revisar la semana pasada</button>
    <button type="button" class="link-btn center" data-summary>Ver el resumen breve</button>
  </article>` : '';

  $('#progress-view').innerHTML = hero + challengesCard + summaryCard + trendsCard() + shieldsCard + rules + roadCard + badgesCard;

  // Centrar el nivel actual en el camino.
  const roadEl = $('#road');
  const current = roadEl.querySelector('.current');
  if (current) roadEl.scrollLeft = current.offsetLeft - (roadEl.clientWidth - current.offsetWidth) / 2;
}

// ---------- Tendencias (en Progreso, plegadas) ----------

// Describen tus registros de semanas completas; no buscan causas ni predicen nada.
// Sin datos suficientes no se enseña ninguna cifra.
const TREND_PERIODS = [[4, '4 semanas'], [12, '12 semanas']];
const TREND_MIN_WEEKDAY = 3; // veces que tuvo que tocar algo un día de la semana para tenerlo en cuenta
const TREND_MIN_HABIT = 7;   // días (o veces) que tocaba un hábito en el periodo
const TREND_MIN_MOOD = 7;    // días con ánimo apuntado
const TREND_GAP = 15;        // puntos de diferencia para señalar un día de la semana
const TREND_SIMILAR = 10;    // por debajo, «parecido»
const WEEKDAY_PLURALS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];

// Las últimas `weeks` semanas completas, y las `weeks` anteriores para comparar cada hábito.
function trendData(weeks) {
  return cachedGlobal(`trends:${weeks}`, () => {
    const thisWeek = weekStartOf(ui.today);
    const from = shiftKey(thisWeek, -7 * weeks);
    const to = shiftKey(thisWeek, -1);

    // Por día de la semana: lo que tocaba y lo hecho, en los hábitos para empezar algo (sin los semanales).
    const due = Array(7).fill(0);
    const done = Array(7).fill(0);
    forEachDay(from, to, (key, weekday) => {
      for (const h of state.habits) {
        if (h.kind !== 'build' || !isDue(h, key, weekday)) continue;
        due[weekday]++;
        if (isDone(h, key)) done[weekday]++;
      }
    });
    const rates = due.map((n, i) => (n >= TREND_MIN_WEEKDAY ? done[i] / n : null));

    // Por hábito, con las mismas cuentas que el resumen de cada semana.
    const totals = (start) => {
      const map = new Map();
      for (let i = 0; i < weeks; i++) {
        weekSummary(shiftKey(start, 7 * i)).rows.forEach((r) => {
          const t = map.get(r.habit) || { due: 0, done: 0 };
          t.due += r.due;
          t.done += r.done;
          map.set(r.habit, t);
        });
      }
      return map;
    };
    const now = totals(from);
    const before = totals(shiftKey(from, -7 * weeks));
    const habits = visibleHabits().filter((h) => now.has(h) && now.get(h).due >= TREND_MIN_HABIT).map((h) => {
      const n = now.get(h);
      const b = before.get(h);
      return { habit: h, now: n.done / n.due, before: b && b.due >= TREND_MIN_HABIT ? b.done / b.due : null };
    });

    const moods = [];
    forEachDay(from, to, (key) => {
      const mood = (state.days[key] || {}).mood;
      if (mood) moods.push(mood);
    });
    return {
      from,
      to,
      weekday: { rates, due, enough: rates.filter((r) => r !== null).length >= 2 },
      habits,
      mood: {
        count: moods.length,
        avg: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
        enough: moods.length >= TREND_MIN_MOOD,
      },
    };
  });
}

const pctText = (r) => `${Math.round(r * 100)} %`;

function weekdayObservation(rates) {
  const known = rates.map((r, i) => [r, i]).filter(([r]) => r !== null);
  const [maxR, maxI] = known.reduce((a, b) => (b[0] > a[0] ? b : a));
  const [minR, minI] = known.reduce((a, b) => (b[0] < a[0] ? b : a));
  if (Math.round(maxR * 100) - Math.round(minR * 100) < TREND_GAP) {
    return `Entre días de la semana hay poca diferencia: del ${pctText(minR)} al ${pctText(maxR)} de lo que tocaba.`;
  }
  return `Los ${WEEKDAY_PLURALS[maxI]} completaste el ${pctText(maxR)} de lo que tocaba; los ${WEEKDAY_PLURALS[minI]}, el ${pctText(minR)}.`;
}

function habitTrendText({ habit, now, before }, weeks) {
  const base = habit.kind === 'quit' ? `${pctText(now)} de los días sin ${escapeHTML(quitWhat(habit))}` : `${pctText(now)} de lo que tocaba`;
  if (before === null) return `${base} · aún no hay datos suficientes de las ${weeks} semanas anteriores`;
  const diff = Math.round(now * 100) - Math.round(before * 100);
  const how = diff >= TREND_SIMILAR ? 'más que en' : diff <= -TREND_SIMILAR ? 'menos que en' : 'parecido a';
  return `${base} · ${how} las ${weeks} semanas anteriores (${pctText(before)})`;
}

function trendsCard() {
  if (!visibleHabits().length) return '';
  const weeks = ui.trendWeeks || TREND_PERIODS[0][0];
  const t = trendData(weeks);
  const picker = `<div class="segmented two" role="radiogroup" aria-label="Periodo analizado">${
    TREND_PERIODS.map(([n, text]) => `<button type="button" role="radio" data-trend-weeks="${n}" aria-checked="${n === weeks}">${text}</button>`).join('')}</div>`;
  const notEnough = (text) => `<p class="trend-empty">${text}</p>`;

  const weekday = t.weekday.enough
    ? `${miniBars(t.weekday.rates.map((r, i) => ({
      value: r, text: r === null ? '—' : pctText(r), empty: 'pocos datos', label: WEEKDAYS[i], name: WEEKDAY_NAMES[i], em: true,
    })), 'Lo completado de lo que tocaba, por día de la semana')}
      <p class="trend-text">${weekdayObservation(t.weekday.rates)}</p>`
    : notEnough('Aún no hay datos suficientes para comparar los días de la semana en este periodo.');

  const habitItems = t.habits.map((x) => `<li style="--c:${colorHex(x.habit.color)}">
      <span class="emoji" aria-hidden="true">${escapeHTML(x.habit.emoji)}</span>
      <span class="review-habit"><b>${escapeHTML(x.habit.name)}</b><span>${habitTrendText(x, weeks)}</span></span>
    </li>`).join('');
  const habits = habitItems ? `<ul class="review-list trend-list">${habitItems}</ul>`
    : notEnough(`Aún no hay datos suficientes de ningún hábito: hace falta que toque al menos ${TREND_MIN_HABIT} veces en este periodo.`);

  const mood = t.mood.enough
    ? `<p class="trend-text">Apuntaste tu ánimo ${t.mood.count} de ${weeks * 7} días. Media: ${t.mood.avg.toFixed(1).replace('.', ',')} de 5.</p>`
    : notEnough(`${t.mood.count ? `Hay ${plural(t.mood.count, 'día', 'días')} con ánimo apuntado` : 'No hay días con ánimo apuntado'}; con ${TREND_MIN_MOOD} o más verás aquí la media.`);

  return `<details class="card trends" id="trends"${ui.trendsOpen ? ' open' : ''}>
    <summary class="trends-summary">
      <span class="card-title"><h2>Tendencias</h2><span class="card-sub">Observaciones de tus registros</span></span>
      ${ICONS.chevronRight}
    </summary>
    <div class="trends-body">
      ${picker}
      <p class="card-text">Del ${shortDate(t.from)} al ${shortDate(t.to)}: ${weeks} semanas completas. Describen lo que registraste; no explican por qué ni predicen nada.</p>
      <h3 class="trend-title">Por día de la semana</h3>
      ${weekday}
      <h3 class="trend-title">Por hábito</h3>
      ${habits}
      <h3 class="trend-title">Ánimo</h3>
      ${mood}
    </div>
  </details>`;
}

const progressView = $('#progress-view');
// El evento «toggle» no sube: se escucha en la fase de captura.
progressView.addEventListener('toggle', (e) => {
  if (e.target.id === 'trends') ui.trendsOpen = e.target.open;
}, true);
progressView.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-trend-weeks]');
  if (!btn) return;
  ui.trendWeeks = Number(btn.dataset.trendWeeks);
  renderProgress();
  haptic();
  progressView.querySelector(`[data-trend-weeks="${ui.trendWeeks}"]`)?.focus();
});

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
      <div class="empty-icon">${ICONS.calendar}</div>
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
      hasAmount(h) ? `Meta: ${escapeHTML(qty(h, h.goal))}` : '',
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
      } else if (key === today) {
        // Hoy es la casilla por la que se entra con el tabulador; desde ella, las flechas recorren los días.
        cells += `<i class="${classOf(key)} today" data-k="${key}" tabindex="0" role="button" aria-label="${escapeHTML(dayCaption(id, key))}"></i>`;
      } else {
        cells += `<i class="${classOf(key)}" data-k="${key}"></i>`;
      }
    }
    months += `<span>${monthLabel}</span>`;
  }

  return `<div class="heatmap" data-habit="${id}" role="group" aria-label="Mapa de calor de los últimos 12 meses. Usa las flechas para moverte por los días e Intro para abrir uno.">
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
    const moodText = mood ? ` · Ánimo: ${MOOD_NAMES[mood - 1].toLowerCase()}` : '';
    if (total) return `${label} · ${done} de ${total}${moodText}`;
    return `${label} · ${habits.some((h) => dayStatus(h, key) !== 'off') ? 'Día de descanso' : 'sin hábitos'}${moodText}`;
  }
  const habit = findHabit(habitId);
  if (!habit) return label;
  const status = dayStatus(habit, key);
  const amount = hasAmount(habit) ? amountText(habit, key) : '';
  if (hasSlip(habit, key)) return `${label} · Recaída`;
  if (isShielded(habit, key)) return `${label} · Protegido`;
  if (isDone(habit, key)) {
    if (habit.kind === 'quit') return `${label} · Sin recaer`;
    return `${label} · ${status === 'active' ? 'Hecho' : 'Hecho (día extra)'}${amount ? ` · ${amount}` : ''}`;
  }
  const text = { paused: 'En pausa', rest: 'Día de descanso', off: 'Aún no existía' }[status]
    || (amount && amountOn(habit, key) ? amount : 'Sin hacer');
  return `${label} · ${text}`;
}

// ---------- Pantalla "Salud" ----------

// Solo describe tus medidas: sin XP ni rachas, sin consejos y sin juicios sobre si suben o bajan.
const HEALTH_PERIODS = [[30, '30 días'], [90, '90 días'], [365, '1 año']];
const HEALTH_BEFORE = { 30: 'los 30 días anteriores', 90: 'los 90 días anteriores', 365: 'el año anterior' };
const HEALTH_PAGE = 20;
const HEALTH_CHART_DOTS = 40; // con más registros en el periodo, solo se dibuja la línea
const HEALTH_AVG_DAYS = 7;
const HEALTH_TAGS = ['en ayunas', 'por la mañana', 'por la noche', 'tras entrenar', 'tras comer'];
const roundTo = (v, d) => Math.round((Number(v) + Number.EPSILON) * 10 ** d) / 10 ** d;
const healthFormats = {};
const fmtHealthN = (d) => healthFormats[d]
  || (healthFormats[d] = new Intl.NumberFormat('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }));
const fmtHealthInput = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, useGrouping: false });
const fmtList = new Intl.ListFormat('es', { type: 'conjunction' });
const healthUnit = (metric) => state.health.units[metric];
const healthSymbol = (metric, unit = healthUnit(metric)) => HEALTH_METRICS[metric].units[unit].symbol;
const healthLabel = (metric) => HEALTH_METRICS[metric].label;
// Ejemplo para las pistas y los errores, en la unidad elegida.
const healthExample = (metric) => HEALTH_METRICS[metric].units[healthUnit(metric)].example || HEALTH_METRICS[metric].example;
// «Peso (kg)», pero «Pasos» (sin repetir la unidad cuando es el mismo nombre).
function healthFieldLabel(metric) {
  const symbol = healthSymbol(metric);
  return symbol.toLowerCase() === healthLabel(metric).toLowerCase() ? healthLabel(metric) : `${healthLabel(metric)} (${symbol})`;
}

function convertHealth(metric, value, from, to) {
  if (from === to) return value;
  const { units } = HEALTH_METRICS[metric];
  const base = value * units[from].toBase + (units[from].offset || 0);
  return (base - (units[to].offset || 0)) / units[to].toBase;
}

// Registros de una medida, del más antiguo al más reciente, con `shown` en la unidad preferida
// (y `shown2`, la diastólica, en la tensión).
function healthSeries(metric) {
  const unit = healthUnit(metric);
  return state.health.entries
    .filter((e) => e.metric === metric)
    .map((e) => ({ ...e, shown: convertHealth(metric, e.value, e.unit, unit), ...(e.value2 !== undefined ? { shown2: e.value2 } : {}) }));
}

// Último registro y su diferencia con el anterior, con el mismo redondeo que se ve en pantalla.
function healthLatest(metric) {
  const series = healthSeries(metric);
  const last = series.at(-1) || null;
  const prev = series.at(-2) || null;
  const d = HEALTH_METRICS[metric].decimals;
  const delta = (a, b) => roundTo(roundTo(a, d) - roundTo(b, d), d);
  return {
    last,
    prev,
    diff: last && prev ? delta(last.shown, prev.shown) : null,
    diff2: last && prev && last.shown2 !== undefined ? delta(last.shown2, prev.shown2) : null,
  };
}

const healthNumber = (value, decimals = 1) => fmtHealthN(decimals).format(roundTo(value, decimals));
const healthText = (value, unit, decimals = 1) => `${healthNumber(value, decimals)} ${unit}`;
// El número de un registro ya convertido: «72,4», «120/80», «8.000».
const healthEntryValue = (metric, e) => (e.shown2 !== undefined
  ? `${healthNumber(e.shown, 0)}/${healthNumber(e.shown2, 0)}` : healthNumber(e.shown, HEALTH_METRICS[metric].decimals));
const healthEntryText = (metric, e) => `${healthEntryValue(metric, e)} ${healthSymbol(metric)}${e.pulse ? ` · pulso ${e.pulse}` : ''}`;
const signed = (v, d) => (v === 0 ? '0' : `${v > 0 ? '+' : '−'}${healthNumber(Math.abs(v), d)}`);
// "+0,4 kg" o "−0,3 kg" (en la tensión, "+5/−2 mmHg"), siempre con el mismo tono: ni subir ni bajar es bueno o malo.
function healthDiffText(diff, unit, decimals = 1, diff2 = null) {
  if (diff2 !== null) return diff === 0 && diff2 === 0 ? 'Sin cambios' : `${signed(diff, 0)}/${signed(diff2, 0)} ${unit}`;
  return diff === 0 ? 'Sin cambios' : `${signed(diff, decimals)} ${unit}`;
}
const healthInputText = (entry, unit) => fmtHealthInput.format(round2(convertHealth(entry.metric, entry.value, entry.unit, unit)));
// "72,4" o "72.4" → 72.4. NaN si no es un número con 2 decimales como mucho.
const parseDecimal = (text) => (/^\s*\d{1,4}([.,]\d{1,2})?\s*$/.test(String(text)) ? Number(String(text).trim().replace(',', '.')) : NaN);
// Enteros, con separador de miles o sin él: «8000», «8.000» u «8 000». NaN si no.
function parseInteger(text) {
  const t = String(text).trim();
  return /^\d{1,6}$/.test(t) || /^\d{1,3}([.\s]\d{3})+$/.test(t) ? Number(t.replace(/[.\s]/g, '')) : NaN;
}
const parseHealthValue = (metric, text) => (HEALTH_METRICS[metric].decimals ? parseDecimal(text) : parseInteger(text));

function healthDateLabel(key) {
  if (key === ui.today) return 'Hoy';
  if (key === shiftKey(ui.today, -1)) return 'Ayer';
  const date = parseKey(key);
  const fmt = date.getFullYear() === parseKey(ui.today).getFullYear() ? fmtCaption : fmtCaptionYear;
  return capitalize(fmt.format(date).replace(/\./g, ''));
}

// ---------- Validar y guardar ----------

const rangeText = (range, symbol) => `entre ${fmtAmount.format(range.min)} y ${fmtAmount.format(range.max)} ${symbol}`;
const healthDateError = (date) => (!isRealDate(date) ? 'Elige una fecha.' : date > ui.today ? 'La fecha no puede ser posterior a hoy.' : '');
const cleanNote = (note) => String(note || '').trim().slice(0, HEALTH_NOTE_MAX);

// Lo escrito para una medida: { errors } (uno por campo: value, value2, pulse) o { fields } para guardar.
function readHealthInput(metric, { valueText = '', value2Text = '', pulseText = '' }) {
  const m = HEALTH_METRICS[metric];
  const unit = healthUnit(metric);
  const symbol = healthSymbol(metric);
  const errors = {};
  const value = parseHealthValue(metric, valueText);
  if (!Number.isFinite(value)) errors.value = `Escribe un número${m.decimals ? '' : ' entero'}, por ejemplo ${healthExample(metric)}.`;
  else if (!inHealthRange(metric, value, unit)) errors.value = `Escribe un valor ${rangeText(m.units[unit], symbol)}.`;
  const fields = { value: healthRound(metric, value), unit };
  if (m.pair) {
    const value2 = parseInteger(value2Text);
    if (!Number.isFinite(value2)) errors.value2 = `Escribe la diastólica, por ejemplo ${m.second.example}.`;
    else if (!inRange(value2, m.second)) errors.value2 = `La diastólica tiene que estar ${rangeText(m.second, symbol)}.`;
    else if (!errors.value && value2 >= value) errors.value2 = 'La diastólica tiene que ser menor que la sistólica.';
    fields.value2 = value2;
    if (String(pulseText).trim()) {
      const pulse = parseInteger(pulseText);
      if (!inRange(pulse, m.pulse)) errors.pulse = `El pulso tiene que estar ${rangeText(m.pulse, 'lpm')}.`;
      else fields.pulse = pulse;
    }
  }
  return Object.keys(errors).length ? { errors } : { fields };
}

// Guarda un registro nuevo (sin id) o editado, en la unidad preferida. Devuelve { errors } o { entry }.
function saveHealthEntry(metric, { id = null, valueText, value2Text, pulseText, date, note = '' }) {
  const read = readHealthInput(metric, { valueText, value2Text, pulseText });
  const errors = { ...read.errors };
  if (healthDateError(date)) errors.date = healthDateError(date);
  if (Object.keys(errors).length) return { errors };
  const fields = { ...read.fields, date, note: cleanNote(note) };
  let entry = id && state.health.entries.find((e) => e.id === id);
  if (entry) {
    // Si no se ha tocado el valor, se queda tal como se apuntó (quizá en la otra unidad).
    if (String(valueText).trim() === healthInputText(entry, fields.unit)) {
      delete fields.value;
      delete fields.unit;
    }
    if (!('pulse' in fields)) delete entry.pulse;
    Object.assign(entry, fields);
  } else {
    entry = { id: uid(), metric, created: Date.now(), ...fields };
    state.health.entries.push(entry);
  }
  state.health.entries.sort(byHealthDate);
  save();
  return { entry };
}

// Registro rápido: varias medidas del mismo día a la vez. Si algo no es válido, no se guarda nada.
// Los errores llevan la medida delante: «waist.value», «bloodPressure.value2»…
function saveHealthBatch({ date, note = '', values }) {
  const errors = {};
  const typed = (texts) => [texts.valueText, texts.value2Text, texts.pulseText].some((t) => String(t || '').trim());
  const filled = Object.entries(values).filter(([, texts]) => typed(texts));
  if (healthDateError(date)) errors.date = healthDateError(date);
  if (!filled.length) errors.form = 'Apunta al menos una medida.';
  const ready = [];
  filled.forEach(([metric, texts]) => {
    const read = readHealthInput(metric, texts);
    if (read.errors) Object.entries(read.errors).forEach(([part, message]) => { errors[`${metric}.${part}`] = message; });
    else ready.push({ metric, fields: read.fields });
  });
  if (Object.keys(errors).length) return { errors };
  const now = Date.now();
  const entries = ready.map(({ metric, fields }, i) => ({ id: uid(), metric, created: now + i, ...fields, date, note: cleanNote(note) }));
  state.health.entries.push(...entries);
  state.health.entries.sort(byHealthDate);
  save();
  return { entries };
}

function deleteHealthEntry(id) {
  state.health.entries = state.health.entries.filter((e) => e.id !== id);
  save();
}

// Notas rápidas: tocar una etiqueta la añade a la nota (o la quita, si ya estaba).
const sameTag = (part, tag) => part.trim().toLocaleLowerCase('es') === tag;
const hasTag = (note, tag) => String(note).split(',').some((part) => sameTag(part, tag));
function toggleTag(note, tag) {
  const parts = String(note).split(',').map((s) => s.trim()).filter(Boolean);
  const at = parts.findIndex((part) => sameTag(part, tag));
  if (at >= 0) parts.splice(at, 1);
  else parts.push(tag);
  const text = parts.join(', ');
  return (text.charAt(0).toLocaleUpperCase('es') + text.slice(1)).slice(0, HEALTH_NOTE_MAX);
}

// ---------- Consultar: media de 7 días, estadísticas y comparación ----------

// Media de los registros de los 7 días que acaban en la fecha de cada uno (sin inventar los días sin datos).
function movingAverage(series, days = HEALTH_AVG_DAYS) {
  return series.map((e, i) => {
    const from = shiftKey(e.date, -(days - 1));
    let sum = 0;
    let n = 0;
    for (let j = i; j >= 0 && series[j].date >= from; j--) {
      sum += series[j].shown;
      n++;
    }
    return { id: e.id, date: e.date, value: sum / n };
  });
}

const mean = (list) => list.reduce((a, b) => a + b, 0) / list.length;
// Media, mínimo, máximo y cambio del primer al último registro (en la tensión, de los dos valores).
function healthStats(entries) {
  const pick = (key) => {
    const values = entries.map((e) => e[key]);
    return { mean: mean(values), min: Math.min(...values), max: Math.max(...values), change: values.at(-1) - values[0] };
  };
  return { count: entries.length, main: pick('shown'), second: entries[0].shown2 !== undefined ? pick('shown2') : null };
}

// Las medias del periodo y de los mismos días justo antes, si hay registros en los dos.
function comparePeriods(series, period, today = ui.today) {
  const from = shiftKey(today, -(period - 1));
  const prevFrom = shiftKey(from, -period);
  const now = series.filter((e) => e.date >= from && e.date <= today);
  const before = series.filter((e) => e.date >= prevFrom && e.date < from);
  return now.length && before.length ? { now: healthStats(now), before: healthStats(before) } : null;
}

// Escala limpia para el eje: 0,5 · 1 · 2 · 2,5 · 5 · 10…
function niceStep(range, count = 3) {
  const raw = range / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

// Gráfica de los registros del periodo (de `from` a hoy): línea para niveles, columnas desde cero para
// totales del día y barras de diastólica a sistólica para la tensión, con la media de 7 días si se pide.
// Devuelve el SVG y dónde queda cada registro, para tocarlos o recorrerlos con el teclado.
function healthChart(series, from, width, { kind = 'line', decimals = 1, span = 1, average = null } = {}) {
  const height = 176;
  const values = series.flatMap((e) => (e.shown2 !== undefined ? [e.shown, e.shown2] : [e.shown])).map((v) => roundTo(v, decimals));
  if (average) average.forEach((a) => values.push(a.value));
  let lo = kind === 'bars' ? 0 : Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < span) {
    const mid = (hi + lo) / 2;
    if (kind === 'bars') hi = span;
    else [lo, hi] = [mid - span / 2, mid + span / 2];
  }
  const step = niceStep(hi - lo);
  const y0 = kind === 'bars' ? 0 : Math.floor(lo / step) * step;
  const y1 = Math.ceil(hi / step) * step;
  const ticks = Array.from({ length: Math.round((y1 - y0) / step) + 1 }, (_, i) => round2(y0 + i * step));
  const labels = ticks.map((v) => fmtAmount.format(v));
  const pad = { top: 10, right: 12, bottom: 26, left: Math.max(30, 14 + Math.max(...labels.map((l) => l.length)) * 6.5) };
  const days = Math.round((parseKey(ui.today) - parseKey(from)) / 864e5) + 1;
  const plot = width - pad.left - pad.right;
  const span2 = parseKey(ui.today) - parseKey(from) || 1;
  const x = (key) => pad.left + ((parseKey(key) - parseKey(from)) / span2) * plot;
  const y = (v) => pad.top + (1 - (v - y0) / (y1 - y0)) * (height - pad.top - pad.bottom);
  const r = (n) => n.toFixed(1);
  const base = height - pad.bottom;

  const grid = ticks.map((v, i) => `<line class="hc-grid" x1="${r(pad.left)}" x2="${width - pad.right}" y1="${r(y(v))}" y2="${r(y(v))}"/>
    <text class="hc-axis" x="${r(pad.left - 8)}" y="${r(y(v))}" dy="0.35em" text-anchor="end">${labels[i]}</text>`).join('');
  const axis = `<text class="hc-axis" x="${r(pad.left)}" y="${base + 18}">${shortDate(from)}</text>
    <text class="hc-axis" x="${width - pad.right}" y="${base + 18}" text-anchor="end">Hoy</text>`;
  const points = series.map((e) => ({ id: e.id, x: x(e.date), y: y(roundTo(e.shown, decimals)) }));
  const soft = average ? ' soft' : '';
  const dot = (p, cls = '') => `<circle class="hc-dot${cls}" cx="${r(p.x)}" cy="${r(p.y)}" r="4"/>`;
  let marks = '';
  if (kind === 'bars') {
    const w = Math.min(24, Math.max(2, (plot / days) * 0.6));
    marks = points.map((p) => {
      const rr = Math.min(4, w / 2, base - p.y);
      return `<path class="hc-bar${soft}" d="M${r(p.x - w / 2)},${base} V${r(p.y + rr)} a${r(rr)},${r(rr)} 0 0 1 ${r(rr)},${r(-rr)} H${r(p.x + w / 2 - rr)} a${r(rr)},${r(rr)} 0 0 1 ${r(rr)},${r(rr)} V${base} Z"/>`;
    }).join('');
  } else if (kind === 'range') {
    marks = series.map((e, i) => {
      const p = points[i];
      const low = { x: p.x, y: y(e.shown2) };
      return `<line class="hc-range" x1="${r(p.x)}" x2="${r(p.x)}" y1="${r(low.y)}" y2="${r(p.y)}"/>${dot(p)}${dot(low)}`;
    }).join('');
  } else {
    const line = `<path class="hc-line${soft}" d="M${points.map((p) => `${r(p.x)},${r(p.y)}`).join('L')}"/>`;
    marks = line + (points.length <= HEALTH_CHART_DOTS ? points.map((p) => dot(p, soft)).join('') : dot(points.at(-1), soft));
  }
  const avgLine = average && average.length > 1
    ? `<path class="hc-avg" d="M${average.map((a) => `${r(x(a.date))},${r(y(a.value))}`).join('L')}"/>` : '';
  const svgText = `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">${grid}${axis}
    <line class="hc-cross" y1="${pad.top}" y2="${base}"/>${marks}${avgLine}<circle class="hc-sel" r="5"/></svg>`;
  return { svg: svgText, points };
}

// ---------- Pintar la pantalla ----------

let healthPoints = [];

function renderHealth() {
  const root = $('#health-view');
  const metrics = state.health.metrics;
  if (!metrics.includes(ui.healthMetric)) ui.healthMetric = metrics[0] || null;
  healthPoints = [];
  const settings = healthSettingsCard() + healthReminderCard();

  if (!metrics.length) {
    root.innerHTML = `<div class="empty health-empty">
      <div class="empty-icon">${ICONS.heart}</div>
      <h2>No tienes medidas a la vista</h2>
      <p>Elige qué quieres apuntar: peso, cintura, tensión, sueño…</p>
      <button type="button" class="primary-btn" data-health-metrics>Elegir medidas</button>
    </div>${settings}`;
    return;
  }

  const intro = state.health.entries.length ? '' : `<p class="coach health-coach">Apunta tus medidas cuando quieras. Es opcional y no cuenta para tu XP ni tus rachas. Con «Elegir medidas», abajo, puedes añadir otras.</p>`;
  const tiles = `<div class="health-tiles" role="group" aria-label="Tus medidas">${metrics.map(healthTile).join('')}</div>`;
  const quick = metrics.length > 1
    ? `<button type="button" class="secondary-btn wide health-quick" data-health-quick>${ICONS.plus}Registro rápido</button>` : '';
  root.innerHTML = intro + tiles + quick + healthDetailCard(ui.healthMetric, root) + healthListCard(ui.healthMetric) + settings;
  if (ui.healthSel) selectHealthPoint(ui.healthSel);
}

// Tarjeta de una medida en el resumen: su último valor. Tocarla la abre debajo.
function healthTile(metric) {
  const { last } = healthLatest(metric);
  return `<button type="button" class="health-tile" data-health-metric="${metric}" aria-pressed="${metric === ui.healthMetric}">
    <span class="ht-label">${healthLabel(metric)}</span>
    <span class="ht-value">${last ? `${healthEntryValue(metric, last)}<small>${healthSymbol(metric)}</small>` : '—'}</span>
    <span class="ht-sub">${last ? healthDateLabel(last.date) : 'Sin registros'}</span>
  </button>`;
}

function healthDetailCard(metric, root) {
  const m = HEALTH_METRICS[metric];
  const symbol = healthSymbol(metric);
  const series = healthSeries(metric);
  const { last, prev, diff, diff2 } = healthLatest(metric);
  const head = `<div class="card-head"><h2>${m.label}</h2>
    <button type="button" class="text-btn" data-health-add="${metric}">${ICONS.plus}Registrar</button></div>`;
  if (!last) {
    return `<article class="card health-detail">${head}
      <p class="card-text">Aún no hay registros. Cuando apuntes ${m.label.toLowerCase()}, aquí verás su evolución, la media y cómo cambia.</p>
    </article>`;
  }
  const when = !prev ? '' : prev.date === ui.today ? 'de hoy'
    : prev.date === shiftKey(ui.today, -1) ? 'de ayer' : `del ${shortDate(prev.date)}`;
  const summary = `<p class="health-value">${healthEntryValue(metric, last)}<span>${symbol}</span></p>
    <p class="health-diff">${prev ? `${healthDiffText(diff, symbol, m.decimals, diff2)} respecto al registro anterior, ${when}` : 'Es tu primer registro.'}${
      last.pulse ? ` · Pulso: ${last.pulse} lpm` : ''}</p>
    ${last.note ? `<p class="health-note">${escapeHTML(last.note)}</p>` : ''}`;

  const period = ui.healthPeriod;
  const from = shiftKey(ui.today, -(period - 1));
  const inPeriod = series.filter((e) => e.date >= from && e.date <= ui.today);
  const periodName = HEALTH_PERIODS.find(([d]) => d === period)[1];
  const picker = `<div class="segmented period-picker" role="radiogroup" aria-label="Periodo">${
    HEALTH_PERIODS.map(([d, text]) => `<button type="button" role="radio" data-health-period="${d}" aria-checked="${d === period}">${text}</button>`).join('')}</div>`;
  const canAverage = m.chart !== 'range';
  const avgToggle = canAverage && inPeriod.length > 1
    ? `<button type="button" class="toggle-chip" data-health-avg aria-pressed="${ui.healthAvg}">Media de ${HEALTH_AVG_DAYS} días</button>` : '';

  let chartBody;
  if (inPeriod.length < 2) {
    chartBody = `<p class="card-text health-chart-empty">${inPeriod.length
      ? 'En este periodo solo hay 1 registro. Con 2 o más verás aquí la evolución.'
      : 'No hay registros en este periodo.'}</p>`;
  } else {
    const width = Math.max(260, Math.round((root.clientWidth || 358) - 34));
    const average = canAverage && ui.healthAvg ? movingAverage(series).filter((a) => a.date >= from && a.date <= ui.today) : null;
    const chart = healthChart(inPeriod, from, width, { kind: m.chart, decimals: m.decimals, span: m.span, average });
    healthPoints = chart.points;
    const stats = healthStats(inPeriod);
    const rangeWords = stats.second
      ? `sistólica entre ${healthNumber(stats.main.min, 0)} y ${healthNumber(stats.main.max, 0)}, diastólica entre ${healthNumber(stats.second.min, 0)} y ${healthNumber(stats.second.max, 0)} ${symbol}`
      : `entre ${healthText(stats.main.min, symbol, m.decimals)} y ${healthText(stats.main.max, symbol, m.decimals)}`;
    const legend = average
      ? `<div class="hc-legend" aria-hidden="true"><span><i class="raw"></i>Registros</span><span><i class="avg"></i>Media de ${HEALTH_AVG_DAYS} días</span></div>`
      : m.chart === 'range' ? '<p class="hc-legend">Cada barra va de la diastólica (abajo) a la sistólica (arriba).</p>' : '';
    chartBody = `<div class="health-chart" id="health-chart" tabindex="0" role="group"
        aria-label="Gráfica de ${m.label.toLowerCase()}, ${periodName}: ${plural(inPeriod.length, 'registro', 'registros')}, ${rangeWords}${average ? `, con la media de ${HEALTH_AVG_DAYS} días` : ''}. Usa las flechas para recorrerlos."
        aria-describedby="health-caption">${chart.svg}</div>
      ${legend}
      <p class="health-caption" id="health-caption" aria-live="polite">Toca la gráfica para ver cada registro</p>
      ${healthStatsHTML(metric, inPeriod, series)}`;
  }
  return `<article class="card health-detail">${head}${summary}${picker}${avgToggle}${chartBody}</article>`;
}

// Media, mínimo, máximo y cambio del periodo, y la media de los mismos días justo antes.
function healthStatsHTML(metric, inPeriod, series) {
  const m = HEALTH_METRICS[metric];
  const d = m.decimals;
  const symbol = healthSymbol(metric);
  const s = healthStats(inPeriod);
  const pair = (key, fmt) => (s.second ? `${fmt(s.main[key], 0)}/${fmt(s.second[key], 0)}` : fmt(s.main[key], d));
  const tiles = [
    ['Media', pair('mean', healthNumber)],
    ['Mínimo', pair('min', healthNumber)],
    ['Máximo', pair('max', healthNumber)],
    ['Del primero al último', pair('change', (v, dd) => signed(roundTo(v, dd), dd))],
  ];
  const cmp = comparePeriods(series, ui.healthPeriod);
  let compare = `Sin registros en ${HEALTH_BEFORE[ui.healthPeriod]} para comparar.`;
  if (cmp) {
    const before = s.second
      ? `${healthNumber(cmp.before.main.mean, 0)}/${healthNumber(cmp.before.second.mean, 0)}` : healthNumber(cmp.before.main.mean, d);
    const gap = (now, prev, dd) => signed(roundTo(roundTo(now, dd) - roundTo(prev, dd), dd), dd);
    const difference = s.second
      ? `${gap(cmp.now.main.mean, cmp.before.main.mean, 0)}/${gap(cmp.now.second.mean, cmp.before.second.mean, 0)}`
      : gap(cmp.now.main.mean, cmp.before.main.mean, d);
    compare = `Media de ${HEALTH_BEFORE[ui.healthPeriod]}: ${before} ${symbol} (${plural(cmp.before.count, 'registro', 'registros')}). Diferencia entre las medias: ${difference} ${symbol}.`;
  }
  return `<div class="stats four">${tiles.map(([label, value]) => `<div class="stat"><b>${value}</b><span>${label} (${symbol})</span></div>`).join('')}</div>
    <p class="health-compare">${compare}</p>`;
}

function healthListCard(metric) {
  const series = healthSeries(metric);
  if (!series.length) return '';
  const rows = [...series].reverse().slice(0, ui.healthShown).map((e) => {
    const text = healthEntryText(metric, e);
    const note = e.note ? escapeHTML(e.note) : '';
    return `<li><button type="button" class="health-row" data-health-edit="${escapeHTML(e.id)}"
        aria-label="${healthDateLabel(e.date)}: ${text}${note ? `. ${note}` : ''}. Editar">
      <span class="health-row-text"><b>${healthDateLabel(e.date)}</b>${note ? `<span>${note}</span>` : ''}</span>
      <span class="health-row-value">${text}</span>
      <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
    </button></li>`;
  }).join('');
  const rest = series.length - ui.healthShown;
  return `<article class="card">
    <div class="card-head"><h2>Registros de ${healthLabel(metric).toLowerCase()}</h2><span class="card-count">${series.length}</span></div>
    <ul class="health-list">${rows}</ul>
    ${rest > 0 ? `<button type="button" class="link-btn center" data-health-more>Mostrar ${Math.min(rest, HEALTH_PAGE)} más</button>` : ''}
  </article>`;
}

function healthSettingsCard() {
  const count = state.health.entries.length;
  return `<article class="card">
    <div class="card-head"><h2>Medidas y privacidad</h2></div>
    <div class="health-buttons">
      <button type="button" class="secondary-btn wide" data-health-metrics>${ICONS.grid}Elegir medidas y unidades</button>
      ${count ? `<button type="button" class="secondary-btn wide" data-health-csv>${ICONS.download}Exportar a CSV</button>` : ''}
    </div>
    <p class="card-text">Tus registros de Salud solo se guardan en este dispositivo y en las copias que exportes. No dan XP ni cuentan para rachas o retos, y Bonsái no los interpreta ni da consejos médicos. Cada registro se guarda en la unidad en que lo apuntaste; si cambias de unidad, se muestran convertidos.</p>
    ${count ? '<button type="button" class="danger-btn in-card" data-health-clear>Borrar registros de Salud</button>' : ''}
  </article>`;
}

function healthReminderCard() {
  const { days, time } = state.health.reminder;
  return `<article class="card health-reminder">
    <div class="card-head"><h2>Recordatorio</h2></div>
    <p class="card-text first">Un evento que se repite en el calendario del móvil, para acordarte de apuntar tus medidas.</p>
    <div class="weekday-row" role="group" aria-label="Días del recordatorio">${WEEKDAYS.map((d, i) => (
      `<button type="button" data-health-day="${i}" aria-pressed="${days.includes(i)}" aria-label="${WEEKDAY_NAMES[i]}">${d}</button>`
    )).join('')}</div>
    <div class="reminder-row">
      <label class="field time-field">
        <span>Hora</span>
        <input id="health-reminder-time" type="time" value="${time}">
      </label>
      <button type="button" class="secondary-btn" data-health-ics${days.length ? '' : ' disabled'}>${ICONS.calendar}Añadir al calendario</button>
    </div>
    <p class="hint left">${days.length ? 'Si cambias los días o la hora, vuelve a añadirlo y borra el anterior del calendario.' : 'Elige al menos un día.'}</p>
  </article>`;
}

// Marca un punto de la gráfica: línea vertical, punto resaltado y el registro en el pie.
function selectHealthPoint(id) {
  const chart = $('#health-chart');
  const point = healthPoints.find((p) => p.id === id);
  const entry = healthSeries(ui.healthMetric).find((e) => e.id === id);
  if (!chart || !point || !entry) return;
  ui.healthSel = id;
  const cross = chart.querySelector('.hc-cross');
  cross.setAttribute('x1', point.x);
  cross.setAttribute('x2', point.x);
  const sel = chart.querySelector('.hc-sel');
  sel.setAttribute('cx', point.x);
  sel.setAttribute('cy', point.y);
  chart.classList.add('has-sel');
  $('#health-caption').textContent = [healthDateLabel(entry.date), healthEntryText(entry.metric, entry), entry.note].filter(Boolean).join(' · ');
}

// El punto más cercano (en horizontal) al dedo o al puntero.
function nearestHealthPoint(e) {
  const svgEl = $('#health-chart svg');
  if (!svgEl || !healthPoints.length) return null;
  const rect = svgEl.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * svgEl.viewBox.baseVal.width;
  return healthPoints.reduce((best, p) => (Math.abs(p.x - x) <= Math.abs(best.x - x) ? p : best));
}

// ---------- Salud desde Hoy: la tarjeta y la hoja a pantalla completa ----------

const healthSheet = $('#health-sheet');

function openHealth() {
  document.documentElement.classList.add('locked');
  if (!healthSheet.open) healthSheet.showModal();
  renderHealth(); // con la hoja ya abierta, la gráfica sabe cuánto mide
  $('#health-view').scrollTop = 0;
}

// Tarjeta de Hoy: las últimas medidas de las dos primeras que tengan registros (con la bienvenida no sale).
function renderHealthCard(hasHabits) {
  const card = $('#health-card');
  card.hidden = !state.prefs.showHealth || !hasHabits;
  if (card.hidden) return;
  const latest = state.health.metrics
    .map((metric) => ({ metric, last: healthLatest(metric).last }))
    .filter((x) => x.last)
    .slice(0, 2)
    .map(({ metric, last }) => `${healthLabel(metric)} ${healthEntryValue(metric, last)} ${healthSymbol(metric)}`);
  $('#health-card-text').textContent = latest.length ? latest.join(' · ')
    : state.health.metrics.length ? 'Apunta tus medidas cuando quieras' : 'Elige qué medidas quieres apuntar';
}

$('#health-card').addEventListener('click', openHealth);
$('#health-close').addEventListener('click', () => healthSheet.close());
healthSheet.addEventListener('click', (e) => {
  if (e.target === healthSheet) healthSheet.close();
});
healthSheet.addEventListener('close', () => {
  document.documentElement.classList.remove('locked');
  ui.healthSel = null;
  render(); // la tarjeta de Hoy enseña lo último que se ha apuntado
});

// ---------- Interacción ----------

const healthView = $('#health-view');

// Vuelve a pintar Salud y deja el foco en el mismo control.
function refreshHealth(selector) {
  renderHealth();
  if (selector) healthView.querySelector(selector)?.focus();
}

['pointerdown', 'pointermove'].forEach((type) => {
  healthView.addEventListener(type, (e) => {
    if (!e.target.closest('#health-chart')) return;
    const point = nearestHealthPoint(e);
    if (point && point.id !== ui.healthSel) selectHealthPoint(point.id);
  });
});

healthView.addEventListener('keydown', (e) => {
  if (e.target.id !== 'health-chart' || !healthPoints.length) return;
  const index = healthPoints.findIndex((p) => p.id === ui.healthSel);
  const last = healthPoints.length - 1;
  const next = { ArrowLeft: index < 0 ? last : index - 1, ArrowRight: index + 1, Home: 0, End: last }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  selectHealthPoint(healthPoints[Math.min(last, Math.max(0, next))].id);
});

healthView.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (!target || target.disabled) return;
  const { healthMetric, healthAdd, healthEdit, healthPeriod, healthDay } = target.dataset;
  if (healthMetric) {
    ui.healthMetric = healthMetric;
    ui.healthSel = null;
    ui.healthShown = 10;
    refreshHealth(`[data-health-metric="${healthMetric}"]`);
  } else if (healthAdd) openHealthEntry({ metrics: [healthAdd] });
  else if (target.hasAttribute('data-health-quick')) openHealthEntry();
  else if (healthEdit) openHealthEntry({ id: healthEdit });
  else if (healthPeriod) {
    ui.healthPeriod = Number(healthPeriod);
    ui.healthSel = null;
    refreshHealth(`[data-health-period="${healthPeriod}"]`);
  } else if (target.hasAttribute('data-health-avg')) {
    ui.healthAvg = !ui.healthAvg;
    refreshHealth('[data-health-avg]');
  } else if (target.hasAttribute('data-health-more')) {
    const shown = ui.healthShown;
    ui.healthShown += HEALTH_PAGE;
    renderHealth();
    healthView.querySelectorAll('.health-row')[shown]?.focus();
  } else if (healthDay !== undefined) {
    const day = Number(healthDay);
    const { days } = state.health.reminder;
    state.health.reminder.days = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b);
    save();
    refreshHealth(`[data-health-day="${day}"]`);
  } else if (target.hasAttribute('data-health-ics')) addHealthReminder();
  else if (target.hasAttribute('data-health-csv')) exportHealthCSV();
  else if (target.hasAttribute('data-health-metrics')) openHealthMetrics();
  else if (target.hasAttribute('data-health-clear')) clearHealth();
  else return;
  haptic();
});

healthView.addEventListener('change', (e) => {
  if (e.target.id !== 'health-reminder-time' || !/^\d{2}:\d{2}$/.test(e.target.value)) return;
  state.health.reminder.time = e.target.value;
  save();
});

async function clearHealth() {
  const count = state.health.entries.length;
  const ok = await askConfirm({
    icon: 'trash',
    title: '¿Borrar tus registros de Salud?',
    body: `<p>${count === 1 ? 'Se borrará 1 registro' : `Se borrarán ${fmtNumber.format(count)} registros`} de este dispositivo, de todas las medidas. Tus hábitos, tu progreso y tu diario no cambian.</p>
      <button type="button" class="link-btn" data-export>Exportar una copia antes</button>`,
    confirmText: 'Sí, borrar',
    danger: true,
  });
  if (!ok) return;
  const snapshot = JSON.stringify(state);
  state.health.entries = [];
  ui.healthSel = null;
  save();
  render();
  haptic();
  toast('Registros de Salud borrados', { action: 'Deshacer', onAction: undoTo(snapshot) });
}

// ---------- Exportar a CSV y recordatorio ----------

// Todos los registros de Salud (también los de medidas ocultas), tal como se apuntaron. Punto y coma y coma
// decimal, como espera Excel en español, y marca UTF-8 para que salgan bien las tildes.
function healthCSV() {
  const number = (v) => (v === undefined ? '' : String(v).replace('.', ','));
  // Las notas que empiezan por = + - @ se protegen para que la hoja no las tome por fórmulas.
  const text = (s) => {
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const header = ['Fecha', 'Medida', 'Valor', 'Diastólica', 'Pulso', 'Unidad', 'Nota'];
  const rows = [...state.health.entries].sort(byHealthDate).map((e) => {
    const known = Object.hasOwn(HEALTH_METRICS, e.metric) ? HEALTH_METRICS[e.metric] : null;
    const symbol = known && known.units[e.unit] ? known.units[e.unit].symbol : e.unit;
    return [e.date, text(known ? known.label : e.metric), number(e.value), number(e.value2), number(e.pulse), text(symbol), text(e.note)];
  });
  return `﻿${[header, ...rows].map((row) => row.join(';')).join('\r\n')}\r\n`;
}

async function exportHealthCSV() {
  const file = new File([healthCSV()], `bonsai-salud-${ui.today}.csv`, { type: 'text/csv' });
  const result = await shareOrDownload(file, 'Salud en CSV');
  if (result === 'downloaded') toast('Archivo CSV descargado');
}

async function addHealthReminder() {
  const { days, time } = state.health.reminder;
  if (!days.length) return;
  const names = state.health.metrics.map((id) => healthLabel(id).toLowerCase());
  const ics = buildICS({
    id: 'salud',
    name: 'Apuntar mis medidas',
    emoji: '❤️',
    schedule: days.length === 7 ? { type: 'daily' } : { type: 'days', days },
    time,
    text: `Es un buen momento para apuntar ${names.length ? fmtList.format(names) : 'tus medidas'} en Bonsái.`,
  });
  const file = new File([ics], 'bonsai-salud-recordatorio.ics', { type: 'text/calendar' });
  const result = await shareOrDownload(file, 'Recordatorio de Salud');
  if (result === 'downloaded') toast('Abre el archivo descargado para añadirlo a tu calendario');
  else if (result === 'shared') toast('Elige Calendario para guardar el recordatorio');
}

// ---------- Elegir medidas y unidades ----------

const healthMetricsDialog = $('#health-metrics-dialog');

function renderHealthMetricList() {
  $('#health-metric-list').innerHTML = Object.entries(HEALTH_METRICS).map(([id, m]) => {
    const on = state.health.metrics.includes(id);
    const count = state.health.entries.filter((e) => e.metric === id).length;
    const units = Object.entries(m.units);
    const picker = on && units.length > 1
      ? `<div class="segmented two" role="radiogroup" aria-label="Unidad de ${m.label.toLowerCase()}">${units.map(([u, spec]) => (
        `<button type="button" role="radio" data-health-unit="${u}" data-metric="${id}" aria-checked="${healthUnit(id) === u}">${spec.label} (${spec.symbol})</button>`
      )).join('')}</div>` : '';
    return `<div class="metric-row">
      <label class="switch-row">
        <span class="switch-text"><b id="hm-${id}">${m.label}</b><span id="hm-${id}-hint">${count ? plural(count, 'registro', 'registros') : 'Sin registros'} · ${units.map(([, spec]) => spec.symbol).join(' o ')}</span></span>
        <input type="checkbox" role="switch" data-health-toggle="${id}" aria-labelledby="hm-${id}" aria-describedby="hm-${id}-hint"${on ? ' checked' : ''}>
      </label>
      ${picker}
    </div>`;
  }).join('');
}

function openHealthMetrics() {
  renderHealthMetricList();
  healthMetricsDialog.showModal();
}

// Las medidas activas, siempre en el orden del catálogo.
function setHealthMetric(id, on) {
  const chosen = new Set(state.health.metrics);
  if (on) chosen.add(id);
  else chosen.delete(id);
  state.health.metrics = Object.keys(HEALTH_METRICS).filter((m) => chosen.has(m));
  if (on) ui.healthMetric = id;
  save();
}

$('#health-metric-list').addEventListener('change', (e) => {
  const id = e.target.dataset.healthToggle;
  if (!id) return;
  setHealthMetric(id, e.target.checked);
  renderHealthMetricList();
  render();
  haptic();
  $(`[data-health-toggle="${id}"]`)?.focus();
});

$('#health-metric-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-health-unit]');
  if (!btn) return;
  state.health.units[btn.dataset.metric] = btn.dataset.healthUnit;
  save();
  renderHealthMetricList();
  render();
  haptic();
  $(`[data-health-unit="${btn.dataset.healthUnit}"][data-metric="${btn.dataset.metric}"]`)?.focus();
});

$('#health-metrics-done').addEventListener('click', () => healthMetricsDialog.close());
healthMetricsDialog.addEventListener('click', (e) => {
  if (e.target === healthMetricsDialog) healthMetricsDialog.close();
});

// ---------- Registrar, registro rápido o editar ----------

const healthDialog = $('#health-entry');
const healthDate = $('#health-date');
const healthNote = $('#health-note');

// Campos de una medida (la tensión lleva sistólica, diastólica y pulso opcional), con el último valor como pista.
function healthFieldsHTML(metric, entry) {
  const m = HEALTH_METRICS[metric];
  const unit = healthUnit(metric);
  const { last } = healthLatest(metric);
  const input = (part, label, value, placeholder) => {
    const id = `hf-${metric}-${part}`;
    return `<label class="field"><span>${label}</span>
      <input id="${id}" type="text" inputmode="${m.decimals ? 'decimal' : 'numeric'}" autocomplete="off" enterkeyhint="done"
        data-metric="${metric}" data-part="${part}" value="${escapeHTML(value)}" placeholder="${escapeHTML(placeholder)}" aria-describedby="${id}-error">
    </label>`;
  };
  const error = (part) => `<p class="field-error" id="hf-${metric}-${part}-error" hidden></p>`;
  if (m.pair) {
    return `<fieldset class="health-field">
      <legend>${healthFieldLabel(metric)}</legend>
      <div class="pair-row">
        ${input('value', 'Sistólica', entry ? String(entry.value) : '', last ? String(last.value) : m.example)}
        ${input('value2', m.second.label, entry ? String(entry.value2) : '', last ? String(last.value2) : m.second.example)}
        ${input('pulse', 'Pulso (opcional)', entry && entry.pulse ? String(entry.pulse) : '', m.pulse.example)}
      </div>
      ${error('value')}${error('value2')}${error('pulse')}
    </fieldset>`;
  }
  return `<div class="health-field">
    ${input('value', healthFieldLabel(metric), entry ? healthInputText(entry, unit) : '', last ? healthInputText(last, unit) : healthExample(metric))}
    ${error('value')}
  </div>`;
}

function renderHealthTags() {
  $('#health-tags').innerHTML = HEALTH_TAGS.map((tag) => (
    `<button type="button" class="tag" data-health-tag="${tag}" aria-pressed="${hasTag(healthNote.value, tag)}">${capitalize(tag)}</button>`
  )).join('');
}

// Para una medida, para varias a la vez (registro rápido) o para editar un registro.
function openHealthEntry({ metrics = state.health.metrics, id = null } = {}) {
  const entry = id ? state.health.entries.find((e) => e.id === id) : null;
  const list = entry ? [entry.metric] : metrics;
  if (!list.length) return;
  ui.healthEdit = entry ? entry.id : null;
  ui.healthForm = list;
  $('#health-entry-title').textContent = entry ? 'Editar registro'
    : list.length === 1 ? `Registrar ${healthLabel(list[0]).toLowerCase()}` : 'Registro rápido';
  $('#health-quick-hint').hidden = list.length < 2;
  $('#health-fields').innerHTML = list.map((metric) => healthFieldsHTML(metric, entry)).join('');
  healthDate.value = entry ? entry.date : ui.today;
  healthDate.min = HEALTH_MIN_DATE;
  healthDate.max = ui.today;
  healthNote.value = entry ? entry.note : '';
  renderHealthTags();
  $('#health-delete').hidden = !entry;
  showHealthErrors({});
  healthDialog.showModal();
}

// Cada error junto a su campo (con aria-invalid); los de la fecha y del formulario, en su sitio.
function showHealthErrors(errors) {
  const mark = (input, message, box) => {
    box.textContent = message || '';
    box.hidden = !message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };
  healthDialog.querySelectorAll('[data-part]').forEach((input) => {
    mark(input, errors[`${input.dataset.metric}.${input.dataset.part}`], $(`#${input.id}-error`));
  });
  mark(healthDate, errors.date, $('#health-date-error'));
  $('#health-form-error').textContent = errors.form || '';
  $('#health-form-error').hidden = !errors.form;
}

$('#health-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const texts = (metric) => {
    const read = (part) => ($(`#hf-${metric}-${part}`) || {}).value || '';
    return { valueText: read('value'), value2Text: read('value2'), pulseText: read('pulse') };
  };
  const date = healthDate.value;
  const note = healthNote.value;
  const editing = Boolean(ui.healthEdit);
  let result;
  if (editing) {
    const metric = ui.healthForm[0];
    result = saveHealthEntry(metric, { id: ui.healthEdit, ...texts(metric), date, note });
    if (result.errors) {
      result.errors = Object.fromEntries(Object.entries(result.errors).map(([k, v]) => [k === 'date' ? k : `${metric}.${k}`, v]));
    }
  } else {
    result = saveHealthBatch({ date, note, values: Object.fromEntries(ui.healthForm.map((metric) => [metric, texts(metric)])) });
  }
  showHealthErrors(result.errors || {});
  if (result.errors) {
    const invalid = healthDialog.querySelector('[aria-invalid="true"]') || healthDialog.querySelector('[data-part]');
    invalid?.focus();
    return;
  }
  const saved = editing ? [result.entry] : result.entries;
  healthDialog.close();
  if (saved.length === 1) {
    ui.healthMetric = saved[0].metric;
    ui.healthSel = saved[0].id;
  }
  render();
  haptic();
  toast(editing ? 'Registro actualizado' : saved.length === 1 ? 'Registro guardado' : `${saved.length} registros guardados`);
});

healthDialog.addEventListener('click', (e) => {
  if (e.target === healthDialog) {
    healthDialog.close();
    return;
  }
  const tag = e.target.closest('[data-health-tag]');
  if (!tag) return;
  healthNote.value = toggleTag(healthNote.value, tag.dataset.healthTag);
  renderHealthTags();
  healthDialog.querySelector(`[data-health-tag="${tag.dataset.healthTag}"]`)?.focus();
});
healthNote.addEventListener('input', renderHealthTags);

$('#health-delete').addEventListener('click', () => {
  const id = ui.healthEdit;
  if (!id) return;
  const snapshot = JSON.stringify(state);
  healthDialog.close();
  deleteHealthEntry(id);
  render();
  toast('Registro borrado', { action: 'Deshacer', onAction: undoTo(snapshot) });
});
$('#health-cancel').addEventListener('click', () => healthDialog.close());

// ---------- Zen ----------

// Prácticas de calma, gratitud y emociones. Nada de esto da XP ni cuenta para rachas: si se elige un hábito,
// al terminar una práctica se marca como si lo tocaras en Hoy (y entonces cuenta como cualquier hábito).

const ZEN_PHASE_TEXT = { in: 'Inhala', hold: 'Mantén', out: 'Exhala' };
const ZEN_SCREENS = { home: 'Zen', breath: 'Respirar', meditation: 'Meditar', sounds: 'Sonidos', grounding: '5-4-3-2-1', gratitude: 'Gratitud', emotions: 'Emociones' };
const ZEN_ALL_WORDS = Object.values(ZEN_EMOTIONS).flat();
const GRATITUDE_HINTS = ['Algo que te ha hecho sonreír', 'Alguien a quien agradecer algo', 'Un momento bueno de hoy'];
const daysSinceEpoch = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
};
// La reflexión del día: la misma durante todo el día y distinta al siguiente.
const zenReflection = (key = ui.today) => ZEN_REFLECTIONS[daysSinceEpoch(key) % ZEN_REFLECTIONS.length];
const fmtClock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
};
const monthStartOf = (key) => `${key.slice(0, 7)}-01`;

// Respiración: un ciclo es la suma de sus fases. La duración se redondea a ciclos completos, para no
// cortar a mitad de una respiración.
const breathCycle = (pattern) => ZEN_BREATHS[pattern].phases.reduce((n, [, secs]) => n + secs, 0);
const breathTotal = (pattern, minutes) => Math.ceil((minutes * 60) / breathCycle(pattern)) * breathCycle(pattern) * 1000;
// En qué fase se está pasados `elapsed` milisegundos, y cuánto le queda.
function breathPhase(pattern, elapsed) {
  const { phases } = ZEN_BREATHS[pattern];
  const cycle = breathCycle(pattern);
  const round = Math.floor(elapsed / 1000 / cycle);
  let t = elapsed / 1000 - round * cycle;
  for (let index = 0; index < phases.length; index++) {
    const [kind, seconds] = phases[index];
    if (t < seconds) return { index, kind, seconds, remaining: seconds - t, left: Math.ceil(seconds - t), round };
    t -= seconds;
  }
  const [kind, seconds] = phases[0];
  return { index: 0, kind, seconds, remaining: seconds, left: seconds, round: round + 1 };
}

// Minutos y sesiones de la semana y del mes, y lo escrito este mes (sin rachas: solo lo que hay).
function zenStats(today = ui.today) {
  const from = { week: weekStartOf(today), month: monthStartOf(today) };
  const within = (start) => state.zen.sessions.filter((s) => s.date >= start && s.date <= today);
  const minutes = (list) => Math.round(list.reduce((n, s) => n + s.seconds, 0) / 60);
  const week = within(from.week);
  const month = within(from.month);
  return {
    weekMinutes: minutes(week),
    weekSessions: week.length,
    monthMinutes: minutes(month),
    monthSessions: month.length,
    byType: Object.keys(ZEN_TYPES)
      .map((type) => { const list = month.filter((s) => s.type === type); return { type, minutes: minutes(list), sessions: list.length }; })
      .filter((t) => t.sessions),
    gratitudeDays: Object.keys(state.zen.gratitude).filter((d) => d >= from.month && d <= today).length,
    emotions: state.zen.emotions.filter((e) => e.date >= from.month && e.date <= today).length,
  };
}

// Las palabras más anotadas este mes, con cuántas veces. Solo describe.
function emotionSummary(today = ui.today, limit = 3) {
  const counts = new Map();
  state.zen.emotions
    .filter((e) => e.date >= monthStartOf(today) && e.date <= today)
    .forEach((e) => e.words.forEach((w) => counts.set(w, (counts.get(w) || 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')).slice(0, limit);
}

// ---------- Guardar ----------

function setZenSetting(key, value) {
  state.zen.settings = normalizeZen({ settings: { ...state.zen.settings, [key]: value } }).settings;
  save();
}

// Marca el hábito elegido (para hoy), como si se tocara en Hoy. En los de minutos (Meditar, por ejemplo)
// suma los minutos practicados; en los demás, lo da por hecho si aún no lo estaba.
function markZenHabit(seconds) {
  const habit = findHabit(state.zen.settings.habitId);
  const day = ui.today;
  if (!habit || habit.archived || habit.kind === 'quit' || isPaused(habit, day)) return null;
  const before = computeStats();
  const wasDone = isDone(habit, day);
  const previous = habit.done[day];
  if (isTarget(habit) && habit.measure === 'min') habit.done[day] = round2((previous || 0) + Math.max(1, Math.round(seconds / 60)));
  else if (!wasDone) habit.done[day] = isTarget(habit) ? habit.goal : habit.goal > 1 ? amountOn(habit, day) + 1 : 1;
  if (habit.done[day] === previous) return { habit, changed: false, done: wasDone, xp: 0 };
  if (habit.shields[day] && isDone(habit, day)) delete habit.shields[day]; // como al marcarlo a mano
  save();
  const after = computeStats();
  const unlocked = isDone(habit, day) && !wasDone ? ACHIEVEMENTS.filter((a) => isUnlocked(a, after) && !isUnlocked(a, before)) : [];
  return { habit, changed: true, done: isDone(habit, day), xp: after.xp - before.xp, levelUp: after.level > before.level ? after : null, unlocked };
}

// Al terminar: se guarda si ha durado al menos un minuto (el 5-4-3-2-1, si se ha completado) y se marca
// el hábito elegido.
function completeZenPractice(type, seconds, completed) {
  if (seconds < 60 && !(completed && type === 'grounding')) return { type, seconds, completed, saved: false };
  const session = { id: uid(), type, date: ui.today, seconds: Math.min(86400, Math.max(1, Math.round(seconds))), created: Date.now() };
  state.zen.sessions.push(session);
  save();
  return { type, seconds, completed, saved: true, session, habit: markZenHabit(seconds) };
}

// Gratitud: hasta 3 textos por día; un día sin nada escrito no se guarda.
function setGratitude(date, index, text) {
  const items = [...(state.zen.gratitude[date] || [])];
  while (items.length < GRATITUDE_ITEMS) items.push('');
  items[index] = cleanText(text, GRATITUDE_MAX);
  if (items.some(Boolean)) state.zen.gratitude[date] = items;
  else delete state.zen.gratitude[date];
  save();
}

function addEmotion({ words, intensity, note = '' }) {
  const chosen = [...new Set(words)].filter((w) => ZEN_ALL_WORDS.includes(w)).slice(0, ZEN_WORDS_MAX);
  if (!chosen.length) return { error: 'Elige al menos una palabra.' };
  const entry = {
    id: uid(),
    date: ui.today,
    words: chosen,
    intensity: Math.min(5, Math.max(1, Math.round(Number(intensity)) || 3)),
    note: cleanText(note, NOTE_MAX),
    created: Date.now(),
  };
  state.zen.emotions.push(entry);
  save();
  return { entry };
}

function deleteEmotion(id) {
  state.zen.emotions = state.zen.emotions.filter((e) => e.id !== id);
  save();
}

// ---------- Práctica en marcha: tiempo, pantalla encendida y sonido ----------

// El tiempo se mide con el reloj, no contando pasos del temporizador: así no se desfasa si el móvil
// ralentiza la app, y al volver de otra app se pone al día.
let zenRun = null;
let wakeLock = null;

async function keepAwake(on) {
  try {
    if (on && !wakeLock && navigator.wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (err) {
    // sin permiso para mantenerla encendida: la práctica sigue igual
  }
}

const zenElapsed = () => (zenRun ? (zenRun.pausedAt || Date.now()) - zenRun.start - zenRun.paused : 0);

function startZenRun(run) {
  stopZenRun();
  zenRun = { start: Date.now(), pausedAt: 0, paused: 0, total: 0, ...run };
  zenRun.timer = setInterval(tickZen, 200);
  keepAwake(true);
  tickZen();
}

// Arranca una práctica y pinta su pantalla ya en marcha.
function beginZen(run) {
  startZenRun(run);
  renderZen();
  tickZen();
}

function tickZen() {
  if (!zenRun || zenRun.pausedAt) return;
  const elapsed = zenElapsed();
  if (zenRun.total && elapsed >= zenRun.total) finishZen(true);
  else zenRun.onTick(elapsed);
}

function toggleZenPause() {
  if (!zenRun) return;
  if (zenRun.pausedAt) {
    zenRun.paused += Date.now() - zenRun.pausedAt;
    zenRun.pausedAt = 0;
    if (zenRun.onResume) zenRun.onResume();
    keepAwake(true);
  } else {
    zenRun.pausedAt = Date.now();
    if (zenRun.onPause) zenRun.onPause();
  }
  renderZenControls();
  tickZen();
}

function stopZenRun() {
  if (!zenRun) return;
  clearInterval(zenRun.timer);
  if (zenRun.onStop) zenRun.onStop();
  zenRun = null;
  keepAwake(false);
}

// Termina la práctica en marcha (completa o antes de tiempo), la guarda y devuelve el resultado.
function finishZen(completed) {
  if (!zenRun) return null;
  const { type, total } = zenRun;
  const seconds = (total ? Math.min(zenElapsed(), total) : zenElapsed()) / 1000;
  if (completed && zenRun.onComplete) zenRun.onComplete();
  stopZenRun();
  const result = completeZenPractice(type, seconds, completed);
  if (zenDialog.open && ZEN_SCREENS[ui.zenScreen]) showZenResult(result);
  return result;
}

// Sonido generado en el propio móvil con Web Audio: sin archivos que descargar.
let audioCtx = null;
function audioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!audioCtx && Ctx) {
    // En el iPhone, que suene aunque el interruptor de silencio esté activado.
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (err) {
      // sin control de la sesión de audio: suena según el interruptor
    }
    audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Una campana suave: varios tonos que se apagan poco a poco.
function playBell(volume = 0.3) {
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = volume;
  out.connect(ctx.destination);
  [[1, 1, 5], [2.76, 0.5, 3], [5.4, 0.25, 1.8], [8.93, 0.12, 1.2]].forEach(([ratio, level, decay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 330 * ratio;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + decay + 0.1);
  });
}

// Ruido rosa (más suave que el blanco) o marrón (más grave), en un bucle de unos segundos.
function noiseBuffer(ctx, color) {
  const length = ctx.sampleRate * 6;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let [b0, b1, b2, b3, b4, b5, b6, last] = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (color === 'brown') {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

// Cada sonido es ruido filtrado; las olas suben y bajan despacio. Entra y sale con un fundido.
function startSound(kind, volume) {
  const ctx = audioContext();
  if (!ctx) return null;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, kind === 'rain' || kind === 'soft' ? 'pink' : 'brown');
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  const [type, frequency] = { rain: ['highpass', 500], soft: ['lowpass', 2500], waves: ['lowpass', 1000], brown: ['lowpass', 600] }[kind];
  filter.type = type;
  filter.frequency.value = frequency;
  const swell = ctx.createGain();
  let lfo = null;
  if (kind === 'waves') {
    swell.gain.value = 0.6;
    lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const depth = ctx.createGain();
    depth.gain.value = 0.4;
    lfo.connect(depth).connect(swell.gain);
    lfo.start();
  }
  const master = ctx.createGain();
  const level = (v) => Math.max(0.0001, v * 0.8);
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(level(volume), ctx.currentTime + 1.5);
  source.connect(filter).connect(swell).connect(master).connect(ctx.destination);
  source.start();
  return {
    setVolume: (v) => master.gain.setTargetAtTime(level(v), ctx.currentTime, 0.1),
    stop() {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 1);
      source.stop(t + 1.1);
      if (lfo) lfo.stop(t + 1.1);
    },
  };
}

// ---------- Empezar cada práctica ----------

const setText = (selector, text) => {
  const el = zenBody.querySelector(selector);
  if (el) el.textContent = text;
};

function startBreath() {
  const { breath, breathMinutes } = state.zen.settings;
  const phases = ZEN_BREATHS[breath].phases;
  let shown = -1;
  beginZen({
    type: 'breath',
    total: breathTotal(breath, breathMinutes),
    onTick(elapsed) {
      const p = breathPhase(breath, elapsed);
      const step = p.round * phases.length + p.index;
      const circle = zenBody.querySelector('#breath-circle');
      if (circle && circle.dataset.step !== String(step)) {
        circle.dataset.step = step;
        circle.style.transitionDuration = `${p.remaining.toFixed(2)}s`;
        // En «mantén» se queda como estaba (lleno tras inhalar, vacío tras exhalar).
        const full = p.kind === 'hold' ? phases[(p.index + phases.length - 1) % phases.length][0] === 'in' : p.kind === 'in';
        void circle.offsetWidth; // recién pintado, el navegador aún no tiene su tamaño de partida y no lo animaría
        circle.classList.toggle('full', full);
      }
      if (step !== shown) {
        shown = step;
        $('#zen-live').textContent = ZEN_PHASE_TEXT[p.kind];
        if (state.zen.settings.rhythm) buzz();
      }
      setText('#zen-phase', `${ZEN_PHASE_TEXT[p.kind]} · ${p.left}`);
      setText('#zen-time', fmtClock(zenRun.total - elapsed));
    },
    onResume() { shown = -1; },
  });
}

function startMeditation() {
  const { minutes } = state.zen.settings;
  const total = minutes * 60000;
  if (state.zen.settings.bell) playBell();
  beginZen({
    type: 'meditation',
    total,
    bells: 0,
    onTick(elapsed) {
      setText('#zen-time', fmtClock(total - elapsed));
      const ring = zenBody.querySelector('#zen-ring');
      if (ring) ring.style.setProperty('--p', (elapsed / total).toFixed(4));
      // Avisos intermedios: la campana (más baja) o, sin campana, una vibración. Nunca justo al final.
      const { interval, bell } = state.zen.settings;
      const passed = interval ? Math.floor(elapsed / (interval * 60000)) : 0;
      if (passed > zenRun.bells) {
        zenRun.bells = passed;
        if (total - elapsed > 5000) {
          if (bell) playBell(0.15);
          else buzz();
        }
      }
    },
    onComplete() {
      if (state.zen.settings.bell) playBell();
    },
  });
}

function startSounds() {
  const { sound, soundMinutes, volume } = state.zen.settings;
  const player = startSound(sound, volume);
  if (!player) {
    ui.zenNotice = 'Este navegador no puede generar sonidos.';
    renderZen();
    return;
  }
  beginZen({
    type: 'sounds',
    total: soundMinutes * 60000,
    player,
    onTick(elapsed) {
      setText('#zen-time', zenRun.total ? `Quedan ${fmtClock(zenRun.total - elapsed)}` : `Llevas ${fmtClock(elapsed)}`);
    },
    onPause() {
      zenRun.player.stop();
      zenRun.player = null;
    },
    onResume() {
      zenRun.player = startSound(state.zen.settings.sound, state.zen.settings.volume);
    },
    onStop() {
      if (zenRun.player) zenRun.player.stop();
    },
  });
}

function startGrounding() {
  beginZen({ type: 'grounding', step: 0, found: 0, onTick() {} });
}

// Una cosa más encontrada en el paso actual; al completar los cinco pasos, termina.
function groundingFound() {
  if (!zenRun || zenRun.type !== 'grounding') return;
  zenRun.found++;
  const [count] = ZEN_GROUNDING[zenRun.step];
  if (zenRun.found >= count) {
    zenRun.step++;
    zenRun.found = 0;
    if (zenRun.step >= ZEN_GROUNDING.length) {
      finishZen(true);
      return;
    }
  }
  renderZen();
  const [next, what] = ZEN_GROUNDING[zenRun.step];
  $('#zen-live').textContent = `${zenRun.found} de ${next} ${what}`;
  zenBody.querySelector('[data-zen-found]')?.focus();
}

// ---------- Pantallas ----------

const zenDialog = $('#zen');
const zenBody = $('#zen-body');
const zenRunning = (type) => Boolean(zenRun && zenRun.type === type);

const zenTile = (screen, icon, title, hint) => `<button type="button" class="zen-tile" data-zen-screen="${screen}">
    <span class="zen-tile-icon" aria-hidden="true">${icon}</span><b>${title}</b><span>${hint}</span>
  </button>`;
const zenSwitch = (key, title, hint) => `<label class="switch-row">
    <span class="switch-text"><b id="zs-${key}">${title}</b><span id="zs-${key}-hint">${hint}</span></span>
    <input type="checkbox" role="switch" data-zen-setting="${key}" aria-labelledby="zs-${key}" aria-describedby="zs-${key}-hint"${state.zen.settings[key] ? ' checked' : ''}>
  </label>`;
const zenChoices = (key, list, label, text, disabled) => `<div class="tag-row zen-choices" role="radiogroup" aria-label="${label}">${list.map((n) => (
  `<button type="button" class="tag" role="radio" data-zen-choice="${key}:${n}" aria-checked="${n === state.zen.settings[key]}"${disabled ? ' disabled' : ''}>${text(n)}</button>`
)).join('')}</div>`;

function zenHomeHTML() {
  const today = ui.today;
  const s = zenStats();
  const { settings } = state.zen;
  const grateful = (state.zen.gratitude[today] || []).filter(Boolean).length;
  const felt = state.zen.emotions.filter((e) => e.date === today).length;
  const notice = ui.zenNotice ? `<p class="zen-notice" role="status">${escapeHTML(ui.zenNotice)}</p>` : '';
  ui.zenNotice = '';
  const habits = visibleHabits().filter((h) => h.kind !== 'quit');
  const month = [
    ...s.byType.map((t) => `${ZEN_TYPES[t.type].toLowerCase()}, ${plural(t.minutes, 'minuto', 'minutos')}`),
    s.gratitudeDays ? `gratitud, ${plural(s.gratitudeDays, 'día', 'días')}` : '',
    s.emotions ? `${plural(s.emotions, 'emoción anotada', 'emociones anotadas')}` : '',
  ].filter(Boolean);
  return `${notice}
    <article class="card zen-quote">
      <p class="kicker">Reflexión del día</p>
      <p class="zen-quote-text">${zenReflection()}</p>
    </article>
    <h3 class="section-label zen-label">Practicar</h3>
    <div class="zen-grid">
      ${zenTile('breath', ICONS.wind, 'Respirar', `${ZEN_BREATHS[settings.breath].label} · ${settings.breathMinutes} min`)}
      ${zenTile('meditation', ICONS.timer, 'Meditar', `${settings.minutes} min`)}
      ${zenTile('sounds', ICONS.wave, 'Sonidos', ZEN_SOUNDS[settings.sound])}
      ${zenTile('grounding', ICONS.eye, '5-4-3-2-1', 'Volver al presente')}
    </div>
    <h3 class="section-label zen-label">Escribir</h3>
    <div class="zen-grid">
      ${zenTile('gratitude', ICONS.heart, 'Gratitud', grateful ? `Hoy: ${grateful} de ${GRATITUDE_ITEMS}` : 'Tres cosas buenas de hoy')}
      ${zenTile('emotions', moodIcon(4), 'Emociones', felt ? `Hoy: ${plural(felt, 'registro', 'registros')}` : '¿Cómo te sientes?')}
    </div>
    <h3 class="section-label zen-label">Tu práctica</h3>
    <article class="card">
      <div class="stats">
        <div class="stat"><b>${s.weekMinutes}</b><span>Minutos esta semana</span></div>
        <div class="stat"><b>${s.weekSessions}</b><span>Sesiones esta semana</span></div>
        <div class="stat"><b>${s.monthMinutes}</b><span>Minutos este mes</span></div>
      </div>
      <p class="card-text">${month.length ? `Este mes: ${fmtList.format(month)}.` : 'Este mes aún no hay prácticas ni notas.'} Cuenta cada práctica de un minuto o más.</p>
    </article>
    <h3 class="section-label zen-label">Ajustes de Zen</h3>
    <article class="card">
      <label class="field">
        <span>Al terminar una práctica, marcar</span>
        <select data-zen-setting="habitId" aria-describedby="zen-habit-hint">
          <option value="">Ningún hábito</option>
          ${habits.map((h) => `<option value="${escapeHTML(h.id)}"${h.id === settings.habitId ? ' selected' : ''}>${escapeHTML(h.emoji)} ${escapeHTML(h.name)}</option>`).join('')}
        </select>
      </label>
      <p class="hint left" id="zen-habit-hint">Se marca para hoy, como si lo tocaras en Hoy. En los hábitos de minutos, como Meditar, se suman los minutos practicados.</p>
      <div class="divider"></div>
      ${zenSwitch('rhythm', 'Vibración de ritmo', 'Una vibración suave en cada cambio de la respiración, para seguirla con los ojos cerrados.')}
      ${zenSwitch('bell', 'Campana', 'Al empezar y al terminar la meditación.')}
    </article>`;
}

function zenBreathHTML() {
  const { breath, breathMinutes } = state.zen.settings;
  const running = zenRunning('breath');
  return `<div class="segmented" role="radiogroup" aria-label="Tipo de respiración">${Object.entries(ZEN_BREATHS).map(([id, b]) => (
    `<button type="button" role="radio" data-zen-choice="breath:${id}" aria-checked="${id === breath}"${running ? ' disabled' : ''}>${b.label}</button>`
  )).join('')}</div>
    <p class="hint left">${ZEN_BREATHS[breath].about}</p>
    ${zenChoices('breathMinutes', ZEN_BREATH_MINUTES, 'Duración', (n) => `${n} min`, running)}
    <div class="breath-stage" aria-hidden="true"><span class="breath-circle" id="breath-circle"></span></div>
    <p class="zen-phase" id="zen-phase">${running ? '' : 'Cuando quieras'}</p>
    <p class="zen-time" id="zen-time">${fmtClock(running ? zenRun.total - zenElapsed() : breathTotal(breath, breathMinutes))}</p>
    <div class="zen-controls" id="zen-controls"></div>
    <p class="hint">Respira a tu ritmo. Si te notas incómodo o mareado, para y respira con normalidad.</p>`;
}

function zenMeditationHTML() {
  const { minutes, interval } = state.zen.settings;
  const running = zenRunning('meditation');
  const total = minutes * 60000;
  const progress = running ? zenElapsed() / zenRun.total : 0;
  return `<div class="ring zen-ring" id="zen-ring" style="--p:${progress.toFixed(4)}"><b id="zen-time">${fmtClock(running ? zenRun.total - zenElapsed() : total)}</b></div>
    ${zenChoices('minutes', ZEN_MEDITATION_MINUTES, 'Duración', (n) => `${n} min`, running)}
    <label class="field spaced">
      <span>Avisos durante la meditación</span>
      <select data-zen-setting="interval"${running ? ' disabled' : ''}>${ZEN_INTERVALS.map(([n, text]) => (
        `<option value="${n}"${n === interval ? ' selected' : ''}>${text}</option>`
      )).join('')}</select>
    </label>
    ${zenSwitch('bell', 'Campana', 'Al empezar, al terminar y en los avisos. Sin ella, los avisos son una vibración.')}
    <div class="zen-controls" id="zen-controls"></div>
    <p class="hint">Siéntate cómodo, cierra los ojos si quieres y vuelve a la respiración cada vez que te distraigas.</p>`;
}

function zenSoundsHTML() {
  const { sound, soundMinutes, volume } = state.zen.settings;
  const running = zenRunning('sounds');
  const time = running ? '' : soundMinutes ? `Se apaga a los ${soundMinutes} min` : 'Sin límite';
  return `<div class="zen-grid" role="radiogroup" aria-label="Sonido">${Object.entries(ZEN_SOUNDS).map(([id, label]) => (
    `<button type="button" class="zen-sound" role="radio" data-zen-choice="sound:${id}" aria-checked="${id === sound}">${label}</button>`
  )).join('')}</div>
    <label class="zen-volume">
      <span>Volumen</span>
      <input type="range" min="0" max="1" step="0.05" value="${volume}" data-zen-volume>
    </label>
    <p class="section-label spaced" id="zen-sound-timer">Apagar después de</p>
    ${zenChoices('soundMinutes', ZEN_SOUND_MINUTES, 'Apagar después de', (n) => (n ? `${n} min` : 'Sin límite'), running)}
    <p class="zen-time" id="zen-time">${time}</p>
    <div class="zen-controls" id="zen-controls"></div>
    <p class="hint">Los sonidos se generan en el móvil, sin descargas. Si bloqueas la pantalla o cambias de app, pueden pararse.</p>`;
}

function zenGroundingHTML() {
  if (!zenRunning('grounding')) {
    return `<p class="card-text first">Un ejercicio corto para volver al presente, fijándote con los sentidos en lo que tienes alrededor.</p>
      <ol class="zen-steps">${ZEN_GROUNDING.map(([n, what]) => `<li><b>${n}</b>${what}</li>`).join('')}</ol>
      <div class="zen-controls" id="zen-controls"></div>`;
  }
  const [count, what] = ZEN_GROUNDING[zenRun.step];
  return `<div class="zen-dots" aria-hidden="true">${ZEN_GROUNDING.map((_, i) => (
    `<span class="${i < zenRun.step ? 'done' : i === zenRun.step ? 'now' : ''}"></span>`
  )).join('')}</div>
    <p class="zen-big" aria-hidden="true">${count - zenRun.found}</p>
    <p class="zen-phase">${count} ${what}</p>
    <p class="hint">Nómbralas para ti, sin prisa. Toca el botón con cada una.</p>
    <button type="button" class="primary-btn" data-zen-found>He encontrado una (${zenRun.found} de ${count})</button>
    <div class="zen-controls" id="zen-controls"></div>`;
}

function zenGratitudeHTML() {
  const today = ui.today;
  const items = state.zen.gratitude[today] || [];
  const past = Object.keys(state.zen.gratitude).filter((d) => d < today).sort().reverse();
  const shown = past.slice(0, ui.zenShown);
  const inputs = Array.from({ length: GRATITUDE_ITEMS }, (_, i) => `<label class="field">
      <span>${i + 1}</span>
      <input type="text" maxlength="${GRATITUDE_MAX}" data-gratitude="${i}" value="${escapeHTML(items[i] || '')}"
        placeholder="${GRATITUDE_HINTS[i]}" enterkeyhint="${i < GRATITUDE_ITEMS - 1 ? 'next' : 'done'}">
    </label>`).join('');
  const history = shown.map((d) => `<li><b>${healthDateLabel(d)}</b><ul>${
    state.zen.gratitude[d].filter(Boolean).map((t) => `<li>${escapeHTML(t)}</li>`).join('')}</ul></li>`).join('');
  return `<p class="card-text first">Tres cosas buenas de hoy, por pequeñas que sean. Se guardan mientras escribes.</p>
    <div class="zen-fields">${inputs}</div>
    ${past.length ? `<h3 class="section-label zen-label">Días anteriores</h3>
      <ul class="zen-history">${history}</ul>
      ${past.length > shown.length ? '<button type="button" class="link-btn center" data-zen-more>Mostrar más</button>' : ''}` : ''}`;
}

function zenEmotionsHTML() {
  const draft = ui.zenDraft;
  const full = draft.words.length >= ZEN_WORDS_MAX;
  const groups = Object.entries(ZEN_EMOTIONS).map(([group, words]) => `<p class="section-label spaced">${group}</p>
    <div class="tag-row" role="group" aria-label="${group}">${words.map((w) => {
      const on = draft.words.includes(w);
      return `<button type="button" class="tag" data-zen-word="${w}" aria-pressed="${on}"${full && !on ? ' disabled' : ''}>${capitalize(w)}</button>`;
    }).join('')}</div>`).join('');
  const recent = [...state.zen.emotions].reverse().slice(0, ui.zenShown);
  const list = recent.map((e) => `<li>
      <span class="zen-emotion-text"><b>${e.words.map(capitalize).join(', ')}</b><span>${healthDateLabel(e.date)} · ${ZEN_INTENSITY[e.intensity - 1]}${e.note ? ` · ${escapeHTML(e.note)}` : ''}</span></span>
      <button type="button" class="icon-btn danger" data-zen-emotion-delete="${escapeHTML(e.id)}" aria-label="Borrar el registro de ${e.words.join(', ')}">${ICONS.trash}</button>
    </li>`).join('');
  const top = emotionSummary();
  return `<p class="card-text first">¿Cómo te sientes ahora? Elige hasta ${ZEN_WORDS_MAX} palabras; no hay respuestas buenas ni malas.</p>
    ${groups}
    <p class="section-label spaced" id="zen-intensity-label">Intensidad</p>
    <div class="segmented five" role="radiogroup" aria-labelledby="zen-intensity-label">${ZEN_INTENSITY.map((label, i) => (
      `<button type="button" role="radio" data-zen-intensity="${i + 1}" aria-checked="${draft.intensity === i + 1}">${label}</button>`
    )).join('')}</div>
    <label class="field spaced">
      <span>Nota (opcional)</span>
      <input type="text" maxlength="${NOTE_MAX}" data-zen-note value="${escapeHTML(draft.note)}" placeholder="Qué ha pasado, dónde estás…" enterkeyhint="done">
    </label>
    <div class="zen-controls">
      <button type="button" class="primary-btn" data-zen-emotion-save${draft.words.length ? '' : ' disabled'}>Guardar</button>
    </div>
    ${top.length ? `<p class="card-text zen-summary">Este mes, lo que más has anotado: ${fmtList.format(top.map(([w, n]) => `${w} (${n})`))}.</p>` : ''}
    ${list ? `<h3 class="section-label zen-label">Tus registros</h3><ul class="zen-history emotions">${list}</ul>
      ${state.zen.emotions.length > recent.length ? '<button type="button" class="link-btn center" data-zen-more>Mostrar más</button>' : ''}` : ''}`;
}

// Lo que se ve al terminar una práctica: cuánto se ha guardado y, si había, el hábito marcado.
function showZenResult(result) {
  const minutes = Math.max(1, Math.round(result.seconds / 60));
  const lines = [];
  if (!result.saved) lines.push('Ha durado menos de un minuto, así que no se ha guardado.');
  else if (result.type === 'grounding') lines.push('Has completado el 5-4-3-2-1.');
  else lines.push(`${ZEN_TYPES[result.type]}: ${plural(minutes, 'minuto guardado', 'minutos guardados')} en tu práctica.`);
  const h = result.habit;
  if (h && h.changed) {
    const progress = h.done ? 'marcado para hoy' : `apuntado: ${amountText(h.habit, ui.today)}`;
    lines.push(`«${h.habit.name}», ${progress}${h.xp > 0 ? ` (+${h.xp} XP)` : ''}.`);
  } else if (h) {
    lines.push(`«${h.habit.name}» ya estaba marcado hoy.`);
  }
  ui.zenResult = { title: result.completed ? 'Práctica terminada' : 'Práctica detenida', lines, again: result.type };
  renderZen();
  $('#zen-live').textContent = `${ui.zenResult.title}. ${lines.join(' ')}`;
  if (h && h.levelUp) showLevelUp(h.levelUp, h.unlocked);
}

function zenResultHTML() {
  const r = ui.zenResult;
  return `<div class="zen-result">
    <div class="empty-icon">${ICONS.leaf}</div>
    <h2>${r.title}</h2>
    ${r.lines.map((line) => `<p>${escapeHTML(line)}</p>`).join('')}
    <div class="confirm-actions">
      <button type="button" class="primary-btn" data-zen-again>Otra vez</button>
      <button type="button" class="secondary-btn" data-zen-screen="home">Volver a Zen</button>
    </div>
  </div>`;
}

const ZEN_RENDER = {
  home: zenHomeHTML,
  breath: zenBreathHTML,
  meditation: zenMeditationHTML,
  sounds: zenSoundsHTML,
  grounding: zenGroundingHTML,
  gratitude: zenGratitudeHTML,
  emotions: zenEmotionsHTML,
};

function renderZen() {
  const screen = ui.zenScreen;
  $('#zen-title').textContent = ZEN_SCREENS[screen];
  $('#zen-back').hidden = screen === 'home';
  zenBody.innerHTML = ui.zenResult ? zenResultHTML() : ZEN_RENDER[screen]();
  renderZenControls();
}

// Empezar, o pausar/seguir y terminar, según lo que esté en marcha en esta pantalla.
function renderZenControls() {
  const box = zenBody.querySelector('#zen-controls');
  if (!box) return;
  const type = { breath: 'breath', meditation: 'meditation', sounds: 'sounds', grounding: 'grounding' }[ui.zenScreen];
  if (!zenRunning(type)) {
    box.innerHTML = `<button type="button" class="primary-btn" data-zen-start>${type === 'sounds' ? 'Reproducir' : 'Empezar'}</button>`;
    return;
  }
  const canPause = type !== 'grounding';
  box.innerHTML = `${canPause ? `<button type="button" class="secondary-btn" data-zen-pause>${zenRun.pausedAt ? 'Seguir' : 'Pausa'}</button>` : ''}
    <button type="button" class="text-btn" data-zen-stop>Terminar</button>`;
}

function openZen(screen = 'home') {
  ui.zenScreen = screen;
  ui.zenResult = null;
  ui.zenShown = 14;
  renderZen();
  document.documentElement.classList.add('locked');
  if (!zenDialog.open) zenDialog.showModal();
  zenBody.scrollTop = 0;
}

// Cambiar de pantalla (o volver a Zen) termina lo que estuviera en marcha y lo guarda.
function showZenScreen(screen) {
  if (zenRun) {
    const result = finishZen(false);
    if (result && result.saved) ui.zenNotice = `Sesión guardada: ${plural(Math.max(1, Math.round(result.seconds / 60)), 'minuto', 'minutos')}.`;
  }
  ui.zenScreen = screen;
  ui.zenResult = null;
  ui.zenShown = 14;
  if (screen === 'emotions' && !ui.zenDraft) ui.zenDraft = { words: [], intensity: 3, note: '' };
  renderZen();
  zenBody.scrollTop = 0;
  $('#zen-title').focus();
}

// Tarjeta de Hoy: la reflexión del día y la entrada a Zen (con la bienvenida no sale, para no distraer).
function renderZenCard(hasHabits) {
  const card = $('#zen-card');
  card.hidden = !state.prefs.showZen || !hasHabits;
  if (!card.hidden) $('#zen-card-quote').textContent = zenReflection();
}

$('#zen-card').addEventListener('click', () => openZen());
$('#zen-back').addEventListener('click', () => showZenScreen('home'));
$('#zen-close').addEventListener('click', () => zenDialog.close());
zenDialog.addEventListener('close', () => {
  document.documentElement.classList.remove('locked');
  const result = zenRun ? finishZen(false) : null;
  if (result && result.saved) toast(`Sesión guardada: ${plural(Math.max(1, Math.round(result.seconds / 60)), 'minuto', 'minutos')}`);
  render(); // Hoy puede haber cambiado (un hábito marcado, la tarjeta de Zen)
});

zenBody.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (!target || target.disabled) return;
  const { zenScreen, zenChoice, zenWord, zenIntensity, zenEmotionDelete } = target.dataset;
  if (zenScreen) {
    showZenScreen(zenScreen);
  } else if (zenChoice) {
    const [key, raw] = zenChoice.split(':');
    const value = typeof DEFAULT_ZEN_SETTINGS[key] === 'number' ? Number(raw) : raw;
    setZenSetting(key, value);
    // Cambiar de sonido mientras suena: se oye el nuevo al momento.
    if (key === 'sound' && zenRunning('sounds') && !zenRun.pausedAt) {
      if (zenRun.player) zenRun.player.stop();
      zenRun.player = startSound(value, state.zen.settings.volume);
    }
    renderZen();
    zenBody.querySelector(`[data-zen-choice="${zenChoice}"]`)?.focus();
  } else if (target.hasAttribute('data-zen-start')) {
    ({ breath: startBreath, meditation: startMeditation, sounds: startSounds, grounding: startGrounding })[ui.zenScreen]();
    zenBody.querySelector('#zen-controls button')?.focus();
  } else if (target.hasAttribute('data-zen-pause')) {
    toggleZenPause();
    zenBody.querySelector('[data-zen-pause]')?.focus();
  } else if (target.hasAttribute('data-zen-stop')) {
    finishZen(false);
  } else if (target.hasAttribute('data-zen-again')) {
    ui.zenResult = null;
    renderZen();
    zenBody.querySelector('[data-zen-start]')?.focus();
  } else if (target.hasAttribute('data-zen-found')) {
    groundingFound();
  } else if (target.hasAttribute('data-zen-more')) {
    ui.zenShown += 14;
    renderZen();
  } else if (zenWord) {
    const { words } = ui.zenDraft;
    ui.zenDraft.words = words.includes(zenWord) ? words.filter((w) => w !== zenWord) : [...words, zenWord].slice(0, ZEN_WORDS_MAX);
    renderZen();
    zenBody.querySelector(`[data-zen-word="${zenWord}"]`)?.focus();
  } else if (zenIntensity) {
    ui.zenDraft.intensity = Number(zenIntensity);
    renderZen();
    zenBody.querySelector(`[data-zen-intensity="${zenIntensity}"]`)?.focus();
  } else if (target.hasAttribute('data-zen-emotion-save')) {
    const result = addEmotion(ui.zenDraft);
    if (result.error) return;
    ui.zenDraft = { words: [], intensity: 3, note: '' };
    renderZen();
    $('#zen-live').textContent = 'Guardado';
    zenBody.querySelector('.zen-history')?.scrollIntoView({ block: 'nearest' });
  } else if (zenEmotionDelete) {
    askConfirm({
      icon: 'trash',
      title: '¿Borrar este registro?',
      body: '<p>Se borra de tus emociones. No se puede deshacer.</p>',
      confirmText: 'Borrar',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      deleteEmotion(zenEmotionDelete);
      renderZen();
    });
  } else {
    return;
  }
  haptic();
});

zenBody.addEventListener('input', (e) => {
  const { gratitude } = e.target.dataset;
  if (gratitude !== undefined) setGratitude(ui.today, Number(gratitude), e.target.value);
  else if (e.target.hasAttribute('data-zen-note')) ui.zenDraft.note = e.target.value;
  else if (e.target.hasAttribute('data-zen-volume') && zenRun && zenRun.player) zenRun.player.setVolume(Number(e.target.value));
});

zenBody.addEventListener('change', (e) => {
  const key = e.target.dataset.zenSetting;
  if (key) {
    const value = e.target.type === 'checkbox' ? e.target.checked
      : key === 'habitId' ? e.target.value || null
      : Number(e.target.value);
    setZenSetting(key, value);
    if (e.target.type === 'checkbox') haptic();
  } else if (e.target.hasAttribute('data-zen-volume')) {
    setZenSetting('volume', Number(e.target.value));
  }
});

// Al volver a la app con una práctica en marcha: se pone al día y vuelve a pedir la pantalla encendida.
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !zenRun) return;
  tickZen();
  if (zenRun && !zenRun.pausedAt) keepAwake(true);
});

// ---------- Rutinas ----------

// Crear, editar, ordenar o borrar rutinas nunca toca los hábitos ni sus días: solo cambia cómo se agrupan en Hoy.
const findRoutine = (id) => state.routines.find((r) => r.id === id);
const routineOf = (habitId) => state.routines.find((r) => r.habitIds.includes(habitId)) || null;

// Reparte los hábitos (ya ordenados) entre sus rutinas; las que no tienen ninguno visible no se enseñan.
function routineGroups(habits) {
  const groups = state.routines
    .map((routine) => ({ routine, habits: habits.filter((h) => routine.habitIds.includes(h.id)) }))
    .filter((g) => g.habits.length);
  const grouped = new Set(groups.flatMap((g) => g.habits));
  return { groups, rest: habits.filter((h) => !grouped.has(h)) };
}

// Guarda una rutina nueva (sin id) o editada. Un hábito elegido deja la rutina en la que estuviera.
function saveRoutine({ id = null, name, habitIds = [] }) {
  const clean = String(name || '').trim().slice(0, ROUTINE_NAME_MAX);
  const same = state.routines.find((r) => r.id !== id && r.name.toLocaleLowerCase('es') === clean.toLocaleLowerCase('es'));
  if (!clean) return { errors: { name: 'Ponle un nombre, por ejemplo «Mañana».' } };
  if (same) return { errors: { name: 'Ya tienes una rutina con ese nombre.' } };
  let routine = id && findRoutine(id);
  if (!routine) {
    if (state.routines.length >= ROUTINE_MAX) return { errors: { name: `Puedes tener hasta ${ROUTINE_MAX} rutinas.` } };
    routine = { id: uid(), name: clean, habitIds: [] };
    state.routines.push(routine);
  }
  const chosen = [...new Set(habitIds.map(String))].filter((hid) => findHabit(hid));
  state.routines.forEach((r) => {
    if (r !== routine) r.habitIds = r.habitIds.filter((hid) => !chosen.includes(hid));
  });
  // Los archivados que ya estaban se quedan: no se ven en la lista, pero vuelven con su rutina al restaurarlos.
  const archived = routine.habitIds.filter((hid) => findHabit(hid)?.archived && !chosen.includes(hid));
  routine.name = clean;
  routine.habitIds = [...chosen, ...archived];
  save();
  return { routine };
}

function deleteRoutine(id) {
  state.routines = state.routines.filter((r) => r.id !== id);
  save();
}

function moveRoutine(id, step) {
  const from = state.routines.findIndex((r) => r.id === id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= state.routines.length) return;
  const [routine] = state.routines.splice(from, 1);
  state.routines.splice(to, 0, routine);
  save();
}

// Rutina de un hábito desde su hoja de edición ('' = ninguna).
function setHabitRoutine(habitId, routineId) {
  state.routines.forEach((r) => { r.habitIds = r.habitIds.filter((hid) => hid !== habitId); });
  const routine = routineId && findRoutine(routineId);
  if (routine) routine.habitIds.push(habitId);
}

function renderRoutineList() {
  const last = state.routines.length - 1;
  $('#routine-list').innerHTML = state.routines.map((r, i) => {
    const habits = r.habitIds.map(findHabit).filter((h) => h && !h.archived);
    const name = escapeHTML(r.name);
    const emojis = habits.map((h) => escapeHTML(h.emoji)).join(' ');
    return `<li>
      <span class="routine-info"><b>${name}</b><span>${habits.length ? `${plural(habits.length, 'hábito', 'hábitos')} · ${emojis}` : 'Sin hábitos'}</span></span>
      <button type="button" class="icon-btn" data-routine-move="-1" data-id="${escapeHTML(r.id)}" aria-label="Subir «${name}»"${i === 0 ? ' disabled' : ''}>${ICONS.chevronUp}</button>
      <button type="button" class="icon-btn" data-routine-move="1" data-id="${escapeHTML(r.id)}" aria-label="Bajar «${name}»"${i === last ? ' disabled' : ''}>${ICONS.chevronDown}</button>
      <button type="button" class="pill-btn small" data-routine-edit="${escapeHTML(r.id)}" aria-label="Editar «${name}»">Editar</button>
    </li>`;
  }).join('');
  $('#routine-add').disabled = state.routines.length >= ROUTINE_MAX;
}

$('#routine-list').addEventListener('click', (e) => {
  const move = e.target.closest('[data-routine-move]');
  const edit = e.target.closest('[data-routine-edit]');
  if (edit) {
    openRoutine(edit.dataset.routineEdit);
    return;
  }
  if (!move) return;
  const { id } = move.dataset;
  const step = Number(move.dataset.routineMove);
  moveRoutine(id, step);
  renderRoutineList();
  haptic();
  // El foco sigue en la misma flecha; si ya no se puede mover más hacia ahí, pasa a la otra.
  const same = $(`#routine-list [data-routine-move="${step}"][data-id="${CSS.escape(id)}"]`);
  (same && !same.disabled ? same : $(`#routine-list [data-routine-move="${-step}"][data-id="${CSS.escape(id)}"]`))?.focus();
});
$('#routine-add').addEventListener('click', () => openRoutine());

const routineDialog = $('#routine-dialog');
const routineName = $('#routine-name');

function showRoutineError(message) {
  const el = $('#routine-name-error');
  el.textContent = message || '';
  el.hidden = !message;
  if (message) routineName.setAttribute('aria-invalid', 'true');
  else routineName.removeAttribute('aria-invalid');
}

function openRoutine(id = null) {
  const routine = id ? findRoutine(id) : null;
  ui.routineEdit = routine ? routine.id : null;
  $('#routine-title').textContent = routine ? 'Editar rutina' : 'Nueva rutina';
  routineName.value = routine ? routine.name : '';
  $('#routine-delete').hidden = !routine;
  const habits = visibleHabits();
  $('#routine-habits').innerHTML = habits.length ? habits.map((h) => {
    const other = routineOf(h.id);
    const where = other && other !== routine ? `<span>Ahora en «${escapeHTML(other.name)}»</span>` : '';
    return `<label class="check-row" style="--c:${colorHex(h.color)}">
      <span class="emoji" aria-hidden="true">${escapeHTML(h.emoji)}</span>
      <span class="check-text"><b>${escapeHTML(h.name)}</b>${where}</span>
      <input type="checkbox" value="${escapeHTML(h.id)}"${routine && routine.habitIds.includes(h.id) ? ' checked' : ''}>
    </label>`;
  }).join('') : '<p class="card-text">Aún no tienes hábitos. Puedes crear la rutina y añadirlos después.</p>';
  showRoutineError('');
  routineDialog.showModal();
}

$('#routine-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const editing = Boolean(ui.routineEdit);
  const habitIds = [...document.querySelectorAll('#routine-habits input:checked')].map((input) => input.value);
  const result = saveRoutine({ id: ui.routineEdit, name: routineName.value, habitIds });
  if (result.errors) {
    showRoutineError(result.errors.name);
    routineName.focus();
    return;
  }
  routineDialog.close();
  render();
  haptic();
  toast(editing ? 'Rutina guardada' : `Rutina «${result.routine.name}» creada`);
});

$('#routine-delete').addEventListener('click', () => {
  const routine = findRoutine(ui.routineEdit);
  if (!routine) return;
  const snapshot = JSON.stringify(state);
  routineDialog.close();
  deleteRoutine(routine.id);
  render();
  haptic();
  toast(`Rutina «${routine.name}» eliminada; tus hábitos siguen igual`, { action: 'Deshacer', onAction: undoTo(snapshot) });
});
$('#routine-cancel').addEventListener('click', () => routineDialog.close());
routineDialog.addEventListener('click', (e) => {
  if (e.target === routineDialog) routineDialog.close();
});

// ---------- Pantalla "Ajustes" ----------

const fmtMonthYear = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const profileName = $('#profile-name');
const profileAvatar = $('#profile-avatar');

// Los emojis editables (avatar y emoji del hábito) se ven en un <span> centrado; el <input> de encima
// es invisible y solo recoge lo que escribes. Dentro de un <input>, Safari los recorta y los descentra.
// Si el campo está vacío mientras escribes, se ve `fallback`.
function showEmoji(input, fallback = '') {
  input.parentElement.querySelector('.emoji-glyph').textContent = input.value || fallback;
}

$('#avatar-grid').innerHTML = AVATARS
  .map((e) => `<button type="button" data-avatar="${e}" aria-label="${e}">${e}</button>`)
  .join('');
$('#app-version').innerHTML = `Bonsái · versión ${APP_VERSION}<br>Tus datos se guardan solo en este dispositivo.`;

function renderSettings() {
  const stats = computeStats();
  const meta = levelInfo(stats.level);
  const { profile } = state;

  // No pisamos lo que la persona está escribiendo.
  if (document.activeElement !== profileName) profileName.value = profile.name;
  if (document.activeElement !== profileAvatar) profileAvatar.value = profile.avatar;
  showEmoji(profileAvatar, profile.avatar);

  const nameDisplay = $('#profile-name-display');
  nameDisplay.textContent = profile.name || 'Añade tu nombre';
  nameDisplay.classList.toggle('no-name', !profile.name);
  $('#profile-level').textContent = `Nivel ${stats.level} · ${meta.title}`;
  $('#profile-since').textContent = `En Bonsái desde ${fmtMonthYear.format(parseKey(profile.since))}`;
  document.querySelectorAll('#avatar-grid button').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.avatar === profile.avatar));
  });

  renderRoutineList();
  renderBackupNotes();
  renderPrefControls();

  $('#backup-date').textContent = state.lastBackup
    ? `Última copia: ${fmtCaptionYear.format(parseKey(state.lastBackup)).replace(/\./g, '')}`
    : 'Aún no has hecho ninguna copia.';
  renderBackupDue();
  renderStorage();

  const archived = state.habits.filter((h) => h.archived);
  $('#archived-section').hidden = !archived.length;
  $('#archived-list').innerHTML = archived.map((h) => {
    const since = h.archived > ui.today ? ui.today : h.archived;
    const name = escapeHTML(h.name);
    return `<li style="--c:${colorHex(h.color)}">
      <span class="emoji" aria-hidden="true">${escapeHTML(h.emoji)}</span>
      <span class="archived-info"><b>${name}</b><span>Desde el ${shortDate(since)} · ${fmtNumber.format(streakInfo(h).xp)}&nbsp;XP</span></span>
      <button type="button" class="pill-btn small" data-restore="${h.id}" aria-label="Restaurar ${name}">Restaurar</button>
      <button type="button" class="icon-btn danger" data-remove="${h.id}" aria-label="Borrar ${name}">${ICONS.trash}</button>
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
  toast(`«${habit.name}» archivado`, { action: 'Deshacer', onAction: undoTo(snapshot) });
}

// Los días que estuvo archivado cuentan como una pausa, para que no rompan la racha.
function unarchive(habit) {
  const yesterday = shiftKey(ui.today, -1);
  if (habit.archived <= yesterday) habit.pauses.push({ from: habit.archived, to: yesterday });
  habit.archived = null;
}

function restoreHabit(habit) {
  if (!habit) return;
  unarchive(habit);
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
  state.routines.forEach((r) => { r.habitIds = r.habitIds.filter((id) => id !== habit.id); });
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
  showEmoji(profileAvatar, state.profile.avatar);
  if (!emoji) return;
  state.profile.avatar = emoji;
  save();
  renderSettings();
});
profileAvatar.addEventListener('blur', () => {
  profileAvatar.value = state.profile.avatar;
  showEmoji(profileAvatar);
});
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
    icon: 'rotate',
    title: '¿Restablecer tu progreso?',
    body: `<p>Ahora mismo tienes <b>nivel ${stats.level}</b>, <b>${fmtNumber.format(stats.xp)} XP</b> y <b>${
      ACHIEVEMENTS.filter((a) => isUnlocked(a, stats)).length} logros</b>.</p>
      <ul class="confirm-list">
        <li>${ICONS.x}<span>Tu XP y tu nivel vuelven a cero</span></li>
        <li>${ICONS.x}<span>Todos los logros se bloquean otra vez</span></li>
        <li>${ICONS.x}<span>Se borra el historial de días y las rachas</span></li>
        <li class="keep">${ICONS.check}<span>Tus hábitos, rutinas, perfil, diario y Salud se mantienen</span></li>
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
  toast('Progreso restablecido', {
    action: 'Deshacer',
    onAction: () => replaceState(normalize(JSON.parse(snapshot))),
  });
});

// ---------- Ajustes de la app ----------

const THEME_COLORS = { light: '#F6F5F1', dark: '#161A18' }; // el fondo de cada tema, para la barra del sistema

// Tema y tamaño del texto (como atributos de <html>, igual que el script del <head>).
function applyPrefs() {
  const { prefs } = state;
  const root = document.documentElement;
  if (prefs.theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = prefs.theme;
  if (prefs.textSize === 'normal') delete root.dataset.text;
  else root.dataset.text = prefs.textSize;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    const own = meta.media.includes('dark') ? 'dark' : 'light';
    meta.content = THEME_COLORS[prefs.theme === 'auto' ? own : prefs.theme];
  });
}

function setPref(key, value) {
  state.prefs = normalizePrefs({ ...state.prefs, [key]: value });
  save();
  applyPrefs();
  render();
}

// Controles con data-pref: opciones (botones con data-value), interruptores y desplegables.
const settingsView = $('#view-settings');
settingsView.addEventListener('click', (e) => {
  const option = e.target.closest('button[data-pref]');
  const info = e.target.closest('[data-info]');
  if (info) openInfo(info.dataset.info);
  if (!option) return;
  setPref(option.dataset.pref, option.dataset.value);
  haptic();
});
settingsView.addEventListener('change', (e) => {
  const control = e.target.closest('input[data-pref], select[data-pref]');
  if (!control) return;
  const key = control.dataset.pref;
  if (control.type === 'checkbox') setPref(key, control.checked);
  else setPref(key, typeof DEFAULT_PREFS[key] === 'number' ? Number(control.value) : control.value);
  if (control.type === 'checkbox') haptic(); // al activar la vibración, se nota al momento
});

function renderPrefControls() {
  settingsView.querySelectorAll('[data-pref]').forEach((control) => {
    const value = state.prefs[control.dataset.pref];
    if (control.tagName === 'BUTTON') control.setAttribute('aria-checked', String(control.dataset.value === String(value)));
    else if (control.type === 'checkbox') control.checked = value;
    else control.value = String(value);
  });
}

// Aviso de copia (solo en Ajustes): { days } desde la última, o days = null si aún no hay ninguna.
const daysBetween = (from, to) => Math.round((parseKey(to) - parseKey(from)) / 864e5);
function backupDue() {
  const every = state.prefs.backupReminder;
  const hasData = state.habits.length > 0 || state.health.entries.length > 0 || Object.keys(state.days).length > 0;
  if (!every || !hasData) return null;
  if (!state.lastBackup) return { days: null };
  const days = daysBetween(state.lastBackup, ui.today);
  return days >= every ? { days } : null;
}

function renderBackupDue() {
  const due = backupDue();
  $('#backup-due').hidden = !due;
  $('#backup-date').hidden = Boolean(due); // el aviso ya dice cuándo fue la última
  if (!due) return;
  $('#backup-due').textContent = due.days === null
    ? 'Aún no has hecho ninguna copia. Exporta una para no perder tus datos.'
    : `Tu última copia es de hace ${plural(due.days, 'día', 'días')}. Conviene hacer otra.`;
}

// Almacenamiento: lo que ocupan tus datos y si el navegador se compromete a no borrarlos.
const fmtSize = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const fmtBytes = (n) => (n < 1024 * 1024 ? `${fmtNumber.format(Math.max(1, Math.round(n / 1024)))} KB` : `${fmtSize.format(n / 1024 / 1024)} MB`);

function dataSizes() {
  const size = (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? utf8Bytes(value) : 0;
    } catch (err) {
      return 0;
    }
  };
  return { data: size(STORAGE_KEY), saved: size(PRE_IMPORT_KEY) + size(RESCUE_KEY) };
}

async function renderStorage() {
  const { data, saved } = dataSizes();
  const rows = [['Tus datos', fmtBytes(data)]];
  if (saved) rows.push(['Copias guardadas en el dispositivo', fmtBytes(saved)]);
  const storage = navigator.storage;
  const [estimate, persisted] = await Promise.all([
    storage && storage.estimate ? storage.estimate().catch(() => null) : null,
    storage && storage.persisted ? storage.persisted().catch(() => null) : null,
  ]);
  if (estimate && estimate.usage) rows.push(['En total, con lo necesario para funcionar sin conexión', fmtBytes(estimate.usage)]);
  $('#storage-list').innerHTML = rows.map(([label, value]) => `<li><span>${label}</span><b>${value}</b></li>`).join('');
  $('#storage-protect').textContent = persisted === true
    ? 'Protegidos: el navegador no los borrará aunque al dispositivo le falte espacio.'
    : persisted === false
      ? 'Sin protección: si al dispositivo le falta espacio, el navegador podría borrarlos. Haz copias de vez en cuando.'
      : 'Este navegador no indica si protege tus datos. Haz copias de vez en cuando.';
  $('#storage-persist').hidden = persisted !== false || !storage.persist;
}

$('#storage-persist').addEventListener('click', async () => {
  const ok = await navigator.storage.persist().catch(() => false);
  toast(ok ? 'Tus datos quedan protegidos' : 'El navegador no lo ha permitido; suele hacerlo si instalas la app en la pantalla de inicio');
  renderStorage();
});

// Borrar todo lo de Bonsái en este dispositivo (se puede deshacer unos segundos desde el aviso).
function eraseAllData() {
  const fresh = emptyState();
  fresh.challengesSince = weekStartOf(ui.today);
  fresh.lastSummary = weekStartOf(ui.today);
  [PRE_IMPORT_KEY, RESCUE_KEY].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      // no había nada que borrar
    }
  });
  return replaceState(fresh);
}

$('#erase-btn').addEventListener('click', async () => {
  const counts = backupCounts(state);
  const ok = await askConfirm({
    icon: 'trash',
    title: '¿Borrar todos tus datos?',
    body: `<p>Se borra todo lo de Bonsái en este dispositivo:</p>
      <ul class="confirm-list">
        <li>${ICONS.x}<span>${plural(counts.habits, 'hábito', 'hábitos')} y todo su historial</span></li>
        <li>${ICONS.x}<span>Tu diario, tus rutinas y tus registros de Salud</span></li>
        <li>${ICONS.x}<span>Tu perfil, tu nivel, tus logros y tus ajustes</span></li>
        <li>${ICONS.x}<span>Las copias guardadas antes de importar y los datos apartados</span></li>
      </ul>
      <p>Solo podrás deshacerlo durante unos segundos, desde el aviso.</p>
      <button type="button" class="link-btn" data-export>Exportar una copia antes</button>`,
    confirmText: 'Borrar todo',
    danger: true,
  });
  if (!ok) return;
  const snapshot = JSON.stringify(state);
  eraseAllData();
  ui.day = ui.today;
  showView('today');
  haptic();
  toast('Todos los datos borrados', { action: 'Deshacer', onAction: undoTo(snapshot) });
});

// ---------- Ayuda: bienvenida, preguntas frecuentes y novedades ----------

const infoDialog = $('#info-dialog');
const faqItem = (question, answer) => `<details class="faq"><summary>${question}${ICONS.chevronRight}</summary><p>${answer}</p></details>`;
const stepItem = (icon, title, text) => `<li><span class="sum-icon">${ICONS[icon]}</span><span><b>${title}</b>${text}</span></li>`;

const INFO = {
  welcome: () => ({
    title: 'Cómo se usa Bonsái',
    body: `<ul class="summary-list">
      ${stepItem('plus', 'Crea un hábito', 'Toca + y elige qué quieres cultivar. Cada tipo trae su meta: minutos, vasos, páginas…')}
      ${stepItem('checkCircle', 'Márcalo al hacerlo', 'Un toque y ganas XP. En los de cantidad, mantén pulsado para apuntar lo que hiciste. Con ‹ › vas a días anteriores.')}
      ${stepItem('flame', 'Cuida tu racha', 'Los días de descanso y las pausas no la rompen, y los protectores te cubren si un día se te olvida.')}
      ${stepItem('target', 'Retos y niveles', 'Cada lunes hay 3 retos nuevos. Con la XP subes de nivel, de Semilla a Maestro.')}
      ${stepItem('chart', 'Revisa tu semana', 'Al empezar la semana verás cómo fue la anterior; en Progreso tienes la revisión y tus tendencias.')}
      ${stepItem('shield', 'Tus datos son tuyos', 'Se quedan en este dispositivo. Haz una copia de vez en cuando desde Ajustes.')}
    </ul>`,
  }),
  faq: () => ({
    title: 'Preguntas frecuentes',
    body: [
      faqItem('¿Cómo gano XP?', `+${XP_PER_CHECK} por cada hábito hecho, más 1 por cada día (o semana) de racha, hasta +${XP_STREAK_CAP}. Un día perfecto (todo lo que tocaba) da +${XP_PERFECT_DAY}; cada reto semanal, de +30 a +60, y un día extra (hacerlo en su día de descanso), +${XP_PER_CHECK}. Todo sale de tu historial: si desmarcas un día, esa XP se resta.`),
      faqItem('¿Cuándo se rompe una racha?', 'Cuando pasa sin hacerlo un día que tocaba. Los días de descanso y los de pausa no cuentan. En los de «X veces por semana», la racha son semanas cumplidas, y la semana en curso no la rompe hasta que termina.'),
      faqItem('¿Qué son los protectores?', `Ganas 1 cada vez que un hábito llega a ${SHIELD_EVERY}, ${SHIELD_EVERY * 2}, ${SHIELD_EVERY * 3}… días seguidos (como mucho guardas ${SHIELD_MAX}). Si ayer se te olvidó un hábito diario con una racha de ${SHIELD_MIN_STREAK} días o más, al abrir la app se gasta uno solo y la racha se mantiene. Ese día no da XP y, si luego lo marcas, el protector vuelve.`),
      faqItem('¿Cómo funcionan los retos?', 'Cada lunes salen 3 retos elegidos según tus hábitos, los mismos toda la semana. Dan de 30 a 60 XP. Los ves en Hoy y, con detalle, en Progreso.'),
      faqItem('¿Cómo apunto una cantidad?', 'En los de tiempo, distancia o páginas, un toque marca la meta y, si mantienes pulsado, apuntas lo que hiciste de verdad. En los contadores (vasos, piezas…), cada toque suma 1 y mantener pulsado resta 1. Con teclado, la tecla − hace lo mismo que mantener pulsado.'),
      faqItem('¿Puedo marcar un día que se me olvidó?', 'Sí. En Hoy, usa las flechas ‹ › para ir a días anteriores. O en el Historial: toca el día y luego «Ver día».'),
      faqItem('¿Pausar, archivar o eliminar?', 'Pausar (vacaciones, una lesión…) lo aparta sin romper la racha. Archivar lo quita de Hoy y del Historial, pero conservas su XP y puedes restaurarlo desde Ajustes. Eliminar lo borra, con unos segundos para deshacerlo, y tu XP total no cambia.'),
      faqItem('¿Qué son las rutinas?', 'Grupos de hábitos, como «Mañana» o «Noche», para verlos juntos en Hoy. Solo ordenan: no dan XP ni marcan nada por ti.'),
      faqItem('¿Qué guarda Salud?', 'Las medidas que elijas: peso, cintura, pulso en reposo, tensión arterial, sueño, grasa corporal, temperatura y pasos, con fecha y nota. Es privado y va aparte: no da XP ni cuenta para rachas, y Bonsái no interpreta tus medidas ni da consejos médicos. Se abre desde su tarjeta en Hoy, que puedes ocultar aquí, en Ajustes.'),
      faqItem('¿Qué es Zen?', 'Un rincón para la calma, desde la tarjeta de Hoy: respiración guiada, meditación con campana, sonidos para relajarte y el ejercicio 5-4-3-2-1, además de gratitud y emociones. No da XP ni rachas; si quieres, al terminar una práctica marca el hábito que elijas (en los de minutos, como Meditar, suma lo practicado). Cuenta cada práctica de un minuto o más.'),
      faqItem('¿Dónde se guardan mis datos? ¿Se sincronizan?', 'Solo en este dispositivo: no hay cuenta ni servidor, así que no se sincronizan solos. Para pasarlos a otro móvil, exporta una copia y luego impórtala allí.'),
      faqItem('¿Qué pasa si borro la app?', 'En el iPhone, borrar el icono borra también sus datos; en Android puede pasar al borrar los datos de Chrome. Por eso conviene exportar una copia de vez en cuando (Bonsái te lo puede recordar).'),
    ].join(''),
  }),
  news: () => ({
    title: 'Novedades',
    body: `<h3 class="news-title">Versión ${APP_VERSION}</h3>
      <ul class="news-list">
        <li>Zen, desde una tarjeta en Hoy: respiración guiada (caja, 4-7-8 y tranquila), meditación con campana, sonidos para relajarte y el ejercicio 5-4-3-2-1.</li>
        <li>Gratitud y emociones, con su historial, y una reflexión distinta cada día.</li>
        <li>Al terminar una práctica, puede marcarse el hábito que elijas, como Meditar.</li>
        <li>Salud se abre ahora desde una tarjeta en Hoy, como Zen, y la barra se queda con 4 pestañas.</li>
      </ul>
      <h3 class="news-title">Versión 0.7 beta</h3>
      <ul class="news-list">
        <li>Salud, mucho más completa: cintura, pulso en reposo, tensión arterial, sueño, grasa corporal, temperatura y pasos, además del peso. Tú eliges cuáles ver y en qué unidad.</li>
        <li>Registro rápido para apuntar varias medidas a la vez, con notas rápidas como «en ayunas».</li>
        <li>Media de 7 días en la gráfica, estadísticas del periodo y comparación con el anterior.</li>
        <li>Exportar Salud a CSV y un recordatorio en el calendario para medirte.</li>
      </ul>
      <h3 class="news-title">Versión 0.6 beta</h3>
      <ul class="news-list">
        <li>Ajustes nuevos: tema claro u oscuro, tamaño del texto, vibración y con qué pantalla se abre la app.</li>
        <li>Puedes ocultar los retos o el diario de Hoy, la pestaña Salud y el resumen de cada semana.</li>
        <li>Aviso para hacer copias, cuánto ocupan tus datos y la opción de borrarlo todo.</li>
        <li>Ayuda, novedades y la bienvenida, aquí en Ajustes.</li>
      </ul>
      <h3 class="news-title">Versión 0.5 beta</h3>
      <ul class="news-list">
        <li>Salud: apunta tu peso, con gráfica e historial.</li>
        <li>Revisión semanal y tendencias en Progreso.</li>
        <li>Rutinas para agrupar tus hábitos.</li>
        <li>Copias de seguridad más claras y seguras, y mejoras de accesibilidad.</li>
      </ul>`,
  }),
};

function openInfo(kind) {
  const { title, body } = INFO[kind]();
  $('#info-title').textContent = title;
  $('#info-body').innerHTML = body;
  infoDialog.showModal();
  infoDialog.querySelector('.info-card').scrollTop = 0;
}

$('#news-sub').textContent = `Qué hay nuevo en la versión ${APP_VERSION}`;
$('#info-close').addEventListener('click', () => infoDialog.close());
infoDialog.addEventListener('click', (e) => {
  if (e.target === infoDialog) infoDialog.close();
});

// ---------- Diálogo de confirmación ----------

const confirmDialog = $('#confirm');

// Devuelve una promesa: true si se confirma, false si se cancela o se cierra.
function askConfirm({ icon, title, body, confirmText, danger = false }) {
  $('#confirm-icon').innerHTML = ICONS[icon];
  $('#confirm-icon').classList.toggle('danger', danger);
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

$('#mood-row').innerHTML = MOOD_NAMES.map((name, i) => (
  `<button type="button" role="radio" data-mood="${i + 1}" aria-label="${name}">${moodIcon(i + 1)}</button>`
)).join('');

function setDayEntry(day, patch) {
  const entry = { ...(state.days[day] || {}), ...patch };
  if (!entry.mood) delete entry.mood;
  if (!entry.note) delete entry.note;
  if (entry.mood || entry.note) state.days[day] = entry;
  else delete state.days[day];
  save();
}

function renderJournal(hasHabits) {
  const shown = hasHabits && state.prefs.showJournal;
  $('#journal').hidden = !shown;
  if (!shown) return;
  const day = ui.day;
  const entry = state.days[day] || {};
  const hasNote = Boolean(entry.note && entry.note.trim());
  $('#journal-title').textContent = day === ui.today ? '¿Qué tal el día?' : '¿Qué tal fue ese día?';
  document.querySelectorAll('#mood-row [data-mood]').forEach((btn) => {
    btn.setAttribute('aria-checked', String(Number(btn.dataset.mood) === entry.mood));
  });
  const open = Boolean(entry.note) || ui.noteOpenFor === day;
  $('#note-box').hidden = !open;
  $('#note-open').hidden = open;
  $('#note-actions').hidden = !(open && hasNote);
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

$('#note-clear').addEventListener('click', () => {
  noteInput.value = '';
  setDayEntry(ui.day, { note: '' });
  ui.noteOpenFor = undefined;
  renderJournal(true);
  haptic();
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
      if (hDue) rows.push({ habit: h, pct: hDone / hDue, done: hDone, due: hDue });
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
      moodDays: moods.length,
      rows,
    };
  });
}

const summaryDialog = $('#summary');

function showSummary(ws) {
  ui.summaryWeek = ws;
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
    sum.best ? `<li><span class="sum-icon">${ICONS.award}</span><span><b>Tu mejor hábito</b>${habitLine(sum.best)}</span></li>` : '',
    sum.hardest ? `<li><span class="sum-icon">${ICONS.mountain}</span><span><b>El que más te cuesta</b>${habitLine(sum.hardest)}</span></li>` : '',
    sum.mood ? `<li><span class="sum-icon">${moodIcon(Math.round(sum.mood))}</span><span><b>Ánimo medio</b>${sum.mood.toFixed(1).replace('.', ',')} de 5</span></li>` : '',
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
  // Se apunta como visto aunque esté desactivado, para que al activarlo no salga uno atrasado.
  state.lastSummary = thisWeek;
  save();
  if (state.prefs.weeklySummary) showSummary(prev);
}

$('#summary-close').addEventListener('click', () => summaryDialog.close());
summaryDialog.addEventListener('click', (e) => {
  if (e.target === summaryDialog) summaryDialog.close();
});
$('#summary-review').addEventListener('click', () => {
  summaryDialog.close();
  openReview(ui.summaryWeek);
});

// ---------- Revisión semanal ----------

// Semanas completas que se pueden revisar: de la primera con historial (hasta un año atrás) a la pasada.
function reviewBounds() {
  const last = shiftKey(weekStartOf(ui.today), -7);
  let first = last;
  for (let i = 0; i < 52 && hasWeekHistory(shiftKey(first, -7)); i++) first = shiftKey(first, -7);
  return { first, last };
}

// Columnas pequeñas de una sola serie: el valor encima, la etiqueta debajo; `em` resalta una.
function miniBars(items, label) {
  const aria = `${label}: ${items.map((i) => `${i.name}, ${i.value === null ? i.empty : i.text}`).join('; ')}`;
  return `<div class="mini-bars" role="img" aria-label="${escapeHTML(aria)}">${items.map((i) => `<div class="mini-bar${i.em ? ' em' : ''}">
      <span class="mb-value">${i.text}</span>
      <span class="mb-track"><span class="mb-fill" style="height:${i.value === null ? 0 : Math.max(3, Math.round(i.value * 100))}%"></span></span>
      <span class="mb-label">${i.label}</span>
    </div>`).join('')}</div>`;
}

const reviewDialog = $('#review');
const reviewBody = $('#review-body');

function openReview(ws = shiftKey(weekStartOf(ui.today), -7)) {
  ui.reviewWeek = ws;
  ui.reviewArchived = new Set(); // los archivados desde la revisión siguen en la lista, para poder restaurarlos
  $('#review-status').textContent = '';
  renderReview();
  document.documentElement.classList.add('locked');
  if (!reviewDialog.open) reviewDialog.showModal();
  reviewBody.scrollTop = 0;
}

function renderReview() {
  const ws = ui.reviewWeek;
  const { first, last } = reviewBounds();
  const sum = weekSummary(ws);
  const prev = hasWeekHistory(shiftKey(ws, -7)) ? weekSummary(shiftKey(ws, -7)) : null;
  const pct = sum.pct === null ? null : Math.round(sum.pct * 100);
  const weeksAgo = Math.round((parseKey(weekStartOf(ui.today)) - parseKey(ws)) / (7 * 864e5));

  const nav = `<div class="review-nav">
    <button type="button" class="icon-btn" data-review-week="-7" aria-label="Semana anterior"${ws <= first ? ' disabled' : ''}>${ICONS.chevronLeft}</button>
    <div class="review-week"><b>${weekRange(ws)}</b><span>${weeksAgo === 1 ? 'La semana pasada' : `Hace ${weeksAgo} semanas`}</span></div>
    <button type="button" class="icon-btn" data-review-week="7" aria-label="Semana siguiente"${ws >= last ? ' disabled' : ''}>${ICONS.chevronRight}</button>
  </div>`;

  // Cómo fue: lo mismo que el resumen, dicho sin juicios, y las últimas semanas para ver la tendencia.
  let delta = '';
  if (pct !== null && prev && prev.pct !== null) {
    const diff = pct - Math.round(prev.pct * 100);
    delta = diff > 0 ? `${plural(diff, 'punto', 'puntos')} más que la semana anterior`
      : diff < 0 ? `${plural(-diff, 'punto', 'puntos')} menos que la semana anterior`
      : 'Igual que la semana anterior';
  }
  const recent = [-21, -14, -7, 0].map((d) => shiftKey(ws, d)).filter(hasWeekHistory);
  const bars = recent.length >= 2 ? `<p class="review-sub">Las últimas semanas</p>${miniBars(recent.map((w) => {
    const p = weekSummary(w).pct;
    return {
      value: p, text: p === null ? '—' : `${Math.round(p * 100)} %`, empty: 'no tocaba nada',
      label: shortDate(w), name: `semana del ${shortDate(w)}`, em: w === ws,
    };
  }), 'Cumplimiento de cada semana')}` : '';
  const overview = `<section class="review-section" aria-labelledby="rv-overview">
    <h3 class="section-label" id="rv-overview">Cómo fue</h3>
    <article class="card">
      <div class="review-overview">
        <div class="summary-ring" style="--p:${sum.pct || 0}"><b>${pct === null ? '—' : `${pct} %`}</b></div>
        <div class="review-overview-text">
          <p>${pct === null ? 'Esa semana no tocaba ningún hábito.' : `Hiciste ${sum.done} de ${sum.due} de lo que tocaba.`}</p>
          ${delta ? `<span class="delta">${delta}</span>` : ''}
        </div>
      </div>
      <div class="stats">
        <div class="stat"><b>${sum.perfect}</b><span>Días perfectos</span></div>
        <div class="stat"><b>+${fmtNumber.format(sum.xp)}</b><span>XP ganada</span></div>
        <div class="stat"><b>${sum.challenges}</b><span>Retos</span></div>
      </div>
      ${bars}
    </article>
  </section>`;

  // Cada hábito, día a día, en el orden de siempre (sin clasificar el mejor ni el peor).
  const days = weekKeys(ws);
  const habitItems = sum.rows.map(({ habit: h, done, due }) => {
    const clean = `${plural(done, 'día', 'días')} sin ${escapeHTML(quitWhat(h))}`;
    const what = h.kind === 'quit' ? (done === due ? clean : `${plural(due - done, 'recaída', 'recaídas')} · ${clean}`)
      : h.schedule.type === 'weekly' ? `${done} de ${plural(due, 'vez', 'veces')}`
      : `${done} de ${plural(due, 'día', 'días')} que tocaban`;
    return `<li style="--c:${colorHex(h.color)}">
      <span class="emoji" aria-hidden="true">${escapeHTML(h.emoji)}</span>
      <span class="review-habit"><b>${escapeHTML(h.name)}</b><span>${what}${h.archived ? ' · archivado' : ''}</span></span>
      <span class="hm-grid review-days" aria-hidden="true">${days.map((d) => `<i class="${habitCellClass(h, d)}"></i>`).join('')}</span>
    </li>`;
  }).join('');
  const habits = `<section class="review-section" aria-labelledby="rv-habits">
    <h3 class="section-label" id="rv-habits">Tus hábitos</h3>
    <article class="card">
      ${habitItems ? `<ul class="review-list">${habitItems}</ul>
      <p class="rules-note">Cada casilla es un día, de lunes a domingo: con color, hecho; más clara, a medias; con contorno, descanso; gris, en pausa.</p>`
        : '<p class="card-text">Esa semana no tocaba ningún hábito.</p>'}
    </article>
  </section>`;

  // Diario de la semana: ánimo y notas.
  const entries = days.filter((d) => state.days[d]).map((d) => {
    const { mood, note } = state.days[d];
    const label = `${capitalize(fmtWeekday.format(parseKey(d)))} ${parseKey(d).getDate()}${mood ? ` · ${MOOD_NAMES[mood - 1]}` : ''}`;
    return `<li><span class="sum-icon">${mood ? moodIcon(mood) : ICONS.note}</span><span><b>${label}</b>${note ? escapeHTML(note) : 'Sin nota'}</span></li>`;
  }).join('');
  const moodLine = sum.mood ? `<p class="review-sub">Ánimo medio: ${sum.mood.toFixed(1).replace('.', ',')} de 5 (${plural(sum.moodDays, 'día', 'días')})</p>` : '';
  const journal = `<section class="review-section" aria-labelledby="rv-journal">
    <h3 class="section-label" id="rv-journal">Tu diario</h3>
    <article class="card">
      ${entries ? `${moodLine}<ul class="summary-list">${entries}</ul>` : '<p class="card-text">Esa semana no apuntaste ánimo ni notas.</p>'}
    </article>
  </section>`;

  reviewBody.innerHTML = nav + overview + habits + journal + (ws === last ? reviewPlan() : '');
}

// Ajustes para la semana en curso. Empiezan hoy (o mañana, si hoy ya está hecho) y no tocan los días anteriores.
function reviewPlan() {
  const sunday = shiftKey(weekStartOf(ui.today), 6);
  const button = (h, action, text) => `<button type="button" class="pill-btn small" data-review-action="${action}" data-id="${h.id}">${text}</button>`;
  const items = state.habits.filter((h) => !h.archived || ui.reviewArchived.has(h.id)).map((h) => {
    const pause = h.pauses.find((p) => !p.to || p.to >= ui.today);
    let status;
    let actions;
    if (h.archived) {
      status = 'Archivado desde la revisión';
      actions = button(h, 'restore', 'Restaurar');
    } else if (pause) {
      status = pauseText(pause);
      actions = button(h, 'resume', 'Reanudar');
    } else {
      status = h.kind === 'quit' ? `Dejar · ${escapeHTML(quitWhat(h))}` : scheduleLabel(h.schedule);
      actions = (firstFreeDay(h) <= sunday ? button(h, 'pause', 'Pausar esta semana') : '') + button(h, 'archive', 'Archivar');
    }
    return `<li style="--c:${colorHex(h.color)}">
      <span class="emoji" aria-hidden="true">${escapeHTML(h.emoji)}</span>
      <span class="review-habit"><b>${escapeHTML(h.name)}</b><span>${status}</span></span>
      <span class="review-actions">${actions}</span>
    </li>`;
  }).join('');
  if (!items) return '';
  return `<section class="review-section" aria-labelledby="rv-plan">
    <h3 class="section-label" id="rv-plan">Esta semana</h3>
    <article class="card">
      <p class="card-text first">${weekRange(weekStartOf(ui.today))}. Si algo no encaja estos días, puedes pausarlo o archivarlo: empieza hoy (o mañana, si hoy ya lo has hecho) y no cambia los días anteriores.</p>
      <ul class="review-list plan">${items}</ul>
      <p class="rules-note">Para cambiar la frecuencia o la meta, edita el hábito; su racha y su XP se recalculan con lo nuevo.</p>
    </article>
  </section>`;
}

reviewBody.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-review-week]');
  if (nav) {
    const step = nav.dataset.reviewWeek;
    ui.reviewWeek = shiftKey(ui.reviewWeek, Number(step));
    renderReview();
    const again = reviewBody.querySelector(`[data-review-week="${step}"]`);
    (again.disabled ? reviewBody.querySelector('[data-review-week]:not(:disabled)') : again)?.focus();
    $('#review-status').textContent = weekRange(ui.reviewWeek);
    return;
  }
  const btn = e.target.closest('[data-review-action]');
  const habit = btn && findHabit(btn.dataset.id);
  if (!habit) return;
  const message = applyReviewAction(habit, btn.dataset.reviewAction);
  render();
  renderReview();
  haptic();
  $('#review-status').textContent = message;
  reviewBody.querySelector(`[data-review-action][data-id="${habit.id}"]`)?.focus();
});

// Pausar, reanudar, archivar o restaurar desde la revisión. Devuelve el mensaje para anunciarlo.
function applyReviewAction(habit, action) {
  const sunday = shiftKey(weekStartOf(ui.today), 6);
  let message;
  if (action === 'pause') {
    habit.pauses.push({ from: firstFreeDay(habit), to: sunday });
    message = `«${habit.name}» en pausa hasta el ${shortDate(sunday)}`;
  } else if (action === 'resume') {
    resumeHabit(habit);
    message = `«${habit.name}» reanudado`;
  } else if (action === 'archive') {
    habit.archived = firstFreeDay(habit);
    ui.reviewArchived.add(habit.id);
    message = `«${habit.name}» archivado. Puedes restaurarlo aquí o en Ajustes`;
  } else {
    unarchive(habit);
    ui.reviewArchived.delete(habit.id);
    message = `«${habit.name}» vuelve a estar en Hoy`;
  }
  save();
  return message;
}

$('#review-close').addEventListener('click', () => reviewDialog.close());
reviewDialog.addEventListener('click', (e) => {
  if (e.target === reviewDialog) reviewDialog.close();
});
reviewDialog.addEventListener('close', () => document.documentElement.classList.remove('locked'));

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
// `text` sustituye a la descripción de los hábitos (el recordatorio de Salud lleva la suya).
function buildICS({ id, name, emoji, schedule, time, text = '' }) {
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
  const about = text || (schedule.type === 'weekly'
    ? `Esta semana toca «${name}» ${plural(schedule.times, 'vez', 'veces')}. Márcalo en Bonsái.`
    : `Es hora de «${name}». Márcalo en Bonsái.`);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bonsai//Recordatorios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${id}-${Date.now()}@bonsai`,
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
  const file = new File([ics], `bonsai-${slugify(name)}.ics`, { type: 'text/calendar' });
  haptic();
  const result = await shareOrDownload(file, `Recordatorio: ${name}`);
  if (result === 'downloaded') toast('Abre el archivo descargado para añadirlo a tu calendario');
  else if (result === 'shared') toast('Elige Calendario para guardar el recordatorio');
});

// ---------- Navegación ----------

function render() {
  if (ui.view === 'today') renderToday();
  else if (ui.view === 'progress') renderProgress();
  else if (ui.view === 'history') renderHistory();
  else renderSettings();
  if (healthSheet.open) renderHealth();
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
  showEmoji(emojiInput, '⭐'); // el mismo que se guarda si lo dejas vacío
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
  return `En pausa ${from}, ${to}.`;
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
  toast(until ? `En pausa hasta el ${shortDate(until)}` : 'En pausa', { action: 'Deshacer', onAction: undoTo(snapshot) });
});

$('#resume-btn').addEventListener('click', () => {
  const habit = findHabit(ui.editingId);
  if (!habit) return;
  resumeHabit(habit);
  save();
  closeSheet();
  render();
  haptic();
  toast(`«${habit.name}» reanudado`);
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

// Marca el color elegido y tiñe el recuadro del emoji con él.
function setSheetColor(id) {
  ui.sheetColor = id;
  document.querySelectorAll('#color-row .color-swatch').forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.color === id));
  });
  $('#habit-emoji-field').style.setProperty('--c', colorHex(id));
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
  const custom = ui.sheetType === 'custom';
  $('#freq-block').hidden = quit;
  // El formulario libre usa el contador de siempre; los tipos, su deslizador (si se miden).
  $('#goal-block').hidden = quit || !custom;
  $('#measure-block').hidden = quit || custom || !typeOf(ui.sheetType).measures;
  $('#kind-hint').hidden = !quit;
  $('#kind-hint').textContent = 'Cada día sin recaer cuenta como hecho (y da XP). Si un día recaes, toca el hábito para apuntarlo.';
  nameInput.placeholder = quit ? 'Ej. Dejar de fumar' : 'Ej. Beber 2 litros de agua';
}

const measureRange = $('#measure-range');

// Botones para elegir cómo se mide (si el tipo tiene varias formas) y el deslizador con su valor.
function setSheetMeasure(habit, type) {
  const list = type.measures || [];
  const picker = $('#measure-type');
  picker.hidden = list.length < 2;
  picker.className = `segmented${list.length === 2 ? ' two' : ''}`;
  picker.innerHTML = list.map((m) => `<button type="button" role="radio" data-measure="${m.id}">${MEASURES[m.id].label}</button>`).join('');
  ui.sheetMeasure = null;
  if (!list.length) return;
  const own = habit && list.some((m) => m.id === habit.measure) ? habit.measure : null;
  selectMeasure(own || list[0].id, own ? habit.goal : null);
}

function selectMeasure(id, value = null) {
  const spec = measureSpec(typeOf(ui.sheetType), id);
  ui.sheetMeasure = id;
  document.querySelectorAll('#measure-type [data-measure]').forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.measure === id));
  });
  measureRange.min = spec.min;
  measureRange.max = Math.max(spec.max, value || 0);
  measureRange.step = spec.step;
  measureRange.value = value ?? spec.def;
  $('#measure-min').textContent = `${fmtAmount.format(spec.min)} ${spec.unit}`;
  $('#measure-max').textContent = `${fmtAmount.format(Number(measureRange.max))} ${spec.unit}`;
  syncMeasure();
}

function syncMeasure() {
  const type = typeOf(ui.sheetType);
  const spec = measureSpec(type, ui.sheetMeasure);
  const value = Number(measureRange.value);
  const text = `${fmtAmount.format(value)} ${spec.unit}`;
  $('#measure-value').textContent = text;
  measureRange.setAttribute('aria-valuetext', text);
  let hint = spec.mode === 'count'
    ? 'Cada toque suma 1 y, si mantienes pulsado, resta 1. Cuenta como hecho (y da XP) al llegar a la meta.'
    : type.hint || 'Un toque marca que lo has hecho. Si un día haces otra cantidad, mantén pulsado el hábito para apuntarla.';
  const habit = ui.editingId && findHabit(ui.editingId);
  if (habit && (habit.measure !== ui.sheetMeasure || habit.goal !== value)) {
    hint += spec.mode === 'target'
      ? ' Los días en los que marcaste la meta seguirán contando como cumplidos.'
      : ' Los días pasados se recalcularán con la nueva meta.';
  }
  $('#measure-hint').textContent = hint;
}

$('#measure-type').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-measure]');
  if (!btn || btn.dataset.measure === ui.sheetMeasure) return;
  const habit = ui.editingId && findHabit(ui.editingId);
  selectMeasure(btn.dataset.measure, habit && habit.measure === btn.dataset.measure ? habit.goal : null);
  haptic();
});
measureRange.addEventListener('input', syncMeasure);

// Al cambiar la meta de un hábito de tiempo, distancia…: los días marcados con un toque (justo la meta)
// siguen contando como cumplidos. Si cambia la forma de medir (minutos → pasos), todo se pasa en proporción.
function keepMetDays(habit, goal, measure) {
  if (habit.goal === goal && habit.measure === measure) return;
  const ratio = goal / habit.goal;
  Object.entries(habit.done).forEach(([day, v]) => {
    if (measure !== habit.measure) habit.done[day] = round2(v * ratio);
    else if (v === habit.goal) habit.done[day] = goal;
  });
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

// Tipos para elegir al crear un hábito, por grupos
$('#type-groups').innerHTML = TYPE_GROUPS.map(([group, label]) => `
  <p class="section-label">${label}</p>
  <div class="type-grid">${HABIT_TYPES.filter((t) => t.group === group).map(typeTile).join('')}</div>`).join('');

// Sin hábito ni tipo: se elige el tipo. Con tipo (o al editar): su edición, ya adaptada.
function openSheet(id = null, typeId = null) {
  const habit = id ? findHabit(id) : null;
  ui.editingId = habit ? habit.id : null;
  $('#sheet-title').textContent = habit ? 'Editar hábito' : 'Nuevo hábito';
  saveBtn.textContent = habit ? 'Guardar' : 'Añadir';
  if (habit || typeId) startEditor(habit, habit ? habit.type : typeId);
  else showTypePicker();
  document.documentElement.classList.add('locked');
  if (!sheet.open) sheet.showModal();
}

function showTypePicker() {
  ui.sheetStep = 'pick';
  $('#type-picker').hidden = false;
  $('#habit-editor').hidden = true;
  saveBtn.hidden = true;
  $('#type-picker').scrollTop = 0;
}

function startEditor(habit, typeId) {
  const type = typeOf(typeId);
  const custom = type.id === 'custom';
  ui.sheetStep = 'edit';
  ui.sheetType = type.id;
  $('#type-picker').hidden = true;
  $('#habit-editor').hidden = false;
  saveBtn.hidden = false;
  $('#change-type').hidden = Boolean(habit);

  nameInput.value = habit ? habit.name : type.name;
  ui.defaultEmoji = SUGGESTED_EMOJIS.find((e) => !state.habits.some((h) => h.emoji === e)) || '⭐';
  ui.emojiTouched = Boolean(habit) || !custom;
  emojiInput.value = habit ? habit.emoji : custom ? ui.defaultEmoji : type.emoji;
  $('#delete-block').hidden = !habit;
  if (habit) syncPauseBox(habit);
  // Empezar o dejar solo se elige en el formulario libre, y al crearlo.
  $('#kind-block').hidden = Boolean(habit) || !custom;
  setSheetKind(habit ? habit.kind : type.kind || 'build');
  setSheetGoal(habit && custom ? habit.goal : 1, habit && custom ? habit.unit : '');
  setSheetMeasure(habit, type);
  setSheetColor(habit ? habit.color : nextColor(state.habits));
  setSheetSchedule(habit ? habit.schedule : type.schedule || { type: 'daily' });
  $('#routine-block').hidden = !state.routines.length;
  const current = habit ? routineOf(habit.id) : null;
  $('#habit-routine').innerHTML = `<option value="">Ninguna</option>${state.routines.map((r) => (
    `<option value="${escapeHTML(r.id)}"${r === current ? ' selected' : ''}>${escapeHTML(r.name)}</option>`
  )).join('')}`;
  syncEmojiGrid();
  updateSaveButton();
  $('#habit-editor').scrollTop = 0;
}

$('#type-groups').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-type]');
  if (!btn) return;
  startEditor(null, btn.dataset.type);
  haptic();
});
$('#change-type').addEventListener('click', showTypePicker);

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

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name || ui.sheetStep !== 'edit') return;
  const emoji = lastGrapheme(emojiInput.value) || '⭐';

  const habit = ui.editingId && findHabit(ui.editingId);
  const type = typeOf(ui.sheetType);
  const kind = habit ? habit.kind : ui.sheetKind;
  const quit = kind === 'quit';
  // La meta: la del formulario libre (contador), la del deslizador del tipo, o 1 (sí/no y dejar algo).
  let measure = { goal: 1, unit: '', mode: 'count', measure: '' };
  if (!quit && type.id === 'custom') {
    const goal = clampGoal(goalInput.value);
    measure = { goal, unit: goal > 1 ? unitInput.value.trim().slice(0, 20) : '', mode: 'count', measure: '' };
  } else if (!quit && ui.sheetMeasure) {
    const spec = measureSpec(type, ui.sheetMeasure);
    measure = { goal: round2(measureRange.value), unit: spec.unit, mode: spec.mode, measure: spec.id };
  }
  if (habit && isTarget(habit) && measure.mode === 'target') keepMetDays(habit, measure.goal, measure.measure);
  const fields = {
    name,
    emoji,
    color: ui.sheetColor,
    type: type.id,
    // Cambiar la frecuencia o la meta recalcula todo (también los días pasados) con lo nuevo.
    schedule: quit ? { type: 'daily' } : sheetScheduleValue(),
    ...measure,
  };
  const saved = habit || newHabit({ ...fields, kind });
  if (habit) Object.assign(habit, fields);
  else state.habits.push(saved);
  if (state.routines.length) setHabitRoutine(saved.id, $('#habit-routine').value);
  save();
  closeSheet();
  render();
  if (!habit) toast(`«${name}» añadido`);
});

// Borrar es inmediato, pero se puede deshacer desde el aviso.
$('#delete-btn').addEventListener('click', () => {
  const habit = findHabit(ui.editingId);
  if (!habit) return;
  closeSheet();
  deleteHabit(habit);
});

// ---------- Reordenar arrastrando (modo edición) ----------

// La lista solo muestra los visibles: los archivados se quedan al final.
function reorderHabit(from, to) {
  const visible = visibleHabits();
  const [moved] = visible.splice(from, 1);
  visible.splice(to, 0, moved);
  state.habits = [...visible, ...state.habits.filter((h) => h.archived)];
  save();
}

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
      reorderHabit(from, to);
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
  $('#levelup-num').textContent = stats.level;
  $('#levelup-title').textContent = meta.title;
  $('#levelup-sub').textContent = `Has llegado al nivel ${stats.level}`;
  $('#levelup-achievements').innerHTML = achievements.map((a) => (
    `<li><span class="sum-icon">${ICONS[a.icon]}</span><span><b>Logro: ${a.name}</b>${a.desc}</span></li>`
  )).join('');
  levelupDialog.showModal();
  haptic();
}

$('#levelup-close').addEventListener('click', () => levelupDialog.close());
levelupDialog.addEventListener('click', (e) => {
  if (e.target === levelupDialog) levelupDialog.close();
});

// "+12 XP": un texto pequeño que sube un poco y se desvanece sobre el hábito tocado.
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

// Vibración suave al tocar, salvo que se haya quitado en Ajustes.
function haptic() {
  if (state.prefs.haptics) buzz();
}

// Una vibración corta (la usan los toques y el ritmo de la respiración de Zen, que tiene su propio ajuste).
// En iPhone (iOS 18+) se consigue pulsando un interruptor oculto.
function buzz() {
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

// Contenido del archivo. Sin Salud, la copia no lleva esa sección (y al importarla no se tocan
// los registros de Salud del dispositivo).
function backupPayload({ health = true } = {}) {
  const data = { ...state };
  if (!health) delete data.health;
  return { app: 'bonsai', version: 2, exportedAt: new Date().toISOString(), data };
}

// Lee y valida una copia sin tocar tus datos: { data, hasHealth, exportedAt, dropped } o { error }.
function readBackup(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { error: 'Ese archivo no se puede leer: no es una copia de Bonsái.' };
  }
  const isObject = (v) => Boolean(v) && typeof v === 'object';
  // Si la copia dice de qué app es, tiene que ser de Bonsái (o de cuando se llamaba Racha).
  if (isObject(parsed) && parsed.app && !BACKUP_APPS.includes(parsed.app)) return { error: 'Ese archivo es de otra app, no una copia de Bonsái.' };
  const raw = isObject(parsed) && isObject(parsed.data) ? parsed.data : parsed;
  const data = isObject(raw) ? normalize(raw) : null;
  if (!data) return { error: 'Ese archivo no tiene el formato de una copia de Bonsái.' };
  const hasHealth = isObject(raw.health);
  const count = (list) => (Array.isArray(list) ? list.length : 0);
  return {
    data,
    hasHealth,
    hasPrefs: isObject(raw.prefs),
    hasZen: isObject(raw.zen),
    exportedAt: typeof parsed.exportedAt === 'string' && !Number.isNaN(Date.parse(parsed.exportedAt)) ? parsed.exportedAt : null,
    // Lo que no era válido y se queda fuera, para avisar antes de importar.
    dropped: {
      habits: count(raw.habits) - data.habits.length,
      health: hasHealth ? count(raw.health.entries) - data.health.entries.length : 0,
    },
  };
}

function backupCounts(data) {
  return {
    habits: data.habits.length,
    marked: data.habits.reduce((n, h) => n + Object.keys(h.done).length, 0),
    diary: Object.keys(data.days).length,
    health: data.health.entries.length,
    routines: data.routines.length,
    zen: data.zen.sessions.length,
    gratitude: Object.keys(data.zen.gratitude).length,
    emotions: data.zen.emotions.length,
  };
}

// Qué lleva una copia, en frases cortas.
function backupItems(c, { health = true } = {}) {
  return [
    `${plural(c.habits, 'hábito', 'hábitos')}${c.marked ? ` y ${plural(c.marked, 'día marcado', 'días marcados')}` : ''}`,
    c.diary ? `Diario: ${plural(c.diary, 'día', 'días')} con ánimo o nota` : '',
    c.routines ? plural(c.routines, 'rutina', 'rutinas') : '',
    health && c.health ? `Salud: ${plural(c.health, 'registro', 'registros')}` : '',
    c.zen || c.gratitude || c.emotions ? `Zen: ${fmtList.format([
      c.zen ? plural(c.zen, 'sesión', 'sesiones') : '',
      c.gratitude ? `gratitud de ${plural(c.gratitude, 'día', 'días')}` : '',
      c.emotions ? plural(c.emotions, 'emoción', 'emociones') : '',
    ].filter(Boolean))}` : '',
    'Tu perfil y tu progreso',
  ].filter(Boolean);
}
const keepList = (items) => `<ul class="confirm-list">${items.map((item) => `<li class="keep">${ICONS.check}<span>${escapeHTML(item)}</span></li>`).join('')}</ul>`;

// Reemplaza tus datos por los de una copia. Antes guarda los actuales en este dispositivo, para poder volver.
function importBackup(data) {
  const previous = JSON.stringify(state);
  try {
    localStorage.setItem(PRE_IMPORT_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data: state }));
  } catch (err) {
    return { error: 'No hay espacio para guardar tus datos actuales antes de importar. Exporta una copia y vuelve a intentarlo.' };
  }
  if (replaceState(data)) return { ok: true };
  // No se pudo guardar la copia: todo vuelve a como estaba.
  try {
    localStorage.removeItem(PRE_IMPORT_KEY);
  } catch (err) {
    // no hay nada más que liberar
  }
  replaceState(normalize(JSON.parse(previous)));
  return { error: 'No se pudo guardar la copia importada; tus datos siguen como estaban.' };
}

function readPreImport() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRE_IMPORT_KEY));
    const data = saved && normalize(saved.data);
    return data ? { savedAt: saved.savedAt, data } : null;
  } catch (err) {
    return null;
  }
}

function restorePreImport() {
  const saved = readPreImport();
  if (!saved || !replaceState(saved.data)) return false;
  localStorage.removeItem(PRE_IMPORT_KEY);
  render(); // Ajustes deja de ofrecer volver a ellos
  return true;
}

const exportDialog = $('#export-dialog');
const exportHealth = $('#export-health');

function syncExportHint() {
  const withHealth = exportHealth.checked || $('#export-health-row').hidden;
  $('#export-hint').textContent = `${withHealth ? '' : 'Sin Salud: al importar esta copia se conservarán los registros de Salud que haya en ese dispositivo. '
  }Contiene tus datos personales: guárdala en un sitio privado, como Archivos, iCloud Drive o Google Drive.`;
}

function openExport() {
  const counts = backupCounts(state);
  $('#export-body').innerHTML = `<p>Se guarda un archivo con:</p>${keepList(backupItems(counts, { health: false }))}`;
  $('#export-health-row').hidden = !counts.health;
  $('#export-health-count').textContent = plural(counts.health, 'registro', 'registros');
  exportHealth.checked = true;
  syncExportHint();
  exportDialog.showModal();
}

exportHealth.addEventListener('change', syncExportHint);
$('#export-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const health = exportHealth.checked || $('#export-health-row').hidden;
  exportDialog.close();
  exportData({ health });
});
$('#export-cancel').addEventListener('click', () => exportDialog.close());
exportDialog.addEventListener('click', (e) => {
  if (e.target === exportDialog) exportDialog.close();
});

async function exportData({ health = true } = {}) {
  const payload = backupPayload({ health });
  const fileName = `bonsai-copia-${ui.today}${health ? '' : '-sin-salud'}.json`;
  const file = new File([JSON.stringify(payload, null, 2)], fileName, { type: 'application/json' });

  const markDone = () => {
    state.lastBackup = ui.today;
    save();
    render();
    toast('Copia guardada');
  };

  // En el móvil se abre el menú Compartir ("Guardar en Archivos", AirDrop…); si no, se descarga.
  const result = await shareOrDownload(file, 'Copia de Bonsái');
  if (result !== 'cancelled') markDone();
}

$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  // Todo se comprueba antes de tocar nada: si algo falla, tus datos siguen como estaban.
  if (file.size > BACKUP_MAX_BYTES) {
    toast('Ese archivo es demasiado grande para ser una copia de Bonsái');
    return;
  }
  let backup;
  try {
    backup = readBackup(await file.text());
  } catch (err) {
    backup = { error: 'No se pudo leer el archivo. Prueba a elegirlo otra vez.' };
  }
  if (backup.error) {
    toast(backup.error);
    return;
  }
  const { data } = backup;
  const counts = backupCounts(data);
  const local = backupCounts(state);
  const when = backup.exportedAt ? `Copia del ${fmtCaptionYear.format(new Date(backup.exportedAt)).replace(/\./g, '')}` : 'Copia sin fecha';
  const notes = [];
  const localHealth = local.health === 1 ? 'el registro de Salud de este dispositivo' : `los ${local.health} registros de Salud de este dispositivo`;
  if (!backup.hasHealth) {
    notes.push(local.health ? `La copia no incluye Salud: se ${local.health === 1 ? 'conserva' : 'conservan'} ${localHealth}.` : 'La copia no incluye Salud.');
  } else if (local.health) {
    notes.push(`${capitalize(localHealth)} se ${local.health === 1 ? 'sustituye' : 'sustituyen'} por lo que traiga la copia.`);
  }
  const dropped = [
    backup.dropped.habits > 0 ? plural(backup.dropped.habits, 'hábito', 'hábitos') : '',
    backup.dropped.health > 0 ? plural(backup.dropped.health, 'registro de Salud', 'registros de Salud') : '',
  ].filter(Boolean);
  if (dropped.length) notes.push(`Algunos datos no son válidos y no se importarán: ${dropped.join(' y ')}.`);
  const ok = await askConfirm({
    icon: 'download',
    title: '¿Importar esta copia?',
    body: `<p><b>${when}</b>${data.profile.name ? `, de ${escapeHTML(data.profile.name)}` : ''}. Contiene:</p>
      ${keepList(backupItems(counts, { health: backup.hasHealth }))}
      <p>Reemplaza lo que hay ahora en este dispositivo (${plural(local.habits, 'hábito', 'hábitos')}${
        local.diary ? `, diario de ${plural(local.diary, 'día', 'días')}` : ''}). Antes se guardan tus datos actuales, por si quieres volver a ellos.</p>
      ${notes.map((n) => `<p>${escapeHTML(n)}</p>`).join('')}`,
    confirmText: 'Importar',
  });
  if (!ok) return;
  if (!backup.hasHealth) data.health = state.health;
  // Las copias sin ajustes (las de antes de tenerlos) no cambian los de este dispositivo.
  if (!backup.hasPrefs) data.prefs = state.prefs;
  // Igual con Zen: las copias de antes de tenerlo no borran tus sesiones, tu gratitud ni tus emociones.
  if (!backup.hasZen) data.zen = state.zen;
  // La fecha de la última copia es de este móvil: nos quedamos con la más reciente.
  data.lastBackup = [data.lastBackup, state.lastBackup].filter(Boolean).sort().pop() || null;
  const result = importBackup(data);
  if (result.error) {
    toast(result.error);
    return;
  }
  toast('Copia restaurada', {
    action: 'Deshacer',
    onAction: () => toast(restorePreImport() ? 'Has vuelto a tus datos anteriores' : 'No se pudo deshacer la importación'),
  });
});

// Ajustes: volver a los datos de antes de la última importación, o sacar los datos que no se pudieron leer.
const fmtStamp = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function renderBackupNotes() {
  const pre = readPreImport();
  $('#pre-import').hidden = !pre;
  if (pre) {
    const at = Date.parse(pre.savedAt);
    $('#pre-import-text').textContent = `Antes de la última importación${Number.isNaN(at) ? '' : ` (${fmtStamp.format(at).replace(/\./g, '')})`
    } se guardaron tus datos anteriores en este dispositivo: ${plural(pre.data.habits.length, 'hábito', 'hábitos')}.`;
  }
  let rescued = null;
  try {
    rescued = localStorage.getItem(RESCUE_KEY);
  } catch (err) {
    rescued = null;
  }
  $('#rescue').hidden = rescued === null;
}

$('#pre-import-restore').addEventListener('click', async () => {
  const ok = await askConfirm({
    icon: 'rotate',
    title: '¿Volver a tus datos anteriores?',
    body: '<p>Se sustituyen tus datos actuales por los que tenías antes de la última importación.</p>',
    confirmText: 'Volver a ellos',
  });
  if (!ok) return;
  toast(restorePreImport() ? 'Has vuelto a tus datos anteriores' : 'No se pudieron recuperar');
});

$('#pre-import-discard').addEventListener('click', async () => {
  const ok = await askConfirm({
    icon: 'trash',
    title: '¿Descartar tus datos anteriores?',
    body: '<p>Se borra la copia guardada antes de la última importación. Tus datos actuales no cambian.</p>',
    confirmText: 'Descartar',
    danger: true,
  });
  if (!ok) return;
  localStorage.removeItem(PRE_IMPORT_KEY);
  renderSettings();
});

$('#rescue-download').addEventListener('click', () => {
  const raw = localStorage.getItem(RESCUE_KEY);
  if (raw !== null) downloadFile(new File([raw], `bonsai-datos-apartados-${ui.today}.json`, { type: 'application/json' }));
});

$('#rescue-discard').addEventListener('click', async () => {
  const ok = await askConfirm({
    icon: 'trash',
    title: '¿Borrar los datos apartados?',
    body: '<p>Son los datos que no se pudieron leer. Si no los has descargado, se perderán.</p>',
    confirmText: 'Borrar',
    danger: true,
  });
  if (!ok) return;
  localStorage.removeItem(RESCUE_KEY);
  renderSettings();
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
// Toda la lista de Hoy: los bloques de las rutinas y los hábitos sin rutina.
const habitArea = $('#habit-area');

habitArea.addEventListener('click', (e) => {
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
habitArea.addEventListener('pointerdown', (e) => {
  skipClick = false;
  const btn = e.target.closest('.habit');
  if (!btn || ui.editing) return;
  const habit = findHabit(btn.dataset.id);
  if (!habit || !hasAmount(habit)) return;
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

// Sin menú contextual al mantener pulsado (Android) y con teclado: "−" o Retroceso restan 1 (o abren el deslizador).
habitArea.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.habit.qty')) e.preventDefault();
});
// En modo edición, Alt + flecha arriba o abajo mueve el hábito: la alternativa a arrastrarlo.
habitArea.addEventListener('keydown', (e) => {
  const btn = e.target.closest('.habit');
  if (!btn || !ui.editing || !e.altKey || !['ArrowUp', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault();
  const visible = visibleHabits();
  const from = visible.findIndex((h) => h.id === btn.dataset.id);
  const to = from + (e.key === 'ArrowUp' ? -1 : 1);
  if (from < 0 || to < 0 || to >= visible.length) return;
  reorderHabit(from, to);
  renderToday();
  $(`.habit[data-id="${btn.dataset.id}"]`)?.focus();
  toast(`«${visible[from].name}» en el puesto ${to + 1} de ${visible.length}`);
});

habitArea.addEventListener('keydown', (e) => {
  const btn = e.target.closest('.habit');
  if (!btn || ui.editing || !['-', 'Backspace', 'Delete'].includes(e.key)) return;
  const habit = findHabit(btn.dataset.id);
  if (!habit || !hasAmount(habit)) return;
  e.preventDefault();
  stepDown(habit, btn);
});

$('#add-btn').addEventListener('click', () => openSheet());

// Botones repartidos por la app con data-*.
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-add], [data-export], [data-import], [data-goto-view], [data-summary], [data-review]');
  if (!target) return;
  if (target.hasAttribute('data-summary')) showSummary(shiftKey(weekStartOf(ui.today), -7));
  else if (target.hasAttribute('data-review')) openReview();
  else if (target.hasAttribute('data-add')) openSheet();
  else if (target.hasAttribute('data-export')) openExport();
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
  if (cell) selectHeatCell(cell);
});

// Elegir un día del mapa (tocándolo o con el teclado): su resumen debajo y el botón para ir a él.
function selectHeatCell(cell) {
  const map = cell.closest('.heatmap');
  const foot = map.nextElementSibling;
  const selected = map.querySelector('.sel');
  if (selected) selected.classList.remove('sel');
  cell.classList.add('sel');
  const caption = dayCaption(map.dataset.habit, cell.dataset.k);
  foot.querySelector('.hm-caption').textContent = caption;
  const noteEl = foot.nextElementSibling;
  const note = map.dataset.habit === 'all' ? (state.days[cell.dataset.k] || {}).note : '';
  if (noteEl && noteEl.classList.contains('hm-note')) {
    noteEl.hidden = !note;
    noteEl.textContent = note || '';
  }
  const gotoBtn = foot.querySelector('[data-goto]');
  gotoBtn.dataset.goto = cell.dataset.k;
  gotoBtn.hidden = false;
  // Solo la casilla elegida entra en el orden del tabulador, con su resumen como nombre.
  const previous = map.querySelector('.hm-grid [tabindex]');
  if (previous && previous !== cell) ['tabindex', 'role', 'aria-label'].forEach((a) => previous.removeAttribute(a));
  cell.tabIndex = 0;
  cell.setAttribute('role', 'button');
  cell.setAttribute('aria-label', note ? `${caption}. Nota: ${note}` : caption);
}

$('#history').addEventListener('focusin', (e) => {
  const cell = e.target.closest('.hm-grid i[data-k]');
  if (cell && !cell.classList.contains('sel')) selectHeatCell(cell);
});

// Flechas: arriba y abajo cambian de día; izquierda y derecha, de semana. Intro o espacio abren ese día en Hoy.
$('#history').addEventListener('keydown', (e) => {
  const cell = e.target.closest('.hm-grid i[data-k]');
  if (!cell) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    ui.day = cell.dataset.k;
    showView('today');
    return;
  }
  const step = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[e.key];
  if (!step) return;
  e.preventDefault();
  const next = cell.parentElement.querySelector(`[data-k="${shiftKey(cell.dataset.k, step)}"]`);
  if (!next) return;
  selectHeatCell(next);
  next.focus();
});

// Grupos de opciones (role="radio"): las flechas pasan a la opción de al lado y la eligen, como en los controles nativos.
document.addEventListener('keydown', (e) => {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  const radio = step && !e.altKey && e.target.closest('[role="radio"]');
  const group = radio && radio.closest('[role="radiogroup"]');
  if (!group) return;
  const radios = [...group.querySelectorAll('[role="radio"]')].filter((r) => !r.disabled && !r.hidden);
  const next = radios[(radios.indexOf(radio) + step + radios.length) % radios.length];
  e.preventDefault();
  next.click();
  // Algunos grupos se vuelven a pintar al elegir; entonces es su propio código el que pone el foco.
  if (next.isConnected) next.focus();
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
applyPrefs();
showView(state.prefs.startView);
maybeShowSummary();
if (loadProblem) toast('No se pudieron leer tus datos guardados. Se han apartado sin borrarlos: míralo en Ajustes');

// Pide al navegador que no borre nuestros datos si le falta espacio.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// Service worker: permite abrir la app sin conexión.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker no registrado', err));
}
