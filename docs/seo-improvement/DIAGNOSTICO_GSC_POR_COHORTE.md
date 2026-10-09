# Diagnóstico GSC por cohorte y protocolo de inspección

**Estado de la evidencia:**
- GSC solo entregó totales por motivo.
- **No hay exportación URL por URL** de ningún motivo, ni canonical elegida por Google, ni fecha del último rastreo.
- Por tanto no se asigna ninguna URL concreta a "Descubierta" ni a "Google eligió otra canonical": este documento define cohortes y cómo verificarlas.
- **No se equiparan** los 402 casos de "canonical distinta" con los 190 URLs de identidades duplicadas.

## Totales de partida (al 03/10/2026, ámbito "Todas las páginas conocidas")

| Motivo | Páginas | Interpretación prudente |
|---|---:|---|
| Descubierta: actualmente sin indexar | 1.262 | Google conoce la URL pero no la rastreó. Puede ser prioridad de rastreo, identidad duplicada, poca utilidad percibida o simple volumen. |
| Google eligió otra canonical | 402 | Google consolidó la URL en otra. Candidatos: aliases de host (apex/www históricos) e identidades duplicadas. |
| Página con redirección | 112 | Esperable mientras Google vea URLs del host sin www o con barras distintas. No se "arregla" convirtiendo esas URLs en 200. |
| Rastreada: actualmente sin indexar | 45 | Revisar utilidad y contenido. No es prueba de penalización. |
| Alternativa con canonical adecuada | 2 | Comportamiento esperado |
| Excluida por noindex | 1 | Coincide con el producto noindex intencional de entonces (`cargador-inalambrico-magnet-3-1-eco-10746`) |
| Error 5xx | 0 | Sin incidencia |

## Cohortes del sitio tras esta implementación

| Cohorte | URLs | Fuente reproducible | Qué esperar en GSC (no es una promesa) |
|---|---:|---|---|
| A. Aliases consolidados con 301 | 88 | `data/product-aliases.json` | Pasarán a "Página con redirección". Es correcto. Sus señales se consolidan en el primario. |
| B. Primarios que absorben un alias | 88 | `MAPA_IDENTIDADES_Y_ALIASES.json` | Si estaban en "canonical distinta" o "descubierta", deberían ganar opciones de indexarse al no competir con un duplicado |
| C. Variantes de capacidad sin confirmar (mismo ID de proveedor) | 12 (6 pares) | `remainingDuplicateSourceIds` en el mapa | Pueden seguir en "canonical distinta" hasta confirmar SKU y diferenciar |
| D. Noindex por falta de contenido visible | 3 | `pnpm run seo:audit` → `indexability:noindex_sin_contenido` | "Excluida por noindex" (1 → 3) |
| E. Fichas "enriquecer" (indexables con relleno) | 444 | `indexability:enriquecer` | Candidatas principales de "Rastreada/Descubierta sin indexar". Prioridad editorial. |
| F. Landings con referencia de proveedor y placeholder | 89 | `imageLocalMissing` en el auditor | Imagen placeholder y posibles duplicados del catálogo: requieren mapeo referencia→ID |
| G. Paths con impresiones en GSC (todos los hosts) | 167 | `BASELINE_GSC.json → normalizedByPath` | Protegidos. Ninguno con clics fue redirigido ni marcado noindex (test `policy.test.mjs`). Los 6 aliases con 1 impresión redirigen a su equivalente exacto. |
| H. Resto de fichas indexables | ≈1.650 | `indexability:indexable` | Línea base para comparar |

## Protocolo de inspección (requiere acceso a GSC del propietario)

1. En GSC, **Indexación → Páginas**: abrir cada motivo y **exportar** la tabla de ejemplos. Hacerlo para "Descubierta", "Google eligió otra canonical", "Rastreada sin indexar" y "Página con redirección".
2. Guardar los CSV en `ANALISI-<fecha>/gsc-por-url/<motivo>.csv` y cruzarlos con las cohortes A–H por path, ignorando host y protocolo. Columnas que se registran:
   - URL
   - Motivo
   - Cohorte
   - En sitemap actual (sí/no)
   - Estado HTTP actual
   - Canonical declarada
   - Canonical elegida por Google (de la inspección)
   - Último rastreo
   - Decisión
3. **Inspección de URL** sobre una muestra de 20 URLs por motivo, repartida entre cohortes. Anotar la canonical elegida y el último rastreo. No pedir indexación en masa.
4. Solicitar indexación solo para destinos canónicos relevantes y modificados: los 4 productos corregidos en T02, los 3 hubs y los primarios de la cohorte B con impresiones.
5. Comparar ventanas de 28 días contra 28 días con cantidades absolutas antes que porcentajes. Con 8 clics en 86 días no hay significancia estadística.

## Lo que este diagnóstico NO afirma

- Que los 1.262 "descubiertos" sean duplicados o contenido pobre.
- Que la bajada de 1.847 a 1.792 indexadas (04/09 → 21/09) tenga una causa concreta.
- Que la consolidación vaya a producir un número determinado de nuevas páginas indexadas.
