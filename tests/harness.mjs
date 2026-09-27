// Carga assets/js/app.js en un contexto aislado de Node, con un DOM de mentira y una fecha fija,
// para probar la lógica real de la app sin navegador ni dependencias.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const APP = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
export const STORAGE_KEY = 'racha:v1';

// Un objeto que acepta cualquier cosa: propiedades, llamadas y asignaciones.
function makeAny() {
  const any = new Proxy(function () {}, {
    get(target, key) {
      if (key === Symbol.toPrimitive) return () => '';
      if (key === Symbol.iterator) return function* () {};
      if (key === 'then') return undefined;
      return any;
    },
    apply: () => any,
    construct: () => any,
    set: () => true,
    has: () => false,
    deleteProperty: () => true,
  });
  return any;
}

export function loadApp({ stored, now = '2026-09-27T10:00:00' } = {}) {
  const storage = new Map();
  if (stored !== undefined) storage.set(STORAGE_KEY, typeof stored === 'string' ? stored : JSON.stringify(stored));
  const fixed = new Date(now).getTime();
  class FakeDate extends Date {
    constructor(...args) {
      if (args.length) super(...args);
      else super(fixed);
    }
    static now() { return fixed; }
  }
  const any = makeAny();
  const toasts = [];
  const context = {
    console,
    Date: FakeDate,
    Intl,
    TextEncoder,
    URL,
    URLSearchParams,
    crypto: globalThis.crypto,
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => { storage.set(k, String(v)); },
      removeItem: (k) => { storage.delete(k); },
    },
    document: any,
    window: any,
    navigator: {},
    location: { protocol: 'file:' },
    matchMedia: () => ({ matches: false }),
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
  };
  vm.createContext(context);
  vm.runInContext(APP, context, { filename: 'app.js' });
  // Los avisos se apuntan para poder comprobarlos.
  vm.runInContext('toast = (m) => { __toasts.push(m); };', Object.assign(context, { __toasts: toasts }));
  const run = (code) => vm.runInContext(code, context);
  return { run, storage, toasts, context };
}

// Los objetos del contexto aislado tienen otros prototipos: los pasamos a objetos normales para comparar.
export const plain = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
