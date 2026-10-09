/**
 * Fachada tipada de la política de indexabilidad (T06). La implementación vive en
 * product-indexability.mjs para que el auditor de Node (scripts/seo-audit.mjs) y el filtro
 * del sitemap (astro.config.mjs) usen exactamente el mismo código que la ficha.
 */
import { evaluateProductIndexability as evaluate } from './product-indexability.mjs';

export interface ProductIndexabilityInput {
  name?: string;
  shortDescription?: string;
  features?: string[];
  useCases?: string[];
  story?: string;
  facts?: Record<string, string>;
  images?: string[];
}

export type ProductIndexStatus = 'indexable' | 'enriquecer' | 'noindex_sin_contenido';

export interface ProductIndexabilityResult {
  indexable: boolean;
  status: ProductIndexStatus;
  reasons: string[];
}

export function evaluateProductIndexability(p: ProductIndexabilityInput): ProductIndexabilityResult {
  return evaluate(p) as ProductIndexabilityResult;
}
