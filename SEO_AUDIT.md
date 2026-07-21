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

### P1-1. 1.211 productos (55%) sin descripción diferencial real
- **Evidencia:** `description` es una plantilla genérica (`"{Nombre} personalizado con logo. Producto promocional para empresas en Colombia."`) en 1.211/2.185 productos. Coincide exactamente con el hallazgo preliminar del brief.
- **Riesgo:** contenido casi idéntico entre miles de páginas indexables → thin/duplicate content, canibalización, bajo valor como resultado independiente.
- **Solución propuesta:** no reescribir en masa. Usar el criterio de indexability score (ver Fase 2-C) para poner `noindex, follow` temporal a estas fichas hasta enriquecerlas; documentar conteo exacto antes de aplicar.

### P1-2. 92 productos sin shortDescription/features/useCases
- **Evidencia:** mismos 92 productos carecen simultáneamente de `shortDescription`, `features` y `useCases` (subconjunto de P1-1, contenido mínimo aún más débil).
- **Riesgo:** páginas de producto casi vacías de contenido único.
- **Solución propuesta:** primeras candidatas a `noindex, follow` conservador.

### P1-3. 2.096/2.185 imágenes de producto alojadas en dominio externo (`catalogospromocionales.com`)
- **Evidencia:** `data/products.json` — 2.092 imágenes en `catalogospromocionales.com` + 4 en `www.catalogospromocionales.com`. `netlify.toml` CSP ya declara excepción explícita `img-src ... https://catalogospromocionales.com https://*.catalogospromocionales.com https://cataprom.com https://*.cataprom.com`. `scripts/seed-from-ecuador.mjs` confirma que el catálogo se sembró desde un sitio de otro mercado.
- **Riesgo:** dependencia de disponibilidad de un dominio de terceros (posible competidor u origen del catálogo Ecuador) para todas las imágenes de producto; sin control de optimización (`astro:assets`), sin garantía de licencia; refuerza señal de contenido no original.
- **Solución propuesta:** no es un cambio masivo de datos (fuera de alcance ahora), pero documentar como riesgo prioritario para Fase 2 posterior: migrar imágenes a `public/` o a un storage propio, con URLs bajo `kspromocionales.co`.

### P1-4. Contenido residual de Ecuador en 944 productos (`seoKeywords`/`story`)
- **Evidencia:** 944/2.185 productos incluyen "quito", "guayaquil" en `seoKeywords` (p. ej. `"...merchandising quito, productos promocionales guayaquil..."`). Es residuo directo de `seed-from-ecuador.mjs`.
- **Riesgo:** señales geográficas contradictorias con el posicionamiento Colombia/Bucaramanga; se acerca a keyword stuffing con términos irrelevantes al mercado objetivo; puede diluir relevancia local.
- **Solución propuesta:** limpiar por script determinístico (no reescritura manual masiva) que elimine tokens de ciudades ecuatorianas de `seoKeywords`/`keywords`; no se toca el resto del contenido del producto. Requiere `data/products.json` — evaluar como excepción puntual y acotada a la regla "evitar cambios masivos en products.json", dado que es remoción de datos erróneos, no generación de contenido nuevo.

### P1-5. Páginas de ciudad son plantillas casi idénticas (patrón doorway)
- **Evidencia:** `src/data/geo-data.ts` — las 7 entradas comparten estructura y redacción idéntica, solo cambia el nombre de ciudad (`"Productos Promocionales en {Ciudad} con Tu Logo"`, mismo patrón de `intro`/`seoTitle`/`seoDescription`/`caracteristicas`). `src/pages/productos-promocionales-colombia/[ciudad].astro` renderiza la misma estructura de secciones para todas.
- **Riesgo:** exactamente el patrón doorway que el propio brief pide evitar; canibalización entre ciudades y con `/productos-promocionales-colombia/`.
- **Solución propuesta:** ver Fase 2-E: reposicionar como páginas de cobertura/envío (no "sede"), diferenciar contenido real donde haya datos (categorías más pedidas por zona, logística), documentar cuáles no pueden diferenciarse aún.

### P1-6. Categorías sin paginación (hasta 290 productos en una sola página)
- **Evidencia:** `src/pages/categorias/[slug].astro` renderiza `categoryProducts` completo sin límite. Distribución real: `novedades` 290, `escritura` 184, `maletines` 142, `tecnologia` 137, `tomatodos-botilitos` 115, `ecologia` 110, `precio-bomba` 110.
- **Riesgo:** HTML pesado, presupuesto de rastreo, potencial impacto en CWV (aunque `ProductCard` ya usa `loading="lazy"` fuera de los primeros 4 → mitiga LCP pero no el peso total del DOM).
- **Solución propuesta:** paginación SEO rastreable (URLs `?page=N` o `/pagina/N/`, canonical autorreferente, sin canonicalizar a la página 1) para categorías por encima de un umbral a definir (p. ej. >60 productos).

### P1-7. Home sin `WebSite` JSON-LD
- **Evidencia:** `src/pages/index.astro` solo emite `Organization`. El brief pide `WebSite` en home.
- **Solución propuesta:** añadir `WebSite` (name, url) vía helper JSON-LD reutilizable.

