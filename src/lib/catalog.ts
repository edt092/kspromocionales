import products from '@data/products.json';
import categories from '@data/categories.json';
import { evaluateProductIndexability } from '@/lib/product-indexability';

/**
 * Acceso único al catálogo (T03/T10). Un producto tiene una categoría primaria (`categoryId`,
 * usada en breadcrumbs y canonical de navegación) y, opcionalmente, asociaciones secundarias
 * (`secondaryCategoryIds`) que provienen de la consolidación de registros duplicados
 * (docs/seo-improvement/MAPA_IDENTIDADES_Y_ALIASES.json). Todos los listados, conteos y
 * relacionados deben pasar por aquí para que una asociación nunca quede fuera de un consumidor.
 */

export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  secondaryCategoryIds?: string[];
  sourceProductId?: string;
  images?: string[];
  [key: string]: any;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  [key: string]: any;
}

export const allProducts = products as Product[];
export const allCategories = categories as Category[];

const categoryByKey = new Map<string, Category>();
for (const c of allCategories) {
  categoryByKey.set(c.id, c);
  categoryByKey.set(c.slug, c);
}

export function findCategory(idOrSlug: string | undefined): Category | undefined {
  return idOrSlug ? categoryByKey.get(idOrSlug) : undefined;
}

/** Ids de categoría (normalizados a `category.id`) a los que pertenece el producto: primaria primero. */
export function productCategoryIds(p: Product): string[] {
  const ids = [p.categoryId, ...(p.secondaryCategoryIds ?? [])]
    .map((key) => findCategory(key)?.id)
    .filter((id): id is string => Boolean(id));
  return [...new Set(ids)];
}

const productsByCategoryId = new Map<string, Product[]>();
for (const p of allProducts) {
  for (const id of productCategoryIds(p)) {
    if (!productsByCategoryId.has(id)) productsByCategoryId.set(id, []);
    productsByCategoryId.get(id)!.push(p);
  }
}

/** Productos de una categoría (primaria o secundaria), en el orden del catálogo. */
export function productsInCategory(category: Category | string): Product[] {
  const id = typeof category === 'string' ? findCategory(category)?.id : category.id;
  return (id && productsByCategoryId.get(id)) || [];
}

export function categoryProductCount(category: Category | string): number {
  return productsInCategory(category).length;
}

export function primaryCategoryOf(p: Product): Category | undefined {
  return findCategory(p.categoryId);
}

export function categoriesByIds(ids: readonly string[]): Category[] {
  return ids.map((id) => findCategory(id)).filter((c): c is Category => Boolean(c));
}

/**
 * Muestra determinista para hubs (T10): reparte en ronda entre las categorías indicadas y toma
 * solo fichas con contenido completo (estado `indexable`, no `enriquecer`), sin repetir identidad
 * de proveedor. No implica ventas ni popularidad.
 */
export function curatedProducts(categoryIds: readonly string[], count: number): Product[] {
  const queues = categoryIds.map((id) =>
    productsInCategory(id).filter((p) => evaluateProductIndexability(p as any).status === 'indexable')
  );
  const out: Product[] = [];
  const seen = new Set<string>();
  for (let round = 0; out.length < count && queues.some((q) => q.length > round); round++) {
    for (const q of queues) {
      const p = q[round];
      if (!p || out.length >= count) continue;
      const key = p.sourceProductId ?? p.slug;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

// --- Relacionados (T10) ---------------------------------------------------------------

const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'en', 'con', 'para', 'y', 'o', 'a', 'los', 'las', 'ml', 'oz', 'nuevo', 'oferta', 'precio', 'bomba', 'produccion', 'nacional', 'personalizado']);

function nameTokens(name: string): string[] {
  return name
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

/** Hash FNV-1a: orden estable entre builds pero distinto para cada ficha. */
function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const indexableCache = new Map<string, boolean>();
function isIndexable(p: Product): boolean {
  if (!indexableCache.has(p.slug)) indexableCache.set(p.slug, evaluateProductIndexability(p as any).indexable);
  return indexableCache.get(p.slug)!;
}

/**
 * Relacionados deterministas y útiles: comparten categoría y, preferentemente, tipo de
 * producto (primera palabra significativa del nombre, p. ej. "botilito", "mug", "boligrafo").
 * Excluye el propio producto, otras fichas con la misma identidad de proveedor y fichas noindex.
 * Reemplaza al antiguo `.filter(misma categoría).slice(0, 4)`, que mostraba siempre los mismos
 * cuatro productos en toda una categoría.
 */
export function relatedProducts(p: Product, limit = 4): Product[] {
  const ownCats = productCategoryIds(p);
  const ownTokens = new Set(nameTokens(p.name));
  const ownType = nameTokens(p.name)[0];
  const seen = new Set<string>([p.slug]);
  const scored: { product: Product; score: number; tie: number }[] = [];

  for (const catId of ownCats) {
    for (const c of productsByCategoryId.get(catId) ?? []) {
      if (seen.has(c.slug)) continue;
      seen.add(c.slug);
      if (p.sourceProductId && c.sourceProductId === p.sourceProductId) continue;
      if (!isIndexable(c)) continue;
      const cCats = productCategoryIds(c);
      const cTokens = nameTokens(c.name);
      let score = 0;
      if (cCats[0] === ownCats[0]) score += 3;
      score += cCats.filter((id) => ownCats.includes(id)).length;
      if (ownType && cTokens[0] === ownType) score += 4;
      score += cTokens.filter((t) => ownTokens.has(t)).length;
      scored.push({ product: c, score, tie: stableHash(`${p.slug}|${c.slug}`) });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .slice(0, limit)
    .map((s) => s.product);
}
