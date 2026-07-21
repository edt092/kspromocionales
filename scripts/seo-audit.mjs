#!/usr/bin/env node
/**
 * Auditoría SEO de solo lectura. No modifica data/products.json, data/categories.json
 * ni ningún otro archivo. Uso: `npm run seo:audit`.
 *
 * Genera un resumen en consola y, si `reports/` es escribible, un JSON detallado
 * (reports/seo-audit-<timestamp>.json, ignorado por Git) con hasta 50 ejemplos
 * por hallazgo para revisión manual.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE_LIMIT = 50;

function readJson(relPath) {
  const full = path.join(ROOT, relPath);
  if (!existsSync(full)) {
    throw new Error(`Archivo requerido no encontrado: ${relPath}`);
  }
  try {
    return JSON.parse(readFileSync(full, 'utf8'));
  } catch (err) {
    throw new Error(`No se pudo parsear ${relPath}: ${err.message}`);
  }
}

function pushExample(list, value) {
  if (list.length < EXAMPLE_LIMIT) list.push(value);
}

// Términos y dominios asociados al catálogo original de Ecuador (scripts/seed-from-ecuador.mjs).
// Se marcan como residuo geográfico incorrecto para un sitio que solo opera en Colombia.
const ECUADOR_PATTERN = /\b(ecuador|quito|guayaquil|cuenca|ambato|manta|riobamba|machala|loja)\b|\.ec\b/i;
const GENERIC_DESCRIPTION = (name) =>
  `${name} personalizado con logo. Producto promocional para empresas en Colombia.`;

function main() {
  const errors = [];
  let products, categories, posts;

  try {
    products = readJson('data/products.json');
    categories = readJson('data/categories.json');
    posts = readJson('data/blog/posts.json');
  } catch (err) {
    console.error(`✗ Error estructural: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(products)) errors.push('data/products.json no es un array.');
  if (!Array.isArray(categories)) errors.push('data/categories.json no es un array.');
  if (errors.length) {
    console.error('✗ Errores estructurales:\n' + errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }

  const categoryIds = new Set(categories.map((c) => c.id));
  const categoryBySlug = new Set(categories.map((c) => c.slug));

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      products: products.length,
      categories: categories.length,
      blogPosts: Array.isArray(posts) ? posts.length : 0,
    },
    findings: {},
  };

  // --- Slugs duplicados / inválidos ---
  const slugCounts = new Map();
  const missingSlugOrName = [];
  for (const p of products) {
    if (!p.slug || !p.name) pushExample(missingSlugOrName, { id: p.id, slug: p.slug, name: p.name });
    if (p.slug) slugCounts.set(p.slug, (slugCounts.get(p.slug) || 0) + 1);
  }
  const duplicateSlugs = [...slugCounts.entries()].filter(([, count]) => count > 1);

  // --- Categorías inexistentes / vacías ---
  const productsPerCategory = new Map();
  const orphanCategoryProducts = [];
  for (const p of products) {
    const valid = categoryIds.has(p.categoryId) || categoryBySlug.has(p.categoryId);
    if (!valid) pushExample(orphanCategoryProducts, { slug: p.slug, categoryId: p.categoryId });
    productsPerCategory.set(p.categoryId, (productsPerCategory.get(p.categoryId) || 0) + 1);
  }
  const emptyCategories = categories
    .filter((c) => !(productsPerCategory.get(c.id) > 0))
    .map((c) => ({ id: c.id, slug: c.slug, name: c.name }));

  // --- Contenido genérico / incompleto ---
  // Importante: el campo `description` vacío NO implica página delgada — la mayoría de
  // fichas muestran contenido real en pantalla vía shortDescription/features/story
  // (product.description solo se usa como fallback de meta/JSON-LD). Por eso se reportan
  // por separado: el estado del campo `description` y el estado del contenido visible.
  let emptyDescriptionCount = 0;
  let genericDescriptionCount = 0;
  let missingShortDescription = 0;
  let missingFeatures = 0;
  let missingUseCases = 0;
  let missingStory = 0;
  let thinContentCount = 0; // description vacía/genérica Y sin ningún campo suplementario
  let partialContentCount = 0; // description vacía/genérica pero con AL MENOS un campo suplementario
  const thinContentExamples = [];
  const genericDescExamples = [];

  for (const p of products) {
    const isEmpty = !p.description || !p.description.trim();
    const isGeneric = p.description === GENERIC_DESCRIPTION(p.name);
    const descWeak = isEmpty || isGeneric;
    const noShort = !p.shortDescription || p.shortDescription.trim().length < 10;
    const noFeatures = !p.features || p.features.length === 0;
    const noUseCases = !p.useCases || p.useCases.length === 0;
    const noStory = !p.story || p.story.trim().length < 50;

    if (isEmpty) emptyDescriptionCount++;
    if (isGeneric) {
      genericDescriptionCount++;
      pushExample(genericDescExamples, p.slug);
    }
    if (noShort) missingShortDescription++;
    if (noFeatures) missingFeatures++;
    if (noUseCases) missingUseCases++;
    if (noStory) missingStory++;

    if (descWeak) {
      if (noShort && noFeatures && noUseCases) {
        thinContentCount++;
        pushExample(thinContentExamples, p.slug);
      } else {
        partialContentCount++;
      }
    }
  }

  // --- Imágenes ---
  let externalImages = 0;
  let brokenLocalImages = 0;
  let missingImages = 0;
  const brokenLocalExamples = [];

  for (const p of products) {
    const first = p.images?.[0];
    if (!first) {
      missingImages++;
      continue;
    }
    if (first.startsWith('http')) {
      externalImages++;
    } else {
      const full = path.join(ROOT, 'public', first);
      if (!existsSync(full)) {
        brokenLocalImages++;
        pushExample(brokenLocalExamples, { slug: p.slug, image: first });
      }
    }
  }

  // --- Residuo geográfico (Ecuador) ---
  // Alcance acotado a seoKeywords/keywords a propósito (igual que scripts/clean-ecuador-residue.mjs):
  // "manta" es también el sustantivo español (cobija) y aparece legítimamente en story/
  // shortDescription de productos reales de cobijas. Ampliar el escaneo a esos campos
  // libres produce falsos positivos sin encontrar residuo real (verificado manualmente).
  let ecuadorReferenceCount = 0;
  const ecuadorFields = ['seoKeywords', 'keywords'];
  const ecuadorExamples = [];

  for (const p of products) {
    const hits = ecuadorFields.filter((field) => typeof p[field] === 'string' && ECUADOR_PATTERN.test(p[field]));
    if (hits.length) {
      ecuadorReferenceCount++;
      pushExample(ecuadorExamples, { slug: p.slug, fields: hits });
    }
  }

  // --- Títulos y descripciones SEO ---
  let emptyTitle = 0;
  let emptyDescription = 0;
  let titleTooLong = 0; // > 65
  let descTooLong = 0; // > 165
  let descTooShort = 0; // < 70
  const titleMap = new Map();
  const descMap = new Map();

  for (const p of products) {
    if (!p.seoTitle) emptyTitle++;
    if (!p.seoDescription) emptyDescription++;
    if (p.seoTitle && p.seoTitle.length > 65) titleTooLong++;
    if (p.seoDescription && p.seoDescription.length > 165) descTooLong++;
    if (p.seoDescription && p.seoDescription.length < 70) descTooShort++;
    if (p.seoTitle) titleMap.set(p.seoTitle, (titleMap.get(p.seoTitle) || 0) + 1);
    if (p.seoDescription) descMap.set(p.seoDescription, (descMap.get(p.seoDescription) || 0) + 1);
  }
  const duplicateTitles = [...titleMap.entries()].filter(([, c]) => c > 1);
  const duplicateDescriptions = [...descMap.entries()].filter(([, c]) => c > 1);

  // --- Candidatas a indexación / noindex ---
  // Heurística conservadora (ver Fase 3 de SEO_AUDIT_1.md para la versión tipada
  // que se aplicará en las páginas). Aquí solo se reporta, no se aplica nada.
  // Candidata SOLO si no hay contenido diferencial visible en NINGÚN campo
  // (description vacía/genérica Y sin shortDescription Y sin features Y sin useCases).
  // Tener al menos uno de esos campos con contenido real se considera suficiente para no
  // marcar la ficha como candidata en esta primera pasada.
  let indexableCount = 0;
  let noindexCandidateCount = 0;
  const noindexReasons = new Map();
  const noindexExamples = [];

  for (const p of products) {
    const isEmpty = !p.description || !p.description.trim();
    const isGeneric = p.description === GENERIC_DESCRIPTION(p.name);
    const noShort = !p.shortDescription || p.shortDescription.trim().length < 10;
    const noFeatures = !p.features || p.features.length === 0;
    const noUseCases = !p.useCases || p.useCases.length === 0;

    const reasons = [];
    if (isEmpty) reasons.push('descripcion_vacia');
    if (isGeneric) reasons.push('descripcion_generica');
    if (noShort) reasons.push('sin_shortDescription');
    if (noFeatures) reasons.push('sin_features');
    if (noUseCases) reasons.push('sin_useCases');
    if (!p.images?.[0]) reasons.push('sin_imagen');

    const isCandidate = (isEmpty || isGeneric) && noShort && noFeatures && noUseCases;

    if (isCandidate) {
      noindexCandidateCount++;
      for (const r of reasons) noindexReasons.set(r, (noindexReasons.get(r) || 0) + 1);
      pushExample(noindexExamples, { slug: p.slug, reasons });
    } else {
      indexableCount++;
    }
  }

  // --- Ensamblar reporte ---
  report.findings = {
    slugs: {
      duplicateCount: duplicateSlugs.length,
      duplicates: duplicateSlugs.slice(0, EXAMPLE_LIMIT).map(([slug, count]) => ({ slug, count })),
      missingSlugOrName,
    },
    categories: {
      total: categories.length,
      productsPerCategory: Object.fromEntries(productsPerCategory),
      orphanCategoryProductCount: orphanCategoryProducts.length,
      orphanCategoryProductExamples: orphanCategoryProducts,
      emptyCategories,
    },
    content: {
      note: 'El campo description vacío NO implica página delgada por sí solo: la mayoría de fichas muestran shortDescription/features/story en pantalla aunque description esté vacío (solo se usa como fallback de meta/JSON-LD).',
      emptyDescriptionCount,
      genericDescriptionCount,
      genericDescriptionExamples: genericDescExamples,
      missingShortDescription,
      missingFeatures,
      missingUseCases,
      missingStory,
      partialContentCount,
      thinContentCount,
      thinContentExamples,
    },
    images: {
      externalImages,
      brokenLocalImages,
      missingImages,
      brokenLocalExamples,
    },
    ecuadorResidue: {
      productCount: ecuadorReferenceCount,
      examples: ecuadorExamples,
    },
    metadata: {
      emptyTitle,
      emptyDescription,
      titleTooLong,
      descTooLong,
      descTooShort,
      duplicateTitleCount: duplicateTitles.length,
      duplicateDescriptionCount: duplicateDescriptions.length,
    },
    indexability: {
      indexableCount,
      noindexCandidateCount,
      reasonBreakdown: Object.fromEntries(noindexReasons),
      examples: noindexExamples,
    },
  };

  // --- Salida en consola ---
  console.log(`\nSEO AUDIT — ${report.generatedAt}`);
  console.log('='.repeat(60));
  console.log(`Productos: ${report.totals.products} | Categorías: ${report.totals.categories} | Posts: ${report.totals.blogPosts}`);
  console.log('-'.repeat(60));
  console.log(`Slugs duplicados: ${duplicateSlugs.length}`);
  console.log(`Productos con categoryId huérfano: ${orphanCategoryProducts.length}`);
  console.log(`Categorías sin productos: ${emptyCategories.length}${emptyCategories.length ? ' -> ' + emptyCategories.map((c) => c.slug).join(', ') : ''}`);
  console.log('-'.repeat(60));
  console.log(`Campo description vacío: ${emptyDescriptionCount} (no implica página delgada por sí solo)`);
  console.log(`Descripción genérica (plantilla): ${genericDescriptionCount}`);
  console.log(`Sin shortDescription: ${missingShortDescription} | Sin features: ${missingFeatures} | Sin useCases: ${missingUseCases} | Sin story: ${missingStory}`);
  console.log(`Description vacía/genérica pero con contenido en otro campo: ${partialContentCount}`);
  console.log(`Contenido realmente delgado (sin nada en ningún campo): ${thinContentCount}`);
  console.log('-'.repeat(60));
  console.log(`Imágenes externas: ${externalImages} | Imágenes locales rotas: ${brokenLocalImages} | Sin imagen: ${missingImages}`);
  console.log('-'.repeat(60));
  console.log(`Productos con residuo Ecuador (Quito/Guayaquil/Cuenca/...): ${ecuadorReferenceCount}`);
  console.log('-'.repeat(60));
  console.log(`seoTitle vacío: ${emptyTitle} | > 65 car.: ${titleTooLong} | duplicados: ${duplicateTitles.length}`);
  console.log(`seoDescription vacío: ${emptyDescription} | > 165 car.: ${descTooLong} | < 70 car.: ${descTooShort} | duplicados: ${duplicateDescriptions.length}`);
  console.log('-'.repeat(60));
  console.log(`Indexables (heurística conservadora): ${indexableCount}`);
  console.log(`Candidatas a noindex: ${noindexCandidateCount}`);
  console.log('  Motivos:', JSON.stringify(Object.fromEntries(noindexReasons)));
  console.log('='.repeat(60));
  console.log('Este script no modifica ningún archivo. Los conteos de "candidatas a noindex"');
  console.log('son un reporte para revisión manual, no se aplica noindex automáticamente.\n');

  // --- Reporte JSON opcional ---
  try {
    const reportsDir = path.join(ROOT, 'reports');
    if (!existsSync(reportsDir)) mkdirSync(reportsDir);
    const stamp = report.generatedAt.replace(/[:.]/g, '-');
    const outPath = path.join(reportsDir, `seo-audit-${stamp}.json`);
    writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Reporte detallado: reports/seo-audit-${stamp}.json\n`);
  } catch (err) {
    console.warn(`(No se pudo escribir el reporte JSON: ${err.message})`);
  }

  process.exit(0);
}

main();
