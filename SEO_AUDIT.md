# SEO_AUDIT.md — KS Promocionales Colombia

Auditoría técnica y de contenido del repositorio `kspromocionales.co` (Astro 4 / TS / Tailwind / Netlify).
Generada antes de cualquier implementación, según lo exigido en `seo-1.md` (Fase 1).

- Build: `npm run build` (astro check && astro build) → **OK**, 2.248 páginas generadas, `astro check`: 0 errors / 0 warnings / 55 hints.
- Dominio indexado por primera vez ~15 jul 2026 (sitio nuevo, sin histórico de posiciones).
- Inventario de URLs generadas: 2.185 productos + 37 categorías + 8 posts de blog + 7 páginas de ciudad + páginas comerciales/institucionales + índices ⇒ 2.248 páginas HTML en `dist/`.

## Metodología

Auditoría de código estático (no crawl en vivo, el dominio es nuevo). Se inspeccionaron: `astro.config.mjs`, `netlify.toml`, `tsconfig.json`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/pages/categorias/*`, `src/pages/productos/[slug].astro`, `src/pages/productos-promocionales-colombia/[ciudad].astro`, `src/data/geo-data.ts`, `src/lib/site.ts`, `src/components/{Header,Footer,ProductCard,FaqSection}.astro`, `public/robots.txt`, `public/llms.txt`, `data/products.json` (2.185 registros, analizado con script Node), `data/categories.json` (37 registros).

---

## P0 — Bloquea rastreo/indexación o produce información engañosa

> **Estado: los 3 hallazgos P0 fueron corregidos e implementados** (ver detalle en cada uno). Verificado con `npm run build` (0 errors, 2.248 páginas) e inspección del HTML compilado en `dist/`.

### P0-1. `Product.offers` inválido: `InStock` sin precio verificable ✅ Corregido
- **Evidencia:** `src/pages/productos/[slug].astro:33-38` — todo producto emite `offers.availability = "InStock"` y un `priceSpecification` sin campo `price`. Confirmado en las 2.185 fichas (no hay dato de precio en `data/products.json`).
- **Riesgo:** Schema.org/Google Rich Results exige `price` (o `lowPrice`/`highPrice`) en un `Offer`; un `PriceSpecification` sin precio es inválido y puede generar errores en Search Console → "Productos con problemas". Declarar `InStock` sin inventario real es información no verificable (contradice reglas del propio brief).
- **Solución propuesta:** quitar `offers` cuando no hay precio real, o sustituir por una declaración que no implique disponibilidad/precio (p. ej. omitir `offers` y mantener `brand`, `image`, `description`, `sku` si existe). No inventar precio.
- **Criterio de validación:** Rich Results Test sin errores de "missing field 'price'"; Search Console → Mejoras → Productos sin errores nuevos.
- **Implementado:** `src/pages/productos/[slug].astro` — se eliminó el bloque `offers` del JSON-LD `Product`; se añadió `url` (real, autogenerada) e `image` filtrada a solo URLs absolutas válidas (ver P0-3). Confirmado `grep -c "InStock"` = 0 en las 2.185 páginas compiladas.

### P0-2. `LocalBusiness` declarado para ciudades sin sede real ✅ Corregido
- **Evidencia:** `src/pages/productos-promocionales-colombia/[ciudad].astro:19-28` aplica `@type: LocalBusiness` a las 7 ciudades de `src/data/geo-data.ts` (Bucaramanga, Bogotá, Medellín, Cali, Barranquilla, Cartagena, Cúcuta) sin distinción. No existe evidencia en el repo de sede física fuera de Bucaramanga.
- **Riesgo:** Google Business Profile / Search guidelines consideran spam declarar ubicaciones de negocio no verificables ("fake business listings"). Puede afectar confianza del dominio completo.
- **Solución propuesta:** Mantener `LocalBusiness` solo para Bucaramanga si hay dirección/datos verificables suficientes; si no, usar `Organization`/`Service` con `areaServed`. Para las otras 6 ciudades, usar `Service`/`CollectionPage` con `areaServed: {City}` y `provider: Organization`.
- **Verificación adicional:** se buscó en todo `src/` (`SITE`, `geo-data.ts`, `nosotros.astro`, `Footer.astro`) cualquier dirección física (calle, carrera, código postal) — **no existe ninguna en el repo**, ni siquiera para Bucaramanga. Por lo tanto tampoco Bucaramanga cumple el estándar de `LocalBusiness` (nombre + dirección verificable) hoy.
- **Implementado:** `src/pages/productos-promocionales-colombia/[ciudad].astro` — se reemplazó `LocalBusiness` por `Service` (con `areaServed: City` y `provider: Organization`) para las **7 ciudades por igual**, incluida Bucaramanga, ya que ninguna tiene datos de dirección verificables en el repositorio. Cuando exista una dirección real y confirmada para Bucaramanga, se puede reintroducir `LocalBusiness` solo ahí.
- **Criterio de validación:** `grep -l "LocalBusiness" dist/productos-promocionales-colombia/*/index.html` = vacío; `grep -l '"@type":"Service"'` = 7 archivos. Confirmado.

### P0-3. 89 productos con imagen local rota (404) ✅ Corregido
- **Evidencia:** de 2.185 productos, 89 tienen `images[0]` como ruta relativa (`/images/products/xx.jpg`) que **no existe** en `public/images/products/` (solo existe `_placeholder-ksp-co.jpg`). El resto (2.096) usa URLs absolutas a `catalogospromocionales.com`.
- **Riesgo:** `<img src>` y JSON-LD `image` apuntan a un recurso inexistente → 404 real en esas 89 fichas, imagen rota visible al usuario, `image` inválido en schema Product.
- **Solución propuesta:** hasta tener la imagen real, apuntar esas 89 fichas al placeholder existente (`/images/products/_placeholder-ksp-co.jpg`) tanto en `<img>` como en JSON-LD, o excluir `image` del JSON-LD si no hay imagen real. No inventar imagen.
- **Criterio de validación:** 0 rutas de imagen de producto que no resuelvan a un archivo existente en `dist/`.
- **Implementado:** nuevo helper `src/lib/product-image.ts` (`getProductImage`, `getValidProductImages`) usado en `ProductCard.astro` y `productos/[slug].astro`. Cualquier `images[0]` que no empiece por `http` cae al placeholder existente en `<img>`; el JSON-LD `Product.image` solo incluye URLs absolutas válidas (se omite el campo si no hay ninguna). Verificado con el producto `dispensador-bolsas-linterna-led-personalizado-colombia` (antes apuntaba a `/images/products/va-977.jpg`, inexistente): el HTML compilado ahora usa `_placeholder-ksp-co.jpg`.

---

## P1 — Impacto SEO alto

### P1-1. Campo `description` vacío en 1.211 productos (55%) — corregido tras auditoría automatizada
- **Evidencia:** `data/products.json` — 1.211/2.185 productos tienen el campo `description` vacío; 294 adicionales tienen la plantilla genérica literal (`"{Nombre} personalizado con logo. Producto promocional para empresas en Colombia."`).
- **Corrección respecto al hallazgo preliminar del brief:** el campo `description` **no se muestra en la página de producto** (`src/pages/productos/[slug].astro` solo lo usa como fallback de `description`/JSON-LD, nunca en el cuerpo visible). El contenido visible real viene de `shortDescription`, `features`, `useCases` y `story`. Verificado con `npm run seo:audit`: de los 1.211+294=1.505 productos con `description` vacía o genérica, **1.504 sí tienen contenido real en al menos uno de esos otros campos**, y solo **1 producto** (`cargador-inalambrico-magnet-3-1-eco-10746`) carece de contenido en absolutamente todos los campos.
- **Riesgo real:** bajo en general (no es thin/duplicate content masivo como sugería la cifra inicial); el riesgo genuino se concentra en el subconjunto de P1-2.
- **Solución propuesta:** no reescribir en masa. El `npm run seo:audit` ya implementado (Fase 1) reporta este desglose exacto (`emptyDescriptionCount`, `partialContentCount`, `thinContentCount`) para decidir con datos reales, no con la cifra headline.

### P1-2. 92 productos sin shortDescription/features/useCases (contenido visible débil)
- **Evidencia:** 92 productos carecen simultáneamente de `shortDescription`, `features` y `useCases` — confirmado por `npm run seo:audit`. De estos, solo 1 tiene además `description` vacía/genérica (contenido realmente nulo); los otros 91 sí conservan una `description` propia no genérica, aunque sin el resto del contenido enriquecido.
- **Riesgo:** páginas con contenido visible mínimo, candidatas reales a revisión de indexabilidad.
- **Solución propuesta:** son las verdaderas candidatas a `noindex, follow` conservador (Fase 3 de `SEO_AUDIT_1.md`), no las 1.211 originales.

### P1-3. 2.096/2.185 imágenes de producto alojadas en dominio externo (`catalogospromocionales.com`)
- **Evidencia:** `data/products.json` — 2.092 imágenes en `catalogospromocionales.com` + 4 en `www.catalogospromocionales.com`. `netlify.toml` CSP ya declara excepción explícita `img-src ... https://catalogospromocionales.com https://*.catalogospromocionales.com https://cataprom.com https://*.cataprom.com`. `scripts/seed-from-ecuador.mjs` confirma que el catálogo se sembró desde un sitio de otro mercado.
- **Riesgo:** dependencia de disponibilidad de un dominio de terceros (posible competidor u origen del catálogo Ecuador) para todas las imágenes de producto; sin control de optimización (`astro:assets`), sin garantía de licencia; refuerza señal de contenido no original.
- **Solución propuesta:** no es un cambio masivo de datos (fuera de alcance ahora), pero documentar como riesgo prioritario para Fase 2 posterior: migrar imágenes a `public/` o a un storage propio, con URLs bajo `kspromocionales.co`.

