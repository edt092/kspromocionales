/**
 * Regla de indexabilidad de fichas de producto (Fase 3, SEO_AUDIT_1.md).
 *
 * Criterio conservador y explícito, no un puntaje arbitrario: una ficha es candidata a
 * `noindex` únicamente cuando NO tiene contenido diferencial en NINGÚN campo visible —
 * descripción vacía o genérica (la plantilla auto-generada) Y, simultáneamente, ausencia de
 * shortDescription, features y useCases. Tener al menos uno de esos campos con contenido real
 * es suficiente para considerarla indexable: el objetivo es detectar páginas genuinamente vacías,
 * no penalizar variedad de redacción.
 *
 * El placeholder de imagen NO es una señal aquí — por sí solo no decide nada (regla explícita
 * del brief). La ausencia total de imagen sí se registra como motivo adicional, pero no es
 * suficiente por sí sola para marcar noindex.
 *
 * IMPORTANTE: esta misma regla está duplicada en scripts/seo-audit.mjs (JS plano, para poder
 * ejecutarse con `node` sin paso de compilación) y en astro.config.mjs (filtro del sitemap).
 * Si se cambia esta regla, hay que actualizar los tres lugares — están señalizados entre sí
 * con este mismo comentario para facilitar encontrarlos.
 */

export interface ProductIndexabilityInput {
  name: string;
  description?: string;
  shortDescription?: string;
  features?: string[];
  useCases?: string[];
  images?: string[];
}

export interface ProductIndexabilityResult {
  indexable: boolean;
  reasons: string[];
}

function genericDescription(name: string): string {
  return `${name} personalizado con logo. Producto promocional para empresas en Colombia.`;
}

export function evaluateProductIndexability(p: ProductIndexabilityInput): ProductIndexabilityResult {
  const isEmptyDescription = !p.description || !p.description.trim();
  const isGenericDescription = p.description === genericDescription(p.name);
  const noShortDescription = !p.shortDescription || p.shortDescription.trim().length < 10;
  const noFeatures = !p.features || p.features.length === 0;
  const noUseCases = !p.useCases || p.useCases.length === 0;
  const noImage = !p.images || p.images.length === 0;

  const reasons: string[] = [];
  if (isEmptyDescription) reasons.push('descripcion_vacia');
  if (isGenericDescription) reasons.push('descripcion_generica');
  if (noShortDescription) reasons.push('sin_shortDescription');
  if (noFeatures) reasons.push('sin_features');
  if (noUseCases) reasons.push('sin_useCases');
  if (noImage) reasons.push('sin_imagen');

  const isCandidate = (isEmptyDescription || isGenericDescription) && noShortDescription && noFeatures && noUseCases;

  return { indexable: !isCandidate, reasons: isCandidate ? reasons : [] };
}
