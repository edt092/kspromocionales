# Reconciliación de evidencia (2026-10-09)

Las auditorías (Claude, Codex) y el plan maestro son evidencia a contrastar, no instrucciones infalibles.
Cada fila indica la fuente, lo que se verificó, la decisión y la prueba.

## Baseline del repositorio

| Afirmación | Verificación | Resultado |
|---|---|---|
| El repo coincide con el estado inspeccionado por el plan | SHA-256 de los 22 archivos de `evidencia-repositorio.json` | **22/22 idénticos**. Rama de trabajo `seo/implementacion-plan-maestro-2026-10`. |
| `pnpm build` funciona | Ejecutado antes de cualquier cambio | Exit 0; `astro check` 0 errores; 2.267 páginas en 211 s (`baseline/build.log`) |
| `seo:audit` / `seo:audit:urls` | Ejecutados | Exit 0 y "Sin hallazgos estructurales" (`baseline/*.log`) |
| Sitemap: 2.264 URLs | `dist/sitemap-0.xml` vs `url-inventory.txt` de Codex | Listas idénticas |
| 56 rutas `/categorias/` | Conteo | 37 categorías + directorio + 18 paginaciones = 56. El "19 extra" de la auditoría Claude estaba mal. |
| 8 posts | `data/blog/posts.json` | 8. La auditoría Claude decía 9: incluía `/blog/`. |

## GSC

| Afirmación | Verificación | Decisión |
|---|---|---|
| 8 clics / 314 impresiones / CTR 2,55 % (13/07–06/10/2026) | `BASELINE_GSC.json` (recalculado) | Reproducido. Posición ponderada por impresiones ≈ 40,15 (sobre valores redondeados). |
| Páginas 8 / 362 | Recalculado | Agregación distinta; no se suma al total de propiedad |
| 1.792 indexadas / 1.824 sin indexar / 3.616 conocidas al 03/10 | Recalculado | Reproducido. El ámbito es "Todas las páginas conocidas". No se calcula cobertura del sitemap. |
| Motivos suman 1.824; descubiertas + canonical distinta = 91,23 % | Recalculado | Reproducido |
| 11 días sin recuentos de indexación | Recalculado | Se tratan como "sin dato", nunca como 0 |
| Las consultas son de Colombia | Carpeta Colombia vacía | Falso: consultas y páginas son de **todos los países** |
| 12 paths en ambos hosts | Recalculado | Reproducido. Son datos históricos; el host canónico actual (www) se mantiene. |

## Auditoría Claude (agentes) — correcciones

| Afirmación | Verificación | Decisión |
|---|---|---|
| "Emojis rotos (�)" en el post de bolígrafos | HTML compilado: 0 U+FFFD. El post tiene 🏆/⭐ reales; el "�" era un artefacto de la terminal de Windows. | **Descartado**. Lo real era `Medellíndad` (17 ocurrencias en 6 posts, no en 1). |
| Origen de `Medellíndad` | Repo fuente de Ecuador (`../KSPROMOCIONALES/ksp-ecommerce-engine`, solo lectura): 27 "Cuencadad" | Corrupción heredada ("Calidad" → Cali→Cuenca en origen → Cuenca→Medellín en `seed-from-ecuador.mjs`, que reemplazaba por substring). El seed ahora reemplaza por palabra completa. |
| 417 "Bogotá, Bogotá" | Repo fuente: 0 "Guayaquil, Guayaquil" | No viene del seed. Lo introdujo el ETL externo (`promo-content-pipeline`, no disponible en este repo) al reescribir stories. Patrón real: listas de ciudades a las que falta el último elemento. |
| "Crear `/termos-personalizados/`" | Ya existe `/categorias/termos-personalizados/` | No se crea una página competidora; se incluye en navegación y hubs |
| "Noindex 400–500 productos" | Estimación por longitud, no lista causal | **Rechazado**. Política explícita por contenido visible (T06): 3 noindex, 444 "enriquecer" informativos. |
| "Sin webfonts" | `BaseLayout` importa `@fontsource/syne` y `nunito-sans` | Corregido. Las fuentes son locales (sin terceros), pero sí hay webfonts. |
| LCP 3–4,5 s, puntaje 62 | Estimaciones de curl, no Lighthouse/CrUX | No se usan como baseline de campo. Medición pendiente (ver PENDIENTES). |
| Umbrales de 400/600 palabras | Arbitrarios | No son criterio de indexación |
| Backlinks = 0 | Timeout de Common Crawl | Desconocido, no cero |

## Auditoría Codex — verificaciones

| Afirmación | Verificación | Decisión |
|---|---|---|
| 95 grupos / 190 URLs con identidad numérica compartida | CSV contrastado con los datos: 94 grupos por imagen de proveedor más el grupo "2026" (portadas de catálogos con imágenes distintas) | 88 fusionados con 301 (64 nivel A + 24 nivel B), 6 variantes de capacidad conservadas, "2026" no es duplicado |
| Aldrich Sólido: metal vs reciclado vs plástico | Imagen 10663 mostrada por la ficha + ficha ALDRICH-SO del proveedor ("Bolígrafo plástico. Mecanismo twist. 14,5 cm") | Corregido a plástico/twist/14,5 cm con procedencia. MOQ y técnica **no** se publican (son condiciones del proveedor, no de KS). |
| Breadcrumb JSON-LD sin "Categorías" y raíz sin barra | Código | Corregido: lista única para visible y JSON-LD; raíz con `/` |
| metaTitles de blog cortados a mitad de palabra | `posts.json` | 3 corregidos a mano. El auditor ahora detecta el patrón. |
| "Añadir Product factual" | Plan maestro: mantener omitido | **Product sigue omitido**: sin ofertas ni reviews visibles, no es elegible para rich results y ya causó errores en GSC |
| FAQ rich results retirados (mayo 2026) | Documentación citada por Codex | FAQPage se mantiene solo por utilidad visible y para IA; no se proyecta CTR |

## Plan maestro — ajustes durante la ejecución

| Punto del plan | Hallazgo | Decisión |
|---|---|---|
| "La regla está en `seo-audit.mjs` y en el `.ts`" | Además, dos recuentos de `seo-audit.mjs` (`orphanCategoryProducts`, `missingSlugOrName`) usaban el tamaño del array de ejemplos (máx. 50). `seo-audit-urls.mjs` tenía el mismo defecto (máx. 30). | Política única en `src/lib/product-indexability.mjs`. Ambos auditores separan total real y ejemplos. |
| "Revisar 95 grupos" | Se detectaron además 2 abanicos de mano en Tecnología (2697 y 9439) y "Aldrich Metalizado" con "cuerpo metálico genuino" (el proveedor dice plástico) | Corregidos en `data/catalog-corrections.json` |
| Residuo Ecuador solo en keywords | 13 gentilicios ecuatorianos en useCases/story ("empresas quiteñas y guayaquileñas") | Reemplazados por "colombianas"; detector incluido |
| — | 89 "landings" con `referencia_proveedor` (VA-459…) y sin imagen local muestran placeholder; 2 parecen duplicar productos del catálogo | Documentado como pendiente: hace falta el mapeo referencia→ID de proveedor |
| — | 2 registros son portadas de catálogos del proveedor ("Catálogo Mundial/Novelties 2026") publicados como productos en Relojes | Pendiente de decisión del negocio |