### P1-4. Contenido residual de Ecuador en 944 productos (`seoKeywords`/`keywords`) ✅ Corregido
- **Evidencia original:** 944/2.185 productos con referencias a Quito, Guayaquil, Cuenca o Ambato en `seoKeywords`/`keywords` (p. ej. `"...merchandising quito, productos promocionales guayaquil..."`). Residuo directo de `seed-from-ecuador.mjs`.
- **Análisis previo a tocar datos:** se verificó campo por campo dónde aparecía cada término. `story`, `description`, `shortDescription`, `seoTitle` y `seoDescription` no tenían residuo real — los 3 hits que parecían Ecuador en esos campos eran la palabra española "manta" (cobija) en productos reales de cobijas/mantas de viaje, no la ciudad ecuatoriana. Por eso el alcance se limitó estrictamente a `seoKeywords`/`keywords`, donde sí se confirmó residuo genuino en 944 productos (936 en `seoKeywords`, 11 en `keywords`; algunos productos en ambos).
- **Implementado:** `scripts/clean-ecuador-residue.mjs` — modo dry-run por defecto, `--apply` para escribir. Elimina el **segmento de keyword completo** que contiene el término ecuatoriano (p. ej. `"merchandising quito"` completo, no solo la palabra `"quito"`), nunca dejando fragmentos huérfanos ni vaciando el campo (0 casos de "quedaría vacío" en los 944). Se ejecutó primero el dry-run, se revisaron ejemplos antes/después incluyendo los casos ambiguos de cuenca/ambato/manta, y se aplicó tras confirmación explícita.
- **Resultado verificado:** `git diff --stat data/products.json` → 947 líneas cambiadas (936 `seoKeywords` + 11 `keywords`), ninguna otra línea ni campo tocado. `npm run seo:audit` → 0 residuos Ecuador. `npm run build` → 0 errors, 2.248 páginas.

