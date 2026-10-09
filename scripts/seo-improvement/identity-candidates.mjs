#!/usr/bin/env node
/**
 * T03 — Manifiesto de candidatos de identidad duplicada (solo lectura sobre los datos).
 *
 * Agrupa productos por el sufijo numérico de catálogo del slug (= nombre de la imagen del
 * proveedor, p. ej. .../productos/10663.jpg) y clasifica cada grupo con reglas explícitas:
 *   - mismo_producto: misma imagen y mismo nombre una vez quitadas las etiquetas
 *     comerciales mutables (Nuevo, Oferta, Precio Bomba, [más], Producción Nacional).
 *   - variante_genuina: nombres normalizados distintos en capacidad/talla/modelo.
 *   - insuficiente: no hay evidencia suficiente para decidir; no se toca.
 * El sufijo numérico es un candidato de agrupación, no una orden de fusionar.
 *
 * Uso: node scripts/seo-improvement/identity-candidates.mjs [ruta duplicate-catalog-identities.csv] [ruta BASELINE_GSC.json]
 * Salida: docs/seo-improvement/manifiestos/T03-candidatos-identidad.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsvObjects } from './lib/csv.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_CSV =
  'C:/Users/Dagon/Desktop/MIS PROYECTOS PERSONALES/SITIOS_WEB/SEO-ANALISI-GENERAL/SEO-KSPROMOCIONALES.CO/ANALISI-09-10-2026/auditoria-seo-competitiva-codex/SEO-audit-evidence-package/duplicate-catalog-identities.csv';
const CSV = process.argv[2] || DEFAULT_CSV;
const GSC = process.argv[3] || path.join(ROOT, 'docs/seo-improvement/BASELINE_GSC.json');

const products = JSON.parse(readFileSync(path.join(ROOT, 'data/products.json'), 'utf8'));
const bySlug = new Map(products.map((p) => [p.slug, p]));

// Rendimiento GSC por path (agrupando hosts), para proteger URLs con señales.
const gscByPath = new Map();
if (existsSync(GSC)) {
  for (const row of JSON.parse(readFileSync(GSC, 'utf8')).performance.pages.normalizedByPath) gscByPath.set(row.path, row);
}

export const BADGE_TOKENS = [/\[más\]/gi, /\(?producci[oó]n nacional\)?/gi, /\bprecio bomba\b/gi, /\bnuevo\b/gi, /\boferta\b/gi, /\bprod\.? nal\b/gi];

export function normalizeName(name = '') {
  let n = name.normalize('NFC');
  for (const re of BADGE_TOKENS) n = n.replace(re, ' ');
  return n
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const catalogId = (slug) => slug.match(/-(\d+)(?:-\d+)?$/)?.[1] ?? null;
const imageId = (p) => p.images?.[0]?.match(/\/(\d+)\.(?:jpe?g|png|webp)$/i)?.[1] ?? null;
const textOf = (p) => [p.shortDescription, p.story, ...(p.features ?? [])].filter(Boolean).join(' ');

// Grupos del CSV (fuente de evidencia) + verificación independiente sobre los datos actuales.
const { records } = parseCsvObjects(readFileSync(CSV, 'utf8'));
const csvGroups = new Map();
for (const r of records) {
  const id = r['Shared numeric catalog ID'];
  const slug = new URL(r.URL).pathname.replace(/^\/productos\//, '').replace(/\/$/, '');
  (csvGroups.get(id) ?? csvGroups.set(id, []).get(id)).push(slug);
}
const dataGroups = new Map();
for (const p of products) {
  const id = catalogId(p.slug);
  if (id) (dataGroups.get(id) ?? dataGroups.set(id, []).get(id)).push(p.slug);
}
const dataDupIds = [...dataGroups].filter(([, s]) => s.length > 1).map(([id]) => id);

const MATERIAL_CLAIMS = /reciclad|biodegradable|ecol[oó]gic|eco-?amigable|sostenible|bamb[uú]|corcho|yute|rpet|metal s[oó]lido|acero inoxidable|aluminio/gi;

const groups = [...csvGroups].map(([id, slugs]) => {
  const items = slugs.map((slug) => {
    const p = bySlug.get(slug);
    const g = gscByPath.get(`/productos/${slug}/`);
    return p
      ? {
          slug,
          id: p.id,
          name: p.name,
          normalizedName: normalizeName(p.name),
          categoryId: p.categoryId,
          image: p.images?.[0] ?? null,
          imageId: imageId(p),
          contentChars: textOf(p).length,
          materialClaims: [...new Set((textOf(p).match(MATERIAL_CLAIMS) ?? []).map((s) => s.toLowerCase()))],
          gsc: g ? { clicks: g.clicks, impressions: g.impressions } : null,
        }
      : { slug, missingInData: true };
  });
  const present = items.filter((i) => !i.missingInData);
  const sameImage = present.length > 1 && present.every((i) => i.image && i.image === present[0].image);
  const sameName = present.length > 1 && present.every((i) => i.normalizedName === present[0].normalizedName);
  let decision = 'insuficiente';
  let reason = 'Faltan registros o la evidencia no permite decidir.';
  if (present.length === items.length && sameImage && sameName) {
    decision = 'mismo_producto';
    reason = 'Misma imagen del proveedor y mismo nombre tras quitar etiquetas comerciales (Nuevo/Oferta/Precio Bomba/[más]/Producción Nacional).';
  } else if (present.length === items.length && !sameName) {
    decision = 'variante_o_distinto';
    reason = 'Los nombres normalizados difieren: posible variante (capacidad/modelo) o producto distinto; no se fusiona sin SKU.';
  } else if (present.length === items.length && sameName && !sameImage) {
    decision = 'insuficiente';
    reason = 'Mismo nombre pero imagen distinta: requiere SKU del proveedor.';
  }
  const conflictingClaims =
    present.length > 1 && JSON.stringify(present[0].materialClaims) !== JSON.stringify(present[1].materialClaims);
  return { catalogId: id, decision, reason, conflictingMaterialClaims: conflictingClaims, hasGscSignal: present.some((i) => i.gsc), items };
});

const summary = groups.reduce((acc, g) => ((acc[g.decision] = (acc[g.decision] || 0) + 1), acc), {});
const out = {
  generatedAt: new Date().toISOString(),
  source: CSV,
  csvGroups: csvGroups.size,
  csvUrls: records.length,
  dataDuplicateSuffixGroups: dataDupIds.length,
  csvVsDataMismatch: {
    inDataNotCsv: dataDupIds.filter((id) => !csvGroups.has(id)),
    inCsvNotData: [...csvGroups.keys()].filter((id) => !dataDupIds.includes(id)),
  },
  summary,
  groupsWithGscSignal: groups.filter((g) => g.hasGscSignal).map((g) => g.catalogId),
  groups,
};
const dir = path.join(ROOT, 'docs/seo-improvement/manifiestos');
mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, 'T03-candidatos-identidad.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Grupos CSV: ${out.csvGroups} (${out.csvUrls} URLs) | grupos por sufijo en datos: ${out.dataDuplicateSuffixGroups}`);
console.log(`Discrepancias CSV/datos: ${JSON.stringify(out.csvVsDataMismatch)}`);
console.log(`Decisiones: ${JSON.stringify(summary)}`);
console.log(`Grupos con señal GSC: ${out.groupsWithGscSignal.join(', ')}`);
