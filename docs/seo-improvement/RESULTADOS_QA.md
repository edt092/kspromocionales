# Resultados de QA — local (2026-10-09)

"Pasa en local" **no** equivale a "validado en Netlify" ni a "Google reindexó". Los logs están en `baseline/` y `after/`.

## Comandos y resultados

| Comando | Antes | Después |
|---|---|---|
| `pnpm build` | Exit 0 · `astro check` 0/0/0 · 2.267 páginas | Exit 0 · guard de datos ✓ · `astro check` 0 errores / 0 warnings / 0 hints · 2.179 páginas |
| `pnpm run seo:audit` | Exit 0 (sin chequeos de corrupción ni de identidad) | Exit 0 · `--strict` sin errores · texto corrupto 0 · aliases OK · `productCount` OK |
| `pnpm run seo:audit:urls` | Exit 0 · 18 controles en 0 | Exit 0 · **26 controles en 0** (8 nuevos: redirects, enlaces a alias, JSON-LD parseable, `@id` sin declarar, raíz del breadcrumb) |
| `pnpm run test:seo` | — | **25/25** (10 de reparación de texto, 15 de política, identidad y aliases) |
| Prueba negativa de `seo:audit:urls` | — | Con un `@id` roto y un enlace a un alias inyectados en `dist/`, detecta `jsonLdDanglingId: 2` e `internalLinkToAlias: 1`. Restaurado: 0. |
| `python scripts/seo-improvement/mobile-qa.py` | — | Ver tabla de móvil abajo; capturas en `after/qa-movil/` |

## Métricas del catálogo

| Métrica | Antes | Después |
|---|---:|---:|
| Productos | 2.185 | 2.097 |
| Identidades de proveedor duplicadas | 95 grupos | 6 (variantes por confirmar) |
| "Bogotá, Bogotá" / listas rotas / `[más]` / "Medellíndad" | 417 / 348 / 108 / 17 | 0 / 0 / 0 / 0 |
| seoTitle duplicados | 16 grupos | 4 (posibles duplicados pendientes de SKU: N7, N8) |
| Fichas noindex | 1 | 3 |
| Fichas "enriquecer" (informativo) | — | 444 |
| Imágenes servidas desde el host con redirección | Todas las externas | 0 (`cataprom.com` directo) |
| Imágenes eager en la home | 32 | 16 |

## Móvil (Playwright, preview local)

Ficha `/productos/paraguas-kahlo-23-nuevo-13532/`:

| Viewport | Medida | Antes (auditoría de agentes) | Después |
|---|---|---|---|
| 390×844 | Posición del H1 | y≈763 | y=525 |
| 390×844 | CTA "Cotizar por WhatsApp" | y≈1003, bajo el pliegue | y=665, visible |
| 390×844 | Botón flotante sobre el H1 o el CTA | Sí | No: se oculta mientras el CTA está visible |
| 360×740 | CTA | — | Empieza en y=721; parcialmente visible (alto 48 px) |

- **Overflow horizontal:** ninguno en las 12 combinaciones medidas (home, categoría, 2 fichas, blog y contacto × 2 viewports).
- **Pendiente de diseño:**
  - Entre 24 y 37 enlaces por página miden menos de 44 px (breadcrumb, footer, menú).
  - En la categoría hay 28 textos de 11–12 px (badges).
  - No se cambió el sistema de diseño global, porque el plan excluye un rediseño completo.

## Lo que NO se pudo verificar en local
- Redirects reales de Netlify (`_redirects`, dominio apex/www, normalización de barra final): `astro preview` no los aplica.
- LCP, INP y CLS con datos de campo: no hay CrUX, PageSpeed sin cuota (ver PENDIENTES G4).
- La canonical elegida por Google y la indexación posterior.
