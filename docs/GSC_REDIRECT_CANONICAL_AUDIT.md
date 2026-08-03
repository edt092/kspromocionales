# GSC_REDIRECT_CANONICAL_AUDIT.md — kspromocionales.co

Auditoría de canonicalización, redirects y señales enfrentadas entre host `www` /
sin `www`. Generada según `SEO-a.md`. Repositorio: `KSPROMOCIONALES.CO` (Astro 4 /
Netlify).

---

## 1. Datos de Search Console (23 jul 2026)

Origen: `C:\Users\Dagon\Desktop\PROBLEMAS-SEO\KSP-CO\27-07-2026\` (`Gráfico.csv`,
`Metadatos.csv`, `Problemas críticos.csv`, `Problemas no críticos.csv`).

| Métrica | Valor |
|---|---|
| Páginas indexadas | 1.448 |
| Páginas sin indexar | 13 |
| — Página con redirección | 10 |
| — Página alternativa con etiqueta canónica adecuada | 2 |
| — Rastreada: actualmente sin indexar | 1 |
| Validación | No iniciada (en las 3 categorías) |

**Limitación confirmada:** los CSV exportados solo contienen totales agregados por
motivo, **no** la lista de URLs individuales afectadas. No se han inventado las 13
URLs — ver sección 7 (pendiente).

No se usa el conteo de 1.448 páginas indexadas por GSC como conteo esperado del
sitemap actual: corresponde al 23 de julio, una fecha anterior a la migración de
host y a la paginación de categorías grandes (Fase 8 de `SEO_AUDIT_1.md`, 2026-07-24).

| Fuente | Conteo | Fecha |
|---|---|---|
| URLs conocidas por GSC | 1.448 indexadas + 13 no indexadas = 1.461 | 23 jul 2026 |
| URLs del sitemap actual (`dist/sitemap-0.xml`) | 2.264 | 3 ago 2026 (post-cambio) |
| URLs indexables actuales (heurística `seo:audit`) | 2.184 productos indexables + categorías/páginas institucionales | 3 ago 2026 |
| URLs noindex actuales | 1 producto (`descripcion_generica` + sin contenido suplementario) + `/gracias/` (página estática) | 3 ago 2026 |

---

## 2. Causa técnica confirmada (3 ago 2026, antes del cambio)

Señales de canonicalización enfrentadas entre sí:

- **Redirect + respuesta pública** favorecían `www.kspromocionales.co` (dominio
  principal de Netlify; `kspromocionales.co/*` → 301 → `www.kspromocionales.co/*`).
- **Canonical, sitemap, `robots.txt`, `llms.txt` y `astro.config.mjs`** favorecían
  `kspromocionales.co` (sin `www`).

Google usa redirects + canonicals + sitemap como señales de canonicalización; al
estar enfrentadas, Google decide por su cuenta qué versión indexar, lo que explica
los estados "Página con redirección" y "Página alternativa con etiqueta canónica
adecuada" en GSC.

## 3. Host canónico elegido

```
https://www.kspromocionales.co
```

Decisión basada en el dominio principal ya configurado en Netlify (no se cambió
nada en Netlify Domain Management; ver Fase 5). Este documento **no** recomienda ni
ejecuta un cambio al dominio principal de Netlify — si el propietario prefiere
`kspromocionales.co` sin `www`, debe confirmarlo explícitamente y cambiar primero
el dominio principal en Netlify antes de invertir esta decisión.

## 4. Matriz de variantes (objetivo)

| Variante | Estado esperado | Salto máx. |
|---|---|---|
| `https://www.kspromocionales.co/ruta/` | 200 (canónica) | 0 |
| `https://kspromocionales.co/ruta/` | 301 → `https://www.kspromocionales.co/ruta/` | 1 |
| `http://www.kspromocionales.co/ruta/` | 301 → HTTPS + `www` | 1 |
| `http://kspromocionales.co/ruta/` | 301 → HTTPS + `www` | 1 (a veces 2 si Netlify resuelve protocolo y host por separado) |
| `/ruta` (sin slash) | 301 → `/ruta/` (Pretty URLs) | 1 |

## 5. Pruebas HTTP

### 5.1 Verificación previa al cambio (3 ago 2026, registrada en `SEO-a.md`)

| URL | Resultado |
|---|---|
| `https://www.kspromocionales.co/` | 200 |
| `https://kspromocionales.co/*` | 301 → `https://www.kspromocionales.co/*` |
| Netlify | trata `www` como dominio principal |
| `http://kspromocionales.co/` | **500** (anómalo, ver sección 6) |
| `http://www.kspromocionales.co/` | redirige a HTTPS |
| `/categorias` | 301 → `/categorias/` (único salto) |
| `/categorias/escritura/` | 404 |
| `/categorias/boligrafos-publicitarios/` | 200 |

### 5.2 Validación local post-cambio (3 ago 2026, este documento)

Realizada sobre `dist/` compilado con `pnpm build` tras los cambios de la sección
8. **No sustituye** la validación pública obligatoria de la Fase 12 (pendiente de
despliegue) — ver sección 7.

- `pnpm run seo:audit:urls` → 0 hallazgos estructurales sobre 2.267 páginas HTML y
  2.264 URLs de sitemap (ver detalle de comprobaciones en la sección 8.3).
- 0 ocurrencias de `https://kspromocionales.co` o `http://kspromocionales.co` en
  todo `dist/`.
- Canonical, `og:url`, JSON-LD (`Organization`, `WebSite`, `BreadcrumbList`,
  `CollectionPage`, `Service`, `BlogPosting`) y sitemap usan exclusivamente
  `https://www.kspromocionales.co`.

## 6. `http://kspromocionales.co/` → 500 (pendiente de re-verificación pública)

Este documento no lo da por resuelto: es un hallazgo de infraestructura de Netlify,
no de código. Tras el despliegue (Fase 12), si persiste:

1. Documentar la respuesta completa (headers, body).
2. Revisar configuración DNS de `kspromocionales.co` (apex) y `www.kspromocionales.co`.
3. Confirmar que apex y `www` están asignados al mismo sitio de Netlify.
4. Revisar el certificado TLS del apex.
5. Revisar "Force HTTPS" en Netlify → Domain management.
6. Añadir una regla de dominio específica en `netlify.toml` **solo** si resulta
   necesaria y no crea bucles (diferenciando host y protocolo).
7. Reprobar root y una ruta profunda.

## 7. Mapa de redirects históricos — categorías

`data/categories.json` conserva en el campo `id` 10 valores que parecen slugs
"antiguos" de categoría (más cortos que el `slug` actual, usado en la URL):

| `id` histórico | `slug` actual (URL real) |
|---|---|
| escritura | boligrafos-publicitarios |
| confeccion | camisetas-y-confeccion-corporativa |
| gorras | gorras-personalizadas |
| llaveros | llaveros-personalizados |
| maletines | mochilas-y-maletines-personalizados |
| memorias-usb | memorias-usb-personalizadas |
| mugs | mugs-y-termos-personalizados |
| oficina | articulos-de-oficina-personalizados |
| tecnologia | tecnologia-promocional |
| tomatodos-botilitos | tomatodos-y-botilitos-personalizados |

**Conclusión (confirmada, no se implementaron redirects):** `git log --all` muestra
un único commit inicial (`efeaa56`, "Initial build: KS Promocionales Colombia") —
no existe un commit anterior con una estructura de rutas distinta. Desde ese primer
commit, `src/pages/categorias/[slug]/index.astro` genera sus rutas con
`getStaticPaths()` usando **siempre** `category.slug`, nunca `category.id`. Por lo
tanto `/categorias/{id-histórico}/` (p. ej. `/categorias/escritura/`) **nunca fue
una ruta real de este sitio** — el campo `id` es únicamente un identificador interno
usado para relacionar `categoryId` de `data/products.json` con su categoría.

Esto es consistente con la prueba pública ya registrada: `/categorias/escritura/`
devuelve 404 (sección 5.1), y con la ausencia total de esos 10 valores en enlaces
internos de `src/pages` y `src/components` (confirmado por grep) — la única
aparición real encontrada fue un bug no relacionado con el host (`href="/categorias/oficina"`
en `data/blog/content/seed.js`, un enlace roto por typo de contenido, corregido en
la sección 8.4 junto con 23 enlaces de blog sin trailing slash).

**Regla aplicada:** por el punto 385-389 de `SEO-a.md` ("si nunca fue publicada o no
tiene equivalente: conserva 404 real" / "no redirijas todas las categorías antiguas
hacia `/categorias/`"), **no se añade ningún redirect** para estas 10 rutas. Se
mantiene 404 real.

**Pendiente si el propietario tiene evidencia externa:** si existe un dominio o
sitio anterior a este repositorio (fuera de Git, p. ej. un CMS previo) donde estas
URLs sí estuvieron publicadas, favor de indicarlo — la conclusión de esta sección se
basa únicamente en el historial de Git de este repositorio.

## 8. Cambios de código realizados

### 8.1 Unificación de host (Fase 2)
- `src/lib/site.ts`: `domain`/`url` → `www.kspromocionales.co` / `https://www.kspromocionales.co`.
- `astro.config.mjs`: `site` → `https://www.kspromocionales.co`.
- `public/robots.txt`: directiva `Sitemap:` → `www`.
- `public/llms.txt`: 6 URLs → `www`.

No se tocó ningún hardcode adicional: el resto del sitio (canonical, `og:url`,
JSON-LD, breadcrumbs) genera sus URLs absolutas a partir de `SITE.url`, confirmado
por grep sobre `src/`.

### 8.2 `netlify.toml`
Sin cambios. Ya no tenía reglas de redirect `www ↔ sin-www` (solo el catch-all a
`/404.html`); Netlify resuelve el alias→principal automáticamente. No se añadió
ninguna regla nueva, por la regla obligatoria del brief de no crear reglas
enfrentadas con el dominio principal configurado.

### 8.3 Auditor automatizado (Fase 10)
Nuevo script `scripts/seo-audit-urls.mjs` (`pnpm run seo:audit:urls`), de solo
lectura sobre `dist/` ya compilado. Verifica: un canonical por página, HTTPS,
`www`, trailing slash, autorreferencia, ausencia de query string; coherencia
sitemap↔canonical↔noindex; ausencia de hosts mezclados en enlaces internos;
ausencia de los 10 slugs históricos de la sección 7 en enlaces; ausencia de enlaces
internos sin trailing slash. Sale con exit code 1 y ejemplos accionables ante
cualquier hallazgo.

### 8.4 Corrección de enlaces internos de blog (hallazgo del auditor)
La primera corrida del auditor (antes de esta corrección) reportó 24 enlaces en
`data/blog/content/seed.js` que apuntaban a `/categorias/{slug}` sin trailing
slash — 23 a slugs vigentes (un salto de redirect evitable) y **1 realmente roto**:
`href="/categorias/oficina"`, que usaba el `id` histórico en vez del `slug` actual
(`articulos-de-oficina-personalizados`) y habría devuelto 404. Los 24 se corrigieron
para apuntar directamente al destino final. Confirmado: `pnpm run seo:audit:urls`
pasa de 24 hallazgos en `internalLinkNoTrailingSlash` a 0.

## 9. Validaciones posteriores al despliegue (Fase 12 — pendiente)

No se declara resuelto el problema basándose solo en `dist/` o localhost. Tras el
despliegue a Netlify, repetir contra el sitio público:

- Las 4 variantes de host/protocolo de la sección 4, para `/` y para una ruta
  profunda (categoría y producto).
- Las 4 variantes de `/categorias/`.
- Una URL sin trailing slash.
- Una categoría histórica (`/categorias/escritura/` → debe seguir en 404 real).
- `sitemap-index.xml`, `sitemap-0.xml`, `robots.txt` servidos en producción.

Para cada una: status inicial, `Location`, número de saltos, destino final, status
final, canonical final. Condiciones de aceptación: canonical final siempre
`https://www...`, status final 200 en páginas válidas, máximo un salto por
variante de host/protocolo, cero loops, cero 5xx, cero canonicals hacia redirects.

## 10. Pasos manuales en Search Console (Fase 13 — pendiente, tras el punto 9)

1. Verificar que la propiedad de dominio (`kspromocionales.co`, sin protocolo) ya
   existe en Search Console; si no, añadirla.
2. Enviar `https://www.kspromocionales.co/sitemap-index.xml`.
3. Retirar el sitemap antiguo del informe **solo** después de que el nuevo haya
   sido procesado por Google.
4. Inspeccionar: home con `www`, la categoría principal, un producto prioritario, y
   cada URL exacta que GSC reporte (una vez exportados los ejemplos — ver sección
   1, limitación de los CSV).
5. Iniciar "Validar corrección" únicamente para URLs realmente problemáticas (no
   para redirects 301 correctos ni para la alternativa con canonical adecuada).
6. Solicitar indexación únicamente del destino canónico 200, nunca de variantes
   redirigidas o alternativas.

**Solicitar al propietario:** exportar desde cada motivo de GSC (Página con
redirección / Página alternativa con etiqueta canónica adecuada / Rastreada:
actualmente sin indexar) el detalle por URL: URL, última fecha de rastreo,
canonical declarado, canonical elegido por Google, sitemap de referencia. Sin esos
ejemplos no es posible confirmar si las 13 URLs no indexadas corresponden a
comportamiento esperado (redirects/alternativas correctas) o a un problema real.
