#!/usr/bin/env node
/**
 * T01 — Reparación editorial de corrupción heredada (ver lib/text-repair.mjs).
 *
 * DRY-RUN por defecto: no escribe nada, solo informa. Con --apply escribe de forma atómica
 * (archivo temporal + rename) y deja un manifiesto de cambios por registro/campo en
 * docs/seo-improvement/manifiestos/. Idempotente: una segunda ejecución no produce cambios.
 * Nunca modifica id, slug, categoryId, images ni URLs.
 *
 * Uso:
 *   node scripts/seo-improvement/repair-catalog-text.mjs           # dry-run
 *   node scripts/seo-improvement/repair-catalog-text.mjs --apply   # aplica
 */
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repairProduct, repairBlogSeedText, detect } from './lib/text-repair.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APPLY = process.argv.includes('--apply');
const PRODUCTS = path.join(ROOT, 'data/products.json');
const POSTS = path.join(ROOT, 'data/blog/posts.json');
const SEED = path.join(ROOT, 'data/blog/content/seed.js');
const MANIFEST_DIR = path.join(ROOT, 'docs/seo-improvement/manifiestos');
const TODAY = '2026-10-09';

// Meta titles que el origen cortó a 50 caracteres a mitad de palabra. Se reemplazan por
// títulos completos redactados a mano a partir del título editorial visible del post.
const BLOG_META_TITLE_FIXES = {
  'enamora-a-tus-clientes-regalos-corporativos-unicos-para-amor-y-amistad':
    'Regalos Corporativos para Amor y Amistad | KS Promocionales',
  'listos-para-carnaval-2026-impulsa-tu-marca-con-productos-promocionales':
    'Carnaval 2026: Promocionales para tu Marca | KS Promocionales',
  'boligrafos-personalizados-la-mejor-inversion-publicitaria-en-colombia':
    'Bolígrafos Personalizados: Inversión Publicitaria | KS Promocionales',
};

function writeAtomic(file, content) {
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, file);
}

function sumDetections(products) {
  const total = {};
  for (const p of products)
    for (const v of Object.values(p)) {
      const texts = Array.isArray(v) ? v : [v];
      for (const t of texts) for (const [k, n] of Object.entries(detect(t))) total[k] = (total[k] || 0) + n;
    }
  return total;
}

// ---------------------------------------------------------------- productos
const productsRaw = readFileSync(PRODUCTS, 'utf8');
const products = JSON.parse(productsRaw);
const before = sumDetections(products);
const productChanges = [];
const repaired = products.map((p) => {
  const { record, changes } = repairProduct(p);
  if (changes.length) productChanges.push({ id: p.id, slug: p.slug, changes });
  return record;
});
const after = sumDetections(repaired);
for (let i = 0; i < products.length; i++) {
  for (const key of ['id', 'slug', 'categoryId']) {
    if (products[i][key] !== repaired[i][key]) throw new Error(`Cambio no permitido en ${key}: ${products[i].slug}`);
  }
}

// ---------------------------------------------------------------- blog
const seedRaw = readFileSync(SEED, 'utf8');
const seedFixed = repairBlogSeedText(seedRaw);
const seedModule = await import(`data:text/javascript;base64,${Buffer.from(seedRaw).toString('base64')}`);
const postsWithFix = Object.entries(seedModule.blogContentSeed)
  .filter(([, html]) => repairBlogSeedText(html) !== html)
  .map(([slug, html]) => ({ slug, occurrences: [...html.matchAll(/Medellíndad/g)].length }));

const posts = JSON.parse(readFileSync(POSTS, 'utf8'));
const postChanges = [];
for (const post of posts) {
  const changes = [];
  const newMeta = BLOG_META_TITLE_FIXES[post.slug];
  if (newMeta && post.seo?.metaTitle !== newMeta) {
    changes.push({ field: 'seo.metaTitle', before: post.seo.metaTitle, after: newMeta });
    post.seo.metaTitle = newMeta;
  }
  // El cuerpo visible cambia (H3 corregidos): dateModified refleja esa edición real.
  if (postsWithFix.some((x) => x.slug === post.slug) && post.dateModified !== TODAY) {
    changes.push({ field: 'dateModified', before: post.dateModified, after: TODAY });
    post.dateModified = TODAY;
  }
  if (changes.length) postChanges.push({ slug: post.slug, changes });
}

// ---------------------------------------------------------------- informe
const fieldTotals = {};
for (const pc of productChanges) for (const c of pc.changes) {
  const f = c.field.replace(/\[\d+\]$/, '');
  fieldTotals[f] = (fieldTotals[f] || 0) + 1;
}
console.log(`\nREPARACIÓN DE TEXTO — modo ${APPLY ? 'APLICAR' : 'DRY-RUN (no escribe)'}`);
console.log('='.repeat(64));
console.log(`Productos modificados: ${productChanges.length} / ${products.length}`);
console.log(`Campos modificados: ${JSON.stringify(fieldTotals)}`);
console.log(`Detecciones antes:   ${JSON.stringify(before)}`);
console.log(`Detecciones después: ${JSON.stringify(after)}`);
console.log(`Blog seed: ${postsWithFix.map((x) => `${x.slug} (${x.occurrences})`).join(', ') || 'sin cambios'}`);
console.log(`Posts (metadatos): ${postChanges.map((x) => `${x.slug}: ${x.changes.map((c) => c.field).join('+')}`).join(' | ') || 'sin cambios'}`);

if (!APPLY) {
  for (const pc of productChanges.slice(0, 6))
    for (const c of pc.changes.slice(0, 2)) console.log(`\n[${pc.slug}] ${c.field}\n  - ${String(c.before).slice(0, 220)}\n  + ${String(c.after).slice(0, 220)}`);
  console.log('\nDry-run: ningún archivo modificado. Usa --apply para escribir.\n');
  process.exit(0);
}

mkdirSync(MANIFEST_DIR, { recursive: true });
writeAtomic(
  path.join(MANIFEST_DIR, 'T01-reparacion-texto.json'),
  JSON.stringify({ appliedAt: new Date().toISOString(), detectionsBefore: before, detectionsAfter: after, fieldTotals, blogSeed: postsWithFix, posts: postChanges, products: productChanges }, null, 1) + '\n'
);
if (productChanges.length) writeAtomic(PRODUCTS, JSON.stringify(repaired, null, 2) + (productsRaw.endsWith('\n') ? '\n' : ''));
if (seedFixed !== seedRaw) writeAtomic(SEED, seedFixed);
if (postChanges.length) writeAtomic(POSTS, JSON.stringify(posts, null, 2) + '\n');
console.log('\nAplicado. Manifiesto: docs/seo-improvement/manifiestos/T01-reparacion-texto.json\n');
