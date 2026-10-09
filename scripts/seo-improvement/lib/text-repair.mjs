/**
 * Reparación determinista de corrupción geográfica heredada en el catálogo.
 *
 * Origen documentado (docs/seo-improvement/RECONCILIACION_EVIDENCIA.md):
 * - El catálogo semilla viene de un sitio de Ecuador (scripts/seed-from-ecuador.mjs), que
 *   reemplazaba ciudades por substring sin límites de palabra. El repo fuente ya contenía
 *   "Cuencadad" (un "Cali"→"Cuenca" previo) que aquí se convirtió en "Medellíndad".
 * - Las stories/useCases de productos fueron reescritas después por un ETL externo
 *   (promo-content-pipeline) que dejó listas de ciudades sin su último elemento
 *   ("Bucaramanga, Bogotá, Bogotá o.") y preposiciones sin complemento ("coworking en.").
 *   El código de ese ETL no está en este repositorio.
 *
 * Reglas: nunca se inventa una ciudad. Las listas se deduplican y se cierran con las
 * ciudades que ya estaban; un destino vacío se sustituye por "cualquier ciudad del país"
 * (el negocio despacha a todo Colombia, ver src/lib/site.ts) o se elimina la preposición.
 * Palabras legítimas (Calidad, Calientito, manta, cuenca…) no coinciden con ningún patrón:
 * todas las reglas exigen límites de palabra Unicode y contexto explícito.
 */

export const CITIES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Cartagena', 'Cúcuta'];
const C = CITIES.join('|');
const L = String.raw`(?<!\p{L})`;
const R = String.raw`(?!\p{L})`;
const PUNCT = '[.,;:!?]';
const ANY_CITY = String.raw`(?:${C})`;
export const NATIONWIDE = 'cualquier ciudad del país';

// --- Patrones de detección (también los usa el auditor y el guard de importación) ---
export const DETECTORS = {
  uiLabelMas: /\[más\]/g,
  adjacentDuplicateCity: new RegExp(String.raw`${L}(?<c>${C})(?:, | o | y )\k<c>${R}`, 'gu'),
  brokenCityList: new RegExp(String.raw`${L}${ANY_CITY}(?:, ${ANY_CITY})+,? (?:o|y)(?=${PUNCT})`, 'gu'),
  orphanPreposition: new RegExp(String.raw`${L}(?:en|desde|hasta|entre)(?= ?${PUNCT}(?!\d))`, 'gu'),
  emptyDestination: new RegExp(String.raw`(?: y)? de ${ANY_CITY} a(?=${PUNCT})`, 'gu'),
  gluedCity: /(?:Bogotá|Medellín|Barranquilla|Bucaramanga|Cartagena|Cúcuta)\p{Ll}+/gu,
  ecuadorDemonym: /(?<!\p{L})(?:quiteñ|guayaquileñ|guayaquilen|cuencan)\p{L}*/gu,
  doubledConjunction: /(?<!\p{L})(y|o) \1(?!\p{L})/gu,
  doubleComma: /,,/g,
};

/** Cuenta coincidencias de cada detector en un texto. */
export function detect(text) {
  const out = {};
  if (typeof text !== 'string' || !text) return out;
  for (const [name, re] of Object.entries(DETECTORS)) {
    const n = [...text.matchAll(re)].length;
    if (n) out[name] = n;
  }
  return out;
}

