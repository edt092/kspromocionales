# Matriz de URLs: antes y después (build local 2026-10-09)

Listas completas en `baseline/` y `after/` (`sitemap-urls.txt`, `generated-routes.txt`).

| Conjunto | Antes | Después | Diferencia explicada |
|---|---:|---:|---|
| Registros en `data/products.json` | 2.185 | 2.097 | −88 identidades duplicadas consolidadas (`data/product-aliases.json`) |
| Páginas HTML generadas | 2.267 | 2.179 | −88 aliases: ya no se generan, responden 301 |
| Rutas `index.html` | 2.266 | 2.178 | Igual que arriba |
| URLs en el sitemap | 2.264 | 2.174 | −88 aliases −2 nuevas fichas noindex; 0 URLs nuevas |
| Fichas con `noindex, follow` | 1 | 3 | `mug-toffee-300ml-10430` y `set-de-herramientas-big-tire-10963` no muestran ningún contenido propio en el cuerpo. Sin datos en GSC. |
| Redirects 301 (`dist/_redirects`) | 0 | 89 | 88 aliases + `/favicon.ico` → `/favicon-src.png` |
| Categorías / paginaciones | 37 / 18 | 37 / 18 | Sin cambios de ruta. Los conteos se recalcularon con las asociaciones secundarias. |
| Productos con categorías secundarias | 0 | 52 | Mantienen su presencia en Novedades/Precio Bomba (y Ecología solo con material en el nombre) |
| `<lastmod>` en el sitemap | 0 | 8 | Solo posts con fecha editorial real |

## URLs que salen del sitemap (90)

- **88 aliases → 301 al primario.** Detalle en `MAPA_REDIRECTS.json`.
  - Nivel A: 64. Nivel B: 24.
  - Categoría del alias eliminado: novedades 15, ecologia 12, automovil 10, variedades 9, tecnologia 6, produccion-nacional 6, paraguas 5, escritura 4, y 1–3 en el resto.
- **2 noindex:** `/productos/mug-toffee-300ml-10430/` y `/productos/set-de-herramientas-big-tire-10963/`. Siguen respondiendo 200 con `noindex, follow` y vuelven al índice en cuanto tengan contenido propio.

## URLs protegidas (clics en GSC)

| Path | Estado después |
|---|---|
| `/` | 200, sin cambios de ruta |
| `/categorias/antiestres/` | 200, en el sitemap |
| `/categorias/econature/` | 200, en el sitemap |
| `/productos/cojin-terapeutico-produccion-nacional-2394/` | 200, indexable, en el sitemap (test) |
| `/productos/llavero-silicone-silicona-2226/` | 200, indexable, en el sitemap (test) |
| `/productos/bolsa-en-algodon-vera-140gr-13614/` | 200, indexable, en el sitemap (test) |

Los 9 grupos de duplicados con impresiones en GSC (10661, 9364, 8231, 1442, 7557, 9132, 13320, 13213, 13298):
- Todos se consolidaron sin perder destino.
- 6 aliases tenían 1 impresión y 0 clics; ahora redirigen a su equivalente exacto.
- En los otros 3 grupos, la URL con la impresión quedó como primaria.

## Matriz de host, protocolo y barra final (a verificar en producción)

`astro preview` no aplica las reglas de Netlify (`_redirects`, dominio principal), así que esta matriz solo puede certificarse en el sitio publicado. Valores esperados:

| Petición | Esperado |
|---|---|
| `http://kspromocionales.co/` | 301 → `https://www.kspromocionales.co/`. Hoy son 2 saltos; pasará a 1 si se configura www como dominio principal en Netlify (pendiente externo). |
| `https://kspromocionales.co/categorias/antiestres/` | 301 → `https://www.kspromocionales.co/categorias/antiestres/` |
| `https://www.kspromocionales.co/categorias/antiestres` | 301 → con barra final |
| `https://www.kspromocionales.co/productos/boligrafo-aldrich-solidomas-10663/` | 301 → `/productos/boligrafo-aldrich-solido-10663/` |
| `https://www.kspromocionales.co/productos/boligrafo-aldrich-solidomas-10663` | 301 → mismo destino (Netlify normaliza la barra final en sus reglas) |
| `https://www.kspromocionales.co/categorias/antiestres/pagina/999/` | 404 real |
| `https://www.kspromocionales.co/favicon.ico` | 301 → `/favicon-src.png` |
