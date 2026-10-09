/**
 * Identidad de catálogo (T03). Funciones puras compartidas por el consolidador, el auditor
 * y el guard de importación.
 *
 * sourceProductId = identificador numérico del producto en el proveedor, tomado del nombre
 * del archivo de imagen del proveedor (https://catalogospromocionales.com/images/productos/<id>.jpg).
 * Es una identidad documentada de proveedor, no un SKU de fabricante verificado.
 */

export const SUPPLIER = 'catalogospromocionales';
export const PROMO_CATEGORIES = new Set(['precio-bomba', 'novedades']);
// Ecología como colección secundaria solo si el NOMBRE declara un material concreto.
// La pertenencia a la categoría o la palabra "eco" no prueban contenido reciclado.
export const ECO_MATERIAL_IN_NAME = /bamb[uú]|bamboo|corcho|yute|algod[oó]n|cotton|rpet|reciclad|madera|trigo|papel kraft|cart[oó]n/i;

const BADGES = [/\[más\]/gi, /\(?\s*prod(?:ucci[oó]n|\.)?\s*nal\.?\s*\)?/gi, /\(?producci[oó]n nacional\)?/gi, /\bprecio bomba\b/gi, /\bnuevo\b/gi, /\boferta\b/gi, /\(ver ref [^)]*\)/gi];
const BADGE_SLUG_TOKENS = /-(nuevomas|nuevo|precio-bomba|oferta|produccion-nacionalmas|mas)(?=-\d+$)|mas(?=-\d+$)/;

export function sourceProductIdOf(product) {
  const m = product.images?.[0]?.match(/catalogospromocionales\.com\/images\/productos\/(\d+)\.(?:jpe?g|png|webp)$/i);
  return m ? m[1] : null;
}

export function normalizeName(name = '') {
  let n = name.normalize('NFC');
  for (const re of BADGES) n = n.replace(re, ' ');
  return n.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Medidas/capacidades declaradas en el nombre: "500ml", "27\"", "120gr", "1l". */
export function measuresOf(name = '') {
  const out = [];
  for (const m of name.toLowerCase().matchAll(/(\d+(?:[.,]\d+)?)\s*(ml|gr|gm|gms|g|l|lt|oz|cm|"|'')(?![a-z])/g)) out.push(`${m[1].replace(',', '.')}${m[2].replace(/gms?|gr/, 'g').replace("''", '"')}`);
  return out.sort();
}

const isMarketingName = (name = '') => /[:¡!]/.test(name);
const hasBadgeSlug = (slug) => BADGE_SLUG_TOKENS.test(slug);

/**
 * Clasifica un grupo de registros con la misma sourceProductId.
 * @returns {{decision: 'mismo_producto'|'variante'|'insuficiente', tier?: 'A'|'B', reason: string}}
 */
export function classifyGroup(records) {
  if (records.length < 2) return { decision: 'insuficiente', reason: 'Un solo registro.' };
  const images = new Set(records.map((r) => r.images?.[0]));
  if (images.size !== 1 || !records[0].images?.[0]) return { decision: 'insuficiente', reason: 'Imágenes distintas o ausentes: requiere SKU.' };
  const names = new Set(records.map((r) => normalizeName(r.name)));
  if (names.size === 1) return { decision: 'mismo_producto', tier: 'A', reason: 'Misma imagen del proveedor y mismo nombre sin etiquetas comerciales.' };
  const measures = records.map((r) => measuresOf(r.name)).filter((m) => m.length);
  const distinctMeasures = new Set(measures.map((m) => m.join('|')));
  if (measures.length >= 2 && distinctMeasures.size > 1) {
    return { decision: 'variante', reason: `Medidas distintas en el nombre (${[...distinctMeasures].join(' vs ')}): no se fusiona sin SKU.` };
  }
  const hint = records.some((r) => isMarketingName(r.name))
    ? 'un registro tiene título comercial generado (con ":" o "¡")'
    : 'un nombre solo añade especificación (peso/medida) o referencia';
  return { decision: 'mismo_producto', tier: 'B', reason: `Misma imagen del proveedor; ${hint}.` };
}

/** Puntaje para elegir la URL primaria. Mayor es mejor. Documentado en MAPA_IDENTIDADES_Y_ALIASES. */
export function primaryScore(record, gsc) {
  let s = 0;
  if (gsc?.clicks > 0) s += 1000;
  if (!hasBadgeSlug(record.slug)) s += 100;
  if (!isMarketingName(record.name)) s += 50;
  s += measuresOf(record.name).length * 10;
  if (!PROMO_CATEGORIES.has(record.categoryId)) s += 5;
  if (gsc?.impressions) s += Math.min(gsc.impressions, 4);
  return s;
}

/** Categoría primaria: la base (no promocional) del registro primario o, si es promocional, de otro registro. */
export function choosePrimaryCategory(primary, records) {
  if (!PROMO_CATEGORIES.has(primary.categoryId) && primary.categoryId !== 'ecologia') return primary.categoryId;
  const base = records.find((r) => !PROMO_CATEGORIES.has(r.categoryId) && r.categoryId !== 'ecologia');
  return base ? base.categoryId : primary.categoryId;
}

export function chooseSecondaryCategories(primaryCategory, name, records) {
  const out = new Set();
  for (const r of records) {
    const c = r.categoryId;
    if (c === primaryCategory) continue;
    if (c === 'ecologia' && !ECO_MATERIAL_IN_NAME.test(name)) continue;
    out.add(c);
  }
  return [...out];
}
