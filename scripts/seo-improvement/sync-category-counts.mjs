#!/usr/bin/env node
/**
 * Recalcula `productCount` de data/categories.json desde data/products.json, contando
 * categoría primaria y asociaciones secundarias (igual que src/lib/catalog.ts). Evita que
 * quede un conteo manual obsoleto tras consolidar identidades. Idempotente.
 * Uso: node scripts/seo-improvement/sync-category-counts.mjs [--apply]
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CATS = path.join(ROOT, 'data/categories.json');
const raw = readFileSync(CATS, 'utf8');
const categories = JSON.parse(raw);
const products = JSON.parse(readFileSync(path.join(ROOT, 'data/products.json'), 'utf8'));

const idOf = (key) => categories.find((c) => c.id === key || c.slug === key)?.id;
const counts = new Map();
for (const p of products) {
  for (const id of new Set([p.categoryId, ...(p.secondaryCategoryIds ?? [])].map(idOf).filter(Boolean))) {
    counts.set(id, (counts.get(id) || 0) + 1);
  }
}
const changes = categories
  .filter((c) => c.productCount !== (counts.get(c.id) || 0))
  .map((c) => ({ slug: c.slug, before: c.productCount, after: counts.get(c.id) || 0 }));
for (const c of categories) c.productCount = counts.get(c.id) || 0;
console.log(changes.length ? changes.map((c) => `${c.slug}: ${c.before} → ${c.after}`).join('\n') : 'Sin cambios.');
if (process.argv.includes('--apply') && changes.length) {
  writeFileSync(`${CATS}.tmp`, JSON.stringify(categories, null, 2) + (raw.endsWith('\n') ? '\n' : ''), 'utf8');
  renameSync(`${CATS}.tmp`, CATS);
  console.log('data/categories.json actualizado.');
}
