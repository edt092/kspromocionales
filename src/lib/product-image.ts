export const PLACEHOLDER_PRODUCT_IMAGE = '/images/products/_placeholder-ksp-co.jpg';

/**
 * Algunas fichas heredadas del catálogo original referencian rutas locales
 * que nunca se copiaron a public/images/products/. Solo las URLs absolutas
 * (hospedadas en el proveedor de imágenes) son válidas; el resto cae al placeholder.
 */
export function getProductImage(images?: string[]): string {
  const first = images?.[0];
  return first && first.startsWith('http') ? first : PLACEHOLDER_PRODUCT_IMAGE;
}

export function getValidProductImages(images?: string[]): string[] {
  return (images ?? []).filter((img) => img.startsWith('http'));
}
