/**
 * Núcleo de búsqueda del catálogo (auditoría UX/UI, UX-08). JS puro con tipos JSDoc: lo usan
 * la página /buscar/ (cliente) y los tests de Node (scripts/seo-improvement/tests/).
 *
 * - Ignora mayúsculas y tildes; reduce plurales simples (mugs → mug, termos → termo).
 * - Sinónimos locales revisados (lapicero/esfero/bolígrafo, mug/taza/pocillo, …): amplían una
 *   palabra a su grupo, nunca mezclan categorías por coincidencias arbitrarias.
 * - Todas las palabras de la consulta deben coincidir (AND) con el inicio de alguna palabra del
 *   nombre, de la categoría o con la referencia numérica.
 */

export const SYNONYM_GROUPS = [
  ['boligrafo', 'lapicero', 'esfero', 'pluma', 'lapiz'],
  ['mug', 'taza', 'pocillo'],
  ['termo', 'termico'],
  ['botilito', 'tomatodo', 'botella', 'cilindro'],
  ['maletin', 'morral', 'mochila', 'bolso', 'backpack'],
  ['gorra', 'cachucha'],
  ['usb', 'memoria'],
  ['libreta', 'agenda', 'cuaderno'],
  ['paraguas', 'sombrilla'],
  ['camiseta', 'camisa', 'polo'],
  ['audifono', 'auricular'],
  ['cargador', 'powerbank', 'bateria'],
  ['antiestres', 'antiestress'],
];

/** "Bolígrafos" → "boligrafo". */
export function normalizeWord(word) {
  let w = String(word)
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
  if (w.length > 4 && w.endsWith('es') && !/[aeiou]es$/.test(w.slice(-3)) ) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s')) w = w.slice(0, -1);
  return w;
}

export function tokenize(text) {
  return String(text ?? '')
    .split(/[\s\-_/,.;:()"'+]+/)
    .map(normalizeWord)
    .filter(Boolean);
}

const SYNONYMS = new Map();
for (const group of SYNONYM_GROUPS) {
  const norm = group.map(normalizeWord);
  for (const w of norm) SYNONYMS.set(w, norm);
}

/** @param {{ c: [string,string,string][], p: [string,string,number,string,string,number[]][] }} data */
export function buildIndex(data) {
  const categories = data.c.map(([id, slug, name]) => ({ id, slug, name, tokens: tokenize(name) }));
  const products = data.p.map(([slug, name, cat, ref, image, extra]) => ({
    slug,
    name,
    ref,
    image,
    category: categories[cat] ?? null,
    categoryIds: [categories[cat]?.id, ...(extra ?? []).map((i) => categories[i]?.id)].filter(Boolean),
    nameTokens: tokenize(name),
  }));
  return { categories, products };
}

const variantsOf = (token) => SYNONYMS.get(token) ?? [token];
const prefixIn = (tokens, t) => tokens.some((w) => w.startsWith(t));

/**
 * @param {{ categories: any[], products: any[] }} index
 * @param {string} query
 * @param {{ categoryId?: string }} [opts]
 */
export function search(index, query, opts = {}) {
  const terms = tokenize(query);
  const inCategory = (p) => !opts.categoryId || p.categoryIds.includes(opts.categoryId);
  if (!terms.length) return opts.categoryId ? index.products.filter(inCategory) : [];

  const results = [];
  for (const p of index.products) {
    if (!inCategory(p)) continue;
    let score = 0;
    let ok = true;
    for (const t of terms) {
      if (/^\d+$/.test(t) && p.ref === t) {
        score += 100;
        continue;
      }
      const variants = variantsOf(t);
      if (variants.some((v) => p.nameTokens[0]?.startsWith(v))) score += 12;
      else if (variants.some((v) => prefixIn(p.nameTokens, v))) score += 8;
      else if (p.category && variants.some((v) => prefixIn(p.category.tokens, v))) score += 3;
      else {
        ok = false;
        break;
      }
      if (variants[0] !== t && prefixIn(p.nameTokens, t)) score += 1; // coincidencia literal sobre sinónimo
    }
    if (ok) results.push({ p, score });
  }
  return results.sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name, 'es')).map((r) => r.p);
}
