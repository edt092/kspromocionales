import { existsSync } from 'node:fs';
import path from 'node:path';

export const PLACEHOLDER_PRODUCT_IMAGE = '/images/products/_placeholder-ksp-co.jpg';

/**
 * Resuelve la imagen servible de un producto (T07, migración de imágenes).
 *
 * Acepta:
 *  - URLs https:// (o http://) del proveedor, mientras no exista un asset propio;
 *  - rutas locales absolutas bajo /images/ que EXISTAN en public/ (assets propios migrados).
 * Rechaza rutas relativas, `..`, esquemas como `data:`/`javascript:` y archivos inexistentes:
 * esos casos caen al placeholder. Antes solo se aceptaba `http`, de modo que cualquier imagen
 * migrada a /images/products/… habría terminado en el placeholder.
 *
 * Se ejecuta en build (sitio estático), por eso puede comprobar el disco. Se usa cwd (raíz del
 * proyecto al correr `astro build`) y no import.meta.url, que apunta al chunk empaquetado.
 */
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const existsCache = new Map<string, boolean>();

function isServableLocal(src: string): boolean {
  if (!src.startsWith('/images/') || src.includes('..') || src.includes('\\') || src.includes('\0')) return false;
  if (!existsCache.has(src)) {
    const full = path.resolve(PUBLIC_DIR, `.${decodeURIComponent(src)}`);
    existsCache.set(src, full.startsWith(path.resolve(PUBLIC_DIR)) && existsSync(full));
  }
  return existsCache.get(src)!;
}

/**
 * El proveedor redirige permanentemente (301/308) catalogospromocionales.com → cataprom.com
 * (verificado el 2026-10-09). Servir la URL final ahorra un salto de red por imagen sin tocar
 * los datos de origen. Reversible: basta con devolver la URL sin cambios.
 */
const SUPPLIER_REDIRECT = /^https?:\/\/(?:www\.)?catalogospromocionales\.com\/images\//i;
export function resolveSupplierImageUrl(src: string): string {
  return SUPPLIER_REDIRECT.test(src) ? src.replace(SUPPLIER_REDIRECT, 'https://cataprom.com/images/') : src;
}

export function isServableProductImage(src: unknown): src is string {
  if (typeof src !== 'string' || !src.trim()) return false;
  if (/^https?:\/\//i.test(src)) return true;
  return isServableLocal(src);
}

export function getValidProductImages(images?: string[]): string[] {
  return (images ?? []).filter(isServableProductImage).map(resolveSupplierImageUrl);
}

export function getProductImage(images?: string[]): string {
  return getValidProductImages(images)[0] ?? PLACEHOLDER_PRODUCT_IMAGE;
}
