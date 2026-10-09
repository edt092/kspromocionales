# Plan de ejecución — backlog único con estado (2026-10-09)

Fuente: `PLAN-MAESTRO-SEO-KS-PARA-CLAUDE.md` §6. Estados:
- ✅ hecho y verificado en local
- 🟡 parcial (detalle en la columna de evidencia)
- ⛔ bloqueado por un insumo externo
- ⏸ fuera de alcance de esta sesión

| Ticket | Pri | Estado | Evidencia / archivos | Criterio de aceptación | Pendiente |
|---|---|---|---|---|---|
| T00 Inventario, métricas, baseline | P0 | ✅ | `INVENTARIO_FUENTES.*`, `BASELINE_GSC.json`, `baseline/` | Fuentes procesadas, cifras reproducidas, Git preservado | — |
| T01 Reparación editorial | P0 | ✅ | `repair-catalog-text.mjs`, `manifiestos/T01-*` | 0 patrones corruptos, idempotente, slugs intactos | — |
| T02 Datos verificados (Aldrich, abanico) | P0 | 🟡 | `data/catalog-corrections.json` | Materiales y categorías corregidos con fuente | Técnica/MOQ de KS (N5); revisar afirmaciones de Ecología (N11) |
| T03 Identidad externa + aliases + multicategoría | P1 | ✅ | `consolidate-identities.mjs`, `MAPA_IDENTIDADES_Y_ALIASES.json`, `src/lib/catalog.ts` | Un registro por identidad confirmada; variantes conservadas; URLs protegidas intactas | 6 variantes (N6); 89 landings con referencia (N7, N8); portadas de catálogo (N9) |
| T04 URLs, redirects, sitemap, canonical | P1 | ✅ local | `astro.config.mjs` → `dist/_redirects`; `MAPA_REDIRECTS.json`; `seo-audit-urls.mjs` | Destinos 200, sin cadenas, aliases fuera del sitemap y sin enlaces | Validación en Netlify (checklist); dominio principal (externo) |
| T05 Diagnóstico GSC por cohorte | P1 | 🟡 | `DIAGNOSTICO_GSC_POR_COHORTE.md` | Cohortes y protocolo definidos | Exportaciones por URL (G1) |
| T06 Política de contenido visible + auditor completo | P1 | ✅ | `src/lib/product-indexability.mjs`, `scripts/seo-audit.mjs` | Política única; sin retiro masivo; listas completas | Enriquecer las 444 fichas "enriquecer" (editorial) |
| T07 Helper de imágenes y carga prioritaria | P1 | ✅ | `src/lib/product-image.ts`, `Hero3D`, `BaseLayout` | Rutas locales aceptadas; LCP no lazy; home 32→16 eager | — |
| T08 Datos de compra y ficha móvil | P1 | 🟡 | Ficha, `WhatsAppFloat`, `ProductCard`, `mobile-qa.py` | CTA visible a 390×844; facts solo verificados | MOQ y tiempos reales (N1, N2); targets <44 px globales |
| T09 Taxonomía bolígrafos/llaveros/antiestrés/EcoNature | P1 | 🟡 | Navegación y hubs priorizan estas categorías (`src/data/merchandising.ts`) | Rutas preservadas | H1 de "Artículos de Escritura" vs slug `boligrafos-publicitarios`: falta decidir colección (requiere surtido confirmado) |
| T10 Relacionados y navegación | P2 | ✅ | `relatedProducts()`, `curatedProducts()`, `merchandising.ts` | Deterministas, sin aliases ni autorrelaciones, sin "bestseller" falso | — |
| T11 Entidad, breadcrumbs, About/Contact, blog | P2 | 🟡 | `src/lib/schema.ts`, `BaseLayout`, `nosotros`, `contacto`, `llms.txt` | Grafo `@id` resuelto en cada página; Product omitido | `sameAs`, `legalName`, autoría verificable (N13) |
| T12 Imágenes propias por lotes | P2 | ⛔ | `image-migration-manifest.mjs` → `manifiestos/T12-imagenes.json` | Manifiesto de 21 lotes listo | Autorización del proveedor (N10) |
| T13 Ciudades | P2 | ⛔ | Solo se renombró Service a "Productos promocionales para empresas en {ciudad}" | — | Logística real (N12) |
| T14 Diferenciar regalos/artículos/merchandising | P2 | ✅ | H1 por intención, `IntentCrossLinks`, selección por hub | Ownership documentado en `merchandising.ts` | Contenido ampliado con datos (N1–N3) |
| T15 Fin de año, onboarding, clientes, bulk | P2 | ⛔ | — | No publicar contenido hueco | Brief de ventas (N15) |
| T16 Sitemap lastmod | P2 | ✅ | `astro.config.mjs` (`serialize`) | Solo fechas reales (8 posts) | Segmentación por tipo: opcional; `@astrojs/sitemap` 3.2.1 no la soporta sin endpoint propio |
| T17 Medición de cotizaciones | P2 | ⛔ | — | CSP solo con el endpoint elegido | Herramienta de analítica (N14) |
| T18 Filtros y técnicas | P3 | ⏸ | — | Requiere identidad y atributos normalizados primero | N3 |
| T19 GBP, reseñas, backlinks | P3 | ⏸ | `GOOGLE_BUSINESS_PROFILE_CHECKLIST.md` (existente) | Operación manual del propietario | — |
