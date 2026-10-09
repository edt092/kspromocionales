# Cambios implementados (rama `seo/implementacion-plan-maestro-2026-10`, sin commit)

Cada bloque indica la evidencia, los archivos, el comportamiento antes y después, la prueba y el riesgo.

## T00 — Baseline y evidencia
- **Archivos nuevos:**
  - `scripts/seo-improvement/evidence-baseline.mjs`
  - `scripts/seo-improvement/lib/csv.mjs`
  - `docs/seo-improvement/INVENTARIO_FUENTES.{md,json}`
  - `BASELINE_GSC.json`
  - `baseline/` (logs, sitemap, rutas y lista de productos previos)
- **Prueba:** reproduce todas las cifras GSC del plan; el hash de 22 archivos coincide con el baseline.

## T01 — Corrupción editorial
- **Evidencia:** 417 "Bogotá, Bogotá", 348 listas de ciudades rotas, 92 preposiciones huérfanas, 15 destinos vacíos, 9 conjunciones duplicadas, 16 gentilicios ecuatorianos, 108 `[más]`, 17 "Medellíndad" y 3 metaTitles cortados.
- **Archivos:**
  - `scripts/seo-improvement/lib/text-repair.mjs` (reglas con límites Unicode)
  - `repair-catalog-text.mjs` (dry-run por defecto, escritura atómica, idempotente)
  - Datos: `data/products.json` (792 registros), `data/blog/content/seed.js`, `data/blog/posts.json`
- **Antes:** "en aeropuertos de Bucaramanga, Bogotá, Bogotá o." **Después:** "en aeropuertos de Bucaramanga o Bogotá." No se inventa ninguna ciudad. Un destino vacío pasa a "cualquier ciudad del país", porque el negocio despacha a todo Colombia.
- **Prueba:**
  - 10 tests de `text-repair.test.mjs`, que incluyen las palabras protegidas (Calidad, Calientito, manta, cuenca).
  - Detectores en 0.
  - La 2.ª ejecución produce 0 cambios.
  - `manifiestos/T01-reparacion-texto.json` guarda el antes y después por campo.
- **Prevención:**
  - `seed-from-ecuador.mjs` reemplaza ahora por palabra completa.
  - `pnpm build` ejecuta `seo-audit.mjs --strict`, que falla si reaparece el patrón.
- **Fechas:** `dateModified` = 2026-10-09 en los 6 posts cuyo cuerpo visible cambió.

## T02 — Exactitud factual
- **Archivos:**
  - `data/catalog-corrections.json` (motivo, fuente, fecha y estado por corrección)
  - `scripts/seo-improvement/apply-catalog-corrections.mjs` (reaplicable después de una reimportación)
- **Aldrich Sólido (10663) y Metalizado (10664):** pasan de "metal sólido / reciclado / cuerpo metálico genuino" a "plástico (metalizado), mecanismo twist, 14,5 cm". La fuente es la imagen de la ficha más la ficha del proveedor. La técnica de marcación y el MOQ **no** se publican (pendiente N5).
- **Abanicos 2697 y 9439:** salen de Tecnología y pasan a Variedades (9439 también a Producción Nacional). Se eliminan "gadget digital" y "plásticos reciclados".
- **14 seoTitles duplicados** entre productos distintos se reemplazan por títulos derivados del nombre visible.
- **Ficha:** nuevo bloque "Ficha del producto" que solo se muestra si hay `facts` verificados.

## T03/T04 — Identidad y redirects
- **Archivos:**
  - `scripts/seo-improvement/lib/identity.mjs`, `identity-candidates.mjs`, `consolidate-identities.mjs`
  - Datos: `data/product-aliases.json`
  - `MAPA_IDENTIDADES_Y_ALIASES.json`, `MAPA_REDIRECTS.json`
  - `src/lib/catalog.ts` (multicategoría)
  - `astro.config.mjs` (genera `dist/_redirects`)
- **Antes:** 95 pares de URLs para la misma identidad de proveedor. **Después:**
  - 88 consolidados con 301: 64 de nivel A y 24 de nivel B.
  - 6 variantes de capacidad conservadas.
  - 52 productos con `secondaryCategoryIds`.
  - `supplier`/`sourceProductId` en 2.000 productos.
- **Consumidores migrados a `productsInCategory` / `categoryProductCount`:** categoría, paginación, directorio de categorías y rejilla de la home.
- **Conteos:** `productCount` recalculado (`sync-category-counts.mjs`).
- **Prueba:**
  - `policy.test.mjs`: destinos existentes, sin cadenas, alias no generado y URLs con clics intactas.
  - `seo-audit-urls.mjs`: 8 controles nuevos en 0 y prueba negativa superada.
- **Riesgo:** el nivel B se basa en la misma imagen del proveedor. Si alguna fusión resultara ser un producto distinto, se revierte quitando la entrada de `product-aliases.json` y restaurando el registro desde `baseline/products-before.json` o Git.

