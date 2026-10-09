# Checklist de publicación y rollback

No se hizo commit, push ni deploy. Todo está en la rama local `seo/implementacion-plan-maestro-2026-10`.

## Antes de publicar (propietario)

1. Revisar el diff: `git diff --stat` y `git status`.
   - Dejar fuera de los commits los archivos no rastreados del usuario: `.codex/`, `SEO-a.md`, `SEO_AUDIT_1.md`, `seo-1.md` y `auditoria_uxui_kspromocionales.md`, que apareció durante la sesión.
2. Revisar muestras de decisiones de datos:
   - `MAPA_IDENTIDADES_Y_ALIASES.json`, sobre todo las 24 fusiones de nivel B (`tier: "B"`).
   - `data/catalog-corrections.json`.
3. Ejecutar en limpio:
   ```powershell
   pnpm install --frozen-lockfile
   pnpm run test:seo
   pnpm build
   pnpm run seo:audit:urls
   ```
   Todo debe salir con exit 0 y "Sin hallazgos estructurales".
4. Confirmar que existe `dist/_redirects` con 89 líneas de regla.
5. Commit (cuando el propietario lo autorice). Mensaje sugerido: `SEO: reparación de catálogo, consolidación de identidades con 301 y entidad honesta`.

## Publicación (Netlify)

1. Push de la rama, deploy preview de Netlify y validar en la URL del preview:
   - `curl -sI <preview>/productos/boligrafo-aldrich-solidomas-10663/` → `301` con `Location: /productos/boligrafo-aldrich-solido-10663/`.
   - Lo mismo sin barra final.
   - `curl -sI <preview>/productos/boligrafo-aldrich-solido-10663/` → `200`.
   - `curl -sI <preview>/favicon.ico` → `301` a `/favicon-src.png`.
   - `curl -s <preview>/sitemap-0.xml | grep -c "<loc>"` → `2174`.
   - Las 6 URLs protegidas responden 200 (`MATRIZ_URLS.md`).
   - Prueba de resultados enriquecidos sobre la home, una ficha, /nosotros/, una ciudad y un post: sin errores. Product no aparece, a propósito.
2. Merge a `main` y deploy de producción.
3. Repetir el paso 1 contra `https://www.kspromocionales.co`.
4. **Netlify → Domain management:** configurar `www.kspromocionales.co` como dominio principal para que `http://kspromocionales.co/` llegue a www en un solo salto (pendiente externo).

## Después de publicar (GSC)

1. Reenviar `https://www.kspromocionales.co/sitemap-index.xml`.
2. Inspección de URL y solicitud de indexación solo para estas URLs, sin envíos masivos:
   - los 4 productos corregidos en T02;
   - `/regalos-corporativos/`, `/articulos-promocionales/`, `/merchandising-corporativo/`;
   - los 3 posts con metaTitle corregido.
3. Exportar ejemplos por motivo (protocolo en `DIAGNOSTICO_GSC_POR_COHORTE.md`) a los 14 y a los 28 días.
4. Comparar 28 días contra 28 días con cantidades absolutas. Esperado y correcto: crecen "Página con redirección" (88 aliases) y "Excluida por noindex" (3).

## Rollback

| Alcance | Cómo |
|---|---|
| Todo | Redeploy en Netlify del deploy anterior (Deploys → "Publish deploy"), o `git revert` del commit. Los datos previos están en Git. |
| Solo los redirects | Vaciar `data/product-aliases.json` (`[]`) y restaurar los registros eliminados desde `git show HEAD~1:data/products.json`. `baseline/products-before.json` lista id/slug/categoría de los 2.185 originales. |
| Una fusión concreta | Quitar su entrada de `data/product-aliases.json`, recuperar el registro del alias desde Git, volver a añadirlo a `data/products.json` y recompilar. El auditor avisará si el slug sigue siendo alias. |
| Correcciones factuales | Quitar la entrada en `data/catalog-corrections.json` y restaurar los campos desde Git (el aplicador no deshace). |
| Imágenes vía `cataprom.com` | En `src/lib/product-image.ts`, hacer que `resolveSupplierImageUrl` devuelva `src` sin cambios |
| Guard del build | Si un import legítimo del ETL dispara un falso positivo, ajustar el detector en `scripts/seo-improvement/lib/text-repair.mjs` con un test. No quitar el guard. |
