#!/usr/bin/env node
/**
 * T12 — Manifiesto de migración de imágenes (SOLO LECTURA, no descarga nada).
 *
 * La descarga y republicación de imágenes del proveedor está bloqueada hasta contar con la
 * autorización documentada que exige IMAGE_MIGRATION_STRATEGY.md (pendiente N10). Este script
 * deja listo el inventario por lotes para ejecutarla después:
 *   - imagen principal por producto (separada de relacionados/categorías),
 *   - URL original, URL servida hoy (host final del proveedor) y ruta local destino,
 *   - productos que hoy caen en placeholder (rutas locales inexistentes).
 * Cuando exista la autorización: descargar por lotes, convertir a WebP/AVIF sin ampliar,
 * escribir en public/images/products/ y sustituir `images[0]` por la ruta local. El helper
 * src/lib/product-image.ts ya acepta rutas locales que existan en public/.
 *
 * Uso: node scripts/seo-improvement/image-migration-manifest.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const products = JSON.parse(readFileSync(path.join(ROOT, 'data/products.json'), 'utf8'));
const categories = JSON.parse(readFileSync(path.join(ROOT, 'data/categories.json'), 'utf8'));
const SUPPLIER = /^https?:\/\/(?:www\.)?catalogospromocionales\.com\/images\//i;
const served = (u) => (SUPPLIER.test(u) ? u.replace(SUPPLIER, 'https://cataprom.com/images/') : u);
const BATCH = 100;

const items = products.map((p) => {
  const first = p.images?.[0] ?? null;
  const external = !!first && /^https?:\/\//.test(first);
  const localOk = !!first && !external && existsSync(path.join(ROOT, 'public', first));
  return {
    slug: p.slug,
    sourceProductId: p.sourceProductId ?? null,
    original: first,
    servedToday: external ? served(first) : localOk ? first : '/images/products/_placeholder-ksp-co.jpg',
    target: `/images/products/${p.slug}.webp`,
    state: external ? 'externa-pendiente-autorizacion' : localOk ? 'local' : 'placeholder-falta-imagen',
  };
});
const batches = [];
const pending = items.filter((i) => i.state === 'externa-pendiente-autorizacion');
for (let i = 0; i < pending.length; i += BATCH) batches.push(pending.slice(i, i + BATCH).map((x) => x.slug));

const summary = items.reduce((a, i) => ((a[i.state] = (a[i.state] || 0) + 1), a), {});
const out = {
  generatedAt: new Date().toISOString(),
  blockedBy: 'Autorización de reutilización de imágenes del proveedor (PENDIENTES_NEGOCIO_Y_GSC.md, N10)',
  summary,
  categoryImages: categories.map((c) => ({ slug: c.slug, original: c.image ?? null, servedToday: c.image ? served(c.image) : null })),
  batches,
  items,
};
const dir = path.join(ROOT, 'docs/seo-improvement/manifiestos');
mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, 'T12-imagenes.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Imágenes principales: ${JSON.stringify(summary)} | lotes de ${BATCH}: ${batches.length}`);
