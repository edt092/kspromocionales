#!/usr/bin/env node
// Adapta el catálogo de ksp-ecommerce-engine (Ecuador) a un catálogo semilla para
// KSPROMOCIONALES.CO (Colombia). Se corre UNA VEZ manualmente (`pnpm seed:colombia`),
// no forma parte del build. El contenido real y diferenciado para Colombia lo produce
// después el ETL (promo-content-pipeline, marca ksp_co) — ver README del pipeline.
//
// Reemplazo textual DIRIGIDO (no una traducción genérica): mapea cada ciudad
// ecuatoriana mencionada a una ciudad colombiana fija, y "Ecuador" -> "Colombia".
// Solo se reemplazan las formas CAPITALIZADAS de Cuenca/Manta (nombres propios de
// ciudad) para no tocar esas mismas palabras usadas como sustantivo común en
// descripciones de producto (p. ej. "manta" = cobija, "cuenca" = hidrográfica).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_REPO = path.resolve(ROOT, '../KSPROMOCIONALES/ksp-ecommerce-engine');

const CITY_MAP = [
  ['Quito', 'Bucaramanga'],
  ['Guayaquil', 'Bogotá'],
  ['Cuenca', 'Medellín'],
  ['Manta', 'Cali'],
  ['Ambato', 'Barranquilla'],
];

const COUNTRY_MAP = [
  ['Ecuador', 'Colombia'],
  ['ecuatorianas', 'colombianas'],
  ['ecuatorianos', 'colombianos'],
  ['ecuatoriana', 'colombiana'],
  ['ecuatoriano', 'colombiano'],
  ['ecuador', 'colombia'],
];

function adaptText(value) {
  if (typeof value !== 'string' || !value) return value;
  let out = value;
  for (const [from, to] of CITY_MAP) {
    out = out.split(from).join(to);
  }
  for (const [from, to] of COUNTRY_MAP) {
    out = out.split(from).join(to);
  }
  return out;
}

// Para slugs/ids (siempre minúsculas, sin tildes) solo se tocan palabras SIN
// ambigüedad de sustantivo común (a diferencia de Cuenca/Manta, que si son
// nombres reales de producto —p. ej. "manta-personalizada"= cobija— no deben
// tocarse). Coincidencia por segmento completo entre guiones, no substring.
const SLUG_SAFE_MAP = {
  ecuador: 'colombia',
  quito: 'bucaramanga',
  guayaquil: 'bogota',
  ambato: 'barranquilla',
};

function adaptSlugLike(value) {
  if (typeof value !== 'string' || !value.includes('-')) return value;
  return value
    .split('-')
    .map((segment) => SLUG_SAFE_MAP[segment] ?? segment)
    .join('-');
}

function adaptDeep(value) {
  if (Array.isArray(value)) return value.map(adaptDeep);
  if (typeof value === 'string') return adaptText(value);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = adaptDeep(v);
    return out;
  }
  return value;
}

// Solo se recontextualizan los campos de texto libre/SEO; identificadores
// (id, slug, categoryId, referencia_proveedor, images, imagen_original_url) se
// preservan intactos — son la clave que el ETL usará para mergear después.
const PRODUCT_TEXT_FIELDS = [
  'name', 'description', 'seoTitle', 'seoDescription', 'seoKeywords',
  'whatsappMessage', 'categoria', 'story', 'shortDescription', 'features',
  'useCases', 'keywords',
];
const CATEGORY_TEXT_FIELDS = [
  'name', 'description', 'story', 'seoTitle', 'seoDescription', 'benefits', 'editorial',
];

function adaptProduct(product) {
  const next = { ...product };
  for (const field of PRODUCT_TEXT_FIELDS) {
    if (field in next) next[field] = adaptDeep(next[field]);
  }
  if (next.slug) next.slug = adaptSlugLike(next.slug);
  if (next.id) next.id = adaptSlugLike(next.id);
  return next;
}

function adaptCategory(category) {
  const next = { ...category };
  for (const field of CATEGORY_TEXT_FIELDS) {
    if (field in next) next[field] = adaptDeep(next[field]);
  }
  return next;
}

