import type { APIRoute } from 'astro';
import { allProducts, allCategories, primaryCategoryOf, productCategoryIds } from '@/lib/catalog';
import { getProductImage } from '@/lib/product-image';

/**
 * Índice ligero de búsqueda (auditoría UX/UI, UX-08). Se genera en build como
 * /buscar/indice.json y solo lo descarga la página /buscar/ al cargarse; no incluye historias
 * ni descripciones largas (≈2.100 productos en unas decenas de KB comprimidas).
 *
 * Formato compacto: p = [slug, nombre, índice de categoría primaria, referencia, imagen,
 * índices de categorías adicionales]. c = [id, slug, nombre] de cada categoría.
 */
export const GET: APIRoute = () => {
  const catIndex = new Map(allCategories.map((c, i) => [c.id, i]));
  const p = allProducts.map((prod) => {
    const primary = primaryCategoryOf(prod);
    const extra = productCategoryIds(prod)
      .slice(1)
      .map((id) => catIndex.get(id))
      .filter((i): i is number => i !== undefined);
    return [prod.slug, prod.name, primary ? catIndex.get(primary.id) ?? -1 : -1, prod.sourceProductId ?? '', getProductImage(prod.images), extra];
  });
  const c = allCategories.map((cat) => [cat.id, cat.slug, cat.name]);
  return new Response(JSON.stringify({ v: 1, c, p }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
