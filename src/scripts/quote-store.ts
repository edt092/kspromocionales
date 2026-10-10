/**
 * "Mi cotización" (auditoría UX/UI, UX-09): selección de referencias guardada en el navegador.
 *
 * Guarda SOLO datos no sensibles del catálogo (slug, nombre, referencia, imagen) y la cantidad
 * elegida. Nunca datos personales ni archivos. Versionada y con caducidad: si el formato cambia
 * o pasan 30 días sin uso, se descarta. Todo acceso a localStorage va en try/catch: en modo
 * privado o con almacenamiento bloqueado la lista funciona solo durante la página.
 */

export interface QuoteItem {
  slug: string;
  name: string;
  ref: string | null;
  image: string | null;
  qty: number | null;
}

export interface QuoteState {
  version: 1;
  updatedAt: number;
  items: QuoteItem[];
  city: string;
  date: string;
}

const KEY = 'ks-cotizacion';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_ITEMS = 25;
export const MAX_QTY = 1_000_000;

const empty = (): QuoteState => ({ version: 1, updatedAt: Date.now(), items: [], city: '', date: '' });
let memory: QuoteState | null = null;

function isValid(s: any): s is QuoteState {
  return s && s.version === 1 && Array.isArray(s.items) && typeof s.updatedAt === 'number';
}

export function readQuote(): QuoteState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValid(parsed) && Date.now() - parsed.updatedAt < MAX_AGE_MS) return { ...empty(), ...parsed };
      localStorage.removeItem(KEY);
    }
  } catch {
    /* almacenamiento no disponible: se usa la copia en memoria */
  }
  return memory ?? empty();
}

function save(state: QuoteState): void {
  state.updatedAt = Date.now();
  memory = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sin persistencia */
  }
  window.dispatchEvent(new CustomEvent('ks:quote-change', { detail: state }));
}

export function sanitizeQty(value: unknown): number | null {
  const n = Math.floor(Number(String(value ?? '').replace(/[^\d]/g, '')));
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_QTY) : null;
}

/** @returns 'added' | 'exists' | 'full' */
export function addItem(item: QuoteItem): 'added' | 'exists' | 'full' {
  const state = readQuote();
  if (state.items.some((i) => i.slug === item.slug)) return 'exists';
  if (state.items.length >= MAX_ITEMS) return 'full';
  state.items.push({ ...item, qty: sanitizeQty(item.qty) });
  save(state);
  return 'added';
}

export function updateItem(slug: string, patch: Partial<Pick<QuoteItem, 'qty'>>): void {
  const state = readQuote();
  const item = state.items.find((i) => i.slug === slug);
  if (!item) return;
  if ('qty' in patch) item.qty = sanitizeQty(patch.qty);
  save(state);
}

export function removeItem(slug: string): QuoteItem | undefined {
  const state = readQuote();
  const idx = state.items.findIndex((i) => i.slug === slug);
  if (idx < 0) return undefined;
  const [removed] = state.items.splice(idx, 1);
  save(state);
  return removed;
}

/** Deshacer: vuelve a insertar en la posición original. */
export function restoreItem(item: QuoteItem, index: number): void {
  const state = readQuote();
  if (state.items.some((i) => i.slug === item.slug)) return;
  state.items.splice(Math.min(index, state.items.length), 0, item);
  save(state);
}

export function setContext(patch: Partial<Pick<QuoteState, 'city' | 'date'>>): void {
  const state = readQuote();
  if (typeof patch.city === 'string') state.city = patch.city.slice(0, 80);
  if (typeof patch.date === 'string') state.date = patch.date.slice(0, 10);
  save(state);
}

export function clearQuote(): void {
  memory = empty();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada que borrar */
  }
  window.dispatchEvent(new CustomEvent('ks:quote-change', { detail: memory }));
}

/** Contador del header (enlace "Mi cotización"). */
export function renderHeaderCount(): void {
  const n = readQuote().items.length;
  document.querySelectorAll<HTMLElement>('[data-quote-count]').forEach((el) => {
    el.textContent = String(n);
    el.classList.toggle('hidden', n === 0);
  });
  document.querySelectorAll<HTMLElement>('[data-quote-link]').forEach((el) => {
    el.setAttribute('aria-label', n ? `Mi cotización (${n} ${n === 1 ? 'referencia' : 'referencias'})` : 'Mi cotización');
  });
}
