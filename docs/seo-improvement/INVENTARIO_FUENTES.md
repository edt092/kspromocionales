# Inventario de fuentes de evidencia

Generado por `node scripts/seo-improvement/evidence-baseline.mjs "<carpeta>"` el 2026-10-09.
El detalle completo (hash SHA-256, BOM, columnas, filas) está en `INVENTARIO_FUENTES.json`.

Carpeta: `C:\Users\Dagon\Desktop\MIS PROYECTOS PERSONALES\SITIOS_WEB\SEO-ANALISI-GENERAL\SEO-KSPROMOCIONALES.CO\ANALISI-09-10-2026`

## Resumen

- **30 archivos, 25 contenidos únicos, 5 grupos de copias byte a byte**.
- El plan contaba 23 archivos y 20 contenidos únicos; la diferencia son los **7 archivos de la carpeta `paln-de-acción-completo/`**, que incluyen 2 copias.
- Esos 7 archivos son el propio plan, el prompt y sus JSON de soporte, añadidos después de la inspección del plan.
- **Carpeta vacía:** `Rendimiento-resultados-de-busqueda-colombia/`. No se fabrican sus CSV; las consultas y páginas de GSC **no** están filtradas por país.
- Los CSV se procesaron con un parser RFC 4180 (`scripts/seo-improvement/lib/csv.mjs`) que maneja BOM UTF-8, comas, comillas y saltos de línea dentro de campos. Las copias exactas no se suman dos veces.
- Los CSV con 0 filas se registran como fuentes revisadas con cero registros: `Problemas no críticos.csv` y `Aparición en búsquedas.csv`.

## Archivos