### P1-5. Páginas de ciudad son plantillas casi idénticas (patrón doorway)
- **Evidencia:** `src/data/geo-data.ts` — las 7 entradas comparten estructura y redacción idéntica, solo cambia el nombre de ciudad (`"Productos Promocionales en {Ciudad} con Tu Logo"`, mismo patrón de `intro`/`seoTitle`/`seoDescription`/`caracteristicas`). `src/pages/productos-promocionales-colombia/[ciudad].astro` renderiza la misma estructura de secciones para todas.
- **Riesgo:** exactamente el patrón doorway que el propio brief pide evitar; canibalización entre ciudades y con `/productos-promocionales-colombia/`.
- **Solución propuesta:** ver Fase 2-E: reposicionar como páginas de cobertura/envío (no "sede"), diferenciar contenido real donde haya datos (categorías más pedidas por zona, logística), documentar cuáles no pueden diferenciarse aún.

### P1-6. Categorías sin paginación (hasta 290 productos en una sola página) ✅ Corregido
- **Evidencia original:** `src/pages/categorias/[slug].astro` renderiza `categoryProducts` completo sin límite. Distribución real: `novedades` 290, `escritura` 184, `maletines` 142, `tecnologia` 137, `tomatodos-botilitos` 115, `ecologia` 110, `precio-bomba` 110 (y varias más entre 60-110).
- **Implementado (Fase 8 de `SEO_AUDIT_1.md`):** paginación estática con `CATEGORY_PAGE_SIZE = 60` (`src/lib/pagination.ts`). Rutas: `/categorias/{slug}/` = página 1, `/categorias/{slug}/pagina/{N}/` = páginas siguientes (`src/pages/categorias/[slug]/index.astro` y `.../pagina/[page].astro`), con markup compartido en `src/components/CategoryListing.astro` para no duplicar la plantilla.
  - Canonical autorreferente por página (no se canonicaliza a la página 1) — hereda el default de `BaseLayout` (`Astro.url.pathname`).
  - Título natural por página: `"{título} — Página N"`.
  - Enlaces `<a>` HTML reales de anterior/siguiente/números de página, sin JS.
  - Contenido editorial (`category.editorial`) solo en la página 1.
  - Sin `noindex` en páginas siguientes (confirmado: 0 meta robots en `/pagina/3/`).
  - 11 categorías superan el umbral de 60 y generan 18 páginas adicionales en total (2.248 → 2.266 páginas). Las 18 están en el sitemap.
