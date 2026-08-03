#!/usr/bin/env node
/**
 * Auditoría SEO de canonicalización de solo lectura. Valida el HTML ya compilado en
 * `dist/` (no lo modifica, no reconstruye el sitio). Uso: `npm run seo:audit:urls`
 * (requiere `npm run build` previo).
 *
 * Verifica que host (www), protocolo (https), trailing slash, autorreferencia de
 * canonical, y coherencia sitemap/noindex sean consistentes en todas las páginas
 * generadas (Fase 10, GSC_REDIRECT_CANONICAL_AUDIT.md).
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const EXPECTED_HOST = 'www.kspromocionales.co';
const EXPECTED_ORIGIN = `https://${EXPECTED_HOST}`;
const EXAMPLE_LIMIT = 30;

// IDs históricos de categorías (Fase 7): nunca fueron slugs de ruta reales (el
// routing siempre usó category.slug, no category.id, desde el commit inicial), pero
// se vigilan para detectar cualquier enlace interno accidental hacia ellos.
const HISTORIC_CATEGORY_IDS = [
  'escritura',
  'confeccion',
  'gorras',
  'llaveros',
  'maletines',
  'memorias-usb',
  'mugs',
  'oficina',
  'tecnologia',
  'tomatodos-botilitos',
];

function pushExample(list, value) {
  if (list.length < EXAMPLE_LIMIT) list.push(value);
}

function walkHtmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkHtmlFiles(full));
    } else if (entry.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

// Deriva el pathname público esperado a partir de la ruta del archivo compilado,
// replicando la convención trailingSlash:'always' de Astro (dist/x/index.html -> /x/,
// dist/404.html -> /404/).
function pathnameForFile(file) {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.slice(0, -'.html'.length) + '/';
}

function parseSitemapPathnames(xml) {
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const pathnames = [];
  for (const loc of locs) {
    try {
      pathnames.push(new URL(loc).pathname);
    } catch {
      // ignorado: entrada de sitemap con loc no parseable
    }
  }
  return { locs, pathnames };
}

function main() {
  if (!existsSync(DIST)) {
    console.error('✗ No existe dist/. Ejecuta `npm run build` antes de `npm run seo:audit:urls`.');
    process.exit(1);
  }
  const sitemapPath = path.join(DIST, 'sitemap-0.xml');
  const sitemapIndexPath = path.join(DIST, 'sitemap-index.xml');
  if (!existsSync(sitemapPath) || !existsSync(sitemapIndexPath)) {
    console.error('✗ Falta dist/sitemap-0.xml o dist/sitemap-index.xml. Ejecuta `npm run build`.');
    process.exit(1);
  }

  const sitemapIndexXml = readFileSync(sitemapIndexPath, 'utf8');
  const sitemapXml = readFileSync(sitemapPath, 'utf8');
  const { locs: sitemapLocs, pathnames: sitemapPathnames } = parseSitemapPathnames(sitemapXml);
  const sitemapPathnameSet = new Set(sitemapPathnames);

  const findings = {
    sitemapIndexWrongHost: [],
    sitemapWrongHost: [],
    sitemapHttp: [],
    sitemapNoTrailingSlash: [],
    sitemapDuplicates: [],
    sitemapGracias: [],
    canonicalMissing: [],
    canonicalMultiple: [],
    canonicalWrongHost: [],
    canonicalWrongProtocol: [],
    canonicalNoTrailingSlash: [],
    canonicalNotSelfReferential: [],
    canonicalQueryString: [],
    indexableNotInSitemap: [],
    noindexInSitemap: [],
    internalLinkWrongHost: [],
    internalLinkHistoricSlug: [],
    internalLinkNoTrailingSlash: [],
  };

  // --- Sitemap ---
  if (!sitemapIndexXml.includes(`${EXPECTED_ORIGIN}/sitemap-0.xml`)) {
    findings.sitemapIndexWrongHost.push(sitemapIndexXml.match(/<loc>[^<]*<\/loc>/)?.[0] ?? '(no loc)');
  }
  const seenLocs = new Set();
  for (const loc of sitemapLocs) {
    if (!loc.startsWith(EXPECTED_ORIGIN + '/')) pushExample(findings.sitemapWrongHost, loc);
    if (loc.startsWith('http://')) pushExample(findings.sitemapHttp, loc);
    const pathname = (() => {
      try {
        return new URL(loc).pathname;
      } catch {
        return '';
      }
    })();
    if (pathname && !pathname.endsWith('/') && !path.extname(pathname)) {
      pushExample(findings.sitemapNoTrailingSlash, loc);
    }
    if (pathname === '/gracias/') pushExample(findings.sitemapGracias, loc);
    if (seenLocs.has(loc)) pushExample(findings.sitemapDuplicates, loc);
    seenLocs.add(loc);
  }

  // --- Páginas HTML ---
  const htmlFiles = walkHtmlFiles(DIST);
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const relFile = path.relative(DIST, file).split(path.sep).join('/');
    const expectedPathname = pathnameForFile(file);

    const canonicalMatches = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g)];
    if (canonicalMatches.length === 0) {
      pushExample(findings.canonicalMissing, relFile);
      continue;
    }
    if (canonicalMatches.length > 1) {
      pushExample(findings.canonicalMultiple, { file: relFile, count: canonicalMatches.length });
    }

    const canonicalHref = canonicalMatches[0][1];
    let canonicalUrl;
    try {
      canonicalUrl = new URL(canonicalHref);
    } catch {
      pushExample(findings.canonicalWrongHost, { file: relFile, canonicalHref });
      continue;
    }

    if (canonicalUrl.protocol !== 'https:') {
      pushExample(findings.canonicalWrongProtocol, { file: relFile, canonicalHref });
    }
    if (canonicalUrl.host !== EXPECTED_HOST) {
      pushExample(findings.canonicalWrongHost, { file: relFile, canonicalHref });
    }
    if (canonicalUrl.search) {
      pushExample(findings.canonicalQueryString, { file: relFile, canonicalHref });
    }
    if (!canonicalUrl.pathname.endsWith('/')) {
      pushExample(findings.canonicalNoTrailingSlash, { file: relFile, canonicalHref });
    }
    if (canonicalUrl.pathname !== expectedPathname) {
      pushExample(findings.canonicalNotSelfReferential, {
        file: relFile,
        expectedPathname,
        canonicalPathname: canonicalUrl.pathname,
      });
    }

    const isNoindex = /<meta\s+name="robots"\s+content="noindex/.test(html);
    const inSitemap = sitemapPathnameSet.has(expectedPathname);
    if (isNoindex && inSitemap) {
      pushExample(findings.noindexInSitemap, expectedPathname);
    }
    // Solo páginas fuera de /pagina/N/ >1 y del propio 404 se esperan indexables+en sitemap;
    // el resto de "no indexable pero no noindex explícito" (p. ej. archivos que Astro no
    // enruta) no aplica aquí porque solo iteramos HTML realmente generado.
    if (!isNoindex && relFile !== '404.html' && !inSitemap) {
      pushExample(findings.indexableNotInSitemap, expectedPathname);
    }

    // --- Enlaces internos ---
    const hrefMatches = [...html.matchAll(/<a\s+[^>]*href="([^"]+)"/g)];
    for (const [, href] of hrefMatches) {
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('http://wa.me') ||
        href.startsWith('https://wa.me') ||
        href.startsWith('https://api.whatsapp.com')
      ) {
        continue;
      }

      let hrefPathname = null;
      if (href.startsWith('/')) {
        hrefPathname = href;
      } else if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const u = new URL(href);
          if (u.host.endsWith('kspromocionales.co')) {
            if (u.host !== EXPECTED_HOST || u.protocol !== 'https:') {
              pushExample(findings.internalLinkWrongHost, { file: relFile, href });
            }
            hrefPathname = u.pathname;
          }
        } catch {
          continue;
        }
      } else {
        continue; // enlace externo relativo/otro protocolo, fuera de alcance
      }

      if (hrefPathname && !hrefPathname.endsWith('/') && !path.extname(hrefPathname)) {
        pushExample(findings.internalLinkNoTrailingSlash, { file: relFile, href });
      }
      if (hrefPathname) {
        const catMatch = hrefPathname.match(/^\/categorias\/([^/]+)/);
        if (catMatch && HISTORIC_CATEGORY_IDS.includes(catMatch[1])) {
          pushExample(findings.internalLinkHistoricSlug, { file: relFile, href });
        }
      }
    }
  }

  // --- Reporte ---
  const structuralKeys = Object.keys(findings);
  let hasErrors = false;
  console.log(`\nSEO AUDIT URLs — ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log(`Páginas HTML analizadas: ${htmlFiles.length}`);
  console.log(`URLs en sitemap: ${sitemapLocs.length}`);
  console.log('-'.repeat(60));

  for (const key of structuralKeys) {
    const list = findings[key];
    const count = list.length;
    const marker = count > 0 ? '✗' : '✓';
    if (count > 0) hasErrors = true;
    console.log(`${marker} ${key}: ${count}`);
    if (count > 0) {
      for (const ex of list.slice(0, 5)) {
        console.log(`    - ${JSON.stringify(ex)}`);
      }
      if (count > 5) console.log(`    ... y ${count - 5} más (hasta ${EXAMPLE_LIMIT} en total registrados)`);
    }
  }

  console.log('='.repeat(60));
  if (hasErrors) {
    console.error('✗ Auditoría de URLs falló: hay hallazgos estructurales arriba.\n');
    process.exit(1);
  }
  console.log('✓ Sin hallazgos estructurales.\n');
  process.exit(0);
}

main();