const BLOG_POST_FIELDS = ['title', 'excerpt', 'categoryName'];
const BLOG_SEO_FIELDS = ['metaTitle', 'metaDescription', 'keywords'];
const BLOG_POSTS_TO_SEED = 8; // muestra representativa, no los 41 posts del sitio Ecuador

async function seedBlog() {
  const postsRaw = await readFile(path.join(SOURCE_REPO, 'data/blog/posts.json'), 'utf-8');
  const sourcePosts = JSON.parse(postsRaw);
  const contentModule = await import(
    pathToFileURL(path.join(SOURCE_REPO, 'data/blog/content/index.js')).href
  );
  const blogContent = contentModule.blogContent;

  const withContent = sourcePosts.filter((p) => typeof blogContent[p.slug] === 'string');
  const picked = withContent.slice(0, BLOG_POSTS_TO_SEED);

  const adaptedPosts = [];
  const contentEntries = {};

  for (const post of picked) {
    const next = { ...post };
    next.slug = adaptSlugLike(next.slug);
    for (const field of BLOG_POST_FIELDS) {
      if (field in next) next[field] = adaptText(next[field]);
    }
    if (next.seo) {
      const seo = { ...next.seo };
      for (const field of BLOG_SEO_FIELDS) {
        if (field in seo) seo[field] = adaptText(seo[field]);
      }
      next.seo = seo;
    }
    if (next.tags) next.tags = next.tags.map(adaptText);
    adaptedPosts.push(next);
    contentEntries[next.slug] = adaptText(blogContent[post.slug]);
  }

  await mkdir(path.join(ROOT, 'data/blog/content'), { recursive: true });
  await writeFile(path.join(ROOT, 'data/blog/posts.json'), JSON.stringify(adaptedPosts, null, 2), 'utf-8');

  const seedModuleBody = `// Generado por scripts/seed-from-ecuador.mjs — contenido editorial adaptado del\n// catálogo de ksp-ecommerce-engine (Ecuador). Placeholder hasta que el ETL\n// (promo-content-pipeline, marca ksp_co) publique posts con voz propia de Colombia.\nexport const blogContentSeed = ${JSON.stringify(contentEntries, null, 2)};\n`;
  await writeFile(path.join(ROOT, 'data/blog/content/seed.js'), seedModuleBody, 'utf-8');

  return adaptedPosts.length;
}

async function main() {
  const productsRaw = await readFile(path.join(SOURCE_REPO, 'data/products.json'), 'utf-8');
  const categoriesRaw = await readFile(path.join(SOURCE_REPO, 'data/categories.json'), 'utf-8');

  const products = JSON.parse(productsRaw).map(adaptProduct);
  const categories = JSON.parse(categoriesRaw).map(adaptCategory);

  // Adaptar el slug puede, en casos raros, hacer colisionar dos productos
  // (ej. uno ya terminaba en "-colombia" y otro en "-ecuador" -> mismo
  // resultado). Astro generaría una sola página silenciosamente para ambos
  // si eso pasa, así que se desambigua acá antes de escribir.
  const seenSlugs = new Set();
  for (const product of products) {
    let candidate = product.slug;
    let suffix = 2;
    while (seenSlugs.has(candidate)) {
      candidate = `${product.slug}-${suffix++}`;
    }
    seenSlugs.add(candidate);
    product.slug = candidate;
  }

  await mkdir(path.join(ROOT, 'data'), { recursive: true });
  await writeFile(path.join(ROOT, 'data/products.json'), JSON.stringify(products, null, 2), 'utf-8');
  await writeFile(path.join(ROOT, 'data/categories.json'), JSON.stringify(categories, null, 2), 'utf-8');

  const blogCount = await seedBlog();

  console.log(`Semilla escrita: ${products.length} productos, ${categories.length} categorías, ${blogCount} posts de blog.`);
  console.log('Recuerda: este contenido es un placeholder geo-adaptado, no voz propia de Colombia.');
  console.log('El ETL (promo-content-pipeline, marca ksp_co) lo reemplaza con contenido enriquecido real.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
