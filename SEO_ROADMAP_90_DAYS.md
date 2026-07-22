# SEO_ROADMAP_90_DAYS.md — KS Promocionales Colombia

Fase 14 de `SEO_AUDIT_1.md`. Dominio indexado por primera vez ~15 jul 2026 — este roadmap se
escribe el 21 jul 2026, es decir, **ya en el día ~7 de los 90**. Por eso cada bloque marca lo que
ya está hecho (con commit real) frente a lo que sigue pendiente, en vez de asumir que se empieza
desde cero. No se promete ninguna posición ni plazo exacto de resultados — solo se listan tareas
y KPIs a medir.

## Estado al día ~7 (resumen de lo ya ejecutado)

Todo lo siguiente ya está en `main`, verificado con build limpio (0 errors, 0 warnings, 0 hints):

- P0 corregidos: `Product.offers` inválido eliminado, `LocalBusiness` reemplazado por `Service` en las 7 ciudades, 89 imágenes rotas con fallback.
- `npm run seo:audit` (script de auditoría automatizada, solo lectura).
- Residuo geográfico de Ecuador eliminado de 944 productos (`seoKeywords`/`keywords`).
- Metadata completa en `BaseLayout` (OG/Twitter/robots configurables, OG image roto corregido), `WebSite` + `Organization` en home, helpers tipados de JSON-LD (`src/lib/schema.ts`).
- Representación honesta de Girón/Bucaramanga (footer, Nosotros, Contacto, páginas de ciudad) — sin dirección exacta pública.
- Paginación estática de las 11 categorías con más de 60 productos.
- Antipatrones de rendimiento corregidos (lazy-loading sobre el pliegue, dependencia `three` sin uso, `prefers-reduced-motion` global) — sin medición de Lighthouse todavía.
- Formulario de contacto ampliado (10 campos, consentimiento obligatorio) + página de confirmación real (`/gracias/`).
- `CONTENT_STRATEGY_CO.md`, `GOOGLE_BUSINESS_PROFILE_CHECKLIST.md`, `IMAGE_MIGRATION_STRATEGY.md` — documentos de estrategia.

**Pendiente y bloqueante para lo que sigue:**
- ~~Fase 3 (indexabilidad + `noindex`)~~ ✅ completa desde el 2026-07-22: aprobación recibida, `noindex, follow` aplicado a la única candidata real (1 de 2.185), excluida del sitemap junto con `/gracias/` (gap detectado de paso). Ver `SEO_AUDIT.md` P2-3.
- Fase 11 (Analytics/GA4/GTM/Search Console): requiere IDs reales del propietario — sin esto, la mayoría de los KPI de este roadmap no tienen forma de medirse.
- Migración de imágenes: bloqueada por confirmación de licencia (ver `IMAGE_MIGRATION_STRATEGY.md`).
- Resolución de la solicitud de Google Business Profile (en revisión).

---

## Días 1–14 (hoy = día ~7)

| Tarea | Estado |
|---|---|
| Limpiar señales de Ecuador | ✅ Hecho (944 productos) |
| Automatizar auditoría (`npm run seo:audit`) | ✅ Hecho |
| Corregir metadata y OG image | ✅ Hecho |
| Implementar Organization/WebSite | ✅ Hecho |
| Definir indexabilidad (criterio + reporte + aplicación) | ✅ Hecho — helper tipado, `noindex` aplicado (1 candidata), sitemap filtrado |
| Revisar sitemap | ✅ Hecho (paginación + exclusión de `noindex` con la misma regla que la página) |
| Medir formularios y WhatsApp | ⏳ Pendiente — depende de Fase 11 (eventos `click_whatsapp`, `form_submit`) |
| Corregir presentación de Girón/Bucaramanga | ✅ Hecho |
| No crear contenido masivo | ✅ Respetado — 0 artículos nuevos publicados, solo estrategia documentada |

**Lo que falta para cerrar el bloque de días 1–14 (próximos ~7 días):**
1. IDs reales de GA4/GTM/Search Console para implementar Fase 11.
2. Verificar sitemap enviado en Search Console una vez exista la propiedad.

---

## Días 15–30

