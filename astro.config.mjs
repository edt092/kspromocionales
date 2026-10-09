import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { evaluateProductIndexability } from './src/lib/product-indexability.mjs';

const readJson = (rel) => JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'));

// La misma política de src/lib/product-indexability.mjs decide qué fichas llevan noindex y,
// por tanto, cuáles quedan fuera del sitemap (T06: una sola implementación compartida).
const products = readJson('./data/products.json');
const noindexProductPaths = new Set(
  products.filter((p) => !evaluateProductIndexability(p).indexable).map((p) => `/productos/${p.slug}/`)
);

// Páginas estáticas fuera de data/products.json que también usan robots="noindex, follow"
// (ver BaseLayout). Deben quedar fuera del sitemap por la misma razón que los productos.
const noindexStaticPaths = new Set(['/gracias/']);

// T16: <lastmod> solo con una fecha editorial real. Los posts tienen datePublished/dateModified
// mantenidos a mano; productos y categorías no tienen una fecha de cambio visible fiable
// (last_ai_update no representa cambios visibles), así que se omite en vez de usar la del build.
const postLastmod = new Map(
  readJson('./data/blog/posts.json').map((p) => [`/blog/${p.slug}/`, p.dateModified || p.date])
);

// T04: aliases de identidades consolidadas → 301 al producto primario. Netlify procesa
// dist/_redirects antes que las reglas de netlify.toml, así que estos 301 se evalúan antes
// del catch-all 404. Netlify normaliza la barra final al comparar rutas.
const aliases = readJson('./data/product-aliases.json');
const redirectsIntegration = {
  name: 'ks-product-alias-redirects',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const lines = [
        '# Generado en build desde data/product-aliases.json (T04). No editar a mano.',
        ...aliases.map((a) => `${a.from}  ${a.to}  301`),
        // /favicon.ico respondía 404; el favicon real es PNG (BaseLayout).
        '/favicon.ico  /favicon-src.png  301',
      ];
      writeFileSync(new URL('_redirects', dir), lines.join('\n') + '\n', 'utf8');
    },
  },
};

export default defineConfig({
  site: 'https://www.kspromocionales.co',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !noindexProductPaths.has(path) && !noindexStaticPaths.has(path);
      },
      serialize: (item) => {
        const lastmod = postLastmod.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod: new Date(`${lastmod}T00:00:00Z`).toISOString() } : item;
      },
    }),
    redirectsIntegration,
  ],
});
