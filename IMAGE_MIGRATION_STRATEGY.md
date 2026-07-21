# IMAGE_MIGRATION_STRATEGY.md — Migración de imágenes de producto a infraestructura propia

Documento de estrategia (Fase 9, `SEO_AUDIT_1.md`). **No se ha migrado ninguna imagen.** No se
descargó el catálogo completo ni se alteraron derechos de uso — solo se verificaron 2 imágenes de
muestra (cabeceras HTTP + una descarga puntual) para fundamentar este documento con datos reales.

## 1. Inventario de dominios externos

| Dominio referenciado en `data/products.json` | Imágenes | % del catálogo |
|---|---|---|
| `catalogospromocionales.com` | 2.092 | 95,7% |
| `www.catalogospromocionales.com` | 4 | 0,2% |
| **Total dependiente de dominio externo** | **2.096 / 2.185** | **95,9%** |

Además, las 37 categorías (`data/categories.json`) usan imágenes en el mismo dominio (`cat.image`,
p. ej. `https://catalogospromocionales.com/images/novedadesBK.jpg`).

`netlify.toml` ya declara ambos dominios en la CSP (`img-src ... catalogospromocionales.com
cataprom.com`), lo que sugiere que ya se sabía de la existencia de `cataprom.com` como dominio
relacionado.

## 2. Riesgo de disponibilidad y licencia — hallazgo confirmado

Se hizo `curl -I` (solo cabeceras, sin descarga) sobre 2 URLs de muestra:

```
HTTP/1.1 308 Permanent Redirect
Location: https://cataprom.com/images/productos/13536.jpg
```

**`catalogospromocionales.com` ya no sirve las imágenes directamente: redirige (308, permanente) a
`cataprom.com`.** Esto confirma el riesgo señalado en `SEO_AUDIT.md` (P1-3) con evidencia real, no
hipotética:

- El proveedor **ya migró de dominio una vez** sin que el sitio lo supiera hasta ahora.
- Cada una de las 2.096 imágenes cuesta **una petición HTTP adicional** (redirect) antes de
  empezar a descargar el archivo real — impacto directo en LCP de las páginas de producto/categoría.
- Siguiendo el redirect, la respuesta final trae `Cache-Control: private` — es decir, **CDNs y
  cachés compartidas no pueden cachear la imagen**, solo el navegador del visitante. Sin
  `max-age`/`Expires` explícito, no hay garantía de reutilización eficiente entre visitas.
- La cabecera `X-Powered-By: Panda Consulting S.A.` confirma que el servidor pertenece a un
  tercero (stack IIS/ASP.NET, ajeno a la infraestructura de KS Promocionales), no a un CDN propio.
- `Content-Type: image/jpg` (no estándar; debería ser `image/jpeg`) — inofensivo en la práctica
  pero es otra señal de que no hay control sobre cómo se sirven estos archivos.

**Riesgo de licencia — sin resolver, requiere al propietario del negocio:** no hay en el
repositorio ningún contrato, factura o autorización documentada que confirme que KS Promocionales
tiene derecho a alojar copias propias de estas imágenes. `scripts/seed-from-ecuador.mjs` sugiere
que el catálogo se sembró desde un sitio hermano/proveedor del mismo grupo comercial (Ecuador), lo
que hace plausible que exista una relación comercial que sí lo permita — pero **esto no se puede
asumir ni verificar desde el código**. Antes de descargar y re-alojar cualquier imagen en
`kspromocionales.co`, se requiere confirmación explícita del propietario sobre el estatus de
licencia con el proveedor de `cataprom.com`/`catalogospromocionales.com`.

## 3. Convención de nombres

Mantener trazabilidad con el origen para poder auditar/revertir:

```
public/images/products/{product-slug}.jpg
public/images/products/{product-slug}-2.jpg   (si el producto tiene más de una imagen)
public/images/categories/{category-slug}.jpg
```

Usar el `slug` ya existente en `data/products.json`/`categories.json` (estable, único, ya usado en
las URLs del sitio) en vez del nombre de archivo original del proveedor (p. ej. `13536.jpg`,
`va-977.jpg`), que no es descriptivo ni estable si el proveedor reorganiza su storage.

## 4. Storage recomendado

Dado que el sitio es 100% estático en Netlify (sin backend propio):

- **Opción A (recomendada para el volumen actual):** `public/images/products/` dentro del propio
  repo, servidas por Netlify como el resto de assets estáticos. Simple, sin costo adicional, sin
  nuevas integraciones. Contras: incrementa el tamaño del repo/build (~2.096 imágenes × ~40-80KB
  ≈ 100-170MB estimado a partir de la muestra de 42KB/1000×1000px — cifra orientativa, no medida
  sobre el total).
