/**
 * Política de indexabilidad de fichas de producto (T06). Fuente ÚNICA usada por:
 *  - la ficha (src/pages/productos/[slug].astro, vía product-indexability.ts),
 *  - el filtro del sitemap (astro.config.mjs),
 *  - el auditor de Node (scripts/seo-audit.mjs).
 * Es JS plano (con tipos JSDoc) para que Node la importe sin paso de compilación.
 *
 * Criterio: se mira SOLO lo que la ficha renderiza en el cuerpo — shortDescription, features,
 * useCases, story y facts verificados. `description` no se muestra en el cuerpo (solo como
 * fallback de meta), así que vacía o genérica no decide nada.
 *
 * Estados:
 *  - `indexable`: hay contenido visible propio.
 *  - `enriquecer`: indexable, pero con señales de relleno (story corta, features genéricas,
 *    frases plantilla). Es un informe para priorizar trabajo editorial, NUNCA un noindex.
 *  - `noindex_sin_contenido`: la ficha no muestra ningún contenido propio. Único caso que
 *    aplica `noindex, follow`.
 * No deciden por sí solos: is_ai_optimized, quality_score, longitud de description,
 * imagen placeholder ni número de palabras. Duplicados reales se resuelven con 301
 * (data/product-aliases.json), no con noindex.
 */

/** Frases de relleno que aparecen en cientos de fichas; solo se usan para el estado `enriquecer`. */
export const GENERIC_FEATURES = new Set([
  'Acabado profesional',
  'Materiales de calidad premium',
  'Diseño moderno y funcional',
  'Personalización con tu logo',
  'Múltiples opciones de personalización',
  'Uso prolongado y duradero',
  'Durabilidad garantizada',
  'Ideal para eventos corporativos',
]);
const GENERIC_SHORT = /^(Promociona tu marca con|Ofrezca un|Calidad premium y tecnología de punta)|Calidad premium y tecnología de punta\.?$|Cotiza ahora\.?$/i;

const textLen = (v) => (typeof v === 'string' ? v.trim().length : 0);
const nonEmptyList = (v) => Array.isArray(v) && v.some((x) => textLen(x) > 0);

/**
 * @param {{ shortDescription?: string, features?: string[], useCases?: string[], story?: string, facts?: Record<string,string>, images?: string[] }} p
 * @returns {{ indexable: boolean, status: 'indexable'|'enriquecer'|'noindex_sin_contenido', reasons: string[] }}
 */
export function evaluateProductIndexability(p) {
  const has = {
    shortDescription: textLen(p.shortDescription) >= 10,
    features: nonEmptyList(p.features),
    useCases: nonEmptyList(p.useCases),
    story: textLen(p.story) >= 50,
    facts: !!p.facts && Object.values(p.facts).some((v) => textLen(v) > 0),
  };

  if (!Object.values(has).some(Boolean)) {
    const reasons = Object.entries(has).filter(([, v]) => !v).map(([k]) => `sin_${k}`);
    if (!p.images || p.images.length === 0) reasons.push('sin_imagen');
    return { indexable: false, status: 'noindex_sin_contenido', reasons };
  }

  const reasons = [];
  if (!has.story) reasons.push('sin_story');
  else if (textLen(p.story) < 400) reasons.push('story_corta');
  const genericFeatures = (p.features ?? []).filter((f) => GENERIC_FEATURES.has(String(f).trim().replace(/\.$/, '')));
  if (genericFeatures.length >= 2) reasons.push('features_genericas');
  if (has.shortDescription && GENERIC_SHORT.test(p.shortDescription.trim())) reasons.push('shortDescription_plantilla');
  if (!has.features && !has.useCases) reasons.push('sin_features_ni_useCases');

  return { indexable: true, status: reasons.length ? 'enriquecer' : 'indexable', reasons };
}