### P1-8. `hreflang` no funcional
- **Evidencia:** `src/layouts/BaseLayout.astro:57` — un único `<link rel="alternate" hreflang="es-CO">` que apunta a la misma URL canónica, sin par de retorno ni alternates reales.
- **Riesgo:** bajo (no penaliza), pero es una implementación que no cumple su propósito — Google puede ignorarla al no encontrar contrapartida. Como el sitio es monolingüe/mono-región, lo técnicamente correcto es **no emitir hreflang** (o emitir solo si en el futuro hay `es-EC`, etc.).
- **Solución propuesta:** decidir entre remover el tag (sitio de un solo mercado no lo necesita) o dejarlo documentado como no-op intencional. Bajo impacto, se resuelve en Fase 2-A.

---

## P2 — Mejora relevante

### P2-1. Metadatos fuera de rango
- 63 productos con `seoTitle` > 65 caracteres (riesgo de truncado en SERP).
- 9 productos con `seoDescription` > 165 caracteres.
- 16 `seoTitle` duplicados entre productos distintos.
- **Solución:** utilidad centralizada de validación/construcción de metadata (Fase 2-A) que trunque de forma natural (por palabra, no por carácter) y detecte duplicados en build/CI.

### P2-2. `BaseLayout` incompleto vs. lo pedido en el brief
- `og:type` fijo en `"website"` (no configurable; blog debería poder usar `article`).
- Falta `twitter:title`/`twitter:description`/`twitter:image` explícitos (hoy dependen del fallback de OG, inconsistente entre clientes).
- Falta `og:image:width`/`og:image:height`.
- No hay soporte para `robots` más allá de `noindex` binario (p. ej. `noindex, follow` ya está bien, pero no hay forma de pasar directivas custom).
- **Solución:** ampliar `Props` de `BaseLayout` (Fase 2-A), manteniendo compatibilidad con los usos actuales.

### P2-3. No existe mecanismo de indexability score ni script `seo:audit`
- **Evidencia:** `package.json` no tiene script `seo:audit`; no hay `noindex` condicional en ninguna página de producto.
- **Solución:** implementar en Fase 2-C, con reporte de conteo/ejemplos antes de aplicar `noindex` a cualquier URL.

### P2-4. Formulario de contacto incompleto respecto al briefing corporativo pedido
- **Evidencia:** `src/pages/contacto.astro` usa Netlify Forms (`data-netlify="true"`, real, no ficticio) con campos: nombre, empresa, correo, ciudad, mensaje.
- **Falta:** teléfono (opcional), producto/categoría, cantidad aproximada, fecha estimada, checkbox de consentimiento de privacidad (ya existe `/politica-de-privacidad/` para enlazar).
- **Solución:** ampliar el formulario existente (aditivo, no reemplaza WhatsApp) en Fase 3.

### P2-5. Sitemap sin filtrado
- **Evidencia:** `astro.config.mjs` usa `sitemap()` sin opciones. Una vez exista `noindex` en productos débiles, por defecto seguirían apareciendo en el sitemap salvo que se configure `filter`.
- **Solución:** usar la opción `filter` de `@astrojs/sitemap` (o lista de exclusión) alineada 1:1 con el criterio de indexability score.

---

## P3 — Oportunidad posterior

### P3-1. `astro check` genera 55 "hints" por scripts JSON-LD sin `is:inline`
- **Evidencia:** `astro check` → `Result (42 files): 0 errors, 0 warnings, 55 hints` — hints de tipo "Add the `is:inline` directive" en los `<script type="application/ld+json">` de `BaseLayout.astro`, páginas de categoría, producto, ciudad, FAQ, etc.
- **Riesgo:** ninguno funcional; ruido en CI.
- **Solución:** agregar `is:inline` a esos `<script>` (cambio mecánico, seguro, de una línea por ocurrencia).

### P3-2. `tsconfig.json` no excluye `dist/`
- Puede provocar que herramientas de chequeo procesen el bundle vendorizado (GSAP/Three.js minificado) en lugar de solo código fuente, generando ruido adicional en logs de build.
- **Solución:** agregar `"exclude": ["dist"]` a `tsconfig.json`.

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
| Productos sin descripción real | 1.211 (55%) |
| Productos sin shortDescription/features/useCases | 92 |
| Imágenes de producto en dominio externo | 2.096 (96%) |
| Imágenes de producto rotas (ruta local inexistente) | 89 |
| Productos con residuo "Quito/Guayaquil" en keywords | 944 (43%) |
| `seoTitle` > 65 caracteres | 63 |
| `seoDescription` > 165 caracteres | 9 |
| `seoTitle` duplicados | 16 |
| Categoría más grande sin paginar | `novedades` (290 productos) |
| `astro check` | 0 errors / 0 warnings / 55 hints |

---

## Siguiente paso

Los 3 hallazgos P0 quedaron implementados y verificados (build limpio, HTML compilado inspeccionado). Archivos tocados en esta pasada:

- `src/lib/product-image.ts` (nuevo)
- `src/components/ProductCard.astro`
- `src/pages/productos/[slug].astro`
- `src/pages/productos-promocionales-colombia/[ciudad].astro`

Pendiente (P1 y siguientes, no implementado aún, requiere decisión explícita):

- P1-1/P1-2: indexability score + `noindex` + script `npm run seo:audit`.
- P1-3: migración de imágenes fuera del dominio externo (fuera de alcance inmediato).
- P1-4: limpieza de residuo "Quito/Guayaquil" en `seoKeywords` de 944 productos — es el único cambio que tocaría `data/products.json`, se requiere confirmación explícita antes de tocar ese archivo.
- P1-5/P1-6: contenido diferenciador por ciudad y paginación de categorías grandes.
- P1-7/P1-8: `WebSite` JSON-LD en home y decisión sobre `hreflang`.
- P2/P3: ver secciones correspondientes.