- **Resultado verificado:** build limpio (0 errors, 0 warnings, 0 hints); `novedades` página 1 muestra 60/290 con "Mostrando 1–60 de 290 referencias"; página 3 muestra "121–180 de 290" con canonical propio y sin la sección editorial duplicada.

### P1-7. Home sin `WebSite` JSON-LD ✅ Corregido
- **Evidencia:** `src/pages/index.astro` solo emitía `Organization`.
- **Implementado:** `src/lib/schema.ts` (`websiteSchema`) añadido a la home junto a `organizationSchema`. Sin `SearchAction` (el sitio no tiene búsqueda interna real).

### P1-8. `hreflang` no funcional ✅ Corregido (eliminado)
- **Evidencia:** `src/layouts/BaseLayout.astro:57` — un único `<link rel="alternate" hreflang="es-CO">` que apuntaba a la misma URL canónica, sin par de retorno ni alternates reales.
- **Implementado:** se eliminó el tag por completo (sitio monolingüe/mono-región, no aporta nada sin alternates reales). `<html lang="es-CO">` se conserva. Confirmado: `grep -rl hreflang dist/` → 0 archivos.

---

## P2 — Mejora relevante

### P2-1. Metadatos fuera de rango
- 63 productos con `seoTitle` > 65 caracteres (riesgo de truncado en SERP).
- 9 productos con `seoDescription` > 165 caracteres.
- 16 `seoTitle` duplicados entre productos distintos.
- **Solución:** utilidad centralizada de validación/construcción de metadata (Fase 2-A) que trunque de forma natural (por palabra, no por carácter) y detecte duplicados en build/CI.

### P2-2. `BaseLayout` incompleto vs. lo pedido en el brief ✅ Corregido
- **Evidencia original:** `og:type` fijo en `"website"`; sin `twitter:title`/`description`/`image` explícitos; sin `robots` configurable (solo `noindex` binario); default `ogImage="/og-default.jpg"` apuntando a un archivo inexistente (404 real en cada página sin imagen propia).
- **Implementado (`src/layouts/BaseLayout.astro`):**
  - `ogType?: 'website' | 'article'` configurable; páginas de blog usan `article` + `article:published_time`/`modified_time`/`author`.
  - `robots?: string` reemplaza el antiguo `noindex` booleano (sin usos restantes del prop viejo en el repo, se eliminó en vez de mantenerlo como shim muerto). `404.astro` migrado a `robots="noindex, follow"`.
  - `twitter:title`, `twitter:description`, `twitter:image` explícitos.
  - Default `ogImage` cambiado de `/og-default.jpg` (inexistente) a `/logo.png` (real, 1536×1024). Además, cada tipo de página ahora pasa una imagen real y específica: producto → imagen del producto (con el mismo fallback a placeholder de P0-3), categoría → imagen de la categoría, blog → imagen del post. **Pendiente:** `/logo.png` sigue sin ser un diseño de OG dedicado (1200×630, <300KB) — es un fallback real y no roto, pero no óptimo; queda como tarea de diseño, no se fabricó ningún asset nuevo.
  - `og:image:width/height` deliberadamente NO añadidos: las imágenes varían por página (externas, tamaños desconocidos) y declarar dimensiones incorrectas sería peor que omitirlas. Pendiente si se decide procesar imágenes con `astro:image`/`sharp`.