## T06 — Política de indexabilidad única
- **Archivos:**
  - `src/lib/product-indexability.mjs` (implementación)
  - `.ts` (fachada tipada)
  - Usada por `astro.config.mjs`, `scripts/seo-audit.mjs` y la ficha
- **Antes:** decidía con `description` (que no se renderiza) y estaba duplicada en el auditor. **Después:** decide solo con el contenido visible y tiene un estado `enriquecer` informativo (444) que nunca aplica noindex.
- **Resultado:** 3 noindex (antes 1); ninguno con señal en GSC.
- **Prueba:** 7 tests que cubren description vacía, story sin features, relleno, placeholder, facts, contenido vacío y URLs con clics.

## T07 — Imágenes y rendimiento
- **`src/lib/product-image.ts`:**
  - Acepta rutas locales `/images/…` que existan en `public/` y rechaza traversal y esquemas extraños.
  - Sirve `cataprom.com` directo, sin el 301 de `catalogospromocionales.com`.
  - Se aplica a productos, categorías, el hero y el blog. HTML con el host antiguo: 0.
- **`BaseLayout`:** `preconnect` a `cataprom.com`.
- **Hero de la home:**
  - 12 imágenes eager en lugar de 28; la home completa pasa de 32 a 16 eager.
  - Solo productos con imagen servible.
- **T12 (preparado, no ejecutado):** `image-migration-manifest.mjs` genera `manifiestos/T12-imagenes.json` con 2.008 imágenes pendientes de autorización en 21 lotes y 89 placeholders.

## T08 — Ficha y móvil
- **Breadcrumb:** el visible y el JSON-LD salen de una sola lista (4 niveles, raíz con barra).
- **Espacio superior:** de `pt-28` a `pt-4`. El header ocupa espacio en el flujo por `.header-accent-line { position: relative }`.
- **Imagen:** más compacta en móvil.
- **CTA:** 48 px de alto, más una nota honesta de cotización (mínimos, técnica, colores y tiempos se confirman; envío desde Girón).
- **Botón flotante de WhatsApp:** se oculta mientras el CTA principal está visible.
- **Tarjetas:** botón "Cotizar" de 44 px como mínimo.
- **Medición** (`scripts/seo-improvement/mobile-qa.py`, 390×844):
  - H1 de y=763 a y=525.
  - CTA de y=1003 (bajo el pliegue) a y=665–691 (visible).
  - Sin solape del botón flotante.

## T10 — Relacionados y selección comercial
- **Relacionados:** `relatedProducts()` es determinista. Puntúa por categoría compartida y tipo de producto, excluye la misma identidad y las fichas noindex, y desempata con un hash por ficha. Sustituye "los primeros 4 de la categoría".
- **Selección explícita:** `src/data/merchandising.ts`, con criterio documentado, sustituye todos los `.slice()` por orden de importación (header, footer, ciudades, home y hubs).
- **Home:** "Los más pedidos / Bestsellers" pasa a "Del catálogo / Una muestra de productos para empresas", porque no hay datos de ventas.

## T11 — Entidad y schema
- **Grafo de entidad:**
  - Organization con `@id` (`#organization`): nombre "KS Promocionales", `alternateName` "KS Promocionales Colombia", sin `legalName` (no está verificado) y localidad Girón/Santander/CO **sin calle**.
  - WebSite con `@id`, `publisher` e `inLanguage`. Ambos se emiten en todas las páginas para que las referencias resuelvan.
  - Service, BlogPosting, CollectionPage, AboutPage y ContactPage referencian los `@id`. Service usa "Productos promocionales para empresas en {ciudad}".
- **Product sigue omitido.**
- **Redacción:** "Despachamos desde Bucaramanga" pasa a Girón / área metropolitana en la FAQ, /nosotros, /articulos-promocionales y `llms.txt`.
- **`llms.txt`:** se corrige "2.000 referencias por categoría" y se añaden datos de la empresa y guías.

## T14 — Hubs comerciales
- **H1 por intención:**
  - Artículos (volumen + "artículos publicitarios")
  - Regalos (clientes y empleados)
  - Merchandising (equipo)
- **Enlaces cruzados:** bloque `IntentCrossLinks` con anchors descriptivos en los 3 hubs.

## T16 — Sitemap
- `lastmod` solo para los 8 posts (fechas editoriales reales).
- Productos y categorías sin `lastmod`, porque no hay una fecha de cambio visible fiable.

## T17/T18/T19, T13, T15
No implementados por falta de insumos. Ver `PENDIENTES_NEGOCIO_Y_GSC.md`.

## Scripts de `package.json`
- `build`: `node scripts/seo-audit.mjs --strict && astro check && astro build`. Falla solo con errores reales de datos (texto corrupto, slugs o aliases rotos, metaTitle cortado), nunca por longitud editorial.
- `test:seo`: 25 tests con `node --test`, sin dependencias nuevas.