function joinList(items, conj) {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} ${conj} ${items.at(-1)}`;
}

/** "Bucaramanga, Bogotá, Bogotá o." → "Bucaramanga o Bogotá." (sin inventar el elemento perdido) */
function repairBrokenLists(t) {
  const re = new RegExp(String.raw`${L}(${ANY_CITY}(?:, ${ANY_CITY})+),? (o|y)(?=${PUNCT})`, 'gu');
  // "como Bucaramanga, Bogotá, Bogotá y y la certeza" → "como Bucaramanga y Bogotá, y la certeza"
  const reConj = new RegExp(String.raw`${L}(${ANY_CITY}(?:, ${ANY_CITY})+),? (o|y)(?= (?:o|y) )`, 'gu');
  return t
    .replace(re, (_m, list, conj) => joinList([...new Set(list.split(', '))], conj))
    .replace(reConj, (_m, list, conj) => `${joinList([...new Set(list.split(', '))], conj)},`);
}

/** "empresas quiteñas y guayaquileñas" → "empresas colombianas"; "agencia quiteña" → "agencia colombiana". */
function repairEcuadorDemonyms(t) {
  const dem = String.raw`(?:quiteñ|guayaquileñ|guayaquilen|cuencan)(?<g>[oa])(?<n>s?)`;
  const re = new RegExp(String.raw`${L}${dem}(?: y \p{L}+)?${R}`, 'gu');
  return t.replace(re, (...args) => {
    const { g, n } = args.at(-1);
    return `colombian${g}${n}`;
  });
}

/** Deduplica segmentos de un campo de keywords separado por comas, conservando el orden. */
export function dedupeKeywordList(value) {
  if (typeof value !== 'string') return value;
  const seen = new Set();
  const kept = [];
  for (const seg of value.split(',').map((s) => s.trim()).filter(Boolean)) {
    const key = seg.toLocaleLowerCase('es');
    if (!seen.has(key)) {
      seen.add(key);
      kept.push(seg);
    }
  }
  return kept.join(', ');
}

/** Si una misma oración dice "desde … en Bogotá hasta … en Bogotá", la 2.ª ciudad pierde sentido. */
function repairSameCityRange(t) {
  const cityRe = new RegExp(String.raw`${L}${ANY_CITY}${R}`, 'gu');
  return t
    .split(/(?<=[.!?])(?=\s)/)
    .map((sentence) => {
      if (!/desde/i.test(sentence) || !/hasta/.test(sentence)) return sentence;
      const hastaAt = sentence.indexOf('hasta');
      const before = new Set([...sentence.slice(0, hastaAt).matchAll(cityRe)].map((m) => m[0]));
      let replaced = false;
      const tail = sentence.slice(hastaAt).replace(cityRe, (city) => {
        if (!replaced && before.has(city)) {
          replaced = true;
          return NATIONWIDE;
        }
        return city;
      });
      return sentence.slice(0, hastaAt) + tail;
    })
    .join('');
}

/** Aplica todas las reparaciones a un texto libre visible. Idempotente. */
export function repairText(input) {
  if (typeof input !== 'string' || !input) return input;
  let t = input;
  t = t.replace(/\s*\[más\]/g, '');
  t = repairEcuadorDemonyms(t);
  // "desde Bucaramanga hasta Bogotá y de Bogotá a." → se elimina el tramo sin destino
  t = t.replace(new RegExp(String.raw`,? (?:y|o) de ${ANY_CITY} a(?=${PUNCT})`, 'gu'), '');
  // "viajando de Bucaramanga a,," → "viajando desde Bucaramanga hasta cualquier ciudad del país,"
  t = t.replace(new RegExp(String.raw`${L}de (${ANY_CITY}) a(?=${PUNCT})`, 'gu'), `desde $1 hasta ${NATIONWIDE}`);
  t = t.replace(/,{2,}/g, ',');
  t = repairBrokenLists(t);
  t = t.replace(new RegExp(String.raw`${L}(?<c>${C})(?:, | o | y )\k<c>${R}`, 'gu'), '$<c>');
  // conjunción colgante tras una sola ciudad: "en Bogotá y, radica" → "en Bogotá, radica"
  t = t.replace(new RegExp(String.raw`${L}(${ANY_CITY}) (?:o|y)(?=${PUNCT}| (?:o|y) )`, 'gu'), '$1');
  // "en, Medellín y más allá" → "en Medellín y más allá"
  t = t.replace(new RegExp(String.raw`${L}(en|de|desde) ?, (?=${ANY_CITY}${R})`, 'gu'), '$1 ');
  // "desde Bucaramanga hasta." → "desde Bucaramanga hasta cualquier ciudad del país."
  t = t.replace(new RegExp(String.raw`(desde ${ANY_CITY}) hasta(?= ?${PUNCT})`, 'giu'), `$1 hasta ${NATIONWIDE}`);
  // preposición sin complemento antes de puntuación: "coworking en." → "coworking."
  t = t.replace(new RegExp(String.raw` (?:en|desde|hasta|entre)(?= ?${PUNCT}(?!\d))`, 'gu'), '');
  t = t.replace(/ +([,.;:!?])/g, '$1');
  t = repairSameCityRange(t);
  t = t.replace(/[ \t]{2,}/g, ' ');
  return t;
}

/** Corrige "Medellíndad" (= "Calidad" tras Cali→Cuenca→Medellín) solo como token completo. */
export function repairBlogSeedText(input) {
  return input.replace(/(?<!\p{L})Medellíndad(?!\p{L})/gu, 'Calidad').replace(/(?<!\p{L})medellíndad(?!\p{L})/gu, 'calidad');
}

export const TEXT_FIELDS = ['name', 'story', 'shortDescription', 'description', 'seoTitle', 'seoDescription', 'whatsappMessage', 'categoria'];
export const LIST_FIELDS = ['features', 'useCases'];
export const KEYWORD_FIELDS = ['keywords', 'seoKeywords'];

/** Repara un registro de producto. Devuelve { record, changes[] } sin mutar la entrada. */
export function repairProduct(product) {
  const record = { ...product };
  const changes = [];
  const set = (field, before, after) => {
    if (before !== after) changes.push({ field, before, after });
  };
  for (const f of TEXT_FIELDS) {
    if (typeof record[f] !== 'string') continue;
    const after = repairText(record[f]);
    set(f, record[f], after);
    record[f] = after;
  }
  for (const f of LIST_FIELDS) {
    if (!Array.isArray(record[f])) continue;
    const after = record[f].map((x) => (typeof x === 'string' ? repairText(x) : x));
    record[f].forEach((x, i) => set(`${f}[${i}]`, x, after[i]));
    record[f] = after;
  }
  for (const f of KEYWORD_FIELDS) {
    if (typeof record[f] !== 'string') continue;
    const after = dedupeKeywordList(repairText(record[f]));
    set(f, record[f], after);
    record[f] = after;
  }
  return { record, changes };
}