- **No implementado:** `canonical sin parámetros irrelevantes` no requirió cambios — `Astro.url.pathname` ya excluye query params.

### P2-3. Mecanismo de indexability score y script `seo:audit` ✅ Script de auditoría implementado (aplicación de `noindex` pendiente)
- **Evidencia original:** `package.json` no tenía script `seo:audit`; no hay `noindex` condicional en ninguna página de producto.
- **Implementado:** `scripts/seo-audit.mjs` (solo lectura, no modifica datos) + `npm run seo:audit`. Valida los 2.185 productos: slugs duplicados, categorías huérfanas/vacías, contenido genérico vs. vacío vs. realmente delgado, imágenes externas/rotas, residuo geográfico de Ecuador, metadatos fuera de rango/duplicados, y una heurística conservadora de indexabilidad. Genera reporte JSON en `reports/` (ignorado por Git).
- **Pendiente:** la aplicación real de `noindex, follow` en páginas y su exclusión del sitemap requiere el helper tipado `src/lib/product-indexability.ts` (Fase 3 de `SEO_AUDIT_1.md`) y aprobación explícita antes de aplicarse — el script actual solo reporta.

### P2-4. Formulario de contacto incompleto respecto al briefing corporativo pedido
- **Evidencia:** `src/pages/contacto.astro` usa Netlify Forms (`data-netlify="true"`, real, no ficticio) con campos: nombre, empresa, correo, ciudad, mensaje.
- **Falta:** teléfono (opcional), producto/categoría, cantidad aproximada, fecha estimada, checkbox de consentimiento de privacidad (ya existe `/politica-de-privacidad/` para enlazar).
- **Solución:** ampliar el formulario existente (aditivo, no reemplaza WhatsApp) en Fase 3.

### P2-5. Sitemap sin filtrado
- **Evidencia:** `astro.config.mjs` usa `sitemap()` sin opciones. Una vez exista `noindex` en productos débiles, por defecto seguirían apareciendo en el sitemap salvo que se configure `filter`.
- **Solución:** usar la opción `filter` de `@astrojs/sitemap` (o lista de exclusión) alineada 1:1 con el criterio de indexability score.

---

## P3 — Oportunidad posterior

### P3-1. `astro check` generaba 55 "hints" por scripts JSON-LD sin `is:inline` ✅ Corregido
- **Evidencia:** `astro check` → `Result (42 files): 0 errors, 0 warnings, 55 hints`.
- **Implementado:** `is:inline` añadido a los dos únicos `<script type="application/ld+json">` del repo (`BaseLayout.astro`, `FaqSection.astro`); el resto de páginas usa la prop `jsonLd` de `BaseLayout`, que ya emite el script correcto. También se eliminó el prop `noindex` deprecado de `BaseLayout` (sin usos restantes) en vez de dejarlo como shim muerto.
- **Resultado:** `astro check` → `Result (44 files): 0 errors, 0 warnings, 0 hints`.

### P3-2. `tsconfig.json` no excluía `dist/` ✅ Corregido
- Podía provocar que herramientas de chequeo procesaran el bundle vendorizado (GSAP/Three.js minificado) en lugar de solo código fuente.
- **Implementado:** `"exclude": ["dist"]` añadido a `tsconfig.json`.

### P3-3. Medición (GA4/GTM/GSC) no implementada
- No se encontró carga condicional de Google Analytics/Tag Manager ni meta de verificación de Search Console en `BaseLayout.astro`. Pendiente de variables de entorno (Fase 2-I) — no se debe inventar ID.