- **Opción B (si el volumen crece o el build se vuelve lento):** bucket de object storage (p. ej.
  Cloudflare R2, Backblaze B2, o Netlify Large Media) con URLs propias bajo un subdominio
  (`images.kspromocionales.co`). Mejor para escalar más allá de unos pocos miles de imágenes o si
  se añade optimización on-the-fly (redimensionado, WebP/AVIF automático).

Se recomienda empezar con la Opción A y solo migrar a B si el tiempo de build o el tamaño del repo
se vuelven un problema medible.

## 5. Proceso de migración por lotes (propuesto, no ejecutado)

1. **Aprobación de licencia** (bloqueante, ver sección 2) antes de descargar nada.
2. Script de migración (`scripts/migrate-product-images.mjs`, a crear) que:
   - Lee `data/products.json` y `data/categories.json`.
   - Descarga en lotes pequeños (p. ej. 20-50 imágenes por corrida, con pausa entre lotes) para no
     saturar el servidor del proveedor.
   - Guarda cada imagen con el nombre de la convención de la sección 3.
   - Registra un log de éxitos/fallos (imagen no encontrada, redirect roto, timeout).
   - **No modifica `data/products.json` en la misma corrida** — la migración de archivos y la
     actualización de URLs en los datos deben ser pasos separados y verificables independientemente.
3. Verificación manual de una muestra del lote (ver sección 6) antes de continuar con el siguiente.
4. Una vez completada y verificada la descarga completa, un segundo script actualiza
   `images`/`imagen_original_url` en `data/products.json` y `image` en `categories.json` para
   apuntar a las rutas locales — con el mismo patrón de dry-run + reporte antes/después ya usado en
   `scripts/clean-ecuador-residue.mjs`.
5. Build + `npm run seo:audit` (que ya detecta imágenes externas y rutas rotas) para confirmar que
   `externalImages` bajó a 0 y `brokenLocalImages` se mantiene en 0.

## 6. Verificación de dimensiones y peso

Muestra verificada (2 de 2.096, no representativa estadísticamente pero real):

| Producto | Formato | Dimensiones | Peso |
|---|---|---|---|
| `organizador-multiusos-link-nuevo-13536` | JPEG | 1000×1000px | 42.169 bytes (~41KB) |

El script de migración de la sección 5 debe, por cada imagen descargada:
- Registrar dimensiones reales (ancho×alto) y peso en bytes en el log.
- Marcar como "revisar manualmente" cualquier imagen con dimensiones muy por debajo de lo que
  necesita el sitio (el detalle de producto muestra hasta 600×600px) o con peso anómalo (>500KB
  para una foto de producto sugiere que no está comprimida).
- No asumir que todas las imágenes tienen las mismas dimensiones/peso que la muestra.

## 7. Estrategia WebP/AVIF

- La imagen de muestra (1000×1000, JPEG, 42KB) es más grande de lo necesario para los usos reales
  del sitio (400×400 en `ProductCard`, 600×600 en el detalle de producto) — hay margen real de
  ahorro sin perder calidad percibida.
- Al migrar, generar automáticamente una variante WebP (soporte universal en navegadores actuales)
  junto al original; usar `<picture>` con fallback JPEG solo si se detecta necesidad real de
  compatibilidad legacy (Netlify/Astro no requieren fallback hoy).
- Astro incluye `astro:image` (Sharp) para optimización en build; evaluarlo una vez las imágenes
  estén en `public/` o `src/assets/` en vez de URLs externas — hoy no es utilizable porque Sharp no
  puede optimizar en build imágenes que viven en un dominio de terceros sin descargarlas primero.
- No fabricar cifras de "% de ahorro" sin medir el resultado real tras la conversión.

## 8. Plan de redirects o reemplazo de URLs

- Las imágenes no tienen URLs propias indexadas por Google Images bajo `kspromocionales.co` hoy
  (viven en el dominio del proveedor), así que no se requieren redirects 301 de imágenes — es un
  cambio de referencia interna en `data/products.json`, no un cambio de URL pública ya posicionada.
- Mientras no se migre, **no se debe optimizar prematuramente** asumiendo que la migración ya
  ocurrió: el fallback implementado en `src/lib/product-image.ts` (P0-3) sigue siendo la red de
  seguridad para cualquier imagen rota, migrada o no.
- Una vez migrada una imagen, mantener temporalmente el CSP (`catalogospromocionales.com`,
  `cataprom.com`) hasta confirmar que el 100% de referencias en `data/products.json` apuntan a
  rutas locales, luego retirar esas excepciones de `netlify.toml`.

## Resumen ejecutivo

No se requiere acción de código en esta fase. El hallazgo accionable inmediato es la **confirmación
de licencia** con el propietario del negocio — sin eso, ningún paso posterior (descarga, storage,
optimización) puede ejecutarse de forma segura. El resto de este documento queda listo para
ejecutarse en cuanto esa aprobación exista.
