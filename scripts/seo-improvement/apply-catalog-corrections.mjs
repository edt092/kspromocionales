#!/usr/bin/env node
/**
 * T02 — Aplica data/catalog-corrections.json sobre data/products.json.
 *
 * Cada corrección declara motivo, fuente, fecha y estado de verificación. Los `facts`
 * se guardan en el producto con su procedencia (`factsSource`) y la ficha los muestra;
 * lo que sigue pendiente de confirmar por KS se lista en `pendingBusinessConfirmation` y
 * NO se muestra al cliente como hecho. Pensado para volver a ejecutarse después de una
 * reimportación del ETL: es idempotente y falla si un slug ya no existe.
 *
 * Uso: node scripts/seo-improvement/apply-catalog-corrections.mjs [--apply]
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APPLY = process.argv.includes('--apply');
const PRODUCTS = path.join(ROOT, 'data/products.json');
const raw = readFileSync(PRODUCTS, 'utf8');
const products = JSON.parse(raw);
const corrections = JSON.parse(readFileSync(path.join(ROOT, 'data/catalog-corrections.json'), 'utf8'));
const categories = new Set(JSON.parse(readFileSync(path.join(ROOT, 'data/categories.json'), 'utf8')).map((c) => c.id));

let changed = 0;
for (const c of corrections) {
  const p = products.find((x) => x.slug === c.slug);
  if (!p) throw new Error(`Corrección para slug inexistente: ${c.slug}`);
  const next = { ...c.set };
  if (c.facts) {
    next.facts = c.facts;
    next.factsSource = { source: c.source, verifiedAt: c.verifiedAt, status: c.status };
  }
  for (const cat of [next.categoryId, ...(next.secondaryCategoryIds ?? [])].filter(Boolean)) {
    if (!categories.has(cat)) throw new Error(`Categoría inexistente ${cat} en ${c.slug}`);
  }
  const diff = Object.entries(next).filter(([k, v]) => JSON.stringify(p[k]) !== JSON.stringify(v));
  if (!diff.length) continue;
  changed++;
  console.log(`[${c.slug}] ${diff.map(([k]) => k).join(', ')}`);
  for (const [k, v] of diff) p[k] = v;
}
console.log(`\n${APPLY ? 'Aplicado' : 'DRY-RUN'}: ${changed} producto(s) con cambios de ${corrections.length} correcciones.`);
if (APPLY && changed) {
  writeFileSync(`${PRODUCTS}.tmp`, JSON.stringify(products, null, 2) + (raw.endsWith('\n') ? '\n' : ''), 'utf8');
  renameSync(`${PRODUCTS}.tmp`, PRODUCTS);
}
