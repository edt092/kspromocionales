#!/usr/bin/env node
/**
 * Auditoría SEO de solo lectura sobre los datos del catálogo. No modifica data/*.json.
 * Uso: `pnpm run seo:audit` (añade `--strict` para salir con código 1 si hay errores de datos).
 *
 * Genera un resumen en consola y, si `reports/` es escribible, un JSON detallado
 * (reports/seo-audit-<timestamp>.json, ignorado por Git) con:
 *  - `counts`: recuentos reales sobre TODO el catálogo;
 *  - `lists`: listas completas de afectados (no truncadas);
 *  - `examples`: hasta EXAMPLE_LIMIT ejemplos para lectura rápida.
 * Antes, algunos recuentos se calculaban con el tamaño del array de ejemplos (máx. 50).
 *
 * La política de indexabilidad es la MISMA que usan la ficha y el sitemap
 * (src/lib/product-indexability.mjs); aquí no se duplica.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { evaluateProductIndexability } from '../src/lib/product-indexability.mjs';
import { detect } from './seo-improvement/lib/text-repair.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE_LIMIT = 50;
const STRICT = process.argv.includes('--strict');

function readJson(relPath, { optional = false } = {}) {
  const full = path.join(ROOT, relPath);
  if (!existsSync(full)) {
    if (optional) return null;
    throw new Error(`Archivo requerido no encontrado: ${relPath}`);
  }
  try {
    return JSON.parse(readFileSync(full, 'utf8'));
  } catch (err) {
    throw new Error(`No se pudo parsear ${relPath}: ${err.message}`);
  }
}

// Residuo geográfico de Ecuador (catálogo semilla, scripts/seed-from-ecuador.mjs).
// En keywords se buscan ciudades; en texto libre solo gentilicios inequívocos, porque
// "manta" (cobija) y "cuenca" (hidrográfica) son sustantivos legítimos en fichas reales.
const ECUADOR_KEYWORDS = /\b(ecuador|quito|guayaquil|cuenca|ambato|manta|riobamba|machala|loja)\b|\.ec\b/i;
const TEXT_FIELDS = ['name', 'shortDescription', 'story', 'description', 'seoTitle', 'seoDescription', 'whatsappMessage'];
const LIST_FIELDS = ['features', 'useCases'];

const textsOf = (p) => [
  ...TEXT_FIELDS.map((f) => [f, p[f]]),
  ...LIST_FIELDS.flatMap((f) => (Array.isArray(p[f]) ? p[f].map((v, i) => [`${f}[${i}]`, v]) : [])),
  ...['keywords', 'seoKeywords'].map((f) => [f, p[f]]),
];

function main() {
  let products, categories, posts, aliases;
  try {
    products = readJson('data/products.json');
    categories = readJson('data/categories.json');
    posts = readJson('data/blog/posts.json');
    aliases = readJson('data/product-aliases.json', { optional: true }) ?? [];
  } catch (err) {
    console.error(`✗ Error estructural: ${err.message}`);
    process.exit(1);
  }
  if (!Array.isArray(products) || !Array.isArray(categories)) {
    console.error('✗ data/products.json y data/categories.json deben ser arrays.');
    process.exit(1);
  }

  const lists = {};
  const add = (key, value) => (lists[key] ??= []).push(value);
  const categoryKeys = new Set(categories.flatMap((c) => [c.id, c.slug]));

  // --- Identidad: slugs, sourceProductId, aliases ---
  const slugCount = new Map();
  const sidCount = new Map();
  for (const p of products) {
    if (!p.slug || !p.name) add('missingSlugOrName', { id: p.id, slug: p.slug, name: p.name });
    if (p.slug) slugCount.set(p.slug, (slugCount.get(p.slug) || 0) + 1);
    if (p.sourceProductId) sidCount.set(p.sourceProductId, [...(sidCount.get(p.sourceProductId) ?? []), p.slug]);
  }
  for (const [slug, n] of slugCount) if (n > 1) add('duplicateSlugs', { slug, count: n });
  for (const [sid, slugs] of sidCount) if (slugs.length > 1) add('sharedSourceProductId', { sourceProductId: sid, slugs });
  const productSlugs = new Set(products.map((p) => p.slug));
  for (const a of aliases) {
    const from = a.from.replace(/^\/productos\/|\/$/g, '');
    const to = a.to.replace(/^\/productos\/|\/$/g, '');
    if (productSlugs.has(from)) add('aliasStillAProduct', a.from);
    if (!productSlugs.has(to)) add('aliasTargetMissing', a);
    if (aliases.some((b) => b.from === a.to)) add('aliasChain', a);
  }

  // --- Categorías (primaria + secundarias) ---
  const perCategory = new Map();
  for (const p of products) {
    const cats = [p.categoryId, ...(p.secondaryCategoryIds ?? [])];
    for (const c of cats) {
      if (!categoryKeys.has(c)) add('orphanCategory', { slug: p.slug, categoryId: c });
      const id = categories.find((x) => x.id === c || x.slug === c)?.id ?? c;
      perCategory.set(id, (perCategory.get(id) || 0) + 1);
    }
  }
  for (const c of categories) {
    if (!(perCategory.get(c.id) > 0)) add('emptyCategories', c.slug);
    if (typeof c.productCount === 'number' && c.productCount !== (perCategory.get(c.id) || 0))
      add('staleProductCount', { slug: c.slug, declared: c.productCount, actual: perCategory.get(c.id) || 0 });
  }

  // --- Texto corrupto y residuo Ecuador ---
  for (const p of products) {
    for (const [field, value] of textsOf(p)) {
      if (typeof value !== 'string' || !value) continue;
      for (const [pattern, n] of Object.entries(detect(value))) add(`corrupt:${pattern}`, { slug: p.slug, field, n });
      if ((field === 'keywords' || field === 'seoKeywords') && ECUADOR_KEYWORDS.test(value)) add('ecuadorKeyword', { slug: p.slug, field });
    }
  }

  // --- Contenido / indexabilidad (política compartida) ---
  const statusCount = {};
  const reasonCount = {};
  for (const p of products) {
    const r = evaluateProductIndexability(p);
    statusCount[r.status] = (statusCount[r.status] || 0) + 1;
    for (const x of r.reasons) reasonCount[x] = (reasonCount[x] || 0) + 1;
    if (r.status !== 'indexable') add(`indexability:${r.status}`, { slug: p.slug, reasons: r.reasons });
    if (!p.description || !p.description.trim()) add('emptyDescriptionField', p.slug);
  }

  // --- Imágenes (primera imagen) ---
  for (const p of products) {
    const first = p.images?.[0];
    if (!first) add('imageMissing', p.slug);
    else if (/^https?:\/\//.test(first)) add('imageExternal', { slug: p.slug, host: new URL(first).host });
    else if (!existsSync(path.join(ROOT, 'public', first))) add('imageLocalMissing', { slug: p.slug, image: first });
    else add('imageLocalOk', p.slug);
  }

  // --- Metadatos ---
  const titleMap = new Map();
  const descMap = new Map();
  for (const p of products) {
    if (!p.seoTitle) add('emptySeoTitle', p.slug);
    if (!p.seoDescription) add('emptySeoDescription', p.slug);
    if (p.seoTitle?.length > 65) add('seoTitleOver65', p.slug);
    if (p.seoDescription?.length > 165) add('seoDescriptionOver165', p.slug);
    if (p.seoDescription && p.seoDescription.length < 70) add('seoDescriptionUnder70', p.slug);
    if (p.seoTitle) titleMap.set(p.seoTitle, [...(titleMap.get(p.seoTitle) ?? []), p.slug]);
    if (p.seoDescription) descMap.set(p.seoDescription, [...(descMap.get(p.seoDescription) ?? []), p.slug]);
  }
  for (const [title, slugs] of titleMap) if (slugs.length > 1) add('duplicateSeoTitle', { title, slugs });
  for (const [, slugs] of descMap) if (slugs.length > 1) add('duplicateSeoDescription', slugs);

  // --- Blog: metaTitle cortado a mitad de palabra (prefijo del título + " | ") ---
  for (const post of Array.isArray(posts) ? posts : []) {
    const meta = post.seo?.metaTitle ?? '';
    const head = meta.split(' | ')[0].trim();
    if (head && head !== post.title && post.title.startsWith(head) && /\p{L}$/u.test(head) && /^\p{L}/u.test(post.title.slice(head.length)))
      add('blogMetaTitleTruncated', { slug: post.slug, metaTitle: meta });
  }

  const counts = Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, v.length]));
  const report = {
    generatedAt: new Date().toISOString(),
    totals: { products: products.length, categories: categories.length, blogPosts: Array.isArray(posts) ? posts.length : 0, aliases: aliases.length },
    indexability: { statusCount, reasonCount },
    productsPerCategory: Object.fromEntries(perCategory),
    counts,
    examples: Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, v.slice(0, EXAMPLE_LIMIT)])),
    lists,
  };

  const c = (k) => counts[k] ?? 0;
  const corruptKeys = Object.keys(counts).filter((k) => k.startsWith('corrupt:'));
  const errors = [
    'duplicateSlugs', 'missingSlugOrName', 'orphanCategory', 'aliasStillAProduct', 'aliasTargetMissing', 'aliasChain', 'blogMetaTitleTruncated', ...corruptKeys,
  ].filter((k) => c(k) > 0);

  console.log(`\nSEO AUDIT — ${report.generatedAt}`);
  console.log('='.repeat(64));
  console.log(`Productos: ${products.length} | Categorías: ${categories.length} | Posts: ${report.totals.blogPosts} | Aliases 301: ${aliases.length}`);
  console.log('-'.repeat(64));
  console.log(`Slugs duplicados: ${c('duplicateSlugs')} | sin slug/nombre: ${c('missingSlugOrName')} | categoría huérfana: ${c('orphanCategory')}`);
  console.log(`sourceProductId compartido (variantes pendientes de SKU): ${c('sharedSourceProductId')}`);
  console.log(`Aliases: sigue existiendo ${c('aliasStillAProduct')} | destino inexistente ${c('aliasTargetMissing')} | cadenas ${c('aliasChain')}`);
  console.log(`Categorías vacías: ${c('emptyCategories')} | productCount desactualizado: ${c('staleProductCount')}`);
  console.log('-'.repeat(64));
  console.log(`Texto corrupto: ${corruptKeys.length ? corruptKeys.map((k) => `${k.slice(8)}=${c(k)}`).join(', ') : '0'}`);
  console.log(`Residuo Ecuador en keywords: ${c('ecuadorKeyword')} | metaTitle de blog cortado: ${c('blogMetaTitleTruncated')}`);
  console.log('-'.repeat(64));
  console.log(`Indexabilidad: ${JSON.stringify(statusCount)}`);
  console.log(`  Motivos: ${JSON.stringify(reasonCount)}`);
  console.log(`Campo description vacío (no se muestra en el cuerpo; no decide indexación): ${c('emptyDescriptionField')}`);
  console.log('-'.repeat(64));
  console.log(`Imágenes: externas ${c('imageExternal')} | locales OK ${c('imageLocalOk')} | locales inexistentes (placeholder) ${c('imageLocalMissing')} | sin imagen ${c('imageMissing')}`);
  console.log(`seoTitle vacío ${c('emptySeoTitle')} | >65 ${c('seoTitleOver65')} | duplicados ${c('duplicateSeoTitle')} grupos`);
  console.log(`seoDescription vacío ${c('emptySeoDescription')} | >165 ${c('seoDescriptionOver165')} | <70 ${c('seoDescriptionUnder70')} | duplicados ${c('duplicateSeoDescription')} grupos`);
  console.log('='.repeat(64));
  console.log(errors.length ? `✗ Errores de datos: ${errors.join(', ')}` : '✓ Sin errores de datos.');
  console.log('Este script no modifica archivos ni aplica noindex.\n');

  try {
    const reportsDir = path.join(ROOT, 'reports');
    if (!existsSync(reportsDir)) mkdirSync(reportsDir);
    const stamp = report.generatedAt.replace(/[:.]/g, '-');
    writeFileSync(path.join(reportsDir, `seo-audit-${stamp}.json`), JSON.stringify(report, null, 2), 'utf8');
    console.log(`Reporte detallado (listas completas): reports/seo-audit-${stamp}.json\n`);
  } catch (err) {
    console.warn(`(No se pudo escribir el reporte JSON: ${err.message})`);
  }

  process.exit(STRICT && errors.length ? 1 : 0);
}

main();