### P3-4. `netlify.toml` — redirect catch-all a 404
- **Evidencia:** `netlify.toml:23-26` — `from = "/*" → to = "/404.html", status = 404` sin `force = true`.
- **Nota:** en Netlify, archivos estáticos existentes tienen precedencia sobre reglas de redirect (a menos que `force = true`), así que esto normalmente solo afecta a URLs verdaderamente inexistentes (comportamiento esperado: servir 404.html con status 404 real). Se documenta como verificación pendiente en Netlify (no se puede confirmar 100% sin deploy), no se toca en esta fase.

### P3-5. Rendimiento de Hero 3D / GSAP / Three.js
- No se realizó auditoría de Core Web Vitals con herramientas externas (Lighthouse/PageSpeed) en esta pasada — requiere el sitio desplegado. Se deja como pendiente explícito para Fase 2-H, sin datos inventados.

### P3-6. Enlaces internos rotos / páginas huérfanas
- No se ejecutó un crawl completo del HTML compilado en esta pasada (2.248 páginas). Recomendado automatizar con un script simple sobre `dist/` antes de Fase 2, o delegarlo a la validación final (paso 7 de VALIDACIÓN FINAL en el brief).

---

## Resumen cuantitativo

| Métrica | Valor |
|---|---|
| Productos totales | 2.185 |
| Categorías | 37 |
| Posts de blog | 8 |
| Ciudades | 7 (todas usaban `LocalBusiness` sin dirección verificable — corregido a `Service`) |
| Páginas generadas (`dist/`) | 2.248 |
| Productos con campo `description` vacío | 1.211 (55%) — pero 2.093/2.185 (96%) tienen contenido visible real vía shortDescription/features/story |
| Productos con contenido realmente delgado (nada en ningún campo) | 1 |
| Productos sin shortDescription/features/useCases (contenido visible débil) | 92 |
| Imágenes de producto en dominio externo | 2.096 (96%) |
| Imágenes de producto rotas (ruta local inexistente) | 89 → 0 (corregido, P0-3) |
| Productos con residuo Ecuador (Quito/Guayaquil/Cuenca/...) | 946 (43%) |
| `seoTitle` > 65 caracteres | 63 |
| `seoDescription` > 165 caracteres | 9 |
| `seoTitle` duplicados | 16 |
| Categoría más grande | `novedades` (290 productos → paginada, 60/página, 5 páginas) |
| `astro check` | 0 errors / 0 warnings / 55 hints |

*Cifras de contenido y Ecuador recalculadas con `npm run seo:audit` (Fase 1 de `SEO_AUDIT_1.md`); reemplazan los estimados iniciales de esta auditoría.*

---

## Siguiente paso

Los 3 hallazgos P0 quedaron implementados y verificados (build limpio, HTML compilado inspeccionado). Archivos tocados en esa pasada:

- `src/lib/product-image.ts` (nuevo)
- `src/components/ProductCard.astro`
- `src/pages/productos/[slug].astro`
- `src/pages/productos-promocionales-colombia/[ciudad].astro`

### Estado de `SEO_AUDIT_1.md` (segunda pasada, contexto de negocio real con dirección de Girón/Bucaramanga para GBP)

