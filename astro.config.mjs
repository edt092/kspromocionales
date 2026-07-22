import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { evaluateProductIndexability } from './src/lib/product-indexability.ts';

// La misma regla de indexabilidad de src/lib/product-indexability.ts decide qué URLs de
// producto se excluyen del sitemap, para que la regla de la página y la del sitemap sean
// exactamente la misma (Fase 3, SEO_AUDIT_1.md). Se lee el JSON con fs en vez de importarlo
// para no depender de soporte de import assertions en el loader de configuración.
const productsPath = fileURLToPath(new URL('./data/products.json', import.meta.url));
const products = JSON.parse(readFileSync(productsPath, 'utf8'));
const noindexProductPaths = new Set(
  products
    .filter((p) => !evaluateProductIndexability(p).indexable)
    .map((p) => `/productos/${p.slug}/`)
);

// Páginas estáticas fuera de data/products.json que también usan robots="noindex, follow"
// (ver BaseLayout). Deben quedar fuera del sitemap por la misma razón que los productos.
const noindexStaticPaths = new Set(['/gracias/']);

export default defineConfig({
  site: 'https://kspromocionales.co',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !noindexProductPaths.has(path) && !noindexStaticPaths.has(path);
      },
    }),
  ],
});
