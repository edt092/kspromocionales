#!/usr/bin/env node
/**
 * T03 — Consolidación de identidades de catálogo confirmadas.
 *
 * DRY-RUN por defecto. Con --apply:
 *  - añade `supplier` y `sourceProductId` a todos los productos con imagen del proveedor;
 *  - para cada grupo clasificado como `mismo_producto` (lib/identity.mjs#classifyGroup) conserva
 *    un único registro primario, con categoría base + `secondaryCategoryIds`, y elimina los demás;
 *  - registra cada alias eliminado en data/product-aliases.json (fuente de los 301);
 *  - escribe docs/seo-improvement/MAPA_IDENTIDADES_Y_ALIASES.json con decisión y evidencia.
 * Idempotente: los alias ya registrados no se vuelven a procesar.
 */
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SUPPLIER,
  sourceProductIdOf,
  classifyGroup,
  primaryScore,
  choosePrimaryCategory,
  chooseSecondaryCategories,
} from './lib/identity.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APPLY = process.argv.includes('--apply');
const PRODUCTS = path.join(ROOT, 'data/products.json');
const ALIASES = path.join(ROOT, 'data/product-aliases.json');
const MAP = path.join(ROOT, 'docs/seo-improvement/MAPA_IDENTIDADES_Y_ALIASES.json');
const GSC = path.join(ROOT, 'docs/seo-improvement/BASELINE_GSC.json');
const DECIDED_AT = '2026-10-09';

const writeAtomic = (file, content) => {
  writeFileSync(`${file}.tmp`, content, 'utf8');
  renameSync(`${file}.tmp`, file);
};

const raw = readFileSync(PRODUCTS, 'utf8');
const products = JSON.parse(raw);
const existingAliases = existsSync(ALIASES) ? JSON.parse(readFileSync(ALIASES, 'utf8')) : [];
const gscByPath = new Map(
  existsSync(GSC) ? JSON.parse(readFileSync(GSC, 'utf8')).performance.pages.normalizedByPath.map((r) => [r.path, r]) : []
);
const gscOf = (slug) => gscByPath.get(`/productos/${slug}/`) ?? null;

// 1) identidad de proveedor para todo el catálogo
let withSourceId = 0;
for (const p of products) {
  const sid = sourceProductIdOf(p);
  if (sid) {
    p.supplier = SUPPLIER;
    p.sourceProductId = sid;
    withSourceId++;
  }
}

// 2) agrupar por sourceProductId
const groups = new Map();
for (const p of products) if (p.sourceProductId) (groups.get(p.sourceProductId) ?? groups.set(p.sourceProductId, []).get(p.sourceProductId)).push(p);

const decisions = [];
const removeSlugs = new Set();
const newAliases = [];
for (const [sid, records] of groups) {
  if (records.length < 2) continue;
  const cls = classifyGroup(records);
  const entry = {
    sourceProductId: sid,
    decision: cls.decision,
    tier: cls.tier ?? null,
    reason: cls.reason,
    records: records.map((r) => ({ slug: r.slug, id: r.id, name: r.name, categoryId: r.categoryId, gsc: gscOf(r.slug) && { clicks: gscOf(r.slug).clicks, impressions: gscOf(r.slug).impressions } })),
  };
  if (cls.decision === 'mismo_producto') {
    const ranked = [...records].sort((a, b) => primaryScore(b, gscOf(b.slug)) - primaryScore(a, gscOf(a.slug)) || a.slug.length - b.slug.length);
    const primary = ranked[0];
    const primaryCategory = choosePrimaryCategory(primary, records);
    const secondary = chooseSecondaryCategories(primaryCategory, primary.name, records);
    const droppedCategories = [...new Set(records.map((r) => r.categoryId))].filter((c) => c !== primaryCategory && !secondary.includes(c));
    entry.primary = primary.slug;
    entry.primaryCategory = primaryCategory;
    entry.secondaryCategoryIds = secondary;
    entry.droppedCategories = droppedCategories;
    entry.aliases = ranked.slice(1).map((r) => r.slug);
    primary.categoryId = primaryCategory;
    if (secondary.length) primary.secondaryCategoryIds = secondary;
    for (const alias of ranked.slice(1)) {
      removeSlugs.add(alias.slug);
      newAliases.push({
        from: `/productos/${alias.slug}/`,
        to: `/productos/${primary.slug}/`,
        sourceProductId: sid,
        reason: `${cls.tier === 'A' ? 'Nivel A' : 'Nivel B'}: ${cls.reason}`,
        aliasName: alias.name,
        aliasCategoryId: alias.categoryId,
        gsc: entry.records.find((r) => r.slug === alias.slug).gsc,
        decidedAt: DECIDED_AT,
      });
    }
  }
  decisions.push(entry);
}