- ~~Aplicar la estrategia de indexación~~ ✅ ya hecho en el día ~7 (adelantado respecto al plan original). Re-ejecutar `npm run seo:audit` periódicamente: si al enriquecer productos o cambiar contenido aparecen nuevas candidatas, requieren la misma aprobación explícita, no aplicación automática.
- ~~Paginar categorías~~ ✅ ya hecho en el día ~7 (adelantado respecto al plan original).
- Enriquecer las categorías comerciales principales (contenido editorial real, no relleno).
- Mejorar de 20 a 50 productos prioritarios con información real — priorizar los que `seo:audit` marca sin `shortDescription`/`features`/`useCases` (92 candidatos, ver `SEO_AUDIT.md` P1-2).
- Revisar Search Console (una vez verificada la propiedad): cobertura, errores de rastreo, primeras impresiones.
- Resolver estado de Google Business Profile (seguimiento del checklist, `GOOGLE_BUSINESS_PROFILE_CHECKLIST.md`).
- Mejorar enlazado interno donde `seo:audit`/una revisión manual detecte páginas con pocos enlaces entrantes.

---

## Días 31–60

- Migrar el primer lote de imágenes — **solo si ya existe confirmación de licencia** (`IMAGE_MIGRATION_STRATEGY.md`, sección 2). Sin eso, este ítem se mantiene bloqueado y se reevalúa.
- Publicar el primer clúster de contenido de `CONTENT_STRATEGY_CO.md` — priorizar los marcados P1 sin bloqueo (#1 "productos promocionales para empresas en Colombia", #3 "kits de bienvenida"), y solo tras validar demanda real (Search Console con datos de 30+ días, no antes).
- Crear páginas por necesidad empresarial **solo si existe demanda validada** — no por defecto.
- Conseguir casos, fotografías y evidencia propia (para Nosotros, GBP, y eventualmente reemplazar imágenes externas).
- Optimizar CTR con datos reales de Search Console (titles/descriptions con impresiones altas pero CTR bajo).

---

## Días 61–90

- Ampliar productos enriquecidos más allá del primer lote de 20-50.
- Consolidar canibalización — revisar especialmente los 2 casos ya identificados en `CONTENT_STRATEGY_CO.md` (regalos corporativos, llaveros por presupuesto) con datos reales de rendimiento.
- Revisar ciudades: con ~60-75 días de datos de Search Console, evaluar las 4 preguntas de Fase 7 (demanda real, contenido único, consultas reales, aporte vs. página nacional) por ciudad — decidir consolidar o mantener cada una con evidencia, no por defecto.
- Expandir contenidos que ya obtienen impresiones (no clústeres nuevos sin señal).
- Buscar enlaces y menciones relevantes de Colombia (directorios de industria, cámaras de comercio, prensa local si aplica) — sin comprar enlaces ni prácticas manipuladoras.
- Medir leads orgánicos y calidad comercial (no solo volumen de tráfico).

---

## KPI a trackear (sin prometer posiciones ni plazos)

Todos requieren Search Console + GA4 configurados (Fase 11) para tener datos reales; hasta entonces
son "por definir la línea base", no cifras actuales:

- URLs válidas indexadas (Search Console → Cobertura).
- URLs excluidas y su causa (`noindex`, duplicado, rastreada-no-indexada, etc.).
- Impresiones no-branded (excluyendo búsquedas de "KS Promocionales"/"kspromocionales").
- Consultas en top 100 / top 20 / top 10.
- CTR orgánico general y por plantilla (producto/categoría/ciudad/blog).
- Clics de WhatsApp orgánicos (evento `click_whatsapp` filtrado por canal orgánico, una vez exista Fase 11).
- Formularios orgánicos (evento `form_submit`, mismo filtro).
- Leads calificados (dato comercial, no solo analítico — requiere que el equipo comercial marque qué leads eran reales).
- Categorías con contenido editorial útil (no solo listado de productos) — línea base: contar cuántas de las 37 tienen `editorial` con contenido sustancial hoy.
- Productos enriquecidos (con `shortDescription`+`features`+`useCases`) — línea base hoy: 2.093/2.185 (96%, ver `seo:audit`); objetivo realista es cerrar los 92 restantes, no re-escribir los 2.093 que ya están bien.
- Enlaces internos por URL (sin herramienta automatizada todavía — pendiente de un crawler simple sobre `dist/`, ver `SEO_AUDIT.md` P3-6).
- Core Web Vitals (Lighthouse/PageSpeed contra el sitio desplegado — no medido todavía, ver `SEO_AUDIT.md` P3-5).
- Cobertura de imágenes propias vs. externas — línea base hoy: 89/2.185 (4%) propias, 2.096/2.185 (96%) externas (ver `IMAGE_MIGRATION_STRATEGY.md`).

## Notas finales

- No se interpreta la falta de tráfico en los primeros días como penalización — el dominio tiene
  ~1 semana indexado a la fecha de este roadmap.
- Ningún ítem de este roadmap se marca "hecho" sin un commit real verificable en `main`.
- Este documento debe revisarse y actualizarse a medida que avancen los bloques, no ejecutarse
  una sola vez y archivarse.