| Archivo | Bytes | Filas/líneas | Cols | SHA-256 (12) | Copia de |
|---|---:|---:|---:|---|---|
| Paginas-no-index-gsc-problems/Gráfico.csv | 1.892 | 84 | 4 | 0cb1acf73344 | |
| Paginas-no-index-gsc-problems/Metadatos.csv | 52 | 1 | 2 | ff78a5ecbfca | |
| Paginas-no-index-gsc-problems/Problemas críticos.csv | 506 | 7 | 4 | 21eae4663ce7 | |
| Paginas-no-index-gsc-problems/Problemas no críticos.csv | 34 | 0 | 4 | 72473bc4aca8 | |
| Rendimiento-…-todos-los-paises/Aparición en búsquedas.csv | 56 | 0 | 5 | fc461129af3c | |
| Rendimiento-…-todos-los-paises/Consultas.csv | 3.250 | 79 | 5 | 0f7606b3621e | |
| Rendimiento-…-todos-los-paises/Dispositivos.csv | 114 | 3 | 5 | ac2bcd286388 | |
| Rendimiento-…-todos-los-paises/Filtros.csv | 59 | 2 | 2 | d88ac02ecc2e | |
| Rendimiento-…-todos-los-paises/Gráfico.csv | 1.814 | 86 | 5 | 150b097a15fc | |
| Rendimiento-…-todos-los-paises/Países.csv | 415 | 20 | 5 | 56d53849d606 | |
| Rendimiento-…-todos-los-paises/Páginas.csv | 14.454 | 179 | 5 | 05f0cd6dca52 | |
| auditoria-claude-seo-agents/AUDITORIA_SEO_COMPLETA_2026-10-09.md | 33.753 | 521 l. | | ab96beec8d63 | |
| auditoria-seo-competitiva-codex/SEO-architecture-competitive-audit.md | 44.261 | 445 l. | | 05a7de9764dc | = paquete |
| …/SEO-audit-evidence-package/SEO-architecture-competitive-audit.md | 44.261 | 445 l. | | 05a7de9764dc | = raíz codex |
| …/SEO-audit-evidence-package/architecture-link-edges.csv | 36.264.167 | 239.098 | 2 | 31c2365bc2f9 | |
| …/SEO-audit-evidence-package/benchmark-discovered-product-urls.txt | 201.549 | 2.265 | | 189b494cfa10 | |
| …/SEO-audit-evidence-package/benchmark-subcategory-map.csv | 24.127 | 196 | 4 | 5f5b0671fcbf | |
| …/SEO-audit-evidence-package/duplicate-catalog-identities.csv | 65.072 | 190 | 6 | 5ffa03d3cd0b | = raíz codex |
| …/SEO-audit-evidence-package/duplicate-product-titles.csv | 7.506 | 37 | 3 | 3fa70aaa60a4 | |
| …/SEO-audit-evidence-package/page-audit.csv | 1.967.576 | 4.659 | 11 | 884b9e4f59db | = raíz codex |
| …/SEO-audit-evidence-package/url-inventory.txt | 173.239 | 2.264 | | aefc00f85927 | |
| auditoria-seo-competitiva-codex/duplicate-catalog-identities.csv | 65.072 | 190 | 6 | 5ffa03d3cd0b | = paquete |
| auditoria-seo-competitiva-codex/page-audit.csv | 1.967.576 | 4.659 | 11 | 884b9e4f59db | = paquete |
| paln-de-acción-completo/PLAN-MAESTRO-SEO-KS-PARA-CLAUDE.md | 23.286 | 217 l. | | be71d4711b7f | = subcarpeta |
| paln-de-acción-completo/PROMPT-CLAUDE-CODE-SEO-KS.md | 39.627 | 394 l. | | bbd02726f62d | = subcarpeta |
| …/PLAN-Y-PROMPT-CLAUDE-KS/PLAN-MAESTRO-SEO-KS-PARA-CLAUDE.md | 23.286 | 217 l. | | be71d4711b7f | = raíz plan |
| …/PLAN-Y-PROMPT-CLAUDE-KS/PROMPT-CLAUDE-CODE-SEO-KS.md | 39.627 | 394 l. | | bbd02726f62d | = raíz plan |
| …/PLAN-Y-PROMPT-CLAUDE-KS/evidencia-repositorio.json | 4.276 | json | | 2dc923ad5bb0 | |
| …/PLAN-Y-PROMPT-CLAUDE-KS/inventario-fuentes-revisadas.json | 10.135 | json | | fdf49923e1d4 | |
| …/PLAN-Y-PROMPT-CLAUDE-KS/metricas-reconciliadas-gsc.json | 86.413 | json | | bbd06aa940ab | |

## Cómo se usó cada fuente

| Fuente | Uso en la implementación |
|---|---|
| GSC rendimiento (gráfico, países, dispositivos, páginas, consultas, filtros) | `BASELINE_GSC.json`. Las URLs con clics quedan protegidas en tests. Los paths con impresiones entran en el puntaje de la URL primaria al consolidar. |
| GSC indexación (gráfico, metadatos, problemas) | `BASELINE_GSC.json` y `DIAGNOSTICO_GSC_POR_COHORTE.md` |
| `duplicate-catalog-identities.csv` | Contraste independiente de los 95 grupos (`manifiestos/T03-candidatos-identidad.json`) |
| `duplicate-product-titles.csv` | Detector de títulos duplicados en `scripts/seo-audit.mjs`: los 16 grupos iniciales bajan a 4 |
| `page-audit.csv`, `url-inventory.txt` | Contraste con el sitemap baseline (2.264 URLs coinciden con `baseline/sitemap-urls.txt`) |
| `architecture-link-edges.csv` | Conteo completo de filas (239.098). La profundidad de clics citada (8/396/1.215/565) es de la auditoría Codex y no se recalculó; la mejora de enlazado se implementó con relacionados variados (T10). |
| `benchmark-*` | Referencia de taxonomía y fichas del proveedor. No se copian stock, precios ni MOQ como compromisos de KS. |
| Auditoría Claude / Codex | Evidencia a reconciliar, no instrucciones: ver `RECONCILIACION_EVIDENCIA.md` |