const kept = products.filter((p) => !removeSlugs.has(p.slug));
const aliasesOut = [...existingAliases, ...newAliases.filter((a) => !existingAliases.some((e) => e.from === a.from))];

// Validaciones duras antes de escribir
const keptSlugs = new Set(kept.map((p) => p.slug));
for (const a of aliasesOut) {
  const target = a.to.replace(/^\/productos\/|\/$/g, '');
  if (!keptSlugs.has(target)) throw new Error(`Destino inexistente para ${a.from} → ${a.to}`);
  if (keptSlugs.has(a.from.replace(/^\/productos\/|\/$/g, ''))) throw new Error(`Alias sigue existiendo como producto: ${a.from}`);
  if (aliasesOut.some((b) => b.from === a.to)) throw new Error(`Cadena de redirects: ${a.from} → ${a.to}`);
}
const sidCount = new Map();
for (const p of kept) if (p.sourceProductId) sidCount.set(p.sourceProductId, (sidCount.get(p.sourceProductId) || 0) + 1);
const remainingDupes = [...sidCount].filter(([, n]) => n > 1).map(([sid]) => sid);

const summary = decisions.reduce((acc, d) => ((acc[`${d.decision}${d.tier ? '_' + d.tier : ''}`] = (acc[`${d.decision}${d.tier ? '_' + d.tier : ''}`] || 0) + 1), acc), {});
console.log(`\nCONSOLIDACIÓN DE IDENTIDADES — ${APPLY ? 'APLICAR' : 'DRY-RUN'}`);
console.log('='.repeat(64));
console.log(`Productos con sourceProductId: ${withSourceId} / ${products.length}`);
console.log(`Grupos con >1 registro: ${decisions.length} → ${JSON.stringify(summary)}`);
console.log(`Registros eliminados (alias 301): ${removeSlugs.size} | productos resultantes: ${kept.length}`);
console.log(`sourceProductId aún repetidos (variantes/insuficientes, se conservan): ${remainingDupes.length} → ${remainingDupes.join(', ')}`);
for (const d of decisions.filter((x) => x.decision !== 'mismo_producto')) console.log(`  · ${d.sourceProductId} ${d.decision}: ${d.records.map((r) => r.name).join(' | ')}`);

if (!APPLY) {
  for (const d of decisions.filter((x) => x.decision === 'mismo_producto').slice(0, 8))
    console.log(`  ${d.sourceProductId} [${d.tier}] ${d.aliases.join(', ')} → ${d.primary} (cat ${d.primaryCategory}${d.secondaryCategoryIds.length ? ' + ' + d.secondaryCategoryIds.join(',') : ''}${d.droppedCategories.length ? '; se retira de ' + d.droppedCategories.join(',') : ''})`);
  console.log('\nDry-run: nada escrito.\n');
  process.exit(0);
}

writeAtomic(PRODUCTS, JSON.stringify(kept, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
writeAtomic(ALIASES, JSON.stringify(aliasesOut, null, 2) + '\n');
writeAtomic(
  MAP,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      rules: {
        identity: 'sourceProductId = id numérico del archivo de imagen del proveedor (catalogospromocionales.com/images/productos/<id>.jpg).',
        tierA: 'Misma imagen y mismo nombre tras quitar etiquetas comerciales mutables.',
        tierB: 'Misma imagen; los nombres difieren solo por título comercial generado o por especificación añadida. Si ambos nombres declaran medidas distintas → variante, no se fusiona.',
        primary: 'Mayor puntaje: clics GSC > slug sin etiqueta comercial > nombre descriptivo > medidas en el nombre > categoría no promocional > impresiones.',
        categories: 'Primaria = categoría base (no precio-bomba/novedades/ecologia si hay alternativa). Secundarias = resto; ecologia solo si el nombre declara material.',
      },
      summary,
      removedRecords: removeSlugs.size,
      productsBefore: products.length,
      productsAfter: kept.length,
      remainingDuplicateSourceIds: remainingDupes,
      decisions,
    },
    null,
    1
  ) + '\n'
);
console.log('\nAplicado: data/products.json, data/product-aliases.json, docs/seo-improvement/MAPA_IDENTIDADES_Y_ALIASES.json\n');