- **Fase 0 (revalidación):** completa. `git status` limpio salvo archivos nuevos sin trackear; build limpio (0 errors, 2.248 páginas); las 3 correcciones P0 confirmadas activas en el HTML compilado.
- **Fase 1 (script de auditoría automatizada):** completa. `scripts/seo-audit.mjs` + `npm run seo:audit`, solo lectura, genera reporte en consola y JSON en `reports/` (gitignored). Corrigió la cifra headline "1.211 productos sin descripción" — en realidad el 96% de esos productos sí tiene contenido visible real; el contenido genuinamente delgado es 1 producto, y las candidatas reales a revisión de indexabilidad son las 92 de P1-2.
- **Fase 2 (limpieza residuo Ecuador):** completa. Dry-run revisado y aprobado, `scripts/clean-ecuador-residue.mjs --apply` ejecutado sobre 944 productos (947 segmentos de keyword eliminados, 0 campos vaciados). Verificado con `seo:audit` (0 residuo) y build limpio.
- **Fase 4 (metadata/BaseLayout):** completa. `og:type` configurable (`article` en blog con `article:*` meta), `robots` configurable (reemplaza el `noindex` deprecado, eliminado por no tener usos), Twitter Card completo, `og-default.jpg` roto corregido (ahora `/logo.png`, real, más imagen específica por tipo de página: producto/categoría/blog), `hreflang` aislado eliminado. `og:image:width/height` deliberadamente no añadidos (dimensiones variables/desconocidas por imagen).
- **Fase 5 (datos estructurados):** completa. Nuevo `src/lib/schema.ts` con helpers tipados (`organizationSchema`, `websiteSchema`, `collectionPageSchema`, `productSchema`, `serviceSchema`, `blogPostingSchema`, `breadcrumbListSchema`, `faqPageSchema`) usados en las 13 páginas que emiten JSON-LD. `WebSite` añadido a home. `Product.brand` eliminado (KS Promocionales personaliza sobre catálogo de terceros, no es el fabricante verificable de cada artículo — declarar brand por defecto no era exacto). `Product.sku` usa `referencia_proveedor` solo cuando existe (89/2.185 productos). `is:inline` en los 2 `<script type="application/ld+json">` del repo → `astro check` pasó de 55 hints a **0 errors / 0 warnings / 0 hints**.
- **Fase 6 (representación de Girón/Bucaramanga/Colombia):** completa. `SITE.operatingBase` ('Girón, Santander') y `SITE.metroAreaLabel` ('área metropolitana de Bucaramanga') añadidos en `src/lib/site.ts` — **sin calle exacta**, solo ciudad/departamento, tal como se indicó ("no añadas la calle exacta sin aprobación explícita"). No se publicó ni se referenció la dirección de verificación (Calle 22 #15-71) en ningún archivo. Cambios visibles:
  - `Footer.astro`: reemplazada la frase "posicionados para Bucaramanga y las principales ciudades de Colombia" (redactada para buscadores) por la propuesta comercial natural del propio brief; la línea de ubicación pasó de "Bucaramanga, Colombia" a "Girón, Santander — operación online"; el grupo "Ciudades" se renombró a "Envíos por Ciudad".
  - `nosotros.astro` y `contacto.astro`: añadida de forma visible la operación online, la base en Girón, la ausencia de local de atención al público y el canal de cotización (WhatsApp + formulario).
  - `index.astro` (home): title/description reordenados para que la intención nacional lidere ("Productos Promocionales en Colombia...") con Girón/Bucaramanga como origen operativo en la descripción, no como eje principal.
  - `BenefitsBar.astro` / `productos-promocionales-colombia/index.astro`: el texto de despacho pasó de "Despachamos desde Bucaramanga" a "Despachamos desde Girón, Santander (área metropolitana de Bucaramanga)" para mayor precisión.
- **Fase 7 (páginas geográficas):** completa dentro de lo que el código permite sin datos nuevos. `geo-data.ts` (solo la entrada de Bucaramanga) ahora explica la base operativa en Girón y declara explícitamente que no hay atención al público, sin tocar el resto de ciudades (evita el patrón doorway de reescribir las 7 con la misma plantilla). `[ciudad].astro` añade una nota de transparencia visible en las 7 páginas, con dos variantes de texto (no una por ciudad): Bucaramanga explica la base en Girón; las otras 6 declaran explícitamente "no tenemos oficina ni equipo en {ciudad}". El bloque "Otras Ciudades" se renombró a "Envíos a Otras Ciudades de Colombia". `LocalBusiness` confirmado en 0 páginas (`grep -l LocalBusiness dist/productos-promocionales-colombia/*/index.html` → vacío).
  - **No implementado:** la evaluación formal de demanda/valor único por ciudad (4 preguntas del brief: demanda real, contenido único, consultas reales, aporte vs. página nacional) requiere datos de Search Console/clientes que no existen aún en el repo — no se puede completar sin inventar cifras. Ninguna ciudad se consolidó ni se marcó `noindex` en esta pasada.
- **Fase 8 (categorías y paginación):** completa. Ver P1-6.
- **Fases 3, 9–14:** no implementadas todavía. Requieren decisión explícita antes de continuar, en particular:
  - **Fase 3** (indexabilidad + `noindex`) tiene una instrucción explícita de "DETENTE después del reporte. No apliques noindex masivo automáticamente."
  - **Fase 13** (checklist de Google Business Profile) es solo documentación, sin riesgo, se puede hacer en cualquier momento.
- P2/P3: ver secciones correspondientes.
