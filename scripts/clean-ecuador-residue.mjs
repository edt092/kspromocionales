#!/usr/bin/env node
/**
 * Elimina residuos geográficos de Ecuador (Quito, Guayaquil, Cuenca, Ambato, Manta, ...)
 * heredados de scripts/seed-from-ecuador.mjs, únicamente en data/products.json.
 *
 * Alcance deliberadamente acotado a `seoKeywords` y `keywords`: son los únicos campos
 * donde el residuo aparece de forma real (verificado con un análisis previo). En `story`,
 * `description` y `shortDescription` la palabra "manta" aparece como el sustantivo español
 * (cobija) en productos reales — no se toca ningún campo de texto libre para evitar
 * falsos positivos y no alterar contenido legítimo.
 *
 * Modo por defecto: DRY RUN (no escribe nada). Pasa --apply para escribir el archivo.
 *
 * Uso:
 *   node scripts/clean-ecuador-residue.mjs            # dry-run, solo reporte
 *   node scripts/clean-ecuador-residue.mjs --apply     # aplica los cambios
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(ROOT, 'data', 'products.json');
const TARGET_FIELDS = ['seoKeywords', 'keywords'];
const ECUADOR_TERMS = ['ecuador', 'quito', 'guayaquil', 'cuenca', 'ambato', 'manta', 'riobamba', 'machala', 'loja'];
const TERM_PATTERN = new RegExp(`\\b(${ECUADOR_TERMS.join('|')})\\b`, 'i');

const APPLY = process.argv.includes('--apply');
const EXAMPLE_LIMIT = 20;

function cleanKeywordField(value) {
  const segments = value.split(',').map((s) => s.trim()).filter(Boolean);
  const kept = segments.filter((s) => !TERM_PATTERN.test(s));
  const removed = segments.filter((s) => TERM_PATTERN.test(s));
  return { kept, removed };
}

function main() {
  const raw = readFileSync(DATA_PATH, 'utf8');
  const products = JSON.parse(raw);

  let affectedRecords = 0;
  const affectedFieldCounts = Object.fromEntries(TARGET_FIELDS.map((f) => [f, 0]));
  const removedSegmentCounts = Object.fromEntries(TARGET_FIELDS.map((f) => [f, 0]));
  const skippedWouldBeEmpty = [];
  const examples = [];

  for (const p of products) {
    let recordAffected = false;

    for (const field of TARGET_FIELDS) {
      const original = p[field];
      if (typeof original !== 'string' || !original.trim()) continue;
      if (!TERM_PATTERN.test(original)) continue;

      const { kept, removed } = cleanKeywordField(original);
      if (removed.length === 0) continue;

      if (kept.length === 0) {
        // Nunca dejar el campo vacío: se marca para revisión manual y no se toca.
        skippedWouldBeEmpty.push({ slug: p.slug, field, original });
        continue;
      }

      const updated = kept.join(', ');
      affectedFieldCounts[field]++;
      removedSegmentCounts[field] += removed.length;
      recordAffected = true;

      if (examples.length < EXAMPLE_LIMIT) {
        examples.push({ slug: p.slug, field, before: original, after: updated, removedSegments: removed });
      }

      if (APPLY) {
        p[field] = updated;
      }
    }

    if (recordAffected) affectedRecords++;
  }

  console.log('\nLIMPIEZA DE RESIDUO ECUADOR — data/products.json');
  console.log('='.repeat(60));
  console.log(`Modo: ${APPLY ? 'APLICAR (se escribirá el archivo)' : 'DRY RUN (no se modifica nada)'}`);
  console.log(`Registros afectados: ${affectedRecords} / ${products.length}`);
  console.log(`Campos afectados: ${JSON.stringify(affectedFieldCounts)}`);
  console.log(`Segmentos de keyword eliminados: ${JSON.stringify(removedSegmentCounts)}`);
  console.log(`Casos omitidos (el campo quedaría vacío, requieren revisión manual): ${skippedWouldBeEmpty.length}`);
  if (skippedWouldBeEmpty.length) {
    console.log(JSON.stringify(skippedWouldBeEmpty, null, 2));
  }
  console.log('-'.repeat(60));
  console.log(`Ejemplos antes/después (máx. ${EXAMPLE_LIMIT}):`);
  for (const ex of examples) {
    console.log(`\n[${ex.slug}] ${ex.field}`);
    console.log(`  ANTES:  ${ex.before}`);
    console.log(`  DESPUÉS: ${ex.after}`);
    console.log(`  ELIMINADO: ${ex.removedSegments.join(' | ')}`);
  }
  console.log('\n' + '='.repeat(60));

  if (!APPLY) {
    console.log('Dry-run completo. Ningún archivo fue modificado.');
    console.log('Ejecuta con --apply solo después de revisar este reporte.\n');
    return;
  }

  writeFileSync(DATA_PATH, JSON.stringify(products, null, 2), 'utf8');
  console.log('data/products.json actualizado.\n');
}

main();
